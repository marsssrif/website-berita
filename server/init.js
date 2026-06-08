import { openDb, run, all } from "./db.js";
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
  // Check if we need to migrate the ads table to remove UNIQUE constraint
  try {
    const indexes = await all(db, "PRAGMA index_list(ads)");
    const hasUnique = indexes.some(idx => idx.unique === 1 && idx.origin === 'u');
    if (hasUnique) {
      console.log("Migrating 'ads' table: dropping old ads table with UNIQUE constraint...");
      await run(db, "DROP TABLE IF EXISTS ads;");
    }
  } catch (err) {
    // ignore if table doesn't exist yet
  }

  await run(db, `CREATE TABLE IF NOT EXISTS ads(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot TEXT NOT NULL,
    image TEXT NOT NULL DEFAULT '',
    link TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );`);
  await run(db, `CREATE TABLE IF NOT EXISTS press_releases(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT,
    org TEXT,
    email TEXT,
    telp TEXT,
    web TEXT,
    kategori TEXT,
    tanggal TEXT,
    judul TEXT,
    isi TEXT,
    catatan TEXT,
    photos_json TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'menunggu',
    status_ts TEXT,
    status_by TEXT,
    created_at TEXT NOT NULL
  );`);
  await run(db, `CREATE TABLE IF NOT EXISTS contact_messages(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT,
    email TEXT,
    telp TEXT,
    subjek TEXT,
    pesan TEXT,
    screenshot_json TEXT,
    created_at TEXT NOT NULL
  );`);
  db.close();
}
