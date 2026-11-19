// Lifecycle-owned controllers for the approved standalone HTML sections.
export function mountApprovedSections() {
  const abort = new AbortController();
  const { signal } = abort;
  const cleanups = [];
  const listen = (target, name, handler, options = {}) => target.addEventListener(name, handler, { ...options, signal });
  const page = document.querySelector('.rx');
  const header = page?.querySelector('.rx-header');
  if (!header) return () => abort.abort();
  // The existing iPad and Instagram enhancements must start after React's
  // initial commit, otherwise their SSR replacements are overwritten.
  for (const [id, src] of [['ortsfuchs-ipad-loader', '/rag-ipad-full-section-20261118.js'], ['ortsfuchs-social-loader', '/rag-social-v19-loader.js']]) {
    if (!document.getElementById(id)) {
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      document.body.appendChild(script);
    }
  }
  let headerFrame = 0;
  let previousHeaderY = window.scrollY;
  let headerTravel = 0;
  let headerDirection = 1;
  const nav = header.querySelector('.rx-nav');
  const actions = header.querySelector('.rx-header-actions');
  function showMenu(visible) {
    header.classList.toggle('is-menu-hidden', !visible);
    nav.inert = !visible;
    actions.inert = !visible;
  }
  function updateHeader() {
    headerFrame = 0;
    const y = Math.max(0, window.scrollY);
    const delta = y - previousHeaderY;
    previousHeaderY = y;
    header.classList.toggle('is-scrolled', y > 16);
    if (y <= 16) { headerTravel = 0; showMenu(true); return; }
    if (Math.abs(delta) < .1) return;
    const direction = delta > 0 ? 1 : -1;
    if (direction !== headerDirection) { headerDirection = direction; headerTravel = 0; }
    headerTravel += Math.abs(delta);
    if (headerTravel >= 7) showMenu(direction < 0);
  }
  listen(window, 'scroll', () => { if (!headerFrame) headerFrame = requestAnimationFrame(updateHeader); }, { passive: true });
  listen(header, 'focusin', () => showMenu(true));
  updateHeader();
  function measureFaqOffset() {
    const logo = header.querySelector('.rx-wordmark');
    if (logo) page.style.setProperty('--faq-sticky-top', Math.ceil(logo.getBoundingClientRect().bottom) + 24 + 'px');
  }
  measureFaqOffset();
  listen(window, 'resize', measureFaqOffset, { passive: true });
  document.fonts?.ready.then(() => { if (!signal.aborted) measureFaqOffset(); });
  cleanups.push(() => cancelAnimationFrame(headerFrame));

  const portraits = [...page.querySelectorAll('.rx-hero .rx-portrait')];
  let active = 2;
  function selectPortrait(index) {
    active = (index + portraits.length) % portraits.length;
    portraits.forEach((card, i) => {
      const offset = (i - active + portraits.length + 2) % portraits.length - 2;
      card.style.setProperty('--offset', offset);
      card.style.setProperty('--distance', Math.abs(offset));
      card.style.zIndex = 5 - Math.abs(offset);
      card.classList.toggle('is-active', offset === 0);
      card.setAttribute('aria-pressed', String(offset === 0));
    });
  }
  portraits.forEach((card, index) => {
    listen(card, 'click', () => selectPortrait(index));
    listen(card, 'keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        selectPortrait(active + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
  });

  /* MAPS_CONTROLLER */
  /* SEARCH_CONTROLLER */

  // Measure hidden copies, never resetting the visible bar during scrolling or
  // late font loading. The section always retains its full, original height.
  (() => {
    const section = page.querySelector('#new-block');
    const band = section?.querySelector('.rx-order-band');
    const search = page.querySelector('#website');
    if (!band || !search) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const selectors = { logo: '.rx-order-logo', heading: 'h2', amount: '.rx-order-price strong', note: '.rx-order-price small', button: '.rx-order-button' };
    const parts = Object.fromEntries(Object.entries(selectors).map(([key, selector]) => [key, band.querySelector(selector)]));
    const clamp = value => Math.max(0, Math.min(1, value));
    const mix = (a, b, p) => a + (b - a) * p;
    let geometry;
    let frame = 0;
    let previousY = window.scrollY;
    let direction = 1;
    let travel = 0;
    let candidate = 1;

    function snapshot(compact) {
      const clone = band.cloneNode(true);
      clone.className = 'rx-order-band' + (compact ? ' is-compact-measure' : '');
      clone.removeAttribute('style');
      clone.removeAttribute('inert');
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      clone.style.cssText = 'position:fixed!important;top:-10000px!important;left:0!important;visibility:hidden!important;opacity:0!important;transition:none!important;pointer-events:none!important;';
      if (!compact) clone.style.width = section.clientWidth + 'px';
      clone.querySelectorAll('[style]').forEach(element => element.removeAttribute('style'));
      clone.querySelectorAll('.rx-morph-part').forEach(element => element.classList.remove('rx-morph-part'));
      section.appendChild(clone);
      const box = clone.getBoundingClientRect();
      const items = {};
      for (const [key, selector] of Object.entries(selectors)) {
        const el = clone.querySelector(selector);
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const font = parseFloat(style.fontSize) || 12;
        items[key] = { x: rect.left - box.left, y: rect.top - box.top, w: rect.width, h: rect.height, font, line: parseFloat(style.lineHeight) || font * 1.25 };
      }
      clone.remove();
      return { w: box.width, h: box.height, items };
    }
    function measure() {
      geometry = { full: snapshot(false), compact: snapshot(true) };
      geometry.compact.items.heading = { ...geometry.full.items.heading, w: 0 };
      section.style.height = geometry.full.h + 'px';
      update();
    }
    function show(visible) {
      band.classList.toggle('is-scroll-hidden', !visible);
      band.inert = !visible;
      if (visible) band.removeAttribute('aria-hidden');
      else band.setAttribute('aria-hidden', 'true');
    }
    function update() {
      frame = 0;
      if (!geometry || signal.aborted) return;
      const y = Math.max(0, window.scrollY);
      const delta = y - previousY;
      previousY = y;
      if (Math.abs(delta) > .1) {
        const next = delta > 0 ? 1 : -1;
        if (next !== candidate) { candidate = next; travel = 0; }
        travel += Math.abs(delta);
        if (travel >= 7) direction = candidate;
      }
      const anchor = section.getBoundingClientRect();
      // The full strip is ordinary page content from the first render. Give it
      // another 22% of a screen after it is fully visible before shrinking it.
      const start = Math.max(96, innerHeight - geometry.full.h - 24 - innerHeight * .22);
      if (candidate < 0 || direction < 0) {
        if (anchor.top >= start) {
          band.classList.remove('is-transforming', 'is-condensed');
          parts.heading.inert = false;
          show(true);
        } else show(false);
        return;
      }
      const raw = clamp((start - anchor.top) / Math.min(320, Math.max(180, innerHeight * .34)));
      const p = motion.matches ? (raw >= 1 ? 1 : 0) : raw * raw * (3 - 2 * raw);
      const visible = search.getBoundingClientRect().top > -innerHeight * .45;
      if (p === 0) {
        band.classList.remove('is-transforming', 'is-condensed');
      } else {
        band.classList.add('is-transforming');
        band.classList.toggle('is-condensed', raw >= .55);
        const { full, compact } = geometry;
        const safeBottom = parseFloat(getComputedStyle(band).getPropertyValue('--rx-safe-bottom')) || 0;
        const target = innerHeight - compact.h - 20 - safeBottom;
        band.style.setProperty('--morph-top', mix(start, target, p) + 'px');
        band.style.setProperty('--morph-width', mix(full.w, compact.w, p) + 'px');
        band.style.setProperty('--morph-height', mix(full.h, compact.h, p) + 'px');
        band.style.setProperty('--heading-opacity', String(1 - clamp(raw * 3)));
        band.style.setProperty('--tax-opacity', String(1 - clamp(raw * 3)));
        for (const [key, el] of Object.entries(parts)) {
          const a = full.items[key], b = compact.items[key];
          for (const name of ['x', 'y', 'w', 'h', 'font', 'line']) el.style.setProperty('--part-' + name, mix(a[name], b[name], p) + 'px');
        }
      }
      parts.heading.inert = raw >= .4;
      band.dataset.scrollState = raw === 0 ? 'full' : raw < 1 ? 'morph' : 'compact';
      show(visible);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    Object.values(parts).forEach(el => el.classList.add('rx-morph-part'));
    listen(window, 'scroll', schedule, { passive: true });
    listen(window, 'resize', measure, { passive: true });
    listen(motion, 'change', schedule);
    document.fonts?.ready.then(() => { if (!signal.aborted) measure(); });
    measure();
    cleanups.push(() => cancelAnimationFrame(frame));
  })();

  return () => { abort.abort(); cleanups.forEach(cleanup => cleanup()); };
}
