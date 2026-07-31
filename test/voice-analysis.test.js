import test from "node:test";
import assert from "node:assert/strict";
import { analyzeVoice } from "../src/domain/voice-portrait/analyze-voice.js";

const SAMPLE_RATE = 16000;
const DURATION_SECONDS = 2;

test("synthetic higher pitch produces a brighter voice portrait", async () => {
  const low = await analyzeVoice(createSineBuffer(110, 0.2));
  const high = await analyzeVoice(createSineBuffer(260, 0.2));

  assert.ok(Math.abs(low.measurements.pitchHz - 110) < 8);
  assert.ok(Math.abs(high.measurements.pitchHz - 260) < 12);
  assert.ok(axisValue(high, "brightness") > axisValue(low, "brightness") + 0.12);
});

test("energy is not dominated by recording gain", async () => {
  const quiet = await analyzeVoice(createSineBuffer(180, 0.06));
  const loud = await analyzeVoice(createSineBuffer(180, 0.24));
  const difference = Math.abs(axisValue(loud, "energy") - axisValue(quiet, "energy"));

  assert.ok(difference < 0.12);
});

test("pitch movement raises bounce compared with a steady tone", async () => {
  const steady = await analyzeVoice(createSineBuffer(180, 0.2));
  const moving = await analyzeVoice(createSineBuffer(180, 0.2, 70));

  assert.ok(moving.measurements.pitchVariation > steady.measurements.pitchVariation);
  assert.ok(axisValue(moving, "bounce") > axisValue(steady, "bounce") + 0.05);
});

test("faint-noise pauses do not inflate zero-crossing driven axes", async () => {
  const voiced = await analyzeVoice(createSineBuffer(180, 0.2));
  const padded = await analyzeVoice(padWithFaintNoise(createSineBuffer(180, 0.2), 1.5));

  assert.ok(
    Math.abs(
      padded.measurements.zeroCrossingRate - voiced.measurements.zeroCrossingRate,
    ) < 0.01,
  );
  assert.ok(
    Math.abs(axisValue(padded, "sharpness") - axisValue(voiced, "sharpness")) < 0.06,
  );
  assert.ok(
    Math.abs(axisValue(padded, "raspiness") - axisValue(voiced, "raspiness")) < 0.06,
  );
});

test("breathy voices score higher raspiness than clean voices", async () => {
  const clean = await analyzeVoice(createHarmonicBuffer({ hnr: 25 }));
  const breathy = await analyzeVoice(createHarmonicBuffer({ hnr: 8 }));

  assert.ok(axisValue(clean, "raspiness") < 0.3);
  assert.ok(
    axisValue(breathy, "raspiness") > axisValue(clean, "raspiness") + 0.25,
  );
});

// Harmonic synthetic voice with deterministic broadband noise added per the target HNR (dB) to simulate breathiness.
function createHarmonicBuffer({ f0 = 150, hnr = 25 }) {
  const length = SAMPLE_RATE * DURATION_SECONDS;
  const samples = new Float32Array(length);
  let phase = 0;
  let voiceEnergy = 0;
  for (let index = 0; index < length; index += 1) {
    phase += (2 * Math.PI * f0) / SAMPLE_RATE;
    let value = 0;
    for (let harmonic = 1; harmonic <= 8; harmonic += 1) {
      value += Math.sin(phase * harmonic) / harmonic;
    }
    samples[index] = value * 0.12;
    voiceEnergy += samples[index] * samples[index];
  }
  const voiceRms = Math.sqrt(voiceEnergy / length);
  const noiseRms = voiceRms / 10 ** (hnr / 20);
  let seed = 987654321;
  for (let index = 0; index < length; index += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    samples[index] += noiseRms * 1.732 * (seed / 0x3fffffff - 1);
  }

  return {
    duration: DURATION_SECONDS,
    length,
    numberOfChannels: 1,
    sampleRate: SAMPLE_RATE,
    getChannelData() {
      return samples;
    },
  };
}

function padWithFaintNoise(buffer, paddingSeconds) {
  const paddingLength = Math.round(buffer.sampleRate * paddingSeconds);
  const source = buffer.getChannelData(0);
  const samples = new Float32Array(source.length + paddingLength * 2);
  // Tiny alternating-sign noise: RMS far below the active threshold but with an
  // extremely high zero-crossing rate, mimicking mic noise floor during quiet pauses.
  for (let index = 0; index < paddingLength; index += 1) {
    const noise = index % 2 === 0 ? 0.001 : -0.001;
    samples[index] = noise;
    samples[paddingLength + source.length + index] = noise;
  }
  samples.set(source, paddingLength);

  return {
    duration: samples.length / buffer.sampleRate,
    length: samples.length,
    numberOfChannels: 1,
    sampleRate: buffer.sampleRate,
    getChannelData() {
      return samples;
    },
  };
}

function createSineBuffer(frequency, amplitude, modulationDepth = 0) {
  const length = SAMPLE_RATE * DURATION_SECONDS;
  const samples = new Float32Array(length);
  let phase = 0;

  for (let index = 0; index < length; index += 1) {
    const time = index / SAMPLE_RATE;
    const instantaneousFrequency =
      frequency + Math.sin(2 * Math.PI * 1.6 * time) * modulationDepth;
    phase += (2 * Math.PI * instantaneousFrequency) / SAMPLE_RATE;
    samples[index] = Math.sin(phase) * amplitude;
  }

  return {
    duration: DURATION_SECONDS,
    length,
    numberOfChannels: 1,
    sampleRate: SAMPLE_RATE,
    getChannelData() {
      return samples;
    },
  };
}

function axisValue(portrait, id) {
  return portrait.axes.find((axis) => axis.id === id).value;
}
