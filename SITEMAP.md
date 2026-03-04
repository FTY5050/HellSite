# Карта сайта НПП «КПК»

Куда ведёт какая ссылка. Пути указаны от корня сайта. *Обновлено: март 2025.*

---

## Ссылки в шапке (на всех страницах)

| Текст / элемент | Куда ведёт |
|-----------------|------------|
| Логотип (картинка) | `/index.html` (главная) |
| О ПРЕДПРИЯТИИ | `/about/index.html` |
| НОМЕНКЛАТУРА | `/catalog/index.html` |
| УСЛУГИ | `/services/index.html` |
| ОБЪЕКТЫ | `/reference/index.html` |
| ПРОИЗВОДСТВО | `/portfolio/index.html` |
| КОНТАКТЫ | `/contacts/index.html` |
| Телефон 8 (3854) 00-00-00 | `tel:+73854000000` (звонок) |
| Кнопка СВЯЗАТЬСЯ | открывает модальное окно «Оставить заявку» (никуда не ведёт по ссылке) |

*На страницах в подпапках скрипт `header-footer.js` подставляет относительные пути (например `../index.html`, `../catalog/index.html`).*

---

## Ссылки в подвале (на всех страницах)

| Текст | Куда ведёт |
|-------|------------|
| О предприятии | `/about/index.html` |
| Производство | `/catalog/index.html` |
| Проекты | `/reference/index.html` |
| Контакты | `/contacts/index.html` |
| Паровые котлы | `/catalog/kotly/index.html` |
| Тягодутьевые машины | `/catalog/tyagodutevye-mashiny/index.html` |
| Водоподготовка | `/catalog/vodopodgotovka/index.html` |
| Запчасти | `/catalog/zapchasti/index.html` |
| Телефон | `tel:+73854000000` |
| Email | `mailto:info@nppkpk.ru` |

---

## Главная страница (`/index.html`)

### Блок «Номенклатура изделий» (карточки категорий)

- **Водоподготовка** → ссылки на: Деаэраторы, КДА, ОВА, Гидрозатворы, ВПУ, ФОВ, ФИПаI, ФИПаII, ФИПар, БДА, ФСУ, отдельные ФОВ-2К-… → соответствующие страницы в `catalog/vodopodgotovka/...`
- **Паровые котлы** → Серия ДЕ, Е, ДКВр, КЕ, ДСЕ, Е 1.0-0.9 ГМ, Е 1.0-0.9Р → `catalog/kotly/...`
- **Автоматика** → Автоматика деаэратора ДА, Автоматика паровых котлов → `catalog/avtomatika/...`
- **Водогрейные котлы** → ПТВМ-30/50/100/120/180, КВГМ, КВТС, К-50 → `catalog/vodogrejnye-kotly/...`
- **Экономайзеры** → ЭБ, БВЗС, 36-1-300 и др. → `catalog/ekonomajzery/...`
- **Золоуловители** → ЗУ-1, ЗУ-2, ЗУ 1-1, 1-2, 2-1, 2-2 → `catalog/zolouloviteli/...`
- **Воздухоподогреватели** → ВП-О-65, 85, 140, 228, 233, 300 → `catalog/vozduxopodogrevateli/...`
- **Циклоны** → ЦБ-16 … ЦБ-56 → `catalog/cziklony/...`
- **Тягодутьевые машины** → Вентиляторы/дымососы (вал, ходовая часть) → `catalog/tyagodutevye-mashiny/...`
- **МКУ и ПКУ** → все три ссылки ведут на `catalog/index.html`
- **Горелки** → ГМ, ГМП, ГМГ, отдельные модели → `catalog/gorelki/...`
- **Запасные части** → Барабаны, Трубная система ДКВр, НРУ, Крышки лаза, Запчасти Е, ВРУ → `catalog/zapchasti/...`

### Блок «Наши услуги»

