#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DUMP_PATH = "C:\\xampp\\htdocs\\chetos216-08-2024\\database\\database٥‏-٥‏-٢٠٢٦.sql";
const OUTPUT_DIR = path.join(ROOT, "reports", "legacy");
const COVERAGE_PATH = path.join(ROOT, "docs", "legacy-column-coverage.md");
const TARGET_SCHEMA_PATH = path.join(ROOT, "database", "global-chat.postgres.sql");

const JSON_LIKE_FIELDS = new Set([
  "bars.bcc",
  "bars.likes",
  "bsb.systems",
  "bsb.browsers",
  "powers.powers",
  "rooms.stage_state",
  "rooms.room_owner_meta",
  "settings.site",
  "settings.dro3",
  "settings.them",
  "settings.cover",
  "settings.emo",
  "settings.sico",
  "settings.room_badges",
  "settings.site_badges",
  "settings.gifts_git",
  "settings.gift_categories",
  "storie.item",
  "storie.currentPreview",
  "users.site_badge",
  "users.eval_awards_json",
]);

const SPECIAL_TARGETS = new Set([
  "legacy_metadata",
  "metadata",
  "snapshots",
  "reports",
]);

function parseArgs(argv) {
  const args = {
    dump: process.env.LEGACY_DUMP_PATH || DEFAULT_DUMP_PATH,
    outDir: OUTPUT_DIR,
    sampleRows: 25,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dump" && argv[index + 1]) {
      args.dump = argv[index + 1];
      index += 1;
    } else if (arg.startsWith("--dump=")) {
      args.dump = arg.slice("--dump=".length);
    } else if (arg === "--out" && argv[index + 1]) {
      args.outDir = path.resolve(argv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--out=")) {
      args.outDir = path.resolve(arg.slice("--out=".length));
    } else if (arg === "--sample-rows" && argv[index + 1]) {
      args.sampleRows = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg.startsWith("--sample-rows=")) {
      args.sampleRows = Number.parseInt(arg.slice("--sample-rows=".length), 10);
    }
  }

  if (!Number.isFinite(args.sampleRows) || args.sampleRows < 0) {
    args.sampleRows = 25;
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
      columns.push({
        name: columnMatch[1],
        definition: columnMatch[2].trim().replace(/,$/, ""),
      });
    }

    tables.set(tableName, { name: tableName, columns });
  }

  return tables;
}

