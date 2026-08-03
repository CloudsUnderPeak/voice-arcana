const CARD_ARTWORK_URLS = Object.freeze({
  "blank-keeper": new URL("../assets/art/cards/card-blank-keeper.webp", import.meta.url).href,
  "fire-starter": new URL("../assets/art/cards/card-fire-starter.webp", import.meta.url).href,
  listener: new URL("../assets/art/cards/card-listener.webp", import.meta.url).href,
  traveler: new URL("../assets/art/cards/card-traveler.webp", import.meta.url).href,
  "dream-builder": new URL("../assets/art/cards/card-dream-builder.webp", import.meta.url).href,
  "night-keeper": new URL("../assets/art/cards/card-night-keeper.webp", import.meta.url).href,
  "echo-bearer": new URL("../assets/art/cards/card-echo-bearer.webp", import.meta.url).href,
  "wave-breaker": new URL("../assets/art/cards/card-wave-breaker.webp", import.meta.url).href,
});

export const HERO_CARD_THUMBNAIL_URLS = Object.freeze({
  listener: new URL("../assets/art/cards/thumbs/card-listener.webp", import.meta.url).href,
  nightKeeper: new URL("../assets/art/cards/thumbs/card-night-keeper.webp", import.meta.url).href,
  waveBreaker: new URL("../assets/art/cards/thumbs/card-wave-breaker.webp", import.meta.url).href,
});

export function cardArtworkUrl(cardId) {
  return CARD_ARTWORK_URLS[cardId] || "";
}
