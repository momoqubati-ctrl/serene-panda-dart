#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Pool } = require("pg");
require("dotenv").config();

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DATABASE_DIR = "C:\\xampp\\htdocs\\chetos216-08-2024\\database";
const OUTPUT_DIR = path.join(ROOT, "reports", "legacy");

function parseArgs(argv) {
  const args = {
    apply: false,
    dump: process.env.LEGACY_DUMP_PATH || "",
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

  if (!args.dump) {
    args.dump = findDefaultDump();
  }

  return args;
}

function findDefaultDump() {
  if (!fs.existsSync(DEFAULT_DATABASE_DIR)) return "";

  const names = fs.readdirSync(DEFAULT_DATABASE_DIR);
  const exact = names.find((name) => name === "database٥‏-٥‏-٢٠٢٦.sql");
  if (exact) return path.join(DEFAULT_DATABASE_DIR, exact);

  const normalizedExact = names.find((name) => {
    const digits = name
      .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit))
      .replace(/[^\d-]/g, "");
    return digits === "5-5-2026";
  });
  if (normalizedExact) return path.join(DEFAULT_DATABASE_DIR, normalizedExact);

  const candidates = names
    .filter((name) => name.endsWith(".sql"))
    .map((name) => {
      const fullPath = path.join(DEFAULT_DATABASE_DIR, name);
      return { fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return candidates[0]?.fullPath || "";
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function makeName(...parts) {
  const base = parts
    .filter(Boolean)
    .join("_")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  if (base.length <= 55) return base || "idx_legacy";
  const hash = crypto.createHash("sha1").update(base).digest("hex").slice(0, 7);
  return `${base.slice(0, 47)}_${hash}`;
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractCreateTables(sql) {
  const tables = new Map();
  const tableRegex = /CREATE TABLE\s+`([^`]+)`\s+\(([\s\S]*?)\n\)\s+ENGINE=([^\n;]+);/g;
  let match;

  while ((match = tableRegex.exec(sql)) !== null) {
    const [, tableName, body, options] = match;
    const table = {
      name: tableName,
      options,
      columns: [],
      primaryKey: [],
      uniqueIndexes: [],
      indexes: [],
    };

    for (const rawLine of body.split(/\r?\n/)) {
      const line = rawLine.trim().replace(/,$/, "");
      if (!line) continue;

      const columnMatch = line.match(/^`([^`]+)`\s+(.+)$/);
      if (columnMatch) {
        table.columns.push({ name: columnMatch[1], definition: columnMatch[2] });
        continue;
      }

      const primaryMatch = line.match(/^PRIMARY KEY\s+\((.+)\)$/i);
      if (primaryMatch) {
        table.primaryKey = parseIndexColumns(primaryMatch[1]).map((column) => column.name);
        continue;
      }

      const uniqueMatch = line.match(/^UNIQUE KEY\s+`([^`]+)`\s+\((.+)\)$/i);
      if (uniqueMatch) {
        table.uniqueIndexes.push({ name: uniqueMatch[1], columns: parseIndexColumns(uniqueMatch[2]) });
        continue;
      }

      const keyMatch = line.match(/^KEY\s+`([^`]+)`\s+\((.+)\)$/i);
      if (keyMatch) {
        table.indexes.push({ name: keyMatch[1], columns: parseIndexColumns(keyMatch[2]) });
      }
    }

    tables.set(tableName, table);
  }

  return tables;
}

function parseIndexColumns(rawColumns) {
  return rawColumns.split(",").map((part) => {
    const trimmed = part.trim();
    const match = trimmed.match(/`([^`]+)`(?:\((\d+)\))?/);
    return {
      name: match ? match[1] : trimmed.replace(/`/g, ""),
      prefixLength: match?.[2] ? Number(match[2]) : null,
    };
  });
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
      .replace(/\\0/g, "\0")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/''/g, "'");
  }
  if (/^-?\d+(?:\.\d+)?$/.test(rawValue)) return Number(rawValue);
  return rawValue;
}

