import { magnitudeSpectrum } from "./fft.js";
import { PORTRAIT_AXES, createAxis } from "./portrait-axes.js";
import { clamp01, mean, standardDeviation, scale } from "../../utils/math.js";

const FFT_SIZE = 1024;
const MAX_SPECTRAL_FRAMES = 96;
// 64ms @16kHz is about 4 periods of the 70Hz minimum pitch. Longer frames let
// intonation move F0 within a frame, lowering autocorrelation and
// misreading expressiveness as raspiness.
const PITCH_FRAME_SIZE = 1024;
const MAX_PITCH_FRAMES = 48;
const MIN_ACTIVE_RMS = 0.008;

// onProgress reports { progress, stage }, where stage is an identifier;
// the UI resolves display copy per locale (processing.stages.*), keeping
// the worker free of UI copy.
export async function analyzeVoice(audioBuffer, onProgress = () => {}) {
  const samples = mixToMono(audioBuffer);
  const sampleRate = audioBuffer.sampleRate;
  onProgress({ progress: 0.08, stage: "temporal" });
  const temporal = analyzeTemporal(samples, sampleRate);
  await yieldToBrowser();

  onProgress({ progress: 0.34, stage: "spectral" });
  const spectral = analyzeSpectral(samples, sampleRate);
  await yieldToBrowser();

  onProgress({ progress: 0.56, stage: "pitch" });
  const pitch = analyzePitch(samples, sampleRate);
  await yieldToBrowser();

  onProgress({ progress: 0.74, stage: "axes" });
  const axes = createPortraitAxes(temporal, spectral, pitch);
  await yieldToBrowser();

  onProgress({ progress: 0.96, stage: "portrait" });
  return {
    axes,
    measurements: {
      durationSeconds: audioBuffer.duration,
      rms: round(temporal.activeRms, 4),
      rmsVariation: round(temporal.rmsVariation, 3),
      dynamicRange: round(temporal.dynamicRange, 3),
      zeroCrossingRate: round(temporal.zeroCrossingRate, 4),
      spectralCentroidHz: Math.round(spectral.centroid),
      spectralRolloffHz: Math.round(spectral.rolloff),
      spectralBandFlatness: round(spectral.bandFlatness, 3),
      highFrequencyRatio: round(spectral.highFrequencyRatio, 3),
      pitchHz: Math.round(pitch.medianHz),
      pitchVariation: round(pitch.variation, 3),
      pitchConfidence: round(pitch.confidence, 3),
      pitchPeriodicity: round(pitch.periodicity, 3),
    },
    confidence: temporal.activeRatio < 0.18 ? "low" : "medium",
  };
}

function mixToMono(audioBuffer) {
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      mono[index] += data[index] / audioBuffer.numberOfChannels;
    }
  }
  return mono;
}

function analyzeTemporal(samples, sampleRate) {
  const frameSize = Math.max(256, Math.round(sampleRate * 0.025));
  const rmsValues = [];
  // ZCR counts voiced frames only: noise-floor crossings during pauses are
  // extremely dense and would inflate the crisp and husky axes.
  let totalCrossings = 0;
  let totalSamples = 0;
  let activeCrossings = 0;
  let activeSamples = 0;
  let previous = samples[0] || 0;

  for (let index = 0; index < samples.length; index += frameSize) {
    const end = Math.min(samples.length, index + frameSize);
    let energy = 0;
    let frameCrossings = 0;
    for (let cursor = index; cursor < end; cursor += 1) {
      const sample = samples[cursor];
      energy += sample * sample;
      if ((sample >= 0) !== (previous >= 0)) frameCrossings += 1;
      previous = sample;
    }
    const frameLength = Math.max(1, end - index);
    const rms = Math.sqrt(energy / frameLength);
    rmsValues.push(rms);
    totalCrossings += frameCrossings;
    totalSamples += frameLength;
    if (rms >= MIN_ACTIVE_RMS) {
      activeCrossings += frameCrossings;
      activeSamples += frameLength;
    }
  }

  const active = rmsValues.filter((value) => value >= MIN_ACTIVE_RMS);
  const safeActive = active.length ? active : rmsValues;
  const sorted = [...safeActive].sort((a, b) => a - b);
  const lower = percentile(sorted, 0.15);
  const upper = percentile(sorted, 0.85);
  const activeRms = mean(safeActive);

  return {
    activeRms,
    activeRatio: active.length / Math.max(1, rmsValues.length),
    rmsVariation: standardDeviation(safeActive) / Math.max(activeRms, 0.001),
    dynamicRange: (upper - lower) / Math.max(upper, 0.001),
    zeroCrossingRate: activeSamples
      ? activeCrossings / activeSamples
      : totalCrossings / Math.max(1, totalSamples),
  };
}

