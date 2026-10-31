// Собирает site/works/meridian/index.html и assets/js/routes.js из данных ниже.
// Запуск: node tools/build-meridian.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const W = ROOT + "site/works/meridian/";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const slides = [
  ["h-dvuglavaya", "Двуглавая сопка и Откликной гребень", "ДВУГЛАВАЯ СОПКА", "dvuglavaya"],
  ["h-otklik", "Откликной гребень над лесом", "ОТКЛИКНОЙ ГРЕБЕНЬ", "otklik"],
  ["h-skazok", "Вид с Долины сказок", "ДОЛИНА СКАЗОК", "skazok"],
  ["h-kruglitsa", "Откликной гребень и гора Круглица", "КРУГЛИЦА", "kruglitsa"],
  ["h-dalniy", "Хребет Дальний Таганай", "ДАЛЬНИЙ ТАГАНАЙ", "dalniy"],
  ["h-mitkiny", "Вершина Митькиных скал на рассвете", "МИТЬКИНЫ СКАЛЫ", "otklik"],
  ["h-perya", "Скалы «Перья» осенью", "ПЕРЬЯ", "dvuglavaya"],
  ["h-sredniy", "Хребет Средний Таганай с Двуглавой сопки", "СРЕДНИЙ ТАГАНАЙ", "dvuglavaya"],
  ["h-priyut", "Горный приют под звёздами", "ПРИЮТ", "zima"],
  ["h-meteo", "Бывшая метеостанция на Дальнем Таганае", "МЕТЕОСТАНЦИЯ", "dalniy"],
  ["h-osen", "Откликной гребень осенью", "ОСЕНЬ", "otklik"],
  ["h-zima", "Зимний Таганай", "ЗИМА", "zima"],
];