function extractRows(sql, tables) {
  const rowsByTable = new Map();
  const insertRegex = /INSERT INTO\s+`([^`]+)`\s+VALUES\s+/g;
  let match;

  while ((match = insertRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const table = tables.get(tableName);
    if (!table) continue;

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
          rows.push(values);
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

function convertColumn(column) {
  let definition = column.definition.replace(/\s+/g, " ").trim();
  const autoIncrement = /\bAUTO_INCREMENT\b/i.test(definition);
  definition = definition.replace(/\bAUTO_INCREMENT\b/gi, "").trim();

  const typeMatch = definition.match(/^([a-zA-Z]+)(?:\(([^)]+)\))?/);
  if (!typeMatch) {
    throw new Error(`Could not parse column definition for ${column.name}: ${column.definition}`);
  }

  const rawType = typeMatch[1].toLowerCase();
  const rawArgs = typeMatch[2] || "";
  let pgType;

  if (rawType === "int" || rawType === "integer") {
    pgType = autoIncrement ? "integer GENERATED BY DEFAULT AS IDENTITY" : "integer";
  } else if (rawType === "bigint") {
    pgType = autoIncrement ? "bigint GENERATED BY DEFAULT AS IDENTITY" : "bigint";
  } else if (rawType === "tinyint") {
    pgType = "smallint";
  } else if (rawType === "varchar") {
    pgType = `varchar(${rawArgs || "255"})`;
  } else if (rawType === "text") {
    pgType = "text";
  } else if (rawType === "datetime") {
    pgType = "timestamp";
  } else if (rawType === "decimal") {
    pgType = `numeric(${rawArgs || "18,4"})`;
  } else {
    pgType = definition.slice(0, typeMatch[0].length);
  }

  const suffix = definition.slice(typeMatch[0].length).trim();
  const parts = [quoteIdent(column.name), pgType];

  if (/\bNOT NULL\b/i.test(suffix)) parts.push("NOT NULL");

  const defaultValue = extractDefault(suffix);
  if (defaultValue !== null && !autoIncrement) {
    parts.push(`DEFAULT ${convertDefault(defaultValue)}`);
  }

  return parts.join(" ");
}

function extractDefault(suffix) {
  const match = suffix.match(/\bDEFAULT\s+((?:'[^']*(?:''[^']*)*')|(?:current_timestamp\(\))|(?:current_timestamp)|(?:NULL)|(?:-?\d+(?:\.\d+)?))/i);
  return match ? match[1] : null;
}

function convertDefault(defaultValue) {
  if (/^null$/i.test(defaultValue)) return "NULL";
  if (/^current_timestamp(?:\(\))?$/i.test(defaultValue)) return "CURRENT_TIMESTAMP";
  if (defaultValue.startsWith("'") && defaultValue.endsWith("'")) {
    const value = defaultValue.slice(1, -1).replace(/''/g, "'");
    return `'${value.replace(/'/g, "''")}'`;
  }
  return defaultValue;
}

function buildCreateTableSql(table) {
  const lines = table.columns.map((column) => `  ${convertColumn(column)}`);
  if (table.primaryKey.length > 0) {
    lines.push(`  CONSTRAINT ${quoteIdent(makeName(table.name, "pkey"))} PRIMARY KEY (${table.primaryKey.map(quoteIdent).join(", ")})`);
  }
  return `CREATE TABLE ${quoteIdent(table.name)} (\n${lines.join(",\n")}\n);`;
}

function buildIndexExpression(column) {
  if (column.prefixLength) {
    return `left(${quoteIdent(column.name)}::text, ${column.prefixLength})`;
  }
  return quoteIdent(column.name);
}