function analyzeSpectral(samples, sampleRate) {
  const availableFrames = Math.max(1, Math.floor(samples.length / FFT_SIZE));
  const frameCount = Math.min(MAX_SPECTRAL_FRAMES, availableFrames);
  const stride = Math.max(FFT_SIZE, Math.floor(samples.length / frameCount));
  const centroids = [];
  const rolloffs = [];
  const highRatios = [];

  const bandFlatnessValues = [];

  for (let start = 0; start + FFT_SIZE <= samples.length; start += stride) {
    const frame = samples.subarray(start, start + FFT_SIZE);
    if (frameRms(frame) < MIN_ACTIVE_RMS) continue;

    const spectrum = magnitudeSpectrum(frame);
    // Weight by power (magnitude squared): linear magnitude lets the broadband
    // noise floor inflate centroid/rolloff/high-frequency ratio; power tracks
    // the energy distribution and perception more closely.
    let total = 0;
    let high = 0;
    let rolloff = 0;
    let bandTotal = 0;
    let bandLogSum = 0;
    let bandBins = 0;
    // Centroid/rolloff are limited to the 150 Hz-5 kHz voice band, with the
    // band's median power subtracted as a noise floor: breath and ambient noise
    // carpet the whole band and drag the centroid upward, misreading husky or
    // noisy recordings as bright; subtraction keeps only the harmonic skeleton.
    const bandPowers = [];
    const bandFrequencies = [];
    for (let bin = 1; bin < spectrum.length; bin += 1) {
      const power = spectrum[bin] * spectrum[bin] + 1e-18;
      const frequency = (bin * sampleRate) / FFT_SIZE;
      total += power;
      if (frequency >= 3000) high += power;
      if (frequency >= 150 && frequency <= 5000) {
        bandPowers.push(power);
        bandFrequencies.push(frequency);
      }
      // Full-band flatness is dominated by the noise floor in empty high bins and
      // degenerates into an SNR measure; husky texture instead looks at the noise
      // between harmonics inside the 300 Hz-5 kHz voice band.
      if (frequency >= 300 && frequency <= 5000) {
        bandTotal += power;
        bandLogSum += Math.log(power);
        bandBins += 1;
      }
    }
    const noiseFloor = median(bandPowers);
    let voiceBandTotal = 0;
    let voiceBandWeighted = 0;
    for (let index = 0; index < bandPowers.length; index += 1) {
      const tonal = Math.max(0, bandPowers[index] - noiseFloor);
      voiceBandTotal += tonal;
      voiceBandWeighted += bandFrequencies[index] * tonal;
    }
    const rolloffTarget = voiceBandTotal * 0.85;
    let cumulative = 0;
    for (let index = 0; index < bandPowers.length; index += 1) {
      cumulative += Math.max(0, bandPowers[index] - noiseFloor);
      if (cumulative >= rolloffTarget) {
        rolloff = bandFrequencies[index];
        break;
      }
    }
    if (voiceBandTotal > 0) {
      centroids.push(voiceBandWeighted / voiceBandTotal);
    }
    rolloffs.push(rolloff);
    if (bandBins > 0) {
      bandFlatnessValues.push(
        Math.exp(bandLogSum / bandBins) / Math.max(bandTotal / bandBins, 1e-18),
      );
    }
    highRatios.push(high / Math.max(total, 1e-18));
  }

  // Centroid uses the 35th percentile across frames: fricative frames (s, sh,
  // x...) center at 3-5 kHz and are strongly right-skewed outliers. In
  // fricative-heavy languages such as Mandarin they can approach half of all
  // frames and push even the median up; a low percentile stays anchored to the
  // voiced core. Rolloff uses the median; the high-frequency ratio keeps the
  // mean - fricatives are exactly what the crisp axis should hear.
  const sortedCentroids = [...centroids].sort((a, b) => a - b);
  const sortedRolloffs = [...rolloffs].sort((a, b) => a - b);
  const centroidCore = percentile(sortedCentroids, 0.35) || 900;
  return {
    centroid: centroidCore,
    rolloff: median(sortedRolloffs) || 1500,
    centroidVariation:
      (percentile(sortedCentroids, 0.75) - percentile(sortedCentroids, 0.25)) /
      Math.max(centroidCore, 1),
    bandFlatness: mean(bandFlatnessValues) || 0,
    highFrequencyRatio: mean(highRatios) || 0,
  };
}

