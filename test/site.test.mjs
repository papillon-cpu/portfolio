import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SITE = path.resolve(new URL("../site/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(path.join(dir, n)).isDirectory() ? walk(path.join(dir, n)) : [path.join(dir, n)]));
const files = walk(SITE);
const text = (f) => readFileSync(f, "utf8");
const pages = files.filter((f) => f.endsWith(".html"));
// «Белогорье» и «Меридиан» оставлены в исходном виде: в них стоковые материалы и образцовые данные курса.
const ORIGINAL = /[\\/]works[\\/](belogorye|meridian)[\\/]/;
const ours = (list) => list.filter((f) => !ORIGINAL.test(f));

function localRefs(file) {
  const src = text(file);
  const out = [];
  for (const m of src.matchAll(/\b(?:href|src|srcset|data-src|poster)=["']([^"']+)["']/gi)) out.push(m[1]);
  for (const m of src.matchAll(/url\(["']?([^)"']+)["']?\)/gi)) out.push(m[1]);
  return out
    .map((r) => r.split(/[?#]/)[0].trim())
    .filter((r) => r && !/^(https?:|mailto:|tel:|data:|javascript:|\/\/|%23|%3C)/i.test(r));
}

test("сайт: все локальные ссылки, картинки и стили существуют", () => {
  const missing = [];
  for (const f of [...pages, ...files.filter((x) => x.endsWith(".css"))]) {
    for (const ref of localRefs(f)) {
      const target = path.resolve(path.dirname(f), ref);
      const p = existsSync(target) && statSync(target).isDirectory() ? path.join(target, "index.html") : target;
      if (!existsSync(p)) missing.push(`${path.relative(SITE, f)} -> ${ref}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("сайт: картинки, которые «Меридиан» подставляет скриптом (карточки и галереи маршрутов), существуют", () => {
  const js = text(path.join(SITE, "works/meridian/assets/js/main.js"));
  const imgs = [...js.matchAll(/assets\/img\/[\w./-]+\.jpg/g)].map((m) => m[0]);
  assert.ok(imgs.length >= 6, "в скрипте не нашлись пути к картинкам");
  const keys = [...js.matchAll(/^\s{6}(\w+): \{\s*\n\s+img:/gm)].map((m) => m[1]);
  for (const k of keys) for (const i of [1, 2, 3]) imgs.push(`assets/img/routes/gal-${k}-${i}.jpg`);
  const bad = [...new Set(imgs)].filter((i) => !existsSync(path.join(SITE, "works/meridian", i)));
  assert.deepEqual(bad, []);
});

test("сайт: в проектах не осталось чужого контента и выдуманных клиентов", () => {
  // Чувствительно к регистру: «ИНН» и «СВЕТЛО» не должны находиться внутри обычных слов («свеТЛО», «ИНН» в «Алексей»...).
  const forbidden = /Пантел|Pantela|Евгений Пантел|vercel\.app|Юнгфрау|Маттерхорн|ТРОПА СЕВЕРА|Тунгуск|Красноярск|[Pp]exels|[Uu]nsplash|(?<![А-Яа-яЁё])ИНН(?![А-Яа-яЁё])|ОГРНИП|Артём Соколов|Кавказ|(?<![А-Яа-яЁё])СВЕТЛО(?![А-Яа-яЁё])/;
  const bad = [];
  for (const f of ours([...pages, ...files.filter((x) => /\.(js|css)$/.test(x) && !/vendor/.test(x))])) {
    const m = text(f).match(forbidden);
    if (m) bad.push(`${path.relative(SITE, f)}: ${m[0]}`);
  }
  assert.deepEqual(bad, []);
});

test("сайт: контакты везде одни и те же, выдуманных телефонов и почты нет", () => {
  const all = ours(pages).map(text).join("\n");
  assert.match(all, /t\.me\/sumashedshii0/);
  assert.doesNotMatch(all, /8 800 000|tel:\+7800|tel:\+79130000000|hello@|ski@|@tropasevera/);
});

test("сайт: у каждой страницы есть title, description и язык", () => {
  const bad = [];
  for (const f of pages) {
    const s = text(f);
    if (!/<html[^>]+lang="ru"/.test(s)) bad.push(path.relative(SITE, f) + ": нет lang");
    if (!/<title>[^<]{5,}<\/title>/.test(s)) bad.push(path.relative(SITE, f) + ": нет title");
  }
  assert.deepEqual(bad, []);
});

test("фото: у каждой картинки есть запись об авторе и лицензии, только свободные лицензии", () => {
  const credits = JSON.parse(text(path.join(SITE, "credits.json")));
  const usedFiles = ours(files).filter((f) => /\/assets\/img\/(?!cover-|nikita)[^/]+\.jpg$/.test(f.replace(/\\/g, "/")));
  const credited = new Set(credits.flatMap((c) => c.uses));
  const unaccounted = usedFiles
    .map((f) => path.relative(SITE, f).replace(/\\/g, "/"))
    .map((r) => (r.startsWith("works/") ? r.replace(/^works\/([^/]+)\/assets\/img\//, "$1/") : r.replace(/^assets\/img\//, "hub/")))
    .filter((r) => !credited.has(r));
  assert.deepEqual(unaccounted, []);
  for (const c of credits) {
    assert.match(c.license, /^(CC BY(-SA)?|CC0|Public domain|PD)/i, c.title);
    assert.ok(c.author, c.title);
  }
});

test("сайт: все четыре работы отмечены как демонстрационные", () => {
  for (const w of ["taganay-expedition", "belogorye", "meridian", "assistant"]) {
    const s = text(path.join(SITE, "works", w, "index.html"));
    assert.match(s, /[Дд]емо/, w);
  }
});

test("хаб: нет сведений о том, где живёт и откуда работает автор", () => {
  const hub = text(path.join(SITE, "index.html"));
  assert.doesNotMatch(hub, /Златоуст|Челябинск|Урал(?!ьск)|живу|откуда работаю/i);
});

test("хаб: на главной нет фотографии автора или пейзажа (только карточки работ)", () => {
  const hub = text(path.join(SITE, "index.html"));
  const imgs = [...hub.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(imgs.length > 0 && imgs.every((s) => /assets\/img\/(cover-|nikita\.jpg)/.test(s)), imgs.join(", "));
});

// Пока в портрете стоит серая заглушка (меньше 20 КБ), проверка помечена как «todo»: положите настоящее фото в site/assets/img/nikita.jpg.
const portraitSize = statSync(path.join(SITE, "assets/img/nikita.jpg")).size;
test("хаб: вместо серой заглушки лежит настоящее фото автора", { todo: portraitSize < 20000 }, () => {
  assert.ok(portraitSize >= 20000, "в site/assets/img/nikita.jpg всё ещё заглушка");
});

test("хаб: нет жёлтой бегущей строки и дублирующего раздела «Работы», есть переключатель темы", () => {
  const hub = text(path.join(SITE, "index.html"));
  assert.doesNotMatch(hub, /class="ticker"|id="works" *>s*<h2|data-filter=/);
  assert.match(hub, /id="theme"/);
  assert.equal((hub.match(/class="card3d"/g) || []).length, 4);
});

test("помощник: палитра «хвоя и мята», лаймового акцента не осталось", () => {
  const css = text(path.join(SITE, "works/assistant/assets/style.css"));
  assert.match(css, /--accent: #7fe3b0/);
  assert.doesNotMatch(css, /c8f542/i);
});

test("хаб: в подвале нет колонки «Работы» (работы лежат на «полке» наверху)", () => {
  const hub = text(path.join(SITE, "index.html"));
  const footer = hub.slice(hub.indexOf('<footer class="footer">'));
  assert.doesNotMatch(footer, /<h4>Работы<\/h4>/);
  assert.doesNotMatch(footer, /works\/taganay-expedition/);
});

test("хаб: подвал по образцу: призыв, две кнопки, нижняя полоса, без чужих реквизитов", () => {
  const hub = text(path.join(SITE, "index.html"));
  const footer = hub.slice(hub.indexOf('<footer class="footer"'));
  assert.match(footer, /Обсудим ваш проект\?/);
  assert.equal((footer.match(/class="btn btn--/g) || []).length, 2);
  assert.match(footer, /footer__bar[\s\S]*Telegram[\s\S]*Работы[\s\S]*Источники фотографий/);
  assert.doesNotMatch(footer, /ИНН|ОГРНИП|Красноярск/);
  // единственный адрес почты в подвале: свой
  assert.deepEqual([...new Set(footer.match(/[\w.-]+@[\w.-]+\.\w+/g) || [])], ["nkutylov@yandex.ru"]);
});

test("хаб: нет строки «Четыре демо-проекта…» над заголовком", () => {
  assert.doesNotMatch(text(path.join(SITE, "index.html")), /hero__proof|Четыре демо-проекта/);
});
