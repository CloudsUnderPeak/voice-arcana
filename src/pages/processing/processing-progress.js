// Shared analysis-progress constants: the app-side milestones and the
// processing-page step thresholds must be adjusted together.
export const ANALYSIS_PROGRESS = Object.freeze({
  initial: 8,
  decodeDone: 24,
  analysisSpan: 58,
  matching: 88,
  complete: 100,
});

// Highlight thresholds for the waveform / timbre / card steps, matching the milestone ranges above.
export const STEP_THRESHOLDS = Object.freeze([10, 48, 82]);
