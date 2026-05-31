// utils.js (global)
window.Utils = {
  esc(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  },

  slugify(text){
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  },

  getParam(name){
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  },

  setParam(name, value){
    const url = new URL(window.location.href);
    if(value === null || value === undefined || value === ""){
      url.searchParams.delete(name);
    }else{
      url.searchParams.set(name, String(value));
    }
    return url;
  },

  makeExcerpt(article){
    const s = (article.excerpt || article.body || "").replace(/\s+/g, " ").trim();
    return s.length > 160 ? s.slice(0, 157) + "..." : s;
  }
};
