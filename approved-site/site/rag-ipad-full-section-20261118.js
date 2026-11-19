/* RAG homepage: synchronized iPad carousel and search panel. Keep React's live search form mounted. */
(() => {
  const sectionSelector = '#unternehmen';
  const styleId = 'rag-ipad-section-style-20261118';
  const scriptId = 'rag-ipad-slide-script-20261118';
  const formTitle = 'Wie hoch ist Ihr<br><em>Sichtbarkeitsindex?</em>';

  function styleSection() {
    if (document.getElementById(styleId)) return;
    const css = document.createElement('link');
    css.id = styleId;
    css.rel = 'stylesheet';
    css.href = '/rag-ipad-section-20261118.css';
    document.head.appendChild(css);
  }

  function updateSearchCopy(section) {
    const copy = section.querySelector('.rx-check-report-copy');
    if (!copy) return;
    const heading = copy.querySelector('h2');
    if (heading) heading.innerHTML = formTitle;
    const subtitle = copy.querySelector(':scope > p');
    if (subtitle) {
      // Hide the old subtitle while leaving the React-managed element mounted.
      subtitle.textContent = '';
      subtitle.hidden = true;
      subtitle.setAttribute('aria-hidden', 'true');
      subtitle.style.setProperty('display', 'none', 'important');
    }
    const input = copy.querySelector('.bc-form input');
    if (input) {
      input.placeholder = 'Ihr Firmenname und Ort';
      input.setAttribute('aria-label', 'Ihr Firmenname und Ort');
    }
    // Keep the existing React form and all its listeners; CSS removes outdated extra copy.
  }

  async function install() {
    const section = document.querySelector(sectionSelector);
    if (!section) return;
    styleSection();
    updateSearchCopy(section);
    const oldCarousel = section.querySelector('.rx-report-carousel');
    if (!oldCarousel || document.getElementById(scriptId)) return;
    try {
      const response = await fetch('/rag-ipad-carousel-data.html', { cache: 'no-store' });
      if (!response.ok) throw new Error('Carousel data request failed: ' + response.status);
      const source = new DOMParser().parseFromString(await response.text(), 'text/html');
      const newCarousel = source.querySelector('.rx-report-carousel');
      const slideScript = source.querySelector('script');
      if (!newCarousel || !slideScript) throw new Error('Carousel markup or animation is missing');
      oldCarousel.replaceWith(document.importNode(newCarousel, true));
      const activeScript = document.createElement('script');
      activeScript.id = scriptId;
      activeScript.textContent = slideScript.textContent;
      document.body.appendChild(activeScript);
    } catch (error) {
      console.error('RAG iPad section failed to load:', error);
      // Existing HTML remains visible as a fallback if fetch fails.
    }
  }

  if (document.readyState === 'complete') {
    install();
  } else {
    window.addEventListener('load', install, { once: true });
  }
})();