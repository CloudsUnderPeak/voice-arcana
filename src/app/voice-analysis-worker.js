import { analyzeVoice } from "../domain/voice-portrait/analyze-voice.js";

// Module Web Worker entry point: receives transferred channel samples and runs
// the six-axis analysis off the main thread, keeping the progress UI responsive.
self.addEventListener("message", async (event) => {
  const { channels, sampleRate, length, duration } = event.data;
  const audioBufferLike = {
    sampleRate,
    length,
    duration,
    numberOfChannels: channels.length,
    getChannelData(index) {
      return channels[index];
    },
  };

  try {
    const portrait = await analyzeVoice(audioBufferLike, ({ progress, stage }) => {
      self.postMessage({ type: "progress", progress, stage });
    });
    self.postMessage({ type: "result", portrait });
  } catch (error) {
    self.postMessage({ type: "error", message: error?.message || String(error) });
  }
});
