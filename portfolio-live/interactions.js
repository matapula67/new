(() => {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── skill dots get an index so they can wave one after another ── */
  document.querySelectorAll('.skill-dots').forEach(g =>
    g.querySelectorAll('.dot').forEach((d, i) => d.style.setProperty('--i', i)));

  /* ── hero name: every letter reacts on hover ── */
  const hero = document.querySelector('.hero-name');
  if (hero && !reduce) {
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const f = document.createDocumentFragment();
          [...n.textContent].forEach(c => {
            if (c.trim() === '') { f.append(c); return; }
            const s = document.createElement('span');
            s.className = 'ch'; s.textContent = c; f.append(s);
          });
          n.replaceWith(f);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') wrap(n);
      });
    };
    wrap(hero);
  }

  /* ── live app previews: scale the 1280px page down, load when near view ── */
  const screens = document.querySelectorAll('.ap-screen');
  const fit = sc => {
    const f = sc.querySelector('.ap-frame');
    if (f) f.style.transform = 'scale(' + (sc.getBoundingClientRect().width / 1280) + ')';
  };
  screens.forEach(fit);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(es => es.forEach(e => fit(e.target)));
    screens.forEach(s => ro.observe(s));
  }
  if (window.PORTFOLIO_STATIC_PREVIEW) {
    document.querySelectorAll('.ap-spinner').forEach(s => s.remove());
    document.querySelectorAll('.ap-msg').forEach(m => m.textContent = 'Live preview appears here once the portfolio is deployed');
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es, o) => es.forEach(e => {
      if (!e.isIntersecting) return;
      const f = e.target.querySelector('.ap-frame');
      if (f && !f.getAttribute('src')) {
        f.addEventListener('load', () => f.classList.add('loaded'), { once: true });
        f.setAttribute('src', f.dataset.src);
      }
      o.unobserve(e.target);
    }), { rootMargin: '300px' });
    screens.forEach(s => io.observe(s));
  }

  /* ── dashboard preview: click to enlarge ── */
  let box = null, opener = null;
  const closeBox = () => {
    if (!box) return;
    const b = box; box = null;
    b.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    setTimeout(() => b.remove(), 250);
    if (opener) opener.focus();
  };
  const onKey = e => { if (e.key === 'Escape') closeBox(); };
  document.querySelectorAll('.dash-preview').forEach(btn => btn.addEventListener('click', () => {
    opener = btn;
    const img = btn.querySelector('img');
    box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Dashboard preview');
    box.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close preview">&times;</button><img alt="">';
    box.querySelector('img').src = btn.dataset.full || img.src;
    box.querySelector('img').alt = img.alt;
    box.addEventListener('click', closeBox);
    const nb = btn.closest('.project-card') && btn.closest('.project-card').querySelector('a.project-link[href^="notebooks/"]');
    if (nb) {
      const a = document.createElement('a');
      a.className = 'lightbox-open';
      a.href = nb.getAttribute('href');
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = 'Open full notebook &#8599;';
      a.addEventListener('click', e => e.stopPropagation());
      box.append(a);
    }
    document.body.append(box);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => box.classList.add('open'));
    box.querySelector('.lightbox-close').focus();
  }));

  /* ── click ripple on buttons (works on touch too) ── */
  const btns = document.querySelectorAll('.btn-primary, .btn-outline, .project-link, .live-pill');
  btns.forEach(b => {
    b.classList.add('has-ripple');
    b.addEventListener('pointerdown', e => {
      if (reduce) return;
      const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
      b.append(s);
      setTimeout(() => s.remove(), 650);
    });
  });

  if (!fine || reduce) return;

  /* ── magnetic buttons ── */
  btns.forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      b.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  /* ── 3D tilt + spotlight following the cursor ── */
  document.querySelectorAll('.project-card, .about-photo, .about-card, .skill-category, .hero-stats, .exp-card').forEach(el => {
    const max = el.matches('.project-card') ? 6 : el.matches('.about-photo') ? 7 : 3.5;
    const lift = el.matches('.about-card') ? 0 : -6;
    el.addEventListener('pointerenter', () => { el.style.transitionDelay = '0s'; el.classList.add('is-tilting'); });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (px * 100) + '%');
      el.style.setProperty('--my', (py * 100) + '%');
      el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * max) + 'deg) rotateY(' + ((px - 0.5) * max * 1.4) + 'deg) translateY(' + lift + 'px)';
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; el.classList.remove('is-tilting'); });
  });

  /* ── soft glow that trails the cursor ── */
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.append(glow);
  let gx = 0, gy = 0, tx = 0, ty = 0, raf = 0;
  const loop = () => {
    gx += (tx - gx) * 0.14; gy += (ty - gy) * 0.14;
    glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
    raf = (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) ? requestAnimationFrame(loop) : 0;
  };
  window.addEventListener('pointermove', e => {
    tx = e.clientX; ty = e.clientY; glow.classList.add('on');
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => glow.classList.remove('on'));
})();
