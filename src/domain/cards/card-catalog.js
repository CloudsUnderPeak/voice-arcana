// Card identity and matching data. Copy such as name/tagline/reading/question
// lives in src/i18n/locales/* and is merged at the UI edge via localizeCard();
// the domain layer holds no UI copy.
export const VOICE_CARDS = Object.freeze([
  {
    id: "blank-keeper",
    number: "I",
    accent: "#c99591",
    vector: [0.18, 0.1, 0.12, 0.16, 0.1, 0.08],
    symbol: "pause",
  },
  {
    id: "fire-starter",
    number: "II",
    accent: "#ed8e72",
    vector: [0.8, 0.5, 0.68, 0.62, 0.18, 0.82],
    symbol: "spark",
  },
  {
    id: "listener",
    number: "III",
    accent: "#c7a6b8",
    vector: [0.38, 0.18, 0.26, 0.1, 0.18, 0.28],
    symbol: "ear",
  },
  {
    id: "traveler",
    number: "IV",
    accent: "#d7a17f",
    vector: [0.6, 0.42, 0.8, 0.78, 0.15, 0.68],
    symbol: "compass",
  },
  {
    id: "dream-builder",
    number: "V",
    accent: "#b88cae",
    vector: [0.74, 0.28, 0.48, 0.68, 0.1, 0.46],
    symbol: "arch",
  },
  {
    id: "night-keeper",
    number: "VI",
    accent: "#d69a81",
    vector: [0.25, 0.3, 0.1, 0.28, 0.48, 0.28],
    symbol: "moon",
  },
  {
    id: "echo-bearer",
    number: "VII",
    accent: "#a985a8",
    vector: [0.5, 0.45, 0.6, 0.75, 0.5, 0.6],
    symbol: "echo",
  },
  {
    id: "wave-breaker",
    number: "VIII",
    accent: "#e08073",
    vector: [0.7, 0.9, 0.6, 0.7, 0.85, 0.75],
    symbol: "wave",
  },
]);
