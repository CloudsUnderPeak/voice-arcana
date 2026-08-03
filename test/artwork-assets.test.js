import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { VOICE_CARDS } from "../src/domain/cards/card-catalog.js";
import {
  HERO_CARD_THUMBNAIL_URLS,
  cardArtworkUrl,
} from "../src/ui/artwork-assets.js";

test("every voice card and hero thumbnail resolves to a source asset", async () => {
  const urls = [
    ...VOICE_CARDS.map(({ id }) => cardArtworkUrl(id)),
    ...Object.values(HERO_CARD_THUMBNAIL_URLS),
  ];

  assert.equal(urls.length, 11);
  await Promise.all(urls.map((url) => access(new URL(url))));
});

test("unknown card ids do not construct arbitrary asset paths", () => {
  assert.equal(cardArtworkUrl("../unknown"), "");
});
