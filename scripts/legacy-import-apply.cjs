#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Pool } = require("pg");
require("dotenv").config();

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DUMP_PATH = "C:\\xampp\\htdocs\\chetos216-08-2024\\database\\database٥‏-٥‏-٢٠٢٦.sql";
const OUTPUT_DIR = path.join(ROOT, "reports", "legacy");
const COVERAGE_PATH = path.join(ROOT, "docs", "legacy-column-coverage.md");

const PHASE_TABLES = [
  "users",
  "powers",
  "rooms",
  "settings",
  "site",
  "owner",
  "site_master_wallet",
];

function parseArgs(argv) {
  const args = {
    apply: false,
    dump: process.env.LEGACY_DUMP_PATH || DEFAULT_DUMP_PATH,
    outDir: OUTPUT_DIR,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") {
      args.apply = true;
    } else if (arg === "--dump" && argv[index + 1]) {
      args.dump = argv[index + 1];
      index += 1;
    } else if (arg.startsWith("--dump=")) {
      args.dump = arg.slice("--dump=".length);
    } else if (arg === "--out" && argv[index + 1]) {
      args.outDir = path.resolve(argv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--out=")) {
      args.outDir = path.resolve(arg.slice("--out=".length));
    }
  }

  return args;
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractCreateTables(sql) {
  const tables = new Map();
  const tableRegex = /CREATE TABLE\s+`([^`]+)`\s+\(([\s\S]*?)\n\)\s+ENGINE=/g;
  let match;

  while ((match = tableRegex.exec(sql)) !== null) {
    const [, tableName, body] = match;
    const columns = [];
    for (const line of body.split(/\r?\n/)) {
      const columnMatch = line.match(/^\s*`([^`]+)`\s+(.+?)(?:,)?$/);
      if (!columnMatch) continue;
      columns.push(columnMatch[1]);
    }
    tables.set(tableName, columns);
  }

  return tables;
}

function splitSqlValues(tupleBody) {
  const values = [];
  let current = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < tupleBody.length; index += 1) {
    const char = tupleBody[index];
    const next = tupleBody[index + 1];

    if (inString) {
      current += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "'" && next === "'") {
        current += next;
        index += 1;
      } else if (char === "'") {
        inString = false;
      }
      continue;
    }

    if (char === "'") {
      inString = true;
      current += char;
      continue;
    }

    if (char === ",") {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values.map(parseSqlLiteral);
}

function parseSqlLiteral(rawValue) {
  if (/^null$/i.test(rawValue)) return null;
  if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
    return rawValue
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/''/g, "'");
  }
  if (/^-?\d+(?:\.\d+)?$/.test(rawValue)) return Number(rawValue);
  return rawValue;
}

function extractRows(sql, tableColumns) {
  const rowsByTable = new Map();
  const insertRegex = /INSERT INTO\s+`([^`]+)`\s+VALUES\s+/g;
  let match;

  while ((match = insertRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const columns = tableColumns.get(tableName);
    if (!columns) continue;

    let cursor = insertRegex.lastIndex;
    let inString = false;
    let depth = 0;
    let escaped = false;
    let tupleStart = -1;
    const rows = rowsByTable.get(tableName) || [];

    while (cursor < sql.length) {
      const char = sql[cursor];
      const next = sql[cursor + 1];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === "'" && next === "'") {
          cursor += 1;
        } else if (char === "'") {
          inString = false;
        }
      } else if (char === "'") {
        inString = true;
      } else if (char === "(") {
        if (depth === 0) tupleStart = cursor + 1;
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
        if (depth === 0 && tupleStart >= 0) {
          const values = splitSqlValues(sql.slice(tupleStart, cursor));
          const row = {};
          columns.forEach((column, index) => {
            row[column] = values[index] ?? null;
          });
          rows.push(row);
        }
      } else if (char === ";" && depth === 0) {
        break;
      }

      cursor += 1;
    }

    rowsByTable.set(tableName, rows);
    insertRegex.lastIndex = cursor + 1;
  }

  return rowsByTable;
}

function parseCoverageMatrix(markdown) {
  const coverage = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.startsWith("| `")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/<br\s*\/?>/gi, " "));
    if (cells.length < 4) continue;

    const tableMatch = cells[0].match(/`([^`]+)`/);
    if (!tableMatch) continue;

    coverage.set(tableMatch[1], {
      legacyTable: tableMatch[1],
      columns: [...cells[1].matchAll(/`([^`]+)`/g)].map((item) => item[1]),
      targets: [...cells[2].matchAll(/`([^`]+)`/g)].map((item) => item[1]),
      strategy: cells[3].replace(/\s+/g, " ").trim(),
      rawTarget: cells[2],
    });
  }
  return coverage;
}

function extractDumpCompletedAt(sql) {
  const match = sql.match(/-- Dump completed on ([0-9-]+ [0-9:]+)/);
  return match ? match[1].replace(" ", "T") : null;
}

function parseJson(value, fallback, diagnostics, context) {
  if (typeof value !== "string" || value.trim() === "") return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    diagnostics.push({
      type: "json_error",
      context,
      message: error.message,
      valuePreview: value.slice(0, 160),
    });
    return fallback;
  }
}

function toBool(value) {
  return value === true || value === 1 || value === "1";
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toIsoFromMs(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return new Date(number).toISOString();
}

function toIsoFromDateTime(value) {
  if (!value) return null;
  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizePath(value, prefix) {
  if (!value) return "";
  const text = String(value);
  if (text.startsWith("/") || text.startsWith("http://") || text.startsWith("https://")) return text;
  return `${prefix}/${text}`;
}

function detectMojibake(value) {
  if (typeof value !== "string") return false;
  if (/[ï�]/.test(value)) return true;
  const pairCount = (value.match(/[طظ][^\s|,.;:()[\]{}'"`،؛؟]/g) || []).length;
  return pairCount >= 2;
}

