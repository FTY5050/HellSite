#!/usr/bin/env python3
"""Добавить cart.css и cart.js во все страницы каталога, где есть catalog-cards.js."""
import os
import re

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
CART_CSS = '<link href="/assets/css/cart.css" rel="stylesheet" type="text/css"/>'
CART_JS = '<script src="/assets/js/cart.js"></script>'

def main():
    catalog_dir = os.path.join(ROOT, "catalog")
    count_css = 0
    count_js = 0
    for dirpath, _dirnames, filenames in os.walk(catalog_dir):
        for name in filenames:
            if not name.endswith(".html"):
                continue
            path = os.path.join(dirpath, name)
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
            except Exception as e:
                print("Read error", path, e)
                continue
            if "catalog-cards.js" not in content:
                continue
            modified = False
            if "cart.css" not in content and "multiregion.css" in content:
                content = re.sub(
                    r'(<link[^>]+multiregion\.css[^>]*>)',
                    r'\1\n' + CART_CSS,
                    content,
                    count=1
                )
                count_css += 1
                modified = True
            if "cart.js" not in content:
                content = content.replace(
                    '<script src="/assets/js/catalog-cards.js"></script>',
                    '<script src="/assets/js/catalog-cards.js"></script>\n<script src="/assets/js/cart.js"></script>',
                    1
                )
                if "cart.js" in content:
                    count_js += 1
                    modified = True
            if modified:
                with open(path, "w", encoding="utf-8", newline="") as f:
                    f.write(content)
                print("Updated:", os.path.relpath(path, ROOT))
    print("Added cart.css to", count_css, "files; cart.js to", count_js, "files")

if __name__ == "__main__":
    main()
