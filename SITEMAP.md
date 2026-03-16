# Карта сайта НПП «КПК»

Куда ведёт какая ссылка. Пути от корня сайта. *Обновлено: март 2026.*

---

## Ссылки в шапке (на всех страницах)

| Текст / элемент | Куда ведёт |
|-----------------|------------|
| Логотип | `/index.html` (главная) |
| О ПРЕДПРИЯТИИ | `/about/about.html` |
| НОМЕНКЛАТУРА | `/catalog/catalog.html` |
| УСЛУГИ | `/services/services.html` |
| ОБЪЕКТЫ | `/reference/reference.html` |
| ПРОИЗВОДСТВО | `/portfolio/portfolio.html` |
| КОНТАКТЫ | `/contacts/contacts.html` |
| Телефон | `tel:+73854000000` |
| Кнопка СВЯЗАТЬСЯ | модальное окно «Оставить заявку» |

На страницах в подпапках скрипт `header-footer.js` подставляет относительные пути (например `../catalog/catalog.html`).

---

## Ссылки в подвале

| Текст | Куда ведёт |
|-------|------------|
| О предприятии | `/about/about.html` |
| Производство | `/catalog/catalog.html` |
| Проекты | `/reference/reference.html` |
| Контакты | `/contacts/contacts.html` |
| Паровые котлы | `/catalog/kotly.html` |
| Тягодутьевые машины | `/catalog/tyagodutevye-mashiny.html` |
| Водоподготовка | `/catalog/vodopodgotovka.html` |
| Запчасти | `/catalog/zapchasti.html` |
| Телефон, Email | `tel:...`, `mailto:info@nppkpk.ru` |

---

## Главная страница (`/index.html`)

### Блок «Номенклатура изделий»

Карточки категорий ведут напрямую в подразделы каталога (без ссылки «Перейти в раздел»):

- **Водоподготовка** → ВПУ, Холодильники отбора проб, Деаэраторы, КДА, ОВА, ФОВ, ФИПаI/II/пар, БДА, ФСУ, Сепараторы, Теплообменные аппараты, Солерастворители → `catalog/vodopodgotovka/...`
- **Паровые котлы** → Серия Е, ДСЕ, ДЕ, КЕ, ДКВр, отдельные модели → `catalog/kotly/...`
- **Автоматика** → `catalog/avtomatika/...`
- **Водогрейные котлы** → `catalog/vodogrejnye-kotly/...`
- **Экономайзеры** → `catalog/ekonomajzery/...`
- **Золоуловители** → `catalog/zolouloviteli/...`
- **Воздухоподогреватели** → `catalog/vozduxopodogrevateli/...`
- **Циклоны** → `catalog/cziklony/...`
- **Тягодутьевые машины** → `catalog/tyagodutevye-mashiny/...`
- **МКУ и ПКУ** → Каталог МКУ, Опросный лист → `catalog/katalog-mku.html`, `catalog/oprosnyj-list/...`
- **Горелки** → `catalog/gorelki/...`
- **Запасные части** → `catalog/zapchasti/...`

### Услуги, галерея, прочее

- Блок «Наши услуги» — ссылки на `services/...`, `catalog/catalog.html`, `catalog/kotly.html` и т.д.
- Галерея проектов — ссылки на reference, portfolio, catalog, about.
- Кнопка «ЗАДАТЬ ВОПРОС ИНЖЕНЕРУ» — модальное окно.

---

## Каталог

- **Список разделов:** `/catalog/catalog.html` — ссылки на разделы (`vodopodgotovka.html`, `kotly.html`, `avtomatika.html` и т.д.).
- **Страницы разделов** (например `/catalog/vodopodgotovka.html`, `/catalog/kotly.html`) — заголовок, краткий текст, список ссылок на подразделы. Пути к подразделам без дублирования: `catalog/раздел/подраздел.html`.
- **Товары и подразделы** — дерево в `catalog/`; навигация по разделам и карточкам с кнопками «Подробнее» и «В корзину».
- **Каталог МКУ (PDF):** `/catalog/katalog-mku.html` — просмотр и скачивание PDF (файл `БиКЗ_Каталог_МКУ_2010.pdf` должен лежать в папке `catalog/`).

---

## О предприятии, Услуги, Объекты, Портфолио, Контакты

- **about/** — `about/about.html`
- **services/** — `services/services.html` и подстраницы (remont-kotlov-dkvr, proektirovanie и т.д.)
- **reference/** — `reference/reference.html`; ссылка «Наши работы» → `portfolio/portfolio.html`
- **portfolio/** — `portfolio/portfolio.html`, подразделы (kotly-dkvr, filtry-fov и т.д.)
- **contacts/** — `contacts/contacts.html`

---

## Прочее

- **news/**, **zakupki/**, **oprosnye-listy/**, **policy/** — разделы со своей структурой; ссылки из подвала и с других страниц.
