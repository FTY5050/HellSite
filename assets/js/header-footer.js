/**
 * Шапка и подвал сайта (сгенерировано из assets/html/header.html и footer.html).
 * Пересборка: python3 scripts/build_header_footer_js.py
 */
(function () {
  "use strict";
  var headerHtml = "<nav class=\"industrial-header-light\">\n    <div class=\"header-inner\">\n        <a href=\"/index.html\" class=\"header-logo\">\n            <img src=\"/logo2.png\" alt=\"НПП КПК\" class=\"nav-logo-img\">\n        </a>\n        <ul class=\"header-links\">\n            <li><a href=\"/about/index.html\">О ПРЕДПРИЯТИИ</a></li>\n            <li class=\"sep\">/</li>\n            <li><a href=\"/catalog/index.html\">НОМЕНКЛАТУРА</a></li>\n            <li class=\"sep\">/</li>\n            <li><a href=\"/services/index.html\">УСЛУГИ</a></li>\n            <li class=\"sep\">/</li>\n            <li><a href=\"/reference/index.html\">ОБЪЕКТЫ</a></li>\n            <li class=\"sep\">/</li>\n            <li><a href=\"/portfolio/index.html\">ПРОИЗВОДСТВО</a></li>\n            <li class=\"sep\">/</li>\n            <li><a href=\"/contacts/index.html\">КОНТАКТЫ</a></li>\n        </ul>\n        <div class=\"header-cta\">\n            <a href=\"tel:+73854000000\" class=\"h-phone\">8 (3854) 00-00-00</a>\n            <button class=\"h-btn open-modal-trigger\">СВЯЗАТЬСЯ</button>\n        </div>\n    </div>\n</nav>";
  var footerHtml = "<footer class=\"main-footer\">\n    <div class=\"footer-container\">\n        <div class=\"footer-col about\">\n            <div class=\"second-logo-area\">\n                <img src=\"/logo2.png\" alt=\"НПП КПК\" style=\"height: 155px; width: auto; opacity: 0.8;\">\n            </div>\n        </div>\n        <div class=\"footer-col\">\n            <h4>Компания</h4>\n            <ul>\n                <li><a href=\"/about/index.html\">О предприятии</a></li>\n                <li><a href=\"/catalog/index.html\">Производство</a></li>\n                <li><a href=\"/reference/index.html\">Проекты</a></li>\n                <li><a href=\"/contacts/index.html\">Контакты</a></li>\n            </ul>\n        </div>\n        <div class=\"footer-col\">\n            <h4>Продукция</h4>\n            <ul>\n                <li><a href=\"/catalog/kotly/index.html\">Паровые котлы</a></li>\n                <li><a href=\"/catalog/tyagodutevye-mashiny/index.html\">Тягодутьевые машины</a></li>\n                <li><a href=\"/catalog/vodopodgotovka/index.html\">Водоподготовка</a></li>\n                <li><a href=\"/catalog/zapchasti/index.html\">Запчасти</a></li>\n            </ul>\n        </div>\n        <div class=\"footer-col contacts\">\n            <h4>Связаться с нами</h4>\n            <div class=\"contact-item\">\n                <span class=\"label\">Телефон:</span>\n                <a href=\"tel:+73854000000\" class=\"phone\">8 (3854) 00-00-00</a>\n            </div>\n            <div class=\"contact-item\">\n                <span class=\"label\">Email:</span>\n                <a href=\"mailto:info@nppkpk.ru\">info@nppkpk.ru</a>\n            </div>\n            <div class=\"contact-item\">\n                <span class=\"label\">Адрес:</span>\n                <span>Бийск, пер. Прямой, 2г</span>\n            </div>\n        </div>\n    </div>\n    <div class=\"footer-bottom\">\n        <div class=\"bottom-container\">\n            <p>© 2026 ООО НПП «КПК». Все права защищены.</p>\n        </div>\n    </div>\n</footer>";
  function basePath() {
    var path = (typeof location !== "undefined" && location.pathname) || "";
    var segments = path.split("/").filter(Boolean);
    if (segments.length <= 1) return "";
    var depth = (path.slice(-1) === "/") ? segments.length : segments.length - 1;
    return "../".repeat(depth);
  }
  function applyBase(html) {
    var base = basePath();
    if (!base) return html;
    return html.replace(/href="\//g, 'href="' + base).replace(/src="\//g, 'src="' + base);
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
