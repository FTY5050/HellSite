/**
 * Шапка и подвал сайта (сгенерировано из assets/html/header.html и footer.html).
 * Пересборка: python3 scripts/build_header_footer_js.py
 */
(function () {
  "use strict";
  var headerHtml = "<nav class=\"industrial-header-light\">\n    <div class=\"header-inner\">\n        <a href=\"/index.html\" class=\"header-logo\">\n            <img src=\"/logo.svg\" alt=\"НПП КПК\" class=\"nav-logo-img\">\n        </a>\n        <ul class=\"header-links\">\n            <li><a href=\"/about/about.html\">О ПРЕДПРИЯТИИ</a></li>\n            <li class=\"sep\">/</li>\n            <li><a href=\"/catalog/catalog.html\">НОМЕНКЛАТУРА</a></li>\n            <li class=\"sep\">/</li>\n            <li><a href=\"/services/services.html\">УСЛУГИ</a></li>\n            <li class=\"sep\">/</li>\n            <li><a href=\"/reference/reference.html\">ОБЪЕКТЫ</a></li>\n            <li class=\"sep\">/</li>\n            <li><a href=\"/portfolio/portfolio.html\">ПРОИЗВОДСТВО</a></li>\n            <li class=\"sep\">/</li>\n            <li><a href=\"/contacts/contacts.html\">КОНТАКТЫ</a></li>\n        </ul>\n        <div class=\"header-cta\">\n            <a href=\"tel:+73854000000\" class=\"h-phone\">8 (3854) 00-00-00</a>\n            <button class=\"h-btn open-modal-trigger\" data-modal-type=\"contact\">СВЯЗАТЬСЯ</button>\n        </div>\n    </div>\n</nav>";
  var footerHtml = "<footer class=\"main-footer\">\n    <div class=\"footer-container\">\n        <div class=\"footer-col about\">\n            <div class=\"second-logo-area\">\n                <img src=\"/logo.svg\" alt=\"НПП КПК\" class=\"footer-logo-img\" style=\"height: 155px; width: auto; opacity: 0.8;\">\n            </div>\n        </div>\n        <div class=\"footer-col\">\n            <h4>Компания</h4>\n            <ul>\n                <li><a href=\"/about/about.html\">О предприятии</a></li>\n                <li><a href=\"/catalog/catalog.html\">Производство</a></li>\n                <li><a href=\"/reference/reference.html\">Проекты</a></li>\n                <li><a href=\"/contacts/contacts.html\">Контакты</a></li>\n            </ul>\n        </div>\n        <div class=\"footer-col\">\n            <h4>Продукция</h4>\n            <ul>\n                <li><a href=\"/catalog/kotly.html\">Паровые котлы</a></li>\n                <li><a href=\"/catalog/tyagodutevye-mashiny.html\">Тягодутьевые машины</a></li>\n                <li><a href=\"/catalog/vodopodgotovka.html\">Водоподготовка</a></li>\n                <li><a href=\"/catalog/zapchasti.html\">Запчасти</a></li>\n            </ul>\n        </div>\n        <div class=\"footer-col contacts\">\n            <h4>Связаться с нами</h4>\n            <div class=\"contact-item\">\n                <span class=\"label\">Телефон:</span>\n                <a href=\"tel:+73854000000\" class=\"phone\">8 (3854) 00-00-00</a>\n            </div>\n            <div class=\"contact-item\">\n                <span class=\"label\">Email:</span>\n                <a href=\"mailto:info@nppkpk.ru\">info@nppkpk.ru</a>\n            </div>\n            <div class=\"contact-item\">\n                <span class=\"label\">Адрес:</span>\n                <span>Бийск, пер. Прямой, 2г</span>\n            </div>\n        </div>\n    </div>\n    <div class=\"footer-bottom\">\n        <div class=\"bottom-container\">\n            <p>© 2026 ООО НПП «КПК». Все права защищены.</p>\n        </div>\n    </div>\n</footer>";
  var modalHtml = "<div id=\"contact-modal\" class=\"modal-overlay\" style=\"display: none;\">\n    <div class=\"modal-box\">\n        <button class=\"close-modal-btn\">×</button>\n        <div class=\"modal-body\">\n            <h3 class=\"modal-title\">ОСТАВИТЬ ЗАЯВКУ</h3>\n            <p class=\"modal-subtitle\">Специалист НПП «КПК» свяжется с вами и уточнит детали заказа.</p>\n            <form id=\"modal-form\" class=\"modal-form-content\">\n                <div class=\"input-group\">\n                    <input type=\"text\" placeholder=\"ВАШЕ ИМЯ\" required>\n                </div>\n                <div class=\"input-group\">\n                    <input type=\"tel\" placeholder=\"ТЕЛЕФОН\" required>\n                </div>\n                <div class=\"input-group\">\n                    <input type=\"email\" placeholder=\"EMAIL (НЕОБЯЗАТЕЛЬНО)\">\n                </div>\n                <div class=\"input-group\">\n                    <textarea placeholder=\"ВАШ ВОПРОС\" rows=\"3\"></textarea>\n                </div>\n                <button type=\"submit\" class=\"btn-yellow-full\">ОТПРАВИТЬ ДАННЫЕ</button>\n            </form>\n        </div>\n    </div>\n</div>";
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
    if (typeof document !== "undefined") {
      if (!document.getElementById("contact-modal")) {
        var modalHtmlApplied = applyBase(modalHtml);
        if (document.body) {
          document.body.insertAdjacentHTML("beforeend", modalHtmlApplied);
        }
      }
      if (!document.querySelector('script[src$="script.js"]')) {
        var base = basePath();
        var s = document.createElement("script");
        s.src = base + "script.js";
        document.body && document.body.appendChild(s);
      }
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
