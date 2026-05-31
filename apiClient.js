// apiClient.js - minimal client for backend API (JWT)
(function(){
  const cfg = window.SITE_CONFIG || {};
  const API_BASE = (cfg.API_BASE || "http://localhost:5175").replace(/\/$/, "");
  const TOKEN_KEY = "pb_jwt";

  function getToken(){ return localStorage.getItem(TOKEN_KEY) || ""; }
  function setToken(t){ localStorage.setItem(TOKEN_KEY, t); }
  function clearToken(){ localStorage.removeItem(TOKEN_KEY); }

  async function request(path, opts={}){
    const headers = Object.assign({ "Content-Type": "application/json" }, (opts.headers||{}));
    const t = getToken();
    if(t) headers["Authorization"] = "Bearer " + t;

    const res = await fetch(API_BASE + path, { ...opts, headers });
    const data = await res.json().catch(()=> ({}));
    if(!res.ok){
      const err = new Error(data.error || "Request failed");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function login(username, password){
    const data = await request("/api/auth/login", { method:"POST", body: JSON.stringify({ username, password }) });
    setToken(data.token);
    return data.user;
  }

  async function me(){
    const data = await request("/api/auth/me", { method:"POST" });
    return data.user;
  }

  async function sendEmail(to, subject, text){
    return request("/api/email/send", { method:"POST", body: JSON.stringify({ to, subject, text }) });
  }

  window.ApiClient = { API_BASE, request, login, me, getToken, setToken, clearToken, sendEmail };
})();
