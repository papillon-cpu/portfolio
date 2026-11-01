# Портфолио Никиты Кутылова

Статичный сайт (HTML/CSS/JS без сборки) в `site/`. Хаб `site/index.html` и четыре работы в `site/works/`:
taganay-expedition, belogorye, meridian (оригиналы, не менять без просьбы), assistant (демо ИИ-помощника).

## Команды
- `npm test` — юнит-тесты (21).
- `node tools/serve.mjs` — локальный сервер на :8801.
- `node tools/interact.mjs` — браузерные проверки (45); Playwright берётся из `D:\neurocareer\node_modules`, сервер должен работать.
- `node tools/build-credits.mjs` — пересобрать страницу источников фото (после смены версии css в index.html поправьте номер и в этом файле).

## Публикация
Артефакт: https://claude.ai/artifact/CRuQc6oaxDPYvLRAG3UUR5 (приватный). Перед публикацией `sh tools/sync-publish.sh`, затем Artifact с `file_path` = `.publish/index.html`, `root` = `.publish`, `files` = изменённые файлы (assets/hub.css, assets/hub.js, credits.html, картинки). Версии css/js в index.html (`?v=`) увеличивать при каждом изменении, иначе браузер показывает старое.

## Договорённости
- Тема: светлая по умолчанию, переключатель в шапке, значение в localStorage `theme`.
- На главной ничего про город/место жительства.
- Идея «небо по времени суток» отложена: git-метка `sky-idea`, заметка `ideas/sky-time-of-day.txt`.
- Фото из Wikimedia Commons: источники в `site/credits.html`.
- Работы демонстрационные, цифры и отзывы в них образцовые.
