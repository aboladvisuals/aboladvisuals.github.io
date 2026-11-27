/* AboladLabs Liquid Intelligence V2.0 — progressive enhancement with original functionality restored */
(function () {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) root.classList.add('reduce-motion');

  function initialiseCursorPrism(rootEl = document) {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frameId = null;
    let latestPointer = null;
    function handlePointerMove(event) {
      if (!finePointer.matches || reduced.matches) return;
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest('.glass, .card, .pillar, .telemetry-card');
      if (!card || !rootEl.contains(card)) {
        latestPointer = null;
        return;
      }
      latestPointer = { card, x: event.clientX, y: event.clientY };
      if (frameId !== null) return;
      frameId = requestAnimationFrame(() => {
        frameId = null;
        if (!latestPointer) return;
        const { card, x, y } = latestPointer;
        if (!card.isConnected) { latestPointer = null; return; }
        const bounds = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${x - bounds.left}px`);
        card.style.setProperty('--mouse-y', `${y - bounds.top}px`);
      });
    }
    rootEl.addEventListener('pointermove', handlePointerMove, { passive: true });
  }

  function initialiseExperienceControls() {
    const glowControl = document.querySelector('[data-glow-control]');
    const motionControl = document.querySelector('[data-motion-control]');
    if (glowControl) {
      glowControl.addEventListener('input', () => {
        const value = Number(glowControl.value);
        if (!Number.isFinite(value)) return;
        const intensity = Math.min(100, Math.max(10, value)) / 100;
        root.style.setProperty('--bloom', String(intensity));
      });
    }
    if (motionControl) {
      motionControl.addEventListener('click', () => {
        const paused = root.classList.toggle('motion-paused');
        motionControl.setAttribute('aria-pressed', String(paused));
        motionControl.textContent = paused ? 'Resume motion' : 'Pause motion';
      });
    }
  }

  function initialiseProjectFilters() {
    // Support both original (data-filter-group / data-cat) and new selectors
    const groups = document.querySelectorAll('[data-filter-group], [data-project-filters]');
    groups.forEach((filterGroup) => {
      const targetId = filterGroup.getAttribute('data-filter-group') || filterGroup.getAttribute('data-project-filters');
      const target = targetId ? document.getElementById(targetId) : null;
      const cards = target
        ? Array.from(target.querySelectorAll('[data-cat], [data-project-categories]'))
        : Array.from(document.querySelectorAll('[data-cat], [data-project-categories]'));
      const counter = document.querySelector('[data-project-count]') || document.getElementById(filterGroup.getAttribute('data-filter-status') || '');
      if (!filterGroup || cards.length === 0) return;
      filterGroup.hidden = false; // restore original visibility for hidden filter controls
      const buttons = Array.from(filterGroup.querySelectorAll('[data-filter]'));
      function applyFilter(category) {
        let visibleCount = 0;
        buttons.forEach((button) => {
          const active = button.dataset.filter === category;
          button.classList.toggle('active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        cards.forEach((card) => {
          const cats = (card.getAttribute('data-cat') || card.dataset.projectCategories || '').split(/\s+/);
          const visible = category === 'all' || cats.includes(category);
          card.hidden = !visible;
          if (visible) visibleCount += 1;
        });
        if (counter) counter.textContent = `${visibleCount} / ${cards.length}`;
      }
      filterGroup.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest('[data-filter]');
        if (!button || !filterGroup.contains(button)) return;
        applyFilter(button.dataset.filter);
      });
      applyFilter('all');
    });
  }

  function initialiseTOC() {
    const toc = document.querySelector('.toc');
    if (!toc || !('IntersectionObserver' in window)) return;
    const links = {};
    toc.querySelectorAll('a[href^="#"]').forEach((a) => { links[a.getAttribute('href').slice(1)] = a; });
    let current = null;
    const tio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          if (current) current.classList.remove('active');
          current = links[en.target.id];
          if (current) current.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(links).forEach((id) => { const el = document.getElementById(id); if (el) tio.observe(el); });
  }

  // Mobile navigation
  const menuBtn = document.querySelector('.menu-btn');
  const siteNav = document.getElementById('site-nav');
  if (menuBtn && siteNav) {
    const setOpen = (open) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      siteNav.classList.toggle('open', open);
    };
    menuBtn.addEventListener('click', () => setOpen(menuBtn.getAttribute('aria-expanded') !== 'true'));
    siteNav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.classList.contains('open')) { setOpen(false); menuBtn.focus(); }
    });
  }

  initialiseCursorPrism();
  initialiseExperienceControls();
  initialiseProjectFilters();
  initialiseTOC();
})();
