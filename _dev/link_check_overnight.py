#!/usr/bin/env python3
"""
Проверка всех ссылок на сайте (внутренние + опционально внешние).
Рассчитан на долгий прогон: внешние URL проверяются с паузой между запросами.

Запуск:
  cd "/home/arkadiy/Programs/html/Новая папка"
  python3 _dev/link_check_overnight.py                    # только внутренние (быстро)
  python3 _dev/link_check_overnight.py --external        # + внешние, пауза 2 сек
  python3 _dev/link_check_overnight.py --external --delay 5   # 5 сек между внешними = дольше
  python3 _dev/link_check_overnight.py --external --delay 10 --delay-pages 1  # ещё дольше

Режим «на всю ночь» (много часов):
  nohup python3 _dev/link_check_overnight.py --external --delay 15 --delay-pages 2 > link_check_stdout.txt 2>&1 &
  tail -f link_check.log   # смотреть прогресс

Лог: link_check.log, отчёт: link_check_report.txt
"""

import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
import argparse
from datetime import datetime
from typing import List, Tuple, Optional

# Корень сайта (папка с index.html)
SITE_ROOT = Path(__file__).resolve().parent.parent
LOG_FILE = SITE_ROOT / "link_check.log"
REPORT_FILE = SITE_ROOT / "link_check_report.txt"
# Пауза между запросами к внешним сайтам (секунды)
DEFAULT_EXTERNAL_DELAY = 2
# Пауза после обработки каждой HTML-страницы (секунды), 0 = не ждать
DEFAULT_PAGE_DELAY = 0


def log(msg: str) -> None:
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


class LinkCollector(HTMLParser):
    def __init__(self, base_path: Path, base_url: str):
        super().__init__()
        self.base_path = base_path
        self.base_url = base_url or "file:///"
        self.hrefs = []
        self.srcs = []

    def resolve(self, path_or_url: str) -> str:
        if path_or_url.startswith(("#", "mailto:", "tel:")):
            return path_or_url
        if path_or_url.strip() == "":
            return path_or_url
        return urljoin(self.base_url, path_or_url)

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "a" and "href" in d:
            self.hrefs.append(self.resolve(d["href"].strip()))
        if tag in ("img", "script") and "src" in d:
            self.srcs.append(self.resolve(d["src"].strip()))
        if tag == "link" and d.get("rel") == "stylesheet" and "href" in d:
            self.srcs.append(self.resolve(d["href"].strip()))


def collect_links(html_path: Path) -> Tuple[List[str], List[str]]:
    try:
        with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
            raw = f.read()
    except Exception as e:
        return [], []

    # base URL для разрешения относительных путей (от корня сайта)
    try:
        rel = html_path.relative_to(SITE_ROOT)
        parts = rel.parts[:-1]  # без имени файла
        base_url = "file:///" + str(SITE_ROOT) + "/" + "/".join(parts) + "/" if parts else "file:///" + str(SITE_ROOT) + "/"
    except ValueError:
        base_url = "file:///" + str(SITE_ROOT) + "/"

    parser = LinkCollector(html_path.parent, base_url)
    try:
        parser.feed(raw)
    except Exception:
        pass

    hrefs = [u for u in parser.hrefs if u and not u.startswith("#") and not u.startswith("mailto:") and not u.startswith("tel:")]
    srcs = [u for u in parser.srcs if u and not u.startswith("data:")]
    return hrefs, srcs


def is_external(url: str) -> bool:
    if url.startswith("file://"):
        return False
    parsed = urlparse(url)
    return bool(parsed.netloc)


def url_to_internal_path(url: str) -> Optional[Path]:
    if url.startswith("file://"):
        path = url.replace("file://", "").split("?")[0].split("#")[0]
        p = Path(path)
        # Ссылки от корня вида file:///index.html → относительны от SITE_ROOT
        if p.is_absolute() and (p.exists() or str(SITE_ROOT) in str(p)):
            return p
        return SITE_ROOT / path.lstrip("/")
    parsed = urlparse(url)
    if not parsed.netloc:
        path = (parsed.path or "").lstrip("/").split("?")[0].split("#")[0]
        if not path:
            return None
        return SITE_ROOT / path
    return None