| Услуга | Ссылка «Подробнее» |
|--------|---------------------|
| Проектирование | `services/proektirovanie-parovyx-kotelnyx/index.html` |
| Производство | `catalog/index.html` |
| Демонтаж/Монтаж | `services/remont-kotlov-de/index.html` |
| Обмуровочные работы | `services/stroitelstvo-kotelnyx-i-montazh-kotelnogo-oborudovaniya/index.html` |
| Пуско-наладочные работы | `services/index.html` |
| Нестандартные типы котлов | `catalog/kotly/index.html` |

### Блок «Фотогалерея проектов»

| Карточка | Куда ведёт |
|----------|------------|
| Цех сборки | `reference/index.html` |
| Монтаж ДКВр | `portfolio/kotly-dkvr/197/index.html` |
| Паровой котел КЕ | `catalog/kotly/kotly-serii-ke/index.html` |
| Отдел ОТК | `about/index.html` |
| Кнопка «Посмотреть все проекты» | `reference/index.html` |

### Прочее на главной

- Кнопка «ЗАДАТЬ ВОПРОС ИНЖЕНЕРУ» → открывает модальное окно (не ссылка).

---

## Страница каталога (`/catalog/index.html`)

**Разделы каталога** (список ссылок):

- Автоматика → `/catalog/avtomatika/index.html`
- Циклоны → `/catalog/cziklony/index.html`
- Экономайзеры → `/catalog/ekonomajzery/index.html`
- ФЭЛ, щелевые колпачки → `/catalog/filtruyushhie-elementy-fel/index.html`
- Горелки → `/catalog/gorelki/index.html`
- Паровые котлы → `/catalog/kotly/index.html`
- Тягодутьевые машины → `/catalog/tyagodutevye-mashiny/index.html`
- Водогрейные котлы → `/catalog/vodogrejnye-kotly/index.html`
- Водоподготовка → `/catalog/vodopodgotovka/index.html`
- Воздухоподогреватели → `/catalog/vozduxopodogrevateli/index.html`
- Запчасти → `/catalog/zapchasti/index.html`
- Золоуловители → `/catalog/zolouloviteli/index.html`

Далее на странице рендерятся карточки товаров из `#products-data`; у каждой карточки кнопки «Подробнее» (модалка) и «В корзину» (добавление в виджет корзины). Внутри каталога страницы ссылаются друг на друга через меню и контент (дерево разделов и товаров).

---

## О предприятии (`/about/index.html`)

- Текст «по контактам» → `../contacts/index.html` (относительно about)

---

## Услуги (`/services/index.html`)

- Капитальный ремонт котлов ДКВр → `remont-kotlov-dkvr/index.html`
- Ремонт котлов ДЕ → `remont-kotlov-de/index.html`
- Ремонт котлов КЕ → `remont-kotlov-ke/index.html`
- Проектирование паровых котельных → `proektirovanie-parovyx-kotelnyx/index.html`
- Переводы в водогрейный режим → `perevody-v-vodogrejnyj-rezhim/index.html`
- Строительство котельных и монтаж → `stroitelstvo-kotelnyx-i-montazh-kotelnogo-oborudovaniya/index.html`

---

## Объекты / референс (`/reference/index.html`)

- «Наши работы» (текст и кнопка) → `../portfolio/index.html`

---

## Портфолио — Наши работы (`/portfolio/index.html`)

- Котлы ДКВр → `kotly-dkvr/index.html`
- Котлы ДСЕ → `kotly-dse/index.html`
- Фильтры ФОВ → `filtry-fov/index.html`
- Текст «через контакты» → `../contacts/index.html`

---

## Контакты (`/contacts/index.html`)

- Телефон → `tel:+73854000000`
- Email → `mailto:info@nppkpk.ru`
- Остальные ссылки — шапка и подвал (см. выше).

---

## Разделы без отдельной карты

- **zakupki/** — закупки (есть своя навигация и ссылки внутри раздела).
- **vakancy/** — вакансии.
- **news/** — новости (списки и страницы статей).
- **oborudovanie-v-nalichii/**, **oprosnye-listy/**, **policy/** — разделы с внутренней структурой; навигация к ним может быть из подвала или с других страниц.

Структура **catalog/** — дерево категорий и товаров (сотни страниц); полный перечень можно получить скриптом по всем `index.html` в `catalog/`.
