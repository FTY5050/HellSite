# НПП «КПК» — сайт

Сайт ООО «Научно-производственное предприятие „КПК“» (номенклатура, каталог, контакты). Статичный HTML/CSS/JS. *Документация актуальна на март 2025.*

## Запуск локально

Из корня проекта запустите любой веб-сервер (нужны пути от корня: `/assets/`, `/upload/`, `/catalog/`):

```bash
python -m http.server 8000
# или
npx serve
```

Откройте в браузере: **http://localhost:8000**

## Структура

- **index.html** — главная (номенклатура, поиск по карточкам)
- **catalog/** — каталог (карточки рендерятся из `assets/js/catalog-cards.js` и данных `#products-data` на каждой странице)
- **about/**, **contacts/**, **services/**, **reference/**, **portfolio/**, **zakupki/** и др. — разделы
- **assets/** — стили (css, в т.ч. vendor), скрипты (js), изображения (images), шапка/подвал (html)
- **upload/** — фото товаров
- **scripts/** — служебные скрипты (шапка/подвал, загрузка описаний с bikzg.ru)

Подробно — в [STRUCTURE.md](STRUCTURE.md).

## Служебные скрипты (scripts/)

### Шапка и подвал

После изменения `assets/html/header.html` или `assets/html/footer.html` пересоберите скрипт:

```bash
python3 scripts/build_header_footer_js.py
```

### Описания товаров с bikzg.ru

Скрипт подставляет описания в каталог (поле `description` в `#products-data`); они отображаются в модалке «Подробнее».

- **Терминал:** `python3 scripts/fetch_descriptions_bikzg.py` (опции: `--workers`, `--timeout`, `--no-cache`, `--log-fetch` и др.)
- **GUI:** `python3 scripts/fetch_descriptions_bikzg_gui.py` — окно с прогрессом, полный лог пишется в файл

Уже скачанные страницы кэшируются в `.bikzg_fetch_cache.json` (в корне проекта, в .gitignore). При Ctrl+C кэш сохраняется.

Подробнее и все опции — в [scripts/README.md](scripts/README.md).

## Документация

- [STRUCTURE.md](STRUCTURE.md) — структура проекта и ресурсов
- [SITEMAP.md](SITEMAP.md) — карта сайта: какие ссылки куда ведут
- [scripts/README.md](scripts/README.md) — скрипты (шапка/подвал, загрузка описаний)
- [ДЕЛА.md](ДЕЛА.md) — что доделать перед запуском
- [SECURITY-AUDIT.md](SECURITY-AUDIT.md) — аудит безопасности
