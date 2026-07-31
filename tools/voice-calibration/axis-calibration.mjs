// Axis calibration bench: synthetic speech with controllable HNR, intonation,
// syllable rhythm, and spectral tilt, verifying axis distributions and card
// reachability. Run: node tools/voice-calibration/axis-calibration.mjs
// Note: the synthesizer's dynamics ceiling (rv/dyn) sits below real read-aloud
// speech; high-dynamics cards such as traveler are verified with real samples
// (see docs/AUDIO_ANALYSIS.md, calibration source 3). This bench guards the
// axes' relative behavior and most cards' reachability, not a hard 8/8 gate.
import { analyzeVoice } from "../../src/domain/voice-portrait/analyze-voice.js";
import { selectVoiceCard } from "../../src/domain/cards/select-voice-card.js";

const SR = 16000;
const DUR = 8;

function makeRng(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x3fffffff - 1);
}

// Speech-like synthesis: stacked harmonics + spectral tilt (dB/oct) + 4Hz
// syllable AM + pauses + intonation + jitter + broadband noise per HNR (dB)
function voice({
  f0 = 150,
  tilt = -9,             // dB/octave; more negative = darker
  formants = [500, 1500],// F1/F2 formants
  hnr = 20,              // dB
  jitter = 0.005,
  intonation = 0.12,     // relative F0 movement
  syllableDepth = 0.5,   // syllable AM depth
  pauseRatio = 0.2,      // pause ratio
  consonant = 0.25,      // consonant noise-burst strength (relative)
  level = 0.12,
  dynamics = 0.3,        // sentence-level loudness swell
  seed = 42,
}) {
  const n = SR * DUR;
  const s = new Float32Array(n);
  const rng = makeRng(seed);
  const harmonics = 24;
  const lorentz = (f, center, bandwidth) => 1 / (1 + ((f - center) / bandwidth) ** 2);
  const amps = [];
  for (let h = 1; h <= harmonics; h += 1) {
    const f = f0 * h;
    const envelope =
      1 + 7 * lorentz(f, formants[0], 130) + 4 * lorentz(f, formants[1], 280) +
      1.2 * lorentz(f, 2900, 500);
    amps.push(Math.pow(10, (tilt * Math.log2(h)) / 20) * envelope);
  }
  let phase = 0;
  let voiceEnergy = 0;
  const pauseSeed = makeRng(seed + 7);
  const segments = [];
  for (let t = 0; t < DUR / 0.4; t += 1) segments.push(Math.abs(pauseSeed()) > pauseRatio);
  const consonantRng = makeRng(seed + 31);
  // Per-syllable random gain: real reading varies syllable loudness enough to
  // land rmsVariation at 0.65-0.9; without it synthetic rv runs less than half.
  const syllableGainRng = makeRng(seed + 13);
  const syllableGains = [];
  for (let index = 0; index < DUR * 4 + 1; index += 1) {
    syllableGains.push(1 + (0.25 + 0.55 * syllableDepth) * syllableGainRng());
  }

  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    if (!segments[Math.floor(t / 0.4) % segments.length]) continue;
    const intonate = 1 + intonation * Math.sin(2 * Math.PI * 0.6 * t) + 0.5 * intonation * Math.sin(2 * Math.PI * 1.7 * t + 1);
    const jf = f0 * intonate * (1 + jitter * rng());
    phase += (2 * Math.PI * jf) / SR;
    let v = 0;
    for (let h = 1; h <= harmonics; h += 1) v += amps[h - 1] * Math.sin(phase * h);
    const syllablePhase = (t * 4 + 0.125) % 1;
    const syllable =
      (1 - syllableDepth * (0.5 + 0.5 * Math.sin(2 * Math.PI * 4 * t + 0.5))) *
      syllableGains[Math.floor(t * 4)];
    const sentence = 1 + dynamics * Math.sin(2 * Math.PI * 0.25 * t);
    let sample = v * level * syllable * sentence * 0.16;
    // First 12% of each syllable is a broadband consonant burst (fricative/plosive)
    if (syllablePhase < 0.12) {
      sample = sample * 0.3 + consonant * level * sentence * consonantRng();
    }
    s[i] = sample;
    voiceEnergy += sample * sample;
  }
  const voiceRms = Math.sqrt(voiceEnergy / n);
  const noiseRms = voiceRms / Math.pow(10, hnr / 20);
  const noiseRng = makeRng(seed + 99);
  for (let i = 0; i < n; i += 1) {
    if (s[i] !== 0) s[i] += noiseRms * noiseRng() * 1.732;
  }
  return { duration: DUR, length: n, numberOfChannels: 1, sampleRate: SR, getChannelData: () => s };
}

