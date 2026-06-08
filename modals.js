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

  /* ── Storage helpers — sekarang pakai server API ── */
  async function addPressRelease(data) {
    try {
      const res = await fetch('/api/press', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal mengirim ke server');
      }
      return await res.json();
    } catch (e) {
      console.error('addPressRelease error:', e);
      throw e;
    }
  }
  async function addContact(data) {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal mengirim ke server');
      }
      return await res.json();
    } catch (e) {
      console.error('addContact error:', e);
      throw e;
    }
  }

  // Stub tetap ada untuk kompatibilitas admin.js lama
  window.PressStore   = { getAll: () => [], add: addPressRelease };
  window.ContactStore = { getAll: () => [], add: addContact };

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
      pressForm.addEventListener('submit', async e => {
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

        const submitBtn = document.getElementById('pressBtnSubmit');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Mengirim...'; }

        try {
          await addPressRelease({
            nama, org, email,
            telp:     document.getElementById('prTelp').value.trim(),
            web:      document.getElementById('prWeb').value.trim(),
            kategori,
            tanggal:  document.getElementById('prTanggal').value,
            judul, isi,
            catatan:  document.getElementById('prCatatan').value.trim(),
            photos:   pressPhotos.map(p => ({ name: p.name, size: p.size, dataUrl: p.dataUrl })),
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
            <div class="success-note">Tim redaksi akan menghubungi Anda dalam 1–3 hari kerja.</div>
          `;
          showPanel('successPanel');
        } catch (err) {
          showToast('Gagal mengirim: ' + (err.message || 'Server error'), 'error');
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<span class="btn-icon">✉</span> Kirim Press Release'; }
        }
      });
    }

    /* ──────────────────────────────────
       CONTACT SUBMIT
    ────────────────────────────────── */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', async e => {
        e.preventDefault();
        const nama   = document.getElementById('ctNama').value.trim();
        const email  = document.getElementById('ctEmail').value.trim();
        const subjek = document.getElementById('ctSubjek').value;
        const pesan  = document.getElementById('ctPesan').value.trim();

        if (!nama)   { showToast('Nama wajib diisi!', 'error'); return; }
        if (!email || !validateEmail(email)) { showToast('Email tidak valid!', 'error'); return; }
        if (!subjek) { showToast('Pilih topik pesan!', 'error'); return; }
        if (pesan.length < 5) { showToast('Pesan terlalu singkat!', 'error'); return; }

        const submitBtn = contactForm.querySelector('[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Mengirim...'; }

        try {
          await addContact({
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
        } catch (err) {
          showToast('Gagal mengirim: ' + (err.message || 'Server error'), 'error');
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<span class="btn-icon">📨</span> Kirim Pesan'; }
        }
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

/* ============================================================
   INFO MODALS — Syarat & Ketentuan | Kebijakan Privasi | Sitemap
   ============================================================ */
(function () {
  'use strict';

  /* ── Konten setiap modal ── */
  const MODALS = {
    tentang: {
      title: '🏢 Tentang Kami',
      content: `
        <div class="im-about-hero">
          <div class="im-about-logo">BK</div>
          <div>
            <div class="im-about-name">BERITA <span>KRIAN</span></div>
            <div class="im-about-tagline">Portal Berita Krian Terpercaya</div>
          </div>
        </div>
        <p>Berita Krian adalah portal berita digital yang didedikasikan untuk menyajikan informasi terkini, akurat, dan berimbang seputar Krian dan wilayah Sidoarjo. Kami hadir sebagai jembatan informasi antara pemerintah, masyarakat, dan dunia usaha di kawasan Krian.</p>

        <div class="im-section">
          <h3>Visi Kami</h3>
          <p>Menjadi portal berita digital terdepan di Krian yang dipercaya oleh masyarakat sebagai sumber informasi yang akurat, cepat, dan bertanggung jawab.</p>
        </div>

        <div class="im-section">
          <h3>Misi Kami</h3>
          <ul class="im-list">
            <li>Menyajikan berita lokal Krian secara cepat, akurat, dan berimbang setiap hari.</li>
            <li>Menjadi wadah aspirasi masyarakat Krian kepada pemerintah dan pemangku kepentingan.</li>
            <li>Mendukung perkembangan ekonomi dan sosial daerah melalui pemberitaan yang konstruktif.</li>
            <li>Mengedukasi masyarakat tentang isu-isu penting di tingkat lokal, nasional, dan internasional.</li>
          </ul>
        </div>

        <div class="im-section">
          <h3>Profil Singkat</h3>
          <ul class="im-list">
            <li><strong>Didirikan:</strong> 2020</li>
            <li><strong>Kantor:</strong> Jl. Raya Krian No. 1, Sidoarjo, Jawa Timur</li>
            <li><strong>Email:</strong> redaksi@beritakrian.com</li>
            <li><strong>Telepon:</strong> (031) 123-4567</li>
          </ul>
        </div>
      `
    },
    redaksi: {
      title: '✍️ Redaksi',
      content: `
        <p>Tim redaksi Berita Krian terdiri dari jurnalis berpengalaman yang berkomitmen menjaga standar jurnalistik tertinggi dalam setiap pemberitaan.</p>

        <div class="im-team-grid">
          <div class="im-team-card">
            <div class="im-team-avatar" style="background:linear-gradient(135deg,#dc2626,#b91c1c)">AH</div>
            <div class="im-team-name">Ahmad Hidayat</div>
            <div class="im-team-role">Pemimpin Redaksi</div>
          </div>
          <div class="im-team-card">
            <div class="im-team-avatar" style="background:linear-gradient(135deg,#2563eb,#1d4ed8)">SR</div>
            <div class="im-team-name">Sari Rahayu</div>
            <div class="im-team-role">Redaktur Pelaksana</div>
          </div>
          <div class="im-team-card">
            <div class="im-team-avatar" style="background:linear-gradient(135deg,#059669,#047857)">BP</div>
            <div class="im-team-name">Budi Prasetyo</div>
            <div class="im-team-role">Redaktur Ekonomi</div>
          </div>
          <div class="im-team-card">
            <div class="im-team-avatar" style="background:linear-gradient(135deg,#7c3aed,#6d28d9)">DW</div>
            <div class="im-team-name">Dewi Wulandari</div>
            <div class="im-team-role">Redaktur Sosial & Budaya</div>
          </div>
          <div class="im-team-card">
            <div class="im-team-avatar" style="background:linear-gradient(135deg,#d97706,#b45309)">MF</div>
            <div class="im-team-name">Muhammad Fauzi</div>
            <div class="im-team-role">Reporter Lapangan</div>
          </div>
          <div class="im-team-card">
            <div class="im-team-avatar" style="background:linear-gradient(135deg,#0891b2,#0e7490)">RA</div>
            <div class="im-team-name">Rina Astuti</div>
            <div class="im-team-role">Reporter & Fotografer</div>
          </div>
        </div>

        <div class="im-section" style="margin-top:20px">
          <h3>Kirim Koreksi atau Masukan</h3>
          <p>Jika Anda menemukan kesalahan dalam pemberitaan kami, silakan hubungi tim redaksi melalui email <strong>redaksi@beritakrian.com</strong> atau klik tombol Hubungi Kami di bawah.</p>
        </div>
        <div class="im-update">Seluruh wartawan Berita Krian telah memiliki Kartu Pers dan tunduk pada Kode Etik Jurnalistik PWI</div>
      `
    },
    pedoman: {
      title: '📖 Pedoman Media',
      content: `
        <p>Berita Krian beroperasi berdasarkan prinsip-prinsip jurnalistik yang bertanggung jawab dan mematuhi seluruh regulasi pers yang berlaku di Indonesia.</p>

        <div class="im-section">
          <h3>Standar Editorial</h3>
          <ul class="im-list">
            <li><strong>Akurasi:</strong> Setiap berita diverifikasi dari minimal dua sumber sebelum dipublikasikan.</li>
            <li><strong>Keberimbangan:</strong> Setiap isu disajikan dari berbagai sudut pandang yang relevan.</li>
            <li><strong>Independensi:</strong> Pemberitaan bebas dari pengaruh kepentingan politik maupun bisnis.</li>
            <li><strong>Kemanusiaan:</strong> Pemberitaan mempertimbangkan dampak terhadap individu dan masyarakat.</li>
          </ul>
        </div>

        <div class="im-section">
          <h3>Hak Jawab & Koreksi</h3>
          <p>Berita Krian menghormati hak jawab setiap pihak yang merasa dirugikan oleh pemberitaan kami. Koreksi akan dipublikasikan dalam waktu 1×24 jam setelah terbukti adanya kesalahan fakta.</p>
        </div>

        <div class="im-section">
          <h3>Regulasi yang Dipatuhi</h3>
          <ul class="im-list">
            <li>UU No. 40 Tahun 1999 tentang Pers</li>
            <li>Kode Etik Jurnalistik Dewan Pers Indonesia</li>
            <li>UU No. 19 Tahun 2016 tentang ITE</li>
            <li>Pedoman Pemberitaan Media Siber Dewan Pers</li>
          </ul>
        </div>

        <div class="im-section">
          <h3>Penanganan Aduan</h3>
          <p>Aduan terkait pemberitaan dapat disampaikan melalui email <strong>redaksi@beritakrian.com</strong>. Setiap aduan akan direspons dalam 3×24 jam kerja.</p>
        </div>

        <div class="im-update">Berita Krian terdaftar di Dewan Pers Indonesia</div>
      `
    },
    iklan: {
      title: '📢 Pasang Iklan',
      content: `
        <p>Jangkau ribuan pembaca setia Berita Krian setiap harinya. Kami menawarkan berbagai paket iklan yang fleksibel dan terjangkau untuk kebutuhan promosi bisnis Anda.</p>

        <div class="im-adpack-list">
          <div class="im-adpack-row">
            <div class="im-adpack-left">
              <div class="im-adpack-badge-icon" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">🖼️</div>
              <div class="im-adpack-info">
                <div class="im-adpack-name">Banner Header</div>
                <div class="im-adpack-desc">Tampil di bagian atas halaman utama · <span>728 × 90 px</span></div>
              </div>
            </div>
            <div class="im-adpack-price">Rp 500.000<span>/minggu</span></div>
          </div>

          <div class="im-adpack-row">
            <div class="im-adpack-left">
              <div class="im-adpack-badge-icon" style="background:linear-gradient(135deg,#059669,#047857)">📐</div>
              <div class="im-adpack-info">
                <div class="im-adpack-name">Sidebar Square</div>
                <div class="im-adpack-desc">Tampil di sidebar kanan semua halaman · <span>300 × 300 px</span></div>
              </div>
            </div>
            <div class="im-adpack-price">Rp 350.000<span>/minggu</span></div>
          </div>

          <div class="im-adpack-row">
            <div class="im-adpack-left">
              <div class="im-adpack-badge-icon" style="background:linear-gradient(135deg,#d97706,#b45309)">📰</div>
              <div class="im-adpack-info">
                <div class="im-adpack-name">Native Article</div>
                <div class="im-adpack-desc">Artikel sponsor yang tampil di feed berita · <span>1 artikel</span></div>
              </div>
            </div>
            <div class="im-adpack-price">Rp 750.000<span>/artikel</span></div>
          </div>

          <div class="im-adpack-row im-adpack-row--featured">
            <div class="im-adpack-popular">⭐ Terpopuler</div>
            <div class="im-adpack-left">
              <div class="im-adpack-badge-icon" style="background:linear-gradient(135deg,#dc2626,#b91c1c)">🏆</div>
              <div class="im-adpack-info">
                <div class="im-adpack-name">Premium Package</div>
                <div class="im-adpack-desc">Semua posisi iklan + desain banner gratis · <span>All Placement</span></div>
              </div>
            </div>
            <div class="im-adpack-price">Rp 2.000.000<span>/bulan</span></div>
          </div>
        </div>

        <div class="im-section">
          <h3>Keunggulan Beriklan di Berita Krian</h3>
          <ul class="im-list">
            <li>Rata-rata <strong>10.000+ pengunjung unik</strong> per hari dari wilayah Krian &amp; Sidoarjo.</li>
            <li>Audiens tertarget: warga lokal, pelaku usaha, dan pengambil keputusan daerah.</li>
            <li>Laporan performa iklan transparan setiap minggu.</li>
            <li>Desain banner gratis untuk paket Premium.</li>
          </ul>
        </div>

        <div class="im-section">
          <h3>Cara Pasang Iklan</h3>
          <p>Hubungi tim pemasaran kami melalui email <strong>iklan@beritakrian.com</strong> atau telepon <strong>(031) 123-4567</strong> untuk konsultasi gratis dan penawaran spesial.</p>
        </div>
      `
    },

    syarat: {
      title: '📋 Syarat &amp; Ketentuan',
      icon: '📋',
      content: `
        <p>Selamat datang di <strong>Berita Krian</strong>. Dengan mengakses dan menggunakan website ini, Anda dianggap telah membaca, memahami, dan menyetujui Syarat &amp; Ketentuan berikut.</p>

        <div class="im-section">
          <h3>1. Penggunaan Konten</h3>
          <p>Seluruh konten yang tersedia di Berita Krian — termasuk teks, foto, grafis, video, dan elemen lainnya — dilindungi oleh hak cipta. Pengguna diizinkan untuk membaca dan membagikan konten dengan menyertakan sumber asli secara jelas.</p>
        </div>

        <div class="im-section">
          <h3>2. Larangan Penggunaan</h3>
          <ul class="im-list">
            <li>Menggandakan atau mendistribusikan ulang konten tanpa izin tertulis dari redaksi.</li>
            <li>Menggunakan konten untuk kepentingan komersial tanpa perjanjian resmi.</li>
            <li>Memodifikasi konten asli sehingga menyesatkan pembaca.</li>
            <li>Melakukan scraping otomatis terhadap website ini tanpa izin.</li>
          </ul>
        </div>

        <div class="im-section">
          <h3>3. Komentar &amp; Interaksi</h3>
          <p>Pengguna yang mengirimkan komentar atau press release bertanggung jawab penuh atas konten yang dikirimkan. Berita Krian berhak menghapus konten yang mengandung unsur SARA, hoaks, atau melanggar hukum yang berlaku di Indonesia.</p>
        </div>

        <div class="im-section">
          <h3>4. Perubahan Ketentuan</h3>
          <p>Berita Krian berhak mengubah Syarat &amp; Ketentuan ini sewaktu-waktu. Perubahan akan diumumkan melalui website dan berlaku sejak tanggal publikasi.</p>
        </div>

        <div class="im-section">
          <h3>5. Hukum yang Berlaku</h3>
          <p>Syarat &amp; Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia, termasuk Undang-Undang No. 19 Tahun 2016 tentang Informasi dan Transaksi Elektronik (ITE).</p>
        </div>

        <div class="im-update">Terakhir diperbarui: 1 Januari 2025</div>
      `
    },
    privasi: {
      title: '🔒 Kebijakan Privasi',
      icon: '🔒',
      content: `
        <p>Berita Krian berkomitmen untuk melindungi privasi dan keamanan data pribadi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan menjaga informasi Anda.</p>

        <div class="im-section">
          <h3>1. Data yang Kami Kumpulkan</h3>
          <ul class="im-list">
            <li><strong>Data yang Anda berikan:</strong> Nama, email, nomor telepon saat mengirim press release atau menghubungi kami.</li>
            <li><strong>Data otomatis:</strong> Alamat IP, jenis browser, halaman yang dikunjungi, dan durasi kunjungan melalui cookies.</li>
            <li><strong>Data analitik:</strong> Informasi agregat tentang penggunaan website untuk keperluan peningkatan layanan.</li>
          </ul>
        </div>

        <div class="im-section">
          <h3>2. Penggunaan Data</h3>
          <p>Data yang dikumpulkan digunakan untuk:</p>
          <ul class="im-list">
            <li>Memproses dan merespons pesan serta press release yang Anda kirimkan.</li>
            <li>Meningkatkan kualitas konten dan pengalaman pengguna website.</li>
            <li>Menganalisis tren pembaca untuk keperluan editorial.</li>
            <li>Mencegah penyalahgunaan dan aktivitas penipuan.</li>
          </ul>
        </div>

        <div class="im-section">
          <h3>3. Keamanan Data</h3>
          <p>Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi data Anda dari akses tidak sah, pengungkapan, perubahan, atau penghancuran.</p>
        </div>

        <div class="im-section">
          <h3>4. Berbagi Data dengan Pihak Ketiga</h3>
          <p>Berita Krian <strong>tidak menjual</strong> data pribadi Anda kepada pihak ketiga. Data hanya dibagikan kepada mitra terpercaya yang membantu operasional website (seperti layanan analitik) dengan perjanjian kerahasiaan yang ketat.</p>
        </div>

        <div class="im-section">
          <h3>5. Hak Anda</h3>
          <p>Anda berhak untuk meminta akses, koreksi, atau penghapusan data pribadi Anda. Hubungi kami di <strong>redaksi@beritakrian.com</strong> untuk mengajukan permintaan tersebut.</p>
        </div>

        <div class="im-update">Terakhir diperbarui: 1 Januari 2025</div>
      `
    },
    sitemap: {
      title: '🗺️ Sitemap',
      icon: '🗺️',
      content: `
        <p>Temukan semua halaman dan rubrik yang tersedia di portal Berita Krian.</p>

        <div class="im-sitemap-grid">
          <div class="im-sitemap-col">
            <h3>📰 Rubrik Utama</h3>
            <ul class="im-sitemap-list">
              <li><a href="./kategori.html?cat=berita-utama">🔴 Berita Utama</a></li>
              <li><a href="./kategori.html?cat=nasional">🇮🇩 Nasional</a></li>
              <li><a href="./kategori.html?cat=internasional">🌏 Internasional</a></li>
              <li><a href="./kategori.html?cat=ekonomi-bisnis">💼 Ekonomi &amp; Bisnis</a></li>
              <li><a href="./kategori.html?cat=teknologi">💻 Teknologi</a></li>
              <li><a href="./kategori.html?cat=olahraga">⚽ Olahraga</a></li>
              <li><a href="./kategori.html?cat=hiburan">🎬 Hiburan</a></li>
              <li><a href="./kategori.html?cat=gaya-hidup">✨ Gaya Hidup</a></li>
            </ul>
          </div>

          <div class="im-sitemap-col">
            <h3>🔗 Halaman Penting</h3>
            <ul class="im-sitemap-list">
              <li><a href="./index.html">🏠 Beranda</a></li>
              <li><a href="./bookmark.html">🔖 Berita Tersimpan</a></li>
              <li><a href="./admin.html">⚙️ Dashboard Admin</a></li>
            </ul>

            <h3 style="margin-top:20px">✉️ Layanan</h3>
            <ul class="im-sitemap-list">
              <li><a href="#" onclick="window.Modals&&window.Modals.openPress();return false;">📨 Kirim Press Release</a></li>
              <li><a href="#" onclick="window.Modals&&window.Modals.openContact();return false;">☎️ Hubungi Kami</a></li>
            </ul>

            <h3 style="margin-top:20px">📄 Legal</h3>
            <ul class="im-sitemap-list">
              <li><a href="#" onclick="InfoModal.open('syarat');return false;">📋 Syarat &amp; Ketentuan</a></li>
              <li><a href="#" onclick="InfoModal.open('privasi');return false;">🔒 Kebijakan Privasi</a></li>
            </ul>
          </div>
        </div>
      `
    }
  };

  /* ── Build HTML ── */
  function buildInfoModal() {
    return `
    <div id="infoModalOverlay" class="im-overlay" hidden>
      <div class="im-box" id="imBox" role="dialog" aria-modal="true">
        <div class="im-header" id="imHeader">
          <div class="im-header-text" id="imTitle"></div>
          <button class="im-close" id="imClose" aria-label="Tutup">✕</button>
        </div>
        <div class="im-body" id="imBody"></div>
      </div>
    </div>`;
  }

  /* ── Inject ── */
  function injectInfoModal() {
    if (document.getElementById('infoModalOverlay')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildInfoModal();
    document.body.appendChild(wrapper.firstElementChild);
  }

  /* ── Open / Close ── */
  function openInfoModal(key) {
    const data = MODALS[key];
    if (!data) return;
    const overlay = document.getElementById('infoModalOverlay');
    const title   = document.getElementById('imTitle');
    const body    = document.getElementById('imBody');
    if (!overlay || !title || !body) return;

    title.innerHTML = data.title;
    body.innerHTML  = data.content;

    // Tutup link di dalam sitemap
    body.querySelectorAll('a[href="#"]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); });
    });

    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('im-open')));
  }

  function closeInfoModal() {
    const overlay = document.getElementById('infoModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('im-open');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.hidden = true; }, 300);
  }

  /* ── Wire ── */
  function wireInfoModal() {
    const overlay = document.getElementById('infoModalOverlay');
    if (!overlay) return;
    overlay.addEventListener('click', e => { if (e.target === overlay) closeInfoModal(); });
    document.getElementById('imClose').addEventListener('click', closeInfoModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeInfoModal(); });

    /* Wire by ID (footer bottom links) */
    const idMap = { btnSyarat: 'syarat', btnPrivasi: 'privasi', btnSitemap: 'sitemap' };
    Object.entries(idMap).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', e => { e.preventDefault(); openInfoModal(key); });
    });

    /* Wire by text content (works on all pages) */
    const textMap = [
      ['tentang kami',       'tentang'],
      ['redaksi',            'redaksi'],
      ['pedoman media',      'pedoman'],
      ['pasang iklan',       'iklan'],
      ['kebijakan privasi',  'privasi'],
      ['syarat & ketentuan', 'syarat'],
      ['syarat &amp; ketentuan', 'syarat'],
      ['sitemap',            'sitemap'],
    ];
    document.querySelectorAll('a[href="#"]').forEach(el => {
      if (el.dataset.infoWired) return;
      const txt = el.textContent.trim().toLowerCase();
      const match = textMap.find(([keyword]) => txt === keyword);
      if (match) {
        el.dataset.infoWired = '1';
        el.addEventListener('click', e => { e.preventDefault(); openInfoModal(match[1]); });
      }
    });
  }

  window.InfoModal = { open: openInfoModal, close: closeInfoModal };

  function initInfoModals() {
    injectInfoModal();
    wireInfoModal();
  }
  window.initInfoModals = initInfoModals;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInfoModals);
  } else {
    initInfoModals();
  }

})();
