import test from "node:test";
import assert from "node:assert/strict";
import { assessAudioQuality } from "../src/domain/voice-portrait/assess-audio-quality.js";

test("assessAudioQuality accepts a clear synthetic signal", () => {
  const quality = assessAudioQuality(createBuffer(0.08));

  assert.equal(quality.valid, true);
  assert.equal(quality.lowSignal, false);
  assert.ok(quality.peakFrameRms > 0.05);
});

test("assessAudioQuality warns without rejecting a near-silent recording", () => {
  const quality = assessAudioQuality(createBuffer(0.001));

  assert.equal(quality.valid, true);
  assert.equal(quality.lowSignal, true);
});

test("assessAudioQuality rejects a buffer without samples", () => {
  const quality = assessAudioQuality({
    length: 0,
    numberOfChannels: 1,
    sampleRate: 16000,
    getChannelData() {
      return new Float32Array();
    },
  });

  assert.equal(quality.valid, false);
});

function createBuffer(amplitude) {
  const sampleRate = 16000;
  const samples = Float32Array.from(
    { length: sampleRate },
    (_, index) => Math.sin((2 * Math.PI * 180 * index) / sampleRate) * amplitude,
  );

  return {
    length: samples.length,
    numberOfChannels: 1,
    sampleRate,
    getChannelData() {
      return samples;
    },
  };
}
