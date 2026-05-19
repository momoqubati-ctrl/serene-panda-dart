import { dbPool } from "../db";

export type AdminColumn = {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue: string | null;
  maxLength: number | null;
};

export const tableExists = async (tableName: string) => {
  const result = await dbPool.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1
     LIMIT 1`,
    [tableName],
  );
  return result.rowCount > 0;
};

export const assertSafeTableName = (tableName: unknown) => {
  const value = String(tableName || "").trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) return "";
  return value;
};

export const listAdminTables = async () => {
  const tables = await dbPool.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
  );

  const results = [];
  for (const row of tables.rows) {
    const countResult = await dbPool.query<{ count: string }>(`SELECT count(*)::text AS count FROM "${row.table_name}"`);
    results.push({
      name: row.table_name,
      rowCount: Number(countResult.rows[0]?.count || 0),
    });
  }
  return results;
};

export const listAdminColumns = async (tableName: string): Promise<AdminColumn[]> => {
  const result = await dbPool.query(
    `SELECT
       column_name AS "name",
       data_type AS "dataType",
       is_nullable = 'YES' AS "nullable",
       column_default AS "defaultValue",
       character_maximum_length AS "maxLength"
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName],
  );
  return result.rows;
};

export const listTableRows = async (tableName: string, limit = 50, offset = 0) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const result = await dbPool.query(`SELECT * FROM "${tableName}" LIMIT $1 OFFSET $2`, [safeLimit, safeOffset]);
  return result.rows;
};

export const countTableRows = async (tableName: string) => {
  const result = await dbPool.query<{ count: string }>(`SELECT count(*)::text AS count FROM "${tableName}"`);
  return Number(result.rows[0]?.count || 0);
};

export const getPrimaryKeyColumn = async (tableName: string): Promise<string> => {
  try {
    const result = await dbPool.query<{ name: string }>(
      `SELECT a.attname AS name
       FROM pg_index i
       JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
       WHERE i.indrelid = $1::regclass AND i.indisprimary`,
      [tableName]
    );
    return result.rows[0]?.name || "id";
  } catch {
    return "id";
  }
};

const isSafeIdentifier = (val: string) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(val);

export const insertTableRow = async (tableName: string, data: Record<string, any>) => {
  const keys = Object.keys(data).filter(isSafeIdentifier);
  if (keys.length === 0) throw new Error("No safe fields to insert");
  
  const values = keys.map(k => data[k]);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  const columns = keys.map(k => `"${k}"`).join(", ");
  
  const query = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) RETURNING *`;
  const result = await dbPool.query(query, values);
  return result.rows[0];
};

export const updateTableRow = async (tableName: string, pkColumn: string, pkValue: any, data: Record<string, any>) => {
  const keys = Object.keys(data).filter(isSafeIdentifier);
  if (keys.length === 0) throw new Error("No safe fields to update");
  if (!isSafeIdentifier(pkColumn)) throw new Error("Invalid primary key column");

  const values = keys.map(k => data[k]);
  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
  values.push(pkValue);
  const pkPlaceholder = `$${values.length}`;
  
  const query = `UPDATE "${tableName}" SET ${setClause} WHERE "${pkColumn}" = ${pkPlaceholder} RETURNING *`;
  const result = await dbPool.query(query, values);
  return result.rows[0];
};

export const deleteTableRow = async (tableName: string, pkColumn: string, pkValue: any) => {
  if (!isSafeIdentifier(pkColumn)) throw new Error("Invalid primary key column");
  const query = `DELETE FROM "${tableName}" WHERE "${pkColumn}" = $1`;
  await dbPool.query(query, [pkValue]);
  return true;
};

