// admin.js

const { slugify } = window.Utils;

/* ── Helpers ── */
function allCatOptions(){ return [...window.CATEGORIES, ...window.OTHERS]; }
function navLabel(key){
  const f = allCatOptions().find(x => x.key === key);
  return f ? f.label : key;
}
function buildDetailUrl(article){
  const slug = slugify(article.title);
  return `./detail.html?slug=${encodeURIComponent(slug)}`;
}
function parseTags(str){
  return String(str||"").split(",").map(s=>s.trim()).filter(Boolean);
}

/* ── Comments Modal ── */
const CM_KEY = "pb_comments_v1";

function getAllComments(){
  try{ return JSON.parse(localStorage.getItem(CM_KEY)) || {}; }
  catch{ return {}; }
}
function saveAllComments(data){
  localStorage.setItem(CM_KEY, JSON.stringify(data));
}
function countAllComments(){
  const all = getAllComments();
  return Object.values(all).reduce((s,a)=>s+(Array.isArray(a)?a.length:0),0);
}

function renderCommentsModal(){
  const all     = getAllComments();
  const allNews = window.NewsStore.getAll();
  const body    = document.querySelector("#cmBody");
  const count   = document.querySelector("#cmCount");
  if(!body) return;

  const total = countAllComments();
  if(count) count.textContent = `${total} komentar dari semua berita`;

  // Flatten: [{articleId, articleTitle, comment}]
  const rows = [];
  Object.entries(all).forEach(([articleId, comments]) => {
    if(!Array.isArray(comments)) return;
    const article = allNews.find(n => String(n.id) === String(articleId));
    const title   = article ? article.title : `Berita #${articleId}`;
    const url     = article ? buildDetailUrl(article) : "#";
    comments.forEach(c => rows.push({ articleId, title, url, comment: c }));
  });

  // Sort newest first
  rows.sort((a,b) => b.comment.id - a.comment.id);

  if(rows.length === 0){
    body.innerHTML = `
      <div style="padding:48px 24px;text-align:center;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:12px">💬</div>
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">Belum ada komentar</div>
        <div style="font-size:13px">Komentar dari pembaca akan muncul di sini.</div>
      </div>`;
    return;
  }

  // Group by article
  const grouped = {};
  rows.forEach(r => {
    if(!grouped[r.articleId]) grouped[r.articleId] = { title: r.title, url: r.url, comments: [] };
    grouped[r.articleId].comments.push(r.comment);
  });

  body.innerHTML = Object.entries(grouped).map(([articleId, g]) => `
    <div style="border-bottom:1px solid var(--line);padding:0">
      <!-- Article header -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 22px 10px;background:#fafbfd;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px;min-width:0">
          <span style="background:var(--accent);color:#fff;font-size:10px;font-weight:800;padding:3px 8px;border-radius:999px;white-space:nowrap;flex-shrink:0">📰 ${g.comments.length} komentar</span>
          <a href="${g.url}" target="_blank" style="font-size:13px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:420px" title="${g.title}">
            ${g.title}
          </a>
        </div>
        <a href="${g.url}" target="_blank" style="font-size:11.5px;color:var(--blue);font-weight:600;white-space:nowrap;flex-shrink:0">Lihat berita →</a>
      </div>
      <!-- Comments list -->
      ${g.comments.map(c => `
        <div class="cm-row" data-article="${articleId}" data-comment="${c.id}"
             style="display:flex;gap:12px;padding:12px 22px;border-top:1px solid #f1f5f9;align-items:flex-start">
          <!-- Avatar -->
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:grid;place-items:center;font-weight:800;font-size:13px;color:#fff;flex-shrink:0">
            ${(c.name||"?")[0].toUpperCase()}
          </div>
          <!-- Content -->
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <span style="font-weight:700;font-size:13px">${escHtml(c.name)}</span>
              <span style="font-size:11px;color:var(--muted)">${c.ts||""}</span>
            </div>
            <div style="font-size:13.5px;line-height:1.6;color:#374151">${escHtml(c.text)}</div>
          </div>
          <!-- Delete -->
          <button class="actBtn del cm-del-btn" data-article="${articleId}" data-comment="${c.id}"
                  title="Hapus komentar ini" style="flex-shrink:0;margin-top:2px">🗑</button>
        </div>
      `).join("")}
    </div>
  `).join("");

  // Attach delete handlers
  body.querySelectorAll(".cm-del-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const aid = btn.dataset.article;
      const cid = Number(btn.dataset.comment);
      if(!confirm("Hapus komentar ini?")) return;
      const all2 = getAllComments();
      if(all2[aid]) all2[aid] = all2[aid].filter(c => c.id !== cid);
      saveAllComments(all2);
      renderCommentsModal();
      updateStats(window.NewsStore.getAll()); // refresh badge
    });
  });
}