const routes = {
  dvuglavaya: {
    img: "assets/img/h-dvuglavaya.jpg", tag: "Двуглавая сопка",
    title: "Двуглавая сопка: по лестнице над лесом",
    meta: "1 день · круглый год · группа до 8 · сложность средняя", price: "от 3 900 ₽ (условно)",
    lead: "Гора в южной части хребта Большой Таганай. К вершине ведёт деревянная лестница из двух сотен ступеней, а наверху открываются Откликной гребень, долина и скалы «Перья». Высота вершины около 1040 метров.",
    days: ["Встреча в Златоусте, переезд к входу в парк и лесная тропа до стоянки «Белый ключ»", "Подъём по оборудованной лестнице к вершине, вид на Откликной гребень", "Переход к скалам «Перья» и «Скалодром», фотопауза и перекус", "Спуск по той же тропе и возвращение в Златоуст к вечеру"],
    incl: ["Гид на весь день", "Разбор снаряжения до выхода", "Горячий чай и перекус на привале", "Помощь с оформлением входа в парк", "Запас времени на случай плохой погоды"],
  },
  otklik: {
    img: "assets/img/h-otklik.jpg", tag: "Откликной гребень",
    title: "Откликной гребень и Митькины скалы",
    meta: "2 дня · лето и осень · группа до 8 · сложность выше средней", price: "от 11 900 ₽ (условно)",
    lead: "Один из самых узнаваемых гребней Таганая, около 1155 метров. Идём к Митькиным скалам, ночуем рядом и поднимаемся на гребень, откуда видны Двуглавая сопка и долина. На рассвете у скал особенно красиво.",
    days: ["Выход из Златоуста, лесная тропа и каменистые участки до стоянки у подножия", "Ночёвка рядом с гребнем, вечерний чай и разбор плана на утро", "Подъём к Митькиным скалам и на гребень, вид на хребты и долину", "Спуск к началу тропы и возвращение в Златоуст"],
    incl: ["Гид на оба дня", "Групповая палатка и горелки", "Горячее питание на привалах", "Помощь с оформлением входа в парк", "Запасной день в плане на погоду"],
  },
  skazok: {
    img: "assets/img/h-skazok.jpg", tag: "Долина сказок",
    title: "Долина сказок: спокойный выход на день",
    meta: "1 день · круглый год · группа до 10 · сложность лёгкая", price: "от 2 900 ₽ (условно)",
    lead: "Спокойный маршрут с открытыми видами и причудливыми скалами. Подходит для первого знакомства с парком, для семей с детьми, которые уже ходят пешком, и для тех, кто хочет без спешки выйти из города.",
    days: ["Встреча в Златоусте и переезд к началу тропы", "Неспешный подъём с остановками на смотровых местах", "Привал на поляне, горячий чай и свободное время для фото", "Возвращение в Златоуст до темноты"],
    incl: ["Гид и план выхода", "Горячий чай и перекус", "Короткий инструктаж по тропе и погоде", "Помощь с оформлением входа в парк", "Возвращение в Златоуст в тот же день"],
  },
  kruglitsa: {
    img: "assets/img/h-kruglitsa.jpg", tag: "Круглица",
    title: "Круглица: высшая точка парка",
    meta: "2 дня · лето и осень · группа до 8 · сложность высокая", price: "от 13 900 ₽ (условно)",
    lead: "Гора Круглица, около 1178 метров, считается высшей точкой национального парка. Её хорошо видно с Откликного гребня. Подъём длинный, поэтому идём только в устойчивую погоду и с запасом времени.",
    days: ["Выход из Златоуста и переход по лесной тропе до стоянки", "Ночёвка и разбор плана подъёма на утро", "Подъём на вершину, панорама хребтов и спуск к стоянке", "Возвращение к началу тропы и в Златоуст"],
    incl: ["Гид на оба дня", "Групповая палатка и горелки", "Горячее питание на привалах", "Помощь с оформлением входа в парк", "Решение по маршруту принимаем по погоде на месте"],
  },
  dalniy: {
    img: "assets/img/h-dalniy.jpg", tag: "Дальний Таганай",
    title: "Дальний Таганай и бывшая метеостанция",
    meta: "5 дней · лето и осень · группа до 8 · сложность высокая", price: "от 21 900 ₽ (условно)",
    lead: "Многодневный выход на север хребта к вершине Дальнего Таганая (около 1146 метров) и зданию бывшей метеостанции «Таганай-гора». Ночёвки в приюте, возвращение по знакомой тропе. Идём только при устойчивой погоде.",
    days: ["Выезд из Златоуста, вход в парк и переход к первой стоянке", "Переход вдоль хребта с остановками на смотровых точках", "Выход к Дальнему Таганаю и ночёвка в приюте", "Подъём к метеостанции, панорама и фотопауза", "Возвращение к началу тропы и в Златоуст"],
    incl: ["Гид на весь выход", "Ночёвки в приюте и палатке", "Горячее питание", "Помощь с оформлением входа в парк", "Запасной день на погоду"],
  },
  zima: {
    img: "assets/img/h-zima.jpg", tag: "Зимний Таганай",
    title: "Зимний Таганай: ночёвка в приюте",
    meta: "2 дня · зима · группа до 6 · сложность выше средней", price: "от 9 900 ₽ (условно)",
    lead: "Зимой тот же Таганай становится другим: снег на скалах, рассветы над хребтами и тишина. Идём короткой версией, ночуем в приюте и возвращаемся до темноты второго дня. Опыт зимних выходов желателен.",
    days: ["Выход из Златоуста утром, снегоступы или лыжи по состоянию тропы", "Вечер в приюте, горячий ужин и разбор плана на утро", "Рассвет на смотровом месте и спуск до заката", "Возвращение в Златоуст"],
    incl: ["Гид на оба дня", "Ночёвка в приюте или палатке по прогнозу", "Горячее питание", "Помощь с подбором зимнего снаряжения", "Перенос выхода при штормовом предупреждении"],
  },
};