function roleFromPower(powerName) {
  const name = String(powerName || "").toLowerCase();
  if (name.includes("chatmaster") || name.includes("ispower") || name.includes("hide")) return "admin";
  if (name.includes("admin")) return "admin";
  return "member";
}

function stableSlug(value, fallback) {
  const source = String(value || fallback || "room").trim();
  const ascii = source
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || String(fallback || "room");
}

function uniqueSlug(base, used) {
  let slug = base;
  let index = 2;
  while (used.has(slug)) {
    slug = `${base}-${index}`;
    index += 1;
  }
  used.add(slug);
  return slug;
}

function buildPlan(rowsByTable, coverage, source) {
  const diagnostics = [];
  const users = rowsByTable.get("users") || [];
  const powersRows = rowsByTable.get("powers") || [];
  const rooms = rowsByTable.get("rooms") || [];
  const settingsRows = rowsByTable.get("settings") || [];
  const siteRows = rowsByTable.get("site") || [];
  const ownerRows = rowsByTable.get("owner") || [];
  const siteWalletRows = rowsByTable.get("site_master_wallet") || [];

  const rolesByName = new Map();
  for (const powersRow of powersRows) {
    const powers = parseJson(powersRow.powers, [], diagnostics, "powers.powers");
    if (!Array.isArray(powers)) continue;
    for (const power of powers) {
      const name = String(power.name || "").trim();
      if (!name || rolesByName.has(name)) continue;
      rolesByName.set(name, {
        legacyName: name,
        name,
        rank: toNumber(power.rank),
        iconUrl: normalizePath(power.ico, "/sico"),
        isSystem: ["ispower", "Hide", "chatmaster", "admin"].includes(name),
        autoEnabled: toBool(power.auto_enabled),
        autoPromote: toBool(power.auto_promote),
        autoPoints: toNumber(power.auto_points),
        permissions: Object.entries(power)
          .filter(([key]) => !["rank", "name", "ico"].includes(key))
          .map(([key, value]) => ({ key, value })),
        legacyMetadata: { source: "powers", raw: power },
      });
    }
  }

  const userPlans = users.map((user) => {
    if (detectMojibake(user.topic) || detectMojibake(user.username) || detectMojibake(user.msg)) {
      diagnostics.push({
        type: "mojibake",
        context: `users.idreg:${user.idreg}`,
        valuePreview: `${user.topic || ""} ${user.username || ""} ${user.msg || ""}`.slice(0, 160),
      });
    }

    const legacyMetadata = {
      source: "users",
      legacy_id: user.idreg,
      uid: user.uid,
      lid: user.lid,
      socket_id: user.id,
      ip: user.ip,
      fp: user.fp,
      old_password_hash: user.password || "",
      old_token_present: Boolean(user.token),
      last_eval_login_day: user.last_eval_login_day || "",
      auto_power: user.auto_power || "",
      eval_awards_json: parseJson(user.eval_awards_json, null, diagnostics, `users.${user.idreg}.eval_awards_json`),
    };

    return {
      legacyId: toNumber(user.idreg),
      username: String(user.username || `legacy_${user.idreg}`).slice(0, 64),
      displayName: String(user.topic || user.username || `legacy_${user.idreg}`).slice(0, 120),
      passwordHash: null,
      role: roleFromPower(user.power),
      status: toBool(user.muted) ? "muted" : "active",
      avatarUrl: normalizePath(user.pic, "/pic"),
      coverUrl: normalizePath(user.cover || user.pich, user.cover ? "/cover" : "/pic2"),
      countryCode: "",
      locale: "ar",
      profile: {
        youtube: user.youtub || "",
        legacy_power: user.power || "",
        documentation: toNumber(user.documentationc),
      },
      requiresPasswordReset: true,
      legacyMetadata,
      createdAt: toIsoFromMs(user.joinuser) || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSeenAt: toIsoFromMs(user.lastssen),
      profileRow: {
        idreg: String(user.idreg || ""),
        lid: String(user.lid || ""),
        uid: String(user.uid || ""),
        profileMsg: String(user.msg || ""),
        avatarUrl: normalizePath(user.pic, "/pic") || "/pic.png",
        bannerUrl: normalizePath(user.pich, "/pic2") || "/pich.png",
        themeId: String(user.them || ""),
        avatarFrameUrl: normalizePath(user.cover, "/cover"),
        giftIconUrl: normalizePath(user.gift_ico, "/gifts_git"),
        profileIconUrl: normalizePath(user.ico, "/sico"),
        backgroundColor: String(user.bg || "#FFFFFF"),
        messageColor: String(user.mcol || "#000000"),
        nameColor: String(user.ucol || "#000000"),
        gradientColor: String(user.gcol || "#FFFFFF"),
        evaluation: toNumber(user.evaluation),
        rep: toNumber(user.rep),
        coins: toNumber(user.coins),
        wallPostLikes: toNumber(user.wall_post_likes),
        giftsReceivedCount: toNumber(user.gifts_received_count),
        power: String(user.power || ""),
        icon: normalizePath(user.ico, "/sico"),
        isLogin: "عضو",
        muted: toBool(user.muted),
        documents: toBool(user.documentationc),
        roomId: "general",
        siteBadgeId: String(user.site_badge_id || ""),
        siteBadge: String(user.site_badge || ""),
        joinuser: toNumber(user.joinuser, Date.now()),
        legacyMetadata: {
          source: "users",
          raw_colors: { bg: user.bg, mcol: user.mcol, ucol: user.ucol, gcol: user.gcol },
        },
      },
      wallet: {
        ownerType: "user",
        balanceCoins: toNumber(user.coins),
        reservedCoins: 0,
      },
      roleName: String(user.power || ""),
    };
  });

  const userByLegacyOwner = new Map();
  for (const user of userPlans) {
    userByLegacyOwner.set(`#${user.legacyId}`, user);
    userByLegacyOwner.set(String(user.legacyId), user);
    userByLegacyOwner.set(user.profileRow.uid, user);
    userByLegacyOwner.set(user.profileRow.lid, user);
  }

  const usedSlugs = new Set();
  const roomPlans = rooms.map((room) => {
    const stageState = parseJson(room.stage_state, {}, diagnostics, `rooms.${room.idroom}.stage_state`);
    const roomOwnerMeta = parseJson(room.room_owner_meta, {}, diagnostics, `rooms.${room.idroom}.room_owner_meta`);
    const slug = uniqueSlug(stableSlug(room.id || room.topic, `room-${room.idroom}`), usedSlugs);
    const owner = userByLegacyOwner.get(String(room.owner || ""));
    return {
      legacyId: String(room.id || room.idroom || ""),
      slug,
      name: String(room.topic || room.id || `room-${room.idroom}`).slice(0, 160),
      description: room.about || "",
      ownerLegacyKey: String(room.owner || ""),
      ownerUsername: owner?.username || null,
      avatarUrl: normalizePath(room.pic, "/room") || "room.png",
      isPublic: !toBool(room.needpass),
      isDeleted: toBool(room.deleted),
      maxMembers: toNumber(room.max, 500),
      micSlots: toNumber(room.mic),
      settings: {
        welcome: room.welcome || "",
        broadcast: toBool(room.broadcast),
        color: room.color || "#000000",
        needpass: toBool(room.needpass),
        rmli: toNumber(room.rmli),
        stage_count: toNumber(room.stage_count, 5),
        stage_state: stageState,
        message_mode: room.message_mode || "real",
      },
      legacyMetadata: {
        source: "rooms",
        idroom: room.idroom,
        user: room.user,
        owner: room.owner,
        room_owner_meta: roomOwnerMeta,
      },
    };
  });

  const siteSettingsPlans = [];
  const assetPlans = [];
  const giftPlans = [];
  const roomBadgePlans = [];
  const siteBadgePlans = [];

  settingsRows.forEach((row) => {
    const site = parseJson(row.site, {}, diagnostics, "settings.site");
    siteSettingsPlans.push({ key: "legacy.site", value: { source: "settings.site", ...site } });

    for (const [field, type, prefix] of [
      ["dro3", "profile_frame", "/dro3"],
      ["them", "theme", "/them"],
      ["cover", "cover", "/cover"],
      ["emo", "emoji", "/emo"],
      ["sico", "profile_icon", "/sico"],
    ]) {
      const values = parseJson(row[field], [], diagnostics, `settings.${field}`);
      if (Array.isArray(values)) {
        values.forEach((file, index) => {
          assetPlans.push({
            assetType: type,
            name: String(file || ""),
            fileUrl: normalizePath(file, prefix),
            sortOrder: index,
            metadata: { source: `settings.${field}`, legacy_file: file },
          });
        });
      }
    }

    const gifts = parseJson(row.gifts_git, [], diagnostics, "settings.gifts_git");
    if (Array.isArray(gifts)) {
      gifts.forEach((gift) => {
        giftPlans.push({
          name: String(gift.name || gift.file || "هدية").slice(0, 160),
          imageUrl: normalizePath(gift.file, "/gifts_git"),
          category: String(gift.category || "default").slice(0, 80),
          priceCoins: toNumber(gift.coin),
          isActive: true,
          legacyMetadata: { source: "settings.gifts_git", legacy_id: gift.id || "", raw: gift },
        });
      });
    }

    const roomBadges = parseJson(row.room_badges, [], diagnostics, "settings.room_badges");
    if (Array.isArray(roomBadges)) {
      roomBadges.forEach((badge) => roomBadgePlans.push(normalizeBadge(badge, "settings.room_badges")));
    }

    const siteBadges = parseJson(row.site_badges, [], diagnostics, "settings.site_badges");
    if (Array.isArray(siteBadges)) {
      siteBadges.forEach((badge) => siteBadgePlans.push(normalizeBadge(badge, "settings.site_badges")));
    }

    const giftCategories = parseJson(row.gift_categories, [], diagnostics, "settings.gift_categories");
    siteSettingsPlans.push({ key: "legacy.gift_categories", value: { categories: giftCategories } });
  });

  siteRows.forEach((row) => {
    siteSettingsPlans.push({ key: "legacy.site_host", value: { host: row.host || "", ids: row.ids || 0 } });
    if (row.banner) {
      assetPlans.push({
        assetType: "banner",
        name: "legacy banner",
        fileUrl: normalizePath(row.banner, "/site"),
        sortOrder: 0,
        metadata: { source: "site.banner", legacy_id: row.id },
      });
    }
    if (row.logo) {
      assetPlans.push({
        assetType: "logo",
        name: "legacy logo",
        fileUrl: normalizePath(row.logo, "/site"),
        sortOrder: 0,
        metadata: { source: "site.logo", legacy_id: row.id },
      });
    }
  });

  ownerRows.forEach((row) => {
    siteSettingsPlans.push({
      key: "legacy.owner",
      value: {
        bars: toBool(row.bars),
        vpn: toBool(row.Vpn),
        guest_policy: row.Gust || "",
        datafinish: row.datafinish || "",
        max_rep: toNumber(row.MaxRep),
        tv: row.Tv || "",
        visitor: row.Vistor || "",
        room: row.room || "",
        banner_enabled: toBool(row.isbanner),
        reconnect_enabled: toBool(row.rc),
        wall_comments_enabled: toBool(row.cooment),
        offline: toBool(row.offline),
      },
    });
  });

  const siteWallet = siteWalletRows[0]
    ? {
        ownerType: "site",
        balanceCoins: toNumber(siteWalletRows[0].balance_coins),
        reservedCoins: toNumber(siteWalletRows[0].reserved_coins),
        legacyMetadata: { source: "site_master_wallet", legacy_id: siteWalletRows[0].id },
      }
    : null;

  const mappings = [];
  for (const tableName of PHASE_TABLES) {
    const entry = coverage.get(tableName);
    if (!entry) continue;
    for (const column of entry.columns) {
      for (const target of entry.targets) {
        mappings.push({
          legacyTable: tableName,
          legacyColumn: column,
          targetTable: target,
          targetColumn: null,
          mappingStrategy: entry.strategy,
          note: entry.rawTarget,
        });
      }
    }
  }

  return {
    source,
    mode: "dry_run",
    phase: "core_identity_settings",
    phaseTables: PHASE_TABLES,
    counts: {
      users: userPlans.length,
      userProfiles: userPlans.length,
      userWallets: userPlans.length,
      roles: rolesByName.size,
      rolePermissions: [...rolesByName.values()].reduce((sum, role) => sum + role.permissions.length, 0),
      rooms: roomPlans.length,
      siteSettings: siteSettingsPlans.length,
      siteAssets: assetPlans.length,
      gifts: giftPlans.length,
      roomBadges: roomBadgePlans.length,
      siteBadges: siteBadgePlans.length,
      siteWallets: siteWallet ? 1 : 0,
      mappings: mappings.length,
    },
    data: {
      users: userPlans,
      roles: [...rolesByName.values()],
      rooms: roomPlans,
      siteSettings: siteSettingsPlans,
      siteAssets: assetPlans,
      gifts: giftPlans,
      roomBadges: roomBadgePlans,
      siteBadges: siteBadgePlans,
      siteWallet,
      mappings,
    },
    diagnostics,
  };
}

