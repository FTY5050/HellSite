/**
 * Один шаблон карточки товара: рендер по данным из script#products-data.
 * Подключать после пустого <div class="catalog-container" id="catalog-container"></div>
 * и <script type="application/json" id="products-data">[...]</script>
 */
(function () {
  'use strict';

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  /**
   * Рендер одной карточки.
   * @param {Object} p - { title, img, alt?, price?, props?: [{ name, value }] }
   * @returns {string} HTML
   */
  function renderCard(p) {
    var title = escapeHtml(p.title || '');
    var img = escapeHtml(p.img || '');
    var alt = escapeHtml(p.alt != null ? p.alt : p.title || '');
    var price = escapeHtml(p.price != null ? p.price : 'Цена: по запросу');

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
    if (!container || !dataEl) return;

    var json = dataEl.textContent || dataEl.innerText || '';
    var list;
    try {
      list = JSON.parse(json);
    } catch (e) {
      return;
    }
    if (!Array.isArray(list)) return;

    var html = '';
    for (var i = 0; i < list.length; i++) {
      html += renderCard(list[i]);
    }
    container.innerHTML = html;
  }

  /** Кнопка «Подробнее»: открывает модалку с данными из карточки (делегирование для динамических карточек) */
  function initDetailsModal() {
    var modal = document.getElementById('item-desc-modal');
    if (!modal) return;

    document.body.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.btn-details');
      if (!btn) return;
      e.preventDefault();
      var card = btn.closest('.prod-card');
      if (!card) return;

      var titleEl = card.querySelector('.prod-info h4');
      var priceEl = card.querySelector('.product-price');
      var propsEl = card.querySelector('.product-props');

      var titleNode = document.getElementById('desc-modal-title');
      var priceNode = document.getElementById('desc-modal-price');
      var propsNode = document.getElementById('desc-modal-props');
      var descNode = document.getElementById('desc-modal-description');

      if (titleNode) titleNode.textContent = titleEl ? titleEl.textContent : '';
      if (priceNode) priceNode.innerHTML = priceEl ? priceEl.innerHTML : 'Цена: по запросу';
      if (propsNode) propsNode.innerHTML = propsEl ? propsEl.outerHTML : '';
      if (descNode) descNode.innerHTML = '';

      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });

    var closeBtn = modal.querySelector('.close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      });
    }
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  /** Открытие модалки по кнопке «Связаться», отправка формы на почту */
  function initOrderModal() {
    var modal = document.getElementById('contact-modal');
    var form = document.getElementById('modal-form');
    if (!modal) return;

    function openModal() {
      modal.style.display = 'flex';
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      modal.classList.remove('active');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }

    // Делегирование: кнопки рендерятся динамически, вешаем на document
    document.body.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.open-modal-trigger');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      openModal();
      var product = btn.getAttribute('data-item-title');
      if (form && product) {
        var ta = form.querySelector('textarea');
        if (ta) ta.value = 'Заказ: ' + product;
      }
    });

    var closeBtn = modal.querySelector('.close-modal-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInp = form.querySelector('input[type="text"]');
        var telInp = form.querySelector('input[type="tel"]');
        var emailInp = form.querySelector('input[type="email"]');
        var ta = form.querySelector('textarea');
        var name = nameInp ? nameInp.value.trim() : '';
        var phone = telInp ? telInp.value.trim() : '';
        var email = emailInp ? emailInp.value.trim() : '';
        var msg = ta ? ta.value.trim() : '';
        var subject = 'Заявка с сайта НПП КПК';
        var body = 'Имя: ' + name + '\nТелефон: ' + phone + '\nEmail: ' + email + '\n\nСообщение/заказ:\n' + msg;
        var mailto = 'mailto:info@nppkpk.ru?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        window.location.href = mailto;
        closeModal();
      });
    }
  }

  function run() {
    init();
    initDetailsModal();
    initOrderModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
