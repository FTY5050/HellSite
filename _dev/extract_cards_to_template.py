#!/usr/bin/env python3
"""
Извлекает карточки товаров из .catalog-container в каталоге и заменяет их на
один шаблон: пустой контейнер + JSON-данные + скрипт catalog-cards.js.
После запуска все карточки рендерятся из одного шаблона в assets/js/catalog-cards.js.

Запуск: python _dev/extract_cards_to_template.py
         python _dev/extract_cards_to_template.py --dry-run  # только показать, не менять файлы
         python _dev/extract_cards_to_template.py --limit 5  # обработать 5 страниц
"""
import json
import re
import argparse
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Установите: pip install beautifulsoup4")
    raise

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "catalog"
SKIP_DIRS = {"page-2", "page-3", "page-4", "page-5", "page-6"}
SCRIPT_TAG = '<script src="/assets/js/catalog-cards.js"></script>'


def get_catalog_index_paths():
    paths = []
    for path in CATALOG.rglob("index.html"):
        parts = path.relative_to(ROOT).parts
        if any(p in parts for p in SKIP_DIRS):
            continue
        paths.append(path)
    return sorted(paths)


def extract_cards(soup):
    """Из .catalog-container извлекает список словарей { title, img, alt, price, props? }."""
    container = soup.find(class_="catalog-container")
    if not container:
        return None
    cards = container.find_all(class_="prod-card")
    if not cards:
        return None
    out = []
    for card in cards:
        prod_img = card.find(class_="prod-img")
        img_el = prod_img.find("img") if prod_img else None
        img_src = (img_el.get("src") or "").strip() if img_el else ""
        img_alt = (img_el.get("alt") or "").strip() if img_el else ""

        prod_info = card.find(class_="prod-info")
        if not prod_info:
            continue
        h4 = prod_info.find("h4")
        title = (h4.get_text(strip=True) if h4 else "") or img_alt

        price_el = prod_info.find(class_="product-price")
        price = price_el.get_text(strip=True) if price_el else "Цена: по запросу"

        props = []
        props_div = prod_info.find(class_="product-props")
        if props_div:
            table = props_div.find("table")
            if table:
                for tr in table.find_all("tr"):
                    tds = tr.find_all("td")
                    if len(tds) >= 2:
                        name = tds[0].get_text(strip=True)
                        value = tds[1].get_text(strip=True)
                        props.append({"name": name, "value": value})

        out.append({
            "title": title,
            "img": img_src,
            "alt": img_alt or title,
            "price": price,
            "props": props if props else None,
        })
    return out


def replace_container_with_data(html: str, products: list) -> str:
    """Заменяет содержимое .catalog-container на пустой контейнер + JSON + скрипт."""
    # Найти <div class="catalog-container"> ... </div> (внешний закрывающий тег контейнера)
    # и заменить внутренность + добавить после контейнера script с данными и script с catalog-cards.js
    pattern = re.compile(
        r'<div\s+class="catalog-container"[^>]*>\s*',
        re.IGNORECASE | re.DOTALL
    )
    if not pattern.search(html):
        return html

    # Собираем новый блок: открывающий тег с id, пустое содержимое, закрывающий тег, JSON, скрипт
    json_str = json.dumps(products, ensure_ascii=False, indent=2)
    # Экранировать </script> в JSON чтобы не оборвать тег
    json_str = json_str.replace("</", "<\\/")
    new_block = (
        '<div class="catalog-container" id="catalog-container"></div>\n'
        '<script type="application/json" id="products-data">\n' + json_str + '\n</script>\n'
        + SCRIPT_TAG
    )

    # Найти границы контейнера: от <div class="catalog-container"> до парного </div>
    start = pattern.search(html)
    if not start:
        return html
    start_pos = start.start()
    i = start_pos + 4  # после "<div"
    depth = 1
    while i < len(html) and depth > 0:
        next_open = html.find("<div", i)
        next_close = html.find("</div>", i)
        if next_close == -1:
            break
        if next_open != -1 and next_open < next_close:
            depth += 1
            i = next_open + 4
        else:
            depth -= 1
            if depth == 0:
                end_pos = next_close + len("</div>")
                return html[:start_pos] + new_block + html[end_pos:]
            i = next_close + 6
    return html


def process_file(path: Path, dry_run: bool) -> bool:
    try:
        text = path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"  Ошибка чтения {path}: {e}")
        return False
    soup = BeautifulSoup(text, "html.parser")
    products = extract_cards(soup)
    if products is None or len(products) == 0:
        return False
    # Уже переведено на шаблон?
    if 'id="products-data"' in text or 'catalog-cards.js' in text:
        return False
    new_text = replace_container_with_data(text, products)
    if new_text == text:
        return False
    if not dry_run:
        path.write_text(new_text, encoding="utf-8")
    return True


def main():
    ap = argparse.ArgumentParser(description="Заменить карточки в каталоге на шаблон + JSON")
    ap.add_argument("--dry-run", action="store_true", help="Не записывать файлы")
    ap.add_argument("--limit", type=int, default=None, help="Макс. число страниц")
    args = ap.parse_args()

    paths = get_catalog_index_paths()
    if args.limit:
        paths = paths[: args.limit]
    updated = 0
    for path in paths:
        if process_file(path, args.dry_run):
            updated += 1
            rel = path.relative_to(ROOT)
            print(f"  {'[dry-run] ' if args.dry_run else ''}{rel}")
    print(f"Обработано страниц: {updated}")


if __name__ == "__main__":
    main()
