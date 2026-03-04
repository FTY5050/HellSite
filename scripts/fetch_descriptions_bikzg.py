#!/usr/bin/env python3
"""
Скопировать описания товаров с bikzg.ru в products-data на сайте.

Использование:
  python3 scripts/fetch_descriptions_bikzg.py [--dry-run] [--limit N] [path_to_catalog]

  --dry-run      только скачать и вывести описания, не менять HTML
  --limit N      обработать не более N страниц (для отладки)
  --only SUBSTR  обработать только пути, содержащие SUBSTR
  --save-json F  сохранить полученные описания в JSON (title -> description)
  --from-json F  не качать с сайта, подставить описания из готового JSON
  --workers N    параллельных потоков при загрузке с bikzg (по умолчанию 4; при таймаутах лучше 2–4)
  --timeout N    таймаут одного запроса в секундах (по умолчанию 60)
  --no-cache     не использовать кэш (скачать всё заново и не сохранять в кэш)
  --log-fetch    выводить лог каждого запроса (кэш/сеть, повторы, OK)
  path           корень проекта (по умолчанию: текущая директория)

Кэш: уже скачанные страницы bikzg хранятся в .bikzg_fetch_cache.json в корне проекта.
При повторном запуске эти URL не запрашиваются снова.

Для каждой страницы каталога с #products-data:
- если один товар: URL bikzg = https://bikzg.ru/<путь_страницы>/
- если несколько: загружается страница категории с bikzg, по ссылкам собираются URL товаров,
  сопоставление по title, затем для каждого товара загружается страница и описание.
"""

import argparse
import json
import re
import signal
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from urllib.error import URLError

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

BIKZG_BASE = "https://bikzg.ru/"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0"
_fetch_timeout: int = 60
# Кэш URL -> HTML (потокобезопасный доступ через _cache_lock)
_fetch_cache: dict[str, str] = {}
_cache_lock = threading.Lock()
_use_cache = True
CACHE_FILENAME = ".bikzg_fetch_cache.json"
# Статистика запросов (для лога)
_cache_hits = 0
_cache_misses = 0
_stats_lock = threading.Lock()
# Лог процесса загрузки (кэш/сеть/повтор/OK)
_log_fetch = False
_log_lock = threading.Lock()
# Корень проекта для сохранения кэша при Ctrl+C
_root_for_cache: Path | None = None


def _short_url(url: str) -> str:
    """Короткий путь для лога: catalog/..."""
    for prefix in (BIKZG_BASE.rstrip("/") + "/", BIKZG_BASE):
        if url.startswith(prefix):
            return url[len(prefix):].rstrip("/") or "/"
    return url


def _fetch_log(kind: str, url: str, extra: str = "") -> None:
    """Потокобезопасный вывод лога загрузки."""
    if not _log_fetch:
        return
    path = _short_url(url)
    with _log_lock:
        print(f"    [{kind}] {path}{extra}", flush=True)


def _load_cache(root: Path) -> None:
    """Загрузить кэш из .bikzg_fetch_cache.json в корне проекта."""
    global _fetch_cache
    cache_file = root / CACHE_FILENAME
    if not cache_file.is_file():
        _fetch_cache = {}
        return
    try:
        data = json.loads(cache_file.read_text(encoding="utf-8"))
        _fetch_cache = data if isinstance(data, dict) else {}
    except Exception:
        _fetch_cache = {}


def _save_cache(root: Path) -> None:
    """Сохранить кэш в файл."""
    with _cache_lock:
        if not _fetch_cache:
            return
        cache_file = root / CACHE_FILENAME
        cache_file.write_text(json.dumps(_fetch_cache, ensure_ascii=False, indent=0), encoding="utf-8")


def _on_sigint_save_cache(signum: int, frame: object) -> None:
    """При Ctrl+C или SIGTERM сохранить кэш и выйти."""
    global _root_for_cache
    if _root_for_cache is not None and _use_cache and _fetch_cache:
        try:
            _save_cache(_root_for_cache)
            print(f"\nКэш сохранён ({len(_fetch_cache)} URL) перед выходом.", flush=True)
        except Exception as e:
            print(f"\nНе удалось сохранить кэш: {e}", file=sys.stderr, flush=True)
    sys.exit(130)


