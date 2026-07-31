import test from "node:test";
import assert from "node:assert/strict";
import { createSessionStore } from "../src/app/session-store.js";

test("setState merges known keys and notifies subscribers", () => {
  const store = createSessionStore();
  const seen = [];
  const unsubscribe = store.subscribe((state) => seen.push(state));

  store.setState({ recordingStatus: "recording" });
  assert.equal(store.getState().recordingStatus, "recording");
  assert.equal(store.getState().view, "experience");
  assert.equal(seen.length, 1);

  unsubscribe();
  store.setState({ error: "測試" });
  assert.equal(seen.length, 1);
});

test("setState rejects unknown state keys", () => {
  const store = createSessionStore();
  assert.throws(() => store.setState({ recordignStatus: "typo" }), /Unknown session state key/);
});

test("reset restores the initial state", () => {
  const store = createSessionStore();
  store.setState({ view: "result", error: "x" });
  store.reset();
  assert.deepEqual(store.getState(), {
    view: "experience",
    recordingStatus: "idle",
    recording: null,
    analysis: null,
    error: "",
  });
});
