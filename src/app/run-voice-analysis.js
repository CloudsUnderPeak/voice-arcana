import { analyzeVoice } from "../domain/voice-portrait/analyze-voice.js";

// Run the voice analysis in a Web Worker; fall back to the main thread when
// workers are unavailable. Channel data is transferred as copies, so the
// original AudioBuffer stays usable for retries.
export function runVoiceAnalysis(audioBuffer, onProgress = () => {}) {
  if (typeof Worker !== "function") {
    return analyzeVoice(audioBuffer, onProgress);
  }

  let worker;
  try {
    worker = new Worker(new URL("./voice-analysis-worker.js", import.meta.url), {
      type: "module",
    });
  } catch {
    return analyzeVoice(audioBuffer, onProgress);
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    function settle(callback, value) {
      if (settled) return;
      settled = true;
      worker.terminate();
      callback(value);
    }

    worker.addEventListener("message", (event) => {
      const data = event.data;
      if (data.type === "progress") {
        if (!settled) onProgress({ progress: data.progress, stage: data.stage });
      } else if (data.type === "result") {
        settle(resolve, data.portrait);
      } else if (data.type === "error") {
        settle(reject, new Error(data.message));
      }
    });

    // e.g. browsers without module-worker support fail at load: analyze on the main thread instead.
    worker.addEventListener("error", () => {
      if (settled) return;
      settled = true;
      worker.terminate();
      analyzeVoice(audioBuffer, onProgress).then(resolve, reject);
    });

    const channels = [];
    for (let index = 0; index < audioBuffer.numberOfChannels; index += 1) {
      channels.push(audioBuffer.getChannelData(index).slice());
    }
    worker.postMessage(
      {
        channels,
        sampleRate: audioBuffer.sampleRate,
        length: audioBuffer.length,
        duration: audioBuffer.duration,
      },
      channels.map((channel) => channel.buffer),
    );
  });
}
