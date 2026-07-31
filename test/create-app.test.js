import test from "node:test";
import assert from "node:assert/strict";
import { createApp, MAX_RECORDING_SECONDS } from "../src/app/create-app.js";

// create-app touches the browser only through injected page/recorder/analysis
// dependencies, so the state machine can be driven fully in Node.
globalThis.requestAnimationFrame ||= (callback) => setTimeout(callback, 0);
// Tests assert Chinese copy; pin the locale detection source so CI (en-US) stays deterministic.
Object.defineProperty(globalThis, "navigator", {
  value: { language: "zh-TW" },
  configurable: true,
});
if (typeof globalThis.window === "undefined") {
  globalThis.window = { setTimeout: setTimeout.bind(globalThis), MediaRecorder: class {} };
}

function createHarness({
  recording,
  decode,
  quality,
  portrait,
  card,
  sharedResult,
  shareUrlWrites,
} = {}) {
  const pages = [];
  const revoked = [];
  const originalRevoke = URL.revokeObjectURL;
  URL.revokeObjectURL = (url) => revoked.push(url);

  const recorder = {
    cancelled: false,
    async start(options) {
      this.options = options;
    },
    async stop() {
      return recording ?? null;
    },
    cancel() {
      this.cancelled = true;
    },
  };

  let experienceActions = null;
  const fakePage = { destroy() {}, setProgress() {}, updateLevel() {}, updateTime() {} };

  const app = createApp({}, {
    createRecorder: () => recorder,
    decodeAudioBlob: decode ?? (async () => ({ fake: "audioBuffer" })),
    assessAudioQuality: () => quality ?? { valid: true, lowSignal: false },
    runVoiceAnalysis: async (buffer, onProgress) => {
      onProgress?.({ progress: 0.5, label: "測試中" });
      return portrait ?? { axes: [] };
    },
    selectVoiceCard: () => card ?? { id: "test-card" },
    mountExperiencePage: (root, state, actions, options) => {
      pages.push({ name: "experience", state, options });
      experienceActions = actions;
      return fakePage;
    },
    mountProcessingPage: () => {
      pages.push({ name: "processing" });
      return fakePage;
    },
    mountResultPage: (root, analysis, actions) => {
      pages.push({ name: "result", analysis, actions });
      return fakePage;
    },
    parseSharedResult: () => sharedResult ?? null,
    writeShareUrlToHistory: (analysis) => shareUrlWrites?.push(analysis),
    clearShareUrlFromHistory: () => shareUrlWrites?.push("cleared"),
  });

  app.start();
  return {
    app,
    pages,
    revoked,
    recorder,
    actions: () => experienceActions,
    restore() {
      URL.revokeObjectURL = originalRevoke;
    },
  };
}

test("recordings shorter than the minimum are rejected with guidance", async (t) => {
  const harness = createHarness({
    recording: { blob: new Blob(["x"]), duration: 1, url: "blob:short" },
  });
  t.after(harness.restore);

  await harness.actions().onStart();
  await harness.actions().onStop();

  const state = harness.app.getState();
  assert.equal(state.recordingStatus, "idle");
  assert.equal(state.recording, null);
  assert.match(state.error, /至少錄製/);
  assert.deepEqual(harness.revoked, ["blob:short"]);
});

test("a missing recording reports missing data, not a duration hint", async (t) => {
  const harness = createHarness({ recording: null });
  t.after(harness.restore);

  await harness.actions().onStart();
  await harness.actions().onStop();

  assert.match(harness.app.getState().error, /沒有收到有效的錄音資料/);
});

test("decode failures return to idle and revoke the preview URL", async (t) => {
  const harness = createHarness({
    recording: { blob: new Blob(["audio"]), duration: 10, url: "blob:decode" },
    decode: async () => {
      throw new Error("decode failed");
    },
  });
  t.after(harness.restore);

  await harness.actions().onStart();
  await harness.actions().onStop();

  const state = harness.app.getState();
  assert.equal(state.recordingStatus, "idle");
  assert.match(state.error, /無法讀取/);
  assert.deepEqual(harness.revoked, ["blob:decode"]);
});

test("silent decodes are rejected as unusable audio", async (t) => {
  const harness = createHarness({
    recording: { blob: new Blob(["audio"]), duration: 10, url: "blob:silent" },
    quality: { valid: false, lowSignal: true },
  });
  t.after(harness.restore);

  await harness.actions().onStart();
  await harness.actions().onStop();

  assert.match(harness.app.getState().error, /沒有可用的聲音資料/);
});

