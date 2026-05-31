const { esc, slugify, getParam, makeExcerpt } = window.Utils;

function buildDetailUrl(article){
  const slug = slugify(article.title);
  return `./detail.html?slug=${encodeURIComponent(slug)}`;
}

function catLink(navKey){
  return `./kategori.html?cat=${encodeURIComponent(navKey)}`;
}

function renderNav(activeKey){
  const nav = document.querySelector("#navCats");
  if(!nav) return;
  nav.innerHTML = "";

  function linkForCat(key){ return `./kategori.html?cat=${encodeURIComponent(key)}`; }

  window.CATEGORIES.forEach(cat => {
    const a = document.createElement("a");
    a.href = linkForCat(cat.key);
    a.textContent = cat.label;
    if(cat.key === activeKey) a.classList.add("active");
    nav.appendChild(a);
  });

  const wrap = document.createElement("div");
  wrap.className = "navItem";
  wrap.innerHTML = `
    <button class="dropBtn" type="button">LAINNYA ▾</button>
    <div class="dropMenu" role="menu" aria-label="Lainnya">
      ${window.OTHERS.map(x => `
        <a href="${linkForCat(x.key)}" role="menuitem">${window.Utils.esc(x.label)}</a>
      `).join("")}
    </div>
  `;
  nav.appendChild(wrap);

  const btn = wrap.querySelector(".dropBtn");
  const menu = wrap.querySelector(".dropMenu");
  function placeMenu(){
    // pastikan tombol terlihat (horizontal)
    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    // jadikan menu fixed di bawah tombol
    menu.classList.add("isFixed");
    menu.style.visibility = "hidden";
    menu.style.display = "block";
    // ukur lebar menu setelah tampil
    const r = btn.getBoundingClientRect();
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const w = menu.offsetWidth || 240;
    const h = menu.offsetHeight || 300;
    const margin = 12;
    let left = r.left;
    // clamp agar tidak keluar viewport
    left = Math.max(margin, Math.min(left, vw - w - margin));
    let top = r.bottom + 10;
    // kalau kebawah kepotong, tampilkan ke atas
    if(top + h > vh - margin){
      top = Math.max(margin, r.top - h - 10);
    }
    menu.style.left = left + "px";
    menu.style.top = top + "px";
    menu.style.visibility = "visible";
  }
  function resetMenu(){
    menu.classList.remove("isFixed");
    menu.style.left = "";
    menu.style.top = "";
    menu.style.visibility = "";
    menu.style.display = "";
  }
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const willOpen = !wrap.classList.contains("open");
    wrap.classList.toggle("open");
    if(willOpen){
      // tunggu class open terpasang baru hitung posisi
      setTimeout(placeMenu, 0);
    } else {
      resetMenu();
    }
  });
  document.addEventListener("click", (e) => {
    if(!wrap.contains(e.target)){
      wrap.classList.remove("open");
      resetMenu();
    }
  });
  window.addEventListener("resize", () => {
    if(wrap.classList.contains("open")) setTimeout(placeMenu, 0);
  });
  window.addEventListener("scroll", () => {
    if(wrap.classList.contains("open")) setTimeout(placeMenu, 0);
  }, { passive:true });
}


function findBySlug(allNews, slug){
  return allNews.find(n => slugify(n.title) === slug) || null;
}

function getCatLabel(catKey){
  const all = [...window.CATEGORIES, ...window.OTHERS];
  const f = all.find(x => x.key === catKey);
  return f ? f.label : "KATEGORI";
}

function renderBreadcrumb(article){
  const catLabel = getCatLabel(article.navKey);
  document.querySelector("#breadcrumb").innerHTML = `
    <a href="./index.html">Home</a>
    <span class="crumbSep">›</span>
    <a href="${catLink(article.navKey)}">${esc(catLabel)}</a>
    <span class="crumbSep">›</span>
    <span>${esc(article.title)}</span>
  `;
}

function renderTags(article){
  const tags = (article.tags || []).slice(0, 8);
  if(tags.length === 0) return "";
  const chips = tags.map(t => `<a class="tagChip" href="${catLink(article.navKey)}&q=${encodeURIComponent(t)}">#${esc(t)}</a>`).join("");
  return `<div class="tagRow">${chips}</div>`;
}

function renderDetail(article){
  document.querySelector("#detailCard").innerHTML = `
    <div class="detail__cover" style="background-image:url('${article.image}')"></div>
    <div class="detail__body">
      <span class="detail__cat">${esc(article.category)}</span>
      <h1 class="detail__title">${esc(article.title)}</h1>
      <div class="detail__meta">${esc(article.date)} • ${esc(article.author)}</div>
      ${renderTags(article)}
      <div class="detail__text">${esc(article.body)}</div>
    </div>
  `;
}

