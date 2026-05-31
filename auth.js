// auth.js - simple login + role (client-side; demo/static only)
(function(){
  const SESSION_KEY = "pb_session_v1";

  // Default users (ganti password sebelum dipakai beneran)
  const USERS = [
    { username: "admin",  password: "admin123",  role: "admin"  },
    { username: "editor", password: "editor123", role: "editor" },
    { username: "viewer", password: "viewer123", role: "viewer" },
  ];

  function getSession(){
    try{
      const raw = sessionStorage.getItem(SESSION_KEY);
      if(!raw) return null;
      const s = JSON.parse(raw);
      if(!s || !s.username || !s.role) return null;
      return s;
    }catch{ return null; }
  }

  function setSession(sess){
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  }

  function logout(){
    sessionStorage.removeItem(SESSION_KEY);
  }

  function login(username, password){
    const u = USERS.find(x => x.username === username && x.password === password);
    if(!u) return { ok:false, message:"Username / password salah." };
    const sess = { username: u.username, role: u.role, ts: Date.now() };
    setSession(sess);
    return { ok:true, session: sess };
  }

  function requireRole(roles, redirectTo){
    const s = getSession();
    if(!s){
      const next = encodeURIComponent(window.location.pathname.split("/").pop() + window.location.search);
      window.location.href = (redirectTo || "./login.html") + "?next=" + next;
      return null;
    }
    const allowed = Array.isArray(roles) ? roles : [roles];
    if(!allowed.includes(s.role)){
      alert("Akses ditolak.");
      logout();
      window.location.href = (redirectTo || "./login.html");
      return null;
    }
    return s;
  }

  window.Auth = { SESSION_KEY, USERS, login, logout, getSession, requireRole };
})();
