"""Integrate the four approved HTML files into the retained production snapshot."""
from pathlib import Path
import base64
import hashlib
import json
import re
from lxml import html as H

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
DESIGNS = ROOT / 'designs'
OUT = SITE / 'ortsfuchs'
OUT.mkdir(exist_ok=True)

def read(name):
    return (DESIGNS / name).read_text()

def fragment(source, xpath):
    return H.tostring(H.fromstring(source).xpath(xpath)[0], encoding='unicode')

def body(source):
    return re.search(r'<body[^>]*>(.*?)</body>', source, re.S).group(1)

existing_assets = {hashlib.sha256(p.read_bytes()).hexdigest(): '/' + p.relative_to(SITE).as_posix()
                   for p in SITE.rglob('*') if p.is_file() and p.suffix in {'.webp', '.png', '.svg', '.woff2'}}

def asset(match):
    mime, encoded = match.group(1), match.group(2)
    content = base64.b64decode(encoded)
    digest = hashlib.sha256(content).hexdigest()
    if digest not in existing_assets:
        ext = {'image/webp': 'webp', 'image/png': 'png', 'image/svg+xml': 'svg', 'font/woff2': 'woff2'}[mime]
        p = OUT / f'{digest[:16]}.{ext}'
        p.write_bytes(content)
        existing_assets[digest] = '/' + p.relative_to(SITE).as_posix()
    return existing_assets[digest]

def externalize(markup):
    markup = re.sub(r'data:(image/(?:webp|png|svg\+xml)|font/woff2);base64,([A-Za-z0-9+/=]+)', asset, markup)
    return markup.replace('https://rag-style-exploration.vercel.app/', '/')

def split_selectors(text):
    depth = 0
    start = 0
    for i, char in enumerate(text):
        depth += (char == '(') - (char == ')')
        if char == ',' and depth == 0:
            yield text[start:i].strip()
            start = i + 1
    yield text[start:].strip()

