(() => {
  'use strict';
  const faDigits = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = document.getElementById('stage');
  const slides = [...document.querySelectorAll('.slide')];
  const footer = document.getElementById('footer');
  const fpn = document.getElementById('fpn');
  const ui = document.getElementById('ui');
  const progress = document.getElementById('progress');
  const counter = document.getElementById('counter');
  const total = slides.length;
  let current = -1;

  /* ---- مقیاس صحنه ---- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.setProperty('--s', s);
  }
  addEventListener('resize', fit);
  fit();

  /* ---- چرخ خدمات ---- */
  (function layoutWheel() {
    const cx = 480, cy = 540, rx = 205, ry = 330;
    document.querySelectorAll('.node').forEach(n => {
      const a = (+n.dataset.a) * Math.PI / 180;
      n.style.left = (cx + rx * Math.sin(a)) + 'px';
      n.style.top = (cy - ry * Math.cos(a)) + 'px';
    });
  })();
  document.querySelectorAll('[data-go]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); go(+el.dataset.go - 1); }));

  /* ---- شمارندهٔ آمار ---- */
  const outputs = [...document.querySelectorAll('[data-count]')];
  let raf = 0;
  function runCounters() {
    cancelAnimationFrame(raf);
    if (reduceMotion) { outputs.forEach(o => o.textContent = faDigits(o.dataset.count)); return; }
    outputs.forEach(o => o.textContent = faDigits(0));
    const t0 = performance.now() + 350, dur = 1500;
    const tick = now => {
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      const e = 1 - Math.pow(1 - p, 3);
      outputs.forEach(o => o.textContent = faDigits(Math.round(+o.dataset.count * e)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  /* ---- ناوبری ---- */
  function go(i) {
    i = Math.max(0, Math.min(total - 1, i));
    if (i === current) return;
    slides.forEach((s, k) => {
      s.classList.toggle('active', k === i);
      s.setAttribute('aria-hidden', k === i ? 'false' : 'true');
      s.inert = k !== i;
    });
    current = i;
    const sl = slides[i];
    footer.classList.toggle('on', sl.hasAttribute('data-footer'));
    fpn.textContent = faDigits(i + 1);
    counter.textContent = faDigits(i + 1) + ' / ' + faDigits(total);
    progress.style.setProperty('--p', total > 1 ? i / (total - 1) : 1);
    document.title = (sl.dataset.title ? sl.dataset.title + ' | ' : '') + 'پردیس نوآوری گرا';
    history.replaceState(null, '', '#' + (i + 1));
    if (sl.classList.contains('s-stats')) runCounters();
  }
  const next = () => go(current + 1);
  const prev = () => go(current - 1);
  document.getElementById('next').addEventListener('click', next);
  document.getElementById('prev').addEventListener('click', prev);

  /* در متن فارسی، «بعدی» سمت چپ است */
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('textarea, input')) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case 'ArrowLeft': case 'PageDown': case ' ': case 'Enter':
        if (e.target.closest && e.target.closest('a, button') && (e.key === ' ' || e.key === 'Enter')) return;
        e.preventDefault(); next(); break;
      case 'ArrowRight': case 'PageUp': e.preventDefault(); prev(); break;
      case 'Home': go(0); break;
      case 'End': go(total - 1); break;
      case 'f': case 'F': toggleFs(); break;
    }
  });

  /* لمس: کشیدن به راست = بعدی (هم‌جهت با خواندن فارسی) */
  let tx = 0, ty = 0, tracking = false;
  addEventListener('touchstart', e => {
    if (e.target.closest('textarea')) return;
    tracking = true; tx = e.touches[0].clientX; ty = e.touches[0].clientY;
  }, { passive: true });
  addEventListener('touchend', e => {
    if (!tracking) return; tracking = false;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx > 0 ? next : prev)();
  }, { passive: true });

  /* ---- تمام‌صفحه ---- */
  function toggleFs() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }
  document.getElementById('fs').addEventListener('click', toggleFs);

  /* ---- مخفی‌شدن کنترل‌ها هنگام بیکاری ---- */
  let idleTimer;
  const wake = () => { ui.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => ui.classList.add('idle'), 2800); };
  ['mousemove', 'pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, wake, { passive: true }));
  wake();

  /* ---- یادداشت: فقط در همین مرورگر ---- */
  const notes = document.getElementById('notes');
  try { notes.value = localStorage.getItem('gera-deck-notes') || ''; } catch (_) {}
  notes.addEventListener('input', () => { try { localStorage.setItem('gera-deck-notes', notes.value); } catch (_) {} });

  /* ---- شروع ---- */
  const start = parseInt(location.hash.slice(1), 10);
  go(Number.isFinite(start) ? start - 1 : 0);
  addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1), 10); if (Number.isFinite(n)) go(n - 1); });
})();