function analyzePitch(samples, sampleRate) {
  if (samples.length < PITCH_FRAME_SIZE) {
    return { medianHz: 0, variation: 0, confidence: 0, periodicity: 0 };
  }

  const stride = Math.max(
    PITCH_FRAME_SIZE,
    Math.floor((samples.length - PITCH_FRAME_SIZE) / MAX_PITCH_FRAMES),
  );
  const estimates = [];
  const correlations = [];
  // Periodicity is a proxy for HNR (Praat: HNR = 10*log10(r / (1 - r));
  // healthy adult speech has high r, breathy/hoarse voices low r). It takes the
  // 75th percentile of each active frame's best autocorrelation: consonant and
  // fricative frames are inherently aperiodic, so a mean would misread clean but
  // consonant-rich voices as husky; a clean voice's top frames stay near 1 while
  // a hoarse voice cannot reach it even in its best frames.
  const frameCorrelations = [];
  let inspectedFrames = 0;

  for (let start = 0; start + PITCH_FRAME_SIZE <= samples.length; start += stride) {
    const frame = samples.subarray(start, start + PITCH_FRAME_SIZE);
    if (frameRms(frame) < MIN_ACTIVE_RMS) continue;
    inspectedFrames += 1;

    const estimate = estimateFundamental(frame, sampleRate);
    frameCorrelations.push(estimate.correlation);
    if (estimate.hz > 0) {
      estimates.push(estimate.hz);
      correlations.push(estimate.correlation);
    }
  }

  const sortedCorrelations = [...frameCorrelations].sort((a, b) => a - b);
  const periodicity = clamp01(percentile(sortedCorrelations, 0.75));

  if (!estimates.length) {
    return { medianHz: 0, variation: 0, confidence: 0, periodicity };
  }

  const medianHz = median(estimates);
  // Drop estimates more than 1.5x away from the median: autocorrelation octave
  // errors (locking onto 2x or 0.5x F0) explode the variance and misread a
  // steady voice as highly modulated.
  const inliers = estimates.filter(
    (hz) => hz >= medianHz / 1.5 && hz <= medianHz * 1.5,
  );
  return {
    medianHz,
    variation: standardDeviation(inliers) / Math.max(median(inliers), 1),
    confidence: clamp01(
      mean(correlations) * (estimates.length / Math.max(inspectedFrames, 1)),
    ),
    periodicity,
  };
}

function estimateFundamental(frame, sampleRate) {
  const minimumLag = Math.max(2, Math.floor(sampleRate / 400));
  const maximumLag = Math.min(frame.length - 2, Math.ceil(sampleRate / 70));
  const correlations = new Float64Array(maximumLag + 1);
  let bestCorrelation = 0;

  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    let product = 0;
    let leftEnergy = 0;
    let rightEnergy = 0;
    const limit = frame.length - lag;
    for (let index = 0; index < limit; index += 1) {
      const left = frame[index];
      const right = frame[index + lag];
      product += left * right;
      leftEnergy += left * left;
      rightEnergy += right * right;
    }
    const correlation = product / Math.max(Math.sqrt(leftEnergy * rightEnergy), 1e-9);
    correlations[lag] = correlation;
    bestCorrelation = Math.max(bestCorrelation, correlation);
  }

  const threshold = Math.max(0.55, bestCorrelation * 0.97);
  for (let lag = minimumLag + 1; lag < maximumLag; lag += 1) {
    if (
      correlations[lag] >= threshold &&
      correlations[lag] >= correlations[lag - 1] &&
      correlations[lag] >= correlations[lag + 1]
    ) {
      return {
        hz: sampleRate / lag,
        correlation: correlations[lag],
      };
    }
  }

  return { hz: 0, correlation: bestCorrelation };
}