function setSEO(article){
  const desc = makeExcerpt(article);
  const url = new URL(window.location.href).toString();

  document.querySelector("#pageTitle").textContent = `${article.title} — Portal Berita`;
  document.querySelector("#metaDesc").setAttribute("content", desc);

  document.querySelector("#canonicalLink").setAttribute("href", url);

  document.querySelector("#ogTitle").setAttribute("content", article.title);
  document.querySelector("#ogDesc").setAttribute("content", desc);
  document.querySelector("#ogImage").setAttribute("content", article.image);
  document.querySelector("#ogUrl").setAttribute("content", url);

  document.querySelector("#twTitle").setAttribute("content", article.title);
  document.querySelector("#twDesc").setAttribute("content", desc);
  document.querySelector("#twImage").setAttribute("content", article.image);

  // JSON-LD (NewsArticle)
  const ld = {
    "@context":"https://schema.org",
    "@type":"NewsArticle",
    "headline": article.title,
    "image": [article.image],
    "datePublished": article.date,
    "author": { "@type":"Person", "name": article.author },
    "publisher": { "@type":"Organization", "name":"Portal Berita" },
    "description": desc,
    "mainEntityOfPage": url
  };

  let el = document.querySelector("#jsonld");
  if(!el){
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "jsonld";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(ld);
}

function scoreByTag(a, tagsSet){
  let score = 0;
  for(const t of (a.tags || [])){
    if(tagsSet.has(String(t).toLowerCase())) score += 1;
  }
  return score;
}

function renderRelated(allNews, article){
  const tagsSet = new Set((article.tags || []).map(t => String(t).toLowerCase()));
  const candidates = allNews.filter(n => n.id !== article.id);

  const scored = candidates
    .map(n => ({ n, s: scoreByTag(n, tagsSet) }))
    .filter(x => x.s > 0)
    .sort((a,b) => b.s - a.s)
    .map(x => x.n);

  if(scored.length < 4){
    const sameCat = candidates.filter(n => n.navKey === article.navKey);
    for(const n of sameCat){
      if(!scored.some(x => x.id === n.id)) scored.push(n);
      if(scored.length >= 4) break;
    }
  }

  const related = scored.slice(0, 4);
  const hint = document.querySelector("#relatedHint");
  hint.textContent = (article.tags || []).length ? `Berdasarkan tag: ${(article.tags || []).slice(0,3).join(", ")}` : "Berdasarkan kategori";

  document.querySelector("#relatedList").innerHTML = related.length ? related.map(n => `
    <a class="cardNews" href="${buildDetailUrl(n)}">
      <div class="cardNews__img" style="background-image:url('${n.image}')"></div>
      <div class="cardNews__body">
        <span class="badge red">${esc(n.category)}</span>
        <h3 class="cardNews__title">${esc(n.title)}</h3>
        <div class="meta">${esc(n.date)} • ${esc(n.author)}</div>
      </div>
    </a>
  `).join("") : `<div class="muted" style="padding:14px">Belum ada berita terkait.</div>`;
}

function setupShare(article){
  const shareUrl = new URL(window.location.href).toString();
  const text = `${article.title}`;

  document.querySelector("#waBtn").href = `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`;
  document.querySelector("#xBtn").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  document.querySelector("#fbBtn").href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  const hint = document.querySelector("#copyHint");
  document.querySelector("#copyBtn").addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(shareUrl);
      hint.textContent = "Tersalin!";
      setTimeout(() => hint.textContent = "", 1500);
    }catch{
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      hint.textContent = "Tersalin!";
      setTimeout(() => hint.textContent = "", 1500);
    }
  });
}

function renderNotFound(){
  document.querySelector("#pageTitle").textContent = "Berita tidak ditemukan — Portal Berita";
  document.querySelector("#breadcrumb").innerHTML = `<a href="./index.html">Home</a> <span class="crumbSep">›</span> <span>404</span>`;
  document.querySelector("#detailCard").innerHTML = `
    <div class="detail__body">
      <span class="detail__cat">404</span>
      <h1 class="detail__title">Berita tidak ditemukan</h1>
      <div class="detail__meta">Cek link slug-nya atau kembali ke kategori.</div>
      <div class="shareRow" style="margin-top:14px">
        <a class="shareBtn dark" href="./index.html">← Home</a>
        <a class="shareBtn dark" href="./kategori.html?cat=berita-utama">Lihat kategori</a>
      </div>
    </div>
  `;
}


/* ===== TICKER ===== */
function initTicker(allNews){
  const track = document.querySelector("#tickerTrack");
  if(!track) return;
  const items = allNews.slice(0, 5);
  const html = [...items, ...items].map(n =>
    `<span class="ticker__item" onclick="location.href='${buildDetailUrl(n)}'">${esc(n.title)}</span><span class="ticker__sep">•</span>`
  ).join("");
  track.innerHTML = html;
}