def fetch_html(url: str, timeout: int | None = None, retries: int = 4) -> str:
    """Загрузить страницу. Сначала проверяется кэш; при таймаутах уменьшите --workers."""
    global _cache_hits, _cache_misses
    if _use_cache:
        with _cache_lock:
            if url in _fetch_cache:
                with _stats_lock:
                    _cache_hits += 1
                _fetch_log("кэш", url)
                return _fetch_cache[url]
    with _stats_lock:
        _cache_misses += 1
    _fetch_log("сеть", url)
    t = timeout if timeout is not None else _fetch_timeout
    req = Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(retries + 1):
        try:
            with urlopen(req, timeout=t) as r:
                html = r.read().decode("utf-8", errors="replace")
                if _use_cache:
                    with _cache_lock:
                        _fetch_cache[url] = html
                _fetch_log("OK", url)
                return html
        except URLError as e:
            if attempt < retries:
                _fetch_log("повтор", url, f" {attempt + 1}/{retries} ({type(e).__name__})")
                delay = 2.0 + attempt * 1.5
                time.sleep(delay)
                continue
            _fetch_log("ОШИБКА", url, f" {type(e).__name__}: {e}")
            raise


def fetch_many(urls: list[str], max_workers: int = 4) -> dict[str, str]:
    """Загрузить несколько URL параллельно. Возвращает {url: html}. Уже закэшированные не качаются."""
    result: dict[str, str] = {}
    if not urls:
        return result

    def do_one(url: str) -> tuple[str, str]:
        return url, fetch_html(url)

    with ThreadPoolExecutor(max_workers=min(max_workers, len(urls))) as ex:
        for url, html in ex.map(do_one, urls):
            result[url] = html
    return result


def extract_description_from_product_page(html: str) -> str:
    """Извлечь блок описания со страницы товара bikzg (div#text или после h5 'Описание')."""
    if BeautifulSoup is None:
        return _extract_description_regex(html)
    soup = BeautifulSoup(html, "html.parser")
    detail = soup.find("div", id="text")
    if detail:
        return _normalize_description(detail.get_text(separator="\n", strip=True))
    # Fallback: всё после <h5>Описание</h5> до следующего блока типа "Вы уже посмотрели"
    for h in soup.find_all(["h5", "h4"]):
        if h.get_text(strip=True) == "Описание":
            parts = []
            for s in h.find_next_siblings():
                if s.name in ("h2", "h3", "h4", "h5"):
                    txt = s.get_text(strip=True)
                    if "Вы уже посмотрели" in txt or "Нашли дешевле" in txt:
                        break
                parts.append(s.get_text(separator=" ", strip=True))
            return _normalize_description("\n".join(p for p in parts if p))
    return ""


def _extract_description_regex(html: str) -> str:
    m = re.search(r'<div[^>]*\bid=["\']text["\'][^>]*>(.*?)</div>', html, re.DOTALL)
    if m:
        block = re.sub(r"<[^>]+>", " ", m.group(1))
        block = re.sub(r"\s+", " ", block).strip()
        return _normalize_description(block)
    m = re.search(r"<h5>\s*Описание\s*</h5>(.*?)(?:<h[2-5]|Вы уже посмотрели|Нашли дешевле)", html, re.DOTALL | re.IGNORECASE)
    if m:
        block = re.sub(r"<[^>]+>", " ", m.group(1))
        block = re.sub(r"\s+", " ", block).strip()
        return _normalize_description(block)
    return ""


def _normalize_description(s: str) -> str:
    if not s:
        return ""
    s = re.sub(r"\s+", " ", s).strip()
    return re.sub(r" +", " ", s)


def get_product_links_from_category(html: str, base_url: str) -> list[tuple[str, str]]:
    """Вернуть список (title, url) со страницы категории bikzg."""
    out = []
    if BeautifulSoup is None:
        return _get_links_regex(html, base_url)
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a", href=True):
        href = a.get("href", "").strip()
        if "/catalog/" not in href or "on_page=" in href or "?" in href:
            continue
        title = a.get_text(strip=True)
        if not title or len(title) < 3 or "Цена:" in title or "Заказать" == title:
            continue
        url = urljoin(base_url, href)
        if url != base_url.rstrip("/"):
            out.append((title, url))
    return out


def _get_links_regex(html: str, base_url: str) -> list[tuple[str, str]]:
    out = []
    for m in re.finditer(r'<a\s+href="([^"]+)"[^>]*>([^<]+)</a>', html):
        href, title = m.group(1).strip(), m.group(2).strip()
        if "/catalog/" not in href or "on_page=" in href or not title or "Цена:" in title:
            continue
        url = urljoin(base_url, href)
        out.append((title, url))
    return out


