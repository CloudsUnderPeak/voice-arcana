import { VOICE_CARDS } from "./card-catalog.js";

// Affinity is normalized by the catalog's actual diameter (the distance between
// the two farthest archetypes) rather than the unit-cube diagonal sqrt(6), which
// squeezed every result into the high-score band and lost discrimination.
const CATALOG_DIAMETER = VOICE_CARDS.reduce((maximum, left, index) => {
  for (const right of VOICE_CARDS.slice(index + 1)) {
    maximum = Math.max(maximum, euclideanDistance(left.vector, right.vector));
  }
  return maximum;
}, 0);

export function selectVoiceCard(portrait) {
  const vector = portrait.axes.map((axis) => axis.value);
  let bestCard = VOICE_CARDS[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const card of VOICE_CARDS) {
    const distance = euclideanDistance(vector, card.vector);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCard = card;
    }
  }

  return {
    ...bestCard,
    affinity: Math.round(
      Math.max(0, Math.min(1, 1 - bestDistance / CATALOG_DIAMETER)) * 100,
    ),
  };
}

export function euclideanDistance(left, right) {
  return Math.sqrt(
    left.reduce((total, value, index) => total + (value - right[index]) ** 2, 0),
  );
}

