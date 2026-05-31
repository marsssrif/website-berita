// features.js — Toast, Bookmark, Comment system
(function(){

  /* ===== TOAST NOTIFICATION ===== */
  let toastQueue = [];
  let toastEl = null;
  let toastTimer = null;

  function ensureToastEl(){
    if(toastEl) return;
    toastEl = document.createElement("div");
    toastEl.id = "toastContainer";
    document.body.appendChild(toastEl);
  }

  function showToast(msg, type = "success", duration = 3000){
    ensureToastEl();
    const icons = { success: "✅", error: "❌", info: "ℹ️", bookmark: "🔖" };
    const icon = icons[type] || "✅";

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span class="toast__icon">${icon}</span><span class="toast__msg">${msg}</span>`;
    toastEl.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => { toast.classList.add("toast--show"); });

    setTimeout(() => {
      toast.classList.remove("toast--show");
      toast.classList.add("toast--hide");
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  window.Toast = { show: showToast };


  /* ===== BOOKMARK STORE ===== */
  const BK_KEY = "pb_bookmarks_v1";

  function bkGetAll(){
    try { return JSON.parse(localStorage.getItem(BK_KEY)) || []; }
    catch { return []; }
  }

  function bkSave(list){ localStorage.setItem(BK_KEY, JSON.stringify(list)); }

  function bkAdd(article){
    const list = bkGetAll();
    if(!list.find(x => x.id === article.id)){
      list.unshift({ id: article.id, title: article.title, category: article.category,
        date: article.date, author: article.author, image: article.image,
        navKey: article.navKey, tags: article.tags, excerpt: article.excerpt });
      bkSave(list);
    }
  }

  function bkRemove(id){
    bkSave(bkGetAll().filter(x => x.id !== Number(id)));
  }

  function bkHas(id){
    return bkGetAll().some(x => x.id === Number(id));
  }

  function bkCount(){ return bkGetAll().length; }

  window.BookmarkStore = { getAll: bkGetAll, add: bkAdd, remove: bkRemove, has: bkHas, count: bkCount };


  /* ===== COMMENT STORE ===== */
  const CM_KEY = "pb_comments_v1";

  function cmGetAll(){
    try { return JSON.parse(localStorage.getItem(CM_KEY)) || {}; }
    catch { return {}; }
  }

  function cmGetForArticle(articleId){
    const all = cmGetAll();
    return all[String(articleId)] || [];
  }

  function cmAdd(articleId, name, text){
    const all = cmGetAll();
    const key = String(articleId);
    if(!all[key]) all[key] = [];
    all[key].unshift({
      id: Date.now(),
      name: String(name).trim(),
      text: String(text).trim(),
      ts: new Date().toLocaleString("id-ID", { dateStyle:"medium", timeStyle:"short" })
    });
    localStorage.setItem(CM_KEY, JSON.stringify(all));
    return all[key][0];
  }

  function cmDelete(articleId, commentId){
    const all = cmGetAll();
    const key = String(articleId);
    if(all[key]) all[key] = all[key].filter(c => c.id !== Number(commentId));
    localStorage.setItem(CM_KEY, JSON.stringify(all));
  }

  window.CommentStore = { getForArticle: cmGetForArticle, add: cmAdd, delete: cmDelete };

})();
