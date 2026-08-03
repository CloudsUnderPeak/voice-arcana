import test from "node:test";
import assert from "node:assert/strict";
import { VOICE_CARDS } from "../src/domain/cards/card-catalog.js";
import { renderSharePage } from "../tools/share-pages.js";

const card = VOICE_CARDS.find(({ id }) => id === "fire-starter");

test("built share pages use the stable card asset path", () => {
  const html = renderSharePage(card);

  assert.match(html, /\.\.\/\.\.\/assets\/art\/cards\/card-fire-starter\.webp/);
});

test("development share pages resolve artwork directly from src", () => {
  const html = renderSharePage(card, "", undefined, {
    cardAssetRoot: "src/assets/art/cards",
  });

  assert.match(html, /\.\.\/\.\.\/src\/assets\/art\/cards\/card-fire-starter\.webp/);
});

test("deployed share pages use the configured absolute site URL", () => {
  const html = renderSharePage(card, "https://example.test/voice-arcana/");

  assert.match(
    html,
    /https:\/\/example\.test\/voice-arcana\/assets\/art\/cards\/card-fire-starter\.webp/,
  );
});
