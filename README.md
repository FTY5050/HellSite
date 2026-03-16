# НПП «КПК» — сайт

Сайт ООО «Научно-производственное предприятие „КПК“» (номенклатура, каталог, контакты). Статичный HTML/CSS/JS. *Документация актуальна на март 2026.*

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
- **catalog/** — каталог: страница разделов `catalog.html`, страницы разделов в корне каталога (`vodopodgotovka.html`, `kotly.html` и т.д.), подразделы и товары по путям вида `catalog/раздел/подраздел.html` (без дублирования папки)
- **about/**, **contacts/**, **services/**, **reference/**, **portfolio/**, **zakupki/** и др. — разделы
- **assets/** — стили (css, в т.ч. vendor), скрипты (js), изображения (images), шапка/подвал (html)
- **upload/** — фото товаров
- **scripts/** — скрипт пересборки шапки и подвала

Подробно — в [STRUCTURE.md](STRUCTURE.md).

## Служебные скрипты (scripts/)

После изменения `assets/html/header.html` или `assets/html/footer.html` пересоберите скрипт подстановки:

```bash
python3 scripts/build_header_footer_js.py
```

Подробнее — в [scripts/README.md](scripts/README.md).

## Документация

- [STRUCTURE.md](STRUCTURE.md) — структура проекта и ресурсов
- [SITEMAP.md](SITEMAP.md) — карта сайта: какие ссылки куда ведут
- [scripts/README.md](scripts/README.md) — скрипт сборки шапки/подвала
- [ДЕЛА.md](ДЕЛА.md) — что доделать перед запуском
- [SECURITY-AUDIT.md](SECURITY-AUDIT.md) — аудит безопасности
