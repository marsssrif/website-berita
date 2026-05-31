/* ============================================================
   MODALS — Kirim Press Release & Hubungi Kami  v2.0
   + Drag & Drop Photo Upload
   + Multi-photo preview (maks 5)
   + Kategori press release
   + Tanggal rilis & URL website
   + Progress bar pengisian form
   + Hubungi Kami: upload screenshot lampiran
   Stores submissions in localStorage, readable by admin
   ============================================================ */

(function () {
  'use strict';

  /* ── Storage helpers ── */
  const PRESS_KEY   = 'bk_press_releases';
  const CONTACT_KEY = 'bk_contacts';

  function loadList(key)  { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
  function saveList(key, list) { localStorage.setItem(key, JSON.stringify(list)); }

  function addPressRelease(data) {
    const list = loadList(PRESS_KEY);
    list.unshift({ id: Date.now(), ts: new Date().toLocaleString('id-ID'), status: 'baru', ...data });
    saveList(PRESS_KEY, list);
  }
  function addContact(data) {
    const list = loadList(CONTACT_KEY);
    list.unshift({ id: Date.now(), ts: new Date().toLocaleString('id-ID'), status: 'baru', ...data });
    saveList(CONTACT_KEY, list);
  }

  window.PressStore   = { getAll: () => loadList(PRESS_KEY),   add: addPressRelease };
  window.ContactStore = { getAll: () => loadList(CONTACT_KEY), add: addContact };

  /* ── Photo store (in-memory while form open) ── */
  let pressPhotos   = []; // [{name, size, dataUrl}]
  let contactPhoto  = null; // {name, size, dataUrl}

  /* ── Build modal HTML ── */
  function buildModalHTML() {
    return `
    <div id="modalOverlay" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle" hidden>
      <div class="modal-box" id="modalBox">

        <!-- ══════════════ PRESS RELEASE MODAL ══════════════ -->
        <div id="pressModal" class="modal-panel">

          <!-- Header -->
          <div class="modal-header press-header">
            <div class="modal-icon">✉</div>
            <div style="flex:1;min-width:0">
              <h2 class="modal-title" id="modalTitle">Kirim Press Release</h2>
              <p class="modal-subtitle">Kirimkan siaran pers Anda kepada redaksi Berita Krian</p>
            </div>
            <button class="modal-close" id="pressClose" aria-label="Tutup">✕</button>
          </div>

          <!-- Progress bar -->
          <div class="pr-progress-wrap">
            <div class="pr-progress-bar"><div class="pr-progress-fill" id="prProgressFill"></div></div>
            <span class="pr-progress-label" id="prProgressLabel">0% terisi</span>
          </div>

          <form class="modal-form" id="pressForm" novalidate>

            <!-- ── Step badge ── -->
            <div class="pr-step-badge">📋 Informasi Pengirim</div>

            <div class="modal-grid-2">
              <div class="field">
                <label for="prNama">Nama Pengirim <span class="req">*</span></label>
                <input class="input" id="prNama" type="text" placeholder="Nama lengkap Anda" maxlength="80" required />
              </div>
              <div class="field">
                <label for="prOrg">Organisasi / Perusahaan <span class="req">*</span></label>
                <input class="input" id="prOrg" type="text" placeholder="Nama instansi / perusahaan" maxlength="100" required />
              </div>
            </div>

            <div class="modal-grid-3">
              <div class="field">
                <label for="prEmail">Email <span class="req">*</span></label>
                <input class="input" id="prEmail" type="email" placeholder="email@contoh.com" maxlength="120" required />
              </div>
              <div class="field">
                <label for="prTelp">No. Telepon / WhatsApp</label>
                <input class="input" id="prTelp" type="tel" placeholder="08xx-xxxx-xxxx" maxlength="20" />
              </div>
              <div class="field">
                <label for="prWeb">Website / Media Sosial</label>
                <input class="input" id="prWeb" type="url" placeholder="https://website.com" maxlength="200" />
              </div>
            </div>

            <!-- ── Step badge ── -->
            <div class="pr-step-badge" style="margin-top:4px">📰 Detail Press Release</div>

            <div class="modal-grid-2">
              <div class="field">
                <label for="prKategori">Kategori <span class="req">*</span></label>
                <select class="input" id="prKategori" required>
                  <option value="">-- Pilih kategori --</option>
                  <option value="Peluncuran Produk">🚀 Peluncuran Produk / Layanan</option>
                  <option value="Acara / Event">📅 Acara / Event</option>
                  <option value="Kerja Sama">🤝 Kerja Sama / MoU</option>
                  <option value="Penghargaan">🏆 Penghargaan / Award</option>
                  <option value="CSR / Sosial">🌱 CSR / Program Sosial</option>
                  <option value="Pemerintahan">🏛 Pemerintahan / Kebijakan</option>
                  <option value="Ekonomi Bisnis">💼 Ekonomi & Bisnis</option>
                  <option value="Lainnya">📌 Lainnya</option>
                </select>
              </div>
              <div class="field">
                <label for="prTanggal">Tanggal Rilis / Acara</label>
                <input class="input" id="prTanggal" type="date" />
              </div>
            </div>

            <div class="field">
              <label for="prJudul">Judul Press Release <span class="req">*</span></label>
              <input class="input" id="prJudul" type="text" placeholder="Masukkan judul siaran pers yang menarik" maxlength="200" required />
              <span class="field-hint" id="prJudulCount">0 / 200 karakter</span>
            </div>

            <div class="field">
              <label for="prIsi">Isi Press Release <span class="req">*</span></label>
              <textarea class="input" id="prIsi" placeholder="Tuliskan isi press release di sini...&#10;&#10;Gunakan format 5W+1H: Apa, Siapa, Kapan, Di mana, Mengapa, dan Bagaimana." rows="7" maxlength="5000" required></textarea>
              <span class="field-hint" id="prIsiCount">0 / 5000 karakter</span>
            </div>

            <!-- ── Foto / Lampiran ── -->
            <div class="pr-step-badge" style="margin-top:4px">📸 Foto & Lampiran <span style="font-weight:400;opacity:.6">(opsional, maks 5 foto)</span></div>

            <!-- Drop Zone -->
            <div class="field">
              <div class="pr-dropzone" id="prDropZone" tabindex="0" role="button" aria-label="Upload foto press release">
                <input type="file" id="prFileInput" accept="image/jpeg,image/png,image/webp,image/gif" multiple style="display:none" />
                <div class="pr-dropzone__inner" id="prDropInner">
                  <div class="pr-dropzone__icon">🖼️</div>
                  <div class="pr-dropzone__title">Drag &amp; drop foto ke sini</div>
                  <div class="pr-dropzone__sub">atau <span class="pr-dropzone__browse">klik untuk pilih file</span></div>
                  <div class="pr-dropzone__hint">JPG, PNG, WebP — maks. 3 MB per foto · hingga 5 foto</div>
                </div>
                <div class="pr-dropzone__overlay" id="prDropOverlay">
                  <span class="pr-dropzone__overlay-text">Lepaskan untuk Upload 📸</span>
                </div>
              </div>
              <!-- Photo preview grid -->
              <div class="pr-photo-grid" id="prPhotoGrid"></div>
              <div class="field-hint" id="prPhotoHint" style="display:none"></div>
            </div>

            <!-- ── Catatan ── -->
            <div class="pr-step-badge" style="margin-top:4px">📝 Catatan Tambahan</div>

            <div class="field">
              <label for="prCatatan">Catatan untuk Redaksi</label>
              <textarea class="input" id="prCatatan" placeholder="Informasi tambahan untuk redaksi, narahubung, atau permintaan khusus (opsional)..." rows="3" maxlength="500"></textarea>
              <span class="field-hint" id="prCatatanCount">0 / 500 karakter</span>
            </div>

            <div class="field">
              <label class="pr-checkbox-label" for="prSetuju">
                <input type="checkbox" id="prSetuju" required />
                <span class="pr-checkmark"></span>
                <span>Saya menyatakan bahwa informasi yang dikirim adalah benar dan merupakan siaran pers resmi dari organisasi saya. <span class="req">*</span></span>
              </label>
            </div>

            <div class="modal-footer">
              <button type="button" class="modal-btn-cancel" id="pressBtnCancel">Batal</button>
              <button type="submit" class="modal-btn-submit press-submit" id="pressBtnSubmit">
                <span class="btn-icon">✉</span> Kirim Press Release
              </button>
            </div>
          </form>
        </div>

        <!-- ══════════════ HUBUNGI KAMI MODAL ══════════════ -->
        <div id="contactModal" class="modal-panel" hidden>
          <div class="modal-header contact-header">
            <div class="modal-icon contact-icon">☎</div>
            <div style="flex:1;min-width:0">
              <h2 class="modal-title">Hubungi Kami</h2>
              <p class="modal-subtitle">Sampaikan pertanyaan atau masukan kepada tim Berita Krian</p>
            </div>
            <button class="modal-close" id="contactClose" aria-label="Tutup">✕</button>
          </div>

          <div class="contact-info-grid">
            <div class="contact-info-box">
              <span class="ci-icon">📍</span>
              <div>
                <div class="ci-label">Alamat Redaksi</div>
                <div class="ci-val">Jl. Raya Krian No. 1, Sidoarjo, Jawa Timur</div>
              </div>
            </div>
            <div class="contact-info-box">
              <span class="ci-icon">📞</span>
              <div>
                <div class="ci-label">Telepon</div>
                <div class="ci-val">(031) 123-4567</div>
              </div>
            </div>
            <div class="contact-info-box">
              <span class="ci-icon">✉</span>
              <div>
                <div class="ci-label">Email Redaksi</div>
                <div class="ci-val">redaksi@beritakrian.com</div>
              </div>
            </div>
            <div class="contact-info-box">
              <span class="ci-icon">🕐</span>
              <div>
                <div class="ci-label">Jam Operasional</div>
                <div class="ci-val">Senin – Jumat, 08.00 – 17.00 WIB</div>
              </div>
            </div>
          </div>

          <div class="modal-divider"><span>atau kirim pesan langsung</span></div>

          <form class="modal-form" id="contactForm" novalidate>
            <div class="modal-grid-2">
              <div class="field">
                <label for="ctNama">Nama <span class="req">*</span></label>
                <input class="input" id="ctNama" type="text" placeholder="Nama lengkap Anda" maxlength="80" required />
              </div>
              <div class="field">
                <label for="ctEmail">Email <span class="req">*</span></label>
                <input class="input" id="ctEmail" type="email" placeholder="email@contoh.com" maxlength="120" required />
              </div>
            </div>
            <div class="modal-grid-2">
              <div class="field">
                <label for="ctTelp">No. Telepon</label>
                <input class="input" id="ctTelp" type="tel" placeholder="08xx-xxxx-xxxx" maxlength="20" />
              </div>
              <div class="field">
                <label for="ctSubjek">Topik Pesan <span class="req">*</span></label>
                <select class="input" id="ctSubjek" required>
                  <option value="">-- Pilih topik --</option>
                  <option value="Pertanyaan Umum">❓ Pertanyaan Umum</option>
                  <option value="Koreksi Berita">✏️ Koreksi Berita</option>
                  <option value="Pasang Iklan">📢 Pasang Iklan</option>
                  <option value="Kerja Sama Media">🤝 Kerja Sama Media</option>
                  <option value="Laporan / Aduan">🚨 Laporan / Aduan</option>
                  <option value="Saran & Masukan">💡 Saran & Masukan</option>
                  <option value="Lainnya">📌 Lainnya</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label for="ctPesan">Pesan <span class="req">*</span></label>
              <textarea class="input" id="ctPesan" placeholder="Tuliskan pesan Anda secara detail agar tim kami dapat membantu dengan baik..." rows="5" maxlength="2000" required></textarea>
              <span class="field-hint" id="ctPesanCount">0 / 2000 karakter</span>
            </div>

            <!-- Screenshot / Lampiran -->
            <div class="field">
              <label>Lampiran Screenshot <span style="color:var(--muted);font-weight:400">(opsional)</span></label>
              <div class="ct-dropzone" id="ctDropZone" tabindex="0" role="button" aria-label="Upload screenshot">
                <input type="file" id="ctFileInput" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none" />
                <div class="ct-dropzone__inner" id="ctDropInner">
                  <span style="font-size:24px">📎</span>
                  <span class="ct-dropzone__text">Klik atau drop screenshot di sini</span>
                  <span class="ct-dropzone__hint">JPG, PNG — maks. 3 MB</span>
                </div>
                <div class="ct-dropzone__preview" id="ctPreviewWrap" style="display:none">
                  <img id="ctPreviewImg" src="" alt="Preview" />
                  <button type="button" class="ct-remove-btn" id="ctRemoveBtn" title="Hapus lampiran">✕</button>
                </div>
                <div class="pr-dropzone__overlay" id="ctDropOverlay">
                  <span class="pr-dropzone__overlay-text">Lepaskan untuk Upload 📎</span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="modal-btn-cancel" id="contactBtnCancel">Batal</button>
              <button type="submit" class="modal-btn-submit contact-submit">
                <span class="btn-icon">📨</span> Kirim Pesan
              </button>
            </div>
          </form>
        </div>

        <!-- ══════════════ SUCCESS PANEL ══════════════ -->
        <div id="successPanel" class="modal-panel success-panel" hidden>
          <div class="success-anim">
            <div class="success-circle">
              <span class="success-check">✓</span>
            </div>
          </div>
          <h2 class="success-title" id="successTitle">Berhasil Terkirim!</h2>
          <p class="success-msg" id="successMsg">Terima kasih! Pesan Anda telah kami terima dan akan segera ditindaklanjuti.</p>
          <div class="success-details" id="successDetails"></div>
          <button class="modal-btn-submit success-panel-btn" id="successClose" style="margin-top:24px;min-width:160px">Tutup</button>
        </div>

      </div>
    </div>`;
  }

  /* ── Inject ── */
  function injectModal() {
    if (document.getElementById('modalOverlay')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildModalHTML();
    document.body.appendChild(wrapper.firstElementChild);
  }

  /* ── Panel switch ── */
  function showPanel(panelId) {
    ['pressModal','contactModal','successPanel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = (id !== panelId);
    });
  }

  /* ── Open / Close ── */
  function openOverlay(panelId) {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    showPanel(panelId);
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-open')));
  }
  function closeOverlay() {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.hidden = true; }, 300);
  }

  /* ── Validation ── */
  function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function showToast(msg, type) { if (window.Toast) window.Toast.show(msg, type); }

  /* ── Format file size ── */
  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /* ══════════════════════════════════════
     PRESS RELEASE — Photo Drop Zone
  ══════════════════════════════════════ */
  function initPressDropZone() {
    const zone      = document.getElementById('prDropZone');
    const fileInput = document.getElementById('prFileInput');
    const grid      = document.getElementById('prPhotoGrid');
    const hint      = document.getElementById('prPhotoHint');
    const overlay   = document.getElementById('prDropOverlay');
    if (!zone || !fileInput) return;

    const MAX_FILES = 5;
    const MAX_SIZE  = 3 * 1024 * 1024;

    function renderGrid() {
      if (pressPhotos.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        hint.style.display = 'none';
        zone.querySelector('#prDropInner').style.display = '';
        return;
      }
      zone.querySelector('#prDropInner').style.display = 'none';
      grid.style.display = 'grid';
      hint.style.display = 'block';
      hint.textContent = `${pressPhotos.length} foto dipilih · Total: ${fmtSize(pressPhotos.reduce((s,f) => s + f.size, 0))}`;

      grid.innerHTML = pressPhotos.map((p, i) => `
        <div class="pr-photo-item" data-idx="${i}">
          <img src="${p.dataUrl}" alt="${p.name}" class="pr-photo-thumb" />
          <div class="pr-photo-info">
            <span class="pr-photo-name">${p.name}</span>
            <span class="pr-photo-size">${fmtSize(p.size)}</span>
          </div>
          <button type="button" class="pr-photo-del" data-idx="${i}" title="Hapus foto ini">✕</button>
          ${i === 0 ? '<span class="pr-photo-badge">Cover</span>' : ''}
        </div>
      `).join('');

      grid.querySelectorAll('.pr-photo-del').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          pressPhotos.splice(Number(btn.dataset.idx), 1);
          renderGrid();
          updateProgress();
        });
      });
    }

    function processFiles(files) {
      const remaining = MAX_FILES - pressPhotos.length;
      if (remaining <= 0) { showToast(`Maksimal ${MAX_FILES} foto!`, 'error'); return; }
      let added = 0;
      Array.from(files).slice(0, remaining).forEach(file => {
        if (!file.type.startsWith('image/')) { showToast(`${file.name} bukan gambar.`, 'error'); return; }
        if (file.size > MAX_SIZE) { showToast(`${file.name} terlalu besar (maks 3 MB).`, 'error'); return; }
        const reader = new FileReader();
        reader.onload = e => {
          pressPhotos.push({ name: file.name, size: file.size, dataUrl: e.target.result });
          renderGrid();
          updateProgress();
        };
        reader.readAsDataURL(file);
        added++;
      });
      if (added > 0 && pressPhotos.length < MAX_FILES) {
        showToast(`${added} foto ditambahkan`, 'success');
      }
    }

    // Click to browse
    zone.addEventListener('click', e => {
      if (e.target.classList.contains('pr-photo-del')) return;
      fileInput.click();
    });
    zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) processFiles(fileInput.files); fileInput.value = ''; });

    // Drag & Drop
    zone.addEventListener('dragenter', e => { e.preventDefault(); overlay.classList.add('visible'); });
    zone.addEventListener('dragover',  e => { e.preventDefault(); overlay.classList.add('visible'); });
    zone.addEventListener('dragleave', e => { if (!zone.contains(e.relatedTarget)) overlay.classList.remove('visible'); });
    zone.addEventListener('drop', e => {
      e.preventDefault();
      overlay.classList.remove('visible');
      processFiles(e.dataTransfer.files);
    });
  }

  /* ══════════════════════════════════════
     CONTACT — Screenshot Drop Zone
  ══════════════════════════════════════ */
  function initContactDropZone() {
    const zone      = document.getElementById('ctDropZone');
    const fileInput = document.getElementById('ctFileInput');
    const preview   = document.getElementById('ctPreviewWrap');
    const img       = document.getElementById('ctPreviewImg');
    const removeBtn = document.getElementById('ctRemoveBtn');
    const inner     = document.getElementById('ctDropInner');
    const overlay   = document.getElementById('ctDropOverlay');
    if (!zone || !fileInput) return;

    const MAX_SIZE = 3 * 1024 * 1024;

    function setPreview(file) {
      if (!file || !file.type.startsWith('image/')) { showToast('File harus berupa gambar!', 'error'); return; }
      if (file.size > MAX_SIZE) { showToast('Gambar terlalu besar (maks 3 MB).', 'error'); return; }
      const reader = new FileReader();
      reader.onload = e => {
        contactPhoto = { name: file.name, size: file.size, dataUrl: e.target.result };
        img.src = e.target.result;
        preview.style.display = 'flex';
        inner.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
    function clearPreview() {
      contactPhoto = null;
      img.src = '';
      preview.style.display = 'none';
      inner.style.display = '';
    }

    zone.addEventListener('click', e => { if (e.target === removeBtn || removeBtn.contains(e.target)) return; fileInput.click(); });
    zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) setPreview(fileInput.files[0]); fileInput.value = ''; });
    removeBtn.addEventListener('click', e => { e.stopPropagation(); clearPreview(); });

    zone.addEventListener('dragenter', e => { e.preventDefault(); overlay.classList.add('visible'); });
    zone.addEventListener('dragover',  e => { e.preventDefault(); overlay.classList.add('visible'); });
    zone.addEventListener('dragleave', e => { if (!zone.contains(e.relatedTarget)) overlay.classList.remove('visible'); });
    zone.addEventListener('drop', e => {
      e.preventDefault();
      overlay.classList.remove('visible');
      if (e.dataTransfer.files[0]) setPreview(e.dataTransfer.files[0]);
    });
  }

  /* ══════════════════════════════════════
     PROGRESS BAR
  ══════════════════════════════════════ */
  const PRESS_FIELDS_REQUIRED = ['prNama','prOrg','prEmail','prKategori','prJudul','prIsi'];

  function updateProgress() {
    const fill  = document.getElementById('prProgressFill');
    const label = document.getElementById('prProgressLabel');
    if (!fill || !label) return;

    let filled = 0;
    PRESS_FIELDS_REQUIRED.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim()) filled++;
    });
    // bonus for photos and checkbox
    if (pressPhotos.length > 0) filled += 0.5;
    const chk = document.getElementById('prSetuju');
    if (chk && chk.checked) filled += 0.5;

    const pct = Math.min(100, Math.round((filled / (PRESS_FIELDS_REQUIRED.length + 1)) * 100));
    fill.style.width = pct + '%';
    fill.style.background = pct < 40
      ? 'linear-gradient(90deg, #f59e0b, #f97316)'
      : pct < 80
        ? 'linear-gradient(90deg, #3b82f6, #6366f1)'
        : 'linear-gradient(90deg, #10b981, #059669)';
    label.textContent = pct + '% terisi';
  }

  /* ── Wire Events ── */
  function wireEvents() {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;

    overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });

    ['pressClose','contactClose','pressBtnCancel','contactBtnCancel','successClose'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', closeOverlay);
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay(); });

    /* ── Character counters ── */
    const counters = [
      ['prJudul',   'prJudulCount',   200,  'karakter'],
      ['prIsi',     'prIsiCount',     5000, 'karakter'],
      ['prCatatan', 'prCatatanCount', 500,  'karakter'],
      ['ctPesan',   'ctPesanCount',   2000, 'karakter'],
    ];
    counters.forEach(([fid, cid, max]) => {
      const f = document.getElementById(fid);
      const c = document.getElementById(cid);
      if (f && c) {
        f.addEventListener('input', () => {
          const len = f.value.length;
          c.textContent = `${len} / ${max} karakter`;
          c.style.color = len > max * 0.9 ? '#ef4444' : '';
          updateProgress();
        });
      }
    });

    /* Progress bar on all required field changes */
    PRESS_FIELDS_REQUIRED.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateProgress);
    });
    const chk = document.getElementById('prSetuju');
    if (chk) chk.addEventListener('change', updateProgress);

    /* ── Drop zones ── */
    initPressDropZone();
    initContactDropZone();

    /* ──────────────────────────────────
       PRESS RELEASE SUBMIT
    ────────────────────────────────── */
    const pressForm = document.getElementById('pressForm');
    if (pressForm) {
      pressForm.addEventListener('submit', e => {
        e.preventDefault();
        const nama      = document.getElementById('prNama').value.trim();
        const org       = document.getElementById('prOrg').value.trim();
        const email     = document.getElementById('prEmail').value.trim();
        const kategori  = document.getElementById('prKategori').value;
        const judul     = document.getElementById('prJudul').value.trim();
        const isi       = document.getElementById('prIsi').value.trim();
        const setuju    = document.getElementById('prSetuju').checked;

        if (!nama)     { showToast('Nama pengirim wajib diisi!', 'error'); scrollToField('prNama'); return; }
        if (!org)      { showToast('Nama organisasi wajib diisi!', 'error'); scrollToField('prOrg'); return; }
        if (!email || !validateEmail(email)) { showToast('Email tidak valid!', 'error'); scrollToField('prEmail'); return; }
        if (!kategori) { showToast('Pilih kategori press release!', 'error'); scrollToField('prKategori'); return; }
        if (!judul)    { showToast('Judul press release wajib diisi!', 'error'); scrollToField('prJudul'); return; }
        if (isi.length < 20) { showToast('Isi press release terlalu singkat!', 'error'); scrollToField('prIsi'); return; }
        if (!setuju)   { showToast('Centang pernyataan persetujuan terlebih dahulu!', 'error'); return; }

        addPressRelease({
          nama, org, email,
          telp:     document.getElementById('prTelp').value.trim(),
          web:      document.getElementById('prWeb').value.trim(),
          kategori,
          tanggal:  document.getElementById('prTanggal').value,
          judul, isi,
          catatan:  document.getElementById('prCatatan').value.trim(),
          photos:   pressPhotos.map(p => ({ name: p.name, size: p.size, dataUrl: p.dataUrl })),
          photoCount: pressPhotos.length,
        });

        // Reset
        pressForm.reset();
        pressPhotos = [];
        document.getElementById('prPhotoGrid').innerHTML = '';
        document.getElementById('prPhotoGrid').style.display = 'none';
        document.getElementById('prPhotoHint').style.display = 'none';
        document.getElementById('prDropInner').style.display = '';
        document.getElementById('prProgressFill').style.width = '0%';
        document.getElementById('prProgressLabel').textContent = '0% terisi';
        counters.forEach(([fid, cid, max]) => {
          const c = document.getElementById(cid);
          if (c) c.textContent = `0 / ${max} karakter`;
        });

        document.getElementById('successTitle').textContent = 'Press Release Terkirim! ✉';
        document.getElementById('successMsg').textContent =
          `Terima kasih, ${nama}! Press release "${judul}" berhasil diterima oleh redaksi Berita Krian.`;
        document.getElementById('successDetails').innerHTML = `
          <div class="success-detail-row"><span>📰 Kategori</span><strong>${kategori}</strong></div>
          <div class="success-detail-row"><span>🏢 Organisasi</span><strong>${org}</strong></div>
          <div class="success-detail-row"><span>📧 Email konfirmasi</span><strong>${email}</strong></div>
          ${pressPhotos.length > 0 ? `<div class="success-detail-row"><span>📸 Foto</span><strong>${pressPhotos.length} foto terlampir</strong></div>` : ''}
          <div class="success-note">Tim redaksi akan menghubungi Anda dalam 1–3 hari kerja.</div>
        `;
        showPanel('successPanel');
      });
    }

    /* ──────────────────────────────────
       CONTACT SUBMIT
    ────────────────────────────────── */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', e => {
        e.preventDefault();
        const nama   = document.getElementById('ctNama').value.trim();
        const email  = document.getElementById('ctEmail').value.trim();
        const subjek = document.getElementById('ctSubjek').value;
        const pesan  = document.getElementById('ctPesan').value.trim();

        if (!nama)   { showToast('Nama wajib diisi!', 'error'); return; }
        if (!email || !validateEmail(email)) { showToast('Email tidak valid!', 'error'); return; }
        if (!subjek) { showToast('Pilih topik pesan!', 'error'); return; }
        if (pesan.length < 5) { showToast('Pesan terlalu singkat!', 'error'); return; }

        addContact({
          nama, email,
          telp:   document.getElementById('ctTelp').value.trim(),
          subjek, pesan,
          screenshot: contactPhoto ? { name: contactPhoto.name, size: contactPhoto.size, dataUrl: contactPhoto.dataUrl } : null,
        });

        // Reset
        contactForm.reset();
        contactPhoto = null;
        const ci = document.getElementById('ctDropInner');
        const cp = document.getElementById('ctPreviewWrap');
        if (ci) ci.style.display = '';
        if (cp) cp.style.display = 'none';
        const ctCnt = document.getElementById('ctPesanCount');
        if (ctCnt) ctCnt.textContent = '0 / 2000 karakter';

        document.getElementById('successTitle').textContent = 'Pesan Terkirim! 📨';
        document.getElementById('successMsg').textContent =
          `Terima kasih, ${nama}! Pesan Anda tentang "${subjek}" telah kami terima.`;
        document.getElementById('successDetails').innerHTML = `
          <div class="success-detail-row"><span>📧 Balasan ke</span><strong>${email}</strong></div>
          <div class="success-detail-row"><span>📌 Topik</span><strong>${subjek}</strong></div>
          <div class="success-note">Kami akan membalas dalam 1×24 jam kerja.</div>
        `;
        showPanel('successPanel');
      });
    }

    wireTriggers();
  }

  function scrollToField(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function wireTriggers() {
    ['btnPressRelease','footerBtnPress'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', e => { e.preventDefault(); pressPhotos = []; openOverlay('pressModal'); });
    });
    ['btnHubungi','footerBtnHubungi'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', e => { e.preventDefault(); contactPhoto = null; openOverlay('contactModal'); });
    });

    document.querySelectorAll('a[href="#"]').forEach(el => {
      if (el.dataset.modalWired) return;
      const txt = el.textContent.trim().toLowerCase();
      if (txt.includes('press release')) {
        el.dataset.modalWired = '1';
        el.addEventListener('click', e => { e.preventDefault(); pressPhotos = []; openOverlay('pressModal'); });
      } else if (txt.includes('hubungi kami')) {
        el.dataset.modalWired = '1';
        el.addEventListener('click', e => { e.preventDefault(); contactPhoto = null; openOverlay('contactModal'); });
      }
    });
  }

  window.Modals = {
    openPress:   () => { pressPhotos = []; openOverlay('pressModal'); },
    openContact: () => { contactPhoto = null; openOverlay('contactModal'); },
    close:       closeOverlay
  };

  function init() { injectModal(); wireEvents(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
