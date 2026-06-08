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
  // Press & Contact counts diambil dari API secara async
  refreshInboxBadges();
}

async function refreshInboxBadges() {
  const el = id => document.querySelector('#'+id);
  try {
    const token = window.ApiClient && window.ApiClient.getToken ? window.ApiClient.getToken() : null;
    if (!token) return;
    const [pr, ct] = await Promise.all([
      window.ApiClient.request('/api/press'),
      window.ApiClient.request('/api/contact')
    ]);
    const pc = (pr.items||[]).length;
    const cc = (ct.items||[]).length;
    if(el('statPress'))    el('statPress').textContent    = pc;
    if(el('statContact'))  el('statContact').textContent  = cc;
    if(el('badgePress'))   el('badgePress').textContent   = pc;
    if(el('badgeContact')) el('badgeContact').textContent = cc;
  } catch {/* biarkan 0 jika gagal */}
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
    const kb=document.querySelector("#kompasBtn"); if(kb) kb.style.display="none";
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

  // --- KOMPAS.ID AUTO-TAKE LOGIC ---
  const kompasBtn = document.querySelector("#kompasBtn");
  const kompasOverlay = document.querySelector("#kompasOverlay");
  const closeKompas = () => {
    if (kompasOverlay) {
      kompasOverlay.classList.remove("open");
      document.body.style.overflow = "";
    }
  };

  if (kompasBtn) {
    kompasBtn.addEventListener("click", () => {
      // Clear hint & form
      const hint = document.querySelector("#kompasHint");
      if (hint) { hint.style.display = "none"; hint.textContent = ""; }
      document.querySelector("#kompasToken").value = "";
      document.querySelector("#kompasDomain").value = "";
      document.querySelector("input[name='kompasMode'][value='simulasi']").checked = true;
      document.querySelector("#kompasLiveFields").style.display = "none";

      // Populate Categories select
      const navSelect = document.querySelector("#kompasNavKey");
      if (navSelect) {
        navSelect.innerHTML = allCatOptions()
          .map(c => `<option value="${c.key}">${c.label}</option>`).join("");
      }

      // Open Modal
      if (kompasOverlay) {
        kompasOverlay.classList.add("open");
        document.body.style.overflow = "hidden";
      }
    });
  }

  // Toggle live fields
  document.querySelectorAll("input[name='kompasMode']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      const liveFields = document.querySelector("#kompasLiveFields");
      if (liveFields) {
        liveFields.style.display = e.target.value === "live" ? "block" : "none";
      }
    });
  });

  document.querySelector("#kompasClose")?.addEventListener("click", closeKompas);
  document.querySelector("#kompasCancelBtn")?.addEventListener("click", closeKompas);
  kompasOverlay?.addEventListener("click", e => {
    if (e.target === kompasOverlay) closeKompas();
  });

  // Sync action
  document.querySelector("#kompasSyncBtn")?.addEventListener("click", async () => {
    const syncBtn = document.querySelector("#kompasSyncBtn");
    const hint = document.querySelector("#kompasHint");
    
    const mode = document.querySelector("input[name='kompasMode']:checked").value;
    const token = document.querySelector("#kompasToken").value.trim();
    const domain = document.querySelector("#kompasDomain").value.trim();
    const navKey = document.querySelector("#kompasNavKey").value;
    const limit = Number(document.querySelector("#kompasLimit").value);

    if (mode === "live" && (!token || !domain)) {
      if (hint) {
        hint.style.display = "block";
        hint.className = "formHintMsg error";
        hint.textContent = "⚠ Token dan Domain wajib diisi untuk mode Live API.";
      }
      return;
    }

    // Set loading
    if (syncBtn) { syncBtn.disabled = true; syncBtn.textContent = "⏳ Mensinkronisasikan..."; }
    if (hint) { hint.style.display = "none"; }

    try {
      let res;
      if (useBackend) {
        res = await window.ApiClient.request("/api/kompas/sync", {
          method: "POST",
          body: JSON.stringify({ mode, token, domain, navKey, limit })
        });
      } else {
        // Fallback simulation for client-side mode (if backend not active)
        if (mode === "live") {
          throw new Error("Mode Live API memerlukan backend server yang aktif.");
        }
        
        // Mock client-side insertion
        const mockArts = [
          {
            title: "Digitalisasi Pasar Tradisional di Jawa Timur Dorong Efisiensi Transaksi UMKM",
            excerpt: "Penerapan sistem pembayaran digital QRIS dan digitalisasi tata kelola pedagang pasar di Jawa Timur terbukti melipatgandakan omzet UMKM lokal secara signifikan.",
            category: "EKONOMI & BISNIS",
            author: "Kabar Kompas",
            date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
            image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=75",
            body: "Surabaya, Kompas - Langkah digitalisasi pasar tradisional di berbagai wilayah Jawa Timur terus diakselerasi. Dinas Koperasi dan UMKM bekerja sama dengan Bank Indonesia menggalakkan penggunaan QRIS dan pencatatan keuangan digital bagi para pedagang.\n\nHasil evaluasi menunjukkan bahwa pasar-pasar yang telah menerapkan ekosistem digital mencatatkan peningkatan rata-rata omzet hingga 35 persen dalam kurun waktu enam bulan.\n\n\"Digitalisasi memotong rantai transaksi dan memberikan kepastian pencatatan keuangan bagi pedagang kecil. Mereka kini lebih mudah mengakses permodalan perbankan,\" ujar kepala dinas terkait.\n\nSelain pembayaran, sistem manajemen stok berbasis aplikasi sederhana juga mulai diperkenalkan guna mencegah kelangkaan bahan pokok di tingkat eceran.",
            tags: ["digitalisasi", "pasar", "umkm", "ekonomi", "jawatimur"]
          },
          {
            title: "Proyek Jalur Lingkar Selatan Sidoarjo Dipercepat Guna Kurangi Kemacetan Industri Krian",
            excerpt: "Pemerintah Kabupaten Sidoarjo mempercepat pembangunan infrastruktur jalan lingkar selatan guna mengalihkan arus kendaraan besar dari pusat kota Krian.",
            category: "PROPERTI & INFRASTRUKTUR",
            author: "Harian Kompas",
            date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
            image: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1600&q=75",
            body: "Sidoarjo, Kompas - Menumpuknya kendaraan logistik bertonase besar di persimpangan jalan utama Krian menjadi perhatian serius Pemkab Sidoarjo. Jalur Lingkar Selatan sepanjang 8,5 kilometer ditargetkan rampung pada awal tahun depan.\n\nBupati Sidoarjo menyampaikan bahwa percepatan pembebasan lahan kini telah mencapai 92 persen. Konstruksi jalan beton (rigid pavement) dirancang khusus agar mampu menahan beban kendaraan hingga 12 ton.\n\n\"Kami ingin arus logistik industri tetap lancar tanpa harus mengorbankan kenyamanan pengendara sepeda motor dan warga di kawasan pemukiman Krian,\" jelasnya saat meninjau proyek.\n\nDengan selesainya jalur lingkar ini, kemacetan di kawasan perlintasan kereta api Krian diperkirakan berkurang drastis hingga 40 persen.",
            tags: ["infrastruktur", "jalan", "sidoarjo", "krian", "kemacetan"]
          },
          {
            title: "Menjaga Kelestarian Ekosistem Sungai Brantas Melalui Gerakas Restorasi Komunitas Hijau Sidoarjo",
            excerpt: "Puluhan komunitas peduli lingkungan melakukan aksi bersih-bersih sampah plastik dan penanaman pohon pelindung di sepanjang bantaran Sungai Brantas Sidoarjo.",
            category: "LINGKUNGAN",
            author: "Kabar Kompas",
            date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=75",
            body: "Sidoarjo, Kompas - Restorasi ekologis Sungai Brantas menjadi agenda mendesak bagi komunitas lingkungan di Jawa Timur. Aksi kolaboratif akhir pekan kemarin berhasil mengumpulkan lebih dari 2,5 ton sampah plastik dari badan sungai.\n\nSelain pembersihan fisik, dilakukan pula penanaman 1.500 pohon vetiver dan bambu di tebing sungai guna mencegah erosi dan longsor bantaran.\n\nKoordinator gerakan menyatakan pentingnya partisipasi aktif warga bantaran. \"Sungai adalah sumber kehidupan, bukan tempat sampah raksasa. Edukasi pemilahan sampah dari rumah tangga terus kami galakkan,\" tuturnya.\n\nKegiatan ini juga didukung oleh sektor swasta setempat melalui dana tanggung jawab sosial perusahaan (CSR).",
            tags: ["lingkungan", "sungai", "brantas", "sidoarjo", "konservasi"]
          }
        ];
        res = { ok: true, count: Math.min(limit, mockArts.length), articles: mockArts.slice(0, limit) };
      }

      if (res && res.ok && res.articles) {
        // Save to client's window.NewsStore
        res.articles.forEach(art => {
          const clientCat = allCatOptions().find(c => c.key === navKey);
          window.NewsStore.upsert({
            id: Date.now() + Math.floor(Math.random() * 100000), // unique timestamp
            title: art.title,
            excerpt: art.excerpt,
            category: clientCat ? clientCat.label : art.category,
            navKey: navKey,
            tags: art.tags,
            image: art.image,
            author: art.author,
            date: art.date,
            body: art.body
          });
        });

        if (window.Toast) {
          window.Toast.show(`Berhasil mengimpor ${res.count} artikel Kompas.id! ⚡`, "success");
        }
        closeKompas();
        renderRows();
        updateStats(window.NewsStore.getAll());
        
        // If we ran with backend, reload after 1.2s to match new static templates
        if (useBackend) {
          setTimeout(() => { location.reload(); }, 1200);
        }
      } else {
        throw new Error(res.error || "Gagal sinkronisasi");
      }
    } catch (err) {
      if (hint) {
        hint.style.display = "block";
        hint.className = "formHintMsg error";
        hint.textContent = "❌ Error: " + (err.message || err);
      }
    } finally {
      if (syncBtn) { syncBtn.disabled = false; syncBtn.textContent = "⚡ Sinkronisasi Sekarang"; }
    }
  });

  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){ closeModal(); closeCmModal(); closeKompas(); }
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

