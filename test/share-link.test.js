import test from "node:test";
import assert from "node:assert/strict";
import {
  clearShareUrlFromHistory,
  createRestoreUrl,
  createShareUrl,
  encodeShareParams,
  parseSharedResult,
  writeShareUrlToHistory,
} from "../src/app/share-link.js";
import { PORTRAIT_AXES } from "../src/domain/voice-portrait/portrait-axes.js";
import { VOICE_CARDS } from "../src/domain/cards/card-catalog.js";

const SAMPLE_SCORES = [62, 38, 51, 40, 22, 45];

function sampleAnalysis() {
  return {
    card: VOICE_CARDS.find(({ id }) => id === "night-keeper"),
    portrait: {
      axes: PORTRAIT_AXES.map((definition, index) => ({
        ...definition,
        score: SAMPLE_SCORES[index],
        value: SAMPLE_SCORES[index] / 100,
      })),
    },
  };
}

test("share params encode the card and axis scores in canonical order", () => {
  const params = encodeShareParams(sampleAnalysis());
  assert.equal(params.get("card"), "night-keeper");
  assert.equal(params.get("axes"), SAMPLE_SCORES.join("-"));
});

test("a shared result URL round-trips back to the same card and scores", () => {
  const restoreUrl = createRestoreUrl(sampleAnalysis(), {
    href: "https://example.github.io/voice-arcana/",
  });
  const shared = parseSharedResult(new URL(restoreUrl).search);

  assert.equal(shared.card.id, "night-keeper");
  assert.deepEqual(
    shared.portrait.axes.map(({ score }) => score),
    SAMPLE_SCORES,
  );
  // Axis objects carry only id/value/score; display labels are resolved by i18n per locale.
  assert.equal(shared.portrait.axes[0].id, "brightness");
});

test("the outgoing share URL targets the card's static share page", () => {
  const url = createShareUrl(sampleAnalysis(), {
    href: "https://example.github.io/voice-arcana/index.html?card=old#x",
  });
  assert.equal(
    url,
    `https://example.github.io/voice-arcana/share/night-keeper/?axes=${SAMPLE_SCORES.join("-")}`,
  );
});

test("share links without axes fall back to the card's archetype axes", () => {
  const shared = parseSharedResult("?card=fire-starter");
  const card = VOICE_CARDS.find(({ id }) => id === "fire-starter");
  assert.equal(shared.card.id, "fire-starter");
  assert.deepEqual(
    shared.portrait.axes.map(({ score }) => score),
    card.vector.map((value) => Math.round(value * 100)),
  );
});

test("unknown cards and malformed axes are rejected", () => {
  assert.equal(parseSharedResult("?card=not-a-card&axes=1-2-3-4-5-6"), null);
  assert.equal(parseSharedResult("?card=listener&axes=1-2-3"), null);
  assert.equal(parseSharedResult("?card=listener&axes=1-2-3-4-5-abc"), null);
  assert.equal(parseSharedResult("?card=listener&axes=1-2-3-4-5-999"), null);
  assert.equal(parseSharedResult(""), null);
});

test("history helpers write and clear the result parameters", () => {
  const writes = [];
  const history = {
    replaceState(_state, _title, url) {
      writes.push(url);
    },
  };

  writeShareUrlToHistory(
    sampleAnalysis(),
    { href: "https://example.test/app/" },
    history,
  );
  assert.match(writes[0], /card=night-keeper/);
  assert.match(writes[0], /axes=62-38-51-40-22-45/);

  clearShareUrlFromHistory({ href: writes[0] }, history);
  assert.equal(new URL(writes[1]).search, "");

  // Without result params the URL must not be rewritten again.
  clearShareUrlFromHistory({ href: "https://example.test/app/" }, history);
  assert.equal(writes.length, 2);
});

test("history helpers are inert without browser location or history", () => {
  assert.doesNotThrow(() => {
    writeShareUrlToHistory(sampleAnalysis(), undefined, undefined);
    clearShareUrlFromHistory(undefined, undefined);
  });
  assert.equal(createShareUrl(sampleAnalysis(), undefined), "");
});
