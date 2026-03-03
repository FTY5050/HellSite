# НПП «КПК» — сайт

Сайт ООО «Научно-производственное предприятие „КПК“» (номенклатура, каталог, контакты). Статичный HTML/CSS/JS.

## Запуск локально

Из корня проекта запустите любой веб-сервер (нужны пути от корня: `/assets/`, `/upload/`, `/catalog/`):

```bash
python -m http.server 8000
# или
npx serve
```

Откройте в браузере: **http://localhost:8000**

## Структура

- **index.html** — главная
- **catalog/** — каталог (карточки рендерятся из одного шаблона `assets/js/catalog-cards.js` и данных на странице)
- **about/**, **contacts/**, **services/**, **reference/**, **zakupki/** и др. — разделы
- **assets/** — стили (css/vendor), скрипты (js), изображения (images)
- **upload/** — фото товаров

Подробно — в [STRUCTURE.md](STRUCTURE.md).

## Служебные скрипты (_dev)

- Обновить описания/характеристики с bikzg.ru и вставить в страницы:
  ```bash
  _dev/venv/bin/python _dev/fetch_product_descriptions.py --fetch
  _dev/venv/bin/python _dev/fetch_product_descriptions.py --apply
  ```
- Заменить статичные карточки на шаблон + JSON (уже выполнено):
  ```bash
  _dev/venv/bin/python _dev/extract_cards_to_template.py
  ```

См. [_dev/README.md](_dev/README.md).
