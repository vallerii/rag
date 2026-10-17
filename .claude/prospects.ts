// supabase/functions/prospects/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

// supabase/functions/_shared/human.ts
var TURNSTILE_SECRET = Deno.env.get("TURNSTILE_SECRET") ?? "";
var PASS_SECRET = Deno.env.get("HUMAN_PASS_SECRET") ?? TURNSTILE_SECRET;
var PASS_TTL_MS = 30 * 6e4;
var enc = new TextEncoder();
var keyPromise = null;
function hmacKey() {
  keyPromise ??= crypto.subtle.importKey("raw", enc.encode(PASS_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return keyPromise;
}
var b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function signPass() {
  const exp = String(Date.now() + PASS_TTL_MS);
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(exp));
  return `${exp}.${b64url(sig)}`;
}
async function passValid(pass) {
  const [exp, sig] = pass.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = b64url(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(exp)));
  return expected.length === sig.length && expected === sig;
}
async function turnstileValid(token, ip) {
  const form = new FormData();
  form.append("secret", TURNSTILE_SECRET);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  return data?.success === true;
}
async function humanCheck(req) {
  if (!TURNSTILE_SECRET) return {};
  const pass = req.headers.get("x-rag-pass") ?? "";
  if (pass && await passValid(pass)) return {};
  const token = req.headers.get("x-turnstile") ?? "";
  if (!token) return null;
  const ip = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (!await turnstileValid(token, ip)) return null;
  return { "x-rag-pass": await signPass() };
}

// supabase/functions/_shared/http.ts
var ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
function allowOrigin(origin) {
  if (!origin) return "*";
  if (!ALLOWED.length) return origin;
  if (ALLOWED.includes(origin)) return origin;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return origin;
  return "";
}
function cors(req) {
  return {
    "Access-Control-Allow-Origin": allowOrigin(req.headers.get("origin")) || "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-turnstile, x-rag-pass",
    "Access-Control-Expose-Headers": "x-rag-pass",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}
function json(req, data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
}
var hits = /* @__PURE__ */ new Map();
function limited(req, perMinute) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 6e4);
  list.push(now);
  hits.set(ip, list);
  return list.length > perMinute;
}
function handler(perMinute, fn, opts = {}) {
  return async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
    if (req.method !== "POST") return json(req, { error: "method" }, 405);
    if (req.headers.get("origin") && !allowOrigin(req.headers.get("origin"))) return json(req, { error: "origin" }, 403);
    if (limited(req, perMinute)) return json(req, { error: "rate" }, 429);
    let extra = {};
    if (opts.human) {
      const ok = await humanCheck(req);
      if (!ok) return json(req, { error: "human" }, 403);
      extra = ok;
    }
    try {
      const body = await req.json().catch(() => ({}));
      const res = await fn(req, body);
      for (const [k, v] of Object.entries(extra)) res.headers.set(k, v);
      return res;
    } catch (e) {
      console.error(e);
      const status = e.status;
      return json(req, { error: e instanceof Error ? e.message : "error" }, status && status < 500 ? 502 : 500);
    }
  };
}
function placesKey() {
  const key = Deno.env.get("GOOGLE_PLACES_KEY");
  if (!key) throw new Error("GOOGLE_PLACES_KEY fehlt (Supabase \u2192 Edge Functions \u2192 Secrets)");
  return key;
}

