import { VOICE_CARDS } from "../domain/cards/card-catalog.js";
import {
  PORTRAIT_AXES,
  createAxis,
} from "../domain/voice-portrait/portrait-axes.js";
import { DEFAULT_LOCALE, LANG_PARAM, getLocale } from "../i18n/i18n.js";

// Share URLs carry only the card id and the six axis scores (0-100, in
// PORTRAIT_AXES order) - no audio or voice-recoverable data, honoring the
// "recordings never leave the device" boundary.
const CARD_PARAM = "card";
const AXES_PARAM = "axes";

export function encodeShareParams(analysis) {
  const params = new URLSearchParams();
  params.set(CARD_PARAM, analysis.card.id);
  params.set(
    AXES_PARAM,
    PORTRAIT_AXES.map((definition) => {
      const axis = analysis.portrait.axes.find(({ id }) => id === definition.id);
      return clampScore(axis?.score);
    }).join("-"),
  );
  return params;
}

// Outbound shares point at each card's static share page: social crawlers can
// read card-specific OG tags, and human visitors are redirected back into the
// app with the six-axis result restored.
export function createShareUrl(analysis, location = globalThis.location) {
  if (!location?.href) return "";
  // The English UI links to the English share page (share/en/<id>/) so the social preview copy matches.
  const localePrefix = getLocale() === "en" ? "en/" : "";
  const url = new URL(
    `share/${localePrefix}${analysis.card.id}/`,
    new URL(".", stripParams(location.href)),
  );
  url.searchParams.set(AXES_PARAM, encodeShareParams(analysis).get(AXES_PARAM));
  if (getLocale() !== DEFAULT_LOCALE) url.searchParams.set(LANG_PARAM, getLocale());
  return url.toString();
}

// Address-bar restore uses the root path plus params: refreshes and bookmarks return to the same result.
export function createRestoreUrl(analysis, location = globalThis.location) {
  if (!location?.href) return "";
  const url = new URL(stripParams(location.href));
  for (const [key, value] of encodeShareParams(analysis)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function parseSharedResult(search = globalThis.location?.search) {
  if (!search) return null;
  const params = new URLSearchParams(search);
  const card = VOICE_CARDS.find(({ id }) => id === params.get(CARD_PARAM));
  if (!card) return null;

  const axesParam = params.get(AXES_PARAM);
  if (!axesParam) {
    // Links without scores (e.g. a short URL typed from the image) fall back to the card's archetype axes.
    const axes = PORTRAIT_AXES.map((definition, index) =>
      createAxis(definition, card.vector[index]),
    );
    return { card, portrait: { axes } };
  }

  const scores = axesParam.split("-");
  if (scores.length !== PORTRAIT_AXES.length) return null;
  const axes = [];
  for (const [index, definition] of PORTRAIT_AXES.entries()) {
    const score = Number(scores[index]);
    if (!Number.isInteger(score) || score < 0 || score > 100) return null;
    axes.push(createAxis(definition, score / 100));
  }

  return { card, portrait: { axes } };
}

export function writeShareUrlToHistory(
  analysis,
  location = globalThis.location,
  history = globalThis.history,
) {
  const url = createRestoreUrl(analysis, location);
  if (!url || typeof history?.replaceState !== "function") return;
  history.replaceState(null, "", url);
}

export function clearShareUrlFromHistory(
  location = globalThis.location,
  history = globalThis.history,
) {
  if (!location?.href || typeof history?.replaceState !== "function") return;
  const url = new URL(location.href);
  if (!url.searchParams.has(CARD_PARAM) && !url.searchParams.has(AXES_PARAM)) {
    return;
  }
  url.searchParams.delete(CARD_PARAM);
  url.searchParams.delete(AXES_PARAM);
  history.replaceState(null, "", url.toString());
}

function stripParams(href) {
  const url = new URL(href);
  const lang = url.searchParams.get(LANG_PARAM);
  url.search = "";
  url.hash = "";
  // The locale persists via URL param only (no localStorage); keep it when clearing result params.
  if (lang) url.searchParams.set(LANG_PARAM, lang);
  return url.toString();
}

function clampScore(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, Math.min(100, value)));
}