def scoped(css, scope):
    """Scope complete CSS rules, including nested media queries, to one module."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    output = []
    pos = 0
    while pos < len(css):
        opening = css.find('{', pos)
        if opening < 0:
            break
        selector = css[pos:opening].strip()
        depth = 1
        quote = None
        i = opening + 1
        while depth and i < len(css):
            char = css[i]
            if quote:
                if char == quote and css[i - 1] != '\\': quote = None
            elif char in ['"', "'"]: quote = char
            elif char == '{': depth += 1
            elif char == '}': depth -= 1
            i += 1
        content = css[opening + 1:i - 1]
        pos = i
        if selector.startswith('@font-face'):
            continue
        if selector.startswith(('@media', '@supports', '@container')):
            output.append(selector + '{' + scoped(content, scope) + '}')
        elif selector.startswith('@'):
            output.append(selector + '{' + content + '}')
        else:
            selectors = []
            for sel in split_selectors(selector):
                if sel in [':root', 'html', 'body', '.rx']:
                    selectors.append(scope)
                else:
                    selectors.append(scope + ' ' + sel)
            output.append(','.join(selectors) + '{' + content + '}')
    return '\n'.join(output)

hero = read('hero.html')
maps = read('maps.html')
offer = read('offer.html')
search = read('search.html')
templates = {
    'header': fragment(hero, '//header'),
    'hero': fragment(hero, '//section[@id="sichtbarkeit"]'),
    'maps': '<div id="approved-maps">' + fragment(maps, '//section[@id="maps-scroll"]') + fragment(maps, '//dialog[@id="review-article"]') + '</div>',
    'offer': '<div id="approved-offer" class="approved-offer-beat">' + fragment(offer, '//section[@id="new-block"]') + '</div>',
    'search': '<div id="approved-search">' + fragment(search, '//svg[@class="svg-library"]') + fragment(search, '//main') .replace('<main ', '<section ', 1).replace('</main>', '</section>') + '</div>',
}
templates = {name: externalize(markup) for name, markup in templates.items()}

hero_css = re.search(r'/\* OrtsFuchs header\..*?(?=</style>)', hero, re.S).group()
maps_css = re.search(r'<style[^>]*>(.*?)</style>', maps, re.S).group(1)
search_css = re.search(r'<style[^>]*>(.*?)</style>', search, re.S).group(1)
offer_css = re.search(r'/\* Google profile order interlude.*?(?=</style>)', offer, re.S).group()
# Drop isolated-preview spacers and the old entrance/direction animation rules.
base_offer = offer_css.split('/* Preview-only space')[0]
compact = offer_css[offer_css.index('#new-block .rx-order-band.is-compact-measure'):offer_css.index('/* Visibility uses vertical motion only;')]
compact = compact.replace('html.rx-scroll-reveal #new-block .rx-order-band.is-transforming', '#new-block .rx-order-band.is-transforming')
compact = compact.replace('transition:opacity .2s ease,transform .22s ease,visibility 0s;', 'transition:opacity .18s ease,visibility 0s;')

css = hero_css + '\n' + scoped(maps_css, '#approved-maps') + '\n' + scoped(search_css, '#approved-search') + '\n' + base_offer + compact
css += '''
/* Integration boundaries: no global preview zoom, resets, or spacer sections. */
.approved-block{display:contents}
.rx-hero{padding-bottom:0}
.rx-footer .rx-theme{order:3;flex-shrink:0;margin-left:8px}
#approved-maps{background:var(--rx-bg);--bg:var(--rx-bg);--surface:var(--rx-surface);--ink:var(--rx-ink);--muted:var(--rx-muted);--line:var(--rx-border);--accent:var(--rx-accent)}
#approved-maps #maps{scroll-margin-top:96px}
#approved-search{--background:var(--rx-bg);--surface:var(--rx-surface);--ink:var(--rx-ink);--muted:var(--rx-muted);--line:var(--rx-border);--accent:var(--rx-accent)}
#approved-search .photo-note{color:#101114}
#approved-search .photo-note small{color:#666970}
#approved-search .search-layer::before{pointer-events:none}
.rx[data-theme=dark] #approved-search .search-light::before{background:radial-gradient(ellipse at center,#161618 0%,#161618 39%,#161618ef 49%,#16161894 61%,#16161800 77%)}
.approved-offer-beat{min-height:clamp(300px,55svh,680px);display:flow-root}
#new-block .rx-order-band{--rx-safe-bottom:env(safe-area-inset-bottom,0px);transition:opacity .18s ease,visibility 0s}
#new-block .rx-order-band.is-scroll-hidden{opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility 0s .18s}
#new-block .rx-order-band.is-transforming{transform:none;transition:opacity .18s ease,visibility 0s}
#new-block .rx-order-band.is-transforming.is-scroll-hidden{transform:none}
@media(prefers-reduced-motion:reduce){#new-block .rx-order-band{transition:none!important}}
'''
(OUT / 'approved-blocks.css').write_text(css)

controller = (ROOT / 'scripts/controller.js').read_text()
maps_js = re.findall(r'<script[^>]*>(.*?)</script>', maps, re.S)[0]
maps_js = maps_js.replace("document.getElementById('preview')", "document.getElementById('approved-maps')")
maps_js = re.sub(r"const before=.*?;\nconst after=.*?;\n", '', maps_js)
maps_js = re.sub(r"\s*before\.style\.height=.*?;", '', maps_js)
maps_js = re.sub(r"\s*after\.style\.height=.*?;", '', maps_js)
maps_js = maps_js.replace("document.querySelectorAll('[data-open]')", "preview.querySelectorAll('[data-open]')").replace("document.querySelectorAll('dialog')", "preview.querySelectorAll('dialog')")
maps_js = maps_js.replace("document.getElementById(link.dataset.open)", "preview.querySelector('#'+link.dataset.open)")
maps_js = maps_js.replace('window.addEventListener(', 'listen(window,').replace('reducedMotion.addEventListener(', 'listen(reducedMotion,')
maps_js = maps_js.replace("link.addEventListener('click',", "listen(link,'click',").replace("dialog.querySelector('[data-close]').addEventListener('click',", "listen(dialog.querySelector('[data-close]'),'click',").replace("dialog.addEventListener('click',", "listen(dialog,'click',")
maps_js = maps_js.replace('document.fonts.ready.then(fitPreview)', 'document.fonts.ready.then(()=>{if(!signal.aborted)fitPreview()})')
maps_js += '\ncleanups.push(()=>cancelAnimationFrame(scrollFrame));'
controller = controller.replace('/* MAPS_CONTROLLER */', '(()=>{\n' + maps_js + '\n})();')

search_js = re.findall(r'<script[^>]*>(.*?)</script>', search, re.S)[0]
search_js = search_js.replace('(() => {', "(() => {\n  const root=document.getElementById('approved-search');", 1)
search_js = search_js.replace('document.querySelector(', 'root.querySelector(').replace('document.querySelectorAll(', 'root.querySelectorAll(')
search_js = search_js.replace('window.addEventListener(', 'listen(window,')
search_js = search_js.replace('  update();\n})();', '  update();\n  cleanups.push(()=>cancelAnimationFrame(frame));\n})();')
controller = controller.replace('/* SEARCH_CONTROLLER */', search_js)
module = 'export const approvedTemplates=' + json.dumps(templates, ensure_ascii=False) + ';\n' + controller
(OUT / 'approved-blocks.js').write_text(module)

baseline = (ROOT / 'baseline/index.html').read_text()
old_bundle_name = re.search(r'<script[^>]*src="(/assets/index-[^\"]+\.js)"', baseline).group(1)
bundle = (SITE / old_bundle_name.lstrip('/')).read_text()
start = bundle.index('function mn(){')
end = bundle.index('function hn(', start)
component = bundle[start:end]

def jsx(name):
    return '(0,C.jsx)(`div`,{className:`approved-block`,"data-approved-block":`' + name + '`,dangerouslySetInnerHTML:{__html:approvedTemplates.' + name + '}})'

header_start = component.index('(0,C.jsxs)(`header`,{className:`rx-header`')
header_end = component.index(',(0,C.jsxs)(`main`,', header_start)
component = component[:header_start] + jsx('header') + component[header_end:]
hero_start = component.index('(0,C.jsxs)(`section`,{className:`rx-hero`')
hero_end = component.index(',(0,C.jsx)(Yt,{})', hero_start)
component = component[:hero_start] + jsx('hero') + component[hero_end:]
maps_start = component.index('(0,C.jsxs)(`section`,{className:`rx-channel rx-channel-reverse rx-container`,id:`maps`')
maps_end = component.index(',(0,C.jsx)(an,{})', maps_start)
component = component[:maps_start] + jsx('maps') + ',' + jsx('offer') + component[maps_end:]
assert component.count('(0,C.jsx)(an,{})') == 1
component = component.replace('(0,C.jsx)(an,{})', jsx('search'), 1)
effect = '(0,v.useEffect)(()=>mountApprovedSections(),[]);'
component = component.replace('function mn(){', 'function mn(){' + effect, 1)
footer = component.index('(0,C.jsxs)(`footer`,')
button = '(0,C.jsx)(`button`,{className:`rx-theme`,type:`button`,onClick:i,"aria-label":e?`Helle Ansicht aktivieren`:`Dunkle Ansicht aktivieren`,"aria-pressed":e,children:(0,C.jsx)(pn,{dark:e})}),'
component = component[:footer] + component[footer:].replace('children:[', 'children:[' + button, 1)
bundle = 'import{approvedTemplates,mountApprovedSections}from"/ortsfuchs/approved-blocks.js";\n' + bundle[:start] + component + bundle[end:]
new_bundle = '/assets/index-ortsfuchs-20261119.js'
(SITE / new_bundle.lstrip('/')).write_text(bundle)

def wrap(name):
    return '<div class="approved-block" data-approved-block="' + name + '">' + templates[name] + '</div>'

index = baseline
index = re.sub(r'<script\s+defer\s+src="/(?:rag-ipad-full-section-20261118|rag-social-v19-loader)\.js"\s*></script>', '', index)
index = re.sub(r'<header class="rx-header">.*?</header>', lambda _: wrap('header'), index, count=1, flags=re.S)
index = re.sub(r'<section class="rx-hero".*?</section>', lambda _: wrap('hero'), index, count=1, flags=re.S)
index = re.sub(r'<section class="rx-channel rx-channel-reverse rx-container" id="maps".*?</section>', lambda _: wrap('maps') + wrap('offer'), index, count=1, flags=re.S)
index = re.sub(r'<section class="rx-channel rx-container rx-google-section" id="website".*?</section>', lambda _: wrap('search'), index, count=1, flags=re.S)
theme = fragment(hero, '//footer/button')
index = index.replace('<footer class="rx-footer rx-container">', '<footer class="rx-footer rx-container">' + theme, 1)
index = index.replace(old_bundle_name, new_bundle, 1)
index = index.replace('</head>', '<link rel="stylesheet" href="/ortsfuchs/approved-blocks.css">\n</head>', 1)
(SITE / 'index.html').write_text(index)

# Exact identity checks for every untouched server-rendered section.
before = H.fromstring(baseline)
after = H.fromstring(index)
for section_id in ['leistungen', 'ki', 'social', 'quellen', 'rx-scroll-story', 'unternehmen', 'faq']:
    a = H.tostring(before.get_element_by_id(section_id))
    b = H.tostring(after.get_element_by_id(section_id))
    assert a == b, 'Unchanged section modified: ' + section_id
assert re.findall(r'data-approved-block="([^"]+)"', index) == ['header', 'hero', 'maps', 'offer', 'search']
print('Assembled approved sections; untouched sections match the production snapshot exactly.')
