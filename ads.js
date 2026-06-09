/* ============================================================
   ADS.JS — Manajemen Slot Iklan Frontend  v1.0
   Fetch /api/ads → inject ke slot #adBanner & #adSidebar
   ============================================================ */
(function () {
  'use strict';

  const API_BASE = (window.BK_CONFIG && window.BK_CONFIG.API) || (window.SITE_CONFIG && window.SITE_CONFIG.API_BASE) || 'http://localhost:5175';

  /* ── Placeholder HTML saat iklan tidak aktif ── */
  function placeholderHTML(label, w, h) {
    return `
      <div class="ad-placeholder" style="width:100%;max-width:${w}px;height:${h}px">
        <div class="ad-placeholder__inner">
          <div class="ad-placeholder__icon">📢</div>
          <div class="ad-placeholder__text">Ruang Iklan ${label}</div>
          <div class="ad-placeholder__size">${w} × ${h} px</div>
        </div>
      </div>`;
  }

  /* ── Render satu slot dengan dukungan slide ── */
  function renderSlot(el, activeAds, w, h, label) {
    if (!el) return;
    el.innerHTML = '';
    el.classList.remove('ad-slot--active', 'ad-slot--empty');

    // Hapus timer slide lama jika ada
    if (el.adTimer) {
      clearInterval(el.adTimer);
      el.adTimer = null;
    }

    if (activeAds && activeAds.length > 0) {
      el.classList.add('ad-slot--active');

      // 1. Jika hanya ada 1 iklan aktif
      if (activeAds.length === 1) {
        const ad = activeAds[0];
        const wrap = document.createElement(ad.link ? 'a' : 'div');
        if (ad.link) {
          wrap.href = ad.link;
          wrap.target = '_blank';
          wrap.rel = 'noopener noreferrer';
          wrap.setAttribute('aria-label', `Iklan ${label}`);
        }
        wrap.className = 'ad-slot__img-wrap';
        const img = document.createElement('img');
        img.src = ad.image;
        img.alt = `Iklan ${label}`;
        img.width = w;
        img.height = h;
        img.style.cssText = `display:block;margin:0 auto;width:100%;max-width:${w}px;height:${h}px;object-fit:contain;background-color:#fafbfd;border-radius:8px;`;
        wrap.appendChild(img);
        el.appendChild(wrap);
        return;
      }

      // 2. Jika ada lebih dari 1 iklan (Auto-slide)
      const slider = document.createElement('div');
      slider.className = 'ad-slider';
      slider.style.cssText = `position:relative;margin:0 auto;width:100%;max-width:${w}px;height:${h}px;overflow:hidden;border-radius:8px;`;

      const slidesWrap = document.createElement('div');
      slidesWrap.className = 'ad-slider__slides';
      slidesWrap.style.cssText = `position:relative;width:100%;height:100%;`;

      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'ad-slider__dots';
      dotsWrap.style.cssText = `position:absolute;bottom:6px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:10;`;

      const slideElements = [];
      const dotElements = [];

      activeAds.forEach((ad, idx) => {
        // Slide container
        const slide = document.createElement('div');
        slide.className = `ad-slide ${idx === 0 ? 'ad-slide--active' : ''}`;
        slide.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;opacity:${idx === 0 ? 1 : 0};transition:opacity 0.6s ease-in-out;z-index:${idx === 0 ? 2 : 1};`;

        const wrap = document.createElement(ad.link ? 'a' : 'div');
        if (ad.link) {
          wrap.href = ad.link;
          wrap.target = '_blank';
          wrap.rel = 'noopener noreferrer';
        }
        wrap.className = 'ad-slot__img-wrap';
        wrap.style.cssText = 'display:block;width:100%;height:100%';

        const img = document.createElement('img');
        img.src = ad.image;
        img.alt = `Iklan ${label} ${idx + 1}`;
        img.style.cssText = `display:block;width:100%;height:100%;object-fit:contain;background-color:#fafbfd;border-radius:8px;`;

        wrap.appendChild(img);
        slide.appendChild(wrap);
        slidesWrap.appendChild(slide);
        slideElements.push(slide);

        // Dot indicator
        const dot = document.createElement('span');
        dot.className = `ad-dot ${idx === 0 ? 'ad-dot--active' : ''}`;
        dot.style.cssText = `width:6px;height:6px;border-radius:50%;background:#fff;opacity:${idx === 0 ? 0.9 : 0.4};cursor:pointer;transition:opacity 0.2s;box-shadow:0 1px 2px rgba(0,0,0,0.5);`;
        dotsWrap.appendChild(dot);
        dotElements.push(dot);

        // Klik dot untuk ganti slide manual
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          goToSlide(idx);
          resetTimer();
        });
      });

      slider.appendChild(slidesWrap);
      slider.appendChild(dotsWrap);
      el.appendChild(slider);

      let currentIdx = 0;
      let timer = null;

      function goToSlide(nextIdx) {
        if (currentIdx === nextIdx) return;
        slideElements[currentIdx].style.opacity = 0;
        slideElements[currentIdx].style.zIndex = 1;
        dotElements[currentIdx].style.opacity = 0.4;

        currentIdx = nextIdx;

        slideElements[currentIdx].style.opacity = 1;
        slideElements[currentIdx].style.zIndex = 2;
        dotElements[currentIdx].style.opacity = 0.9;
      }

      function nextSlide() {
        const nextIdx = (currentIdx + 1) % activeAds.length;
        goToSlide(nextIdx);
      }

      function startTimer() {
        timer = setInterval(nextSlide, 4000); // ganti slide tiap 4 detik
      }

      function resetTimer() {
        clearInterval(timer);
        startTimer();
      }

      startTimer();

      // Simpan referensi timer di element DOM agar bisa dibersihkan nanti saat reload
      el.adTimer = timer;
    } else {
      el.classList.add('ad-slot--empty');
      el.innerHTML = placeholderHTML(label, w, h);
    }
  }

  /* ── Main Loader ── */
  async function loadAds() {
    try {
      const bannerEl = document.getElementById('adBanner');
      const sidebarEl = document.getElementById('adSidebar');

      // Deteksi apakah ini halaman utama (index.html atau root)
      const path = window.location.pathname;
      const isHomepage = path.endsWith('/') || 
                         path.endsWith('/index.html') || 
                         path.split('/').pop() === '';

      if (!isHomepage) {
        // Jika bukan halaman utama, acak 50% kesempatan untuk memunculkan iklan
        const showAds = Math.random() < 0.5;
        if (!showAds) {
          // Sembunyikan elemen pembungkus iklan agar tata letak halaman tetap rapi
          const bannerWrap = document.querySelector('.ad-banner-wrap');
          if (bannerWrap) bannerWrap.style.display = 'none';

          const sidebarAdWrap = document.querySelector('.ad--sidebar');
          if (sidebarAdWrap) sidebarAdWrap.style.display = 'none';

          if (bannerEl) bannerEl.innerHTML = '';
          if (sidebarEl) sidebarEl.innerHTML = '';
          return;
        }
      }

      const res = await fetch(`${API_BASE}/api/ads`);
      if (!res.ok) return;
      const data = await res.json();
      
      const allAds = data.items || [];
      const bannerAds = allAds.filter(a => a.slot === 'banner-header' && a.active);
      const sidebarAds = allAds.filter(a => a.slot === 'sidebar-square' && a.active);

      renderSlot(bannerEl, bannerAds, 728, 90, 'Banner Header');
      renderSlot(sidebarEl, sidebarAds, 300, 300, 'Sidebar Square');
    } catch (e) {
      // Gagal fetch = tampilkan placeholder
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAds);
  } else {
    loadAds();
  }

  /* Expose untuk admin refresh setelah simpan */
  window.AdsLoader = { reload: loadAds };
})();
