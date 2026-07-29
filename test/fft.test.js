import test from "node:test";
import assert from "node:assert/strict";
import { magnitudeSpectrum } from "../src/domain/voice-portrait/fft.js";

test("FFT locates the dominant sine-wave bin", () => {
  const size = 1024;
  const targetBin = 32;
  const input = Float64Array.from(
    { length: size },
    (_, index) => Math.sin((2 * Math.PI * targetBin * index) / size),
  );
  const spectrum = magnitudeSpectrum(input);
  let peakBin = 0;
  for (let bin = 1; bin < spectrum.length; bin += 1) {
    if (spectrum[bin] > spectrum[peakBin]) peakBin = bin;
  }
  assert.equal(peakBin, targetBin);
});

