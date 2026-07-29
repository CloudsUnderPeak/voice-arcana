import { createSessionStore } from "./session-store.js";
import { AudioRecorder } from "../infrastructure/audio/audio-recorder.js";
import { decodeAudioBlob } from "../infrastructure/audio/decode-audio.js";
import { analyzeVoice } from "../domain/voice-portrait/analyze-voice.js";
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
        onAutoStop: (recording) => finishRecording(recording),
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
    finishRecording(recording);
  }

  function finishRecording(recording) {
    recorder = null;
    if (!recording || recording.duration < MIN_RECORDING_SECONDS) {
      store.setState({
        recordingStatus: "idle",
        recording: null,
        error: `請至少錄製 ${MIN_RECORDING_SECONDS} 秒，讓聲音肖像有足夠線索。`,
      });
      return;
    }

    store.setState({
      recordingStatus: "ready",
      recording,
      error: "",
    });
  }

  async function submitRecording() {
    const { recording } = store.getState();
    if (!recording) return;

    store.setState({ view: "processing", error: "" });
    await nextPaint();

    try {
      const audioBuffer = await decodeAudioBlob(recording.blob);
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
      unsubscribe = store.subscribe(render);
      render(store.getState());
    },
    destroy() {
      recorder?.cancel();
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