// Normalization ranges are calibrated against speech-acoustics literature (see docs/AUDIO_ANALYSIS.md):
// - Adult F0 spans roughly 85-300 Hz (male median ~120 Hz, female ~210 Hz).
// - Healthy adults sit at HNR >= 15-20 dB (autocorrelation r ~ 0.97-0.99); HNR < 10 dB (r < 0.91)
//   reads as clearly breathy/hoarse, so aperiodicity = 1 - r maps over 0.04-0.30.
// - Flatness approaches 0 for pure tones and 1 for white noise; voiced speech
//   stays below ~0.1 in-band, and breath noise raises the floor between harmonics.
function createPortraitAxes(temporal, spectral, pitch) {
  // Brightness leans on F0 as the main perceptual cue, with spectral tilt
  // (percentile centroid) as support; sqrt(confidence) keeps moderately
  // confident pitch estimates meaningfully weighted.
  const pitchWeight = 0.5 * Math.sqrt(pitch.confidence);
  const brightness = clamp01(
    logarithmicScale(spectral.centroid, 220, 1200) * (1 - pitchWeight) +
      logarithmicScale(pitch.medianHz, 85, 300) * pitchWeight,
  );
  const sharpness = clamp01(
    logarithmicScale(spectral.rolloff, 300, 2400) * 0.3 +
      scale(spectral.highFrequencyRatio, 0.01, 0.25) * 0.3 +
      scale(temporal.zeroCrossingRate, 0.05, 0.25) * 0.4,
  );
  // rmsVariation / dynamicRange ranges are calibrated on real read-aloud samples:
  // continuous reading (with sentence pauses) yields rmsVariation ~0.65-0.9 and
  // dynamicRange ~0.8-0.9, far above steady tones; narrower ranges saturate
  // every real recording.
  const bounce = clamp01(
    scale(temporal.rmsVariation, 0.5, 0.95) * 0.4 +
      scale(spectral.centroidVariation, 0.1, 0.45) * 0.25 +
      scale(pitch.variation, 0.05, 0.3) * pitch.confidence * 0.35,
  );
  const openness = clamp01(
    scale(temporal.dynamicRange, 0.6, 0.95) * 0.4 +
      scale(spectral.centroidVariation, 0.06, 0.35) * 0.3 +
      scale(pitch.variation, 0.04, 0.28) * pitch.confidence * 0.3,
  );
  const aperiodicity = scale(1 - pitch.periodicity, 0.03, 0.18);
  const raspiness = clamp01(
    aperiodicity * 0.6 +
      scale(spectral.bandFlatness, 0.03, 0.28) * 0.3 +
      scale(temporal.zeroCrossingRate, 0.06, 0.3) * 0.1,
  );
  const energy = clamp01(
    scale(temporal.activeRatio, 0.35, 0.85) * 0.33 +
      scale(temporal.dynamicRange, 0.55, 0.92) * 0.25 +
      scale(temporal.activeRms, 0.015, 0.1) * 0.12 +
      bounce * 0.3,
  );

  const values = { brightness, sharpness, bounce, openness, raspiness, energy };
  return PORTRAIT_AXES.map((definition) => createAxis(definition, values[definition.id]));
}

function logarithmicScale(value, minimum, maximum) {
  if (value <= 0) return 0.5;
  return scale(Math.log(value), Math.log(minimum), Math.log(maximum));
}

function frameRms(frame) {
  let energy = 0;
  for (let index = 0; index < frame.length; index += 1) {
    energy += frame[index] * frame[index];
  }
  return Math.sqrt(energy / Math.max(1, frame.length));
}

function percentile(sorted, ratio) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function round(value, digits) {
  const power = 10 ** digits;
  return Math.round(value * power) / power;
}

function yieldToBrowser() {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}
