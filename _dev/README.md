# Служебные скрипты и данные

- **build_catalog.py**, **build_catalog_from_tree.py** — сборка/экспорт каталога. При запуске из корня — пути вида `_dev/catalog_clean.json`.
- **replace_bikzg_links.py** — замена ссылок на bikzg.ru на локальные и CDN (уже применено).
- **fetch_product_descriptions.py** — скачивание с bikzg.ru описаний и характеристик товаров, вставка в страницы каталога. Запуск из корня:
  ```bash
  _dev/venv/bin/python _dev/fetch_product_descriptions.py --fetch    # скачать (568 страниц)
  _dev/venv/bin/python _dev/fetch_product_descriptions.py --apply     # вставить в HTML
  ```
  Данные сохраняются в `scraped_products.json` (в .gitignore).
- **enrich_cards_from_bikzg.py** — дополняет карточки товаров (JSON в `#products-data`) характеристиками из `scraped_products.json`. Товары с пустым `props` получают комплектацию с bikzg.ru. Запуск: `python3 _dev/enrich_cards_from_bikzg.py` (тест без записи: `--dry-run`).
- **extract_cards_to_template.py** — замена статичных карточек товаров на один шаблон (данные в JSON на странице, рендер в `assets/js/catalog-cards.js`). Уже применено к 636 страницам. Повторно: `_dev/venv/bin/python _dev/extract_cards_to_template.py` (без `--dry-run`).
- **process_product_images.py** — обработка фото товаров (тонирование, обрезка).

Виртуальное окружение: `_dev/venv` (Python 3, requests, beautifulsoup4). Создание: `python -m venv _dev/venv && _dev/venv/bin/pip install requests beautifulsoup4`.