function normalizeBadge(badge, source) {
  return {
    legacyBadgeId: String(badge.id || ""),
    name: String(badge.name || "").slice(0, 160),
    background: String(badge.bg || ""),
    iconUrl: normalizePath(badge.icon, ""),
    backgroundType: String(badge.bg_type || "static").slice(0, 40),
    isActive: true,
    metadata: { source, raw: badge },
  };
}

function makeSource(dumpPath, dumpSql) {
  return {
    path: dumpPath,
    name: path.basename(dumpPath),
    database: "safarihost",
    dumpCompletedAt: extractDumpCompletedAt(dumpSql),
    sha256: crypto.createHash("sha256").update(dumpSql).digest("hex"),
  };
}

function stripPlanData(plan) {
  const { data, ...report } = plan;
  return {
    ...report,
    samples: {
      users: data.users.slice(0, 5).map((user) => ({
        legacyId: user.legacyId,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        coins: user.profileRow.coins,
        requiresPasswordReset: user.requiresPasswordReset,
      })),
      roles: data.roles.slice(0, 8).map((role) => ({
        name: role.name,
        rank: role.rank,
        permissions: role.permissions.length,
      })),
      rooms: data.rooms.slice(0, 5).map((room) => ({
        legacyId: room.legacyId,
        slug: room.slug,
        name: room.name,
        ownerLegacyKey: room.ownerLegacyKey,
      })),
    },
  };
}

