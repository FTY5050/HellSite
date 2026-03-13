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

# Шаблон подвала (пока не используем, но оставим для совместимости)
FOOTER_PATTERN = re.compile(
    r'<footer\s+class="main-footer"[^>]*>.*?</footer>',
    re.DOTALL | re.IGNORECASE
)

# Линк на старые стили шапки, которые конфликтуют с новой главной
HEADER_CSS_PATTERN = re.compile(
    r'\s*<link\s+href="[^"]*assets/css/vendor/header\.css"[^>]*>\s*',
    re.IGNORECASE
)

# Локальная модалка контактов (старый дизайн) — удаляем на всех внутренних страницах,
# чтобы везде использовалась одна глобальная модалка из header-footer.js.
CONTACT_MODAL_PATTERN = re.compile(
    r'\s*<div\s+class="modal-overlay"\s+id="contact-modal">.*?</div>\s*',
    re.DOTALL | re.IGNORECASE
)

# Теперь используем только placeholder для шапки;
# подвал больше не трогаем этим скриптом.
HEADER_PLACEHOLDER = '<div id="site-header"></div>'

# Скрипт шапки/подвала подключаем один раз перед </body>
HEADER_SCRIPT_TAG = '<script src="/assets/js/header-footer.js"></script>'


def already_has_header_placeholder(html: str) -> bool:
    return 'id="site-header"' in html


def has_header_script(html: str) -> bool:
    return 'header-footer.js' in html


def process_file(path: Path, dry_run: bool) -> bool:
    """Возвращает True, если файл был изменён."""
    try:
        html = path.read_text(encoding='utf-8', errors='replace')
    except Exception:
        return False

    changed = False
    # Заменяем только шапку, если placeholder ещё не стоит
    if NAV_PATTERN.search(html) and not already_has_header_placeholder(html):
        new_html, n = NAV_PATTERN.subn(HEADER_PLACEHOLDER, html, count=1)
        if n:
            html = new_html
            changed = True

    # Удаляем линк на старый header.css, чтобы стили шапки
    # в категориях не отличались от главной страницы.
    new_html, n_css = HEADER_CSS_PATTERN.subn("", html)
    if n_css:
        html = new_html
        changed = True

    # Удаляем старую локальную модалку контактов, если она есть
    new_html, n_modal = CONTACT_MODAL_PATTERN.subn("", html)
    if n_modal:
        html = new_html
        changed = True

    # Если шапка была заменена и на странице ещё нет header-footer.js,
    # добавляем подключение перед </body> (или в конец файла, если его нет).
    if changed and not has_header_script(html):
        idx = html.lower().rfind('</body>')
        if idx != -1:
            html = html[:idx] + HEADER_SCRIPT_TAG + '\n' + html[idx:]
        else:
            html = html + '\n' + HEADER_SCRIPT_TAG + '\n'

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