/* ===== BOOKMARK ===== */
function setupBookmark(article){
  const btn = document.querySelector("#detailBookmarkBtn");
  const badge = document.querySelector("#bkBadge");
  if(!btn || !window.BookmarkStore) return;

  function refresh(){
    const saved = window.BookmarkStore.has(article.id);
    btn.classList.toggle("active", saved);
    if(badge) badge.textContent = window.BookmarkStore.count() || "";
  }
  refresh();

  btn.addEventListener("click", () => {
    if(window.BookmarkStore.has(article.id)){
      window.BookmarkStore.remove(article.id);
      window.Toast && window.Toast.show("Berita dihapus dari simpanan", "info");
    } else {
      window.BookmarkStore.add(article);
      window.Toast && window.Toast.show("Berita berhasil disimpan! 🔖", "bookmark");
    }
    refresh();
  });
}


/* ===== KOMENTAR ===== */
function renderComments(articleId){
  const list = document.querySelector("#commentList");
  const counter = document.querySelector("#commentCount");
  if(!list || !window.CommentStore) return;

  const comments = window.CommentStore.getForArticle(articleId);
  counter.textContent = comments.length ? `${comments.length} komentar` : "Belum ada komentar";

  if(!comments.length){
    list.innerHTML = `<div class="commentEmpty">Belum ada komentar. Jadilah yang pertama! 😊</div>`;
    return;
  }

  list.innerHTML = comments.map(c => `
    <div class="commentItem" data-cid="${c.id}">
      <div class="commentItem__head">
        <div>
          <span class="commentItem__name">👤 ${esc(c.name)}</span>
          <span class="commentItem__ts"> · ${esc(c.ts)}</span>
        </div>
        <button class="commentItem__del" onclick="deleteComment(${articleId},${c.id})" title="Hapus komentar">🗑 Hapus</button>
      </div>
      <div class="commentItem__text">${esc(c.text)}</div>
    </div>
  `).join("");
}

window.deleteComment = function(articleId, commentId){
  if(!window.CommentStore) return;
  window.CommentStore.delete(articleId, commentId);
  renderComments(articleId);
  window.Toast && window.Toast.show("Komentar dihapus", "info");
};

function initComments(article){
  const form = document.querySelector("#commentForm");
  if(!form || !window.CommentStore) return;

  renderComments(article.id);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.querySelector("#cmName").value.trim();
    const text = document.querySelector("#cmText").value.trim();
    if(!name){ window.Toast && window.Toast.show("Nama tidak boleh kosong!", "error"); return; }
    if(!text){ window.Toast && window.Toast.show("Komentar tidak boleh kosong!", "error"); return; }
    window.CommentStore.add(article.id, name, text);
    renderComments(article.id);
    form.reset();
    window.Toast && window.Toast.show("Komentar berhasil dikirim! 💬", "success");
  });
}

function init(){
  const now = new Date();
  if(document.querySelector("#year")) document.querySelector("#year").textContent = now.getFullYear();

  // Date displays
  const topbarDate = document.querySelector("#topbarDate");
  if(topbarDate) topbarDate.textContent = now.toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  // Live clock
  function updateClock(){
    const t = document.querySelector("#topbarTime");
    if(!t) return;
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,"0");
    const mm = String(d.getMinutes()).padStart(2,"0");
    const ss = String(d.getSeconds()).padStart(2,"0");
    t.textContent = `${hh}:${mm}:${ss}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Bookmark badge
  const badge = document.querySelector("#bkBadge");
  if(badge && window.BookmarkStore) badge.textContent = window.BookmarkStore.count() || "";

  const allNews = window.NewsStore.getAll();
  const slug = getParam("slug");

  if(!slug){
    renderNav("berita-utama");
    renderNotFound();
    return;
  }

  const article = findBySlug(allNews, slug);
  if(!article){
    renderNav("berita-utama");
    renderNotFound();
    return;
  }

  renderNav(article.navKey);
  renderBreadcrumb(article);
  setSEO(article);
  renderDetail(article);
  setupShare(article);
  renderRelated(allNews, article);
  initTicker(allNews);

  // Fitur baru
  setupBookmark(article);
  initComments(article);

  // Header search redirect
  const headerSearch = document.querySelector("#headerSearch");
  if(headerSearch){
    headerSearch.addEventListener("keydown", (e) => {
      if(e.key === "Enter" && headerSearch.value.trim())
        location.href = `./kategori.html?cat=berita-utama&q=${encodeURIComponent(headerSearch.value.trim())}`;
    });
  }

  // Scroll to Top
  const scrollBtn = document.querySelector("#scrollTopBtn");
  if(scrollBtn){
    window.addEventListener("scroll", () => scrollBtn.classList.toggle("show", window.scrollY > 400), { passive: true });
    scrollBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
}

document.addEventListener("DOMContentLoaded", init);