def extract_products_data(html: str) -> tuple[list[dict], int, int]:
    """Найти в HTML блок script#products-data, распарсить JSON. Вернуть (products, start_pos, end_pos)."""
    start_m = re.search(r'<script\s+type=["\']application/json["\']\s+id=["\']products-data["\'][^>]*>\s*', html)
    if not start_m:
        return [], -1, -1
    json_start = start_m.end()
    # Ищем конец JSON-массива: закрываем скобки от начала
    depth = 0
    i = json_start
    started = False
    while i < len(html):
        c = html[i]
        if c == "[":
            depth += 1
            started = True
        elif c == "]":
            depth -= 1
            if started and depth == 0:
                json_end = i + 1
                break
        elif c in "{":
            depth += 1
        elif c in "}":
            depth -= 1
        i += 1
    else:
        return [], -1, -1
    json_str = html[json_start:json_end]
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError:
        return [], -1, -1
    return data, json_start, json_end


def inject_descriptions_into_json(products: list[dict], title_to_description: dict[str, str]) -> list[dict]:
    """Добавить в каждый продукт поле description по ключу title."""
    for p in products:
        title = (p.get("title") or "").strip()
        desc = title_to_description.get(title) or title_to_description.get(_normalize_title(title))
        if desc:
            p["description"] = desc
    return products