/* ── Status update helper (via API) ── */
async function updatePressStatus(id, newStatus) {
  const who = document.querySelector('#who')?.textContent?.split('\u00b7')[0]?.trim() || 'Admin';
  const res = await window.ApiClient.request(`/api/press/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus, status_by: who })
  });
  return res.item;
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

async function renderInbox() {
  const content = document.querySelector('#inboxContent');
  if (!content) return;

  content.innerHTML = `<div style="padding:32px;text-align:center;color:var(--muted)">⏳ Memuat...</div>`;

  let items = [];
  try {
    const endpoint = inboxActiveTab === 'press' ? '/api/press' : '/api/contact';
    const data = await window.ApiClient.request(endpoint);
    items = data.items || [];
  } catch (err) {
    content.innerHTML = `<div style="padding:32px;text-align:center;color:var(--muted)">❌ Gagal memuat data: ${err.message||''}</div>`;
    return;
  }

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
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Mengirim...';
      try {
        const item = await updatePressStatus(id, 'diterima');
        if (!item) return;
        const emailData = getAcceptEmailData(item);
        await sendEmailAutomatic(item, emailData);
      } catch(e) {
        console.error(e);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        renderInbox();
        refreshInboxBadges();
      }
    });
  });

  /* ── Reject button ── */
  content.querySelectorAll('[data-reject]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id     = Number(btn.dataset.reject);
      const alasan = prompt('Alasan penolakan (opsional, akan disertakan dalam email):', '');
      if (alasan === null) return;
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Mengirim...';
      try {
        const item = await updatePressStatus(id, 'ditolak');
        if (!item) return;
        const emailData = getRejectEmailData(item, alasan);
        await sendEmailAutomatic(item, emailData);
      } catch(e) {
        console.error(e);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        renderInbox();
        refreshInboxBadges();
      }
    });
  });

  /* ── Reset status ── */
  content.querySelectorAll('[data-reset-status]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Reset status ke "Menunggu Review"?')) return;
      try {
        await updatePressStatus(Number(btn.dataset.resetStatus), 'menunggu');
        if (window.Toast) window.Toast.show('Status direset 🔄', 'info');
      } catch(e) { console.error(e); }
      renderInbox();
      refreshInboxBadges();
    });
  });

  /* ── Delete press ── */
  content.querySelectorAll('[data-del-press]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Hapus press release ini?')) return;
      const id = Number(btn.dataset.delPress);
      try {
        await window.ApiClient.request(`/api/press/${id}`, { method: 'DELETE' });
        if (window.Toast) window.Toast.show('Dihapus ✅', 'success');
      } catch(e) { console.error(e); }
      renderInbox();
      refreshInboxBadges();
    });
  });

  /* ── Delete contact ── */
  content.querySelectorAll('[data-del-contact]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Hapus pesan ini?')) return;
      const id = Number(btn.dataset.delContact);
      try {
        await window.ApiClient.request(`/api/contact/${id}`, { method: 'DELETE' });
        if (window.Toast) window.Toast.show('Dihapus ✅', 'success');
      } catch(e) { console.error(e); }
      renderInbox();
      refreshInboxBadges();
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

  if (clearBtn) clearBtn.addEventListener('click', async () => {
    const label = inboxActiveTab === 'press' ? 'semua press release' : 'semua pesan';
    if (!confirm(`Hapus ${label}? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const endpoint = inboxActiveTab === 'press' ? '/api/press' : '/api/contact';
      await window.ApiClient.request(endpoint, { method: 'DELETE' });
      if (window.Toast) window.Toast.show(`${label} dihapus`, 'success');
    } catch(e) {
      if (window.Toast) window.Toast.show('Gagal hapus: ' + (e.message||''), 'error');
    }
    renderInbox();
    refreshInboxBadges();
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

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   KELOLA IKLAN — Admin Ads Panel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const AD_SLOTS = [
  { slot: 'banner-header',  label: 'Banner Header',  w: 728, h: 90,  icon: '🖼️', color: '#3b82f6' },
  { slot: 'sidebar-square', label: 'Sidebar Square', w: 300, h: 300, icon: '📐', color: '#059669' },
];

let _adsData = { 'banner-header': [], 'sidebar-square': [] };
let _newAdImages = { 'banner-header': '', 'sidebar-square': '' };

async function loadAds() {
  const grid = document.querySelector('#adsGrid');
  if (!grid) return;

  const cfg = window.SITE_CONFIG || {};
  const useBackend = cfg.USE_BACKEND_AUTH === true;
  if (!useBackend) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--muted);font-size:13px">⚠ Fitur iklan memerlukan backend server yang aktif.</div>`;
    return;
  }

  try {
    const data = await window.ApiClient.request('/api/ads');
    _adsData = { 'banner-header': [], 'sidebar-square': [] };
    (data.items || []).forEach(a => {
      if (!_adsData[a.slot]) _adsData[a.slot] = [];
      _adsData[a.slot].push(a);
    });
    renderAdsPanel();
  } catch (e) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--accent);font-size:13px">❌ Gagal memuat data iklan: ${e.message}</div>`;
  }
}

