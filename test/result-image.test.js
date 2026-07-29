import test from "node:test";
import assert from "node:assert/strict";
import {
  canShareResultImage,
  resultImageFilename,
  shareResultImage,
} from "../src/ui/result-image.js";

test("result image filename identifies the selected card and PNG format", () => {
  assert.equal(
    resultImageFilename({ id: "night-keeper" }),
    "voice-arcana-night-keeper.png",
  );
});

test("result image sharing requires both share methods and file support", () => {
  const file = { name: "result.png" };
  assert.equal(canShareResultImage(file, {}), false);
  assert.equal(
    canShareResultImage(file, {
      share() {},
      canShare({ files }) {
        return files[0] === file;
      },
    }),
    true,
  );
});

test("native result sharing sends the PNG and card copy", async () => {
  const file = { name: "result.png" };
  let payload;
  await shareResultImage(file, { name: "守夜人" }, {
    share(value) {
      payload = value;
      return Promise.resolve();
    },
  });
  assert.deepEqual(payload.files, [file]);
  assert.match(payload.title, /守夜人/);
  assert.match(payload.text, /守夜人/);
});
