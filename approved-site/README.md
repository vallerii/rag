# Approved OrtsFuchs homepage assembly

This directory retains the production snapshot of `rag-style-exploration.vercel.app` and integrates the four approved HTML designs without rebuilding or changing the other deployed pages.

| Design | Homepage placement |
| --- | --- |
| `designs/hero.html` | Header and hero |
| `designs/maps.html` | Google Maps, after the existing overview and AI section |
| `designs/offer.html` | Only the dark 149 € order band |
| `designs/search.html` | Google Search, before the existing Instagram section |

`scripts/assemble.py` extracts the approved markup, scopes section CSS, externalizes embedded images, and integrates the sections into both the prerendered homepage and the retained React entry. The original entry remains available for unchanged subpages. It also asserts that the other prerendered sections remain identical to the baseline.

`scripts/controller.js` owns the new interactions. The offer measures hidden copies only when fonts or viewport dimensions change, retains its layout space, and stays in normal page flow until its center reaches the viewport center. It then morphs continuously to the bottom and remains there throughout downward scrolling, hiding only on upward scrolling. The existing Instagram and iPad loaders start after React commits so the initial render cannot overwrite them.

The footer theme control uses the existing React state and saved theme preference. The existing check form and account routes retain their original entry and behavior.

The visibility buttons have a quiet, periodic orange sweep. The header scrolls away with the document on downward scrolling; the two menu islands return at the viewport top on upward scrolling. When downward scrolling resumes, they travel upward by the actual scroll distance, without fading. The fixed wordmark uses the styled background below it to switch Orts between black and white, while Fuchs remains orange. Maps uses `scripts/maps-controller.js` for linear article motion and a short scroll interval. On desktop, the FAQ title sticks 24px below the measured wordmark.

Generated entry, CSS, and module URLs are versioned by content so cached production assets cannot retain an earlier interaction controller.

To regenerate: `python3 scripts/assemble.py` (Python with lxml). To validate and deploy the retained output: `npm run build`; Vercel serves `site/` with the existing rewrites, redirects, and headers from `vercel.json`.
