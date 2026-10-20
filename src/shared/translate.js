/**
 * Port từ translate-english-practice/background.js
 * (Google → MyMemory → Lingva + cache bộ nhớ)
 */

const CACHE_MAX = 300;
const cache = new Map();

function cacheKey(sl, tl, text) {
  return `${sl}\u0001${tl}\u0001${text}`;
}

function getCached(sl, tl, text) {
  return cache.get(cacheKey(sl, tl, text)) || null;
}

function putCache(sl, tl, text, translated, detected) {
  cache.set(cacheKey(sl, tl, text), {
    translated,
    detected: detected || sl,
    at: Date.now(),
  });
  if (cache.size > CACHE_MAX) {
    const entries = [...cache.entries()].sort(
      (a, b) => (a[1].at || 0) - (b[1].at || 0)
    );
    const drop = entries.slice(0, cache.size - CACHE_MAX);
    drop.forEach(([k]) => cache.delete(k));
  }
}

function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLang(code) {
  if (code === "zh-CN") return "zh";
  return code;
}

async function viaGoogle(q, sl, tl) {
  const url =
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(q)}`;

  const res = await fetch(url);
  if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };

  const data = await res.json();
  const translated = Array.isArray(data?.[0])
    ? data[0].map((part) => part?.[0] || "").join("")
    : "";
  if (!translated) return { ok: false, detail: "empty result" };

  return { ok: true, translated, detected: data?.[2] || sl, provider: "google" };
}

async function viaMyMemory(q, sl, tl) {
  const source = sl === "auto" ? "Autodetect" : normalizeLang(sl);
  const target = normalizeLang(tl);
  const url =
    "https://api.mymemory.translated.net/get" +
    `?q=${encodeURIComponent(q.slice(0, 500))}&langpair=${encodeURIComponent(`${source}|${target}`)}`;

  const res = await fetch(url);
  if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };

  const data = await res.json();
  const translated = data?.responseData?.translatedText || "";
  const status = Number(data?.responseStatus);

  if (!translated || status !== 200) {
    return {
      ok: false,
      detail:
        data?.responseDetails ||
        data?.responseData?.translatedText ||
        `status ${status}`,
    };
  }

  if (/^INVALID|QUERY LENGTH|MYMEMORY WARNING/i.test(translated)) {
    return { ok: false, detail: translated };
  }

  return {
    ok: true,
    translated,
    detected: data?.responseData?.detectedLanguage || sl,
    provider: "mymemory",
  };
}

async function viaLingva(q, sl, tl) {
  const source = sl === "auto" ? "auto" : normalizeLang(sl);
  const target = normalizeLang(tl);
  const url = `https://lingva.ml/api/v1/${encodeURIComponent(source)}/${encodeURIComponent(target)}/${encodeURIComponent(q)}`;

  const res = await fetch(url);
  if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };

  const data = await res.json();
  const translated = data?.translation || "";
  if (!translated) return { ok: false, detail: "empty result" };

  return {
    ok: true,
    translated,
    detected: data?.info?.detectedSource || sl,
    provider: "lingva",
  };
}

async function translate(text, sourceLang, targetLang) {
  const q = String(text || "").trim();
  if (!q) return { ok: false, error: "empty", detail: "Empty text" };

  const sl = sourceLang || "auto";
  const tl = targetLang || "vi";

  const cached = getCached(sl, tl, q);
  if (cached?.translated) {
    return {
      ok: true,
      translated: cached.translated,
      detected: cached.detected || sl,
      provider: "cache",
    };
  }

  const errors = [];
  const providers = [viaGoogle, viaMyMemory, viaLingva];

  for (const provider of providers) {
    try {
      const result = await provider(q, sl, tl);
      if (result?.ok && result.translated) {
        putCache(sl, tl, q, result.translated, result.detected);
        return result;
      }
      if (result?.detail) errors.push(`${provider.name}: ${result.detail}`);
    } catch (err) {
      errors.push(`${provider.name}: ${err?.message || err}`);
    }
  }

  return {
    ok: false,
    error: "http",
    detail: stripHtml(errors.join(" | ")) || "All providers failed",
  };
}

module.exports = { translate };
