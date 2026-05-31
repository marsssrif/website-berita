import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

import { openDb, get, all, run } from "./db.js";
import { initSchema } from "./init.js";
import { signToken, requireAuth, requireRole } from "./auth.js";
import { slugify, nowIso } from "./util.js";
import { writeStaticArticleMulti } from "./staticGenerator.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

// Serve generated static pages + assets so preview works even if you open from backend origin
app.use(express.static(ROOT_DIR));

await initSchema();

app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: false }));

app.get("/api/health", (req,res)=>res.json({ ok:true }));

app.post("/api/auth/login", async (req,res)=>{
  const { username, password } = req.body || {};
  if(!username || !password) return res.status(400).json({ error:"Missing username/password" });
  const db = openDb();
  const user = await get(db, "SELECT id, username, password_hash, role FROM users WHERE username=?", [username]);
  db.close();
  if(!user) return res.status(401).json({ error:"Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if(!ok) return res.status(401).json({ error:"Invalid credentials" });
  const token = signToken({ sub: user.id, username: user.username, role: user.role });
  res.json({ token, user: { username: user.username, role: user.role } });
});

app.post("/api/auth/me", requireAuth, (req,res)=>{
  res.json({ user: { username: req.user.username, role: req.user.role } });
});

app.post("/api/email/send", requireAuth, requireRole(["admin", "editor"]), async (req, res) => {
  const { to, subject, text } = req.body || {};
  if (!to || !subject || !text) {
    return res.status(400).json({ error: "Missing to, subject, or text fields" });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return res.status(501).json({ error: "SMTP configuration is incomplete. Please check server/.env file." });
  }

  const secure = process.env.SMTP_SECURE === "true";

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: secure,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    const mailOptions = {
      from: SMTP_FROM || SMTP_USER,
      to,
      subject,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    res.json({ ok: true, info: info.response });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ error: err.message || "Failed to send email" });
  }
});