// supabase/functions/_shared/google.ts
var BASE = "https://places.googleapis.com/v1";
var LANG = "de";
var REFERER = globalThis.Deno?.env.get("PLACES_REFERER") ?? globalThis.process?.env.PLACES_REFERER ?? "https://rag-theta-one.vercel.app/";
var DE = { low: { latitude: 47.27, longitude: 5.86 }, high: { latitude: 55.06, longitude: 15.05 } };
var FOREIGN = /(^|,\s*)(Österreich|Austria|Schweiz|Switzerland|Frankreich|France|Niederlande|Netherlands|Belgien|Belgium|Luxemburg|Luxembourg|Dänemark|Denmark|Polen|Poland|Tschechien|Czechia|Liechtenstein)$/i;
var onlyDE = (p) => !p.formattedAddress || !FOREIGN.test(p.formattedAddress.trim());
var PlacesError = class extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
async function call(key, path, init, mask) {
  const res = await fetch(BASE + path, {
    method: init.method,
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": mask, "Referer": REFERER },
    body: init.body ? JSON.stringify(init.body) : void 0
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PlacesError(res.status, data?.error?.message ?? res.statusText);
  return data;
}
var MASK_SEARCH = "places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName";
var MASK_CARD = "id,displayName,formattedAddress,addressComponents,location,primaryTypeDisplayName,rating,userRatingCount,websiteUri,nationalPhoneNumber,googleMapsUri";
var MASK_AUDIT = MASK_CARD + ",primaryType,types,businessStatus,internationalPhoneNumber,regularOpeningHours,photos,reviews,editorialSummary";
var MASK_COMPETITORS = "places.id,places.displayName,places.rating,places.userRatingCount,places.websiteUri";
async function searchPlaces(key, query) {
  const data = await call(key, "/places:searchText", {
    method: "POST",
    body: { textQuery: query, languageCode: LANG, regionCode: "de", pageSize: 8, locationRestriction: { rectangle: DE } }
  }, MASK_SEARCH);
  return (data.places ?? []).filter(onlyDE).map((p) => ({
    id: p.id,
    main: p.displayName?.text ?? "",
    secondary: [p.primaryTypeDisplayName?.text, p.formattedAddress].filter(Boolean).join(" \xB7 ")
  }));
}
async function placeRaw(key, id, full = false) {
  return call(key, `/places/${encodeURIComponent(id)}?languageCode=${LANG}`, { method: "GET" }, full ? MASK_AUDIT : MASK_CARD);
}
function component(p, ...types) {
  for (const t of types) {
    const c = p.addressComponents?.find((c2) => c2.types.includes(t));
    if (c) return c;
  }
  return void 0;
}
function defaultQuery(p) {
  const city = component(p, "locality", "postal_town")?.longText ?? "";
  return [p.primaryTypeDisplayName?.text, city].filter(Boolean).join(" ");
}
async function competitors(key, p, q) {
  const query = q?.trim() || defaultQuery(p);
  const body = { textQuery: query, languageCode: LANG, pageSize: 20 };
  if (p.location) body.locationBias = { circle: { center: p.location, radius: 15e3 } };
  const data = await call(key, "/places:searchText", { method: "POST", body }, MASK_COMPETITORS);
  const list = (data.places ?? []).map((x) => ({
    id: x.id,
    name: x.displayName?.text ?? "",
    rating: x.rating ?? null,
    reviews: x.userRatingCount ?? 0,
    website: !!x.websiteUri
  }));
  const idx = list.findIndex((x) => x.id === p.id);
  return { query, list, rank: idx >= 0 ? idx + 1 : null };
}

// supabase/functions/_shared/site.ts
var SOURCE_ORDER = ["website", "instagram", "facebook", "linkedin", "tiktok"];
var UA = "Mozilla/5.0 (compatible; RAG-Sichtbarkeits-Check/1.0; +https://rag.agency)";
function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}
function meta(html, name) {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const c = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return c ? decode(c) : null;
}
var SOCIAL = [
  ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]{2,30})\/?(?=["'?#\s<])/gi, /^(p|reel|reels|explore|stories|accounts|share)$/i],
  ["facebook", /https?:\/\/(?:[a-z]{2,3}-[a-z]{2}\.|www\.|m\.|de-de\.)?facebook\.com\/((?:profile\.php\?id=\d+)|[A-Za-z0-9.\-]{2,80})\/?(?=["'?#\s<])/gi, /^(sharer|sharer\.php|share|plugins|tr|dialog|events|groups|watch|login|policies|privacy)$/i],
  ["linkedin", /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/((?:company|in|school)\/[A-Za-z0-9_\-%.]{2,100})\/?(?=["'?#\s<])/gi, /^(shareArticle|sharing)/i],
  ["tiktok", /https?:\/\/(?:www\.)?tiktok\.com\/(@[A-Za-z0-9_.]{2,30})\/?(?=["'?#\s<])/gi, /^$/]
];
function socialLinks(html) {
  const out = {};
  for (const [key, re, skip] of SOCIAL) {
    re.lastIndex = 0;
    for (const m of html.matchAll(re)) {
      const handle = m[1];
      if (skip.test(handle)) continue;
      out[key] = key === "instagram" ? "@" + handle : key === "facebook" ? "facebook.com/" + handle : key === "linkedin" ? "linkedin.com/" + handle : handle;
      break;
    }
  }
  return out;
}
function schemaTypes(html) {
  const types = /* @__PURE__ */ new Set();
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const t of m[1].matchAll(/"@type"\s*:\s*(\[[^\]]*\]|"[^"]+")/g)) {
      t[1].replace(/[\[\]"]/g, "").split(",").map((s) => s.trim()).filter(Boolean).forEach((x) => types.add(x));
    }
  }
  return [...types];
}
async function get(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": UA, "Accept": "text/html,*/*;q=0.8", "Accept-Language": "de" } });
    const html = (await res.text()).slice(0, 15e5);
    return { res, html, ms: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}
function linkTo(html, base, re) {
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1], label = m[2].replace(/<[^>]+>/g, " ");
    if (re.test(href) || re.test(label)) {
      try {
        return new URL(href, base).toString();
      } catch {
      }
    }
  }
  return null;
}
async function tryGet(url, timeoutMs) {
  try {
    const r = await get(url, timeoutMs);
    return r.res.ok ? r.html : null;
  } catch {
    return null;
  }
}
var COOKIE_RE = /cookiebot|usercentrics|borlabs|complianz|cookieyes|klaro|onetrust|cookie-?consent|cookie-?banner|cookie-?notice|ccm19|consentmanager|real-cookie-banner|iubenda/i;
var REVIEWS_RE = /provenexpert|trustindex|elfsight|trustpilot|reviews-widget|google-reviews|ausgezeichnet\.org|wer-kennt-wen/i;
async function scanSite(website, timeoutMs = 6e3, deep = false) {
  const bare = website.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const empty = { ok: false, url: bare, finalUrl: null, status: null, https: false, ms: null, title: null, description: null, h1: 0, viewport: false, noindex: false, lang: null, schemaTypes: [], telLink: false, words: 0, social: {} };
  let r = null;
  let lastErr = "";
  for (const url of [`https://${bare}`, `http://${bare}`]) {
    try {
      r = await get(url, timeoutMs);
      break;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  if (!r) return { ...empty, error: lastErr || "nicht erreichbar" };
  const { res, html, ms } = r;
  const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return {
    ok: res.ok,
    url: bare,
    finalUrl: res.url || null,
    status: res.status,
    https: (res.url || "").startsWith("https://"),
    ms,
    title: title ? decode(title) || null : null,
    description: meta(html, "description") ?? meta(html, "og:description"),
    h1: (html.match(/<h1[\s>]/gi) ?? []).length,
    viewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    noindex: /noindex/i.test(meta(html, "robots") ?? ""),
    lang: html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? null,
    schemaTypes: schemaTypes(html),
    telLink: /href=["']tel:/i.test(html),
    words: body.split(/\s+/).filter((w) => w.length > 1).length,
    social: socialLinks(html),
    error: res.ok ? void 0 : `HTTP ${res.status}`,
    ...deep ? await extras(html, res.url || `https://${bare}`, body) : {}
  };
}
async function extras(html, base, body) {
  const origin = (() => {
    try {
      return new URL(base).origin;
    } catch {
      return base;
    }
  })();
  const impressum = linkTo(html, base, /impressum|imprint/i);
  const datenschutz = linkTo(html, base, /datenschutz|privacy|dsgvo/i);
  const [impHtml, sm, robots] = await Promise.all([
    impressum ? tryGet(impressum, 4e3) : Promise.resolve(null),
    tryGet(`${origin}/sitemap.xml`, 4e3).then((x) => x ?? tryGet(`${origin}/sitemap_index.xml`, 3e3)),
    tryGet(`${origin}/robots.txt`, 3e3)
  ]);
  const locs = sm ? [...sm.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]) : [];
  const navPaths = [...html.matchAll(/<a\b[^>]*href=["'](\/[^"'#?]*|https?:\/\/[^"'#?]+)["']/gi)].map((m) => m[1]);
  const toPath = (u) => {
    try {
      const x = new URL(u, origin);
      return x.origin === origin ? x.pathname.replace(/\/$/, "") || "/" : null;
    } catch {
      return null;
    }
  };
  const pages = [...new Set([...locs, ...navPaths].map(toPath).filter((x) => !!x && !/\.(jpg|jpeg|png|webp|svg|pdf|xml|css|js)$/i.test(x)))].slice(0, 60);
  const impText = impHtml ? impHtml.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ") : "";
  return {
    impressum,
    datenschutz,
    cookie: COOKIE_RE.test(html),
    sitemap: sm ? { found: true, urls: locs.length } : { found: false, urls: 0 },
    robots: !!robots,
    faq: /FAQPage/.test(html) || /\b(FAQ|Häufige Fragen|Haeufige Fragen|Fragen und Antworten|Fragen & Antworten)\b/i.test(body),
    form: /<form\b[\s\S]{0,4000}?(type=["']email["']|name=["'][^"']*(mail|nachricht|message|telefon|phone)[^"']*["'])/i.test(html),
    mapsEmbed: /google\.[a-z.]+\/maps\/embed|maps\.google\.[a-z.]+\/maps|google\.com\/maps\?/i.test(html),
    reviewsWidget: REVIEWS_RE.test(html),
    pages,
    hay: decode(body + " " + impText).slice(0, 2e5)
  };
}
function sourcesFrom(website, scan) {
  return SOURCE_ORDER.map((key) => {
    if (key === "website") return { key, value: website ?? "", found: !!website };
    const v = scan?.social[key];
    return { key, value: v ?? "", found: !!v };
  });
}

// supabase/functions/_shared/audit.ts
function score(items) {
  const max = items.reduce((a, i) => a + i.max, 0);
  return max ? Math.round(items.reduce((a, i) => a + i.pts, 0) / max * 100) : 0;
}
function points(items) {
  const order = { bad: 0, warn: 1, ok: 2 };
  const shown = [...items].sort((a, b) => order[a.mark] - order[b.mark] || b.max - a.max);
  const goods = shown.filter((i) => i.mark === "ok").slice(0, 2);
  const issues = shown.filter((i) => i.mark !== "ok").slice(0, 5 - goods.length);
  return [...goods, ...issues].map((i) => [i.mark, i.text]);
}
function summary(s, good, mid, weak) {
  return s >= 75 ? good : s >= 50 ? mid : weak;
}
var median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
var fmt = (n) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });
function mapsItems({ place: p, competitors: c, now = /* @__PURE__ */ new Date(), noProfile }) {
  const items = [];
  if (noProfile) {
    items.push({ id: "noprofile", pts: 0, max: 100, mark: "bad", text: "Kein Google-Unternehmensprofil gefunden \u2014 bei Google Maps und lokalen Suchen erscheinen Sie nicht" });
    const n = (c?.list ?? []).length;
    if (c && n) items.push({ id: "rank-noprofile", pts: 0, max: 0, mark: "bad", text: `Bei \xAB${c.query}\xBB zeigt Google ${n} andere Betriebe \u2014 Sie nicht` });
    return items;
  }
  const rating = p.rating ?? 0;
  const reviews = p.userRatingCount ?? 0;
  const others = (c?.list ?? []).filter((x) => x.id !== p.id).slice(0, 5);
  const med = median(others.map((x) => x.reviews));
  items.push(p.businessStatus === "OPERATIONAL" || !p.businessStatus ? { id: "status", pts: 10, max: 10, mark: "ok", text: "Profil ist aktiv und als ge\xF6ffnet markiert" } : { id: "status", pts: 0, max: 10, mark: "bad", text: "Profil ist als vor\xFCbergehend oder dauerhaft geschlossen markiert" });
  if (!reviews) items.push({ id: "rating", pts: 0, max: 15, mark: "bad", text: "Noch keine Bewertungen" });
  else if (rating >= 4.6) items.push({ id: "rating", pts: 15, max: 15, mark: "ok", text: `Sehr gute Bewertung: ${fmt(rating)} \u2605` });
  else if (rating >= 4.2) items.push({ id: "rating", pts: 10, max: 15, mark: "ok", text: `Gute Bewertung: ${fmt(rating)} \u2605` });
  else if (rating >= 3.8) items.push({ id: "rating", pts: 5, max: 15, mark: "warn", text: `Bewertung ${fmt(rating)} \u2605 \u2014 unter dem, was Kunden bei der Auswahl erwarten` });
  else items.push({ id: "rating", pts: 0, max: 15, mark: "bad", text: `Niedrige Bewertung: ${fmt(rating)} \u2605` });
  if (reviews && others.length) {
    if (reviews >= med && reviews >= 30) items.push({ id: "reviews", pts: 20, max: 20, mark: "ok", text: `${reviews} Bewertungen \u2014 mehr als die meisten Wettbewerber (Median ${Math.round(med)})` });
    else if (reviews >= med * 0.5) items.push({ id: "reviews", pts: 12, max: 20, mark: "warn", text: `${reviews} Bewertungen \u2014 Wettbewerber in der N\xE4he haben im Schnitt ${Math.round(med)}` });
    else items.push({ id: "reviews", pts: 5, max: 20, mark: "bad", text: `Nur ${reviews} Bewertungen \u2014 Wettbewerber in der N\xE4he haben im Schnitt ${Math.round(med)}` });
  } else if (reviews) {
    items.push(reviews >= 30 ? { id: "reviews", pts: 16, max: 20, mark: "ok", text: `${reviews} Bewertungen` } : { id: "reviews", pts: 8, max: 20, mark: "warn", text: `Erst ${reviews} Bewertungen` });
  } else items.push({ id: "reviews", pts: 0, max: 20, mark: "bad", text: "Keine Bewertungen \u2014 f\xFCr neue Kunden fehlt der Vertrauensbeweis" });
  const last = (p.reviews ?? []).map((r) => r.publishTime ? Date.parse(r.publishTime) : 0).reduce((a, b) => Math.max(a, b), 0);
  if (reviews) {
    const days = last ? Math.round((now.getTime() - last) / 864e5) : null;
    if (days !== null && days <= 60) items.push({ id: "fresh", pts: 10, max: 10, mark: "ok", text: "Regelm\xE4\xDFig neue Bewertungen" });
    else if (days !== null && days <= 180) items.push({ id: "fresh", pts: 5, max: 10, mark: "warn", text: "Die letzte sichtbare Bewertung ist einige Monate alt" });
    else items.push({ id: "fresh", pts: 0, max: 10, mark: "bad", text: "Seit langem keine neuen Bewertungen" });
  }
  const photos = (p.photos ?? []).length;
  items.push(photos >= 10 ? { id: "photos", pts: 10, max: 10, mark: "ok", text: "Ausreichend Fotos im Profil" } : photos >= 5 ? { id: "photos", pts: 5, max: 10, mark: "warn", text: `Nur ${photos} Fotos im Profil` } : { id: "photos", pts: 0, max: 10, mark: "bad", text: photos ? `Nur ${photos} Fotos im Profil` : "Keine Fotos im Profil" });
  items.push(p.regularOpeningHours?.weekdayDescriptions?.length ? { id: "hours", pts: 10, max: 10, mark: "ok", text: "\xD6ffnungszeiten gepflegt" } : { id: "hours", pts: 0, max: 10, mark: "bad", text: "Keine \xD6ffnungszeiten hinterlegt" });
  items.push(p.nationalPhoneNumber ? { id: "phone", pts: 5, max: 5, mark: "ok", text: "Telefonnummer hinterlegt" } : { id: "phone", pts: 0, max: 5, mark: "bad", text: "Keine Telefonnummer im Profil" });
  items.push(p.websiteUri ? { id: "website", pts: 10, max: 10, mark: "ok", text: "Website mit dem Profil verkn\xFCpft" } : { id: "website", pts: 0, max: 10, mark: "bad", text: "Keine Website mit dem Profil verkn\xFCpft" });
  items.push((p.types ?? []).length >= 3 ? { id: "types", pts: 5, max: 5, mark: "ok", text: "Mehrere passende Kategorien" } : { id: "types", pts: 2, max: 5, mark: "warn", text: "Wenige Kategorien \u2014 Google versteht nicht alle Leistungen" });
  if (c) {
    const q = `\xAB${c.query}\xBB`;
    if (c.rank && c.rank <= 3) items.push({ id: "rank", pts: 15, max: 15, mark: "ok", text: `Bei ${q} unter den ersten 3 (Platz ${c.rank})` });
    else if (c.rank && c.rank <= 10) items.push({ id: "rank", pts: 8, max: 15, mark: "warn", text: `Bei ${q} auf Platz ${c.rank} \u2014 die ersten 3 bekommen die meisten Anrufe` });
    else if (c.rank) items.push({ id: "rank", pts: 3, max: 15, mark: "bad", text: `Bei ${q} erst auf Platz ${c.rank}` });
    else items.push({ id: "rank", pts: 0, max: 15, mark: "bad", text: `Bei ${q} nicht unter den ersten ${c.list.length} Treffern` });
  }
  return items;
}
function siteBlocked(s) {
  return !!s && [401, 403, 429, 503].includes(s.status ?? 0);
}
function searchItems(input) {
  const { place: p, site: s } = input;
  if (!p.websiteUri && !s) return [{ id: "nosite", pts: 5, max: 100, mark: "bad", text: "Keine Website gefunden \u2014 bei Google Search und in der KI-Suche fehlt die wichtigste Quelle" }];
  if (!s || !s.status) return [{ id: "down", pts: 5, max: 100, mark: "bad", text: "Die Website war bei der Pr\xFCfung nicht erreichbar" }];
  if (!s.ok) return [{ id: "down", pts: 5, max: 100, mark: "bad", text: `Die Website antwortet mit einem Fehler (HTTP ${s.status})` }];
  const city = (p.addressComponents?.find((c) => c.types.includes("locality"))?.longText ?? "").toLowerCase();
  const items = [];
  items.push({ id: "reach", pts: 15, max: 15, mark: "ok", text: "Website ist erreichbar" });
  items.push(s.https ? { id: "https", pts: 10, max: 10, mark: "ok", text: "Sichere Verbindung (HTTPS)" } : { id: "https", pts: 0, max: 10, mark: "bad", text: "Keine sichere Verbindung (HTTPS) \u2014 Browser warnen Besucher" });
  items.push(s.viewport ? { id: "mobile", pts: 10, max: 10, mark: "ok", text: "F\xFCr Smartphones eingerichtet" } : { id: "mobile", pts: 0, max: 10, mark: "bad", text: "Nicht f\xFCr Smartphones eingerichtet" });
  if (!s.title) items.push({ id: "title", pts: 0, max: 15, mark: "bad", text: "Die Startseite hat keinen Seitentitel" });
  else if (city && s.title.toLowerCase().includes(city)) items.push({ id: "title", pts: 15, max: 15, mark: "ok", text: "Seitentitel nennt Leistung und Ort" });
  else items.push({ id: "title", pts: 8, max: 15, mark: "warn", text: "Der Seitentitel nennt den Ort nicht \u2014 wichtig f\xFCr lokale Suchen" });
  items.push(s.description ? { id: "desc", pts: 10, max: 10, mark: "ok", text: "Beschreibung f\xFCr Suchergebnisse vorhanden" } : { id: "desc", pts: 0, max: 10, mark: "warn", text: "Keine Beschreibung f\xFCr die Suchergebnisse \u2014 Google w\xE4hlt selbst einen Text" });
  items.push(s.h1 === 1 ? { id: "h1", pts: 5, max: 5, mark: "ok", text: "Klare Haupt\xFCberschrift" } : { id: "h1", pts: 0, max: 5, mark: "warn", text: s.h1 ? "Mehrere Haupt\xFCberschriften auf der Startseite" : "Keine Haupt\xFCberschrift auf der Startseite" });
  const local = s.schemaTypes.some((t) => /LocalBusiness|Organization|Store|Service|Contractor|Plumber|Electrician|Roofing|Dentist|Physician|HairSalon|AutoRepair|HomeAndConstruction|ProfessionalService|MedicalBusiness/i.test(t));
  items.push(local ? { id: "schema", pts: 10, max: 10, mark: "ok", text: "Unternehmensdaten maschinenlesbar ausgezeichnet" } : { id: "schema", pts: 0, max: 10, mark: "warn", text: "Keine maschinenlesbaren Unternehmensdaten \u2014 erschwert es Google und KI, Sie einzuordnen" });
  items.push(s.telLink ? { id: "tel", pts: 10, max: 10, mark: "ok", text: "Telefonnummer direkt antippbar" } : { id: "tel", pts: 0, max: 10, mark: "warn", text: "Telefonnummer ist auf dem Smartphone nicht direkt antippbar" });
  items.push(s.ms !== null && s.ms <= 2500 ? { id: "speed", pts: 10, max: 10, mark: "ok", text: "Startseite l\xE4dt schnell" } : { id: "speed", pts: 3, max: 10, mark: "warn", text: "Startseite l\xE4dt langsam" });
  items.push(s.words >= 300 ? { id: "content", pts: 5, max: 5, mark: "ok", text: "Ausreichend Text auf der Startseite" } : { id: "content", pts: 0, max: 5, mark: "warn", text: "Sehr wenig Text auf der Startseite \u2014 zu wenig Kontext f\xFCr Google und KI" });
  if (s.noindex) items.push({ id: "noindex", pts: 0, max: 10, mark: "bad", text: "Die Startseite ist f\xFCr Google gesperrt (noindex)" });
  if (s.impressum !== void 0) {
    items.push(s.impressum ? { id: "impressum", pts: 8, max: 8, mark: "ok", text: "Impressum vorhanden" } : { id: "impressum", pts: 0, max: 8, mark: "bad", text: "Kein Impressum gefunden \u2014 in Deutschland Pflicht und abmahnf\xE4hig" });
    items.push(s.datenschutz ? { id: "datenschutz", pts: 8, max: 8, mark: "ok", text: "Datenschutzerkl\xE4rung vorhanden" } : { id: "datenschutz", pts: 0, max: 8, mark: "bad", text: "Keine Datenschutzerkl\xE4rung gefunden \u2014 Pflicht nach DSGVO" });
    items.push(s.cookie ? { id: "cookie", pts: 4, max: 4, mark: "ok", text: "Cookie-Hinweis eingerichtet" } : { id: "cookie", pts: 1, max: 4, mark: "warn", text: "Kein Cookie-Hinweis erkannt \u2014 pr\xFCfen, ob Tracking oder externe Dienste eingebunden sind" });
    items.push(s.sitemap?.found ? { id: "sitemap", pts: 5, max: 5, mark: "ok", text: `Sitemap f\xFCr Google vorhanden (${s.sitemap.urls} Seiten)` } : { id: "sitemap", pts: 0, max: 5, mark: "warn", text: "Keine Sitemap gefunden \u2014 Google findet neue Seiten langsamer" });
    const n = (s.pages ?? []).filter((x) => x !== "/" && !/impressum|datenschutz|privacy|kontakt|contact|agb/i.test(x)).length;
    items.push(n >= 5 ? { id: "pages", pts: 10, max: 10, mark: "ok", text: `Mehrere Unterseiten (${n}) \u2014 Platz f\xFCr einzelne Leistungen` } : n >= 2 ? { id: "pages", pts: 5, max: 10, mark: "warn", text: `Nur ${n} Unterseiten \u2014 eigene Seiten je Leistung fehlen` } : { id: "pages", pts: 0, max: 10, mark: "bad", text: "Praktisch nur eine Seite \u2014 Google kann einzelne Leistungen nicht zuordnen" });
    items.push(s.form ? { id: "form", pts: 4, max: 4, mark: "ok", text: "Kontaktformular vorhanden" } : { id: "form", pts: 1, max: 4, mark: "warn", text: "Kein Kontaktformular \u2014 Anfragen nur per Telefon oder E-Mail" });
    const nap = napCheck(p, s);
    if (nap) items.push(nap);
  }
  if (input.pagespeed?.score != null) {
    const v = input.pagespeed.score;
    items.push(v >= 90 ? { id: "pagespeed", pts: 10, max: 10, mark: "ok", text: `Google PageSpeed (mobil): ${v}/100` } : v >= 50 ? { id: "pagespeed", pts: 5, max: 10, mark: "warn", text: `Google PageSpeed (mobil): ${v}/100 \u2014 auf dem Smartphone sp\xFCrbar langsam` } : { id: "pagespeed", pts: 0, max: 10, mark: "bad", text: `Google PageSpeed (mobil): ${v}/100 \u2014 sehr langsam, Besucher springen ab` });
  }
  return items;
}
var digits = (x) => x.replace(/\D+/g, "");
function napCheck(p, s) {
  const hay = (s.hay ?? "").toLowerCase();
  if (!hay) return null;
  const miss = [];
  const phone = digits(p.nationalPhoneNumber ?? "").replace(/^0/, "");
  if (phone.length >= 6 && !digits(hay).includes(phone)) miss.push("Telefon");
  const zip = p.addressComponents?.find((c) => c.types.includes("postal_code"))?.longText;
  if (zip && !hay.includes(zip.toLowerCase())) miss.push("Adresse");
  const word = (p.displayName?.text ?? "").toLowerCase().split(/[^a-zäöüß0-9]+/).find((w) => w.length >= 4);
  if (word && !hay.includes(word)) miss.push("Name");
  if (!phone && !zip) return null;
  return miss.length ? { id: "nap", pts: miss.length > 1 ? 0 : 4, max: 10, mark: miss.length > 1 ? "bad" : "warn", text: `Angaben auf der Website weichen von Google ab (${miss.join(", ")}) \u2014 verwirrt Google und KI` } : { id: "nap", pts: 10, max: 10, mark: "ok", text: "Name, Adresse und Telefon stimmen mit Google \xFCberein" };
}
function aiItems(input) {
  const { place: p, site: s, noProfile } = input;
  const items = [];
  items.push(noProfile ? { id: "ai_profile", pts: 0, max: 20, mark: "bad", text: "Kein Google-Profil \u2014 eine der wichtigsten Quellen f\xFCr KI-Antworten fehlt" } : p.editorialSummary?.text ? { id: "ai_profile", pts: 20, max: 20, mark: "ok", text: "Google-Profil mit Beschreibung \u2014 KI kann Ihr Angebot einordnen" } : { id: "ai_profile", pts: 12, max: 20, mark: "warn", text: "Google-Profil ohne Beschreibung \u2014 KI wei\xDF wenig \xFCber Ihr Angebot" });
  if (s?.ok) {
    const local = s.schemaTypes.some((t) => /LocalBusiness|Organization|Store|Service|Contractor|Plumber|Electrician|Roofing|Dentist|Physician|HairSalon|AutoRepair|HomeAndConstruction|ProfessionalService|MedicalBusiness/i.test(t));
    items.push(local ? { id: "ai_schema", pts: 15, max: 15, mark: "ok", text: "Unternehmensdaten f\xFCr Maschinen lesbar ausgezeichnet" } : { id: "ai_schema", pts: 0, max: 15, mark: "warn", text: "Keine maschinenlesbaren Unternehmensdaten auf der Website" });
    if (s.faq !== void 0) items.push(s.faq ? { id: "ai_faq", pts: 15, max: 15, mark: "ok", text: "Antworten auf h\xE4ufige Fragen auf der Website" } : { id: "ai_faq", pts: 0, max: 15, mark: "warn", text: "Keine Antworten auf typische Kundenfragen \u2014 genau danach fragen Kunden die KI" });
    const nap = napCheck(p, s);
    if (nap) items.push({ ...nap, id: "ai_nap", text: nap.mark === "ok" ? "Einheitliche Unternehmensdaten auf Website und Google" : "Unterschiedliche Unternehmensdaten auf Website und Google \u2014 KI vertraut widerspr\xFCchlichen Angaben weniger" });
  } else {
    items.push({ id: "ai_site", pts: 0, max: 30, mark: "bad", text: "Ohne erreichbare Website fehlt der KI die wichtigste Quelle" });
  }
  return items;
}
function socialItems({ sources, site }) {
  const found = sources.filter((s) => s.key !== "website" && s.value.trim());
  const items = [];
  const n = found.length;
  const LABEL = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", tiktok: "TikTok" };
  const names = found.map((s) => LABEL[s.key] ?? s.key).join(", ");
  items.push(n >= 2 ? { id: "profiles", pts: 55, max: 70, mark: "ok", text: `Profile gefunden: ${names}` } : n === 1 ? { id: "profiles", pts: 35, max: 70, mark: "warn", text: `Nur ein Profil gefunden: ${names}` } : { id: "profiles", pts: 5, max: 70, mark: "bad", text: "Keine Social-Media-Profile gefunden" });
  if (n && site?.ok) {
    const linked = found.filter((s) => site.social[s.key]).length;
    items.push(linked === n ? { id: "linked", pts: 15, max: 15, mark: "ok", text: "Profile sind auf der Website verlinkt" } : { id: "linked", pts: 5, max: 15, mark: "warn", text: "Nicht alle Profile sind auf der Website verlinkt" });
  }
  return items;
}
var RECS = {
  noprofile: ["Google-Unternehmensprofil anlegen", "Ohne Profil erscheinen Sie weder bei Google Maps noch in lokalen Suchen. Wir richten es schl\xFCsselfertig ein."],
  reviews: ["Mehr Bewertungen sammeln", "Ein fester Ablauf, um nach jedem Auftrag um eine Bewertung zu bitten \u2014 per Link oder QR-Code."],
  fresh: ["Bewertungen regelm\xE4\xDFig halten", "Neue Bewertungen jeden Monat zeigen Google und Kunden, dass Sie aktiv sind."],
  rating: ["Bewertung verbessern", "Auf jede Bewertung antworten, Kritik ernst nehmen und zufriedene Kunden aktiv um Feedback bitten."],
  rank: ["In den Top 3 bei Google Maps landen", "Profil vollst\xE4ndig ausf\xFCllen, Leistungen und Kategorien erg\xE4nzen, regelm\xE4\xDFig Fotos und Beitr\xE4ge."],
  photos: ["Echte Fotos ins Profil", "Team, Fahrzeuge, Werkstatt und Projekte \u2014 mindestens 10 aktuelle Fotos."],
  hours: ["\xD6ffnungszeiten eintragen", "Ohne \xD6ffnungszeiten zeigt Google Ihr Profil seltener und Kunden rufen woanders an."],
  website: ["Website mit dem Profil verkn\xFCpfen", "Der Link im Google-Profil bringt Besucher und st\xE4rkt die lokale Sichtbarkeit."],
  nosite: ["Eine eigene Website", "Eine klare Seite mit Leistungen, Region und Kontakt \u2014 Grundlage f\xFCr Google Search und KI-Antworten."],
  down: ["Website wieder erreichbar machen", "Eine nicht erreichbare Website kostet Anfragen und Vertrauen bei Google."],
  https: ["HTTPS aktivieren", "Ohne sichere Verbindung warnen Browser Ihre Besucher."],
  mobile: ["Website f\xFCr Smartphones", "Die meisten lokalen Suchen kommen vom Handy."],
  title: ["Leistung und Ort in den Seitentitel", "So erscheinen Sie bei Suchen wie \xABLeistung + Ort\xBB."],
  schema: ["Unternehmensdaten auszeichnen", "Strukturierte Daten helfen Google und KI-Assistenten, Sie richtig einzuordnen."],
  profiles: ["Social-Media-Profil aufbauen", "Ein aktives Profil mit echten Projekten und Menschen schafft Vertrauen."],
  noindex: ["Sperre f\xFCr Google entfernen", "Die Startseite ist f\xFCr Google gesperrt \u2014 sie kann so nicht gefunden werden."],
  impressum: ["Impressum erg\xE4nzen", "Ein fehlendes Impressum ist abmahnf\xE4hig und kostet Vertrauen bei Kunden und Google."],
  datenschutz: ["Datenschutzerkl\xE4rung erg\xE4nzen", "Pflicht nach DSGVO \u2014 sonst drohen Abmahnungen."],
  nap: ["Unternehmensdaten vereinheitlichen", "Name, Adresse und Telefon \xFCberall gleich \u2014 auf Website, Google und in Verzeichnissen."],
  pages: ["Eine Seite pro Leistung", "Eigene Seiten je Leistung und Ort bringen Anfragen genau zu dem, was Sie anbieten."],
  pagespeed: ["Website schneller machen", "Auf dem Smartphone z\xE4hlt jede Sekunde \u2014 langsame Seiten verlieren Anfragen."],
  ai_faq: ["Antworten auf Kundenfragen", "Kurze Antworten auf typische Fragen helfen Kunden, Google und KI-Assistenten."]
};
var PRIO = ["Hohe Priorit\xE4t", "Mittlere Priorit\xE4t", "Wachstumspotenzial"];
var REC_ORDER = ["noprofile", "nosite", "down", "noindex", "impressum", "datenschutz", "website", "reviews", "rating", "rank", "nap", "hours", "pages", "fresh", "photos", "https", "mobile", "pagespeed", "title", "schema", "ai_faq", "profiles"];
function buildReport(input) {
  const blocked = siteBlocked(input.site);
  const maps = mapsItems(input), search = blocked ? [] : searchItems(input), social = socialItems(input), ai = aiItems(input);
  if (!input.noProfile) (input.ranks ?? []).forEach((r, i) => {
    const q = `\xAB${r.query}\xBB`, id = `rank${i + 2}`;
    maps.push(r.rank && r.rank <= 3 ? { id, pts: 10, max: 10, mark: "ok", text: `Bei ${q} unter den ersten 3 (Platz ${r.rank})` } : r.rank && r.rank <= 10 ? { id, pts: 5, max: 10, mark: "warn", text: `Bei ${q} auf Platz ${r.rank}` } : { id, pts: 0, max: 10, mark: "bad", text: r.rank ? `Bei ${q} erst auf Platz ${r.rank}` : `Bei ${q} nicht unter den ersten ${r.total} Treffern` });
  });
  const sMaps = score(maps), sSearch = score(search), sSocial = score(social);
  const open = new Set([...maps, ...search, ...social, ...ai].filter((i) => i.mark !== "ok").map((i) => i.id));
  const recommendations = REC_ORDER.filter((id) => open.has(id)).slice(0, 3).map((id, n) => [PRIO[n], RECS[id][0], RECS[id][1]]);
  const channels = {
    maps: { score: sMaps, points: points(maps), summary: input.noProfile ? "Ihr Unternehmen hat kein Google-Profil \u2014 hier verlieren Sie die meisten Anfragen." : summary(
      sMaps,
      "Das Google-Profil ist stark und gepflegt.",
      "Das Profil ist eine gute Basis, hat aber einige offensichtliche L\xFCcken.",
      "Das Profil hat deutliche L\xFCcken \u2014 hier verlieren Sie die meisten Anfragen."
    ) },
    // Bei Bot-Schutz bleibt «Website & Google Search» leer — das Team prüft von Hand.
    search: blocked ? void 0 : { score: sSearch, points: points(search), summary: summary(
      sSearch,
      "Die Website ist technisch solide aufgestellt.",
      "Die Website funktioniert, verschenkt aber Sichtbarkeit bei Google.",
      "Die Website hilft bei Google und in der KI-Suche kaum weiter."
    ) },
    social: { score: sSocial, points: points(social), summary: summary(
      sSocial,
      "Die wichtigsten Profile sind vorhanden.",
      "Es gibt Profile, aber noch L\xFCcken.",
      "In Social Media sind Sie kaum zu finden."
    ) }
    // ai (KI-Suche) ergänzt das Team.
  };
  if (!channels.search) delete channels.search;
  return { channels, recommendations, version: 2, items: { ai, maps, search, social } };
}

// supabase/functions/prospects/index.ts
var SERVER_KEY = Deno.env.get("SB_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
var db = createClient(Deno.env.get("SUPABASE_URL"), SERVER_KEY, { auth: { persistSession: false } });
async function pageSpeed(url) {
  const base = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&url=${encodeURIComponent(url)}`;
  const keys = [Deno.env.get("PAGESPEED_KEY"), Deno.env.get("GOOGLE_PLACES_KEY"), void 0];
  let last = "";
  for (const k of [...new Set(keys)]) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4e4);
    try {
      const res = await fetch(base + (k ? `&key=${k}` : ""), { signal: ctrl.signal, headers: { Referer: Deno.env.get("PLACES_REFERER") ?? "https://rag-theta-one.vercel.app/" } });
      const data = await res.json().catch(() => ({}));
      const v = data?.lighthouseResult?.categories?.performance?.score;
      if (res.ok && typeof v === "number") return { score: Math.round(v * 100) };
      last = data?.error?.message ?? `HTTP ${res.status}`;
    } catch (e) {
      last = e instanceof Error ? e.message : String(e);
    } finally {
      clearTimeout(t);
    }
  }
  return { score: null, error: last.slice(0, 200) };
}
function parseCsv(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  const sep = (text.split("\n")[0].match(/;/g)?.length ?? 0) > (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cur += ch;
  }
  row.push(cur);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}
var ALIASES = {
  name: ["firma", "unternehmen", "name", "company", "\u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F", "\u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435"],
  category: ["branche", "kategorie", "category", "\u0441\u0444\u0435\u0440\u0430", "\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F", "\u0432\u0438\u0434 \u0431\u0438\u0437\u043D\u0435\u0441\u0430"],
  city: ["stadt", "ort", "city", "\u0433\u043E\u0440\u043E\u0434"],
  address: ["adresse", "anschrift", "address", "\u0430\u0434\u0440\u0435\u0441"],
  phone: ["telefon", "phone", "tel", "\u0442\u0435\u043B\u0435\u0444\u043E\u043D"],
  website: ["website", "webseite", "site", "url", "\u0441\u0430\u0439\u0442"],
  maps_url: ["google maps", "maps", "maps link", "google maps link", "karte", "\u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 google maps", "\u0441\u0441\u044B\u043B\u043A\u0430 google maps", "\u043A\u0430\u0440\u0442\u0430"],
  query: ["suchbegriff", "query", "keyword", "\u0437\u0430\u043F\u0440\u043E\u0441", "\u043F\u043E\u0438\u0441\u043A\u043E\u0432\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441", "\u0437\u0430\u043F\u0440\u043E\u0441, \u043F\u043E \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u0438\u0449\u0443\u0442 \u0442\u0430\u043A\u0438\u0435 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438"]
};
var norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
var domain = (u) => u.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
function rowsToProspects(rows) {
  if (rows.length < 2) return [];
  const head = rows[0].map(norm);
  const col = {};
  for (const [field, names] of Object.entries(ALIASES)) {
    const i = head.findIndex((h) => names.includes(h) || names.some((n) => h.startsWith(n)));
    if (i >= 0) col[field] = i;
  }
  if (col.name === void 0) throw Object.assign(new Error("no_name_column"), { status: 400 });
  const used = new Set(Object.values(col));
  return rows.slice(1).map((r) => {
    const g = (f) => col[f] !== void 0 ? (r[col[f]] ?? "").trim() : "";
    const extra = {};
    r.forEach((v, i) => {
      if (!used.has(i) && rows[0][i] && v.trim()) extra[rows[0][i].trim()] = v.trim();
    });
    const p = {
      name: g("name"),
      category: g("category") || null,
      city: g("city") || null,
      address: g("address") || null,
      phone: g("phone") || null,
      website: g("website") || null,
      maps_url: g("maps_url") || null,
      query: g("query") || null,
      extra
    };
    const dedup_key = p.website ? `web:${domain(p.website)}` : p.maps_url ? `maps:${p.maps_url.trim()}` : `name:${norm(p.name)}|${norm(p.city ?? p.address ?? "")}`;
    return { ...p, dedup_key };
  }).filter((p) => p.name);
}
var ORDER = { bad: 0, warn: 1, ok: 2 };
async function audit(id) {
  const { data: p, error } = await db.from("prospects").select("*").eq("id", id).maybeSingle();
  if (error || !p) throw Object.assign(new Error("not_found"), { status: 404 });
  await db.from("prospects").update({ status: "checking", error: null }).eq("id", id);
  try {
    const key = placesKey();
    let placeId = p.place_id;
    if (!placeId) {
      const hits2 = await searchPlaces(key, [p.name, p.address || p.city].filter(Boolean).join(" "));
      placeId = hits2[0]?.id ?? null;
    }
    if (placeId) {
      const { data: chk } = await db.from("checks").select("id").eq("place_id", placeId).order("created_at", { ascending: true }).limit(1);
      if (chk?.length) {
        await db.from("prospects").update({ status: "responded", place_id: placeId, check_id: chk[0].id, responded_at: (/* @__PURE__ */ new Date()).toISOString(), error: "already_client" }).eq("id", id);
        return { status: "already_client" };
      }
      const { data: dup } = await db.from("prospects").select("id").eq("place_id", placeId).neq("id", id).limit(1);
      if (dup?.length) {
        await db.from("prospects").update({ status: "hidden", error: "duplicate", place_id: null }).eq("id", id);
        return { status: "duplicate" };
      }
    }
    const noProfile = !placeId;
    const place = placeId ? await placeRaw(key, placeId, true) : {
      id: `manual:${id}`,
      displayName: { text: p.name },
      primaryTypeDisplayName: { text: p.category ?? "" },
      addressComponents: p.city ? [{ longText: p.city, shortText: p.city, types: ["locality"] }] : [],
      websiteUri: p.website ? /^https?:\/\//.test(p.website) ? p.website : `https://${p.website}` : void 0
    };
    const website = place.websiteUri || (p.website ? /^https?:\/\//.test(p.website) ? p.website : `https://${p.website}` : null);
    const query = (p.query ?? "").trim() || defaultQuery(place);
    const canSearch = !noProfile;
    const [comp, site, speed] = await Promise.all([
      canSearch && query ? competitors(key, place, query).catch((e) => {
        console.error("competitors", e);
        return null;
      }) : Promise.resolve(null),
      website ? scanSite(website, 6e3, true).catch(() => null) : Promise.resolve(null),
      website ? pageSpeed(website) : Promise.resolve(null)
    ]);
    const sources = sourcesFrom(website, site);
    const report = buildReport({ place, competitors: comp, site, sources, noProfile, pagespeed: speed, ranks: [] });
    if (site) delete site.hay;
    const scores = Object.values(report.channels).map((c) => c?.score).filter((x) => typeof x === "number");
    const all = Object.values(report.items ?? {}).flat();
    const issues = all.filter((i) => i.mark !== "ok").sort((a, b) => ORDER[a.mark] - ORDER[b.mark] || b.max - a.max).slice(0, 5).map((i) => ({ mark: i.mark, text: i.text }));
    const comps = (t) => place.addressComponents?.find((c) => c.types.includes(t))?.longText;
    await db.from("prospects").update({
      status: "checked",
      error: null,
      place_id: placeId,
      audited_at: (/* @__PURE__ */ new Date()).toISOString(),
      audit: { place, competitors: comp, site, pagespeed: speed, keywords: [query], sources, collected_at: (/* @__PURE__ */ new Date()).toISOString() },
      report_draft: report,
      issues,
      score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      category: p.category || place.primaryTypeDisplayName?.text || null,
      city: p.city || comps("locality") || comps("postal_town") || null,
      address: place.formattedAddress || p.address,
      phone: p.phone || place.nationalPhoneNumber || null,
      website: p.website || website,
      maps_url: place.googleMapsUri || p.maps_url,
      query
    }).eq("id", id);
    return { status: "checked" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.from("prospects").update({ status: "error", error: msg.slice(0, 300) }).eq("id", id);
    return { status: "error", error: msg };
  }
}
Deno.serve(handler(120, async (req, body) => {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth } = await db.auth.getUser(token);
  if (!auth?.user) return json(req, { error: "auth" }, 401);
  const { data: prof } = await db.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
  if (prof?.role !== "admin" && prof?.role !== "manager") return json(req, { error: "forbidden" }, 403);
  if (body.action === "audit") return json(req, await audit(String(body.id ?? "")));
  if (body.action === "import") {
    let text = typeof body.csv === "string" ? body.csv : "";
    if (!text) {
      const url = String(body.csvUrl ?? "");
      if (!/^https:\/\/docs\.google\.com\/spreadsheets\//.test(url)) return json(req, { error: "bad_url" }, 400);
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) return json(req, { error: "fetch", detail: `HTTP ${res.status}` }, 502);
      text = await res.text();
      if (/^\s*<!doctype html|<html/i.test(text)) return json(req, { error: "not_csv" }, 400);
    }
    const items = rowsToProspects(parseCsv(text.replace(/^﻿/, "")));
    const unique = [...new Map(items.map((i) => [i.dedup_key, i])).values()];
    if (!unique.length) return json(req, { added: 0, total: 0 });
    const { data, error } = await db.from("prospects").upsert(unique, { onConflict: "dedup_key", ignoreDuplicates: true }).select("id");
    if (error) return json(req, { error: "db", detail: error.message }, 500);
    return json(req, { added: data?.length ?? 0, total: unique.length });
  }
  return json(req, { error: "action" }, 400);
}));
