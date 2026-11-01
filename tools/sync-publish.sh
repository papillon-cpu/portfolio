#!/bin/sh
# Копирует сайт в .publish (папка для публикации артефакта), без служебных файлов
cd "$(dirname "$0")/.." || exit 1
mkdir -p .publish && cp -r site/. .publish/ && echo "готово: .publish обновлена"
