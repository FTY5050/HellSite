# Структура проекта НПП «КПК»

## Корень сайта (публичные URL)

В корне только необходимое для работы сайта:

| Путь | Назначение |
|------|------------|
| `index.html` | Главная страница |
| `style.css` | Основные стили (фоны — `assets/images/back.jpg`, `new_back.png`) |
| `script.js`, `map-init.js` | Скрипты |
| `favicon.ico`, `logo2.png` | Иконка и логотип (используются по `/favicon.ico`, `/logo2.png` из каталога и др.) |
| `robots.txt` | Правила для поисковиков |
| `STRUCTURE.md`, `.gitignore` | Документация и игнор для git |

## Разделы сайта (зависимости не менять)

- **about/** — О предприятии (`/about/index.html`)
- **catalog/** — Каталог продукции; структура в `catalog/structure.json`
- **contacts/** — Контакты
- **services/** — Услуги
- **reference/** — Объекты / проекты
- **news/** — Новости
- **portfolio/** — Портфолио (объекты)
- **zakupki/** — Закупки
- **vakancy/** — Вакансии
- **oborudovanie-v-nalichii/** — Оборудование в наличии
- **oprosnye-listy/** — Опросные листы
- **policy/** — Политика

## Ресурсы

- **upload/** — Загрузки (изображения товаров каталога); ссылки вида `/upload/shop_1/...`
- **assets/images/** — Изображения: карточки каталога на главной, галерея, фоны (back.jpg, new_back.png). В корне — только `logo2.png` и `favicon.ico`.
- **assets/css/vendor/** — Стили, перенесённые с bikzg.ru: header.css, footer.css, template.css, suggestions.min.css, multiregion.css (заглушки). Подключаются как `/assets/css/vendor/...`.
- **assets/js/catalog-cards.js** — Единый шаблон карточки товара: карточки в каталоге рендерятся из данных в `#products-data` на каждой странице.
- **images/** — Дополнительные изображения (если используются отдельными разделами)
- **templates/** — Шаблоны стилей (template1, template8; подключаются относительными путями из каталога)
- **site/**, **modules/**, **scripts/**, **video/** — Вспомогательные ресурсы

## Важно для зависимостей

- Во всех страницах каталога: логотип и главная — `href="/index.html"`, `src="/logo2.png"`; стили — относительные `../../style.css`, `../../favicon.ico` (от глубины вложенности). Скрипт карточек — `/assets/js/catalog-cards.js`.
- Сайт нужно открывать через веб-сервер (пути `/assets/`, `/upload/`, `/catalog/` от корня). Локально: из корня `python -m http.server 8000` или `npx serve`, затем http://localhost:8000 .
- Не переименовывать и не перемещать папки `catalog/*`, `about`, `contacts`, `services`, `reference` без массовой замены путей в HTML.
