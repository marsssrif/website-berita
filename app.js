const { esc, slugify } = window.Utils;

function buildDetailUrl(article){
  const slug = slugify(article.title);
  return `./detail.html?slug=${encodeURIComponent(slug)}`;
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
    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    menu.classList.add("isFixed");
    menu.style.visibility = "hidden";
    menu.style.display = "block";
    const r = btn.getBoundingClientRect();
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const w = menu.offsetWidth || 240;
    const h = menu.offsetHeight || 300;
    const margin = 12;
    let left = r.left;
    left = Math.max(margin, Math.min(left, vw - w - margin));
    let top = r.bottom + 10;
    if(top + h > vh - margin){ top = Math.max(margin, r.top - h - 10); }
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
    if(willOpen){ setTimeout(placeMenu, 0); } else { resetMenu(); }
  });
  document.addEventListener("click", (e) => {
    if(!wrap.contains(e.target)){ wrap.classList.remove("open"); resetMenu(); }
  });
  window.addEventListener("resize", () => {
    if(wrap.classList.contains("open")) setTimeout(placeMenu, 0);
  });
  window.addEventListener("scroll", () => {
    if(wrap.classList.contains("open")) setTimeout(placeMenu, 0);
  }, { passive:true });
}


/* ===== BREAKING NEWS TICKER ===== */
function initTicker(allNews){
  const track = document.querySelector("#tickerTrack");
  if(!track) return;
  const items = allNews.slice(0, 5);
  if(!items.length) return;
  // duplikat untuk loop seamless
  const html = [...items, ...items].map(n =>
    `<span class="ticker__item" onclick="location.href='${buildDetailUrl(n)}'">${esc(n.title)}</span><span class="ticker__sep">•</span>`
  ).join("");
  track.innerHTML = html;
}


/* ===== BOOKMARK BADGE (topbar) ===== */
function updateBkBadge(){
  const badge = document.querySelector("#bkBadge");
  if(!badge || !window.BookmarkStore) return;
  const cnt = window.BookmarkStore.count();
  badge.textContent = cnt > 0 ? cnt : "";
}


function initTabs(){
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      const key = btn.dataset.tab;
      document.querySelectorAll(".pane").forEach(p => p.classList.remove("show"));
      document.querySelector(`#pane-${key}`).classList.add("show");
    });
  });
}

function sideItemHTML(item){
  return `
    <div class="sideItem">
      <a href="${buildDetailUrl(item)}">
        <div class="sideThumb" style="background-image:url('${item.image}')"></div>
        <div>
          <div class="sideTitle">${esc(item.title)}</div>
          <div class="sideDate">${esc(item.date)}</div>
        </div>
      </a>
    </div>
  `;
}

function renderSidebars(allNews){
  const byId = new Map(allNews.map(a => [a.id, a]));
  const trend = (window.TRENDING || []).map(x => byId.get(x.id) || x).filter(Boolean);
  const comm  = (window.COMMENTS  || []).map(x => byId.get(x.id) || x).filter(Boolean);

  document.querySelector("#pane-trending").innerHTML = trend.map(sideItemHTML).join("");
  document.querySelector("#pane-comments").innerHTML = comm.map(sideItemHTML).join("");

  const latest = allNews.slice(0, 6);
  document.querySelector("#pane-latest").innerHTML = latest.map(sideItemHTML).join("");
}

function renderHero(article){
  const hero     = document.querySelector("#hero");
  const heroLink = document.querySelector("#heroLink");
  heroLink.href  = buildDetailUrl(article);
  hero.innerHTML = `
    <div class="hero__img" style="background-image:url('${article.image}')"></div>
    <div class="hero__overlay"></div>
    <div class="hero__content">
      <span class="hero__pill">${esc(article.category)}</span>
      <h1 class="hero__title">${esc(article.title)}</h1>
      <div class="hero__meta">${esc(article.date)} <span class="hero__meta-dot">·</span> ${esc(article.author)}</div>
    </div>
  `;
}

/* ===== BOOKMARK TOGGLE ===== */
window.toggleBookmark = function(btn, id){
  if(!window.BookmarkStore) return;
  const allNews = window.NewsStore.getAll();
  const article = allNews.find(n => n.id === Number(id));
  if(!article) return;
  if(window.BookmarkStore.has(id)){
    window.BookmarkStore.remove(id);
    btn.classList.remove("active");
    window.Toast && window.Toast.show("Berita dihapus dari simpanan", "info");
  } else {
    window.BookmarkStore.add(article);
    btn.classList.add("active");
    window.Toast && window.Toast.show("Berita berhasil disimpan! 🔖", "bookmark");
  }
  updateBkBadge();
};

