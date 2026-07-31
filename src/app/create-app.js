import { createSessionStore } from "./session-store.js";
import { initLocale, onLocaleChange, setLocale, t } from "../i18n/i18n.js";
import { runVoiceAnalysis } from "./run-voice-analysis.js";
import {
  clearShareUrlFromHistory,
  parseSharedResult,
  writeShareUrlToHistory,
} from "./share-link.js";
import { AudioRecorder } from "../infrastructure/audio/audio-recorder.js";
import { decodeAudioBlob } from "../infrastructure/audio/decode-audio.js";
import { assessAudioQuality } from "../domain/voice-portrait/assess-audio-quality.js";
import { selectVoiceCard } from "../domain/cards/select-voice-card.js";
import { mountExperiencePage } from "../pages/experience/experience-page.js";
import { mountProcessingPage } from "../pages/processing/processing-page.js";
import { mountResultPage } from "../pages/result/result-page.js";
import { ANALYSIS_PROGRESS } from "../pages/processing/processing-progress.js";

export const MIN_RECORDING_SECONDS = 2;
export const MAX_RECORDING_SECONDS = 60;

const defaultDependencies = {
  createRecorder: (options) => new AudioRecorder(options),
  decodeAudioBlob,
  assessAudioQuality,
  runVoiceAnalysis,
  selectVoiceCard,
  mountExperiencePage,
  mountProcessingPage,
  mountResultPage,
  parseSharedResult,
  writeShareUrlToHistory,
  clearShareUrlFromHistory,
};

