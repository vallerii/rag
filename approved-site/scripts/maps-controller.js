(() => {
  const root = page.querySelector('#approved-maps');
  const section = root?.querySelector('#maps');
  const timeline = root?.querySelector('#maps-scroll');
  const motion = root?.querySelector('#article-motion');
  if (!section || !timeline || !motion) return;
  const article = motion.querySelector('.article-card');
  const reading = root.querySelector('.maps-reading');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
  let zoom = 1;
  let desktop = false;
  let frame = 0;

  function update() {
    frame = 0;
    if (signal.aborted) return;
    const bounds = timeline.getBoundingClientRect();
    if (!desktop) {
      motion.style.transform = 'none';
      motion.style.opacity = '1';
      motion.style.visibility = 'visible';
      motion.inert = false;
      section.style.setProperty('--spread', '.45');
      return;
    }
    const travel = Math.max(1, (timeline.offsetHeight - section.offsetHeight) * zoom);
    // Linear motion begins as soon as the section enters the viewport. There
    // is no eased start or extra pinned reading interval.
    const progress = clamp((innerHeight - bounds.top) / (innerHeight + travel));
    const available = Math.max(0, reading.clientHeight - article.offsetHeight);
    const y = reduced.matches ? available : available * progress;
    const fadeIn = smooth((innerHeight - bounds.top) / (innerHeight * .3));
    const fadeOut = 1 - smooth((progress - .85) / .15);
    const opacity = reduced.matches ? 1 : fadeIn * fadeOut;
    motion.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
    motion.style.opacity = opacity.toFixed(4);
    motion.style.visibility = opacity < .001 ? 'hidden' : 'visible';
    motion.inert = opacity < .03;
    motion.dataset.progress = progress.toFixed(4);
    const fan = reduced.matches ? .2 : clamp((innerHeight - bounds.top - innerHeight * .3) / (innerHeight * .9));
    section.style.setProperty('--spread', fan.toFixed(3));
  }
  function measure() {
    const width = document.documentElement.clientWidth;
    desktop = width > 760;
    zoom = desktop ? width / 1228.8 : 1;
    root.style.zoom = zoom;
    if (desktop) {
      const stage = Math.max(540, (innerHeight - 170) / zoom);
      section.style.height = stage + 'px';
      section.style.minHeight = '0';
      timeline.style.height = stage + Math.min(280, innerHeight * .3) / zoom + 'px';
    } else {
      section.style.height = 'auto';
      section.style.minHeight = '0';
      timeline.style.height = 'auto';
    }
    update();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  listen(window, 'scroll', schedule, { passive: true });
  listen(window, 'resize', measure, { passive: true });
  listen(reduced, 'change', update);
  measure();
  document.fonts.ready.then(() => { if (!signal.aborted) measure(); });
  for (const link of root.querySelectorAll('[data-open]')) listen(link, 'click', event => {
    event.preventDefault();
    root.querySelector('#' + link.dataset.open).showModal();
  });
  for (const dialog of root.querySelectorAll('dialog')) {
    listen(dialog.querySelector('[data-close]'), 'click', () => dialog.close());
    listen(dialog, 'click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  }
  cleanups.push(() => cancelAnimationFrame(frame));
})();
