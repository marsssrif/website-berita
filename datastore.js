// datastore.js (global)
// Load data from localStorage (admin publish) or fallback to data.json
(function(){
  const KEY = "pb_data_v1";

  async function fetchJson(){
    const res = await fetch("./data.json", { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to load data.json");
    return await res.json();
  }

  function loadFromLocalStorage(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch{
      return null;
    }
  }

  function saveToLocalStorage(data){
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function clearLocalStorage(){
    localStorage.removeItem(KEY);
  }

  async function load(){
    const local = loadFromLocalStorage();
    if(local && local.news && local.categories) return local;
    const remote = await fetchJson();
    return remote;
  }

  // helper for pages
  window.DataStore = {
    KEY,
    load,
    loadFromLocalStorage,
    saveToLocalStorage,
    clearLocalStorage
  };
})();
