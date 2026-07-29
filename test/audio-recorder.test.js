import test from "node:test";
import assert from "node:assert/strict";
import { selectMimeType } from "../src/infrastructure/audio/audio-recorder.js";

test("selectMimeType requires a format to be both recordable and playable", () => {
  const MediaRecorderClass = {
    isTypeSupported(type) {
      return type === "audio/webm;codecs=opus" || type === "audio/mp4";
    },
  };
  const audio = {
    canPlayType(type) {
      return type === "audio/mp4" ? "probably" : "";
    },
  };

  assert.equal(selectMimeType(MediaRecorderClass, audio), "audio/mp4");
});

test("selectMimeType uses the browser default when no shared format is known", () => {
  const MediaRecorderClass = {
    isTypeSupported() {
      return true;
    },
  };
  const audio = {
    canPlayType() {
      return "";
    },
  };

  assert.equal(selectMimeType(MediaRecorderClass, audio), "");
});

test("selectMimeType falls back to MP4 for older MediaRecorder implementations", () => {
  const audio = {
    canPlayType(type) {
      return type === "audio/mp4" ? "maybe" : "";
    },
  };

  assert.equal(selectMimeType({}, audio), "audio/mp4");
});
