#!/usr/bin/env python3
"""
Скачивает с bikzg.ru характеристики и описания товаров и добавляет их в index.html проекта.

Использование:
  pip install requests beautifulsoup4   # один раз
  python fetch_product_descriptions.py --fetch --limit 20    # скачать данные (тест на 20 страницах)
  python fetch_product_descriptions.py --fetch             # скачать все (647 страниц, долго)
  python fetch_product_descriptions.py --apply             # вставить сохранённые данные в HTML
  python fetch_product_descriptions.py --fetch --apply     # скачать и вставить
"""
import os
import re
import json
import time
import argparse
from pathlib import Path
from urllib.parse import quote

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Установите зависимости: pip install requests beautifulsoup4")
    raise

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "catalog"
DATA_FILE = Path(__file__).resolve().parent / "scraped_products.json"
BASE_URL = "https://bikzg.ru"
# Не скачивать страницы-категории без товара (только пагинация и т.п.)
SKIP_DIRS = {"page-2", "page-3", "page-4", "page-5", "page-6"}
REQUEST_DELAY = 1.0  # секунд между запросами
SAVE_SAMPLE_HTML = False  # сохранить первый успешный HTML в _dev/sample_bikzg.html для отладки


def get_catalog_paths():
    """Все пути catalog/.../index.html (относительно корня). Только «глубокие» пути — страницы товаров."""
    paths = []
    for path in CATALOG.rglob("index.html"):
        rel = path.relative_to(ROOT)
        parts = rel.parts
        if any(p in parts for p in SKIP_DIRS):
            continue
        # Только страницы товаров: catalog/раздел/подраздел/товар (минимум 5 частей включая index.html)
        if len(parts) < 5:
            continue
        paths.append(str(rel.parent).replace("\\", "/"))
    return sorted(paths)


def parse_product_page(html: str, url: str):
    """
    Извлекает с страницы товара: название, цену, комплектацию (характеристики), описание.
    Учитывает структуру bikzg.ru: .shop-item__title, .shop-item__description, .detail-box#text, .detail-box__price.
    """
    soup = BeautifulSoup(html, "html.parser")
    out = {"url": url, "title": "", "price": "", "characteristics": [], "description": ""}

    # Заголовок — на bikzg: h1.shop-item__title
    h1 = soup.find("h1") or soup.find(class_=re.compile(r"shop-item__title", re.I))
    if h1:
        out["title"] = h1.get_text(strip=True)

    # Цена — на bikzg: .detail-box__price, .item-price
    price_el = soup.find(class_=re.compile(r"detail-box__price|item-price", re.I))
    if price_el:
        t = price_el.get_text(strip=True)
        if "руб" in t or "по запросу" in t.lower():
            out["price"] = t
    if not out["price"]:
        for el in soup.find_all(class_=re.compile(r"price|cost|product-price", re.I)):
            t = el.get_text(strip=True)
            if "руб" in t or "по запросу" in t.lower():
                out["price"] = t
                break

    # Комплектация/характеристики — на bikzg: .shop-item__description ul li
    desc_block = soup.find(class_=re.compile(r"shop-item__description", re.I))
    if desc_block:
        ul = desc_block.find("ul")
        if ul:
            out["characteristics"] = [li.get_text(strip=True) for li in ul.find_all("li") if li.get_text(strip=True)]

    # Описание — на bikzg: .detail-box#text (содержит h5 «Описание» и параграфы/списки)
    detail_text = soup.find(id="text")
    if detail_text:
        # Убрать заголовок «Описание», собрать текст из p, ul
        desc_parts = []
        for node in detail_text.find_all(["p", "ul", "h2", "h3"]):
            if node.name in ("h2", "h3"):
                desc_parts.append("\n" + node.get_text(strip=True) + "\n")
            elif node.name == "p":
                desc_parts.append(node.get_text(strip=True))
            elif node.name == "ul":
                for li in node.find_all("li"):
                    desc_parts.append("• " + li.get_text(strip=True))
        if desc_parts:
            out["description"] = "\n".join(desc_parts).strip()

    def find_section(keywords, take_until_next_heading=True):
        for tag in soup.find_all(["h2", "h3", "h4", "h5"]):
            text = tag.get_text(strip=True)
            if not any(k in text.lower() for k in keywords):
                continue
            items = []
            desc_parts = []
            n = tag.find_next_sibling()
            while n:
                if n.name in ("h2", "h3", "h4", "h5") and take_until_next_heading:
                    break
                if n.name in ("ul", "ol"):
                    for li in n.find_all("li"):
                        items.append(li.get_text(strip=True))
                elif n.name == "p":
                    desc_parts.append(n.get_text(strip=True))
                elif getattr(n, "name", None) and n.name == "div":
                    # Может быть список внутри div
                    ul = n.find("ul") or n.find("ol")
                    if ul:
                        for li in ul.find_all("li"):
                            items.append(li.get_text(strip=True))
                    else:
                        t = n.get_text(strip=True)
                        if t and len(t) > 20:
                            desc_parts.append(t)
                n = n.find_next_sibling()
            return (items, " ".join(desc_parts))
        return None

    # Fallback: ищем по заголовкам, если ещё не нашли
    if not out["characteristics"]:
        res = find_section(["комплектация", "характеристик", "состав"])
        if res is not None:
            ch_items, _ = res
            if ch_items:
                out["characteristics"] = ch_items
    if not out["description"]:
        res = find_section(["описание"], take_until_next_heading=True)
        desc = (res[1] if res and res[1] else "") or ""
        if desc:
            out["description"] = desc

    # Если описание пустое — попробовать взять текст из основного контента
    if not out["description"] and not out["characteristics"]:
        main = soup.find(class_=re.compile(r"shop-item|product-detail|item-detail|content", re.I))
        if main:
            # Убрать навигацию, кнопки, скрипты
            for x in main.find_all(["script", "nav", "form", "button"]):
                x.decompose()
            text = main.get_text(separator=" ", strip=True)
            if len(text) > 200:
                out["description"] = text[:3000]

    # Нормализация: убрать упоминания старого бренда/почты
    def clean(t):
        if not t:
            return t
        t = re.sub(r"\s+", " ", t)
        t = t.replace("Бийского котельного завода «Генерация»", "НПП «КПК»")
        t = t.replace("zakaz@bikzg.ru", "info@nppkpk.ru")
        return t.strip()

    out["title"] = clean(out["title"])
    out["description"] = clean(out["description"])
    out["characteristics"] = [clean(x) for x in out["characteristics"] if clean(x)]

    return out