app.get("/api/articles", async (req,res)=>{
  const { q="", cat="", page="1", per="10", status="published" } = req.query;
  const pageNum = Math.max(1, parseInt(page,10) || 1);
  const perNum = Math.min(50, Math.max(1, parseInt(per,10) || 10));
  const offset = (pageNum-1)*perNum;

  const where=[]; const params=[];
  if(status){ where.push("status=?"); params.push(String(status)); }
  if(cat){ where.push("navKey=?"); params.push(String(cat)); }
  if(q){
    where.push("(title LIKE ? OR excerpt LIKE ? OR body LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const whereSql = where.length ? ("WHERE " + where.join(" AND ")) : "";

  const db = openDb();
  const totalRow = await get(db, `SELECT COUNT(*) as n FROM articles ${whereSql}`, params);
  const rows = await all(db, `SELECT slug,title,excerpt,category,navKey,tags_json,author,date,image,status,updated_at
    FROM articles ${whereSql}
    ORDER BY date DESC, updated_at DESC
    LIMIT ? OFFSET ?`, [...params, perNum, offset]);
  db.close();

  res.json({ page: pageNum, per: perNum, total: totalRow.n, items: rows.map(r=>({ ...r, tags: JSON.parse(r.tags_json||"[]") })) });
});

app.get("/api/articles/:slug", async (req,res)=>{
  const slug = req.params.slug;
  const db = openDb();
  const row = await get(db, `SELECT slug,title,excerpt,body,category,navKey,tags_json,author,date,image,status,updated_at
    FROM articles WHERE slug=?`, [slug]);
  db.close();
  if(!row) return res.status(404).json({ error:"Not found" });
  res.json({ ...row, tags: JSON.parse(row.tags_json||"[]") });
});

// Admin CRUD (editor/admin)
app.post("/api/articles", requireAuth, requireRole(["admin","editor"]), async (req,res)=>{
  const a = req.body || {};
  if(!a.title) return res.status(400).json({ error:"Missing title" });
  const slug = slugify(a.slug || a.title);
  if(!slug) return res.status(400).json({ error:"Invalid slug" });

  const db = openDb();
  const exists = await get(db, "SELECT id FROM articles WHERE slug=?", [slug]);
  if(exists){ db.close(); return res.status(409).json({ error:"Slug already exists" }); }

  const now = nowIso();
  await run(db, `INSERT INTO articles(slug,title,excerpt,body,category,navKey,tags_json,author,date,image,status,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?, ?,?)`, [
    slug, a.title, a.excerpt||"", a.body||"", a.category||"", a.navKey||"",
    JSON.stringify(a.tags||[]), a.author||"Redaksi", a.date||"", a.image||"", a.status||"published", now, now
  ]);
  db.close();
  res.status(201).json({ ok:true, slug });
});

app.put("/api/articles/:slug", requireAuth, requireRole(["admin","editor"]), async (req,res)=>{
  const slug = slugify(req.params.slug || "");
  const a = req.body || {};
  const db = openDb();
  const row = await get(db, "SELECT id FROM articles WHERE slug=?", [slug]);
  if(!row){ db.close(); return res.status(404).json({ error:"Not found" }); }

  await run(db, `UPDATE articles SET title=?, excerpt=?, body=?, category=?, navKey=?, tags_json=?, author=?, date=?, image=?, status=?, updated_at=?
    WHERE slug=?`, [
    a.title||"", a.excerpt||"", a.body||"", a.category||"", a.navKey||"",
    JSON.stringify(a.tags||[]), a.author||"Redaksi", a.date||"", a.image||"", a.status||"published", nowIso(), slug
  ]);
  db.close();
  res.json({ ok:true });
});

app.delete("/api/articles/:slug", requireAuth, requireRole(["admin"]), async (req,res)=>{
  const slug = slugify(req.params.slug || "");
  const db = openDb();
  await run(db, "DELETE FROM articles WHERE slug=?", [slug]);
  db.close();
  res.json({ ok:true });
});

// Admin: create user
app.post("/api/users", requireAuth, requireRole(["admin"]), async (req,res)=>{
  const { username, password, role } = req.body || {};
  if(!username || !password || !role) return res.status(400).json({ error:"Missing fields" });
  if(!["admin","editor","viewer"].includes(role)) return res.status(400).json({ error:"Invalid role" });
  const hash = await bcrypt.hash(password, 12);

  const db = openDb();
  try{
    await run(db, "INSERT INTO users(username,password_hash,role,created_at) VALUES(?,?,?,?)", [username, hash, role, nowIso()]);
  }catch{
    db.close(); return res.status(409).json({ error:"Username exists" });
  }
  db.close();
  res.status(201).json({ ok:true });
});


// Publish & Auto Generate Static SEO (editor/admin)
app.post("/api/articles/publish", requireAuth, requireRole(["admin","editor"]), async (req,res)=>{
  const a = req.body || {};
  if(!a.title) return res.status(400).json({ error:"Missing title" });

  const slug = slugify(a.slug || a.title);
  if(!slug) return res.status(400).json({ error:"Invalid slug" });

  const db = openDb();
  const row = await get(db, "SELECT id FROM articles WHERE slug=?", [slug]);
  const now = nowIso();

  if(!row){
    await run(db, `INSERT INTO articles(slug,title,excerpt,body,category,navKey,tags_json,author,date,image,status,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?, ?,?)`, [
      slug, a.title, a.excerpt||"", a.body||"", a.category||"", a.navKey||"",
      JSON.stringify(a.tags||[]), a.author||"Redaksi", a.date||"", a.image||"", "published", now, now
    ]);
  }else{
    await run(db, `UPDATE articles SET title=?, excerpt=?, body=?, category=?, navKey=?, tags_json=?, author=?, date=?, image=?, status=?, updated_at=?
      WHERE slug=?`, [
      a.title||"", a.excerpt||"", a.body||"", a.category||"", a.navKey||"",
      JSON.stringify(a.tags||[]), a.author||"Redaksi", a.date||"", a.image||"", "published", now, slug
    ]);
  }

  const rows = await all(db, `SELECT slug,title,excerpt,body,category,navKey,tags_json,author,date,image,status,updated_at
    FROM articles WHERE status='published' ORDER BY date DESC, updated_at DESC LIMIT 300`);
  db.close();

  const items = rows.map(r => ({ ...r, tags: JSON.parse(r.tags_json||"[]") }));
  const current = items.find(x => x.slug === slug) || { ...a, slug, status:"published" };

  const out = writeStaticArticleMulti(current, items);
  res.json({ ok:true, slug: out.slug, written: out.written });
});


const port = parseInt(process.env.PORT || "5175", 10);
app.listen(port, ()=>console.log("API server running http://localhost:"+port));
