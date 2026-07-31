import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "../src/utils/escape-html.js";

test("escapeHtml neutralizes markup-sensitive characters", () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert('1')" & more>`),
    "&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot; &amp; more&gt;",
  );
});

test("escapeHtml keeps ordinary copy untouched", () => {
  assert.equal(escapeHtml("聲音肖像 · Voice Arcana"), "聲音肖像 · Voice Arcana");
  assert.equal(escapeHtml(42), "42");
});
