import test from "node:test";
import assert from "node:assert/strict";
import { detectLocale, localizeCard, t, LOCALES } from "../src/i18n/i18n.js";
import { ZH_HANT } from "../src/i18n/locales/zh-hant.js";
import { EN } from "../src/i18n/locales/en.js";
import { VOICE_CARDS } from "../src/domain/cards/card-catalog.js";

test("both locale dictionaries expose the same key tree", () => {
  assert.deepEqual(collectKeys(ZH_HANT), collectKeys(EN));
});

test("every card and axis has copy in every locale", () => {
  for (const dictionary of Object.values(LOCALES)) {
    for (const card of VOICE_CARDS) {
      const copy = dictionary.cards[card.id];
      assert.ok(copy, `missing card copy: ${card.id}`);
      for (const field of ["name", "tagline", "reading", "question", "profile", "artAlt"]) {
        assert.equal(typeof copy[field], "string");
        assert.ok(copy[field].length > 0);
      }
    }
    for (const axis of ["brightness", "sharpness", "bounce", "openness", "raspiness", "energy"]) {
      assert.ok(dictionary.axes[axis]?.low);
      assert.ok(dictionary.axes[axis]?.high);
    }
  }
});

test("t interpolates parameters and falls back to the key when missing", () => {
  assert.match(t("errors.tooShort", { seconds: 2 }), /2/);
  assert.equal(t("not.a.real.key"), "not.a.real.key");
  assert.ok(Array.isArray(t("reading.paragraphs")));
});

test("detectLocale prefers the URL parameter, then browser language", () => {
  assert.equal(detectLocale("?lang=en", "zh-TW"), "en");
  assert.equal(detectLocale("?lang=zh-Hant", "en-US"), "zh-Hant");
  assert.equal(detectLocale("", "en-US"), "en");
  assert.equal(detectLocale("", "ja-JP"), "en");
  assert.equal(detectLocale("", "zh-TW"), "zh-Hant");
  assert.equal(detectLocale(undefined, undefined), "zh-Hant");
});

test("localizeCard merges locale copy onto domain card data", () => {
  const card = VOICE_CARDS.find(({ id }) => id === "night-keeper");
  const localized = localizeCard(card);
  assert.equal(localized.id, "night-keeper");
  assert.deepEqual(localized.vector, card.vector);
  assert.ok(localized.name.length > 0);
  assert.ok(localized.question.length > 0);
});

function collectKeys(node, prefix = "") {
  if (Array.isArray(node) || typeof node !== "object" || node === null) return [prefix];
  return Object.keys(node)
    .sort()
    .flatMap((key) => collectKeys(node[key], prefix ? `${prefix}.${key}` : key));
}