function renderAdsPanel() {
  const grid = document.querySelector('#adsGrid');
  if (!grid) return;

  grid.innerHTML = AD_SLOTS.map(slot => {
    const ads = _adsData[slot.slot] || [];
    const tempImg = _newAdImages[slot.slot];
    
    // Render list of existing ads
    let adsListHtml = '';
    if (ads.length === 0) {
      adsListHtml = `<div style="text-align:center;padding:12px;font-size:12px;color:var(--muted)">Belum ada iklan di slot ini.</div>`;
    } else {
      adsListHtml = ads.map(ad => {
        const isActive = !!ad.active;
        return `
          <div class="adItem" data-id="${ad.id}" style="display:flex;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px;background:#f8fafc">
            <img src="${ad.image}" alt="Ad" style="width:48px;height:48px;object-fit:cover;border-radius:8px;background:#000;border:1px solid var(--line)" />
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
              <input type="url" class="fInput adItem-link" data-id="${ad.id}" placeholder="https://contoh.com/promo" value="${escHtml(ad.link || '')}" style="font-size:11.5px;padding:6px 10px;height:28px" />
              <div style="display:flex;align-items:center;justify-content:space-between">
                <label style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--text);cursor:pointer">
                  <input type="checkbox" class="adItem-active" data-id="${ad.id}" ${isActive ? 'checked' : ''} />
                  Aktif
                </label>
                <span style="font-size:9.5px;color:var(--muted)">${new Date(ad.updated_at).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <button class="adItem-save-btn" data-id="${ad.id}" data-slot="${slot.slot}" title="Simpan perubahan" style="padding:6px 8px;font-size:11px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer">💾</button>
              <button class="adItem-del-btn" data-id="${ad.id}" data-slot="${slot.slot}" title="Hapus iklan" style="padding:6px 8px;font-size:11px;background:#ef4444;color:#fff;border:none;border-radius:6px;cursor:pointer">🗑</button>
            </div>
          </div>
        `;
      }).join('');
    }

    return `
      <div class="adCard" id="adCard-${slot.slot}" style="border:1.5px solid var(--line);border-radius:16px;background:#fff;overflow:hidden;box-shadow:var(--shadow-sm)">
        
        <!-- Card Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--line);background:#fafbfd">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:10px;background:${slot.color}22;display:grid;place-items:center;font-size:18px">${slot.icon}</div>
            <div>
              <div style="font-size:13.5px;font-weight:800;color:var(--text)">${slot.label}</div>
              <div style="font-size:11px;color:var(--muted);font-weight:500">${slot.w} × ${slot.h} px</div>
            </div>
          </div>
        </div>

        <!-- Ads list container -->
        <div style="padding:14px 18px;border-bottom:1px solid var(--line);background:#fff">
          <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:10px">📋 Daftar Iklan Aktif (${ads.length})</div>
          <div style="display:flex;flex-direction:column;gap:10px;max-height:280px;overflow-y:auto;padding-right:4px">
            ${adsListHtml}
          </div>
        </div>

        <!-- Add New Ad section -->
        <div style="padding:14px 18px;background:#fafbfd">
          <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:10px">➕ Tambah Iklan Baru</div>
          
          <div class="adDropZone" id="adDrop-${slot.slot}"
               style="border:2px dashed ${tempImg ? '#86efac' : 'var(--line)'};border-radius:12px;background:${tempImg ? '#000' : '#fff'};min-height:90px;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;position:relative;transition:border-color .18s,background .18s"
               data-slot="${slot.slot}">
            ${tempImg
              ? `<img src="${tempImg}" alt="Preview" style="max-width:100%;max-height:80px;object-fit:contain;display:block;margin:auto" />`
              : `<div style="text-align:center;padding:12px 10px;pointer-events:none">
                  <div style="font-size:20px;margin-bottom:4px">🖼️</div>
                  <div style="font-size:11.5px;font-weight:700;color:var(--text)">Klik atau drag gambar baru</div>
                  <div style="font-size:10px;color:var(--muted)">JPG, PNG, WebP — maks. 4 MB</div>
                </div>`
            }
          </div>
          <input type="file" accept="image/*" id="adFile-${slot.slot}" style="display:none" data-slot="${slot.slot}" />

          <div style="margin-top:10px">
            <label style="font-size:10.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:4px">URL Tujuan</label>
            <input type="url" id="adNewLink-${slot.slot}" class="fInput" placeholder="https://contoh.com/promo" style="font-size:12px;padding:8px 10px;height:34px" />
          </div>

          <div style="margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:10px">
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:var(--text);cursor:pointer">
              <input type="checkbox" id="adNewActive-${slot.slot}" checked />
              Aktifkan langsung
            </label>
            <button class="btnSave adAddBtn" data-slot="${slot.slot}" style="padding:8px 14px;font-size:11.5px;height:34px">💾 Tambah</button>
          </div>
        </div>

        <!-- Hint -->
        <div id="adHint-${slot.slot}" class="formHintMsg" style="margin:0 18px 14px;display:none"></div>
      </div>
    `;
  }).join('');

  /* ── Wire events ── */
  AD_SLOTS.forEach(slot => {
    const dropZone = document.querySelector(`#adDrop-${slot.slot}`);
    const fileInput = document.querySelector(`#adFile-${slot.slot}`);
    const addBtn    = document.querySelector(`.adAddBtn[data-slot="${slot.slot}"]`);

    /* Upload via click */
    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = '#dc2626'; });
    dropZone?.addEventListener('dragleave', () => dropZone.style.borderColor = (_newAdImages[slot.slot] ? '#86efac' : 'var(--line)') );
    dropZone?.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.style.borderColor = (_newAdImages[slot.slot] ? '#86efac' : 'var(--line)');
      const file = e.dataTransfer.files?.[0];
      if (file) processAdFile(slot.slot, file);
    });
    fileInput?.addEventListener('change', () => {
      if (fileInput.files?.[0]) processAdFile(slot.slot, fileInput.files[0]);
      fileInput.value = '';
    });

    /* Add new ad */
    addBtn?.addEventListener('click', () => addNewAd(slot.slot));
  });

  // Wire list items (Save & Delete for existing ads)
  const gridEl = document.querySelector('#adsGrid');
  gridEl?.querySelectorAll('.adItem-save-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const slot = btn.dataset.slot;
      saveAdItem(id, slot);
    });
  });

  gridEl?.querySelectorAll('.adItem-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const slot = btn.dataset.slot;
      deleteAdItem(id, slot);
    });
  });
}

