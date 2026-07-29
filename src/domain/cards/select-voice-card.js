import { VOICE_CARDS } from "./card-catalog.js";

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
    affinity: Math.round(Math.max(0, 1 - bestDistance / Math.sqrt(vector.length)) * 100),
  };
}

export function euclideanDistance(left, right) {
  return Math.sqrt(
    left.reduce((total, value, index) => total + (value - right[index]) ** 2, 0),
  );
}

