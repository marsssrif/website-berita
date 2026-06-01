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

// Auto-take Kompas.id Content
app.post("/api/kompas/sync", requireAuth, requireRole(["admin", "editor"]), async (req, res) => {
  const { mode, token, domain, navKey, limit = 3 } = req.body || {};
  if (!mode) return res.status(400).json({ error: "Missing mode (simulasi/live)" });
  if (!navKey) return res.status(400).json({ error: "Missing target navKey" });

  let articlesToImport = [];

  if (mode === "simulasi") {
    // Generate high quality simulated articles
    const mockArticles = [
      {
        title: "Digitalisasi Pasar Tradisional di Jawa Timur Dorong Efisiensi Transaksi UMKM",
        slug: "digitalisasi-pasar-tradisional-jawa-timur-umkm",
        excerpt: "Penerapan sistem pembayaran digital QRIS dan digitalisasi tata kelola pedagang pasar di Jawa Timur terbukti melipatgandakan omzet UMKM lokal secara signifikan.",
        category: "EKONOMI & BISNIS",
        author: "Kabar Kompas",
        date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=75",
        body: "Surabaya, Kompas - Langkah digitalisasi pasar tradisional di berbagai wilayah Jawa Timur terus diakselerasi. Dinas Koperasi dan UMKM bekerja sama dengan Bank Indonesia menggalakkan penggunaan QRIS dan pencatatan keuangan digital bagi para pedagang.\n\nHasil evaluasi menunjukkan bahwa pasar-pasar yang telah menerapkan ekosistem digital mencatatkan peningkatan rata-rata omzet hingga 35 persen dalam kurun waktu enam bulan.\n\n\"Digitalisasi memotong rantai transaksi dan memberikan kepastian pencatatan keuangan bagi pedagang kecil. Mereka kini lebih mudah mengakses permodalan perbankan,\" ujar kepala dinas terkait.\n\nSelain pembayaran, sistem manajemen stok berbasis aplikasi sederhana juga mulai diperkenalkan guna mencegah kelangkaan bahan pokok di tingkat eceran.",
        tags: ["digitalisasi", "pasar", "umkm", "ekonomi", "jawatimur"]
      },
      {
        title: "Proyek Jalur Lingkar Selatan Sidoarjo Dipercepat Guna Kurangi Kemacetan Industri Krian",
        slug: "proyek-jalur-lingkar-selatan-sidoarjo-kemacetan-krian",
        excerpt: "Pemerintah Kabupaten Sidoarjo mempercepat pembangunan infrastruktur jalan lingkar selatan guna mengalihkan arus kendaraan besar dari pusat kota Krian.",
        category: "PROPERTI & INFRASTRUKTUR",
        author: "Harian Kompas",
        date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
        image: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1600&q=75",
        body: "Sidoarjo, Kompas - Menumpuknya kendaraan logistik bertonase besar di persimpangan jalan utama Krian menjadi perhatian serius Pemkab Sidoarjo. Jalur Lingkar Selatan sepanjang 8,5 kilometer ditargetkan rampung pada awal tahun depan.\n\nBupati Sidoarjo menyampaikan bahwa percepatan pembebasan lahan kini telah mencapai 92 persen. Konstruksi jalan beton (rigid pavement) dirancang khusus agar mampu menahan beban kendaraan hingga 12 ton.\n\n\"Kami ingin arus logistik industri tetap lancar tanpa harus mengorbankan kenyamanan pengendara sepeda motor dan warga di kawasan pemukiman Krian,\" jelasnya saat meninjau proyek.\n\nDengan selesainya jalur lingkar ini, kemacetan di kawasan perlintasan kereta api Krian diperkirakan berkurang drastis hingga 40 persen.",
        tags: ["infrastruktur", "jalan", "sidoarjo", "krian", "kemacetan"]
      },
      {
        title: "Menjaga Kelestarian Ekosistem Sungai Brantas Melalui Gerakan Restorasi Komunitas Hijau Sidoarjo",
        slug: "menjaga-kelestarian-sungai-brantas-restorasi-komunitas-hijau",
        excerpt: "Puluhan komunitas peduli lingkungan melakukan aksi bersih-bersih sampah plastik dan penanaman pohon pelindung di sepanjang bantaran Sungai Brantas Sidoarjo.",
        category: "LINGKUNGAN",
        author: "Kabar Kompas",
        date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=75",
        body: "Sidoarjo, Kompas - Restorasi ekologis Sungai Brantas menjadi agenda mendesak bagi komunitas lingkungan di Jawa Timur. Aksi kolaboratif akhir pekan kemarin berhasil mengumpulkan lebih dari 2,5 ton sampah plastik dari badan sungai.\n\nSelain pembersihan fisik, dilakukan pula penanaman 1.500 pohon vetiver dan bambu di tebing sungai guna mencegah erosi dan longsor bantaran.\n\nKoordinator gerakan menyatakan pentingnya partisipasi aktif warga bantaran. \"Sungai adalah sumber kehidupan, bukan tempat sampah raksasa. Edukasi pemilahan sampah dari rumah tangga terus kami galakkan,\" tuturnya.\n\nKegiatan ini juga didukung oleh sektor swasta setempat melalui dana tanggung jawab sosial perusahaan (CSR).",
        tags: ["lingkungan", "sungai", "brantas", "sidoarjo", "konservasi"]
      }
    ];

    articlesToImport = mockArticles.slice(0, Math.min(limit, mockArticles.length));
  } else {
    // Mode Live: Real API Call to Kompas.id
    if (!token || !domain) {
      return res.status(400).json({ error: "Token dan Domain wajib diisi untuk mode Live API" });
    }

    try {
      // 1. Fetch list of articles
      const listResponse = await fetch("https://apiner.kompas.id/v1/article/list", {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ domain_name: domain })
      });

      if (!listResponse.ok) {
        throw new Error(`Gagal memuat list artikel (Status: ${listResponse.status})`);
      }

      const listData = await listResponse.json();
      
      // Parse list data. The response can be an array containing an object with listofarticle
      let list = [];
      if (Array.isArray(listData)) {
        list = listData[0]?.listofarticle || [];
      } else if (listData && typeof listData === "object") {
        list = listData.listofarticle || listData.list || [];
      }

      if (!list || !list.length) {
        return res.status(404).json({ error: "Tidak ada artikel ditemukan dari API Kompas.id" });
      }

      // Slice to user selected limit
      const candidates = list.slice(0, limit);

      // 2. Fetch details for each candidate
      for (const item of candidates) {
        const postName = item.post_name;
        if (!postName) continue;

        const detailResponse = await fetch("https://apiner.kompas.id/v1/article/detail", {
          method: "POST",
          headers: {
            "Authorization": token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ domain_name: domain, post_name: postName })
        });

        if (!detailResponse.ok) {
          console.warn(`Gagal memuat detail artikel: ${postName}`);
          continue;
        }

        const detailData = await detailResponse.json();
        const articleObj = detailData?.article;
        if (!articleObj || !articleObj.post) continue;

        // Compile body value
        let bodyContent = "";
        const bodyItems = articleObj.body || [];
        if (Array.isArray(bodyItems)) {
          bodyItems.forEach(chunk => {
            if (chunk.type === "text" && chunk.value) {
              bodyContent += chunk.value + "\n\n";
            } else if (chunk.type === "image" && chunk.value) {
              bodyContent += `![gambar](${chunk.value})\n*${chunk.caption || ""}*\n\n`;
            } else if (chunk.type === "quote" && chunk.value) {
              bodyContent += `> ${chunk.value}\n\n`;
            }
          });
        }

        if (!bodyContent && articleObj.excerpt?.excerpt_text) {
          bodyContent = articleObj.excerpt.excerpt_text;
        }

        const categoryLabel = articleObj.post.term_name || "Nasional";
        const tags = articleObj.post.term_list ? articleObj.post.term_list.split(",") : [];

        articlesToImport.push({
          title: articleObj.post.post_title,
          slug: slugify(articleObj.post.post_name || articleObj.post.post_title),
          excerpt: articleObj.excerpt?.excerpt_text || articleObj.post.post_title,
          category: categoryLabel.toUpperCase(),
          author: articleObj.post.author?.post_published_by_display_name || "Kompas.id",
          date: articleObj.post.post_date || new Date().toLocaleDateString("id-ID"),
          image: articleObj.image?.featured_image_thumbnail_uri || item.featured_image_large_uri || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=75",
          body: bodyContent || "Konten tidak tersedia.",
          tags: tags
        });
      }

      if (!articlesToImport.length) {
        return res.status(500).json({ error: "Gagal memproses detail artikel dari API Kompas.id" });
      }

    } catch (err) {
      console.error("Kompas Sync Error:", err);
      return res.status(502).json({ error: `Gagal sinkronisasi Live API: ${err.message}` });
    }
  }

  // 3. Save to database & generate static pages
  const db = openDb();
  const importedSlugs = [];

  try {
    const now = nowIso();
    for (const art of articlesToImport) {
      const slug = slugify(art.slug || art.title);
      importedSlugs.push(slug);

      // Check if already exists
      const exists = await get(db, "SELECT id FROM articles WHERE slug=?", [slug]);

      if (!exists) {
        await run(db, `INSERT INTO articles(slug,title,excerpt,body,category,navKey,tags_json,author,date,image,status,created_at,updated_at)
          VALUES(?,?,?,?,?,?,?,?,?,?,? ,?,?)`, [
          slug, art.title, art.excerpt || "", art.body || "", art.category || "", navKey,
          JSON.stringify(art.tags || []), art.author || "Kompas.id", art.date || "", art.image || "", "published", now, now
        ]);
      } else {
        await run(db, `UPDATE articles SET title=?, excerpt=?, body=?, category=?, navKey=?, tags_json=?, author=?, date=?, image=?, status=?, updated_at=?
          WHERE slug=?`, [
          art.title, art.excerpt || "", art.body || "", art.category || "", navKey,
          JSON.stringify(art.tags || []), art.author || "Kompas.id", art.date || "", art.image || "", "published", now, slug
        ]);
      }
    }

    // Load all published articles for static sidebar/related links mapping
    const rows = await all(db, `SELECT slug,title,excerpt,body,category,navKey,tags_json,author,date,image,status,updated_at
      FROM articles WHERE status='published' ORDER BY date DESC, updated_at DESC LIMIT 300`);
    db.close();

    const items = rows.map(r => ({ ...r, tags: JSON.parse(r.tags_json || "[]") }));

    // Generate static page for each imported article
    for (const slug of importedSlugs) {
      const current = items.find(x => x.slug === slug);
      if (current) {
        writeStaticArticleMulti(current, items);
      }
    }

    res.json({ ok: true, count: importedSlugs.length, mode: mode, articles: articlesToImport });
  } catch (dbErr) {
    db.close();
    console.error("DB Error saving synced articles:", dbErr);
    res.status(500).json({ error: `Gagal menyimpan artikel hasil sinkronisasi: ${dbErr.message}` });
  }
});

const port = parseInt(process.env.PORT || "5175", 10);
app.listen(port, ()=>console.log("API server running http://localhost:"+port));
