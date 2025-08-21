function formatDate(date) {
  const days = [
    "Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư",
    "Thứ Năm", "Thứ Sáu", "Thứ Bảy"
  ];
  return `${days[date.getDay()]}, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
}

const today = new Date();       // Ngày hiện tại
const after2 = new Date();      // Ngày sau 2 ngày
after2.setDate(today.getDate() + 2);

const text = `1. Vận chuyển, đến vào khoảng thời gian từ ${formatDate(today)} đến ${formatDate(after2)} (tối)`;

document.querySelector(".cart-info__heading").innerText = text;
(function initShipping() {
  // chạy an toàn dù DOM đã sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShipping, { once: true });
    return;
  }

  // ===== Cấu hình
  const CART_KEY = 'cart';
  const SHIPPING_FLAT = 0; // VND: đổi thành 10000 nếu cần phí ship cố định

  // ===== Helpers
  const moneyVND = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  const cartStore = {
    get() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } },
    set(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); },
    update(id, delta) {
      const c = this.get();
      const i = c.findIndex(x => x.id === id);
      if (i === -1) return;
      const next = c[i].qty + delta;
      if (next <= 0) c.splice(i, 1); else c[i].qty = next;
      this.set(c);
    },
    remove(id) { this.set(this.get().filter(x => x.id !== id)); },
    subtotal() { return this.get().reduce((s, x) => s + x.price * x.qty, 0); },
    count() { return this.get().reduce((s, x) => s + x.qty, 0); }
  };

  // ===== DOM refs
  const list = document.querySelector('.cart-info__list');

  const elItems = document.getElementById('shipSubtotalItems');
  const elSub = document.getElementById('shipSubtotalPrice');
  const elShip = document.getElementById('shipShipping');
  const elTotal = document.getElementById('shipEstimatedTotal');

  const elSubM = document.getElementById('shipSubtotalMobile');
  const elShipM = document.getElementById('shipShippingMobile');
  const elTotalM = document.getElementById('shipTotalMobile');

  const modal = document.getElementById('delete-confirm');

  if (!list) return;

  // ===== 1 item HTML (khớp CSS hiện có)
  const itemHTML = (it) => {
    const totalItem = it.price * it.qty;
    return `
    <article class="cart-item" data-id="${it.id}">
      <a href="./product-detail.html">
        <img src="${it.img}" alt="" class="cart-item__thumb" />
      </a>
      <div class="cart-item__content">
        <div class="cart-item__content-left">
          <h3 class="cart-item__title"><a href="./product-detail.html">${it.name}</a></h3>
          <p class="cart-item__price-wrap">
            ${moneyVND(it.price)} | <span class="cart-item__status">In Stock</span>
          </p>
          <div class="cart-item__ctrl cart-item__ctrl--md-block">
            <div class="cart-item__input">
              LavAzza
              <img class="icon" src="./assets/icons/arrow-down-2.svg" alt="" />
            </div>
            <div class="cart-item__input">
              <button type="button" class="cart-item__input-btn js-qty" data-action="dec" data-id="${it.id}">
                <img class="icon" src="./assets/icons/minus.svg" alt="" />
              </button>
              <span>${it.qty}</span>
              <button type="button" class="cart-item__input-btn js-qty" data-action="inc" data-id="${it.id}">
                <img class="icon" src="./assets/icons/plus.svg" alt="" />
              </button>
            </div>
          </div>
        </div>
        <div class="cart-item__content-right">
          <p class="cart-item__total-price">${moneyVND(totalItem)}</p>
          <div class="cart-item__ctrl">
            <button type="button" class="cart-item__ctrl-btn">
              <img src="./assets/icons/heart-2.svg" alt="" />
              Save
            </button>
            <button type="button" class="cart-item__ctrl-btn js-delete" data-id="${it.id}">
              <img src="./assets/icons/trash.svg" alt="" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>`;
  };

  function render() {
    const cart = cartStore.get();

    if (!cart.length) {
      list.innerHTML = `<p style="padding:12px 0;color:#666">Giỏ hàng trống.</p>`;
    } else {
      list.innerHTML = cart.map(itemHTML).join('');
    }

    const subtotal = cartStore.subtotal();
    const shipping = cart.length ? SHIPPING_FLAT : 0;
    const total = subtotal + shipping;
    const count = cartStore.count();

    if (elItems) elItems.textContent = count;
    if (elSub) elSub.textContent = moneyVND(subtotal);
    if (elShip) elShip.textContent = moneyVND(shipping);
    if (elTotal) elTotal.textContent = moneyVND(total);

    if (elSubM) elSubM.textContent = moneyVND(subtotal);
    if (elShipM) elShipM.textContent = moneyVND(shipping);
    if (elTotalM) elTotalM.textContent = moneyVND(total);
  }

  // +/-/Delete
  list.addEventListener('click', (e) => {
    const btnQty = e.target.closest('.js-qty');
    if (btnQty) {
      const id = btnQty.dataset.id;
      const action = btnQty.dataset.action;
      cartStore.update(id, action === 'inc' ? +1 : -1);
      render();
      return;
    }
    const btnDel = e.target.closest('.js-delete');
    if (btnDel) {
      const id = btnDel.dataset.id;

      if (modal) {
        modal.classList.remove('hide');
        const onClick = (ev) => {
          const yes = ev.target.closest('.btn--danger');
          const close = ev.target.closest('.js-toggle');
          if (yes) {
            cartStore.remove(id);
            render();
            modal.classList.add('hide');
            modal.removeEventListener('click', onClick);
          } else if (close) {
            modal.classList.add('hide');
            modal.removeEventListener('click', onClick);
          }
        };
        modal.addEventListener('click', onClick);
      } else {
        if (confirm('Remove this item?')) {
          cartStore.remove(id);
          render();
        }
      }
    }
  });

  render();
})();
