const FRAME_DURATION_SECONDS = 0.02;
const LOW_SIGNAL_FRAME_RMS = 0.01;

export function assessAudioQuality(audioBuffer) {
  if (
    !audioBuffer ||
    !Number.isFinite(audioBuffer.length) ||
    audioBuffer.length <= 0 ||
    !Number.isFinite(audioBuffer.sampleRate) ||
    audioBuffer.sampleRate <= 0 ||
    audioBuffer.numberOfChannels <= 0
  ) {
    return { valid: false, lowSignal: true, peakFrameRms: 0 };
  }

  const frameSize = Math.max(
    1,
    Math.round(audioBuffer.sampleRate * FRAME_DURATION_SECONDS),
  );
  let peakFrameRms = 0;
  let finiteSamples = 0;

  for (let offset = 0; offset < audioBuffer.length; offset += frameSize) {
    const frameEnd = Math.min(audioBuffer.length, offset + frameSize);
    let sumSquares = 0;
    let frameSamples = 0;

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
      const samples = audioBuffer.getChannelData(channel);
      for (let index = offset; index < frameEnd; index += 1) {
        const sample = samples[index];
        if (!Number.isFinite(sample)) continue;
        sumSquares += sample * sample;
        frameSamples += 1;
      }
    }

    finiteSamples += frameSamples;
    if (frameSamples > 0) {
      peakFrameRms = Math.max(peakFrameRms, Math.sqrt(sumSquares / frameSamples));
    }
  }

  return {
    valid: finiteSamples > 0,
    lowSignal: peakFrameRms < LOW_SIGNAL_FRAME_RMS,
    peakFrameRms,
  };
}