function buildIndexesSql(table) {
  const statements = [];
  const usedNames = new Set();

  for (const index of table.uniqueIndexes) {
    let indexName = makeName(table.name, index.name);
    if (usedNames.has(indexName)) indexName = makeName(table.name, index.name, "uniq");
    usedNames.add(indexName);
    statements.push(
      `CREATE UNIQUE INDEX ${quoteIdent(indexName)} ON ${quoteIdent(table.name)} (${index.columns.map(buildIndexExpression).join(", ")});`,
    );
  }

  for (const index of table.indexes) {
    let indexName = makeName(table.name, index.name);
    if (usedNames.has(indexName)) indexName = makeName(table.name, index.name, "idx");
    usedNames.add(indexName);
    statements.push(
      `CREATE INDEX ${quoteIdent(indexName)} ON ${quoteIdent(table.name)} (${index.columns.map(buildIndexExpression).join(", ")});`,
    );
  }

  return statements;
}

function buildSchemaSql(tables) {
  const orderedTables = [...tables.values()];
  const lines = [
    "-- Legacy safarihost schema converted from MariaDB to PostgreSQL.",
    "-- Generated by scripts/legacy-rebuild-from-dump.cjs",
    "-- Encoding: UTF-8",
    "",
    "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
    "",
  ];

  for (const table of [...orderedTables].reverse()) {
    lines.push(`DROP TABLE IF EXISTS ${quoteIdent(table.name)} CASCADE;`);
  }
  lines.push("");

  for (const table of orderedTables) {
    lines.push(buildCreateTableSql(table), "");
  }

  for (const table of orderedTables) {
    const indexes = buildIndexesSql(table);
    if (indexes.length > 0) {
      lines.push(...indexes, "");
    }
  }

  return `${lines.join("\n")}\n`;
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
    connectionTimeoutMillis: 10000,
  });
}

async function dropPublicObjects(client) {
  const tables = await client.query(
    "select tablename from pg_tables where schemaname = 'public' order by tablename",
  );
  for (const row of tables.rows) {
    await client.query(`DROP TABLE IF EXISTS ${quoteIdent(row.tablename)} CASCADE`);
  }

  const enums = await client.query(
    "select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typtype = 'e' order by t.typname",
  );
  for (const row of enums.rows) {
    await client.query(`DROP TYPE IF EXISTS ${quoteIdent(row.typname)} CASCADE`);
  }

  return { droppedTables: tables.rows.length, droppedEnums: enums.rows.length };
}