export function createApp(root, overrides = {}) {
  const deps = { ...defaultDependencies, ...overrides };
  const store = createSessionStore();
  let page = null;
  let recorder = null;
  let unsubscribe = null;
  let unsubscribeLocale = null;
  let finishPromise = null;
  let destroyed = false;

  // The language toggle is rendered by siteHeader (data-lang-switch) and rebuilt
  // on every re-render, so one delegated listener on root covers all of them.
  function handleLanguageSwitch(event) {
    const trigger = event.target?.closest?.("[data-lang-switch]");
    if (!trigger) return;
    event.preventDefault();
    setLocale(trigger.dataset.langSwitch);
  }

  function disposePage() {
    page?.destroy?.();
    page = null;
  }

  async function beginRecording() {
    store.setState({ recordingStatus: "requesting", error: "" });

    try {
      recorder = deps.createRecorder({ maxDurationSeconds: MAX_RECORDING_SECONDS });
      await recorder.start({
        onLevel: (level) => page?.updateLevel?.(level),
        onTime: (seconds) => page?.updateTime?.(seconds),
        onAutoStop: (recording) => void finishRecording(recording),
      });
      store.setState({ recordingStatus: "recording" });
      page?.setRecordingStatus?.("recording");
    } catch (error) {
      store.setState({
        recordingStatus: "idle",
        error: microphoneErrorMessage(error),
      });
    }
  }

  async function stopRecording() {
    if (!recorder) return;
    const recording = await recorder.stop();
    await finishRecording(recording);
  }

  function finishRecording(recording) {
    if (finishPromise) return finishPromise;
    finishPromise = validateRecording(recording).finally(() => {
      finishPromise = null;
    });
    return finishPromise;
  }

  async function validateRecording(recording) {
    recorder = null;
    if (!recording || !recording.blob || recording.blob.size === 0) {
      if (recording?.url) URL.revokeObjectURL(recording.url);
      store.setState({
        recordingStatus: "idle",
        recording: null,
        error: t("errors.noRecordingData"),
      });
      return;
    }

    if (recording.duration < MIN_RECORDING_SECONDS) {
      if (recording.url) URL.revokeObjectURL(recording.url);
      store.setState({
        recordingStatus: "idle",
        recording: null,
        error: t("errors.tooShort", { seconds: MIN_RECORDING_SECONDS }),
      });
      return;
    }

    store.setState({
      recordingStatus: "validating",
      recording,
      error: "",
    });

    let audioBuffer;
    try {
      audioBuffer = await deps.decodeAudioBlob(recording.blob);
    } catch (error) {
      console.error(error);
      URL.revokeObjectURL(recording.url);
      if (destroyed) return;
      store.setState({
        recordingStatus: "idle",
        recording: null,
        error: t("errors.decodeFailed"),
      });
      return;
    }

    if (destroyed) {
      URL.revokeObjectURL(recording.url);
      return;
    }

    const quality = deps.assessAudioQuality(audioBuffer);
    if (!quality.valid) {
      URL.revokeObjectURL(recording.url);
      store.setState({
        recordingStatus: "idle",
        recording: null,
        error: t("errors.silentRecording"),
      });
      return;
    }

    store.setState({
      recordingStatus: "ready",
      recording: {
        ...recording,
        audioBuffer,
        qualityWarning: quality.lowSignal ? t("recorder.lowSignalWarning") : "",
      },
      error: "",
    });
  }

  async function submitRecording() {
    const { recording } = store.getState();
    if (!recording) return;

    store.setState({ view: "processing", error: "" });
    await nextPaint();

    try {
      const audioBuffer =
        recording.audioBuffer || (await deps.decodeAudioBlob(recording.blob));
      page?.setProgress?.(ANALYSIS_PROGRESS.decodeDone, t("processing.stages.decode"));
      const portrait = await deps.runVoiceAnalysis(
        audioBuffer,
        ({ progress, stage }) => {
          page?.setProgress?.(
            ANALYSIS_PROGRESS.decodeDone +
              Math.round(progress * ANALYSIS_PROGRESS.analysisSpan),
            t(`processing.stages.${stage}`),
          );
        },
      );
      page?.setProgress?.(ANALYSIS_PROGRESS.matching, t("processing.stages.matching"));
      const card = deps.selectVoiceCard(portrait);
      await delay(550);
      page?.setProgress?.(ANALYSIS_PROGRESS.complete, t("processing.stages.done"));
      await delay(380);

      // The result page only needs portrait and card; release the recording Blob, AudioBuffer, and object URL.
      const analysis = { portrait, card, duration: recording.duration };
      store.setState({
        view: "result",
        recording: null,
        recordingStatus: "idle",
        analysis,
      });
      // Write the result into the address bar: refreshes keep it and the URL is shareable.
      deps.writeShareUrlToHistory(analysis);
      if (recording.url) URL.revokeObjectURL(recording.url);
    } catch (error) {
      console.error(error);
      store.setState({
        view: "experience",
        recordingStatus: "ready",
        error: t("errors.analysisFailed"),
      });
    }
  }

  function reset() {
    recorder?.cancel();
    recorder = null;
    const recording = store.getState().recording;
    if (recording?.url) URL.revokeObjectURL(recording.url);
    deps.clearShareUrlFromHistory();
    store.reset();
  }

  function render(state) {
    disposePage();

    if (state.view === "processing") {
      page = deps.mountProcessingPage(root);
      return;
    }

    if (state.view === "result") {
      page = deps.mountResultPage(root, state.analysis, { onReset: reset });
      return;
    }

    page = deps.mountExperiencePage(
      root,
      state,
      {
        onStart: beginRecording,
        onStop: stopRecording,
        onSubmit: submitRecording,
        onReset: reset,
      },
      { maxDurationSeconds: MAX_RECORDING_SECONDS },
    );
  }

  return {
    start() {
      destroyed = false;
      initLocale();
      // Re-render with the same state on locale change so all copy updates instantly.
      unsubscribeLocale = onLocaleChange(() => render(store.getState()));
      root.addEventListener?.("click", handleLanguageSwitch);
      unsubscribe = store.subscribe(render);
      // URLs carrying result params (shared links or refreshes) boot straight into the result page.
      const shared = deps.parseSharedResult();
      if (shared) {
        store.setState({
          view: "result",
          analysis: { ...shared, duration: 0, shared: true },
        });
        return;
      }
      render(store.getState());
    },
    destroy() {
      destroyed = true;
      recorder?.cancel();
      const recording = store.getState().recording;
      if (recording?.url) URL.revokeObjectURL(recording.url);
      disposePage();
      root.removeEventListener?.("click", handleLanguageSwitch);
      unsubscribeLocale?.();
      unsubscribe?.();
    },
    getState: store.getState,
  };
}

function microphoneErrorMessage(error) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    return t("errors.unsupportedBrowser");
  }
  if (error?.name === "NotAllowedError") return t("errors.micDenied");
  if (error?.name === "NotFoundError") return t("errors.micNotFound");
  return t("errors.micFailed");
}

function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function delay(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}
