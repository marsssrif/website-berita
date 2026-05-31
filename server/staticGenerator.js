import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function esc(s=""){
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function slugify(text=""){
  return text.toLowerCase().trim()
    .replace(/["']/g,"")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/-+/g,"-")
    .replace(/(^-|-$)/g,"");
}

function makeExcerpt(a){
  const s = (a.excerpt || a.body || "").trim().replace(/\s+/g, " ");
  return s.length > 160 ? (s.slice(0,157) + "...") : s;
}

function tagsRow(a){
  const tags = Array.isArray(a.tags) ? a.tags.slice(0,8) : [];
  if(!tags.length) return "";
  const navKey = esc(a.navKey || "berita-utama");
  const chips = tags.map(t => `<a class="tagChip" href="../kategori.html?cat=${navKey}&q=${esc(t)}">#${esc(t)}</a>`).join("");
  return `<div class="tagRow">${chips}</div>`;
}

function relatedCards(all, a, limit=4){
  const tags = new Set((a.tags||[]).map(x => String(x).toLowerCase()));
  const score = (n) => (n.tags||[]).reduce((s,t)=> s + (tags.has(String(t).toLowerCase())?1:0), 0);
  const cand = (all||[]).filter(n => n.slug !== a.slug);
  const scored = cand.map(n => ({ n, s: score(n) })).sort((x,y)=> y.s-x.s);
  let rel = scored.filter(x=>x.s>0).slice(0,limit).map(x=>x.n);
  if(rel.length < limit){
    const same = cand.filter(n => (n.navKey||"") === (a.navKey||""));
    for(const n of same){
      if(rel.find(x=>x.slug===n.slug)) continue;
      rel.push(n);
      if(rel.length>=limit) break;
    }
  }
  return rel.slice(0,limit).map(n => `
      <a class="cardNews" href="./${esc(n.slug)}.html">
        <div class="cardNews__img" style="background-image:url('${esc(n.image||"")}')"></div>
        <div class="cardNews__body">
          <span class="badge red">${esc(n.category||"")}</span>
          <h3 class="cardNews__title">${esc(n.title||"")}</h3>
          <div class="meta">${esc(n.date||"")} • ${esc(n.author||"")}</div>
        </div>
      </a>
  `).join("");
}

function navHtml(){
  return `
  <nav class="nav">
    <div class="container nav__inner">
      <a href="../kategori.html?cat=berita-utama">BERITA UTAMA</a>
      <a href="../kategori.html?cat=ekonomi-bisnis">EKONOMI & BISNIS</a>
      <a href="../kategori.html?cat=internasional">INTERNASIONAL</a>
      <a href="../kategori.html?cat=nasional">NASIONAL</a>
      <a href="../kategori.html?cat=properti-infrastruktur">PROPERTI DAN INFRASTRUKTUR</a>

      <div class="navItem" id="lainnyaWrap">
        <button class="dropBtn" type="button">LAINNYA ▾</button>
        <div class="dropMenu" role="menu" aria-label="Lainnya">
          <a href="../kategori.html?cat=teknologi" role="menuitem">TEKNOLOGI</a>
          <a href="../kategori.html?cat=olahraga" role="menuitem">OLAHRAGA</a>
          <a href="../kategori.html?cat=hiburan" role="menuitem">HIBURAN</a>
          <a href="../kategori.html?cat=gaya-hidup" role="menuitem">GAYA HIDUP</a>
          <a href="../kategori.html?cat=pendidikan" role="menuitem">PENDIDIKAN</a>
        </div>
      </div>
    </div>
  </nav>
  `;
}

function dropdownScript(){
  return `
  <script>
    (function(){
      const wrap = document.getElementById("lainnyaWrap");
      if(!wrap) return;
      const btn = wrap.querySelector(".dropBtn");
      btn.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        wrap.classList.toggle("open");
      });
      document.addEventListener("click", (e) => {
        if(!wrap.contains(e.target)) wrap.classList.remove("open");
      }, true);
    })();
  </script>
  `;
}

export function renderStaticArticleHTML(article, allArticles){
  const a = article;
  const desc = makeExcerpt(a);
  const url = `./${esc(a.slug)}.html`;
  const bodyHtml = esc(a.body || "").replace(/\n/g, "<br><br>");
  const ld = {
    "@context":"https://schema.org",
    "@type":"NewsArticle",
    "headline": a.title,
    "image": [a.image || ""],
    "datePublished": a.date || "",
    "author": {"@type":"Person","name": a.author || "Redaksi"},
    "publisher": {"@type":"Organization","name":"Berita Krian"},
    "description": desc,
    "mainEntityOfPage": url
  };

  const rel = relatedCards(allArticles || [], a, 4);

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(a.title)} — Berita Krian</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${esc(url)}" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Berita Krian" />
  <meta property="og:title" content="${esc(a.title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image" content="${esc(a.image || "")}" />
  <meta property="og:url" content="${esc(url)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(a.title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${esc(a.image || "")}" />

  <script type="application/ld+json">${esc(JSON.stringify(ld))}</script>

  <link rel="stylesheet" href="../styles.css" />
</head>
<body>
  <div class="topbar">
    <div class="container topbar__inner">
      <div class="topbar__left">
        <a class="topbar__btn" href="#">✉ KIRIM PRESS RELEASE</a>
        <a class="topbar__btn" href="#">☎ CONTACT US</a>
      </div>
      <div class="topbar__right">
        <a class="topbar__link" href="../admin.html">Admin</a>
      </div>
    </div>
  </div>

  <header class="brand">
    <div class="container brand__inner">
      <a class="brand__logo" href="../index.html" aria-label="Home">
        <div class="logoMark">BK</div>
        <div class="logoText">
          <div class="logoText__big">BERITA</div>
          <div class="logoText__big red">KRIAN</div>
        </div>
      </a>
    </div>
  </header>

  ${navHtml()}
  ${dropdownScript()}

  <main class="container main detailMain">
    <section class="detail">
      <div class="breadcrumb">
        <a href="../index.html">Home</a>
        <span class="crumbSep">›</span>
        <a href="../kategori.html?cat=${esc(a.navKey || "berita-utama")}">${esc(a.navKey || "")}</a>
        <span class="crumbSep">›</span>
        <span>${esc(a.title)}</span>
      </div>

      <div class="detail__card">
        <div class="detail__cover" style="background-image:url('${esc(a.image || "")}')"></div>
        <div class="detail__body">
          <span class="detail__cat">${esc(a.category || "")}</span>
          <h1 class="detail__title">${esc(a.title)}</h1>
          <div class="detail__meta">${esc(a.date || "")} • ${esc(a.author || "Redaksi")}</div>
          ${tagsRow(a)}
          <div class="detail__text">${bodyHtml}</div>
        </div>
      </div>

      <section class="section" style="margin-top:16px">
        <div class="section__head">
          <h2>Berita Terkait</h2>
          <div class="section__tools muted">Berdasarkan tag/kategori</div>
        </div>
        <div class="newsList">${rel}</div>
      </section>
    </section>

    <aside class="detailSide">
      <div class="ad__box">
        <div class="ad__label">ADVERTISEMENT</div>
        <div class="ad__mock">300 x 600</div>
      </div>
    </aside>
  </main>

  <footer class="footer">
    <div class="container footer__inner">
      <div>© <span id="year"></span> Berita Krian</div>
      <div class="muted">Static detail • OG/SEO server-rendered</div>
    </div>
  </footer>

  <script src="../config.js"></script>
  <script src="../analytics.js"></script>
  <script>document.getElementById("year").textContent = new Date().getFullYear();</script>
</body>
</html>`;
}

/**
 * Writes the static page into MULTIPLE possible roots.
 * Reason: some users run the backend in a different folder than their Live Server root.
 * We write to:
 *  - moduleRoot (server/..)
 *  - cwdRoot (process.cwd()/..)
 *  - optional env OUTPUT_ROOT (absolute or relative)
 */
export function writeStaticArticleMulti(article, allArticles){
  const safeSlug = slugify(article.slug || article.title || "");
  if(!safeSlug) throw new Error("Invalid slug");

  const html = renderStaticArticleHTML({ ...article, slug: safeSlug }, allArticles);

  const moduleRoot = path.join(__dirname, "..");                 // server/..
  const cwdRoot = path.resolve(process.cwd(), "..");             // if started from server/
  const envRootRaw = process.env.OUTPUT_ROOT || "";
  const envRoot = envRootRaw ? path.resolve(envRootRaw) : null;

  const roots = [moduleRoot, cwdRoot];
  if(envRoot) roots.push(envRoot);

  // de-duplicate roots
  const uniqRoots = Array.from(new Set(roots.map(r => path.resolve(r))));

  const written = [];
  for(const root of uniqRoots){
    const outDir = path.join(root, "berita");
    if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const filePath = path.join(outDir, `${safeSlug}.html`);
    fs.writeFileSync(filePath, html, "utf-8");
    written.push(filePath);
  }

  return { slug: safeSlug, written };
}
