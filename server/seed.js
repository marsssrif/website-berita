import "dotenv/config";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { openDb, run, get } from "./db.js";
import { initSchema } from "./init.js";
import { slugify, nowIso } from "./util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(){
  await initSchema();
  const db = openDb();

  const defaultUsers = [
    { username: process.env.SEED_ADMIN_USERNAME || "admin", password: process.env.SEED_ADMIN_PASSWORD || "admin123", role: "admin" },
    { username: "editor", password: "editor123", role: "editor" },
    { username: "viewer", password: "viewer123", role: "viewer" }
  ];

  for (const u of defaultUsers) {
    const userExists = await get(db, "SELECT id FROM users WHERE username = ?", [u.username]);
    if (!userExists) {
      const uHash = await bcrypt.hash(u.password, 12);
      await run(db, "INSERT INTO users(username,password_hash,role,created_at) VALUES(?,?,?,?)", [u.username, uHash, u.role, nowIso()]);
      console.log(`Seeded user: ${u.username} (${u.role})`);
    }
  }

  const newsPath = path.join(__dirname, "..", "news.json");
  if(fs.existsSync(newsPath)){
    const items = JSON.parse(fs.readFileSync(newsPath, "utf-8"));
    for(const a of items){
      const slug = slugify(a.title || "");
      if(!slug) continue;
      const row = await get(db, "SELECT id FROM articles WHERE slug=?", [slug]);
      if(row) continue;
      await run(db, `INSERT INTO articles(slug,title,excerpt,body,category,navKey,tags_json,author,date,image,status,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?, ?,?)`, [
        slug, a.title||"", a.excerpt||"", a.body||"", a.category||"", a.navKey||"",
        JSON.stringify(a.tags||[]), a.author||"Redaksi", a.date||"", a.image||"",
        "published", nowIso(), nowIso()
      ]);
    }
    console.log("Seeded articles from news.json");
  }

  db.close();
}
main().catch(e=>{ console.error(e); process.exit(1); });