function extractTargetTables(sql) {
  const tables = new Set();
  const tableRegex = /CREATE TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+\(/g;
  let match;
  while ((match = tableRegex.exec(sql)) !== null) {
    tables.add(match[1]);
  }
  return tables;
}

function unescapeMarkdownCell(cell) {
  return cell.trim().replace(/<br\s*\/?>/gi, " ");
}

function parseCoverageMatrix(markdown) {
  const coverage = new Map();

  for (const line of markdown.split(/\r?\n/)) {
    if (!line.startsWith("| `")) continue;
    const cells = line.split("|").slice(1, -1).map(unescapeMarkdownCell);
    if (cells.length < 4 || cells[0] === "---") continue;

    const tableMatch = cells[0].match(/`([^`]+)`/);
    if (!tableMatch) continue;

    const columns = [...cells[1].matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    const targets = [...cells[2].matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    const strategy = cells[3].replace(/\s+/g, " ").trim();

    coverage.set(tableMatch[1], {
      legacyTable: tableMatch[1],
      columns,
      targets,
      strategy,
      rawTarget: cells[2],
    });
  }

  return coverage;
}

function extractDumpCompletedAt(sql) {
  const match = sql.match(/-- Dump completed on ([0-9-]+ [0-9:]+)/);
  if (!match) return null;
  return match[1].replace(" ", "T");
}

function countInsertRows(sql) {
  const counts = new Map();
  const insertRegex = /INSERT INTO\s+`([^`]+)`\s+VALUES\s+/g;
  let match;

  while ((match = insertRegex.exec(sql)) !== null) {
    const tableName = match[1];
    let cursor = insertRegex.lastIndex;
    let rows = 0;
    let inString = false;
    let depth = 0;
    let escaped = false;

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
        if (depth === 0) rows += 1;
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
      } else if (char === ";" && depth === 0) {
        break;
      }

      cursor += 1;
    }

    counts.set(tableName, (counts.get(tableName) || 0) + rows);
    insertRegex.lastIndex = cursor + 1;
  }

  return counts;
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

function sampleInsertRows(sql, tableColumns, limit) {
  const samples = new Map();
  const insertRegex = /INSERT INTO\s+`([^`]+)`\s+VALUES\s+/g;
  let match;

  while ((match = insertRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const table = tableColumns.get(tableName);
    if (!table || (samples.get(tableName)?.length || 0) >= limit) continue;

    let cursor = insertRegex.lastIndex;
    let inString = false;
    let depth = 0;
    let escaped = false;
    let tupleStart = -1;
    const tableSamples = samples.get(tableName) || [];

    while (cursor < sql.length && tableSamples.length < limit) {
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
          const tupleBody = sql.slice(tupleStart, cursor);
          const values = splitSqlValues(tupleBody);
          const row = {};
          table.columns.forEach((column, index) => {
            row[column.name] = values[index] ?? null;
          });
          tableSamples.push(row);
        }
      } else if (char === ";" && depth === 0) {
        break;
      }

      cursor += 1;
    }

    samples.set(tableName, tableSamples);
    insertRegex.lastIndex = cursor + 1;
  }

  return samples;
}

function analyzeJsonColumns(tables, samples) {
  const diagnostics = [];

  for (const [tableName, table] of tables) {
    const tableSamples = samples.get(tableName) || [];
    for (const column of table.columns) {
      if (!JSON_LIKE_FIELDS.has(`${tableName}.${column.name}`)) continue;
      const values = tableSamples
        .map((row) => row[column.name])
        .filter((value) => typeof value === "string" && value.trim() !== "");
      if (values.length === 0) {
        diagnostics.push({
          table: tableName,
          column: column.name,
          checked: 0,
          valid: 0,
          invalid: 0,
          note: "لا توجد عينة نصية قابلة للفحص.",
        });
        continue;
      }

      let valid = 0;
      const errors = [];
      for (const value of values) {
        try {
          JSON.parse(value);
          valid += 1;
        } catch (error) {
          errors.push(error.message);
        }
      }

      diagnostics.push({
        table: tableName,
        column: column.name,
        checked: values.length,
        valid,
        invalid: values.length - valid,
        note: errors[0] || "",
      });
    }
  }

  return diagnostics;
}

function analyzeMojibake(samples) {
  const findings = [];

  for (const [tableName, rows] of samples) {
    for (const [rowIndex, row] of rows.entries()) {
      for (const [column, value] of Object.entries(row)) {
        if (typeof value !== "string") continue;
        if (!looksLikeMojibake(value)) continue;
        findings.push({
          table: tableName,
          column,
          sampleRow: rowIndex + 1,
          valuePreview: value.slice(0, 120),
        });
        if (findings.length >= 100) return findings;
      }
    }
  }

  return findings;
}

function looksLikeMojibake(value) {
  if (/[ØÙ�]/.test(value)) return true;
  if (/(?:ط·|ط¹|ط£|ط¥|ط§|ظٹ|ظˆ|ظ†|ظ…|ظ„|ظƒ|ظ‡|ظپ|ظ‚|ظ‰)/.test(value)) {
    const pairCount = (value.match(/[طظ][^\s|,.;:()[\]{}'"`،؛؟]/g) || []).length;
    return pairCount >= 3;
  }
  return false;
}

function compareCoverage(tables, coverage, targetTables) {
  const missingTables = [];
  const missingColumns = [];
  const documentedButMissingTables = [];
  const targetGaps = [];

  for (const [tableName, table] of tables) {
    const tableCoverage = coverage.get(tableName);
    if (!tableCoverage) {
      missingTables.push(tableName);
      continue;
    }

    const coveredColumns = new Set(tableCoverage.columns);
    for (const column of table.columns) {
      if (!coveredColumns.has(column.name)) {
        missingColumns.push({ table: tableName, column: column.name });
      }
    }

    for (const target of tableCoverage.targets) {
      if (SPECIAL_TARGETS.has(target)) continue;
      if (!targetTables.has(target)) {
        targetGaps.push({
          legacyTable: tableName,
          target,
          note: "الوجهة مذكورة في التغطية لكنها غير موجودة كجدول مباشر في schema؛ قد تكون علاقة/تقرير/حقل metadata.",
        });
      }
    }
  }

  for (const tableName of coverage.keys()) {
    if (!tables.has(tableName)) {
      documentedButMissingTables.push(tableName);
    }
  }

  return {
    missingTables,
    missingColumns,
    documentedButMissingTables,
    targetGaps,
  };
}