const tripCards = [
  ["dvuglavaya", "h-dvuglavaya", "Двуглавая сопка", "Двуглавая сопка: по лестнице над лесом", "1 день — круглый год — группа до 8", "от 3 900 ₽"],
  ["otklik", "h-otklik", "Откликной", "Откликной гребень и Митькины скалы", "2 дня — лето и осень — группа до 8", "от 11 900 ₽"],
  ["skazok", "h-skazok", "Долина сказок", "Долина сказок: спокойный выход на день", "1 день — круглый год — группа до 10", "от 2 900 ₽"],
  ["kruglitsa", "h-kruglitsa", "Круглица", "Круглица: высшая точка парка", "2 дня — лето и осень — группа до 8", "от 13 900 ₽"],
  ["dalniy", "h-dalniy", "Дальний Таганай", "Дальний Таганай и бывшая метеостанция", "5 дней — лето и осень — группа до 8", "от 21 900 ₽"],
  ["zima", "h-zima", "Зима", "Зимний Таганай: ночёвка в приюте", "2 дня — зима — группа до 6", "от 9 900 ₽"],
];

const slide = ([f, alt], i) => `
      <div class="swiper-slide">
        <div class="hero__media" data-swiper-parallax="18%">
          <picture>
            <img class="hero__img" data-depth="7" src="assets/img/${f}.jpg" alt="${esc(alt)}"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}>
          </picture>
          <div class="hero__shade"></div>
        </div>
      </div>`;

// Компас-«рамка» берём из исходного шаблона, если он ещё не заменён; иначе из сохранённого фрагмента.
const compassFile = ROOT + "tools/meridian-compass.html";
const current = readFileSync(W + "index.html", "utf8");
let compass = (current.match(/<div class="hero__compass"[\s\S]*?<\/svg>\s*<\/div>/) ?? [""])[0];
if (compass) writeFileSync(compassFile, compass);
else if (existsSync(compassFile)) compass = readFileSync(compassFile, "utf8");

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>МЕРИДИАН — пешие походы по Таганаю из Златоуста</title>
<meta name="description" content="Клуб пеших походов по национальному парку «Таганай»: Двуглавая сопка, Откликной гребень, Круглица, Дальний Таганай. Малые группы, выход из Златоуста.">
<meta name="theme-color" content="#0b0e13">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Prata&family=Onest:wght@300;400;500;600&family=Unbounded:wght@700&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="assets/img/h-dvuglavaya.jpg" fetchpriority="high">
<link rel="stylesheet" href="assets/vendor/swiper-bundle.min.css">
<link rel="stylesheet" href="assets/css/style.css?v=20">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230b0e13'/%3E%3Cpath d='M5 24 13 11l4 6 3-4 7 11z' fill='none' stroke='%23e8c37e' stroke-width='2' stroke-linejoin='round'/%3E%3C/svg%3E">
</head>
<body>

<header class="site-header">
  <a class="logo" href="#">МЕРИДИАН<span class="logo__dot"></span></a>
  <nav class="nav" aria-label="Основная навигация">
    <a href="#trips">Маршруты</a>
    <a href="#format">Формат</a>
    <a href="#about">О клубе</a>
    <a href="#reviews">Заметки</a>
  </nav>
  <a class="header-cta" href="#contact">Подобрать поход</a>
</header>

<!-- ================= HERO ================= -->
<section class="hero" aria-label="Пешие маршруты по Таганаю">
  <div class="swiper" data-hero-swiper>
    <div class="swiper-wrapper">${slides.map(slide).join("")}
    </div>
  </div>

  <div class="hero__frame" aria-hidden="true"></div>
  <div class="hero__glow" aria-hidden="true"></div>
  ${compass}
  <div class="hero__needle" aria-hidden="true"></div>

  <p class="hero__kicker">Клуб пеших походов по Таганаю</p>

  <div class="swiper hero__titles" data-title-swiper aria-hidden="true">
    <div class="swiper-wrapper">
${slides.map((s) => `      <div class="swiper-slide"><span>${s[2]}</span></div>`).join("\n")}
    </div>
  </div>

  <div class="hero__ui">
    <div class="hero__cta">
      <a class="btn btn--solid" href="#contact">Записаться</a>
      <button class="btn btn--ghost" type="button" data-hero-more>Узнать подробнее о маршруте</button>
    </div>
    <div class="hero__count"><span data-hero-cur>01</span><i>/ 12</i></div>
    <div class="hero__bars" data-hero-bars>
