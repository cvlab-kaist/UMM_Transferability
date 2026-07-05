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

  // ---------- Figure lightbox (click any content figure to enlarge) ----------
  // Click an image to enlarge it as a centered overlay. Click the overlay,
  // press Escape, or click the close button to dismiss.
  const zoomImgs = document.querySelectorAll('.figure-wide img, .figure-medium img, .dual-fig-item img');
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
    }
    function closeLightbox(){
      overlay.classList.remove('visible');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
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
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done).catch(() => {
          // fallback
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try{ document.execCommand('copy'); done(); } catch(e){}
          document.body.removeChild(ta);
        });
      }
    });
  }
})();
