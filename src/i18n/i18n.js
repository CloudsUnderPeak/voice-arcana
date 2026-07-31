import { ZH_HANT } from "./locales/zh-hant.js";
import { EN } from "./locales/en.js";

// The locale lives only in memory and the ?lang= URL param - no localStorage,
// honoring the memory-only storage constraint; share links carry the language naturally.
export const LOCALES = Object.freeze({ "zh-Hant": ZH_HANT, en: EN });
export const DEFAULT_LOCALE = "zh-Hant";
export const LANG_PARAM = "lang";

let currentLocale = DEFAULT_LOCALE;
const listeners = new Set();

export function detectLocale(
  search = globalThis.location?.search,
  language = globalThis.navigator?.language,
) {
  const fromUrl = new URLSearchParams(search || "").get(LANG_PARAM);
  if (fromUrl && LOCALES[normalizeLocale(fromUrl)]) return normalizeLocale(fromUrl);
  if (typeof language === "string" && !language.toLowerCase().startsWith("zh")) {
    return "en";
  }
  return DEFAULT_LOCALE;
}

export function initLocale() {
  currentLocale = detectLocale();
  applyToDocument();
  return currentLocale;
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  const normalized = normalizeLocale(locale);
  if (!LOCALES[normalized] || normalized === currentLocale) return;
  currentLocale = normalized;
  writeLocaleToUrl();
  applyToDocument();
  listeners.forEach((listener) => listener(currentLocale));
}

export function onLocaleChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Look up a string: t("errors.tooShort", { seconds: 2 }). Missing keys fall
// back to the default locale, then to the key itself so gaps are visible on screen.
export function t(key, params) {
  const value =
    lookup(LOCALES[currentLocale], key) ?? lookup(LOCALES[DEFAULT_LOCALE], key);
  if (typeof value !== "string") {
    return Array.isArray(value) ? value : key;
  }
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, name) =>
    name in params ? String(params[name]) : match,
  );
}

// Card copy lives in the locale dictionaries while the domain keeps only
// vectors and identity data; merge them into a full card object at the UI edge.
export function localizeCard(card) {
  const copy = lookup(LOCALES[currentLocale], `cards.${card.id}`) ??
    lookup(LOCALES[DEFAULT_LOCALE], `cards.${card.id}`) ?? {};
  return { ...card, ...copy };
}

export function axisLabels(axisId) {
  return {
    low: t(`axes.${axisId}.low`),
    high: t(`axes.${axisId}.high`),
    description: t(`axes.${axisId}.description`),
  };
}

// Update <html lang>, <title>, and the meta description for the current locale.
export function applyToDocument(doc = globalThis.document) {
  if (!doc?.documentElement) return;
  doc.documentElement.lang = t("meta.htmlLang");
  doc.title = t("meta.title");
  doc
    .querySelector?.('meta[name="description"]')
    ?.setAttribute("content", t("meta.description"));
}

function writeLocaleToUrl(
  location = globalThis.location,
  history = globalThis.history,
) {
  if (!location?.href || typeof history?.replaceState !== "function") return;
  const url = new URL(location.href);
  if (currentLocale === DEFAULT_LOCALE) {
    url.searchParams.delete(LANG_PARAM);
  } else {
    url.searchParams.set(LANG_PARAM, currentLocale);
  }
  history.replaceState(null, "", url.toString());
}

function normalizeLocale(locale) {
  if (typeof locale !== "string") return "";
  const lowered = locale.toLowerCase();
  if (lowered.startsWith("zh")) return "zh-Hant";
  if (lowered.startsWith("en")) return "en";
  return locale;
}

function lookup(dictionary, key) {
  return key
    .split(".")
    .reduce((node, part) => (node == null ? node : node[part]), dictionary);
}
