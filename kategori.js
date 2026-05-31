const { esc, slugify, getParam, setParam } = window.Utils;

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


function getCatLabel(catKey){
  const all = [...window.CATEGORIES, ...window.OTHERS];
  const f = all.find(x => x.key === catKey);
  return f ? f.label : "KATEGORI";
}

function renderBreadcrumb(catLabel){
  document.querySelector("#breadcrumb").innerHTML = `
    <a href="./index.html">Home</a>
    <span class="crumbSep">›</span>
    <span>${esc(catLabel)}</span>
  `;
}

function cardHTML(article){
  const saved = window.BookmarkStore && window.BookmarkStore.has(article.id);
  return `
    <a class="cardNews" href="${buildDetailUrl(article)}">
      <div class="cardNews__img" style="background-image:url('${article.image}')"></div>
      <div class="cardNews__body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
          <span class="badge red">${esc(article.category)}</span>
          <button class="bookmarkBtn${saved ? " active" : ""}" data-id="${article.id}" type="button"
            onclick="event.preventDefault();katToggleBk(this,${article.id})" title="Simpan berita">
            <span class="bk-icon"></span><span class="bk-text"></span>
          </button>
        </div>
        <h3 class="cardNews__title">${esc(article.title)}</h3>
        <div class="meta">${esc(article.date)} <span class="meta-dot">·</span> ${esc(article.author)}</div>
      </div>
    </a>
  `;
}

const state = { catKey: "berita-utama", q: "", page: 1, pageSize: 6 };

function getBaseItems(allNews){
  return allNews.filter(n => n.navKey === state.catKey);
}

function getFilteredItems(allNews){
  const q = state.q.trim().toLowerCase();
  const base = getBaseItems(allNews);
  if(!q) return base;

  return base.filter(x =>
    x.title.toLowerCase().includes(q) ||
    x.category.toLowerCase().includes(q) ||
    x.author.toLowerCase().includes(q) ||
    (x.tags || []).some(t => String(t).toLowerCase().includes(q)) ||
    (x.excerpt || "").toLowerCase().includes(q) ||
    x.body.toLowerCase().includes(q)
  );
}

function renderList(allNews){
  const items = getFilteredItems(allNews);
  const totalPages = Math.max(1, Math.ceil(items.length / state.pageSize));
  state.page = Math.max(1, Math.min(state.page, totalPages));

  const start = (state.page - 1) * state.pageSize;
  const pageItems = items.slice(start, start + state.pageSize);

  document.querySelector("#catList").innerHTML =
    pageItems.map(cardHTML).join("") || `<div class="searchEmpty" style="grid-column:1/-1">😕 Tidak ada berita ditemukan.</div>`;

  document.querySelector("#pageInfo").textContent = `Halaman ${state.page} / ${totalPages}`;
  document.querySelector("#prevBtn").disabled = state.page <= 1;
  document.querySelector("#nextBtn").disabled = state.page >= totalPages;

  const url = setParam("page", state.page);
  window.history.replaceState({}, "", url);
}

window.katToggleBk = function(btn, id){
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
  // Update badge
  const badge = document.querySelector("#bkBadge");
  if(badge) badge.textContent = window.BookmarkStore.count() || "";
};

function init(){
  const now = new Date();
  if(document.querySelector("#year")) document.querySelector("#year").textContent = now.getFullYear();

  // Date & Live Clock
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

  const cat  = getParam("cat")  || "berita-utama";
  const page = Number(getParam("page") || "1");
  const q    = getParam("q")    || "";

  state.catKey = cat;
  state.page   = (Number.isFinite(page) && page > 0) ? page : 1;
  state.q      = q;

  const catLabel = getCatLabel(cat);
  document.querySelector("#catTitle").textContent  = catLabel;
  document.querySelector("#pageTitle").textContent = `${catLabel} — Berita Krian`;

  renderNav(cat);
  renderBreadcrumb(catLabel);

  // Breaking news ticker
  const tickerTrack = document.querySelector("#tickerTrack");
  if(tickerTrack){
    const tickerItems = allNews.slice(0, 5);
    if(tickerItems.length){
      const html = [...tickerItems, ...tickerItems].map(n =>
        `<span class="ticker__item" onclick="location.href='${buildDetailUrl(n)}'"> ${esc(n.title)}</span><span class="ticker__sep">•</span>`
      ).join("");
      tickerTrack.innerHTML = html;
    }
  }

  const qEl = document.querySelector("#q");
  qEl.value = q;

  qEl.addEventListener("input", (e) => {
    state.q    = e.target.value;
    state.page = 1;
    const url = setParam("q", state.q);
    url.searchParams.set("cat", state.catKey);
    url.searchParams.set("page", "1");
    window.history.replaceState({}, "", url);
    renderList(allNews);
  });

  document.querySelector("#prevBtn").addEventListener("click", () => { state.page -= 1; renderList(allNews); window.scrollTo({top:0,behavior:"smooth"}); });
  document.querySelector("#nextBtn").addEventListener("click", () => { state.page += 1; renderList(allNews); window.scrollTo({top:0,behavior:"smooth"}); });

  renderList(allNews);

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
