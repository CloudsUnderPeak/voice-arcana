// Axis order defines the score sequence in share URLs; reordering would misread old links.
// Axes carry only an id; display labels and descriptions live in
// src/i18n/locales/* (axes.*) and are resolved by the UI via axisLabels() -
// the domain layer holds no UI copy.
export const PORTRAIT_AXES = Object.freeze([
  Object.freeze({ id: "brightness" }),
  Object.freeze({ id: "sharpness" }),
  Object.freeze({ id: "bounce" }),
  Object.freeze({ id: "openness" }),
  Object.freeze({ id: "raspiness" }),
  Object.freeze({ id: "energy" }),
]);

export function createAxis(definition, value) {
  const clamped = Math.max(0, Math.min(1, value));
  return {
    id: definition.id,
    value: Math.round(clamped * 1000) / 1000,
    score: Math.round(clamped * 100),
  };
}