function buildMappings(coverage) {
  const mappings = [];

  for (const entry of coverage.values()) {
    const strategy = entry.strategy || "metadata";
    const targetTables = entry.targets.length > 0 ? entry.targets : ["legacy_metadata"];

    for (const column of entry.columns) {
      for (const targetTable of targetTables) {
        mappings.push({
          legacyTable: entry.legacyTable,
          legacyColumn: column,
          targetTable,
          targetColumn: null,
          mappingStrategy: strategy,
          note: entry.rawTarget,
        });
      }
    }
  }

  return mappings;
}

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildMappingSqlPreview(summary, mappings) {
  const batchSummary = {
    dryRun: true,
    sourceHash: summary.source.sha256,
    tableCount: summary.counts.tables,
    columnCount: summary.counts.columns,
    rowCount: summary.counts.rows,
    gaps: summary.gaps,
  };

  const lines = [
    "-- Dry-run preview only. Review before executing against PostgreSQL.",
    "WITH batch AS (",
    "  INSERT INTO legacy_import_batches (source_name, source_database, dump_completed_at, status, summary, finished_at)",
    `  VALUES (${sqlString(summary.source.name)}, ${sqlString(summary.source.database)}, ${summary.source.dumpCompletedAt ? sqlString(summary.source.dumpCompletedAt) : "NULL"}, 'dry_run', ${sqlString(JSON.stringify(batchSummary))}::jsonb, now())`,
    "  RETURNING id",
    ")",
    "INSERT INTO legacy_import_mappings (batch_id, legacy_table, legacy_column, target_table, target_column, mapping_strategy, note)",
    "VALUES",
  ];

  const valueLines = mappings.map((mapping) => {
    return `  ((SELECT id FROM batch), ${sqlString(mapping.legacyTable)}, ${sqlString(mapping.legacyColumn)}, ${sqlString(mapping.targetTable)}, ${sqlString(mapping.targetColumn)}, ${sqlString(mapping.mappingStrategy)}, ${sqlString(mapping.note)})`;
  });

  lines.push(`${valueLines.join(",\n")};`);
  return `${lines.join("\n")}\n`;
}

function writeReport(outDir, report, mappingsSql) {
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, "legacy-import-dry-run.json");
  const markdownPath = path.join(outDir, "legacy-import-dry-run.md");
  const sqlPath = path.join(outDir, "legacy-import-mappings.preview.sql");

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderMarkdown(report), "utf8");
  fs.writeFileSync(sqlPath, mappingsSql, "utf8");

  return { jsonPath, markdownPath, sqlPath };
}