function renderMarkdown(report) {
  const lines = [
    "# تقرير خطة الترحيل الفعلي",
    "",
    `- الوضع: ${report.mode === "apply" ? "تنفيذ فعلي" : "محاكاة بدون كتابة"}`,
    `- المرحلة: \`${report.phase}\``,
    `- المصدر: \`${report.source.path}\``,
    `- قاعدة البيانات: \`${report.source.database}\``,
    `- تاريخ اكتمال dump: ${report.source.dumpCompletedAt || "غير معروف"}`,
    `- SHA-256: \`${report.source.sha256}\``,
    "",
    "## الجداول المشمولة",
    "",
    report.phaseTables.map((table) => `\`${table}\``).join(", "),
    "",
    "## الملخص",
    "",
  ];

  for (const [key, value] of Object.entries(report.counts)) {
    lines.push(`- ${key}: ${value}`);
  }

  lines.push("", "## عينات مراجعة", "", "### المستخدمون", "");
  for (const user of report.samples.users) {
    lines.push(`- #${user.legacyId} \`${user.username}\` / ${user.displayName} / role=${user.role} / coins=${user.coins}`);
  }

  lines.push("", "### الصلاحيات", "");
  for (const role of report.samples.roles) {
    lines.push(`- \`${role.name}\` rank=${role.rank} permissions=${role.permissions}`);
  }

  lines.push("", "### الغرف", "");
  for (const room of report.samples.rooms) {
    lines.push(`- \`${room.slug}\` / ${room.name} / owner=${room.ownerLegacyKey || "غير محدد"}`);
  }

  lines.push("", "## التشخيص", "");
  if (report.diagnostics.length === 0) {
    lines.push("- لا توجد أخطاء تحليل في المرحلة الحالية.");
  } else {
    for (const item of report.diagnostics.slice(0, 50)) {
      lines.push(`- ${item.type} في ${item.context}: ${item.message || item.valuePreview || ""}`);
    }
  }

  lines.push("", "## ملاحظة تشغيل", "");
  lines.push("هذا السكربت لا يكتب في PostgreSQL إلا عند تمرير `--apply`. في وضع التنفيذ الفعلي يستخدم transaction، وإذا فشلت أي خطوة يتم rollback.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildSqlPreview(report) {
  return [
    "-- Preview only. Run npm run legacy:import -- --apply to execute through the guarded importer.",
    `-- Source: ${report.source.path}`,
    `-- Phase: ${report.phase}`,
    `-- Users: ${report.counts.users}`,
    `-- Roles: ${report.counts.roles}`,
    `-- Rooms: ${report.counts.rooms}`,
    "INSERT INTO legacy_import_batches (source_name, source_database, dump_completed_at, status, summary, finished_at)",
    `VALUES (${sqlString(report.source.name)}, ${sqlString(report.source.database)}, ${report.source.dumpCompletedAt ? sqlString(report.source.dumpCompletedAt) : "NULL"}, 'preview', ${sqlString(JSON.stringify({ phase: report.phase, counts: report.counts }))}::jsonb, now());`,
    "",
  ].join("\n");
}

function writeReports(outDir, plan, applyResult = null) {
  fs.mkdirSync(outDir, { recursive: true });
  const report = stripPlanData({
    ...plan,
    mode: applyResult ? "apply" : "dry_run",
    applyResult,
  });

  const jsonPath = path.join(outDir, "legacy-import-apply-plan.json");
  const markdownPath = path.join(outDir, "legacy-import-apply-plan.md");
  const sqlPath = path.join(outDir, "legacy-import-apply.preview.sql");

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderMarkdown(report), "utf8");
  fs.writeFileSync(sqlPath, buildSqlPreview(report), "utf8");

  return { jsonPath, markdownPath, sqlPath };
}

