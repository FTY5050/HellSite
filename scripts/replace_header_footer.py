#!/usr/bin/env python3
"""
Заменить во всех HTML-файлах встроенную шапку и подвал на placeholders,
чтобы они подставлялись из assets/html/header.html и footer.html через header-footer.js.

Запуск: python3 scripts/replace_header_footer.py [--dry-run] [path_to_site_root]
"""

import argparse
import re
from pathlib import Path


# Шаблон шапки: от <nav class="industrial-header-light" до закрывающего </nav>
NAV_PATTERN = re.compile(
    r'<nav\s+class="industrial-header-light"[^>]*>.*?</nav>',
    re.DOTALL | re.IGNORECASE
)

# Шаблон подвала: от <footer class="main-footer" до закрывающего </footer>
FOOTER_PATTERN = re.compile(
    r'<footer\s+class="main-footer"[^>]*>.*?</footer>',
    re.DOTALL | re.IGNORECASE
)

HEADER_PLACEHOLDER = '''<div id="site-header"></div>
<script src="/assets/js/header-footer.js"></script>'''

FOOTER_PLACEHOLDER = '<div id="site-footer"></div>'


def already_has_placeholders(html: str) -> bool:
    return 'id="site-header"' in html and 'id="site-footer"' in html


def has_header_script(html: str) -> bool:
    return 'header-footer.js' in html


def process_file(path: Path, dry_run: bool) -> bool:
    """Возвращает True, если файл был изменён."""
    try:
        html = path.read_text(encoding='utf-8', errors='replace')
    except Exception:
        return False

    if already_has_placeholders(html):
        return False

    changed = False
    if NAV_PATTERN.search(html) and not already_has_placeholders(html):
        new_html, n = NAV_PATTERN.subn(HEADER_PLACEHOLDER, html, count=1)
        if n:
            html = new_html
            changed = True

    if FOOTER_PATTERN.search(html):
        new_html, n = FOOTER_PATTERN.subn(FOOTER_PLACEHOLDER, html, count=1)
        if n:
            html = new_html
            changed = True

    if changed and not dry_run:
        path.write_text(html, encoding='utf-8')
    return changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true', help='Не записывать файлы')
    parser.add_argument('path', nargs='?', default='.', help='Корень сайта')
    args = parser.parse_args()
    root = Path(args.path).resolve()

    html_files = [
        f for f in root.rglob('*.html')
        if f.is_file()
        and '.git' not in str(f)
        and 'node_modules' not in str(f)
        and 'assets/html' not in str(f)  # не трогать сами фрагменты шапки/подвала
    ]

    updated = 0
    for f in sorted(html_files):
        if process_file(f, args.dry_run):
            updated += 1
            print(f"{'[dry-run] ' if args.dry_run else ''}{f.relative_to(root)}")

    print(f"\nОбработано файлов с заменой: {updated} из {len(html_files)}")


if __name__ == '__main__':
    main()
