// =============================================================================
// UMM Transferability — Project Page Behavior
// - Reading progress bar (top of viewport)
// - Scroll-spy sidebar active-link highlight
// - IntersectionObserver fade-in for figures / sections
// - Click-to-zoom lightbox for content figures
// - Copy-to-clipboard for BibTeX
// =============================================================================

(function(){
  'use strict';

  // ---------- Reading-progress bar ----------
  const progress = document.getElementById('progress-bar');
  function updateProgress(){
    const doc = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    if(total <= 0){ progress.style.width = '0%'; return; }
    const pct = Math.min(100, (window.scrollY / total) * 100);
    progress.style.width = pct.toFixed(1) + '%';
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  // ---------- Sidebar scroll-spy ----------
  const navLinks = Array.from(document.querySelectorAll('.sidebar-nav .nav-link'));
  const navMap = new Map();   // section id → nav-link element
  navLinks.forEach(a => {
    const id = a.getAttribute('href').replace('#','');
    navMap.set(id, a);
  });
  const sections = Array.from(
    new Set(
      navLinks
        .map(a => document.getElementById(a.getAttribute('href').replace('#','')))
        .filter(Boolean)
    )
  );

  function setActive(id){
    navLinks.forEach(a => a.classList.remove('active'));
    if(id && navMap.has(id)){
      navMap.get(id).classList.add('active');
    }
  }

  // IntersectionObserver — track the topmost section in view
  const spyObserver = new IntersectionObserver((entries) => {
    // When we're scrolled near the very top, always show Overview as active
    // (the hero's top edge sits in the observer's negative top-margin band, so
    // it may not fire — fall back to "near top" detection here).
    if(window.scrollY < 80 && sections.length){
      setActive(sections[0].id);
      return;
    }
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if(visible.length){
      setActive(visible[0].target.id);
    }
  }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
  sections.forEach(s => spyObserver.observe(s));

  // Also re-check on every scroll (cheap) so the near-top → Overview rule
  // fires immediately when the user scrolls all the way back up.
  document.addEventListener('scroll', () => {
    if(window.scrollY < 80 && sections.length){
      setActive(sections[0].id);
    }
  }, { passive: true });

  // Initial active: first observed target
  if(sections.length) setActive(sections[0].id);

  // ---------- Fade-in on scroll ----------
  const fadeTargets = document.querySelectorAll(
    '.figure-wide, .figure-medium, .num-item, .stat-card, .table-wrap, .tldr'
  );
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('fade-in');
        fadeObserver.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  fadeTargets.forEach(t => fadeObserver.observe(t));

  // ---------- Figure image-error state ----------
  // If a content figure's image fails to load, swap it for a friendly
  // fallback (line icon + "Figure unavailable") instead of a blank/collapsed box.
  function markFigureError(img){
    if(img.dataset.errored) return;
    img.dataset.errored = '1';
    const fallback = document.createElement('div');
    fallback.className = 'figure-error';
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', img.alt ? ('Figure unavailable: ' + img.alt) : 'Figure unavailable');
    fallback.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<rect x="3" y="3" width="18" height="18" rx="2"></rect>' +
        '<circle cx="9" cy="9" r="1.4"></circle>' +
        '<path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"></path>' +
        '<line x1="3" y1="3" x2="21" y2="21"></line>' +
      '</svg>' +
      '<span>Figure unavailable</span>';
    img.replaceWith(fallback);
  }
  const figImgs = document.querySelectorAll('.figure-wide img, .figure-medium img');
  figImgs.forEach(img => {
    img.addEventListener('error', () => markFigureError(img));
    // Catch images that already failed before this script ran (cached errors)
    if(img.complete && img.naturalWidth === 0 && img.getAttribute('src')){
      markFigureError(img);
    }
  });

  // ---------- Hero qualitative carousel ----------
  // Crossfading slides with prev/next arrows + dots. Autoplay is ON by default
  // (data-autoplay), but never runs under prefers-reduced-motion, and pauses on
  // hover / focus-within / hidden tab / open lightbox.
  const carousels = [];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('.hero-carousel').forEach(root => {
    const slides = Array.from(root.querySelectorAll('.carousel-slide'));
    const caps   = Array.from(root.querySelectorAll('.carousel-cap'));
    const dots   = Array.from(root.querySelectorAll('.carousel-dot'));
    const prev   = root.querySelector('.carousel-prev');
    const next   = root.querySelector('.carousel-next');
    if(slides.length < 2) return;   // nothing to cycle

    let index = slides.findIndex(s => s.classList.contains('is-active'));
    if(index < 0) index = 0;

    const interval = parseInt(root.dataset.interval, 10) || 6000;
    const wantsAutoplay = root.dataset.autoplay === 'true' && !prefersReduced.matches;
    let timer = null, hovered = false, focused = false, lightboxOpen = false;

    function render(){
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      caps.forEach((c, i)   => c.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => {
        const on = i === index;
        d.classList.toggle('is-active', on);
        d.setAttribute('aria-current', on ? 'true' : 'false');
      });
    }
    function goTo(i){ index = (i + slides.length) % slides.length; render(); }
    const nextSlide = () => goTo(index + 1);
    const prevSlide = () => goTo(index - 1);

    function canPlay(){
      return wantsAutoplay && !hovered && !focused && !lightboxOpen && !document.hidden;
    }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }
    function start(){ stop(); if(canPlay()){ timer = setInterval(nextSlide, interval); } }

    if(next) next.addEventListener('click', () => { nextSlide(); start(); });
    if(prev) prev.addEventListener('click', () => { prevSlide(); start(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); start(); }));

    root.addEventListener('mouseenter', () => { hovered = true; stop(); });
    root.addEventListener('mouseleave', () => { hovered = false; start(); });
    root.addEventListener('focusin',  () => { focused = true; stop(); });
    root.addEventListener('focusout', () => { focused = false; start(); });
    root.addEventListener('keydown', (e) => {
      if(e.key === 'ArrowLeft'){ e.preventDefault(); prevSlide(); start(); }
      else if(e.key === 'ArrowRight'){ e.preventDefault(); nextSlide(); start(); }
    });

    carousels.push({
      pause(){ lightboxOpen = true; stop(); },
      resume(){ lightboxOpen = false; start(); },
      sync(){ start(); }
    });

    render();
    start();
  });

  // Pause/resume autoplay as the tab visibility changes
  document.addEventListener('visibilitychange', () => carousels.forEach(c => c.sync()));

  // ---------- Figure lightbox (click any content figure to enlarge) ----------
  // Click an image to enlarge it as a centered overlay. Click the overlay,
  // press Escape, or click the close button to dismiss.
  const zoomImgs = document.querySelectorAll('.figure-wide img, .figure-medium img, .dual-fig-item img, .carousel-slide');
  if(zoomImgs.length){
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<img alt="" /><button class="lightbox-close" aria-label="Close enlarged image">&times;</button>';
    document.body.appendChild(overlay);
    const lbImg   = overlay.querySelector('img');
    const lbClose = overlay.querySelector('.lightbox-close');

    function openLightbox(srcUrl, altText){
      lbImg.src = srcUrl;
      lbImg.alt = altText || '';
      overlay.classList.add('visible');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      carousels.forEach(c => c.pause());
    }
    function closeLightbox(){
      overlay.classList.remove('visible');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      carousels.forEach(c => c.resume());
    }

    zoomImgs.forEach(img => {
      img.classList.add('lightbox-trigger');
      img.setAttribute('role', 'button');
      img.setAttribute('tabindex', '0');
      img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt));
      img.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          openLightbox(img.currentSrc || img.src, img.alt);
        }
      });
    });

    // Dismiss: click anywhere on overlay, close button, or Escape key
    overlay.addEventListener('click', (e) => {
      if(e.target === lbImg) return;   // ignore clicks on the image itself
      closeLightbox();
    });
    lbClose.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && overlay.classList.contains('visible')) closeLightbox();
    });
  }

  // ---------- Copy BibTeX ----------
  const copyBtn = document.getElementById('copy-bib');
  if(copyBtn){
    copyBtn.addEventListener('click', () => {
      const code = copyBtn.parentElement.querySelector('code');
      if(!code) return;
      const text = code.textContent.trim();
      const done = () => {
        copyBtn.classList.add('copied');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.textContent = 'Copy';
        }, 1600);
      };
      // Help-not-blame: if copying is blocked, tell the user how to do it manually.
      const fail = () => {
        copyBtn.textContent = 'Press ⌘/Ctrl+C';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2200);
      };
      const legacyCopy = () => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try{ ok = document.execCommand('copy'); } catch(e){ ok = false; }
        document.body.removeChild(ta);
        ok ? done() : fail();
      };
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done).catch(legacyCopy);
      } else {
        legacyCopy();
      }
    });
  }
})();
