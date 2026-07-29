import test from "node:test";
import assert from "node:assert/strict";
import { clamp01, mean, scale, standardDeviation } from "../src/utils/math.js";

test("clamp01 keeps normalized values finite", () => {
  assert.equal(clamp01(-2), 0);
  assert.equal(clamp01(0.42), 0.42);
  assert.equal(clamp01(3), 1);
  assert.equal(clamp01(Number.NaN), 0);
});

test("scale maps a range to zero and one", () => {
  assert.equal(scale(10, 10, 20), 0);
  assert.equal(scale(15, 10, 20), 0.5);
  assert.equal(scale(30, 10, 20), 1);
});

test("mean and standard deviation handle short inputs", () => {
  assert.equal(mean([]), 0);
  assert.equal(mean([2, 4, 6]), 4);
  assert.equal(standardDeviation([3]), 0);
  assert.ok(Math.abs(standardDeviation([2, 4, 6]) - 1.63299) < 0.0001);
});

