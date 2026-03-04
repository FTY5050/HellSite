#!/usr/bin/env python3
"""
Заменяет абсолютные пути /assets/ на относительные во всех HTML,
чтобы сайт работал на GitHub Pages (проект в подпапке /HellSite/).
Запуск: из корня проекта: python3 scripts/fix_assets_paths_for_github_pages.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def depth(html_path: Path) -> int:
    """Глубина файла от корня проекта (0 = index.html в корне)."""
    try:
        rel = html_path.relative_to(ROOT)
    except ValueError:
        return 0
    return max(0, len(rel.parts) - 1)


def prefix_for(d: int) -> str:
    """Префикс вида ../ для заданной глубины."""
    return "../" * d if d > 0 else ""


def fix_file(path: Path) -> bool:
    """Возвращает True, если файл был изменён."""
    d = depth(path)
    pre = prefix_for(d)
    text = path.read_text(encoding="utf-8")
    orig = text

    # Атрибуты с двойными кавычками
    text = text.replace('href="/assets/', 'href="' + pre + 'assets/')
    text = text.replace('src="/assets/', 'src="' + pre + 'assets/')
    text = text.replace('href="/upload/', 'href="' + pre + 'upload/')
    text = text.replace('src="/upload/', 'src="' + pre + 'upload/')
    # С одинарными
    text = text.replace("href='/assets/", "href='" + pre + "assets/")
    text = text.replace("src='/assets/", "src='" + pre + "assets/")
    text = text.replace("href='/upload/", "href='" + pre + "upload/")
    text = text.replace("src='/upload/", "src='" + pre + "upload/")
    # JSON и прочие вхождения пути
    text = text.replace('"/upload/', '"' + pre + 'upload/')
    text = text.replace("'/upload/", "'" + pre + "upload/")

    if text != orig:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    changed = 0
    for html in ROOT.rglob("*.html"):
        if ".git" in html.parts:
            continue
        if fix_file(html):
            changed += 1
            print(html.relative_to(ROOT))
    print(f"\nИзменено файлов: {changed}")


if __name__ == "__main__":
    main()