test("a valid take flows to ready with a low-signal warning attached", async (t) => {
  const harness = createHarness({
    recording: { blob: new Blob(["audio"]), duration: 10, url: "blob:ok" },
    quality: { valid: true, lowSignal: true },
  });
  t.after(harness.restore);

  await harness.actions().onStart();
  await harness.actions().onStop();

  const state = harness.app.getState();
  assert.equal(state.recordingStatus, "ready");
  assert.match(state.recording.qualityWarning, /訊號偏小/);
  assert.equal(state.recording.audioBuffer.fake, "audioBuffer");
});

test("submit completes analysis, shows the result, and releases the recording", async (t) => {
  const card = { id: "night-keeper" };
  const harness = createHarness({
    recording: { blob: new Blob(["audio"]), duration: 12, url: "blob:submit" },
    card,
  });
  t.after(harness.restore);

  await harness.actions().onStart();
  await harness.actions().onStop();
  await harness.actions().onSubmit();

  const state = harness.app.getState();
  assert.equal(state.view, "result");
  assert.equal(state.analysis.card, card);
  assert.equal(state.analysis.duration, 12);
  assert.equal(state.recording, null, "the result page must not keep recording resources");
  assert.ok(harness.revoked.includes("blob:submit"));
  assert.deepEqual(harness.pages.slice(-2).map((page) => page.name), [
    "processing",
    "result",
  ]);
});

test("analysis failures return to the ready experience for a retry", async (t) => {
  const harness = createHarnessWithFailingAnalysis();
  t.after(harness.restore);

  await harness.actions().onStart();
  await harness.actions().onStop();
  await harness.actions().onSubmit();

  const state = harness.app.getState();
  assert.equal(state.view, "experience");
  assert.equal(state.recordingStatus, "ready");
  assert.match(state.error, /暫時無法分析/);
  assert.ok(state.recording, "the recording should be kept for a retry");
});

test("a shared result URL boots straight into the shared result page", (t) => {
  const sharedResult = {
    card: { id: "night-keeper" },
    portrait: { axes: [] },
  };
  const harness = createHarness({ sharedResult });
  t.after(harness.restore);

  const state = harness.app.getState();
  assert.equal(state.view, "result");
  assert.equal(state.analysis.card.id, "night-keeper");
  assert.equal(state.analysis.shared, true);
  assert.equal(harness.pages[0].name, "result");
});

test("finishing an analysis writes the result URL; reset clears it", async (t) => {
  const shareUrlWrites = [];
  const harness = createHarness({
    recording: { blob: new Blob(["audio"]), duration: 12, url: "blob:url" },
    shareUrlWrites,
  });
  t.after(harness.restore);

  await harness.actions().onStart();
  await harness.actions().onStop();
  await harness.actions().onSubmit();

  assert.equal(shareUrlWrites.length, 1);
  assert.equal(shareUrlWrites[0], harness.app.getState().analysis);

  const resultPage = harness.pages.at(-1);
  resultPage.actions.onReset();
  assert.equal(shareUrlWrites.at(-1), "cleared");
  assert.equal(harness.app.getState().view, "experience");
});

test("the experience page receives the recording duration cap", async (t) => {
  const harness = createHarness();
  t.after(harness.restore);

  assert.equal(harness.pages[0].options.maxDurationSeconds, MAX_RECORDING_SECONDS);
});

function createHarnessWithFailingAnalysis() {
  const pages = [];
  const revoked = [];
  const originalRevoke = URL.revokeObjectURL;
  URL.revokeObjectURL = (url) => revoked.push(url);
  let experienceActions = null;
  const fakePage = { destroy() {}, setProgress() {}, updateLevel() {}, updateTime() {} };

  const app = createApp({}, {
    createRecorder: () => ({
      async start() {},
      async stop() {
        return { blob: new Blob(["audio"]), duration: 12, url: "blob:retry" };
      },
      cancel() {},
    }),
    decodeAudioBlob: async () => ({ fake: "audioBuffer" }),
    assessAudioQuality: () => ({ valid: true, lowSignal: false }),
    runVoiceAnalysis: async () => {
      throw new Error("analysis failed");
    },
    selectVoiceCard: () => ({ id: "unused" }),
    mountExperiencePage: (root, state, actions) => {
      pages.push({ name: "experience", state });
      experienceActions = actions;
      return fakePage;
    },
    mountProcessingPage: () => {
      pages.push({ name: "processing" });
      return fakePage;
    },
    mountResultPage: () => fakePage,
  });

  app.start();
  return {
    app,
    pages,
    revoked,
    actions: () => experienceActions,
    restore() {
      URL.revokeObjectURL = originalRevoke;
    },
  };
}