function renderMarkdown(report) {
  const lines = [
    "# تقرير الترحيل التجريبي",
    "",
    `- المصدر: \`${report.source.path}\``,
    `- قاعدة البيانات: \`${report.source.database}\``,
    `- تاريخ اكتمال dump: ${report.source.dumpCompletedAt || "غير معروف"}`,
    `- SHA-256: \`${report.source.sha256}\``,
    "",
    "## الملخص",
    "",
    `- الجداول القديمة: ${report.counts.tables}`,
    `- الأعمدة القديمة: ${report.counts.columns}`,
    `- السجلات المحسوبة من INSERT: ${report.counts.rows}`,
    `- قرارات mapping المولدة: ${report.counts.mappingRows}`,
    "",
    "## فجوات التغطية",
    "",
    `- جداول بلا تغطية: ${report.gaps.missingTables.length}`,
    `- أعمدة بلا تغطية: ${report.gaps.missingColumns.length}`,
    `- جداول موثقة غير موجودة في dump: ${report.gaps.documentedButMissingTables.length}`,
    `- وجهات تحتاج مراجعة: ${report.gaps.targetGaps.length}`,
    "",
  ];

  if (report.gaps.missingTables.length > 0) {
    lines.push("### جداول بلا تغطية", "");
    for (const table of report.gaps.missingTables) lines.push(`- \`${table}\``);
    lines.push("");
  }

  if (report.gaps.missingColumns.length > 0) {
    lines.push("### أعمدة بلا تغطية", "");
    for (const item of report.gaps.missingColumns) lines.push(`- \`${item.table}.${item.column}\``);
    lines.push("");
  }

  lines.push("## أعداد السجلات", "");
  lines.push("| الجدول | الأعمدة | السجلات | الاستراتيجية |");
  lines.push("| --- | ---: | ---: | --- |");
  for (const table of report.tables) {
    lines.push(`| \`${table.name}\` | ${table.columnCount} | ${table.rowCount} | ${table.strategy || "غير موثق"} |`);
  }
  lines.push("");

  lines.push("## فحص JSON", "");
  lines.push("| الجدول | العمود | المفحوص | صحيح | فاشل | ملاحظة |");
  lines.push("| --- | --- | ---: | ---: | ---: | --- |");
  for (const item of report.jsonDiagnostics) {
    lines.push(`| \`${item.table}\` | \`${item.column}\` | ${item.checked} | ${item.valid} | ${item.invalid} | ${item.note || ""} |`);
  }
  lines.push("");

  lines.push("## نصوص عربية مشوهة محتملة", "");
  if (report.mojibakeFindings.length === 0) {
    lines.push("- لم تظهر عينات مشوهة ضمن العينة المفحوصة.");
  } else {
    for (const item of report.mojibakeFindings.slice(0, 25)) {
      lines.push(`- \`${item.table}.${item.column}\` في عينة ${item.sampleRow}: ${item.valuePreview}`);
    }
  }
  lines.push("");

  lines.push("## ملاحظة تشغيل", "");
  lines.push("هذا التقرير لا يكتب في قاعدة البيانات. ملف SQL المرافق هو preview فقط لقرارات `legacy_import_batches` و`legacy_import_mappings`.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const dumpPath = path.resolve(args.dump);

  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Legacy dump was not found: ${dumpPath}`);
  }
  if (!fs.existsSync(COVERAGE_PATH)) {
    throw new Error(`Coverage document was not found: ${COVERAGE_PATH}`);
  }
  if (!fs.existsSync(TARGET_SCHEMA_PATH)) {
    throw new Error(`Target schema was not found: ${TARGET_SCHEMA_PATH}`);
  }

  const dumpSql = readUtf8(dumpPath);
  const coverageMarkdown = readUtf8(COVERAGE_PATH);
  const targetSchemaSql = readUtf8(TARGET_SCHEMA_PATH);
  const sourceHash = crypto.createHash("sha256").update(dumpSql).digest("hex");

  const legacyTables = extractCreateTables(dumpSql);
  const targetTables = extractTargetTables(targetSchemaSql);
  const coverage = parseCoverageMatrix(coverageMarkdown);
  const rowCounts = countInsertRows(dumpSql);
  const samples = sampleInsertRows(dumpSql, legacyTables, args.sampleRows);
  const jsonDiagnostics = analyzeJsonColumns(legacyTables, samples);
  const mojibakeFindings = analyzeMojibake(samples);
  const gaps = compareCoverage(legacyTables, coverage, targetTables);
  const mappings = buildMappings(coverage);

  const tables = [...legacyTables.values()].map((table) => {
    const tableCoverage = coverage.get(table.name);
    return {
      name: table.name,
      columnCount: table.columns.length,
      columns: table.columns.map((column) => column.name),
      rowCount: rowCounts.get(table.name) || 0,
      targets: tableCoverage?.targets || [],
      strategy: tableCoverage?.strategy || null,
    };
  });

  const report = {
    source: {
      path: dumpPath,
      name: path.basename(dumpPath),
      database: "safarihost",
      dumpCompletedAt: extractDumpCompletedAt(dumpSql),
      sha256: sourceHash,
    },
    counts: {
      tables: legacyTables.size,
      columns: tables.reduce((sum, table) => sum + table.columnCount, 0),
      rows: [...rowCounts.values()].reduce((sum, count) => sum + count, 0),
      mappingRows: mappings.length,
    },
    gaps,
    tables,
    jsonDiagnostics,
    mojibakeFindings,
  };

  const mappingSql = buildMappingSqlPreview(report, mappings);
  const output = writeReport(args.outDir, report, mappingSql);

  console.log("Legacy dry-run completed.");
  console.log(`Tables: ${report.counts.tables}`);
  console.log(`Columns: ${report.counts.columns}`);
  console.log(`Rows: ${report.counts.rows}`);
  console.log(`Coverage gaps: ${gaps.missingTables.length} tables, ${gaps.missingColumns.length} columns`);
  console.log(`JSON report: ${output.jsonPath}`);
  console.log(`Markdown report: ${output.markdownPath}`);
  console.log(`SQL preview: ${output.sqlPath}`);

  if (gaps.missingTables.length > 0 || gaps.missingColumns.length > 0) {
    process.exitCode = 2;
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