function escHtml(s){
  return String(s||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function openCmModal(){
  renderCommentsModal();
  document.querySelector("#cmOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeCmModal(){
  document.querySelector("#cmOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

function toDateString(){
  const m=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const d=new Date(); return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
}
function setHint(text, type){
  const el = document.querySelector("#formHint");
  if(!el) return;
  el.textContent = text || "";
  el.className = "formHintMsg" + (type ? " " + type : "");
}

/* ── Form elements ── */
const F = {};
function bindForm(){
  ["id","title","excerpt","navKey","category","tags","image","author","date","body"]
    .forEach(k => F[k] = document.querySelector("#"+k));
}
function fillNavSelect(){
  F.navKey.innerHTML = allCatOptions()
    .map(c=>`<option value="${c.key}">${c.label}</option>`).join("");
}

/* ── Modal ── */
function openModal(){
  document.querySelector("#formOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
  setTimeout(()=>F.title && F.title.focus(), 80);
}
function closeModal(){
  document.querySelector("#formOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

/* ── Preview ── */
function updatePreview(){
  const a = document.querySelector("#previewLink");
  if(!a) return;
  const t = F.title ? F.title.value.trim() : "";
  a.href = t ? buildDetailUrl({title:t}) : "./detail.html";
}

/* ── Image Drop Zone ── */
function clearImgZone(){
  const zone    = document.querySelector("#imgDropZone");
  const preview = document.querySelector("#imgPreview");
  const removeBtn = document.querySelector("#imgRemoveBtn");
  if(!zone) return;
  zone.classList.remove("hasImg");
  if(preview){ preview.src=""; preview.style.display="none"; }
  if(removeBtn) removeBtn.style.display="none";
  if(F.image)  F.image.value = "";
}

function setImgZone(src){
  const zone    = document.querySelector("#imgDropZone");
  const preview = document.querySelector("#imgPreview");
  const removeBtn = document.querySelector("#imgRemoveBtn");
  if(!zone||!src) return;
  preview.src = src;
  preview.style.display = "block";
  removeBtn.style.display = "grid";
  zone.classList.add("hasImg");
  if(F.image) F.image.value = src;
}

function initImageDropZone(){
  const zone      = document.querySelector("#imgDropZone");
  const fileInput = document.querySelector("#imgFileInput");
  const removeBtn = document.querySelector("#imgRemoveBtn");
  if(!zone||!fileInput) return;

  const MAX_SIZE = 4 * 1024 * 1024; // 4 MB

  function processFile(file){
    if(!file || !file.type.startsWith("image/")){ setHint("⚠ File harus berupa gambar.","error"); return; }
    if(file.size > MAX_SIZE){ setHint("⚠ Ukuran gambar maksimal 4 MB.","error"); return; }
    const reader = new FileReader();
    reader.onload = e => {
      setImgZone(e.target.result);
      setHint("","");
    };
    reader.readAsDataURL(file);
  }

  // Click to browse
  zone.addEventListener("click", e => {
    if(e.target === removeBtn) return;
    fileInput.click();
  });
  zone.addEventListener("keydown", e => { if(e.key==="Enter"||e.key===" "){ e.preventDefault(); fileInput.click(); } });

  fileInput.addEventListener("change", () => {
    if(fileInput.files && fileInput.files[0]) processFile(fileInput.files[0]);
    fileInput.value = "";
  });

  // Drag & drop
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", e => { if(!zone.contains(e.relatedTarget)) zone.classList.remove("dragover"); });
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("dragover");
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    processFile(file);
  });

  // Remove
  removeBtn.addEventListener("click", e => {
    e.stopPropagation();
    clearImgZone();
  });
}

/* ── Clear / Load form ── */
function clearForm(){
  F.id.value=""; F.title.value=""; F.excerpt.value="";
  F.navKey.value="berita-utama"; F.category.value="";
  F.tags.value="";
  F.author.value="Redaksi"; F.date.value=toDateString(); F.body.value="";
  clearImgZone();
  updatePreview(); setHint("","");
  const ft = document.querySelector("#formTitle");
  const fs = document.querySelector("#formSub");
  const fb = document.querySelector("#formBadge");
  if(ft) ft.textContent = "Buat Berita Baru";
  if(fs) fs.textContent = "Isi semua field yang wajib (*)";
  if(fb) fb.textContent = "✏️";
}
function loadToForm(article){
  F.id.value      = String(article.id);
  F.title.value   = article.title    || "";
  F.excerpt.value = article.excerpt  || "";
  F.navKey.value  = article.navKey   || "berita-utama";
  F.category.value= article.category || "";
  F.tags.value    = (article.tags||[]).join(", ");
  F.author.value  = article.author   || "Redaksi";
  F.date.value    = article.date     || toDateString();
  F.body.value    = article.body     || "";
  // Tampilkan gambar di drop zone
  if(article.image) setImgZone(article.image);
  else clearImgZone();
  updatePreview(); setHint("","");
  const ft = document.querySelector("#formTitle");
  const fs = document.querySelector("#formSub");
  const fb = document.querySelector("#formBadge");
  if(ft) ft.textContent = "Edit Berita";
  if(fs) fs.textContent = article.title || "";
  if(fb) fb.textContent = "📝";
}
function currentDraft(){
  const id = F.id.value ? Number(F.id.value) : Date.now();
  return {
    id, title:F.title.value.trim(), excerpt:F.excerpt.value.trim(),
    navKey:F.navKey.value, category:F.category.value.trim(),
    tags:parseTags(F.tags.value), image:F.image.value.trim(),
    author:F.author.value.trim(), date:F.date.value.trim(), body:F.body.value.trim(),
  };
}

/* ── Stats ── */
function updateStats(items){
  const cats = new Set(items.map(x=>x.navKey||x.category)).size;
  const el = id => document.querySelector('#'+id);
  if(el('statTotal'))     el('statTotal').textContent     = items.length;
  if(el('statCats'))      el('statCats').textContent      = cats;
  if(el('statBookmarks')) el('statBookmarks').textContent = (() => {
    try{ return JSON.parse(localStorage.getItem('pb_bookmarks_v1')||'[]').length; }catch{ return 0; }
  })();
  if(el('statComments'))  el('statComments').textContent  = countAllComments();
  // Press & Contact counts
  const pressCount = window.PressStore ? window.PressStore.getAll().length : 0;
  const contactCount = window.ContactStore ? window.ContactStore.getAll().length : 0;
  if(el('statPress'))   el('statPress').textContent   = pressCount;
  if(el('statContact')) el('statContact').textContent = contactCount;
  if(el('badgePress'))   el('badgePress').textContent   = pressCount;
  if(el('badgeContact')) el('badgeContact').textContent = contactCount;
}

/* ── Search ── */
function matchesQuery(a, q){
  const s=q.toLowerCase();
  return (a.title||"").toLowerCase().includes(s)    ||
         (a.category||"").toLowerCase().includes(s) ||
         (a.author||"").toLowerCase().includes(s)   ||
         (a.navKey||"").toLowerCase().includes(s)   ||
         (a.tags||[]).some(t=>String(t).toLowerCase().includes(s));
}

/* ── Render table rows ── */
function renderRows(){
  const rows = document.querySelector("#rows");
  const q    = document.querySelector("#adminSearch").value.trim();
  const items= window.NewsStore.getAll();
  const list = q ? items.filter(x=>matchesQuery(x,q)) : items;

  rows.innerHTML = list.map(a => `
    <tr>
      <td>
        <div class="rowTitle">${a.title}</div>
        <div class="rowSlug">${slugify(a.title)}</div>
      </td>
      <td><span class="badge red" style="font-size:10px;letter-spacing:.3px">${a.category}</span></td>
      <td style="font-size:12px;color:var(--muted);white-space:nowrap">${navLabel(a.navKey)}</td>
      <td style="font-size:11.5px;color:var(--muted);max-width:140px">${(a.tags||[]).slice(0,3).join(", ")}</td>
      <td style="font-size:12px;white-space:nowrap;color:var(--muted)">${a.date}</td>
      <td>
        <div class="actBtns">
          <button class="actBtn edit" data-act="edit" data-id="${a.id}">✏ Edit</button>
          <a class="actBtn prev" href="${buildDetailUrl(a)}" target="_blank" rel="noopener">👁 Preview</a>
          <button class="actBtn del" data-act="del" data-id="${a.id}" title="Hapus">🗑</button>
        </div>
      </td>
    </tr>
  `).join("");

  const hint = document.querySelector("#adminHint");
  if(hint) hint.textContent = list.length > 0
    ? `Menampilkan ${list.length} dari ${items.length} berita`
    : "Tidak ada berita ditemukan.";

  updateStats(items);
}

/* ── Export JSON ── */
function downloadJSON(name, obj){
  const b=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
  const u=URL.createObjectURL(b);
  const a=document.createElement("a");
  a.href=u; a.download=name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(u);
}

/* ════════════════════════════════
   MAIN INIT
════════════════════════════════ */
async function init(){
  let sess=null;
  const cfg=window.SITE_CONFIG||{};
  const useBackend=cfg.USE_BACKEND_AUTH===true;

  if(useBackend){
    if(!window.ApiClient||!window.ApiClient.getToken()){
      const next=encodeURIComponent(location.pathname.split("/").pop()+location.search);
      location.href="./login.html?next="+next; return;
    }
    try{
      const u=await window.ApiClient.me();
      sess={username:u.username,role:u.role};
    }catch{
      if(window.ApiClient) window.ApiClient.clearToken();
      location.href="./login.html"; return;
    }
  }else{
    sess=window.Auth&&window.Auth.requireRole(["admin","editor","viewer"],"./login.html");
    if(!sess) return;
  }

  /* User info */
  const who=document.querySelector("#who");
  if(who) who.textContent=`${sess.username} · ${sess.role}`;

  /* Logout */
  const logoutBtn=document.querySelector("#logoutBtn");
  if(logoutBtn) logoutBtn.addEventListener("click",()=>{
    if(confirm("Yakin ingin logout?")){
      if(window.ApiClient) window.ApiClient.clearToken();
      if(window.Auth)      window.Auth.logout();
      location.href="./login.html";
    }
  });

  /* Year */
  const yr=document.querySelector("#year");
  if(yr) yr.textContent=new Date().getFullYear();

  bindForm(); fillNavSelect();
  if(!F.author.value) F.author.value="Redaksi";
  if(!F.date.value)   F.date.value=toDateString();
  initImageDropZone();
  renderRows();

  /* Role */
  const canEdit  =sess.role==="admin"||sess.role==="editor";
  const canDelete=sess.role==="admin";
  if(!canEdit){
    const nb=document.querySelector("#newBtn"); if(nb) nb.style.display="none";
  }
  if(!canDelete){
    ["#deleteBtn","#resetBtn"].forEach(s=>{
      const el=document.querySelector(s); if(el) el.style.display="none";
    });
  }

  /* Modal open / close */
  document.querySelector("#newBtn").addEventListener("click",()=>{ clearForm(); openModal(); });
  document.querySelector("#closeFormBtn").addEventListener("click", closeModal);
  document.querySelector("#formOverlay").addEventListener("click",e=>{
    if(e.target===document.querySelector("#formOverlay")) closeModal();
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){ closeModal(); closeCmModal(); }
  });

  /* Comments modal */
  const cmCard = document.querySelector('#statCardComments');
  if(cmCard) cmCard.addEventListener('click', openCmModal);
  const cmClose = document.querySelector('#cmClose');
  if(cmClose) cmClose.addEventListener('click', closeCmModal);
  document.querySelector('#cmOverlay') && document.querySelector('#cmOverlay').addEventListener('click', e=>{
    if(e.target===document.querySelector('#cmOverlay')) closeCmModal();
  });

  /* Inbox Panel */
  initInboxPanel();
  updateStats(window.NewsStore.getAll());

  /* Live preview */
  F.title&&F.title.addEventListener("input", updatePreview);

  /* Row actions */
  document.querySelector("#rows").addEventListener("click",e=>{
    const btn=e.target.closest("[data-act]"); if(!btn) return;
    const act=btn.dataset.act, id=Number(btn.dataset.id);
    const article=window.NewsStore.getAll().find(x=>x.id===id);
    if(act==="edit"&&article){
      loadToForm(article); openModal();
      const m=document.querySelector(".formModal"); if(m) m.scrollTop=0;
    }
    if(act==="del"){
      if(confirm(`Hapus berita:\n"${article?article.title:""}"`)){
        window.NewsStore.remove(id);
        if(F.id.value&&Number(F.id.value)===id) clearForm();
        renderRows();
      }
    }
  });

  /* Save button */
  document.querySelector("#saveBtn").addEventListener("click",()=>{
    const d=currentDraft();
    if(!d.title||!d.category||!d.image||!d.author||!d.date||!d.body){
      setHint("⚠ Lengkapi semua field wajib (*) sebelum menyimpan.","error"); return;
    }
    const saved=window.NewsStore.upsert(d);
    F.id.value=String(saved.id);
    setHint("✅ Berita berhasil disimpan!","success");
    renderRows(); updatePreview();
    const ft=document.querySelector("#formTitle");
    const fs=document.querySelector("#formSub");
    if(ft) ft.textContent="Edit Berita";
    if(fs) fs.textContent=d.title;
  });

  /* Delete (dari modal) */
  document.querySelector("#deleteBtn").addEventListener("click",()=>{
    const id=F.id.value?Number(F.id.value):null;
    if(!id){ setHint("Pilih berita dari tabel untuk dihapus.","info"); return; }
    const article=window.NewsStore.getAll().find(x=>x.id===id);
    if(confirm(`Hapus berita:\n"${article?article.title:""}"?`)){
      window.NewsStore.remove(id); clearForm(); renderRows(); closeModal();
    }
  });

  /* Clear */
  document.querySelector("#clearBtn").addEventListener("click",()=>{
    clearForm(); setHint("Form dibersihkan.","info");
  });

  /* Search */
  document.querySelector("#adminSearch").addEventListener("input", renderRows);

  /* Export */
  document.querySelector("#exportBtn").addEventListener("click",()=>{
    downloadJSON("berita-krian-export.json", window.NewsStore.getAll());
  });

  /* Import */
  const fileInput=document.querySelector("#importFile");
  document.querySelector("#importBtn").addEventListener("click",()=>fileInput.click());
  fileInput.addEventListener("change",async()=>{
    const f=fileInput.files&&fileInput.files[0]; if(!f) return;
    try{
      const parsed=JSON.parse(await f.text());
      if(!Array.isArray(parsed)) throw new Error("Bukan array");
      window.NewsStore.saveAll(parsed); clearForm(); renderRows();
      const h=document.querySelector("#adminHint"); if(h) h.textContent="✅ Import berhasil!";
    }catch{
      const h=document.querySelector("#adminHint"); if(h) h.textContent="❌ Import gagal.";
    }finally{ fileInput.value=""; }
  });

  /* Reset */
  document.querySelector("#resetBtn").addEventListener("click",()=>{
    if(confirm("Reset ke data awal? Semua perubahan akan hilang.")){
      window.NewsStore.resetToSeed(); clearForm(); renderRows();
      const h=document.querySelector("#adminHint"); if(h) h.textContent="✅ Reset selesai.";
    }
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   INBOX PANEL — Press Release & Pesan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
let inboxActiveTab = 'press';

/* ── Status update helper ── */
function updatePressStatus(id, newStatus) {
  const list = window.PressStore ? window.PressStore.getAll() : [];
  const idx  = list.findIndex(x => x.id === id);
  if (idx === -1) return null;
  list[idx].status   = newStatus;
  list[idx].statusTs = new Date().toLocaleString('id-ID');
  list[idx].statusBy = document.querySelector('#who')?.textContent?.split('\u00b7')[0]?.trim() || 'Admin';
  localStorage.setItem('bk_press_releases', JSON.stringify(list));
  return list[idx];
}

/* ── Email templates ── */
function getAcceptEmailData(item) {
  const subject = '[Berita Krian] Press Release Anda Diterima \u2014 ' + item.judul;
  const body = [
    'Yth. ' + item.nama + ',',
    '',
    'Kami dengan senang hati menginformasikan bahwa press release Anda telah DITERIMA dan akan kami publikasikan di portal Berita Krian.',
    '',
    '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
    '\ud83d\udcf0 DETAIL PRESS RELEASE',
    '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
    'Judul        : ' + item.judul,
    'Kategori     : ' + (item.kategori || '-'),
    'Tanggal Rilis: ' + (item.tanggal  || '-'),
    'Organisasi   : ' + item.org,
    '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
    '',
    '\u2705 STATUS: DITERIMA',
    '',
    'Press release Anda akan segera diedit dan dipublikasikan oleh tim redaksi kami.',
    'Anda akan mendapatkan notifikasi kembali saat berita telah tayang.',
    '',
    'Apabila ada pertanyaan, silakan hubungi kami di:',
    '\ud83d\udce7 redaksi@beritakrian.com',
    '\ud83d\udcde (031) 123-4567',
    '',
    'Terima kasih atas kepercayaan Anda kepada Berita Krian.',
    '',
    'Salam hangat,',
    'Tim Redaksi Berita Krian',
  ].join('\n');
  return { subject, body };
}

function getRejectEmailData(item, alasan) {
  const subject = '[Berita Krian] Press Release Anda Tidak Dapat Dipublikasikan \u2014 ' + item.judul;
  const body = [
    'Yth. ' + item.nama + ',',
    '',
    'Terima kasih telah mengirimkan press release kepada redaksi Berita Krian.',
    '',
    'Setelah melalui proses evaluasi, kami mohon maaf menginformasikan bahwa press release Anda TIDAK DAPAT kami publikasikan saat ini.',
    '',
    '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
    '\ud83d\udcf0 DETAIL PRESS RELEASE',
    '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
    'Judul    : ' + item.judul,
    'Kategori : ' + (item.kategori || '-'),
    '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
    '',
    '\u274c STATUS: TIDAK DITERIMA',
    '',
    alasan ? ('Alasan:\n' + alasan) : 'Press release Anda tidak memenuhi kriteria editorial kami saat ini.',
    '',
    'Kami menyarankan Anda untuk:',
    '\u2022 Memastikan informasi yang disampaikan akurat dan dapat diverifikasi',
    '\u2022 Menyertakan narahubung yang dapat dihubungi',
    '\u2022 Mengirimkan kembali dengan kelengkapan data yang lebih baik',
    '',
    'Untuk diskusi lebih lanjut, silakan hubungi:',
    '\ud83d\udce7 redaksi@beritakrian.com',
    '\ud83d\udcde (031) 123-4567',
    '',
    'Terima kasih atas pengertian Anda.',
    '',
    'Salam,',
    'Tim Redaksi Berita Krian',
  ].join('\n');
  return { subject, body };
}

function buildAcceptEmail(item) {
  const data = getAcceptEmailData(item);
  return 'mailto:' + encodeURIComponent(item.email)
    + '?subject=' + encodeURIComponent(data.subject)
    + '&body=' + encodeURIComponent(data.body);
}

function buildRejectEmail(item, alasan) {
  const data = getRejectEmailData(item, alasan);
  return 'mailto:' + encodeURIComponent(item.email)
    + '?subject=' + encodeURIComponent(data.subject)
    + '&body=' + encodeURIComponent(data.body);
}

/* ── Status badge HTML ── */
function statusBadgeHtml(status) {
  if (status === 'diterima') return '<span class="pr-status-badge pr-status-accepted">\u2705 Diterima</span>';
  if (status === 'ditolak')  return '<span class="pr-status-badge pr-status-rejected">\u274c Ditolak</span>';
  return '<span class="pr-status-badge pr-status-new">\ud83d\udd14 Menunggu Review</span>';
}

function renderInbox() {
  const content = document.querySelector('#inboxContent');
  if (!content) return;

  const items = inboxActiveTab === 'press'
    ? (window.PressStore ? window.PressStore.getAll() : [])
    : (window.ContactStore ? window.ContactStore.getAll() : []);

  if (items.length === 0) {
    const icon  = inboxActiveTab === 'press' ? '✉' : '📨';
    const label = inboxActiveTab === 'press' ? 'press release' : 'pesan masuk';
    content.innerHTML = `
      <div style="padding:48px 24px;text-align:center;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:12px">${icon}</div>
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">Belum ada ${label}</div>
        <div style="font-size:13px">Kiriman dari pembaca akan muncul di sini.</div>
      </div>`;
    return;
  }

  content.innerHTML = items.map(item => {
    if (inboxActiveTab === 'press') {
      // Build photo thumbnails
      const photoHtml = (item.photos && item.photos.length > 0)
        ? `<div style="margin-top:14px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:8px">📸 Foto Lampiran (${item.photos.length})</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${item.photos.map((p,i) => `
                <div style="position:relative">
                  <img src="${p.dataUrl}" alt="${escHtml(p.name)}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--line);cursor:pointer;transition:transform .15s" onclick="this.style.transform=this.style.transform?'':'scale(1.05)'" title="${escHtml(p.name)}" />
                  ${i===0 ? '<span style="position:absolute;bottom:3px;left:3px;background:var(--accent);color:#fff;font-size:8px;font-weight:800;padding:1px 5px;border-radius:999px">COVER</span>' : ''}
                </div>`).join('')}
            </div>
           </div>`
        : '';
      const borderColor = item.status === 'diterima' ? '#86efac' : item.status === 'ditolak' ? '#fca5a5' : 'var(--line)';
      const headerBg    = item.status === 'diterima' ? '#f0fdf4' : item.status === 'ditolak' ? '#fff5f5' : '#fafbfd';
      const headerBorder= item.status === 'diterima' ? '#86efac' : item.status === 'ditolak' ? '#fca5a5' : 'var(--line)';
      return `
        <div class="inbox-item" data-id="${item.id}" style="border:2px solid ${borderColor};border-radius:14px;margin-bottom:16px;overflow:hidden;background:#fff;box-shadow:var(--shadow-sm);transition:border-color .3s,box-shadow .3s">
          <!-- Card Header -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:14px 18px 10px;gap:12px;flex-wrap:wrap;background:${headerBg};border-bottom:1px solid ${headerBorder}">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;flex-wrap:wrap">
                <span style="background:#f5f0ff;color:#7c3aed;font-size:10px;font-weight:800;padding:3px 9px;border-radius:999px;letter-spacing:.3px">✉ PRESS RELEASE</span>
                ${item.kategori ? `<span style="background:#fffbeb;color:#92400e;font-size:10px;font-weight:700;padding:3px 9px;border-radius:999px">${escHtml(item.kategori)}</span>` : ''}
                ${item.photos && item.photos.length > 0 ? `<span style="background:#f0fdf4;color:#166534;font-size:10px;font-weight:700;padding:3px 9px;border-radius:999px">📸 ${item.photos.length} foto</span>` : ''}
                ${statusBadgeHtml(item.status)}
              </div>
              <div style="font-size:14px;font-weight:800;color:var(--text);line-height:1.3">${escHtml(item.judul)}</div>
              <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:4px">
                ${item.tanggal ? `<span style="font-size:11px;color:var(--muted)">📅 ${escHtml(item.tanggal)}</span>` : ''}
                <span style="font-size:11px;color:var(--muted)">${escHtml(item.ts)}</span>
                ${item.statusTs ? `<span style="font-size:11px;color:var(--muted);font-style:italic">Diproses: ${escHtml(item.statusTs)} oleh ${escHtml(item.statusBy||'Admin')}</span>` : ''}
              </div>
            </div>
            <button class="actBtn del" data-del-press="${item.id}" title="Hapus" style="flex-shrink:0">🗑</button>
          </div>

          <!-- Card Body -->
          <div style="padding:14px 18px">
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:12px">
              <div style="font-size:12px"><span style="color:var(--muted);font-weight:600">Pengirim:</span><br><strong>${escHtml(item.nama)}</strong></div>
              <div style="font-size:12px"><span style="color:var(--muted);font-weight:600">Organisasi:</span><br><strong>${escHtml(item.org)}</strong></div>
              <div style="font-size:12px"><span style="color:var(--muted);font-weight:600">Email:</span><br><a href="mailto:${escHtml(item.email)}" style="color:var(--blue);font-weight:600">${escHtml(item.email)}</a></div>
              ${item.telp ? `<div style="font-size:12px"><span style="color:var(--muted);font-weight:600">Telepon:</span><br><strong>${escHtml(item.telp)}</strong></div>` : ''}
              ${item.web  ? `<div style="font-size:12px"><span style="color:var(--muted);font-weight:600">Website:</span><br><a href="${escHtml(item.web)}" target="_blank" style="color:var(--blue);font-weight:600;font-size:11px">${escHtml(item.web)}</a></div>` : ''}
            </div>
            <div style="font-size:13px;line-height:1.7;color:#374151;background:#f8fafc;border:1px solid var(--line);border-radius:10px;padding:12px 14px;white-space:pre-wrap;max-height:200px;overflow-y:auto">${escHtml(item.isi)}</div>
            ${item.catatan ? `<div style="margin-top:10px;font-size:12.5px;color:var(--muted);font-style:italic;padding:8px 12px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a">📝 ${escHtml(item.catatan)}</div>` : ''}
            ${photoHtml}

            <!-- ── Accept / Reject Toolbar ── -->
            <div class="pr-action-bar">
              ${item.status !== 'diterima' ? `<button class="pr-btn-accept" data-accept="${item.id}"><span>✅</span> Terima &amp; Kirim Email</button>` : ''}
              ${item.status !== 'ditolak'  ? `<button class="pr-btn-reject" data-reject="${item.id}"><span>❌</span> Tolak &amp; Kirim Email</button>` : ''}
              ${(item.status === 'diterima' || item.status === 'ditolak') ? `<button class="pr-btn-reset" data-reset-status="${item.id}">🔄 Reset Status</button>` : ''}
              <a class="pr-btn-email-manual" href="mailto:${escHtml(item.email)}" title="Buka email manual">✉ Email Manual</a>
            </div>
          </div>
        </div>`;
    } else {
      const ssHtml = item.screenshot
        ? `<div style="margin-top:12px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:6px">📎 Screenshot Lampiran</div>
            <img src="${item.screenshot.dataUrl}" alt="Screenshot" style="max-width:100%;max-height:200px;object-fit:contain;border-radius:10px;border:1px solid var(--line);cursor:zoom-in" onclick="window.open(this.src,'_blank')" title="Klik untuk buka di tab baru" />
            <div style="font-size:11px;color:var(--muted);margin-top:4px">${escHtml(item.screenshot.name)} · ${(item.screenshot.size/1024).toFixed(1)} KB</div>
           </div>`
        : '';
      return `
        <div class="inbox-item" data-id="${item.id}" style="border:1px solid var(--line);border-radius:14px;margin-bottom:14px;overflow:hidden;background:#fff;box-shadow:var(--shadow-sm)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:16px 18px 12px;gap:12px;flex-wrap:wrap;background:#fafbfd;border-bottom:1px solid var(--line)">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
                <span style="background:#fff0f6;color:#be185d;font-size:10.5px;font-weight:800;padding:3px 9px;border-radius:999px;letter-spacing:.3px">📨 ${escHtml(item.subjek)}</span>
                ${item.screenshot ? '<span style="background:#f0fdf4;color:#166534;font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:999px">📎 Ada lampiran</span>' : ''}
                <span style="font-size:11px;color:var(--muted);font-weight:500">${escHtml(item.ts)}</span>
              </div>
              <div style="font-size:14px;font-weight:700;color:var(--text)">${escHtml(item.nama)} &mdash; <a href="mailto:${escHtml(item.email)}" style="color:var(--blue);font-weight:600;font-size:13px">${escHtml(item.email)}</a></div>
              ${item.telp ? `<div style="font-size:11.5px;color:var(--muted);margin-top:3px">📞 ${escHtml(item.telp)}</div>` : ''}
            </div>
            <button class="actBtn del" data-del-contact="${item.id}" title="Hapus" style="flex-shrink:0">🗑</button>
          </div>
          <div style="padding:14px 18px">
            <div style="font-size:13.5px;line-height:1.7;color:#374151;background:#f8fafc;border:1px solid var(--line);border-radius:10px;padding:12px 14px;white-space:pre-wrap">${escHtml(item.pesan)}</div>
            ${ssHtml}
          </div>
        </div>`;
    }
  }).join('');

  /* ── Automated email sender helper with fallback ── */
  async function sendEmailAutomatic(item, emailData) {
    const toast = window.Toast;
    try {
      if (toast) toast.show('Mengirim email otomatis...', 'info');
      await window.ApiClient.sendEmail(item.email, emailData.subject, emailData.body);
      if (toast) toast.show('Email otomatis berhasil dikirim! ✅', 'success');
      return true;
    } catch (err) {
      console.warn("Failed automatic email send:", err);
      if (toast) toast.show('Gagal mengirim otomatis. Membuka email manual...', 'info');
      const mailUrl = 'mailto:' + encodeURIComponent(item.email)
        + '?subject=' + encodeURIComponent(emailData.subject)
        + '&body=' + encodeURIComponent(emailData.body);
      window.location.href = mailUrl;
      return false;
    }
  }

  /* ── Accept button ── */
  content.querySelectorAll('[data-accept]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id   = Number(btn.dataset.accept);
      const item = updatePressStatus(id, 'diterima');
      if (!item) return;

      const emailData = getAcceptEmailData(item);
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Mengirim...';

      await sendEmailAutomatic(item, emailData);

      btn.disabled = false;
      btn.innerHTML = originalText;

      renderInbox();
      updateStats(window.NewsStore.getAll());
    });
  });

  /* ── Reject button ── */
  content.querySelectorAll('[data-reject]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id     = Number(btn.dataset.reject);
      const alasan = prompt('Alasan penolakan (opsional, akan disertakan dalam email):', '');
      if (alasan === null) return; // user batal

      const item = updatePressStatus(id, 'ditolak');
      if (!item) return;

      const emailData = getRejectEmailData(item, alasan);
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Mengirim...';

      await sendEmailAutomatic(item, emailData);

      btn.disabled = false;
      btn.innerHTML = originalText;

      renderInbox();
      updateStats(window.NewsStore.getAll());
    });
  });

  /* ── Reset status ── */
  content.querySelectorAll('[data-reset-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Reset status ke "Menunggu Review"?')) return;
      updatePressStatus(Number(btn.dataset.resetStatus), 'baru');
      if (window.Toast) window.Toast.show('Status direset 🔄', 'info');
      renderInbox();
    });
  });

  /* ── Delete press ── */
  content.querySelectorAll('[data-del-press]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Hapus press release ini?')) return;
      const id = Number(btn.dataset.delPress);
      if (window.PressStore) {
        localStorage.setItem('bk_press_releases', JSON.stringify(window.PressStore.getAll().filter(x => x.id !== id)));
      }
      updateStats(window.NewsStore.getAll());
      renderInbox();
    });
  });

  /* ── Delete contact ── */
  content.querySelectorAll('[data-del-contact]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Hapus pesan ini?')) return;
      const id = Number(btn.dataset.delContact);
      if (window.ContactStore) {
        localStorage.setItem('bk_contacts', JSON.stringify(window.ContactStore.getAll().filter(x => x.id !== id)));
      }
      updateStats(window.NewsStore.getAll());
      renderInbox();
    });
  });
}


