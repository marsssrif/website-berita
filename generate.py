#!/usr/bin/env python3
# generate.py - generate static pages per berita (OG/SEO 100% kebaca)
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "berita"
OUT.mkdir(exist_ok=True)

def slugify(text: str) -> str:
  text = text.lower().strip()
  text = re.sub(r"[\"']", "", text)
  text = re.sub(r"[^a-z0-9]+", "-", text)
  text = re.sub(r"-+", "-", text).strip("-")
  return text

def esc(s: str) -> str:
  return (s or "").replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace('"',"&quot;").replace("'","&#039;")

def excerpt(article):
  s = (article.get("excerpt") or article.get("body") or "").strip()
  s = re.sub(r"\s+", " ", s)
  return (s[:157] + "...") if len(s) > 160 else s

def related(all_news, a, limit=4):
  tags = set([t.lower() for t in (a.get("tags") or [])])
  def score(n):
    return sum(1 for t in (n.get("tags") or []) if t.lower() in tags)
  cand = [n for n in all_news if n.get("id") != a.get("id")]
  scored = sorted([(score(n), n) for n in cand], key=lambda x: x[0], reverse=True)
  rel = [n for s,n in scored if s > 0][:limit]
  if len(rel) < limit:
    same = [n for n in cand if n.get("navKey") == a.get("navKey")]
    for n in same:
      if n not in rel:
        rel.append(n)
      if len(rel) >= limit:
        break
  return rel[:limit]

def nav_html():
  return '''
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
  '''

def dropdown_script():
  return '''
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
  '''

def page_html(all_news, a):
  slug = slugify(a["title"])
  url = f"./{slug}.html"
  desc = excerpt(a)
  body_html = esc(a.get("body","")).replace("\n", "<br><br>")
  rel = related(all_news, a)

  tags = (a.get("tags") or [])[:8]
  tags_html = "".join([f'<a class="tagChip" href="../kategori.html?cat={esc(a.get("navKey","berita-utama"))}&q={esc(t)}">#{esc(t)}</a>' for t in tags])
  tags_html = f'<div class="tagRow">{tags_html}</div>' if tags else ""

  rel_cards = ""
  for n in rel:
    s2 = slugify(n["title"])
    rel_cards += f'''
      <a class="cardNews" href="./{s2}.html">
        <div class="cardNews__img" style="background-image:url('{esc(n.get("image",""))}')"></div>
        <div class="cardNews__body">
          <span class="badge red">{esc(n.get("category",""))}</span>
          <h3 class="cardNews__title">{esc(n.get("title",""))}</h3>
          <div class="meta">{esc(n.get("date",""))} • {esc(n.get("author",""))}</div>
        </div>
      </a>
    '''

  ld = {
    "@context":"https://schema.org",
    "@type":"NewsArticle",
    "headline": a["title"],
    "image": [a.get("image","")],
    "datePublished": a.get("date",""),
    "author": {"@type":"Person", "name": a.get("author","Redaksi")},
    "publisher": {"@type":"Organization", "name":"Berita Krian"},
    "description": desc,
    "mainEntityOfPage": url
  }
  ld_json = json.dumps(ld, ensure_ascii=False)

  return f'''<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{esc(a["title"])} — Berita Krian</title>
  <meta name="description" content="{esc(desc)}" />
  <link rel="canonical" href="{esc(url)}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Berita Krian" />
  <meta property="og:title" content="{esc(a["title"])}" />
  <meta property="og:description" content="{esc(desc)}" />
  <meta property="og:image" content="{esc(a.get("image",""))}" />
  <meta property="og:url" content="{esc(url)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{esc(a["title"])}" />
  <meta name="twitter:description" content="{esc(desc)}" />
  <meta name="twitter:image" content="{esc(a.get("image",""))}" />
  <script type="application/ld+json">{ld_json}</script>
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

  {nav_html()}
  {dropdown_script()}

  <main class="container main detailMain">
    <section class="detail">
      <div class="breadcrumb">
        <a href="../index.html">Home</a>
        <span class="crumbSep">›</span>
        <a href="../kategori.html?cat={esc(a.get("navKey","berita-utama"))}">{esc(a.get("navKey",""))}</a>
        <span class="crumbSep">›</span>
        <span>{esc(a["title"])}</span>
      </div>

      <div class="detail__card">
        <div class="detail__cover" style="background-image:url('{esc(a.get("image",""))}')"></div>
        <div class="detail__body">
          <span class="detail__cat">{esc(a.get("category",""))}</span>
          <h1 class="detail__title">{esc(a["title"])}</h1>
          <div class="detail__meta">{esc(a.get("date",""))} • {esc(a.get("author","Redaksi"))}</div>
          {tags_html}
          <div class="detail__text">{body_html}</div>
        </div>
      </div>

      <section class="section" style="margin-top:16px">
        <div class="section__head">
          <h2>Berita Terkait</h2>
          <div class="section__tools muted">Berdasarkan tag/kategori</div>
        </div>
        <div class="newsList">{rel_cards}</div>
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
  <script>document.getElementById("year").textContent = new Date().getFullYear();</script>
</body>
</html>
'''

def main():
  items = json.loads((ROOT / "news.json").read_text(encoding="utf-8"))
  items = [x for x in items if x.get("title")]
  for a in items:
    slug = slugify(a["title"])
    (OUT / f"{slug}.html").write_text(page_html(items, a), encoding="utf-8")
  print("Generated", len(items), "pages into", OUT)

if __name__ == "__main__":
  main()