function getPool() {
  let connectionString = process.env.DATABASE_URL || "";
  if (!connectionString) {
    throw new Error("DATABASE_URL is required when using --apply.");
  }
  if (connectionString.includes("sslmode=")) {
    connectionString = connectionString.replace(/[?&]sslmode=[^&]+/, "");
  }

  return new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL?.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
  });
}

async function applyPlan(plan) {
  const pool = getPool();
  const client = await pool.connect();
  const ids = {
    usersByUsername: new Map(),
    rolesByName: new Map(),
    roomsBySlug: new Map(),
    roomBadgesByLegacyId: new Map(),
  };
  const written = {};

  try {
    await client.query("BEGIN");

    const batch = await client.query(
      `INSERT INTO legacy_import_batches (source_name, source_database, dump_completed_at, status, summary, finished_at)
       VALUES ($1, $2, $3, 'running', $4::jsonb, NULL)
       RETURNING id`,
      [
        plan.source.name,
        plan.source.database,
        plan.source.dumpCompletedAt,
        JSON.stringify({ phase: plan.phase, sourceHash: plan.source.sha256, counts: plan.counts }),
      ],
    );
    const batchId = batch.rows[0].id;

    async function runStep(name, action) {
      console.log(`Applying ${name}...`);
      try {
        const count = await action();
        console.log(`Applied ${name}: ${count}`);
        return count;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${name} failed: ${message}`, { cause: error });
      }
    }

    written.mappings = await runStep("mappings", () => applyMappings(client, batchId, plan.data.mappings));
    written.roles = await runStep("roles", () => applyRoles(client, ids, plan.data.roles));
    written.users = await runStep("users", () => applyUsers(client, ids, plan.data.users));
    written.userProfiles = await runStep("userProfiles", () => applyUserProfiles(client, ids, plan.data.users));
    written.userWallets = await runStep("userWallets", () => applyUserWallets(client, ids, plan.data.users));
    written.userRoleAssignments = await runStep("userRoleAssignments", () => applyUserRoleAssignments(client, ids, plan.data.users));
    written.rooms = await runStep("rooms", () => applyRooms(client, ids, plan.data.rooms));
    written.siteSettings = await runStep("siteSettings", () => applySiteSettings(client, plan.data.siteSettings));
    written.siteAssets = await runStep("siteAssets", () => applySiteAssets(client, plan.data.siteAssets));
    written.gifts = await runStep("gifts", () => applyGifts(client, plan.data.gifts));
    written.siteBadges = await runStep("siteBadges", () => applySiteBadges(client, plan.data.siteBadges));
    written.roomBadges = await runStep("roomBadges", () => applyRoomBadges(client, ids, plan.data.roomBadges));
    written.siteWallets = plan.data.siteWallet ? await runStep("siteWallets", () => applySiteWallet(client, plan.data.siteWallet)) : 0;

    await client.query(
      `UPDATE legacy_import_batches
       SET status = 'completed', summary = $2::jsonb, finished_at = now()
       WHERE id = $1`,
      [batchId, JSON.stringify({ phase: plan.phase, sourceHash: plan.source.sha256, counts: plan.counts, written })],
    );

    await client.query("COMMIT");
    return { batchId, written };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function applyMappings(client, batchId, mappings) {
  let count = 0;
  for (const mapping of mappings) {
    await client.query(
      `INSERT INTO legacy_import_mappings (batch_id, legacy_table, legacy_column, target_table, target_column, mapping_strategy, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (legacy_table, legacy_column, target_table, coalesce(target_column, '')) DO NOTHING`,
      [
        batchId,
        mapping.legacyTable,
        mapping.legacyColumn,
        mapping.targetTable,
        mapping.targetColumn,
        mapping.mappingStrategy,
        mapping.note,
      ],
    );
    count += 1;
  }
  return count;
}

async function applyRoles(client, ids, roles) {
  let count = 0;
  for (const role of roles) {
    const result = await client.query(
      `INSERT INTO roles (legacy_name, name, rank, icon_url, is_system, auto_enabled, auto_promote, auto_points, legacy_metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       ON CONFLICT (name) DO UPDATE SET
         legacy_name = EXCLUDED.legacy_name,
         rank = EXCLUDED.rank,
         icon_url = EXCLUDED.icon_url,
         is_system = EXCLUDED.is_system,
         auto_enabled = EXCLUDED.auto_enabled,
         auto_promote = EXCLUDED.auto_promote,
         auto_points = EXCLUDED.auto_points,
         legacy_metadata = EXCLUDED.legacy_metadata,
         updated_at = now()
       RETURNING id`,
      [
        role.legacyName,
        role.name,
        role.rank,
        role.iconUrl,
        role.isSystem,
        role.autoEnabled,
        role.autoPromote,
        role.autoPoints,
        JSON.stringify(role.legacyMetadata),
      ],
    );
    const roleId = result.rows[0].id;
    ids.rolesByName.set(role.name, roleId);

    for (const permission of role.permissions) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_key, permission_value, source)
         VALUES ($1, $2, $3::jsonb, 'legacy_powers')
         ON CONFLICT (role_id, permission_key) DO UPDATE SET
           permission_value = EXCLUDED.permission_value,
           source = EXCLUDED.source`,
        [roleId, permission.key, JSON.stringify(permission.value)],
      );
    }
    count += 1;
  }
  return count;
}

async function applyUsers(client, ids, users) {
  let count = 0;
  for (const user of users) {
    const result = await client.query(
      `INSERT INTO users
        (legacy_id, username, display_name, password_hash, role, status, avatar_url, cover_url, country_code, locale, profile, requires_password_reset, legacy_metadata, created_at, updated_at, last_seen_at)
       VALUES ($1, $2, $3, $4, $5::account_role, $6::account_status, $7, $8, $9, $10, $11::jsonb, $12, $13::jsonb, $14, $15, $16)
       ON CONFLICT (username) DO UPDATE SET
         legacy_id = EXCLUDED.legacy_id,
         display_name = EXCLUDED.display_name,
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         avatar_url = EXCLUDED.avatar_url,
         cover_url = EXCLUDED.cover_url,
         profile = EXCLUDED.profile,
         requires_password_reset = EXCLUDED.requires_password_reset,
         legacy_metadata = EXCLUDED.legacy_metadata,
         updated_at = now(),
         last_seen_at = EXCLUDED.last_seen_at
       RETURNING id`,
      [
        user.legacyId,
        user.username,
        user.displayName,
        user.passwordHash,
        user.role,
        user.status,
        user.avatarUrl,
        user.coverUrl,
        user.countryCode,
        user.locale,
        JSON.stringify(user.profile),
        user.requiresPasswordReset,
        JSON.stringify(user.legacyMetadata),
        user.createdAt,
        user.updatedAt,
        user.lastSeenAt,
      ],
    );
    ids.usersByUsername.set(user.username, result.rows[0].id);
    count += 1;
  }
  return count;
}

async function applyUserProfiles(client, ids, users) {
  let count = 0;
  for (const user of users) {
    const userId = ids.usersByUsername.get(user.username);
    const profile = user.profileRow;
    await client.query(
      `INSERT INTO user_profiles
        (user_id, idreg, lid, uid, profile_msg, avatar_url, banner_url, theme_id, avatar_frame_url, gift_icon_url, profile_icon_url,
         background_color, message_color, name_color, gradient_color, evaluation, rep, coins, wall_post_likes, gifts_received_count,
         power, icon, is_login, muted, documents, room_id, site_badge_id, site_badge, joinuser, legacy_metadata)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
         $12, $13, $14, $15, $16, $17, $18, $19, $20,
         $21, $22, $23, $24, $25, $26, $27, $28, $29, $30::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET
         profile_msg = EXCLUDED.profile_msg,
         avatar_url = EXCLUDED.avatar_url,
         banner_url = EXCLUDED.banner_url,
         theme_id = EXCLUDED.theme_id,
         avatar_frame_url = EXCLUDED.avatar_frame_url,
         gift_icon_url = EXCLUDED.gift_icon_url,
         profile_icon_url = EXCLUDED.profile_icon_url,
         background_color = EXCLUDED.background_color,
         message_color = EXCLUDED.message_color,
         name_color = EXCLUDED.name_color,
         gradient_color = EXCLUDED.gradient_color,
         evaluation = EXCLUDED.evaluation,
         rep = EXCLUDED.rep,
         coins = EXCLUDED.coins,
         wall_post_likes = EXCLUDED.wall_post_likes,
         gifts_received_count = EXCLUDED.gifts_received_count,
         power = EXCLUDED.power,
         icon = EXCLUDED.icon,
         is_login = EXCLUDED.is_login,
         muted = EXCLUDED.muted,
         documents = EXCLUDED.documents,
         room_id = EXCLUDED.room_id,
         site_badge_id = EXCLUDED.site_badge_id,
         site_badge = EXCLUDED.site_badge,
         joinuser = EXCLUDED.joinuser,
         legacy_metadata = EXCLUDED.legacy_metadata,
         updated_at = now()`,
      [
        userId,
        profile.idreg,
        profile.lid,
        profile.uid,
        profile.profileMsg,
        profile.avatarUrl,
        profile.bannerUrl,
        profile.themeId,
        profile.avatarFrameUrl,
        profile.giftIconUrl,
        profile.profileIconUrl,
        profile.backgroundColor,
        profile.messageColor,
        profile.nameColor,
        profile.gradientColor,
        profile.evaluation,
        profile.rep,
        profile.coins,
        profile.wallPostLikes,
        profile.giftsReceivedCount,
        profile.power,
        profile.icon,
        profile.isLogin,
        profile.muted,
        profile.documents,
        profile.roomId,
        profile.siteBadgeId,
        profile.siteBadge,
        profile.joinuser,
        JSON.stringify(profile.legacyMetadata),
      ],
    );
    count += 1;
  }
  return count;
}

async function applyUserWallets(client, ids, users) {
  let count = 0;
  for (const user of users) {
    const userId = ids.usersByUsername.get(user.username);
    await client.query(
      `INSERT INTO wallets (owner_type, owner_id, balance_coins, reserved_coins)
       VALUES ('user', $1, $2, $3)
       ON CONFLICT (owner_type, owner_id) DO UPDATE SET
         balance_coins = EXCLUDED.balance_coins,
         reserved_coins = EXCLUDED.reserved_coins,
         updated_at = now()`,
      [userId, user.wallet.balanceCoins, user.wallet.reservedCoins],
    );
    count += 1;
  }
  return count;
}

async function applyUserRoleAssignments(client, ids, users) {
  let count = 0;
  for (const user of users) {
    const userId = ids.usersByUsername.get(user.username);
    const roleId = ids.rolesByName.get(user.roleName);
    if (!userId || !roleId) continue;
    await client.query(
      `INSERT INTO user_role_assignments (user_id, role_id, legacy_metadata)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (user_id, role_id) DO UPDATE SET legacy_metadata = EXCLUDED.legacy_metadata`,
      [userId, roleId, JSON.stringify({ source: "users.power", power: user.roleName })],
    );
    count += 1;
  }
  return count;
}

async function applyRooms(client, ids, rooms) {
  let count = 0;
  for (const room of rooms) {
    const ownerId = room.ownerUsername ? ids.usersByUsername.get(room.ownerUsername) : null;
    const result = await client.query(
      `INSERT INTO rooms
        (legacy_id, slug, name, description, owner_id, avatar_url, is_public, is_deleted, max_members, mic_slots, settings, legacy_metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb)
       ON CONFLICT (slug) DO UPDATE SET
         legacy_id = EXCLUDED.legacy_id,
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         owner_id = EXCLUDED.owner_id,
         avatar_url = EXCLUDED.avatar_url,
         is_public = EXCLUDED.is_public,
         is_deleted = EXCLUDED.is_deleted,
         max_members = EXCLUDED.max_members,
         mic_slots = EXCLUDED.mic_slots,
         settings = EXCLUDED.settings,
         legacy_metadata = EXCLUDED.legacy_metadata,
         updated_at = now()
       RETURNING id`,
      [
        room.legacyId,
        room.slug,
        room.name,
        room.description,
        ownerId || null,
        room.avatarUrl,
        room.isPublic,
        room.isDeleted,
        room.maxMembers,
        room.micSlots,
        JSON.stringify(room.settings),
        JSON.stringify(room.legacyMetadata),
      ],
    );
    ids.roomsBySlug.set(room.slug, result.rows[0].id);
    count += 1;
  }
  return count;
}

async function applySiteSettings(client, settings) {
  let count = 0;
  for (const setting of settings) {
    await client.query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [setting.key, JSON.stringify(setting.value)],
    );
    count += 1;
  }
  return count;
}

async function applySiteAssets(client, assets) {
  let count = 0;
  for (const asset of assets) {
    await client.query(
      `INSERT INTO site_assets (asset_type, name, file_url, sort_order, is_active, metadata)
       SELECT $1::varchar(40), $2::varchar(160), $3::text, $4::integer, true, $5::jsonb
       WHERE NOT EXISTS (
         SELECT 1 FROM site_assets WHERE asset_type = $1 AND file_url = $3
       )`,
      [asset.assetType, asset.name, asset.fileUrl, asset.sortOrder, JSON.stringify(asset.metadata)],
    );
    count += 1;
  }
  return count;
}

async function applyGifts(client, gifts) {
  let count = 0;
  for (const gift of gifts) {
    await client.query(
      `INSERT INTO gifts (name, image_url, category, price_coins, is_active)
       SELECT $1::varchar(160), $2::text, $3::varchar(80), $4::bigint, $5::boolean
       WHERE NOT EXISTS (
         SELECT 1 FROM gifts WHERE image_url = $2 AND name = $1
       )`,
      [gift.name, gift.imageUrl, gift.category, gift.priceCoins, gift.isActive],
    );
    count += 1;
  }
  return count;
}

async function applySiteBadges(client, badges) {
  let count = 0;
  for (const badge of badges) {
    await client.query(
      `INSERT INTO site_badges (legacy_badge_id, name, background, icon_url, background_type, is_active, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       ON CONFLICT (legacy_badge_id) DO UPDATE SET
         name = EXCLUDED.name,
         background = EXCLUDED.background,
         icon_url = EXCLUDED.icon_url,
         background_type = EXCLUDED.background_type,
         is_active = EXCLUDED.is_active,
         metadata = EXCLUDED.metadata`,
      [badge.legacyBadgeId, badge.name, badge.background, badge.iconUrl, badge.backgroundType, badge.isActive, JSON.stringify(badge.metadata)],
    );
    count += 1;
  }
  return count;
}

async function applyRoomBadges(client, ids, badges) {
  let count = 0;
  for (const badge of badges) {
    const result = await client.query(
      `INSERT INTO room_badges (legacy_badge_id, name, background, icon_url, background_type, is_active, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       ON CONFLICT (legacy_badge_id) DO UPDATE SET
         name = EXCLUDED.name,
         background = EXCLUDED.background,
         icon_url = EXCLUDED.icon_url,
         background_type = EXCLUDED.background_type,
         is_active = EXCLUDED.is_active,
         metadata = EXCLUDED.metadata
       RETURNING id`,
      [badge.legacyBadgeId, badge.name, badge.background, badge.iconUrl, badge.backgroundType, badge.isActive, JSON.stringify(badge.metadata)],
    );
    ids.roomBadgesByLegacyId.set(badge.legacyBadgeId, result.rows[0].id);
    count += 1;
  }
  return count;
}

async function applySiteWallet(client, wallet) {
  await client.query(
    `INSERT INTO wallets (owner_type, owner_id, balance_coins, reserved_coins)
     SELECT 'site', NULL, $1::bigint, $2::bigint
     WHERE NOT EXISTS (
       SELECT 1 FROM wallets WHERE owner_type = 'site' AND owner_id IS NULL
     )`,
    [wallet.balanceCoins, wallet.reservedCoins],
  );
  return 1;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dumpPath = path.resolve(args.dump);

  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Legacy dump was not found: ${dumpPath}`);
  }
  if (!fs.existsSync(COVERAGE_PATH)) {
    throw new Error(`Coverage document was not found: ${COVERAGE_PATH}`);
  }

  const dumpSql = readUtf8(dumpPath);
  const coverage = parseCoverageMatrix(readUtf8(COVERAGE_PATH));
  const source = makeSource(dumpPath, dumpSql);
  const rowsByTable = extractRows(dumpSql, extractCreateTables(dumpSql));
  const plan = buildPlan(rowsByTable, coverage, source);

  let applyResult = null;
  if (args.apply) {
    applyResult = await applyPlan(plan);
  }

  const output = writeReports(args.outDir, plan, applyResult);
  console.log(args.apply ? "Legacy import applied." : "Legacy import plan generated.");
  console.log(`Mode: ${args.apply ? "apply" : "dry-run"}`);
  console.log(`Users: ${plan.counts.users}`);
  console.log(`Roles: ${plan.counts.roles}`);
  console.log(`Rooms: ${plan.counts.rooms}`);
  console.log(`Gifts: ${plan.counts.gifts}`);
  console.log(`Diagnostics: ${plan.diagnostics.length}`);
  if (applyResult) console.log(`Batch: ${applyResult.batchId}`);
  console.log(`JSON report: ${output.jsonPath}`);
  console.log(`Markdown report: ${output.markdownPath}`);
  console.log(`SQL preview: ${output.sqlPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
