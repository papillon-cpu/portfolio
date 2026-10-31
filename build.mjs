// Собирает статичный сайт-портфолио из projects.json. Результат: dist/index.html, его можно выложить куда угодно.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const safeHref = (u) => (/^(https?:\/\/|mailto:|tel:)/i.test(u) ? u : "");
const todo = (what) => `<span class="todo">[ЗАПОЛНИТЬ: ${esc(what)}]</span>`;

export function build(data) {
  const tg = data.telegram ? (data.telegram.startsWith("http") ? data.telegram : `https://t.me/${data.telegram.replace(/^@/, "")}`) : "";
  const cards = data.projects
    .map(
      (p) => `<article class="card"><span class="kind">${esc(p.kind)}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p>
<ul class="tags">${(p.tags || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>${safeHref(p.link) ? `<a href="${esc(safeHref(p.link))}">Посмотреть →</a>` : ""}</article>`,
    )
    .join("\n");
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(data.name || "Портфолио")}: ${esc(data.tagline)}</title><meta name="description" content="${esc(data.tagline)}">
<style>
:root{--bg:#fff;--ink:#14161b;--mute:#5b6272;--line:#e1e4ea;--accent:#2e6b00}
@media (prefers-color-scheme:dark){:root{--bg:#0e0f12;--ink:#eef0f4;--mute:#9aa1b0;--line:#272a32;--accent:#c8f542}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,"Segoe UI",sans-serif}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}
header{padding:72px 0 40px}h1{font-size:clamp(30px,6vw,52px);line-height:1.1;margin:0 0 12px}
.lead{color:var(--mute);font-size:19px;max-width:620px}
.btn{display:inline-block;margin:24px 12px 0 0;background:var(--accent);color:#fff;padding:13px 24px;border-radius:999px;text-decoration:none;font-weight:600}
@media (prefers-color-scheme:dark){.btn{color:#0e0f12}}
section{padding:36px 0;border-top:1px solid var(--line)}h2{margin:0 0 20px;font-size:26px}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.card{border:1px solid var(--line);border-radius:18px;padding:22px}.card h3{margin:6px 0 8px}.card p{color:var(--mute);margin:0 0 12px}
.kind{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);font-weight:700}
.tags{display:flex;flex-wrap:wrap;gap:6px;list-style:none;padding:0;margin:0 0 12px}.tags li{border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:13px;color:var(--mute)}
.card a{color:var(--accent);font-weight:600}
ol{padding-left:20px;color:var(--mute)}.todo{background:#fff3b0;color:#5a4a00;border-radius:6px;padding:0 6px}
footer{padding:28px 0;color:var(--mute);border-top:1px solid var(--line)}
</style></head><body>
<header><div class="wrap"><h1>${data.name ? esc(data.name) : todo("ваше имя")}</h1>
<p class="lead">${esc(data.tagline)}</p>
${tg ? `<a class="btn" href="${esc(tg)}">Написать в Telegram</a>` : `<span class="btn" style="opacity:.6">Написать ${todo("Telegram")}</span>`}</div></header>
<section><div class="wrap"><h2>Работы</h2><div class="grid">${cards}</div></div></section>
<section><div class="wrap"><h2>Как мы работаем</h2><ol><li>Вы описываете задачу, я называю срок и цену.</li><li>Предоплата 50%, затем показываю черновик первого экрана.</li><li>Правки по согласованному объёму, запуск, передача доступов после полной оплаты.</li></ol></div></section>
<footer><div class="wrap">${data.email ? `Почта: <a href="mailto:${esc(data.email)}">${esc(data.email)}</a>` : "Почта " + todo("email")}</div></footer>
</body></html>`;
}

if (process.argv[1]?.endsWith("build.mjs")) {
  const data = JSON.parse(readFileSync(new URL("./projects.json", import.meta.url), "utf8"));
  mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });
  writeFileSync(new URL("./dist/index.html", import.meta.url), build(data));
  console.log("dist/index.html готов");
}
