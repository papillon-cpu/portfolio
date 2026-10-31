// Лист с вариантами цвета главной: открывает хаб с ?p=a..f и собирает один общий скриншот.
import { createRequire } from "node:module";
const { chromium } = createRequire("D:/neurocareer/package.json")("@playwright/test");
const BASE = process.env.BASE || "http://localhost:8801";
const OUT = process.env.OUT || "D:/sandbox/palettes.png";
const variants = [
  ["a", "A · Графит и лайм", "тёмная, как в NEUROCAREER"],
  ["b", "B · Ночной синий и небесный", "тёмная, спокойная"],
  ["c", "C · Хвоя и мята", "тёмная, природная"],
  ["d", "D · Холодный серый и индиго", "светлая, строгая"],
  ["e", "E · Бордо и золото", "тёмная, тёплая"],
  ["f", "F · Шалфей и хвоя", "светлая, мягкая"],
];
const browser = await chromium.launch({ channel: "chrome" });
const tiles = [];
for (const [p, name, note] of variants) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1700 } });
  await page.goto(`${BASE}/?p=${p}`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("in")));
  await page.waitForTimeout(500);
  const buf = await page.screenshot({ type: "jpeg", quality: 85 });
  tiles.push({ p, name, note, src: "data:image/jpeg;base64," + buf.toString("base64") });
  await page.close();
}
const html = `<body style="margin:0;background:#1b1b1d;font:600 22px system-ui;color:#fff">
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:16px;width:1800px">
${tiles.map((t) => `<figure style="margin:0"><div style="padding:6px 4px 10px">${t.name} <span style="font-weight:400;opacity:.6;font-size:16px">— ${t.note}</span></div><div style="height:760px;overflow:hidden;border-radius:12px"><img src="${t.src}" style="width:100%;display:block"></div></figure>`).join("")}
</div></body>`;
const sheet = await browser.newPage({ viewport: { width: 1800, height: 1700 } });
await sheet.setContent(html);
await sheet.waitForTimeout(800);
await sheet.screenshot({ path: OUT, fullPage: true });
await browser.close();
console.log("лист:", OUT);
