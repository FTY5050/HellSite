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
      var items = raw ? JSON.parse(raw) : [];
      return items.map(function (item) {
        if (item.quantity == null) item.quantity = 1;
        return item;
      });
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
    var t = (title || 'Позиция').trim();
    var u = (url || '').trim();
    var found = cart.find(function (item) {
      return (item.title || '').trim() === t && (item.url || '').trim() === u;
    });
    if (found) {
      found.quantity = (found.quantity || 1) + 1;
    } else {
      var id = Date.now() + '-' + Math.random().toString(36).slice(2, 9);
      cart.push({ id: id, title: t, url: u, quantity: 1 });
    }
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

  function totalCount(cart) {
    return cart.reduce(function (sum, item) { return sum + (item.quantity || 1); }, 0);
  }

  function renderWidget() {
    var cart = getCart();
    var count = totalCount(cart);
    var countText = count > 0 ? count : '';
    var listHtml = '';
    if (cart.length > 0) {
      listHtml = '<ul class="cart-widget__list">';
      cart.forEach(function (item) {
        var q = item.quantity || 1;
        var titleDisplay = q > 1 ? escapeHtml(item.title) + ' <span class="cart-widget__qty">× ' + q + '</span>' : escapeHtml(item.title);
        listHtml += '<li class="cart-widget__item" data-id="' + escapeAttr(item.id) + '">';
        listHtml += '<span class="cart-widget__item-title">' + titleDisplay + '</span>';
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
          '<span class="cart-widget__icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></span>' +
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

  function escapeAttr(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function updateBadgeAndDropdown() {
    var widget = document.getElementById('request-cart-widget');
    if (!widget) return;
    var cart = getCart();
    var count = totalCount(cart);
    var badge = widget.querySelector('.cart-widget__badge');
    var dropdown = widget.querySelector('.cart-widget__dropdown');
    if (badge) badge.textContent = count > 0 ? count : '';
    if (dropdown) {
      if (cart.length === 0) {
        dropdown.innerHTML = '<div class="cart-widget__header">Корзина</div><p class="cart-widget__empty">Корзина пуста</p>';
      } else {
        var listHtml = '<ul class="cart-widget__list">';
        cart.forEach(function (item) {
          var q = item.quantity || 1;
          var titleDisplay = q > 1 ? escapeHtml(item.title) + ' <span class="cart-widget__qty">× ' + q + '</span>' : escapeHtml(item.title);
          listHtml += '<li class="cart-widget__item" data-id="' + escapeAttr(item.id) + '">';
          listHtml += '<span class="cart-widget__item-title">' + titleDisplay + '</span>';
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

  function closeContactModal() {
    var modal = document.getElementById('contact-modal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function bindContactModalClose() {
    var modal = document.getElementById('contact-modal');
    if (!modal || modal.dataset.cartCloseBound) return;
    modal.dataset.cartCloseBound = '1';
    var closeBtn = modal.querySelector('.close-modal-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeContactModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeContactModal();
    });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key !== 'Escape') return;
      if (modal.classList.contains('active') || modal.style.display === 'flex') {
        closeContactModal();
      }
    });
  }

  function openRequestModalWithCart() {
    var modal = document.getElementById('contact-modal');
    var form = document.getElementById('modal-form');
    if (!modal) return;
    bindContactModalClose();
    // Обновляем заголовок/подзаголовок именно под оформление заказа
    var titleEl = modal.querySelector('.modal-title');
    var subtitleEl = modal.querySelector('.modal-subtitle');
    if (titleEl) {
      titleEl.textContent = 'ОФОРМИТЬ ЗАКАЗ';
    }
    if (subtitleEl) {
      subtitleEl.textContent = 'Проверьте состав корзины и отправьте заявку — мы свяжемся с вами для уточнения деталей.';
    }
    var cart = getCart();
    var text = cart.length > 0
      ? 'Состав заказа (корзина):\n' + cart.map(function (i) {
          var q = i.quantity || 1;
          return q > 1 ? '• ' + i.title + ' (' + q + ' шт)' : '• ' + i.title;
        }).join('\n')
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

  var addToCartBound = false;
  function initAddToCartButtons() {
    if (addToCartBound) return;
    addToCartBound = true;
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
        if (badge) badge.textContent = totalCount(getCart());
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
    if (!document.getElementById('request-cart-widget')) initWidget();
    initAddToCartButtons();
    clearCartOnSubmit();
  }

  document.addEventListener('nppkpk-header-ready', function () {
    if (!document.getElementById('request-cart-widget')) {
      initWidget();
      initAddToCartButtons();
    } else {
      updateBadgeAndDropdown();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && document.getElementById('request-cart-widget')) {
      updateBadgeAndDropdown();
    }
  });

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
