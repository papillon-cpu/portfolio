import test from "node:test";
import assert from "node:assert/strict";
import { build } from "./build.mjs";

test("портфолио: пустые данные дают видимые пометки, а не выдуманные", () => {
  const html = build({ name: "", tagline: "x", projects: [] });
  assert.match(html, /ЗАПОЛНИТЬ: ваше имя/);
  assert.match(html, /ЗАПОЛНИТЬ: Telegram/);
});
test("портфолио: HTML экранируется, опасные ссылки отбрасываются", () => {
  const html = build({ name: "<b>Я</b>", tagline: "t", telegram: "@me", projects: [{ title: "<img onerror=1>", kind: "k", text: "t", tags: [], link: "javascript:alert(1)" }] });
  assert.doesNotMatch(html, /<img onerror/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /https:\/\/t\.me\/me/);
});
