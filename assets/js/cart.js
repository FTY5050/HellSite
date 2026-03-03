/**
 * Корзина заявок: добавление позиций из каталога, хранение в localStorage,
 * виджет в шапке, оформление одной заявкой через модальную форму.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'nppkpk_request_cart';

  function getCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setCart(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return true;
    } catch (e) {
      return false;
    }
  }

  function addItem(title, url) {
    var cart = getCart();
    var id = Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    cart.push({ id: id, title: title || 'Позиция', url: url || '' });
    setCart(cart);
    return cart;
  }

  function removeItem(id) {
    var cart = getCart().filter(function (item) { return item.id !== id; });
    setCart(cart);
    return cart;
  }

  function clearCart() {
    setCart([]);
    return [];
  }

  function renderWidget() {
    var cart = getCart();
    var count = cart.length;
    var countText = count > 0 ? count : '';
    var listHtml = '';
    if (count > 0) {
      listHtml = '<ul class="cart-widget__list">';
      cart.forEach(function (item) {
        listHtml += '<li class="cart-widget__item" data-id="' + item.id + '">';
        listHtml += '<span class="cart-widget__item-title">' + escapeHtml(item.title) + '</span>';
        listHtml += '<button type="button" class="cart-widget__remove" aria-label="Удалить">×</button>';
        listHtml += '</li>';
      });
      listHtml += '</ul>';
      listHtml += '<button type="button" class="cart-widget__submit btn-open-request-modal">Оформить заявку</button>';
    } else {
      listHtml = '<p class="cart-widget__empty">Корзина пуста</p>';
    }
    return (
      '<div class="cart-widget" id="request-cart-widget">' +
        '<button type="button" class="cart-widget__trigger" aria-label="Корзина">' +
          '<span class="cart-widget__icon">📋</span>' +
          '<span class="cart-widget__badge">' + countText + '</span>' +
        '</button>' +
        '<div class="cart-widget__dropdown">' +
          '<div class="cart-widget__header">Корзина</div>' +
          listHtml +
        '</div>' +
      '</div>'
    );
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function updateBadgeAndDropdown() {
    var widget = document.getElementById('request-cart-widget');
    if (!widget) return;
    var cart = getCart();
    var badge = widget.querySelector('.cart-widget__badge');
    var dropdown = widget.querySelector('.cart-widget__dropdown');
    if (badge) badge.textContent = cart.length > 0 ? cart.length : '';
    if (dropdown) {
      if (cart.length === 0) {
        dropdown.innerHTML = '<div class="cart-widget__header">Корзина</div><p class="cart-widget__empty">Корзина пуста</p>';
      } else {
        var listHtml = '<ul class="cart-widget__list">';
        cart.forEach(function (item) {
          listHtml += '<li class="cart-widget__item" data-id="' + item.id + '">';
          listHtml += '<span class="cart-widget__item-title">' + escapeHtml(item.title) + '</span>';
          listHtml += '<button type="button" class="cart-widget__remove" aria-label="Удалить">×</button>';
          listHtml += '</li>';
        });
        listHtml += '</ul><button type="button" class="cart-widget__submit btn-open-request-modal">Оформить заявку</button>';
        dropdown.innerHTML = '<div class="cart-widget__header">Корзина</div>' + listHtml;
        bindDropdownEvents(widget);
      }
    }
  }

  function bindDropdownEvents(widget) {
    if (!widget) return;
    widget.querySelectorAll('.cart-widget__remove').forEach(function (btn) {
      btn.onclick = function () {
        var li = this.closest('.cart-widget__item');
        if (li) removeItem(li.dataset.id);
        updateBadgeAndDropdown();
      };
    });
    var submitBtn = widget.querySelector('.btn-open-request-modal');
    if (submitBtn) submitBtn.onclick = openRequestModalWithCart;
  }

  function openRequestModalWithCart() {
    var modal = document.getElementById('contact-modal');
    var form = document.getElementById('modal-form');
    if (!modal) return;
    var cart = getCart();
    var text = cart.length > 0
      ? 'Состав заказа (корзина):\n' + cart.map(function (i) { return '• ' + i.title; }).join('\n')
      : '';
    if (form) {
      var ta = form.querySelector('textarea');
      if (ta) ta.value = text;
    }
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    var dropdown = document.querySelector('.cart-widget__dropdown');
    if (dropdown) dropdown.classList.remove('cart-widget__dropdown--open');
  }

  function initWidget() {
    var cta = document.querySelector('.header-cta');
    if (!cta) return;
    var wrap = document.createElement('div');
    wrap.className = 'cart-widget-wrap';
    wrap.innerHTML = renderWidget();
    cta.insertBefore(wrap, cta.firstChild);

    var widget = document.getElementById('request-cart-widget');
    if (!widget) return;

    var trigger = widget.querySelector('.cart-widget__trigger');
    var dropdown = widget.querySelector('.cart-widget__dropdown');
    if (trigger && dropdown) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('cart-widget__dropdown--open');
      });
      document.addEventListener('click', function () {
        dropdown.classList.remove('cart-widget__dropdown--open');
      });
      dropdown.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
    bindDropdownEvents(widget);
  }

  function initAddToCartButtons() {
    document.body.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn-add-to-cart');
      if (!btn) return;
      e.preventDefault();
      var title = btn.getAttribute('data-item-title') || btn.textContent.trim() || 'Позиция';
      var url = btn.getAttribute('data-item-url') || '';
      addItem(title, url);
      updateBadgeAndDropdown();
      var widget = document.getElementById('request-cart-widget');
      if (widget) {
        var badge = widget.querySelector('.cart-widget__badge');
        if (badge) badge.textContent = getCart().length;
      }
      var toast = document.createElement('div');
      toast.className = 'cart-toast';
      toast.textContent = 'Добавлено в корзину';
      document.body.appendChild(toast);
      setTimeout(function () {
        toast.classList.add('cart-toast--hide');
        setTimeout(function () { toast.remove(); }, 300);
      }, 1500);
    });
  }

  function clearCartOnSubmit() {
    var form = document.getElementById('modal-form');
    if (!form) return;
    form.addEventListener('submit', function () {
      var cart = getCart();
      if (cart.length > 0) {
        clearCart();
        updateBadgeAndDropdown();
      }
    });
  }

  function run() {
    initWidget();
    initAddToCartButtons();
    clearCartOnSubmit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  window.NPPKPK_Cart = {
    getCart: getCart,
    addItem: addItem,
    removeItem: removeItem,
    clearCart: clearCart,
    updateUI: updateBadgeAndDropdown
  };
})();
