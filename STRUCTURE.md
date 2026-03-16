# Структура проекта НПП «КПК»

*Актуально: март 2026.*

## Корень сайта (публичные URL)

| Путь | Назначение |
|------|------------|
| `index.html` | Главная страница (номенклатура, каталог-карточки, поиск) |
| `style.css` | Основные стили (hero, секции, модалки, отступ от шапки, липкий подвал) |
| `script.js` | Скрипты главной (галерея, модалки, поиск по номенклатуре) |
| `logo.svg`, `logo2.png` | Логотип и иконка |
| `robots.txt` | Правила для поисковиков |
| `STRUCTURE.md`, `README.md`, `SITEMAP.md`, `.gitignore` | Документация |

## Шапка и подвал (общие для всего сайта)

- **Фрагменты:** `assets/html/header.html`, `assets/html/footer.html` — редактировать здесь, затем пересобрать JS.
- **Скрипт подстановки:** `assets/js/header-footer.js` — вставляет шапку и подвал в `#site-header` и `#site-footer`. Пути в ссылках делаются относительными от текущей страницы.
- **Пересборка после правки header/footer:** `python3 scripts/build_header_footer_js.py`.

## Разделы сайта

| Путь | Назначение |
|------|------------|
| **about/** | О предприятии |
| **catalog/** | Каталог: `catalog.html` — список разделов; страницы разделов (`vodopodgotovka.html`, `kotly.html`, `zapchasti.html` и т.д.) в корне каталога; подразделы и товары — по путям вида `catalog/раздел/подраздел.html` (без дублирования имени папки и файла) |
| **contacts/** | Контакты |
| **services/** | Услуги |
| **reference/** | Объекты / референс-лист |
| **portfolio/** | Портфолио (наши работы) |
| **news/** | Новости |
| **zakupki/** | Закупки |
| **oprosnye-listy/** | Опросные листы |
| **policy/** | Политика и др. |

## Ресурсы

| Путь | Назначение |
|------|------------|
| **upload/** | Изображения товаров каталога (структура `shop_1/...`) |
| **assets/images/** | Изображения для главной (карточки категорий, галерея) |
| **assets/css/** | `cart.css`, `catalog-page.css`, стили vendor |
| **assets/css/vendor/** | header.css, footer.css, template.css, suggestions и др. |
| **assets/js/header-footer.js** | Подстановка шапки и подвала (генерируется из `assets/html/`) |
| **assets/js/catalog-cards.js** | Рендер карточек товара из `#products-data`; модалка «Подробнее» (без таблицы характеристик в модалке) |
| **assets/js/cart.js** | Виджет корзины |
| **templates/** | Стили шаблонов (template1 и др.), подключаются из страниц каталога |

## Служебные скрипты (scripts/)

| Скрипт | Назначение |
|--------|------------|
| `build_header_footer_js.py` | Собрать `assets/js/header-footer.js` из `assets/html/header.html` и `footer.html` |

## Важно

- На страницах: `<div id="site-header"></div>`, `<div id="site-footer"></div>` и `<script src=".../assets/js/header-footer.js"></script>`.
- В страницах каталога с товарами: `<div id="catalog-container"></div>`, блок `<script type="application/json" id="products-data">[...]</script>` и подключён `catalog-cards.js`. Карточки рисуются скриптом; на страницах товара отображаются фото и характеристики; в модалке «Подробнее» — название, цена и текст описания.
- Главная каталога — `catalog/catalog.html` (класс `catalog-main` для скрытия содержимого карточек, видны только кнопки). Страницы разделов — `catalog/vodopodgotovka.html`, `catalog/kotly.html` и т.д.
- Запуск: из корня `python -m http.server 8000` или `npx serve`, затем http://localhost:8000 .

## Не коммитить (см. .gitignore)

Кэши, логи, папки IDE (`.cursor`), `venv/` и т.п.
