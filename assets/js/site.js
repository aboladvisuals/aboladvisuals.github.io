/* Emmanuel Abolade — site behaviour. Progressive enhancement only: every page is complete without JS. */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!doc.classList.contains('js')) { doc.classList.remove('no-js'); doc.classList.add('js'); if (!reduce) doc.classList.add('motion'); }

  /* header state */
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mobile menu */
  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('site-nav');
  if (btn && nav) {
    var setOpen = function (open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('open', open);
    };
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); btn.focus(); } });
  }

  /* reveal on scroll */
  var rev = document.querySelectorAll('[data-reveal]');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add('in'); });

  /* card light that follows the pointer */
  if (!reduce) document.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  });

  /* project filters */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var target = document.getElementById(group.getAttribute('data-filter-group'));
    if (!target) return;
    var live = document.getElementById(group.getAttribute('data-filter-status'));
    group.hidden = false;
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-filter]'); if (!b) return;
      var f = b.getAttribute('data-filter'), n = 0;
      group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      target.querySelectorAll('[data-cat]').forEach(function (card) {
        var show = f === 'all' || card.getAttribute('data-cat').split(' ').indexOf(f) > -1;
        card.hidden = !show; if (show) n++;
      });
      if (live) live.textContent = n + (n === 1 ? ' project shown' : ' projects shown');
    });
  });

  /* table of contents highlighting (case studies) */
  var toc = document.querySelector('.toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = {}; toc.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var current = null;
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (current) current.classList.remove('active');
          current = links[en.target.id]; if (current) current.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(links).forEach(function (id) { var el = document.getElementById(id); if (el) tio.observe(el); });
  }

  /* 3D hero: loaded after the page is interactive, never blocks first paint */
  var hero = document.querySelector('.hero[data-gl]');
  if (!hero) return;
  var canvas = hero.querySelector('canvas'), poster = hero.querySelector('.poster');
  var ctrl = hero.querySelector('.stage-toggle');
  function fallback() {
    if (hero.classList.contains('gl-fallback')) return;
    hero.classList.add('gl-fallback');
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }
  if (!window.WebGL2RenderingContext || !canvas) { fallback(); return; }
  if (reduce) hero.classList.add('gl-still');
  function boot() {
    import('/assets/js/hero-gl.js').then(function (m) {
      var api = m.start(canvas, {
        still: reduce, small: window.innerWidth < 880, force: /[?&]gl=force\b/.test(location.search), pointerTarget: hero, onLost: fallback,
        onReady: function () { canvas.classList.add('ready'); },
        onStill: function () { hero.classList.add('gl-still'); },
        onSoftware: fallback
      });
      if (!api) return;
      if (ctrl) ctrl.addEventListener('click', function () {
        if (api.paused) { api.resume(); ctrl.setAttribute('aria-pressed', 'false'); ctrl.querySelector('span').textContent = 'Pause motion'; }
        else { api.pause(); ctrl.setAttribute('aria-pressed', 'true'); ctrl.querySelector('span').textContent = 'Play motion'; }
      });
    }).catch(function () { fallback(); });
  }
  var go = function () { ('requestIdleCallback' in window) ? requestIdleCallback(boot, { timeout: 1500 }) : setTimeout(boot, 200); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
})();