function processAdFile(slotName, file) {
  if (!file.type.startsWith('image/')) {
    showAdHint(slotName, '⚠ File harus berupa gambar.', 'error'); return;
  }
  if (file.size > 4 * 1024 * 1024) {
    showAdHint(slotName, '⚠ Ukuran gambar maksimal 4 MB.', 'error'); return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    _newAdImages[slotName] = e.target.result;
    renderAdsPanel();
    showAdHint(slotName, '✅ Gambar baru siap — klik Tambah untuk menyimpan.', 'success');
  };
  reader.readAsDataURL(file);
}

async function addNewAd(slotName) {
  const image = _newAdImages[slotName];
  if (!image) {
    showAdHint(slotName, '⚠ Harap pilih/unggah gambar terlebih dahulu!', 'error');
    return;
  }

  const linkInput   = document.querySelector(`#adNewLink-${slotName}`);
  const activeCheck = document.querySelector(`#adNewActive-${slotName}`);
  const addBtn      = document.querySelector(`.adAddBtn[data-slot="${slotName}"]`);

  const link = linkInput?.value.trim() || '';
  const active = activeCheck?.checked || false;

  if (addBtn) { addBtn.disabled = true; addBtn.textContent = '⏳ Menambahkan...'; }

  try {
    await window.ApiClient.request('/api/ads', {
      method: 'POST',
      body: JSON.stringify({ slot: slotName, image, link, active })
    });
    
    // Clear form
    _newAdImages[slotName] = '';
    
    showAdHint(slotName, '✅ Iklan baru berhasil ditambahkan!', 'success');
    await loadAds(); // Reload data & render
  } catch (e) {
    showAdHint(slotName, `❌ Gagal menambahkan: ${e.message}`, 'error');
    if (addBtn) { addBtn.disabled = false; addBtn.textContent = '💾 Tambah'; }
  }
}

