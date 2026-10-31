// Собирает site/credits.html из site/credits.json: автор, лицензия и ссылка на страницу файла для каждой фотографии.
import { readFileSync, writeFileSync } from "node:fs";
const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const list = JSON.parse(readFileSync(ROOT + "site/credits.json", "utf8"));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const safe = (u) => (/^https?:\/\//i.test(u) ? u : "");

const rows = list
  .map(
    (c) => `<tr>
  <td>${safe(c.page) ? `<a href="${esc(safe(c.page))}" target="_blank" rel="noopener">${esc(c.title)}</a>` : esc(c.title)}</td>
  <td>${esc(c.author)}</td>
  <td>${safe(c.licenseUrl) ? `<a href="${esc(safe(c.licenseUrl))}" target="_blank" rel="noopener">${esc(c.license)}</a>` : esc(c.license)}</td>
</tr>`,
  )
  .join("\n");

writeFileSync(
  ROOT + "site/credits.html",
  `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Источники фотографий — портфолио Никиты Кутылова</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Lora:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/hub.css?v=1">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2316181a'/%3E%3C/svg%3E">
<style>
.credits{max-width:980px;margin:0 auto;padding:48px max(20px,5vw) 72px}
.credits table{width:100%;border-collapse:collapse;font-size:15px;margin-top:24px}
.credits th,.credits td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.credits th{color:var(--mute);font-weight:500;font-size:13px}
.credits td:first-child{overflow-wrap:anywhere}
</style></head>
<body>
<div class="credits">
  <p class="eyebrow"><a href="index.html" style="text-decoration:none">← Портфолио</a></p>
  <h1 style="font-size:clamp(30px,5vw,48px)">Источники фотографий</h1>
  <p class="lead">Все фотографии в демонстрационных проектах взяты с Wikimedia Commons и распространяются по свободным лицензиям (CC BY, CC BY-SA или общественное достояние). Размер файлов уменьшен для сайта, содержание не менялось. Ниже автор и лицензия каждого снимка.</p>
  <table>
    <thead><tr><th>Файл на Commons</th><th>Автор</th><th>Лицензия</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
</div>
</body></html>
`,
);
console.log("credits.html:", list.length, "фотографий");
