import test from "node:test";
import assert from "node:assert/strict";
import { VOICE_CARDS } from "../src/domain/cards/card-catalog.js";
import { euclideanDistance, selectVoiceCard } from "../src/domain/cards/select-voice-card.js";

test("card catalog contains eight unique voice cards", () => {
  assert.equal(VOICE_CARDS.length, 8);
  assert.equal(new Set(VOICE_CARDS.map((card) => card.id)).size, 8);
  for (const card of VOICE_CARDS) {
    assert.equal(card.vector.length, 6);
    assert.ok(card.vector.every((value) => value >= 0 && value <= 1));
  }
});

test("selectVoiceCard returns the exact matching prototype", () => {
  const expected = VOICE_CARDS.find((card) => card.id === "night-keeper");
  const portrait = {
    axes: expected.vector.map((value) => ({ value })),
  };
  const selected = selectVoiceCard(portrait);
  assert.equal(selected.id, expected.id);
  assert.equal(selected.affinity, 100);
});

test("euclideanDistance is symmetric", () => {
  const left = [0, 0.5, 1];
  const right = [1, 0.25, 0];
  assert.equal(euclideanDistance(left, right), euclideanDistance(right, left));
});

test("voice-card prototypes remain meaningfully separated", () => {
  let minimumDistance = Number.POSITIVE_INFINITY;

  for (let left = 0; left < VOICE_CARDS.length; left += 1) {
    for (let right = left + 1; right < VOICE_CARDS.length; right += 1) {
      minimumDistance = Math.min(
        minimumDistance,
        euclideanDistance(VOICE_CARDS[left].vector, VOICE_CARDS[right].vector),
      );
    }
  }

  assert.ok(minimumDistance >= 0.3);
});
