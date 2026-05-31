// bookmark.js — Halaman berita tersimpan
const { esc, slugify } = window.Utils;

function buildDetailUrl(article){
  const slug = slugify(article.title);
  return `./berita/${encodeURIComponent(slug)}.html`;
}

function renderNav(){
  const nav = document.querySelector("#navCats");
  if(!nav) return;
  nav.innerHTML = "";

  function linkForCat(key){ return `./kategori.html?cat=${encodeURIComponent(key)}`; }

  window.CATEGORIES.forEach(cat => {
    const a = document.createElement("a");
    a.href = linkForCat(cat.key);
    a.textContent = cat.label;
    nav.appendChild(a);
  });

  const wrap = document.createElement("div");
  wrap.className = "navItem";
  wrap.innerHTML = `
    <button class="dropBtn" type="button">LAINNYA ▾</button>
    <div class="dropMenu" role="menu" aria-label="Lainnya">
      ${window.OTHERS.map(x => `
        <a href="${linkForCat(x.key)}" role="menuitem">${esc(x.label)}</a>
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
}

function initTicker(){
  const track = document.querySelector("#tickerTrack");
  if(!track) return;
  const allNews = window.NewsStore.getAll();
  const items = allNews.slice(0, 5);
  const html = [...items, ...items].map(n =>
    `<span class="ticker__item" onclick="location.href='${buildDetailUrl(n)}'">${esc(n.title)}</span><span class="ticker__sep">•</span>`
  ).join("");
  track.innerHTML = html;
}

function updateBadge(){
  const badge = document.querySelector("#bkBadge");
  if(badge && window.BookmarkStore){
    const cnt = window.BookmarkStore.count();
    badge.textContent = cnt > 0 ? cnt : "";
  }
}

function renderBookmarks(){
  const list = document.querySelector("#bookmarkList");
  const empty = document.querySelector("#emptyState");
  if(!list || !window.BookmarkStore) return;

  const items = window.BookmarkStore.getAll();
  updateBadge();

  if(!items.length){
    list.innerHTML = "";
    if(empty) empty.style.display = "block";
    return;
  }
  if(empty) empty.style.display = "none";

  list.innerHTML = items.map(a => `
    <div class="cardNews" style="display:block;position:relative">
      <a href="${buildDetailUrl(a)}" style="display:block">
        <div class="cardNews__img" style="background-image:url('${a.image}')"></div>
        <div class="cardNews__body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
            <span class="badge red">${esc(a.category)}</span>
            <button class="bookmarkBtn active" onclick="event.preventDefault();removeBookmark(${a.id})" title="Hapus dari simpanan">
              <span class="bk-icon"></span><span class="bk-text"></span>
            </button>
          </div>
          <h3 class="cardNews__title">${esc(a.title)}</h3>
          <div class="meta">${esc(a.date)} • ${esc(a.author)}</div>
        </div>
      </a>
    </div>
  `).join("");
}

window.removeBookmark = function(id){
  if(!window.BookmarkStore) return;
  window.BookmarkStore.remove(id);
  renderBookmarks();
  window.Toast && window.Toast.show("Berita dihapus dari simpanan", "info");
};

function init(){
  document.querySelector("#year").textContent = new Date().getFullYear();
  renderNav();
  initTicker();
  renderBookmarks();

  const clearBtn = document.querySelector("#clearAllBtn");
  if(clearBtn){
    clearBtn.addEventListener("click", () => {
      if(!window.BookmarkStore || !window.BookmarkStore.count()) return;
      if(!confirm("Hapus semua berita tersimpan?")) return;
      localStorage.removeItem("pb_bookmarks_v1");
      renderBookmarks();
      window.Toast && window.Toast.show("Semua simpanan dihapus", "info");
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
