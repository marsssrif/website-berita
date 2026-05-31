// store.js (global) - simple persistence via localStorage
(function(){
  const KEY         = "pb_news_v1";
  const VER_KEY     = "pb_seed_ver";
  const SEED_VERSION = "krian-2026-v3"; // bump setiap update seed

  function safeParse(jsonStr){
    try { return JSON.parse(jsonStr); } catch { return null; }
  }

  function normalizeArticle(a){
    const nowId = Number(a.id);
    return {
      id:       Number.isFinite(nowId) ? nowId : Date.now(),
      title:    String(a.title    || "").trim(),
      excerpt:  String(a.excerpt  || "").trim(),
      category: String(a.category || "").trim(),
      navKey:   String(a.navKey   || "berita-utama").trim(),
      tags:     Array.isArray(a.tags) ? a.tags.map(t => String(t).trim()).filter(Boolean) : [],
      image:    String(a.image    || "").trim(),
      author:   String(a.author   || "Redaksi").trim(),
      date:     String(a.date     || "").trim(),
      body:     String(a.body     || "").trim(),
    };
  }

  // Auto-reset jika seed berubah (versi baru data.js)
  if(localStorage.getItem(VER_KEY) !== SEED_VERSION){
    localStorage.removeItem(KEY);
    localStorage.setItem(VER_KEY, SEED_VERSION);
  }

  function getAll(){
    const raw    = localStorage.getItem(KEY);
    const parsed = raw ? safeParse(raw) : null;
    const items  = Array.isArray(parsed) ? parsed.map(normalizeArticle) : null;
    if(items && items.length) return items.sort((a,b) => b.id - a.id);
    const seed = (window.SEED_NEWS || []).map(normalizeArticle);
    return seed.sort((a,b) => b.id - a.id);
  }

  function saveAll(items){
    localStorage.setItem(KEY, JSON.stringify(items.map(normalizeArticle)));
  }

  function upsert(article){
    const items = getAll();
    const a     = normalizeArticle(article);
    const idx   = items.findIndex(x => x.id === a.id);
    if(idx >= 0) items[idx] = a; else items.unshift(a);
    saveAll(items);
    return a;
  }

  function remove(id){
    saveAll(getAll().filter(x => x.id !== Number(id)));
  }

  function resetToSeed(){
    localStorage.removeItem(KEY);
    localStorage.setItem(VER_KEY, SEED_VERSION);
  }

  window.NewsStore = { KEY, getAll, saveAll, upsert, remove, resetToSeed, normalizeArticle };
})();