const PROFILES = [
  ["沉穩低音·平靜", { f0: 105, tilt: -13, formants: [420, 1100], intonation: 0.04, syllableDepth: 0.3, pauseRatio: 0.35, dynamics: 0.15, jitter: 0.003, consonant: 0.12 }],
  ["溫柔傾聽·輕聲", { f0: 190, tilt: -12, formants: [450, 1300], intonation: 0.07, syllableDepth: 0.35, pauseRatio: 0.3, level: 0.05, dynamics: 0.2, consonant: 0.15 }],
  ["明亮活潑·高能", { f0: 260, tilt: -6, formants: [780, 2400], intonation: 0.24, syllableDepth: 0.9, pauseRatio: 0.05, dynamics: 0.9, jitter: 0.008, consonant: 0.45 }],
  ["有力推進·男聲", { f0: 130, tilt: -7, formants: [650, 1800], intonation: 0.16, syllableDepth: 0.7, pauseRatio: 0.1, dynamics: 0.45, consonant: 0.35 }],
  ["氣息沙啞 HNR8", { f0: 150, tilt: -9, formants: [550, 1500], hnr: 8, jitter: 0.02, intonation: 0.1, syllableDepth: 0.5 }],
  ["重度沙啞 HNR4", { f0: 120, tilt: -8, formants: [550, 1400], hnr: 4, jitter: 0.04, intonation: 0.08, syllableDepth: 0.5 }],
  ["戲劇起伏·開闊", { f0: 175, tilt: -8, formants: [620, 1900], intonation: 0.3, syllableDepth: 0.6, pauseRatio: 0.18, dynamics: 0.6, consonant: 0.3 }],
  ["單調平板·收斂", { f0: 160, tilt: -11, formants: [500, 1400], intonation: 0.02, syllableDepth: 0.25, pauseRatio: 0.25, dynamics: 0.1, consonant: 0.15 }],
  ["沙啞有力·破浪?", { f0: 140, tilt: -6, formants: [700, 2100], hnr: 7, jitter: 0.025, intonation: 0.2, syllableDepth: 0.75, pauseRatio: 0.08, dynamics: 0.5, consonant: 0.4 }],
  ["清亮乾淨 HNR25", { f0: 210, tilt: -9, formants: [600, 1900], hnr: 25, jitter: 0.002, intonation: 0.12, consonant: 0.25 }],
  ["夜色低沉·微啞", { f0: 100, tilt: -13, formants: [420, 1050], hnr: 11, jitter: 0.012, intonation: 0.05, syllableDepth: 0.35, pauseRatio: 0.3, dynamics: 0.2, consonant: 0.1 }],
  ["漫遊起伏·旅行", { f0: 165, tilt: -8, formants: [600, 1800], intonation: 0.4, syllableDepth: 0.95, pauseRatio: 0.28, dynamics: 0.9, consonant: 0.3, jitter: 0.006 }],
  ["明亮輕柔·築夢", { f0: 235, tilt: -8, formants: [700, 2200], hnr: 22, intonation: 0.14, syllableDepth: 0.45, pauseRatio: 0.2, dynamics: 0.35, consonant: 0.12 }],
  ["餘韻開闊·微啞", { f0: 170, tilt: -10, formants: [560, 1600], hnr: 9, jitter: 0.014, intonation: 0.25, syllableDepth: 0.4, pauseRatio: 0.35, dynamics: 0.55, consonant: 0.12 }],
];

const rows = [];
for (const [name, params] of PROFILES) {
  const p = await analyzeVoice(voice(params));
  const card = selectVoiceCard(p);
  rows.push({ name, p, card });
}

console.log("profile".padEnd(14), "bri sha bou ope ras ene", " card".padEnd(15), "aff", " periodicity bandFlat zcr");
for (const { name, p, card } of rows) {
  const ax = p.axes.map((a) => String(a.score).padStart(3)).join(" ");
  console.log(
    name.padEnd(14), ax, (" " + card.id).padEnd(15), String(card.affinity).padStart(3),
    "  r=" + p.measurements.pitchPeriodicity.toFixed(3),
    "bf=" + p.measurements.spectralBandFlatness.toFixed(3),
    "zcr=" + p.measurements.zeroCrossingRate.toFixed(3),
    "cen=" + String(p.measurements.spectralCentroidHz).padStart(4),
    "rof=" + String(p.measurements.spectralRolloffHz).padStart(4),
    "hfr=" + p.measurements.highFrequencyRatio.toFixed(3),
    "dyn=" + p.measurements.dynamicRange.toFixed(2),
    "pv=" + p.measurements.pitchVariation.toFixed(3),
    "rv=" + p.measurements.rmsVariation.toFixed(2),
  );
}
const distinct = new Set(rows.map((r) => r.card.id));
console.log(`\nReachable cards: ${distinct.size}/8 -> ${[...distinct].join(", ")}`);
