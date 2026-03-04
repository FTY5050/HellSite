#!/usr/bin/env python3
"""
Собрать assets/js/header-footer.js из assets/html/header.html и footer.html.
HTML встраивается в скрипт — шапка и подвал подставляются мгновенно, без запросов к серверу.

После изменения header.html или footer.html запустите:
  python3 scripts/build_header_footer_js.py
"""

import json
from pathlib import Path


def main():
    root = Path(__file__).resolve().parent.parent
    header_path = root / "assets" / "html" / "header.html"
    footer_path = root / "assets" / "html" / "footer.html"
    out_path = root / "assets" / "js" / "header-footer.js"

    header_html = header_path.read_text(encoding="utf-8").strip()
    footer_html = footer_path.read_text(encoding="utf-8").strip()

    # Экранируем для строки в JS (двойные кавычки, обратный слэш, переносы)
    header_esc = json.dumps(header_html, ensure_ascii=False)
    footer_esc = json.dumps(footer_html, ensure_ascii=False)

    js = '''/**
 * Шапка и подвал сайта (сгенерировано из assets/html/header.html и footer.html).
 * Пересборка: python3 scripts/build_header_footer_js.py
 */
(function () {
  "use strict";
  var headerHtml = %s;
  var footerHtml = %s;
  function basePath() {
    var path = (typeof location !== "undefined" && location.pathname) || "";
    var segments = path.split("/").filter(Boolean);
    if (segments.length <= 1) return "";
    return "../".repeat(segments.length - 1);
  }
  function applyBase(html) {
    var base = basePath();
    if (!base) return html;
    return html.replace(/href="\\//g, 'href="' + base).replace(/src="\\//g, 'src="' + base);
  }
  function inject(id, html) {
    var el = document.getElementById(id);
    if (el && html) el.innerHTML = html;
  }
  function run() {
    inject("site-header", applyBase(headerHtml));
    inject("site-footer", applyBase(footerHtml));
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
''' % (header_esc, footer_esc)

    out_path.write_text(js, encoding="utf-8")
    print("OK:", out_path.relative_to(root))


if __name__ == "__main__":
    main()
