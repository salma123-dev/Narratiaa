import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  try { process.loadEnvFile(".env"); } catch { /* DATABASE_URL may be supplied by the shell. */ }
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for the PostgreSQL target.");

const sqlitePath = process.env.SQLITE_PATH || resolve("storage/legacy/narratiaa.db");
const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
const tables = [
  ["users", ["id","full_name","email","password_hash","password_salt","created_at"]],
  ["reader_profiles", ["user_id","favorite_genres","onboarding_completed","updated_at"]],
  ["books", ["id","user_id","title","author","genre","description","cover_url","total_pages","current_page","status","favorite","started_at","finished_at","created_at","updated_at"]],
  ["reading_sessions", ["id","user_id","book_id","start_page","end_page","minutes","read_at","created_at"]],
  ["journal_entries", ["id","user_id","book_id","type","content","page_number","tags","created_at","updated_at"]],
  ["goals", ["user_id","daily_type","daily_target","annual_books","updated_at"]],
];

const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query(readFileSync(resolve("server/schema.postgres.sql"), "utf8"));
  for (const [table, columns] of tables) {
    const rows = sqlite.prepare(`SELECT ${columns.join(",")} FROM ${table}`).all();
    for (const row of rows) {
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(",");
      const updates = columns.filter((column) => column !== "id" && column !== "user_id").map((column) => `${column}=EXCLUDED.${column}`).join(",");
      const conflictColumn = columns.includes("id") ? "id" : "user_id";
      const conflict = updates ? `DO UPDATE SET ${updates}` : "DO NOTHING";
      await client.query(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders}) ON CONFLICT (${conflictColumn}) ${conflict}`, columns.map((column) => row[column]));
    }
    console.log(`${table}: ${rows.length} row(s) transferred`);
  }
  for (const table of ["users","books","reading_sessions","journal_entries"]) {
    await client.query(`SELECT setval(pg_get_serial_sequence('${table}','id'), COALESCE((SELECT MAX(id) FROM ${table}),1), (SELECT COUNT(*)>0 FROM ${table}))`);
  }
  await client.query("COMMIT");
  console.log("SQLite to PostgreSQL transfer completed.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  sqlite.close(); client.release(); await pool.end();
}
