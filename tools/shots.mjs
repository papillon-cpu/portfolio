// Проверка и обложки: открывает каждую страницу в настоящем Chrome, собирает ошибки и делает скриншоты.
// Нужен запущенный сервер на папке site (по умолчанию http://localhost:8801) и Playwright из соседнего проекта.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const { chromium } = createRequire("D:/neurocareer/package.json")("@playwright/test");
const BASE = process.env.BASE || "http://localhost:8801";
const OUT = "D:/portfolio/site/assets/img/";
const SHOTS = "D:/sandbox/portfolio-shots/";
mkdirSync(SHOTS, { recursive: true });

const pages = [
  ["hub", "/", null],
  ["taganay", "/works/taganay-expedition/index.html", "cover-taganay.jpg"],
  ["belogorye", "/works/belogorye/index.html", "cover-belogorye.jpg"],
  ["meridian", "/works/meridian/index.html", "cover-meridian.jpg"],
  ["assistant", "/works/assistant/index.html", "cover-assistant.jpg"],
  ["credits", "/credits.html", null],
];

const browser = await chromium.launch({ channel: "chrome" });
let problems = 0;
for (const [name, url, cover] of pages) {
  for (const mobile of [false, true]) {
    const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: mobile });
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    page.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text()));
    page.on("requestfailed", (r) => !/fonts\.g/.test(r.url()) && errs.push("failed: " + r.url().slice(0, 90)));
    page.on("response", (r) => r.status() >= 400 && !/fonts\.g/.test(r.url()) && errs.push(r.status() + " " + r.url().slice(0, 90)));
    await page.goto(BASE + url, { waitUntil: "load" });
    await page.waitForTimeout(1800);
    // разовая прокрутка до конца: ленивые картинки и блоки reveal
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
    const hOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (name === "assistant" && !mobile) {
      await page.getByRole("button", { name: "Записаться" }).click();
      await page.waitForTimeout(900);
      await page.locator("#msg").fill("Алексей");
      await page.locator("#msg").press("Enter");
      await page.waitForTimeout(1200);
      await page.locator("#msg").fill("@alex_demo");
      await page.locator("#msg").press("Enter");
      await page.waitForTimeout(1200);
      await page.getByRole("button", { name: "Классика (3 дня)" }).click();
      await page.waitForTimeout(1400);
      await page.evaluate(() => window.scrollTo(0, document.querySelector("#demo").getBoundingClientRect().top + window.scrollY - 84));
      await page.waitForTimeout(300);
    }
    const tag = mobile ? "m" : "d";
    await page.screenshot({ path: `${SHOTS}${name}-${tag}.png` });
    if (cover && !mobile) await page.screenshot({ path: OUT + cover, type: "jpeg", quality: 82, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log(`${name} ${tag}: ошибок ${errs.length}, горизонтальный скролл ${hOverflow}px`, errs.slice(0, 4));
    problems += errs.length + (hOverflow > 2 ? 1 : 0);
    await ctx.close();
  }
}
await browser.close();
console.log(problems ? `ПРОБЛЕМ: ${problems}` : "проблем нет");