${slides.map((_, i) => `      <button class="hbar" data-hero-goto="${i}" aria-label="Слайд ${i + 1}"><b></b></button>`).join("\n")}
    </div>
    <div class="hero__arrows">
      <button class="harr" data-hero-prev aria-label="Предыдущее место"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button class="harr" data-hero-next aria-label="Следующее место"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
    </div>
  </div>

  <div class="hero__scrollhint" aria-hidden="true"><span></span>листайте вниз</div>
</section>

<!-- ================= О КЛУБЕ ================= -->
<section class="about" id="about">
  <div class="container">
    <span class="eyebrow" data-reveal>Клуб пеших походов по Таганаю</span>
    <h2 class="about__title" data-reveal>Мы водим небольшие группы по тропам национального парка рядом с Златоустом — туда, где хребты стоят вплотную, а город остаётся внизу</h2>
    <p class="about__text" data-reveal>МЕРИДИАН — это не экскурсионное бюро. Каждый маршрут мы заранее проходим, сверяем с погодой и сезоном и берём с собой не больше восьми человек. Показываем Таганай так, как его видят те, кто ходит пешком: с Двуглавой сопки, с Откликного гребня, с вершины Дальнего Таганая.</p>
    <div class="stub-stats" data-reveal>
      <div class="stat"><b>1178 м</b><span>Круглица, высшая точка парка (около)</span></div>
      <div class="stat"><b>1155 м</b><span>Откликной гребень (около)</span></div>
      <div class="stat"><b>1040 м</b><span>Двуглавая сопка (около)</span></div>
      <div class="stat"><b>3 км</b><span>от вокзала Златоуста до входа (около)</span></div>
    </div>
  </div>
</section>

<!-- ================= МАРШРУТЫ ================= -->
<section class="trips" id="trips">
  <div class="container">
    <div class="sec-head" data-reveal>
      <span class="eyebrow">Маршруты</span>
      <h2 class="sec-title">Куда идём в этом сезоне</h2>
    </div>
    <div class="trips__grid">
${tripCards
  .map(
    ([k, img, tag, name, meta, price]) => `      <article class="trip" data-reveal data-route="${k}" tabindex="0" role="button" aria-label="Открыть подробности маршрута">
        <div class="trip__media"><img src="assets/img/${img}.jpg" alt="${esc(tag)}" loading="lazy"><span class="trip__tag">${esc(tag)}</span></div>
        <div class="trip__body">
          <h3 class="trip__name">${esc(name)}</h3>
          <p class="trip__meta">${esc(meta)}</p>
          <div class="trip__foot"><span class="trip__price">${esc(price)}</span><span class="trip__link">Подробнее →</span></div>
        </div>
      </article>`,
  )
  .join("\n")}
    </div>
    <p class="about__text" data-reveal style="margin-top:28px">Цены и даты в этой версии условные: это демонстрационный проект из портфолио.</p>
  </div>
</section>

<!-- ================= ФОРМАТ ================= -->
<section class="format" id="format">
  <div class="container">
    <div class="sec-head" data-reveal>
      <span class="eyebrow">Как это устроено</span>
      <h2 class="sec-title">Поход, а не экскурсия</h2>
    </div>
    <ol class="format__list">
      <li class="format__item" data-reveal>
        <span class="format__num">01</span>
        <h3>Группы до восьми человек</h3>
        <p>Идём одной командой, без флажков и громкой связи. Темп задаёт самый медленный участник, и это правило не обсуждается.</p>
      </li>
      <li class="format__item" data-reveal>
        <span class="format__num">02</span>
        <h3>Погода решает маршрут</h3>
        <p>В горах погода меняется быстрее, чем в городе. Мы закладываем запасной день и спокойно переносим выход, если прогноз плохой.</p>
      </li>
      <li class="format__item" data-reveal>
        <span class="format__num">03</span>
        <h3>Помощь со снаряжением</h3>
        <p>До выхода присылаем список вещей и помогаем собраться: что взять с собой, что можно взять напрокат, что оставить дома.</p>
      </li>
      <li class="format__item" data-reveal>
        <span class="format__num">04</span>
        <h3>Бережно к парку</h3>
        <p>Идём по тропам, мусор уносим, огонь разводим только в разрешённых местах и помогаем оформить вход в национальный парк.</p>
      </li>
    </ol>
  </div>
</section>

