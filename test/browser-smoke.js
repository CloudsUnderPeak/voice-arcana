import { magnitudeSpectrum } from "../src/domain/voice-portrait/fft.js";
import { analyzeVoice } from "../src/domain/voice-portrait/analyze-voice.js";
import { VOICE_CARDS } from "../src/domain/cards/card-catalog.js";
import { selectVoiceCard } from "../src/domain/cards/select-voice-card.js";
import { mountExperiencePage } from "../src/pages/experience/experience-page.js";
import { mountResultPage } from "../src/pages/result/result-page.js";

const status = document.querySelector("#status");
const fixture = document.querySelector("#fixture");
const searchParams = new URLSearchParams(window.location.search);
const visualMode = searchParams.has("visual");
const visualView = searchParams.get("visual");

try {
  assert(VOICE_CARDS.length === 8, "card catalog");

  const target = VOICE_CARDS.find((card) => card.id === "night-keeper");
  const portrait = {
    axes: target.vector.map((value, index) => ({
      id: ["brightness", "sharpness", "bounce", "openness", "raspiness", "energy"][index],
      lowLabel: "左",
      highLabel: "右",
      value,
      score: Math.round(value * 100),
    })),
    measurements: { spectralCentroidHz: 1200 },
  };
  const card = selectVoiceCard(portrait);
  assert(card.id === "night-keeper", "exact card selection");

  const size = 1024;
  const targetBin = 24;
  const signal = Float64Array.from(
    { length: size },
    (_, index) => Math.sin((2 * Math.PI * targetBin * index) / size),
  );
  const spectrum = magnitudeSpectrum(signal);
  const peakBin = spectrum.reduce(
    (best, magnitude, index) => (magnitude > spectrum[best] ? index : best),
    0,
  );
  assert(peakBin === targetBin, "FFT peak");

  const lowPitch = await analyzeVoice(createSineBuffer(110));
  const highPitch = await analyzeVoice(createSineBuffer(260));
  assert(
    axisValue(highPitch, "brightness") > axisValue(lowPitch, "brightness") + 0.12,
    "pitch-sensitive brightness",
  );
  const quiet = await analyzeVoice(createSineBuffer(180, 0.06));
  const loud = await analyzeVoice(createSineBuffer(180, 0.24));
  assert(
    Math.abs(axisValue(loud, "energy") - axisValue(quiet, "energy")) < 0.12,
    "gain-resistant energy",
  );
  const steady = await analyzeVoice(createSineBuffer(180));
  const moving = await analyzeVoice(createSineBuffer(180, 0.2, 70));
  assert(
    axisValue(moving, "bounce") > axisValue(steady, "bounce") + 0.05,
    "pitch-sensitive bounce",
  );

  const actions = {
    onStart() {},
    onStop() {},
    onSubmit() {},
    onReset() {},
  };
  let experience = mountExperiencePage(
    fixture,
    { recordingStatus: "idle", recording: null, error: "" },
    actions,
  );
  assert(fixture.querySelector("[data-action='start']"), "idle start action");
  assert(!fixture.querySelector(".privacy-pill"), "header omits duplicate privacy pill");
  assert(!fixture.querySelector("[data-wave]"), "idle hides waveform");
  assert(!fixture.querySelector(".recording-time"), "idle hides timer");
  experience.destroy();

  experience = mountExperiencePage(
    fixture,
    { recordingStatus: "recording", recording: null, error: "" },
    actions,
  );
  assert(fixture.querySelector("[data-action='stop']"), "recording stop action");
  const voiceMeter = fixture.querySelector("[data-wave]");
  assert(voiceMeter, "recording voice meter");
  assert(fixture.querySelector(".recording-time"), "recording timer");
  experience.updateLevel(0.7);
  assert(
    fixture.querySelectorAll("[data-level-segments] .is-active").length >= 12,
    "voice meter level visibility",
  );
  experience.destroy();

  experience = mountExperiencePage(
    fixture,
    {
      recordingStatus: "ready",
      recording: {
        duration: 42,
        url: "data:audio/wav;base64,UklGRg==",
      },
      error: "",
    },
    actions,
  );
  assert(fixture.querySelector("audio"), "ready audio preview");
  assert(fixture.querySelector("[data-action='submit']"), "ready submit action");
  assert(!fixture.querySelector("[data-wave]"), "ready hides waveform");
  experience.destroy();

  mountResultPage(
    fixture,
    { card, portrait, duration: 42 },
    { onReset() {} },
  );
  assert(fixture.querySelectorAll(".portrait-axis").length === 6, "six result axes");
  assert(fixture.textContent.includes("守夜人"), "result card title");
  const cardArtwork = fixture.querySelector(".arcana-card");
  assert(cardArtwork, "result card art");
  await waitForImage(cardArtwork);
  assert(cardArtwork.naturalWidth > 0, "result card artwork loaded");

  status.textContent = "PASS";
  if (visualMode) {
    if (visualView === "recording") {
      const recordingExperience = mountExperiencePage(
        fixture,
        { recordingStatus: "recording", recording: null, error: "" },
        actions,
      );
      recordingExperience.updateLevel(0.72);
      recordingExperience.updateTime(18);
    }
    status.hidden = true;
    fixture.classList.add("visual");
    if (searchParams.has("probe")) {
      const overflowing = [...document.body.querySelectorAll("*")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            element: element.className || element.tagName,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter((item) => item.right > window.innerWidth + 1 || item.left < -1)
        .slice(0, 12);
      fixture.dataset.layoutProbe = JSON.stringify({
        viewport: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        overflowing,
      });
    }
  } else {
    fixture.replaceChildren();
  }
} catch (error) {
  status.textContent = `FAIL: ${error.message}`;
  throw error;
}

function assert(condition, label) {
  if (!condition) throw new Error(label);
}

function createSineBuffer(frequency, amplitude = 0.2, modulationDepth = 0) {
  const sampleRate = 16000;
  const duration = 1;
  const length = sampleRate * duration;
  const samples = new Float32Array(length);
  let phase = 0;
  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    const instantaneousFrequency =
      frequency + Math.sin(2 * Math.PI * 1.6 * time) * modulationDepth;
    phase += (2 * Math.PI * instantaneousFrequency) / sampleRate;
    samples[index] = Math.sin(phase) * amplitude;
  }
  return {
    duration,
    length,
    numberOfChannels: 1,
    sampleRate,
    getChannelData() {
      return samples;
    },
  };
}

function axisValue(portrait, id) {
  return portrait.axes.find((axis) => axis.id === id).value;
}

function waitForImage(image) {
  if (image.complete) return Promise.resolve();
  return new Promise((resolve) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", resolve, { once: true });
  });
}
