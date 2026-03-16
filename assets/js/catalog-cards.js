/**
 * Один шаблон карточки товара: рендер по данным из script#products-data.
 * Подключать после пустого <div class="catalog-container" id="catalog-container"></div>
 * и <script type="application/json" id="products-data">[...]</script>
 */
(function () {
  'use strict';
  var LOG = false; // логи в консоль; включить: window.NPPKPK_CatalogDebug = true после загрузки
  function log() {
    if (LOG && (typeof window.NPPKPK_CatalogDebug === 'undefined' || window.NPPKPK_CatalogDebug)) {
      console.log.apply(console, ['[NPPKPK catalog]'].concat(Array.prototype.slice.call(arguments)));
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  /**
   * Рендер одной карточки.
   * @param {Object} p - { title, img, alt?, price?, description?, props?: [{ name, value }] }
   * @returns {string} HTML
   */
  function renderCard(p) {
    var title = escapeHtml(p.title || '');
    var img = escapeHtml(p.img || '');
    var alt = escapeHtml(p.alt != null ? p.alt : p.title || '');
    var price = escapeHtml(p.price != null ? p.price : 'Цена: по запросу');
    var description = (p.description != null && String(p.description).trim()) ? escapeHtml(String(p.description).trim()) : '';

    var propsHtml = '';
    if (p.props && p.props.length) {
      var isListStyle = p.props.every(function (row) { return (row.name || '').trim() === '—' || (row.name || '').trim() === ''; });
      if (isListStyle) {
        propsHtml = '<div class="product-props product-props--list"><span class="product-props__title">Комплектация</span><ul>';
        for (var i = 0; i < p.props.length; i++) {
          var val = escapeHtml(p.props[i].value != null ? String(p.props[i].value) : '');
          if (val) propsHtml += '<li>' + val + '</li>';
        }
        propsHtml += '</ul></div>';
      } else {
        propsHtml = '<div class="product-props"><table>';
        for (var i = 0; i < p.props.length; i++) {
          var row = p.props[i];
          var name = escapeHtml(row.name || '');
          var value = escapeHtml(row.value != null ? String(row.value) : '');
          var nowrap = name.length > 25 ? ' style="white-space:nowrap"' : '';
          propsHtml += '<tr><td' + nowrap + '>' + name + '</td><td>' + value + '</td></tr>';
        }
        propsHtml += '</table></div>';
      }
    }

    var placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e8e8e8" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="14" font-family="sans-serif"%3ENет фото%3C/text%3E%3C/svg%3E';
    return (
      '<div class="prod-card">' +
        '<div class="prod-img"><img alt="' + alt + '" src="' + img + '" data-placeholder="' + placeholderSvg + '" onerror="this.onerror=null;this.src=this.getAttribute(\'data-placeholder\')||\'\';"/></div>' +
        '<div class="prod-info">' +
          '<h4>' + title + '</h4>' +
          '<div class="product-price">' + price + '</div>' +
          propsHtml +
          '<div class="product-description" style="display:none">' + description + '</div>' +
          '<div class="prod-actions">' +
          '<button type="button" class="btn-details">Подробнее</button>' +
          '<button type="button" class="btn-add-to-cart" data-item-title="' + alt + '">В корзину</button>' +
        '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function init() {
    var container = document.getElementById('catalog-container');
    var dataEl = document.getElementById('products-data');
    log('init: container=', !!container, 'dataEl=', !!dataEl);
    if (!container || !dataEl) {
      log('init: выход (нет container или products-data)');
      return;
    }

    var json = dataEl.textContent || dataEl.innerText || '';
    var list;
    try {
      list = JSON.parse(json);
    } catch (e) {
      log('init: ошибка парсинга JSON', e);
      return;
    }
    if (!Array.isArray(list)) {
      log('init: products-data не массив');
      return;
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
      html += renderCard(list[i]);
    }
    container.innerHTML = html;
    var btnCount = container.querySelectorAll('.btn-details').length;
    log('init: отрисовано карточек:', list.length, 'кнопок "Подробнее":', btnCount);

    // #region agent log
    try {
      var firstCard = container.querySelector('.prod-card');
      if (firstCard) {
        fetch('http://127.0.0.1:7671/ingest/540318ba-453b-4b17-ac6f-00e2f31037b9', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '9a37a3'
          },
          body: JSON.stringify({
            sessionId: '9a37a3',
            runId: 'vpu-layout-1',
            hypothesisId: 'H1',
            location: 'assets/js/catalog-cards.js:init',
            message: 'catalog layout sizes',
            data: {
              containerWidth: container.offsetWidth,
              containerScrollWidth: container.scrollWidth,
              cardWidth: firstCard.offsetWidth,
              cardScrollWidth: firstCard.scrollWidth,
              viewportWidth: document.documentElement.clientWidth,
              pageScrollWidth: document.documentElement.scrollWidth
            },
            timestamp: Date.now()
          })
        }).catch(function () {});
      }
    } catch (e) {
      // проглатываем ошибки логгера, чтобы не ломать страницу
    }
    // #endregion
  }

  /** Создаёт модалку «Подробнее», если её нет на странице */
  function ensureDetailsModal() {
    var modal = document.getElementById('item-desc-modal');
    if (modal) {
      log('ensureDetailsModal: модалка уже есть в DOM');
      return modal;
    }
    log('ensureDetailsModal: создаю модалку');
    var overlay = document.createElement('div');
    overlay.id = 'item-desc-modal';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="modal-box" style="max-width: 600px;">' +
        '<button type="button" class="close-modal-btn" aria-label="Закрыть">×</button>' +
        '<div class="modal-body">' +
          '<h3 class="modal-title" id="desc-modal-title"></h3>' +
          '<div class="modal-price" id="desc-modal-price"></div>' +
          '<div class="modal-description" id="desc-modal-description"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    log('ensureDetailsModal: модалка добавлена в body');
    return overlay;
  }

  /** Кнопка «Подробнее»: открывает модалку с названием, ценой и описанием (делегирование) */
  function initDetailsModal() {
    var modal = ensureDetailsModal();
    var titleNode = document.getElementById('desc-modal-title');
    var priceNode = document.getElementById('desc-modal-price');
    var descNode = document.getElementById('desc-modal-description');
    log('initDetailsModal: modal=', !!modal, 'titleNode=', !!titleNode, 'priceNode=', !!priceNode, 'descNode=', !!descNode);

    document.body.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.btn-details');
      if (!btn) return;
      log('click: клик по .btn-details', e.target);
      e.preventDefault();
      e.stopPropagation();
      var card = btn.closest('.prod-card');
      if (!card) {
        log('click: не найден .prod-card');
        return;
      }

      var titleEl = card.querySelector('.prod-info h4');
      var priceEl = card.querySelector('.product-price');
      var descEl = card.querySelector('.product-description');
      var descText = descEl && descEl.textContent ? descEl.textContent.trim() : '';
      if (descText) {
        // Убираем ведущее слово "Описание" во всех вариантах регистра и с разделителями
        descText = descText.replace(/^Описание[\s:–-]*/i, '');
      }

      if (titleNode) titleNode.textContent = titleEl ? titleEl.textContent : '';
      if (priceNode) priceNode.innerHTML = priceEl ? priceEl.innerHTML : 'Цена: по запросу';
      if (descNode) {
        descNode.style.display = '';
        descNode.textContent = descText || 'Описание уточняйте у менеджера.';
      }
      var propsNode = document.getElementById('desc-modal-props');
      if (propsNode) {
        propsNode.style.display = 'none';
        propsNode.innerHTML = '';
      }

      log('click: показываю модалку, title=', titleNode ? titleNode.textContent : '');
      modal.style.display = 'flex';
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });

    log('initDetailsModal: обработчик click на body повешен');
    var closeBtn = modal.querySelector('.close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        modal.style.display = 'none';
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    }
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  }

  function run() {
    log('run() старт, readyState=', document.readyState);
    init();
    initDetailsModal();
    log('run() конец');
  }

  if (document.readyState === 'loading') {
    log('ждём DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  window.NPPKPK_CatalogDebug = false;
})();