<!-- ================= ЗАМЕТКИ ================= -->
<section class="reviews" id="reviews">
  <div class="container">
    <div class="sec-head" data-reveal>
      <span class="eyebrow">Заметки</span>
      <h2 class="sec-title">Что стоит знать перед Таганаем</h2>
    </div>
    <div class="reviews__grid">
      <blockquote class="review" data-reveal>
        <p>«Тропа каменистая: ботинки для города не подойдут. Хорошая обувь с жёсткой подошвой экономит силы и колени».</p>
        <footer><b>Обувь</b><span>для любого сезона</span></footer>
      </blockquote>
      <blockquote class="review" data-reveal>
        <p>«На гребне холоднее и ветреннее, чем в Златоусте. Тёплый слой и непромокаемая куртка лежат сверху в рюкзаке».</p>
        <footer><b>Одежда</b><span>осень и зима</span></footer>
      </blockquote>
      <blockquote class="review" data-reveal>
        <p>«Светлый день осенью короткий. Старт утром и заранее назначенное время разворота делают поход спокойным».</p>
        <footer><b>Время</b><span>сентябрь — март</span></footer>
      </blockquote>
    </div>
  </div>
</section>

<!-- ================= ФОТОЛЕНТА ================= -->
<section class="gallery" id="gallery" aria-label="Фотографии Таганая">
  <div class="marquee" data-reveal>
    <div class="marquee__track">
${[...slides.slice(0, 8), ...slides.slice(0, 8)].map((s) => `      <img src="assets/img/${s[0]}.jpg" alt="" loading="lazy">`).join("\n")}
    </div>
  </div>
</section>

<!-- ================= CTA / ФОРМА ================= -->
<section class="contact" id="contact">
  <div class="contact__bg" style="background-image:url('assets/img/h-kruglitsa.jpg')"></div>
  <div class="container contact__inner">
    <div class="contact__head" data-reveal>
      <span class="eyebrow">Подобрать поход</span>
      <h2 class="sec-title">Расскажите, куда хотите пойти — соберём маршрут под вашу группу</h2>
      <p class="contact__note">Ответим в течение дня: расскажем про даты, состав группы и что взять с собой. В демонстрационной версии форма ничего не отправляет.</p>
    </div>
    <form class="contact__form" data-contact-form data-reveal>
      <label class="field"><span>Ваше имя</span><input type="text" name="name" required placeholder="Как к вам обращаться"></label>
      <label class="field"><span>Телефон или Telegram</span><input type="text" name="phone" required placeholder="+7 900 000-00-00"></label>
      <label class="field"><span>Куда хочется</span><input type="text" name="place" placeholder="Например, Двуглавая сопка или «посоветуйте»"></label>
      <button class="btn btn--solid contact__submit" type="submit">Отправить заявку</button>
      <p class="contact__consent">Нажимая кнопку, вы соглашаетесь с политикой обработки персональных данных.</p>
      <p class="contact__done" hidden>Спасибо! Это демо, но в боевой версии заявка ушла бы в Telegram.</p>
    </form>
  </div>
</section>

<!-- ================= FOOTER ================= -->
<footer class="footer">
  <div class="container footer__inner">
    <div class="footer__brand">
      <a class="logo" href="#">МЕРИДИАН<span class="logo__dot"></span></a>
      <p>Клуб пеших походов по национальному парку «Таганай».<br>Выход из Златоуста.</p>
    </div>
    <nav class="footer__nav" aria-label="Навигация по сайту">
      <a href="#trips">Маршруты</a>
      <a href="#format">Формат</a>
      <a href="#about">О клубе</a>
      <a href="#reviews">Заметки</a>
    </nav>
    <div class="footer__contacts">
      <a href="../../index.html">Портфолио Никиты Кутылова</a>
      <a href="../../credits.html">Источники фото</a>
    </div>
  </div>
  <div class="container footer__bottom">
    <span>Демонстрационный проект</span>
    <span>Фото: Wikimedia Commons, авторы и лицензии — «Источники фото»</span>
  </div>
</footer>