def _normalize_title(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip()


def process_catalog_file(
    file_path: Path,
    catalog_root: Path,
    dry_run: bool,
    limit: int | None,
    external_descriptions: dict[str, str] | None = None,
    collected_descriptions: dict[str, str] | None = None,
) -> tuple[int, int]:
    """Обработать один HTML-файл. Возвращает (кол-во товаров с новым описанием, всего товаров).
    external_descriptions: если задан, не качать с bikzg, использовать этот словарь.
    collected_descriptions: если задан, сюда складывать все полученные title->description (для --save-json).
    """
    rel = file_path.relative_to(catalog_root)
    # путь без index.html -> bikzg path (на bikzg URL всегда начинается с catalog/)
    if rel.name.lower() == "index.html":
        bikzg_path = "catalog/" + str(rel.parent).replace("\\", "/")
    else:
        bikzg_path = "catalog/" + str(rel.with_suffix("")).replace("\\", "/")
    bikzg_url_category = urljoin(BIKZG_BASE, bikzg_path + "/")
    html = file_path.read_text(encoding="utf-8", errors="replace")
    products, start, end = extract_products_data(html)
    if not products or start < 0:
        return 0, 0

    title_to_description: dict[str, str] = {}
    if external_descriptions:
        title_to_description = {k: v for k, v in external_descriptions.items() if v}
    elif len(products) == 1:
        # Один товар — одна страница на bikzg по тому же пути
        url = bikzg_url_category.rstrip("/")
        if not url.endswith("/"):
            url += "/"
        try:
            page_html = fetch_html(url)
            desc = extract_description_from_product_page(page_html)
            if desc:
                t0 = products[0].get("title", "").strip()
                title_to_description[t0] = desc
                if collected_descriptions is not None:
                    collected_descriptions[t0] = desc
        except Exception as e:
            print(f"  [skip 1 товар] {url}: {type(e).__name__}: {e}", file=sys.stderr)
    else:
        # Несколько товаров — страница категории на bikzg, затем все страницы товаров параллельно
        try:
            cat_html = fetch_html(bikzg_url_category)
            links = get_product_links_from_category(cat_html, bikzg_url_category)
            seen = set()
            unique_links: list[tuple[str, str]] = []
            for title, product_url in links:
                title_n = _normalize_title(title)
                if title_n in seen:
                    continue
                seen.add(title_n)
                unique_links.append((title_n, product_url))
            urls = [u for _, u in unique_links]
            pages = fetch_many(urls, max_workers=4)
            for title_n, product_url in unique_links:
                page_html = pages.get(product_url)
                if not page_html:
                    continue
                desc = extract_description_from_product_page(page_html)
                if desc:
                    title_to_description[title_n] = desc
                    if collected_descriptions is not None:
                        collected_descriptions[title_n] = desc
        except Exception as e:
            print(f"  [skip категория] {bikzg_url_category}: {type(e).__name__}: {e}", file=sys.stderr)

    updated = 0
    for p in products:
        t = (p.get("title") or "").strip()
        if title_to_description.get(t) or title_to_description.get(_normalize_title(t)):
            updated += 1

    if dry_run:
        for p in products:
            t = (p.get("title") or "").strip()
            d = title_to_description.get(t) or title_to_description.get(_normalize_title(t))
            if d:
                print(f"[{rel}] {t[:50]}... -> {len(d)} символов")
        return updated, len(products)

    if not title_to_description:
        return 0, len(products)

    products = inject_descriptions_into_json(products, title_to_description)
    new_json = json.dumps(products, ensure_ascii=False, indent=2)
    new_html = html[:start] + new_json + html[end:]
    file_path.write_text(new_html, encoding="utf-8")
    return updated, len(products)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Не менять HTML")
    parser.add_argument("--limit", type=int, default=None, help="Макс. число страниц")
    parser.add_argument("--only", type=str, default=None, help="Обрабатывать только пути, содержащие подстроку")
    parser.add_argument("--save-json", type=str, default=None, metavar="FILE", help="Сохранить описания в JSON (title -> description)")
    parser.add_argument("--from-json", type=str, default=None, metavar="FILE", help="Взять описания из JSON, не качать с bikzg")
    parser.add_argument("--workers", type=int, default=4, metavar="N", help="Параллельных потоков (при таймаутах лучше 2–4)")
    parser.add_argument("--timeout", type=int, default=60, metavar="N", help="Таймаут запроса в секундах")
    parser.add_argument("--no-cache", action="store_true", help="Не использовать кэш (скачать всё заново)")
    parser.add_argument("--log-fetch", action="store_true", help="Выводить лог каждого запроса (кэш/сеть/повтор/OK)")
    parser.add_argument("path", nargs="?", default=".", help="Корень проекта")
    args = parser.parse_args()
    global _fetch_timeout, _use_cache, _log_fetch, _cache_hits, _cache_misses
    _fetch_timeout = max(15, args.timeout)
    _use_cache = not args.no_cache
    _log_fetch = args.log_fetch
    _cache_hits = 0
    _cache_misses = 0
    root = Path(args.path).resolve()
    global _root_for_cache
    _root_for_cache = root
    signal.signal(signal.SIGINT, _on_sigint_save_cache)
    try:
        signal.signal(signal.SIGTERM, _on_sigint_save_cache)
    except (ValueError, OSError, AttributeError):
        pass  # SIGTERM не везде доступен (напр. Windows)
    catalog = root / "catalog"
    if not catalog.is_dir():
        print("Папка catalog не найдена.", file=sys.stderr)
        sys.exit(1)
    start_time = time.perf_counter()
    if _use_cache:
        _load_cache(root)
        cache_file = root / CACHE_FILENAME
        cache_mb = cache_file.stat().st_size / (1024 * 1024) if cache_file.is_file() else 0
        print(f"Кэш: {root / CACHE_FILENAME} — {len(_fetch_cache)} URL, {cache_mb:.2f} МБ", flush=True)
    else:
        print("Кэш отключён (--no-cache).", flush=True)

    external_descriptions: dict[str, str] | None = None
    if args.from_json:
        path = Path(args.from_json)
        if not path.is_absolute():
            path = root / path
        external_descriptions = json.loads(path.read_text(encoding="utf-8"))
        print(f"Загружено {len(external_descriptions)} описаний из {path.name}")

    collected: dict[str, str] = {} if args.save_json else None  # type: ignore

    html_files = sorted(catalog.rglob("index.html"))
    if args.only:
        html_files = [f for f in html_files if args.only in str(f)]
    if args.limit:
        html_files = html_files[: args.limit]

    n_total = len(html_files)
    workers = max(1, args.workers)
    print(f"Страниц к обработке: {n_total}", flush=True)
    if args.only:
        print(f"Фильтр --only: «{args.only}»", flush=True)
    if args.limit:
        print(f"Фильтр --limit: {args.limit}", flush=True)
    if not external_descriptions:
        print(f"Потоков: {workers}, таймаут запроса: {_fetch_timeout} с", flush=True)
    if not external_descriptions and workers > 1:
        print(f"Запуск (параллельно, {workers} потоков)...", flush=True)
    else:
        print("Запуск...", flush=True)
    if _log_fetch:
        print("Лог загрузки: [кэш] из кэша, [сеть] запрос, [повтор] повтор, [OK] успех, [ОШИБКА] сбой", flush=True)
    print("-" * 60, flush=True)

    total_updated = 0
    total_products = 0
    print_lock = threading.Lock()
    failed_first_pass: list[Path] = []
    failed_lock = threading.Lock()

    def do_one(i_f: tuple[int, Path]) -> tuple[int, Path, int, int, Exception | None]:
        i, f = i_f
        try:
            u, t = process_catalog_file(
                f, catalog, args.dry_run, args.limit,
                external_descriptions=external_descriptions,
                collected_descriptions=collected,
            )
            return (i, f, u, t, None)
        except Exception as e:
            return (i, f, 0, 0, e)

    def run_pass(files: list[Path], pass_name: str = "") -> None:
        nonlocal total_updated, total_products
        n = len(files)
        if n == 0:
            return
        if pass_name:
            print(pass_name, flush=True)
        if workers > 1 and not external_descriptions:
            done = 0
            with ThreadPoolExecutor(max_workers=workers) as executor:
                futures = {executor.submit(do_one, (i, f)): f for i, f in enumerate(files)}
                for fut in as_completed(futures):
                    i, f, u, t, err = fut.result()
                    total_updated += u
                    total_products += t
                    if u == 0 and t > 0 and not external_descriptions and not args.dry_run:
                        with failed_lock:
                            failed_first_pass.append(f)
                    done += 1
                    rel = f.relative_to(root)
                    with print_lock:
                        if err:
                            print(f"[{done}/{n}] {rel} | {t} т. | ОШИБКА: {type(err).__name__}: {err}", flush=True)
                        else:
                            msg = f"{t} т., +{u} оп." if u else f"{t} т., 0 оп."
                            print(f"[{done}/{n}] {rel} | {msg}", flush=True)
        else:
            for i, f in enumerate(files):
                if i > 0 and not external_descriptions and workers == 1:
                    time.sleep(0.3)
                rel = f.relative_to(root)
                try:
                    u, t = process_catalog_file(
                        f, catalog, args.dry_run, args.limit,
                        external_descriptions=external_descriptions,
                        collected_descriptions=collected,
                    )
                    total_updated += u
                    total_products += t
                    if u == 0 and t > 0 and not external_descriptions and not args.dry_run:
                        failed_first_pass.append(f)
                    msg = f"{t} т., +{u} оп." if u else f"{t} т., 0 оп."
                    print(f"[{i + 1}/{n}] {rel} | {msg}", flush=True)
                except Exception as e:
                    print(f"[{i + 1}/{n}] {rel} | ОШИБКА: {type(e).__name__}: {e}", flush=True)
                    print(f"ERR {f}: {e}", file=sys.stderr)
                    if not external_descriptions and not args.dry_run:
                        failed_first_pass.append(f)

    run_pass(html_files)

    # Повторная попытка для страниц, с которых не удалось загрузить описания (часто из‑за кратковременных сбоев сети)
    if failed_first_pass and not args.dry_run and not external_descriptions:
        retry_list = list(dict.fromkeys(failed_first_pass))
        print("-" * 60, flush=True)
        print(f"Повторная попытка для {len(retry_list)} страниц (без описаний с первого прохода):", flush=True)
        for p in retry_list[:5]:
            print(f"  — {p.relative_to(root)}", flush=True)
        if len(retry_list) > 5:
            print(f"  ... и ещё {len(retry_list) - 5}", flush=True)
        print("-" * 60, flush=True)
        time.sleep(2)
        retry_updated_before = total_updated
        run_pass(retry_list)
        retry_got = total_updated - retry_updated_before
        if retry_got > 0:
            print(f"При повторе загружено ещё {retry_got} описаний.", flush=True)
        else:
            print("При повторе новых описаний не получено.", flush=True)

    if args.save_json and collected:
        out_path = Path(args.save_json)
        if not out_path.is_absolute():
            out_path = root / out_path
        out_path.write_text(json.dumps(collected, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Сохранено {len(collected)} описаний в {out_path}")

    if _use_cache and _fetch_cache:
        _save_cache(root)
        cache_mb = (root / CACHE_FILENAME).stat().st_size / (1024 * 1024)
        print(f"Кэш: сохранено {len(_fetch_cache)} URL в {root / CACHE_FILENAME} ({cache_mb:.2f} МБ)", flush=True)

    elapsed = time.perf_counter() - start_time
    print("-" * 60, flush=True)
    print("Итог:", flush=True)
    print(f"  Обновлено описаний: {total_updated}", flush=True)
    print(f"  Товаров на обработанных страницах: {total_products}", flush=True)
    if not external_descriptions:
        with _stats_lock:
            hits, misses = _cache_hits, _cache_misses
        print(f"  Запросов из кэша: {hits}", flush=True)
        print(f"  Запросов с сети: {misses}", flush=True)
    print(f"  Время: {elapsed:.1f} с", flush=True)
    print("-" * 60, flush=True)


if __name__ == "__main__":
    main()
