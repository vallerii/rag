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

// supabase/functions/places-search/index.ts
Deno.serve(handler(20, async (req, body) => {
  const query = String(body.query ?? body.input ?? "").trim().slice(0, 120);
  if (query.length < 2) return json(req, []);
  return json(req, await searchPlaces(placesKey(), query));
}, { human: true }));
