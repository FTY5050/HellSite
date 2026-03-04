# Структура проекта НПП «КПК»

## Корень сайта (публичные URL)

В корне только необходимое для работы сайта:

| Путь | Назначение |
|------|------------|
| `index.html` | Главная страница (номенклатура, каталог-карточки, поиск) |
| `style.css` | Основные стили (hero, секции, модалки, отступ от шапки) |
| `script.js`, `map-init.js` | Скрипты главной (галерея, карта и т.д.) |
| `favicon.ico`, `logo2.png` | Иконка и логотип |
| `robots.txt` | Правила для поисковиков |
| `STRUCTURE.md`, `README.md`, `.gitignore` | Документация и игнор для git |

## Шапка и подвал (общие для всего сайта)

- **Фрагменты:** `assets/html/header.html`, `assets/html/footer.html` — редактировать здесь, затем пересобрать JS.
- **Скрипт подстановки:** `assets/js/header-footer.js` — вставляет шапку и подвал в `#site-header` и `#site-footer`. Пути в ссылках делаются относительными от текущей страницы (работает с `file://` и из подпапок).
- **Пересборка после правки header/footer:** `python3 scripts/build_header_footer_js.py`.

## Разделы сайта

| Путь | Назначение |
|------|------------|
| **about/** | О предприятии |
| **catalog/** | Каталог продукции (страницы с `#products-data` и карточками из `catalog-cards.js`) |
| **contacts/** | Контакты |
| **services/** | Услуги |
| **reference/** | Объекты / референс-лист |
| **portfolio/** | Портфолио (наши работы) |
| **news/** | Новости |
| **zakupki/** | Закупки |
| **vakancy/** | Вакансии |
| **oborudovanie-v-nalichii/** | Оборудование в наличии |
| **oprosnye-listy/** | Опросные листы |
| **policy/** | Политика |

## Ресурсы

| Путь | Назначение |
|------|------------|
| **upload/** | Изображения товаров каталога (ссылки вида `/upload/shop_1/...`) |
| **assets/images/** | Изображения для главной (карточки категорий, галерея, фоны) |
| **assets/css/** | `cart.css` (корзина, кнопки карточек, модалка «Подробнее»), `catalog-page.css`, vendor-стили |
| **assets/css/vendor/** | Стили, перенесённые с bikzg: header.css, footer.css, template.css и др. |
| **assets/js/catalog-cards.js** | Рендер карточек товара из `#products-data`; кнопка «Подробнее» открывает модалку с описанием |
| **assets/js/header-footer.js** | Подстановка шапки и подвала (генерируется из `assets/html/header.html` и `footer.html`) |
| **assets/js/cart.js** | Виджет корзины в шапке |
| **templates/** | Шаблоны стилей (template1, template8 и др.), подключаются относительными путями из каталога |

## Служебные скрипты (scripts/)

| Скрипт | Назначение |
|--------|------------|
| `build_header_footer_js.py` | Собрать `assets/js/header-footer.js` из `assets/html/header.html` и `footer.html` |
| `fetch_descriptions_bikzg.py` | Скачать описания товаров с bikzg.ru и записать в поле `description` в `#products-data` (с кэшем и логом) |
| `fetch_descriptions_bikzg_gui.py` | GUI для запуска загрузки описаний (лог в файл, в окне — прогресс и итог) |
| `replace_header_footer.py` | Заменить статичную шапку/подвал на placeholders + подключение header-footer.js |

Подробнее — в [scripts/README.md](scripts/README.md).

## Важно для зависимостей

- На страницах должны быть `<div id="site-header"></div>`, `<div id="site-footer"></div>` и подключён `<script src=".../assets/js/header-footer.js"></script>` (путь от глубины страницы или от корня).
- В страницах каталога: пустой `<div id="catalog-container"></div>`, блок `<script type="application/json" id="products-data">[...]</script>` и подключён `/assets/js/catalog-cards.js`. Карточки рисуются скриптом; описание из `description` показывается в модалке «Подробнее».
- Сайт лучше открывать через веб-сервер (пути `/assets/`, `/upload/`, `/catalog/` от корня). Локально: из корня `python -m http.server 8000` или `npx serve`, затем http://localhost:8000 .
- Не переименовывать и не перемещать папки `catalog/*`, `about`, `contacts`, `services`, `reference` без массовой замены путей в HTML.
