import { createSessionStore } from "./session-store.js";
import { AudioRecorder } from "../infrastructure/audio/audio-recorder.js";
import { decodeAudioBlob } from "../infrastructure/audio/decode-audio.js";
import { analyzeVoice } from "../domain/voice-portrait/analyze-voice.js";
import { assessAudioQuality } from "../domain/voice-portrait/assess-audio-quality.js";
import { selectVoiceCard } from "../domain/cards/select-voice-card.js";
import { mountExperiencePage } from "../pages/experience/experience-page.js";
import { mountProcessingPage } from "../pages/processing/processing-page.js";
import { mountResultPage } from "../pages/result/result-page.js";

const MIN_RECORDING_SECONDS = 2;

export function createApp(root) {
  const store = createSessionStore();
  let page = null;
  let recorder = null;
  let unsubscribe = null;
  let finishPromise = null;
  let destroyed = false;

  function disposePage() {
    page?.destroy?.();
    page = null;
  }

  async function beginRecording() {
    store.setState({ recordingStatus: "requesting", error: "" });

    try {
      recorder = new AudioRecorder({ maxDurationSeconds: 60 });
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
    if (
      !recording ||
      recording.duration < MIN_RECORDING_SECONDS ||
      !recording.blob ||
      recording.blob.size === 0
    ) {
      if (recording?.url) URL.revokeObjectURL(recording.url);
      store.setState({
        recordingStatus: "idle",
        recording: null,
        error:
          recording?.duration >= MIN_RECORDING_SECONDS
            ? "沒有收到有效的錄音資料，請檢查麥克風後重新錄製。"
            : `請至少錄製 ${MIN_RECORDING_SECONDS} 秒，讓聲音肖像有足夠線索。`,
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
      audioBuffer = await decodeAudioBlob(recording.blob);
    } catch (error) {
      console.error(error);
      URL.revokeObjectURL(recording.url);
      if (destroyed) return;
      store.setState({
        recordingStatus: "idle",
        recording: null,
        error: "這段錄音無法讀取，請重新錄製或改用最新版瀏覽器。",
      });
      return;
    }

    if (destroyed) {
      URL.revokeObjectURL(recording.url);
      return;
    }

    const quality = assessAudioQuality(audioBuffer);
    if (!quality.valid) {
      URL.revokeObjectURL(recording.url);
      store.setState({
        recordingStatus: "idle",
        recording: null,
        error: "這段錄音沒有可用的聲音資料，請檢查麥克風後重新錄製。",
      });
      return;
    }

    store.setState({
      recordingStatus: "ready",
      recording: {
        ...recording,
        audioBuffer,
        qualityWarning: quality.lowSignal
          ? "錄音訊號偏小。你仍可繼續分析，或靠近麥克風後重新錄製。"
          : "",
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
        recording.audioBuffer || (await decodeAudioBlob(recording.blob));
      page?.setProgress?.(24, "正在拆解聲音的光譜");
      const portrait = await analyzeVoice(audioBuffer, ({ progress, label }) => {
        page?.setProgress?.(24 + Math.round(progress * 0.58), label);
      });
      page?.setProgress?.(88, "正在尋找與你共鳴的聲音牌");
      const card = selectVoiceCard(portrait);
      await delay(550);
      page?.setProgress?.(100, "聲音肖像已完成");
      await delay(380);

      store.setState({
        view: "result",
        analysis: { portrait, card, duration: recording.duration },
      });
    } catch (error) {
      console.error(error);
      store.setState({
        view: "experience",
        recordingStatus: "ready",
        error: "這段錄音暫時無法分析，請重新錄製後再試一次。",
      });
    }
  }

  function reset() {
    recorder?.cancel();
    recorder = null;
    const recording = store.getState().recording;
    if (recording?.url) URL.revokeObjectURL(recording.url);
    store.reset();
  }

  function render(state) {
    disposePage();

    if (state.view === "processing") {
      page = mountProcessingPage(root);
      return;
    }

    if (state.view === "result") {
      page = mountResultPage(root, state.analysis, { onReset: reset });
      return;
    }

    page = mountExperiencePage(root, state, {
      onStart: beginRecording,
      onStop: stopRecording,
      onSubmit: submitRecording,
      onReset: reset,
    });
  }

  return {
    start() {
      destroyed = false;
      unsubscribe = store.subscribe(render);
      render(store.getState());
    },
    destroy() {
      destroyed = true;
      recorder?.cancel();
      const recording = store.getState().recording;
      if (recording?.url) URL.revokeObjectURL(recording.url);
      disposePage();
      unsubscribe?.();
    },
  };
}

function microphoneErrorMessage(error) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    return "這個瀏覽器不支援網頁錄音，請改用最新版 Chrome、Edge、Firefox 或 Safari。";
  }
  if (error?.name === "NotAllowedError") {
    return "麥克風權限尚未開啟。請允許此網站使用麥克風後再試一次。";
  }
  if (error?.name === "NotFoundError") {
    return "找不到可使用的麥克風，請確認裝置已連接。";
  }
  return "無法啟動麥克風，請檢查瀏覽器權限與裝置設定。";
}

function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