def check_internal(url: str) -> Tuple[bool, str]:
    p = url_to_internal_path(url)
    if p is None:
        return True, "skip"
    if not p.is_absolute():
        p = SITE_ROOT / p
    if p.exists():
        return True, "ok"
    # попробовать как директорию + index.html
    if (p / "index.html").exists():
        return True, "ok"
    return False, "missing"


def check_external(url: str, timeout: int = 15) -> Tuple[bool, str]:
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "LinkChecker/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status < 400, str(r.status)
    except urllib.error.HTTPError as e:
        return False, str(e.code)
    except urllib.error.URLError as e:
        return False, str(e.reason)[:80]
    except Exception as e:
        return False, str(e)[:80]


def main():
    ap = argparse.ArgumentParser(description="Проверка ссылок на сайте (можно оставить на ночь)")
    ap.add_argument("--external", action="store_true", help="Проверять также внешние URL (долго)")
    ap.add_argument("--delay", type=float, default=DEFAULT_EXTERNAL_DELAY, help="Пауза между запросами к внешним URL (сек)")
    ap.add_argument("--delay-pages", type=float, default=DEFAULT_PAGE_DELAY, help="Пауза после каждой HTML-страницы (сек)")
    ap.add_argument("--timeout", type=int, default=15, help="Таймаут одного внешнего запроса (сек)")
    args = ap.parse_args()

    # Собираем все HTML
    html_files = list(SITE_ROOT.rglob("*.html"))
    html_files = [p for p in html_files if "_drafts" not in p.parts and "_dev" not in p.parts]
    total_pages = len(html_files)

    log(f"Старт. Страниц: {total_pages}, внешние: {args.external}, delay: {args.delay}s, delay-pages: {args.delay_pages}s")

    seen_internal = {}
    seen_external = {}
    broken_internal = []
    broken_external = []
    internal_ok = 0
    external_ok = 0
    external_skipped = 0

    for i, html_path in enumerate(html_files, 1):
        rel_path = html_path.relative_to(SITE_ROOT)
        hrefs, srcs = collect_links(html_path)
        all_urls = list(dict.fromkeys(hrefs + srcs))

        for url in all_urls:
            if is_external(url):
                if not args.external:
                    external_skipped += 1
                    continue
                key = url.split("#")[0].split("?")[0]
                if key in seen_external:
                    continue
                seen_external[key] = True
                time.sleep(args.delay)
                ok, msg = check_external(url, timeout=args.timeout)
                if ok:
                    external_ok += 1
                else:
                    broken_external.append((url, msg))
                    log(f"  ВНЕШНЯЯ ОШИБКА: {url} -> {msg}")
            else:
                key = url.split("#")[0].split("?")[0]
                if key in seen_internal:
                    continue
                seen_internal[key] = True
                ok, _ = check_internal(url)
                if ok:
                    internal_ok += 1
                else:
                    broken_internal.append((str(rel_path), url))
                    log(f"  ВНУТРЕННЯЯ ОШИБКА: {rel_path} -> {url}")

        if i % 50 == 0:
            log(f"Обработано страниц: {i}/{total_pages}")
        if args.delay_pages > 0:
            time.sleep(args.delay_pages)

    # Отчёт
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(f"Отчёт проверки ссылок — {datetime.now().isoformat()}\n")
        f.write(f"Страниц: {total_pages}, внутренних уникальных: {len(seen_internal)}, внешних проверено: {len(seen_external)}, пропущено внешних: {external_skipped}\n\n")
        f.write("--- Битые внутренние ссылки ---\n")
        for page, url in broken_internal:
            f.write(f"  {page} -> {url}\n")
        f.write("\n--- Битые или недоступные внешние ссылки ---\n")
        for url, msg in broken_external:
            f.write(f"  {url} -> {msg}\n")
        f.write("\n--- Итог ---\n")
        f.write(f"Внутренние: OK {internal_ok}, ошибок {len(broken_internal)}\n")
        f.write(f"Внешние: OK {external_ok}, ошибок {len(broken_external)}\n")

    log(f"Готово. Ошибок внутренних: {len(broken_internal)}, внешних: {len(broken_external)}. Отчёт: {REPORT_FILE}")
    return 0 if (not broken_internal and not broken_external) else 1


if __name__ == "__main__":
    sys.exit(main())