function cardEl(a){
  const el = document.createElement("a");
  el.className = "cardNews card-fadein";
  el.href = buildDetailUrl(a);
  const saved = window.BookmarkStore && window.BookmarkStore.has(a.id);
  el.innerHTML = `
    <div class="cardNews__img" style="background-image:url('${a.image}')"></div>
    <div class="cardNews__body">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
        <span class="badge red">${esc(a.category)}</span>
        <button class="bookmarkBtn${saved ? " active" : ""}" data-id="${a.id}" type="button"
          onclick="event.preventDefault();toggleBookmark(this,${a.id})" title="Simpan berita">
          <span class="bk-icon"></span><span class="bk-text"></span>
        </button>
      </div>
      <h3 class="cardNews__title">${esc(a.title)}</h3>
      <div class="meta">${esc(a.date)} <span class="meta-dot">·</span> ${esc(a.author)}</div>
    </div>
  `;
  return el;
}

/* ===== SEARCH + LOAD MORE ===== */
const PAGE_SIZE = 6;
let _allFiltered = [];
let _loadedCount = 0;

function renderCards(articles, append = false){
  const list = document.querySelector("#homeList");
  if(!append) list.innerHTML = "";
  articles.map(cardEl).forEach(el => list.appendChild(el));
}

function updateLoadMore(){
  const wrap = document.querySelector("#loadMoreWrap");
  if(wrap) wrap.style.display = _loadedCount >= _allFiltered.length ? "none" : "flex";
}

function showPage(filtered, append = false){
  if(!append){ _allFiltered = filtered; _loadedCount = 0; }
  const slice = _allFiltered.slice(_loadedCount, _loadedCount + PAGE_SIZE);
  renderCards(slice, append);
  _loadedCount += slice.length;
  updateLoadMore();
  const list = document.querySelector("#homeList");
  if(_allFiltered.length === 0 && list){
    list.innerHTML = `<div class="searchEmpty" style="grid-column:1/-1">😕 Tidak ada berita yang cocok.</div>`;
  }
}

function initSearch(allNews){
  const input    = document.querySelector("#homeSearch");
  const clearBtn = document.querySelector("#homeSearchClear");
  if(!input) return;
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if(clearBtn) clearBtn.className = q ? "searchClear show" : "searchClear";
    timer = setTimeout(() => {
      if(!q){ showPage(allNews); return; }
      const ql = q.toLowerCase();
      showPage(allNews.filter(n =>
        n.title.toLowerCase().includes(ql) ||
        n.category.toLowerCase().includes(ql) ||
        (n.tags||[]).some(t => t.toLowerCase().includes(ql)) ||
        (n.author||"").toLowerCase().includes(ql)
      ));
    }, 300);
  });
  if(clearBtn) clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.className = "searchClear";
    showPage(allNews);
    input.focus();
  });
}

function initLoadMore(){
  const btn = document.querySelector("#loadMoreBtn");
  if(btn) btn.addEventListener("click", () => showPage(_allFiltered, true));
}

/* ===== MAIN INIT ===== */
function init(){
  const now = new Date();
  if(document.querySelector("#year")) document.querySelector("#year").textContent = now.getFullYear();

  // Tanggal di topbar
  const fmt = now.toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  const topbarDate = document.querySelector("#topbarDate");
  if(topbarDate) topbarDate.textContent = fmt;

  // Jam live — update setiap detik
  function updateClock(){
    const t = new Date();
    const hh = String(t.getHours()).padStart(2,"0");
    const mm = String(t.getMinutes()).padStart(2,"0");
    const ss = String(t.getSeconds()).padStart(2,"0");
    const el = document.querySelector("#topbarTime");
    if(el) el.textContent = `${hh}:${mm}:${ss}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  renderNav("berita-utama");

  const allNews = window.NewsStore.getAll();
  const featured = allNews[0];
  if(featured) renderHero(featured);

  initTabs();
  renderSidebars(allNews);
  initTicker(allNews);
  updateBkBadge();

  showPage(allNews);
  initSearch(allNews);
  initLoadMore();

  // Search di header brand → redirect ke kategori
  const headerSearch = document.querySelector("#headerSearch");
  if(headerSearch){
    headerSearch.addEventListener("keydown", e => {
      if(e.key === "Enter" && headerSearch.value.trim())
        location.href = `./kategori.html?cat=berita-utama&q=${encodeURIComponent(headerSearch.value.trim())}`;
    });
  }

  // Scroll to Top
  const scrollBtn = document.querySelector("#scrollTopBtn");
  if(scrollBtn){
    window.addEventListener("scroll", () => scrollBtn.classList.toggle("show", window.scrollY > 400), { passive:true });
    scrollBtn.addEventListener("click", () => window.scrollTo({ top:0, behavior:"smooth" }));
  }
}

document.addEventListener("DOMContentLoaded", init);