def fetch_path(path: str, session: requests.Session) -> dict:
    """Скачивает одну страницу и возвращает распарсенные данные. path уже содержит catalog/..."""
    url = f"{BASE_URL}/{path}/"
    default = {"url": url, "title": "", "price": "", "characteristics": [], "description": ""}
    try:
        r = session.get(url, timeout=25, headers={"User-Agent": "Mozilla/5.0 (compatible; NPPKPK/1)"})
        r.raise_for_status()
        if SAVE_SAMPLE_HTML:
            sample_path = Path(__file__).resolve().parent / "sample_bikzg.html"
            if not sample_path.exists():
                sample_path.write_text(r.text, encoding="utf-8")
                print(f"  [отладка] сохранён образец HTML: {sample_path}")
        result = parse_product_page(r.text, url)
        return result if isinstance(result, dict) else default
    except Exception as e:
        default["error"] = str(e)
        return default


def run_fetch(limit: int | None):
    paths = get_catalog_paths()
    if limit:
        paths = paths[:limit]
    print(f"Скачиваю данные с bikzg.ru для {len(paths)} страниц...")
    session = requests.Session()
    data = {}
    for i, path in enumerate(paths):
        data[path] = fetch_path(path, session)
        if (i + 1) % 10 == 0:
            print(f"  {i + 1}/{len(paths)}")
        time.sleep(REQUEST_DELAY)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Сохранено в {DATA_FILE}")
    return data


def build_insert_block(info: dict) -> str:
    """Формирует HTML-блок характеристик и описания для вставки в страницу."""
    parts = []
    if info.get("characteristics"):
        parts.append('<div class="product-specs" style="margin: 2rem 0;">')
        parts.append('<h3 style="font-size: 1.25rem; margin-bottom: 0.75rem;">Характеристики / Комплектация</h3>')
        parts.append("<ul style=\"list-style: disc; padding-left: 1.5rem;\">")
        for item in info["characteristics"]:
            escaped = item.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            parts.append(f"<li>{escaped}</li>")
        parts.append("</ul></div>")
    if info.get("description"):
        desc = info["description"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        # Разбить по " • " на основной текст и пункты списка
        chunks = [s.strip() for s in desc.split(" • ") if s.strip()]
        parts.append('<div class="product-description" style="margin: 2rem 0; max-width: 800px;">')
        parts.append('<h3 style="font-size: 1.25rem; margin-bottom: 0.75rem;">Описание</h3>')
        if chunks:
            first = chunks[0]
            if len(first) > 20 or (len(chunks) == 1 and first):
                parts.append(f"<p style=\"margin-bottom: 0.75rem;\">{first}</p>")
            if len(chunks) > 1:
                parts.append("<ul style=\"list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem;\">")
                for item in chunks[1:]:
                    if item.endswith(";"):
                        item = item[:-1]
                    parts.append(f"<li>{item}</li>")
                parts.append("</ul>")
        parts.append("</div>")
    return "\n".join(parts) if parts else ""


def run_apply():
    if not DATA_FILE.exists():
        print(f"Файл {DATA_FILE} не найден. Сначала выполните --fetch.")
        return
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated = 0
    for path, info in data.items():
        if info.get("error") or (not info.get("characteristics") and not info.get("description")):
            continue
        html_path = ROOT / path / "index.html"
        if not html_path.exists():
            continue
        insert_html = build_insert_block(info)
        if not insert_html:
            continue
        try:
            text = html_path.read_text(encoding="utf-8")
        except Exception as e:
            print(f"Ошибка чтения {html_path}: {e}")
            continue
        # Вставка перед <footer (первое вхождение)
        marker = "<footer"
        if marker not in text:
            continue
        # Не вставлять повторно
        if "product-specs" in text or "product-description" in text:
            continue
        idx = text.index(marker)
        # Отступить на конец предыдущей строки (после закрывающих </div>)
        new_text = text[:idx].rstrip() + "\n\n" + insert_html + "\n\n" + text[idx:]
        html_path.write_text(new_text, encoding="utf-8")
        updated += 1
    print(f"Обновлено страниц: {updated}")


def main():
    ap = argparse.ArgumentParser(description="Скачать описания/характеристики с bikzg.ru и вставить в проект")
    ap.add_argument("--fetch", action="store_true", help="Скачать данные с bikzg.ru")
    ap.add_argument("--apply", action="store_true", help="Вставить сохранённые данные в HTML")
    ap.add_argument("--limit", type=int, default=None, help="Ограничить число страниц при --fetch (для теста)")
    args = ap.parse_args()

    if args.fetch:
        run_fetch(args.limit)
    if args.apply:
        run_apply()
    if not args.fetch and not args.apply:
        ap.print_help()
        print("\nПример: python fetch_product_descriptions.py --fetch --limit 5 && python fetch_product_descriptions.py --apply")


if __name__ == "__main__":
    main()