function initInboxPanel() {
  const tabPress   = document.querySelector('#tabPress');
  const tabContact = document.querySelector('#tabContact');
  const clearBtn   = document.querySelector('#clearPressBtn');

  if (tabPress) tabPress.addEventListener('click', () => {
    inboxActiveTab = 'press';
    tabPress.classList.add('active');
    if (tabContact) tabContact.classList.remove('active');
    if (clearBtn) clearBtn.textContent = '🗑 Hapus Semua Press';
    renderInbox();
  });
  if (tabContact) tabContact.addEventListener('click', () => {
    inboxActiveTab = 'contact';
    tabContact.classList.add('active');
    if (tabPress) tabPress.classList.remove('active');
    if (clearBtn) clearBtn.textContent = '🗑 Hapus Semua Pesan';
    renderInbox();
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    const label = inboxActiveTab === 'press' ? 'semua press release' : 'semua pesan';
    if (!confirm(`Hapus ${label}? Tindakan ini tidak bisa dibatalkan.`)) return;
    if (inboxActiveTab === 'press') {
      localStorage.removeItem('bk_press_releases');
    } else {
      localStorage.removeItem('bk_contacts');
    }
    updateStats(window.NewsStore.getAll());
    renderInbox();
  });

  // Stat card shortcuts
  const pressCard   = document.querySelector('#statCardPress');
  const contactCard = document.querySelector('#statCardContact');
  if (pressCard) pressCard.addEventListener('click', () => {
    inboxActiveTab = 'press';
    if (tabPress) { tabPress.click(); }
    document.querySelector('#inboxPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  if (contactCard) contactCard.addEventListener('click', () => {
    inboxActiveTab = 'contact';
    if (tabContact) { tabContact.click(); }
    document.querySelector('#inboxPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  renderInbox();
}

document.addEventListener('DOMContentLoaded', init);