<!-- ================= МОДАЛКА МАРШРУТА ================= -->
<div class="rmodal" data-route-modal hidden aria-hidden="true">
  <div class="rmodal__overlay" data-route-close></div>
  <div class="rmodal__card" role="dialog" aria-modal="true" aria-labelledby="rm-title">
    <div class="rmodal__bg" data-rm-bg aria-hidden="true"></div>
    <button class="rmodal__x" type="button" data-route-close aria-label="Закрыть">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <div class="rmodal__media">
      <div class="swiper rmodal__gallery" data-rm-swiper>
        <div class="swiper-wrapper" data-rm-track></div>
      </div>
      <button class="rmodal__garr rmodal__garr--prev" type="button" data-rm-prev aria-label="Предыдущее фото"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button class="rmodal__garr rmodal__garr--next" type="button" data-rm-next aria-label="Следующее фото"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      <div class="rmodal__gdots" data-rm-dots></div>
      <span class="rmodal__tag" data-rm-tag></span>
    </div>
    <div class="rmodal__body">
      <h3 class="rmodal__title" id="rm-title" data-rm-title></h3>
      <p class="rmodal__meta" data-rm-meta></p>
      <p class="rmodal__lead" data-rm-lead></p>
      <div class="rmodal__cols">
        <div class="rmodal__col">
          <h4 class="rmodal__h4">План по дням</h4>
          <ol class="rmodal__days" data-rm-days></ol>
        </div>
        <div class="rmodal__col">
          <h4 class="rmodal__h4">Что включено</h4>
          <ul class="rmodal__incl" data-rm-incl></ul>
        </div>
      </div>
      <div class="rmodal__foot">
        <span class="rmodal__price" data-rm-price></span>
        <a class="btn btn--solid" href="#contact" data-route-book>Записаться на маршрут</a>
      </div>
    </div>
  </div>
</div>

<script src="assets/vendor/swiper-bundle.min.js"></script>
<script src="assets/js/routes.js"></script>
<script src="assets/js/main.js?v=6"></script>
</body>
</html>
`;
writeFileSync(W + "index.html", html);
writeFileSync(W + "assets/js/routes.js", "/* Данные маршрутов (генерируется tools/build-meridian.mjs) */\nwindow.MERIDIAN_ROUTES = " + JSON.stringify(routes, null, 2) + ";\nwindow.MERIDIAN_HERO2ROUTE = " + JSON.stringify(slides.map((s) => s[3])) + ";\n");

// main.js: маршруты берём из routes.js, галерея и привязка слайдов
let js = readFileSync(W + "assets/js/main.js", "utf8");
const a = js.indexOf("var ROUTES = {");
const b = js.indexOf("var modal = document.querySelector('[data-route-modal]');");
if (a >= 0 && b > a) js = js.slice(0, a) + "var ROUTES = window.MERIDIAN_ROUTES || {};\n\n    " + js.slice(b);
else if (!js.includes("MERIDIAN_ROUTES")) throw new Error("не найден блок ROUTES в main.js");
js = js.replace(/function galleryFor\(key\) \{[\s\S]*?\n      \}/, `function galleryFor(key) {
        var main = (ROUTES[key] && ROUTES[key].img) || '';
        return [main, 'assets/img/gal-' + key + '-1.jpg', 'assets/img/gal-' + key + '-2.jpg', 'assets/img/gal-' + key + '-3.jpg'];
      }`);
js = js.replace(/var HERO2ROUTE = \[[^\]]*\];/, "var HERO2ROUTE = window.MERIDIAN_HERO2ROUTE || [];");
writeFileSync(W + "assets/js/main.js", js);

// CSS: фоны секций
let css = readFileSync(W + "assets/css/style.css", "utf8");
css = css
  .replace("../img/hero/desk-ch-jungfrau.jpg", "../img/h-dvuglavaya.jpg")
  .replace("../img/hero/desk-ch-gornergrat.jpg", "../img/h-kruglitsa.jpg")
  .replace("../img/hero/desk-ch-lauterbrunnen.jpg", "../img/h-sredniy.jpg")
  .replace("../img/hero/desk-ch-bachalpsee.jpg", "../img/h-osen.jpg");
writeFileSync(W + "assets/css/style.css", css);
console.log("meridian: готово");
