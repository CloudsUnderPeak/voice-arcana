import { magnitudeSpectrum } from "./fft.js";
import { clamp01, mean, standardDeviation, scale } from "../../utils/math.js";

const FFT_SIZE = 1024;
const MAX_SPECTRAL_FRAMES = 96;
const PITCH_FRAME_SIZE = 2048;
const MAX_PITCH_FRAMES = 32;
const MIN_ACTIVE_RMS = 0.008;

export async function analyzeVoice(audioBuffer, onProgress = () => {}) {
  const samples = mixToMono(audioBuffer);
  const sampleRate = audioBuffer.sampleRate;
  onProgress({ progress: 0.08, label: "正在辨認聲音與停頓" });
  const temporal = analyzeTemporal(samples, sampleRate);
  await yieldToBrowser();

  onProgress({ progress: 0.34, label: "正在閱讀音色的明暗" });
  const spectral = analyzeSpectral(samples, sampleRate);
  await yieldToBrowser();

  onProgress({ progress: 0.56, label: "正在追蹤音高的輪廓" });
  const pitch = analyzePitch(samples, sampleRate);
  await yieldToBrowser();

  onProgress({ progress: 0.74, label: "正在比對節奏與能量" });
  const axes = createPortraitAxes(temporal, spectral, pitch);
  await yieldToBrowser();

  onProgress({ progress: 0.96, label: "正在描繪六個聲音維度" });
  return {
    axes,
    measurements: {
      durationSeconds: audioBuffer.duration,
      rms: round(temporal.activeRms, 4),
      dynamicRange: round(temporal.dynamicRange, 3),
      zeroCrossingRate: round(temporal.zeroCrossingRate, 4),
      spectralCentroidHz: Math.round(spectral.centroid),
      spectralRolloffHz: Math.round(spectral.rolloff),
      spectralFlatness: round(spectral.flatness, 3),
      highFrequencyRatio: round(spectral.highFrequencyRatio, 3),
      pitchHz: Math.round(pitch.medianHz),
      pitchVariation: round(pitch.variation, 3),
      pitchConfidence: round(pitch.confidence, 3),
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
  let crossings = 0;
  let previous = samples[0] || 0;

  for (let index = 0; index < samples.length; index += frameSize) {
    const end = Math.min(samples.length, index + frameSize);
    let energy = 0;
    for (let cursor = index; cursor < end; cursor += 1) {
      const sample = samples[cursor];
      energy += sample * sample;
      if ((sample >= 0) !== (previous >= 0)) crossings += 1;
      previous = sample;
    }
    rmsValues.push(Math.sqrt(energy / Math.max(1, end - index)));
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
    zeroCrossingRate: crossings / Math.max(1, samples.length),
  };
}

function analyzeSpectral(samples, sampleRate) {
  const availableFrames = Math.max(1, Math.floor(samples.length / FFT_SIZE));
  const frameCount = Math.min(MAX_SPECTRAL_FRAMES, availableFrames);
  const stride = Math.max(FFT_SIZE, Math.floor(samples.length / frameCount));
  const centroids = [];
  const rolloffs = [];
  const flatnessValues = [];
  const highRatios = [];

  for (let start = 0; start + FFT_SIZE <= samples.length; start += stride) {
    const frame = samples.subarray(start, start + FFT_SIZE);
    const rms = Math.sqrt(mean(Array.from(frame, (sample) => sample * sample)));
    if (rms < MIN_ACTIVE_RMS) continue;

    const spectrum = magnitudeSpectrum(frame);
    let total = 0;
    let weighted = 0;
    let high = 0;
    let logSum = 0;
    let rolloff = 0;
    for (let bin = 1; bin < spectrum.length; bin += 1) {
      const magnitude = spectrum[bin] + 1e-12;
      const frequency = (bin * sampleRate) / FFT_SIZE;
      total += magnitude;
      weighted += frequency * magnitude;
      if (frequency >= 3000) high += magnitude;
      logSum += Math.log(magnitude);
    }
    const rolloffTarget = total * 0.85;
    let cumulative = 0;
    for (let bin = 1; bin < spectrum.length; bin += 1) {
      cumulative += spectrum[bin];
      if (cumulative >= rolloffTarget) {
        rolloff = (bin * sampleRate) / FFT_SIZE;
        break;
      }
    }
    centroids.push(weighted / Math.max(total, 1e-9));
    rolloffs.push(rolloff);
    flatnessValues.push(
      Math.exp(logSum / (spectrum.length - 1)) /
        Math.max(total / (spectrum.length - 1), 1e-9),
    );
    highRatios.push(high / Math.max(total, 1e-9));
  }

  return {
    centroid: mean(centroids) || 1200,
    rolloff: mean(rolloffs) || 1800,
    centroidVariation:
      standardDeviation(centroids) / Math.max(mean(centroids), 1),
    flatness: mean(flatnessValues) || 0,
    highFrequencyRatio: mean(highRatios) || 0,
  };
}

function analyzePitch(samples, sampleRate) {
  if (samples.length < PITCH_FRAME_SIZE) {
    return { medianHz: 0, variation: 0, confidence: 0 };
  }

  const stride = Math.max(
    PITCH_FRAME_SIZE,
    Math.floor((samples.length - PITCH_FRAME_SIZE) / MAX_PITCH_FRAMES),
  );
  const estimates = [];
  const correlations = [];
  let inspectedFrames = 0;

  for (let start = 0; start + PITCH_FRAME_SIZE <= samples.length; start += stride) {
    const frame = samples.subarray(start, start + PITCH_FRAME_SIZE);
    const rms = Math.sqrt(mean(Array.from(frame, (sample) => sample * sample)));
    if (rms < MIN_ACTIVE_RMS) continue;
    inspectedFrames += 1;

    const estimate = estimateFundamental(frame, sampleRate);
    if (estimate.hz > 0) {
      estimates.push(estimate.hz);
      correlations.push(estimate.correlation);
    }
  }

  if (!estimates.length) {
    return { medianHz: 0, variation: 0, confidence: 0 };
  }

  const medianHz = median(estimates);
  return {
    medianHz,
    variation: standardDeviation(estimates) / Math.max(medianHz, 1),
    confidence: clamp01(
      mean(correlations) * (estimates.length / Math.max(inspectedFrames, 1)),
    ),
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

function createPortraitAxes(temporal, spectral, pitch) {
  const spectralBrightness = clamp01(
    scale(spectral.centroid, 700, 3100) * 0.76 +
      scale(spectral.highFrequencyRatio, 0.04, 0.32) * 0.24,
  );
  const pitchBrightness = logarithmicScale(pitch.medianHz, 85, 300);
  const pitchWeight = 0.34 * pitch.confidence;
  const brightness = clamp01(
    spectralBrightness * (1 - pitchWeight) + pitchBrightness * pitchWeight,
  );
  const sharpness = clamp01(
    brightness * 0.38 +
      scale(spectral.rolloff, 1200, 5200) * 0.2 +
      scale(spectral.flatness, 0.04, 0.38) * 0.18 +
      scale(temporal.zeroCrossingRate, 0.025, 0.16) * 0.24,
  );
  const bounce = clamp01(
    scale(temporal.rmsVariation, 0.2, 1.15) * 0.46 +
      scale(spectral.centroidVariation, 0.08, 0.52) * 0.26 +
      scale(pitch.variation, 0.015, 0.24) * pitch.confidence * 0.28,
  );
  const openness = clamp01(
    scale(spectral.centroidVariation, 0.06, 0.46) * 0.3 +
      scale(temporal.dynamicRange, 0.22, 0.88) * 0.3 +
      scale(pitch.variation, 0.015, 0.24) * pitch.confidence * 0.22 +
      brightness * 0.18,
  );
  const raspiness = clamp01(
    scale(spectral.flatness, 0.035, 0.42) * 0.62 +
      scale(temporal.zeroCrossingRate, 0.025, 0.17) * 0.38,
  );
  const energy = clamp01(
    scale(temporal.activeRms, 0.012, 0.16) * 0.1 +
      scale(temporal.dynamicRange, 0.15, 0.82) * 0.32 +
      bounce * 0.38 +
      scale(temporal.activeRatio, 0.35, 0.95) * 0.2,
  );

  return [
    axis("brightness", "低沉", "明亮", brightness, "音色明暗"),
    axis("sharpness", "柔和", "銳利", sharpness, "高頻輪廓"),
    axis("bounce", "沉穩", "跳躍", bounce, "節奏起伏"),
    axis("openness", "親密", "開闊", openness, "空間感"),
    axis("raspiness", "乾淨", "沙啞", raspiness, "聲帶質地"),
    axis("energy", "平靜", "充滿能量", energy, "整體動能"),
  ];
}

function logarithmicScale(value, minimum, maximum) {
  if (value <= 0) return 0.5;
  return scale(Math.log(value), Math.log(minimum), Math.log(maximum));
}

function axis(id, lowLabel, highLabel, value, description) {
  return {
    id,
    lowLabel,
    highLabel,
    value: round(clamp01(value), 3),
    score: Math.round(clamp01(value) * 100),
    description,
  };
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
