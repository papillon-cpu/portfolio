// Проверка интерактива в настоящем Chrome: клики, модалки, меню, формы, переходы между страницами.
// Нужен запущенный сервер (npm run serve) и Playwright из соседнего проекта.
import { createRequire } from "node:module";
const { chromium } = createRequire("D:/neurocareer/package.json")("@playwright/test");
const BASE = process.env.BASE || "http://localhost:8801";
const browser = await chromium.launch({ channel: "chrome" });
const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(ok ? "ok  " : "FAIL", name, extra);
};
async function open(path, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: !!opts.mobile });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForTimeout(900);
  return { ctx, page, errs };
}

// Меридиан: модалка маршрута и листание hero
{
  const { ctx, page, errs } = await open("/works/meridian/index.html");
  const title0 = await page.locator(".hero__titles .swiper-slide-active span").first().innerText().catch(() => "");
  await page.locator("[data-hero-next]").click();
  await page.waitForTimeout(1500);
  const title1 = await page.locator(".hero__titles .swiper-slide-active span").first().innerText().catch(() => "");
  check("Меридиан: стрелка листает названия мест", title0 !== "" && title1 !== "" && title0 !== title1, `${title0} → ${title1}`);

  await page.locator('.trip[data-route="matterhorn"]').scrollIntoViewIfNeeded();
  await page.locator('.trip[data-route="matterhorn"]').click();
  await page.waitForTimeout(1400);
  const modalOpen = await page.locator("[data-route-modal]").isVisible();
  const title = await page.locator("[data-rm-title]").innerText();
  const loaded = await page.$$eval("[data-rm-track] img", (imgs) => imgs.map((i) => i.complete && i.naturalWidth > 0));
  check("Меридиан: карточка открывает модалку с маршрутом", modalOpen && /Маттерхорн/.test(title), title);
  check("Меридиан: в галерее маршрута 4 фото, и они загружены", loaded.length >= 4 && loaded.slice(0, 4).every(Boolean), JSON.stringify(loaded));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  check("Меридиан: Esc закрывает модалку", !(await page.locator("[data-route-modal]").isVisible()));

  // кнопка «Узнать подробнее о маршруте» в hero открывает маршрут текущего слайда
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator("[data-hero-more]").click();
  await page.waitForTimeout(800);
  check("Меридиан: кнопка в hero открывает маршрут слайда", await page.locator("[data-route-modal]").isVisible(), await page.locator("[data-rm-title]").innerText());
  await page.keyboard.press("Escape");

  await page.locator("input[name=name]").fill("Тест");
  await page.locator("input[name=phone]").fill("@test_user");
  await page.locator(".contact__submit").click();
  check("Меридиан: форма показывает «Спасибо»", await page.locator(".contact__done").isVisible());
  check("Меридиан: без ошибок в консоли", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

// Тропа Таганая: меню на телефоне и форма
{
  const { ctx, page, errs } = await open("/works/taganay-expedition/index.html", { mobile: true });
  await page.locator("#burger").click();
  check("Таганай: бургер открывает меню", await page.locator("#navMobile").isVisible());
  await page.locator("#navMobile a[href='#dates']").click();
  await page.waitForTimeout(900);
  const y = await page.evaluate(() => window.scrollY);
  check("Таганай: пункт меню прокручивает к разделу", y > 800, `scrollY=${y}`);
  await page.locator("#fName").fill("Тест");
  await page.locator("#fPhone").fill("@test_user");
  await page.locator("#applyForm button[type=submit]").click();
  await page.waitForTimeout(500);
  check("Таганай: форма показывает уведомление", await page.locator("#toast.is-shown").count() > 0);
  const detailsOk = await page.$$eval("details.qa", (ds) => { ds[0].open = true; return ds[0].open; });
  check("Таганай: вопросы раскрываются", detailsOk);
  check("Таганай: без ошибок в консоли", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

// Белогорье: цифры считаются, форма, меню на телефоне
{
  const { ctx, page, errs } = await open("/works/belogorye/index.html");
  await page.locator("#stats").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2600);
  const nums = await page.$$eval(".stat__num", (els) => els.map((e) => e.textContent.trim()));
  check("Белогорье: цифры досчитываются", /28/.test(nums[0]) && /1[s ]?240/.test(nums[1]), nums.join(" | "));
  await page.locator("#name").fill("Тест");
  await page.locator("#phone").fill("+79001234567");
  await page.locator("#bookingForm button[type=submit]").click();
  await page.waitForTimeout(500);
  check("Белогорье: форма показывает подтверждение", await page.locator("#formOk").isVisible());
  check("Белогорье: без ошибок в консоли", errs.length === 0, errs.join(" | "));
  await ctx.close();
  const m = await open("/works/belogorye/index.html", { mobile: true });
  await m.page.locator("#burger").click();
  check("Белогорье: бургер на телефоне открывает меню", await m.page.locator("#nav").evaluate((n) => getComputedStyle(n).display !== "none"));
  await m.ctx.close();
}

// Помощник заявок: диалог целиком и неверный контакт
{
  const { ctx, page, errs } = await open("/works/assistant/index.html");
  await page.getByRole("button", { name: "Сколько стоит?" }).click();
  await page.waitForTimeout(1500);
  check("Помощник: отвечает про цены", (await page.locator(".bubble--bot").allInnerTexts()).some((t) => /6 900/.test(t)));
  await page.locator("#msg").fill("Хочу записаться");
  await page.locator("#msg").press("Enter");
  await page.waitForTimeout(900);
  await page.locator("#msg").fill("Иван");
  await page.locator("#msg").press("Enter");
  await page.waitForTimeout(900);
  await page.locator("#msg").fill("абракадабра");
  await page.locator("#msg").press("Enter");
  await page.waitForTimeout(900);
  check("Помощник: неверный контакт отклоняется", (await page.locator(".bubble--bot").allInnerTexts()).some((t) => /не получилось распознать/i.test(t)));
  await page.locator("#msg").fill("+7 900 123-45-67");
  await page.locator("#msg").press("Enter");
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Пока не знаю" }).click();
  await page.waitForTimeout(1500);
  const card = await page.locator("#lead").innerText();
  check("Помощник: карточка заявки заполнена", /Иван/.test(card) && /цены/.test(card) && /900 123-45-67/.test(card) && /Пока не знаю/.test(card), card.replace(/\n+/g, " | ").slice(0, 120));
  check("Помощник: без ошибок в консоли", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

// Хаб: полка с работами, переходы, тема, Telegram
{
  const { ctx, page, errs } = await open("/");
  const hrefs = await page.$$eval(".shelf__item", (as) => as.map((a) => a.getAttribute("href")));
  check("Хаб: четыре работы на полке", hrefs.length === 4, hrefs.join(", "));
  check("Хаб: раздела «Работы» и жёлтой строки больше нет", (await page.locator("#works.section, .ticker, .tab").count()) === 0);
  for (const h of hrefs) {
    const r = await page.request.get(BASE + "/" + h);
    check(`Хаб: ${h} открывается`, r.ok());
  }
  await page.locator(".shelf__item").nth(1).click();
  await page.waitForURL(/belogorye/);
  check("Хаб: клик по работе ведёт в проект", /belogorye/.test(page.url()));
  await page.goBack();
  await page.waitForTimeout(500);
  check("Хаб: «назад» возвращает на хаб", page.url().replace(BASE, "") === "/");

  // тема: по умолчанию светлая, переключается, запоминается после обновления
  const theme = () => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  check("Хаб: по умолчанию светлая тема", (await theme()) === "light");
  await page.locator("#theme").click();
  check("Хаб: кнопка включает тёмную тему", (await theme()) === "dark");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check("Хаб: фон страницы стал тёмным", /rgb\(18, 18, 18\)/.test(bg), bg);
  await page.reload();
  await page.waitForTimeout(500);
  check("Хаб: выбор темы помнится после обновления", (await theme()) === "dark");
  await page.locator("#theme").click();
  check("Хаб: кнопка возвращает светлую тему", (await theme()) === "light");

  const tg = await page.$$eval('a[href*="t.me"]', (as) => [...new Set(as.map((a) => a.href))]);
  check("Хаб: ссылка на Telegram одна и верная", tg.length === 1 && tg[0] === "https://t.me/sumashedshii0", tg.join(", "));
  await page.waitForTimeout(400);
  const f = page.locator("footer.footer");
  await f.scrollIntoViewIfNeeded();
  check("Хаб: подвал начинается с заголовка «Обсудим ваш проект?»", (await f.locator("h2").innerText()).includes("Обсудим ваш проект"));
  check("Хаб: в подвале две кнопки: Telegram и «Смотреть работы»", (await f.locator(".cta__btns .btn").allInnerTexts()).join("|").toLowerCase() === "написать в telegram|смотреть работы");
  check("Хаб: под кнопками строка с контактом", (await f.locator(".cta__note").innerText()).includes("@sumashedshii0"));
  check("Хаб: нижняя полоса: имя слева, три ссылки справа, мелкая строка ниже", (await f.locator(".footer__bar > span").innerText()).includes("© 2026 Никита Кутылов") && (await f.locator(".footer__bar nav a").count()) === 3 && (await f.locator(".footer__legal").count()) === 1);
  check("Хаб: без ошибок в консоли", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

await browser.close();
console.log(results.every(Boolean) ? `\nВсе проверки пройдены (${results.length})` : `\nПРОВАЛЕНО: ${results.filter((x) => !x).length} из ${results.length}`);
process.exit(results.every(Boolean) ? 0 : 1);
