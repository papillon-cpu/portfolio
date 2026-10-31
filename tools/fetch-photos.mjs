// Скачивает отобранные свободные фотографии Wikimedia Commons в папки работ и пишет site/credits.json (автор, лицензия, ссылка).
// Запуск: node tools/fetch-photos.mjs   (нужна сеть; уже скачанные файлы пропускаются)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const cands = JSON.parse(readFileSync(path.join(ROOT, "tools/commons-candidates.json"), "utf8"));
const UA = "NikitaPortfolio/0.1 (personal portfolio build; https://github.com/papillon-cpu)";

// работа → { файл: номер в commons-candidates.json }
const PLAN = {
  "taganay-expedition": { "hero.jpg": 9, "vista.jpg": 8, "day-1.jpg": 34, "day-2.jpg": 42, "day-3.jpg": 64, "day-4.jpg": 68, "camp.jpg": 11, "faq.jpg": 14, "mist.jpg": 164, "g-1.jpg": 15, "g-2.jpg": 85, "g-3.jpg": 154 },
};

const credits = {};
for (const [work, files] of Object.entries(PLAN)) {
  const dir = work === "hub" ? path.join(ROOT, "site/assets/img") : path.join(ROOT, "site/works", work, "assets/img");
  mkdirSync(dir, { recursive: true });
  for (const [name, idx] of Object.entries(files)) {
    const c = cands[idx];
    if (!c) throw new Error(`нет кандидата ${idx}`);
    const dest = path.join(dir, name);
    credits[c.title] ??= { title: c.title.replace(/^File:/, ""), author: c.artist || "автор указан на странице файла", license: c.license, licenseUrl: c.licenseUrl, page: c.page, uses: [] };
    credits[c.title].uses.push(`${work}/${name}`);
    if (existsSync(dest)) continue;
    for (let attempt = 1; attempt <= 4; attempt++) {
      const r = await fetch(c.thumb, { headers: { "user-agent": UA } });
      if (r.ok) {
        writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
        console.log("ok", work, name);
        break;
      }
      console.log("повтор", r.status, work, name);
      await new Promise((res) => setTimeout(res, 2500 * attempt));
      if (attempt === 4) throw new Error(`не скачалось ${work}/${name}: ${r.status}`);
    }
    await new Promise((res) => setTimeout(res, 400));
  }
}
writeFileSync(path.join(ROOT, "site/credits.json"), JSON.stringify(Object.values(credits), null, 1));
console.log("авторов и лицензий записано:", Object.keys(credits).length);
