import { openDb, run } from "./db.js";
export async function initSchema(){
  const db = openDb();
  await run(db, "PRAGMA foreign_keys = ON;");
  await run(db, `CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','editor','viewer')),
    created_at TEXT NOT NULL
  );`);
  await run(db, `CREATE TABLE IF NOT EXISTS articles(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    body TEXT,
    category TEXT,
    navKey TEXT,
    tags_json TEXT,
    author TEXT,
    date TEXT,
    image TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`);
  db.close();
}