async function insertRows(client, table, rows) {
  if (!rows.length) return 0;

  const columnNames = table.columns.map((column) => column.name);
  const columnsSql = columnNames.map(quoteIdent).join(", ");
  const chunkSize = Math.max(1, Math.floor(60000 / columnNames.length));
  let inserted = 0;

  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const params = [];
    const valueGroups = chunk.map((values) => {
      const placeholders = values.map((value) => {
        params.push(value);
        return `$${params.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    await client.query(
      `INSERT INTO ${quoteIdent(table.name)} (${columnsSql}) VALUES ${valueGroups.join(", ")}`,
      params,
    );
    inserted += chunk.length;
  }

  return inserted;
}

async function syncIdentitySequences(client, tables) {
  for (const table of tables.values()) {
    for (const column of table.columns) {
      if (!/\bAUTO_INCREMENT\b/i.test(column.definition)) continue;
      await client.query(
        `SELECT setval(pg_get_serial_sequence($1, $2), COALESCE((SELECT MAX(${quoteIdent(column.name)}) FROM ${quoteIdent(table.name)}), 0) + 1, false)`,
        [table.name, column.name],
      );
    }
  }
}

async function applyRebuild(schemaSql, tables, rowsByTable) {
  const pool = getPool();
  const client = await pool.connect();
  const inserted = {};

  try {
    await client.query("SET statement_timeout TO 0");
    await client.query("BEGIN");
    const dropped = await dropPublicObjects(client);
    await client.query(schemaSql);

    for (const table of tables.values()) {
      inserted[table.name] = await insertRows(client, table, rowsByTable.get(table.name) || []);
    }

    await syncIdentitySequences(client, tables);
    await client.query("COMMIT");
    return { ...dropped, inserted };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

function writeOutputs(args, report, schemaSql) {
  fs.mkdirSync(args.outDir, { recursive: true });
  const schemaPath = path.join(ROOT, "database", "legacy-safarihost.postgres.sql");
  const reportPath = path.join(args.outDir, "legacy-rebuild-from-dump.json");
  const markdownPath = path.join(args.outDir, "legacy-rebuild-from-dump.md");

  fs.writeFileSync(schemaPath, schemaSql, "utf8");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderMarkdown(report, schemaPath), "utf8");

  return { schemaPath, reportPath, markdownPath };
}

function renderMarkdown(report, schemaPath) {
  const lines = [
    "# Legacy schema rebuild",
    "",
    `- Source: \`${report.source.path}\``,
    `- Dump completed at: ${report.source.dumpCompletedAt || "unknown"}`,
    `- SHA-256: \`${report.source.sha256}\``,
    `- Mode: ${report.mode}`,
    `- Generated schema: \`${schemaPath}\``,
    "",
    "## Summary",
    "",
    `- Legacy tables: ${report.counts.tables}`,
    `- Legacy columns: ${report.counts.columns}`,
    `- Legacy rows parsed: ${report.counts.rows}`,
  ];

  if (report.applyResult) {
    lines.push(
      `- Dropped current tables: ${report.applyResult.droppedTables}`,
      `- Dropped enum types: ${report.applyResult.droppedEnums}`,
      `- Inserted rows: ${Object.values(report.applyResult.inserted).reduce((sum, count) => sum + count, 0)}`,
    );
  }

  lines.push("", "## Tables", "", "| Table | Columns | Rows |", "| --- | ---: | ---: |");
  for (const table of report.tables) {
    lines.push(`| \`${table.name}\` | ${table.columns} | ${table.rows} |`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function extractDumpCompletedAt(sql) {
  const match = sql.match(/-- Dump completed on ([0-9-]+ [0-9:]+)/);
  return match ? match[1].replace(" ", "T") : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dumpPath = path.resolve(args.dump);
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Legacy dump was not found: ${dumpPath}`);
  }

  const dumpSql = readUtf8(dumpPath);
  const tables = extractCreateTables(dumpSql);
  const rowsByTable = extractRows(dumpSql, tables);
  const schemaSql = buildSchemaSql(tables);

  let applyResult = null;
  if (args.apply) {
    applyResult = await applyRebuild(schemaSql, tables, rowsByTable);
  }

  const report = {
    mode: args.apply ? "apply" : "dry-run",
    source: {
      path: dumpPath,
      sha256: crypto.createHash("sha256").update(dumpSql).digest("hex"),
      dumpCompletedAt: extractDumpCompletedAt(dumpSql),
    },
    counts: {
      tables: tables.size,
      columns: [...tables.values()].reduce((sum, table) => sum + table.columns.length, 0),
      rows: [...rowsByTable.values()].reduce((sum, rows) => sum + rows.length, 0),
    },
    tables: [...tables.values()].map((table) => ({
      name: table.name,
      columns: table.columns.length,
      rows: rowsByTable.get(table.name)?.length || 0,
    })),
    applyResult,
  };

  const output = writeOutputs(args, report, schemaSql);
  console.log(args.apply ? "Legacy database rebuild applied." : "Legacy database rebuild dry-run completed.");
  console.log(`Tables: ${report.counts.tables}`);
  console.log(`Columns: ${report.counts.columns}`);
  console.log(`Rows: ${report.counts.rows}`);
  if (applyResult) {
    console.log(`Dropped tables: ${applyResult.droppedTables}`);
    console.log(`Dropped enum types: ${applyResult.droppedEnums}`);
  }
  console.log(`Schema SQL: ${output.schemaPath}`);
  console.log(`Report: ${output.markdownPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
