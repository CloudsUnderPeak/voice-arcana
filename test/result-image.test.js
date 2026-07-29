import test from "node:test";
import assert from "node:assert/strict";
import { resultImageFilename } from "../src/ui/result-image.js";

test("result image filename identifies the selected card and PNG format", () => {
  assert.equal(
    resultImageFilename({ id: "night-keeper" }),
    "voice-arcana-night-keeper.png",
  );
});
