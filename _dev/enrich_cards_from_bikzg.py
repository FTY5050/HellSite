#!/usr/bin/env python3
"""
Дополняет карточки товаров (products-data в HTML) характеристиками и ценой из scraped_products.json (bikzg.ru).

Запуск из корня проекта:
  python3 _dev/enrich_cards_from_bikzg.py           # обновить все страницы с products-data
  python3 _dev/enrich_cards_from_bikzg.py --dry-run # только показать, что будет изменено
"""
import json
import re
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "catalog"
DATA_FILE = Path(__file__).resolve().parent / "scraped_products.json"
SKIP_DIRS = {"page-2", "page-3", "page-4", "page-5", "page-6"}


def normalize_title(s: str) -> str:
    if not s:
        return ""
    s = s.strip().lower()
    s = re.sub(r"\s+", " ", s)
    # Убрать варианты написания, мешающие сопоставлению
    s = s.replace("атмосферный ", "").replace("атмосферный", "")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def build_scraped_maps(data: dict) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Возвращает (path -> entry, normalized_title -> entry)."""
    by_path = {k: v for k, v in data.items() if isinstance(v, dict)}
    by_title = {}
    for k, v in data.items():
        if not isinstance(v, dict):
            continue
        t = (v.get("title") or "").strip()
        if t:
            norm = normalize_title(t)
            if norm and norm not in by_title:
                by_title[norm] = v
            # также по ключу пути: последний сегмент часто совпадает с названием
            key_slug = k.split("/")[-1] if "/" in k else k
            if key_slug and key_slug not in by_path:
                pass  # by_path уже по полному пути
    return by_path, by_title


def find_scraped(
    product: dict,
    page_path: str,
    by_path: Dict[str, Any],
    by_title: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Находит запись в scraped по пути страницы или по названию товара."""
    # Точное совпадение по пути страницы (для однопродуктовых страниц)
    if page_path in by_path:
        entry = by_path[page_path]
        if (entry.get("title") or "").strip() == (product.get("title") or "").strip():
            return entry
    # По нормализованному названию
    title = (product.get("title") or "").strip()
    if not title:
        return None
    norm = normalize_title(title)
    return by_title.get(norm)


def characteristics_to_props(characteristics: List[str]) -> List[Dict[str, str]]:
    """Преобразует список характеристик в формат props (таблица name/value)."""
    if not characteristics:
        return []
    return [{"name": "—", "value": c.strip()} for c in characteristics if (c or "").strip()]


def extract_products_data(html: str) -> Optional[Tuple[str, list, int, int]]:
    """Извлекает JSON из script#products-data. Возвращает (raw, list, start, end) или None."""
    pattern = r'<script[^>]*\bid=["\']products-data["\'][^>]*>\s*([\s\S]*?)\s*</script>'
    m = re.search(pattern, html, re.IGNORECASE)
    if not m:
        return None
    raw = m.group(1).strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, list):
        return None
    return (raw, data, m.start(1), m.end(1))


def main():
    ap = argparse.ArgumentParser(description="Дополнить карточки характеристиками с bikzg.ru")
    ap.add_argument("--dry-run", action="store_true", help="Не записывать файлы")
    args = ap.parse_args()

    if not DATA_FILE.exists():
        print(f"Файл {DATA_FILE} не найден. Сначала выполните fetch_product_descriptions.py --fetch")
        return 1

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        scraped = json.load(f)

    by_path, by_title = build_scraped_maps(scraped)

    html_files = []
    for path in ROOT.rglob("*.html"):
        if "_drafts" in path.parts or "_dev" in path.parts:
            continue
        try:
            rel = path.relative_to(ROOT)
        except ValueError:
            continue
        if any(p in rel.parts for p in SKIP_DIRS):
            continue
        html_files.append(path)

    updated_count = 0
    for html_path in html_files:
        try:
            text = html_path.read_text(encoding="utf-8")
        except Exception as e:
            print(f"Ошибка чтения {html_path}: {e}")
            continue

        res = extract_products_data(text)
        if not res:
            continue
        raw, products, start, end = res

        # Путь страницы без index.html (как ключ в scraped)
        try:
            rel = html_path.relative_to(ROOT)
            page_path = str(rel.parent).replace("\\", "/")
        except ValueError:
            page_path = ""

        changed = False
        for p in products:
            if not isinstance(p, dict):
                continue
            entry = find_scraped(p, page_path, by_path, by_title)
            if not entry:
                continue
            ch = entry.get("characteristics") or []
            if not ch:
                continue
            # Дополняем только если props пустой
            if not p.get("props"):
                p["props"] = characteristics_to_props(ch)
                changed = True
            # Опционально: подставить цену с bikzg (можно включить)
            # if entry.get("price") and not p.get("price"):
            #     p["price"] = entry["price"][:80]

        if not changed:
            continue

        new_json = json.dumps(products, ensure_ascii=False, indent=2)
        new_text = text[:start] + "\n" + new_json + "\n" + text[end:]
        if not args.dry_run:
            html_path.write_text(new_text, encoding="utf-8")
        updated_count += 1
        print(f"  {'[dry-run] ' if args.dry_run else ''}{html_path.relative_to(ROOT)}")

    print(f"\nОбновлено страниц: {updated_count}")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