async function saveAdItem(id, slotName) {
  const linkInput = document.querySelector(`.adItem-link[data-id="${id}"]`);
  const activeCheck = document.querySelector(`.adItem-active[data-id="${id}"]`);

  const link = linkInput?.value.trim() || '';
  const active = activeCheck?.checked || false;

  try {
    await window.ApiClient.request(`/api/ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ link, active })
    });
    showAdHint(slotName, '✅ Perubahan iklan berhasil disimpan!', 'success');
    await loadAds();
  } catch (e) {
    showAdHint(slotName, `❌ Gagal menyimpan: ${e.message}`, 'error');
  }
}

async function deleteAdItem(id, slotName) {
  if (!confirm('Hapus iklan ini secara permanen?')) return;
  try {
    await window.ApiClient.request(`/api/ads/${id}`, { method: 'DELETE' });
    showAdHint(slotName, '✅ Iklan berhasil dihapus!', 'success');
    await loadAds();
  } catch (e) {
    showAdHint(slotName, `❌ Gagal menghapus: ${e.message}`, 'error');
  }
}

function showAdHint(slotName, msg, type) {
  const el = document.querySelector(`#adHint-${slotName}`);
  if (!el) return;
  el.textContent = msg;
  el.className = 'formHintMsg ' + (type || '');
  el.style.display = 'block';
  setTimeout(() => { if (el.textContent === msg) { el.style.display = 'none'; } }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  loadAds();
});
