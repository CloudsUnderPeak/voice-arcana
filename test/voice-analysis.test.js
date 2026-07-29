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
