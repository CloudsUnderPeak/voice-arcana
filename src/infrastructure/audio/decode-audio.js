// Decode at a fixed sample rate so results do not drift with the device output
// rate (44.1k / 48k) and stay aligned with the 16kHz synthetic-signal tests.
// Voice features (70-400Hz pitch, <8kHz spectrum) fit comfortably.
export const ANALYSIS_SAMPLE_RATE = 16000;

export async function decodeAudioBlob(blob) {
  const bytes = await blob.arrayBuffer();

  if (typeof OfflineAudioContext === "function") {
    try {
      const offlineContext = new OfflineAudioContext(1, 1, ANALYSIS_SAMPLE_RATE);
      // decodeAudioData takes ownership of the ArrayBuffer; keep the original bytes for the fallback.
      return await offlineContext.decodeAudioData(bytes.slice(0));
    } catch {
      // Some browsers fail to decode certain containers via OfflineAudioContext; fall back to AudioContext.
    }
  }

  const context = new AudioContext();
  try {
    return await context.decodeAudioData(bytes);
  } finally {
    // A failed close() must not mask the decode result or error.
    context.close().catch(() => {});
  }
}
