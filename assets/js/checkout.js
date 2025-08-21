// ================== Cấu hình ==================
const CART_KEY = 'cart';
const SHIPPING_FLAT = 0; // phí ship cố định (VND). Đổi nếu cần, ví dụ 10000.

// ================== Helpers ==================
const moneyVND = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

// Store giỏ hàng
const cartStore = {
  get() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  },
  set(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); },
  update(id, delta){
    const c = this.get();
    const i = c.findIndex(x => x.id === id);
    if (i === -1) return;
    const next = c[i].qty + delta;
    if (next <= 0) c.splice(i,1); else c[i].qty = next;
    this.set(c);
  },
  remove(id){ this.set(this.get().filter(x => x.id !== id)); },
  subtotal(){ return this.get().reduce((s,x)=> s + x.price * x.qty, 0); },
  count(){ return this.get().reduce((s,x)=> s + x.qty, 0); }
};

// ================== DOM refs ==================
const listEl        = document.querySelector('.cart-info__list');

const subItemsEl    = document.getElementById('coSubtotalItems');
const subPriceEl    = document.getElementById('coSubtotalPrice');
const shipEl        = document.getElementById('coShipping');
const totalEl       = document.getElementById('coEstimatedTotal');

const subMobileEl   = document.getElementById('coSubtotalMobile');
const shipMobileEl  = document.getElementById('coShippingMobile');
const totalMobileEl = document.getElementById('coTotalMobile');

const modal         = document.getElementById('delete-confirm');
let pendingDeleteId = null;

// ================== Render từng item ==================
function itemHTML(it){
  const totalItem = it.price * it.qty;
  return `
  <article class="cart-item" data-id="${it.id}">
    <a href="./product-detail.html">
      <img src="${it.img}" alt="" class="cart-item__thumb" />
    </a>
    <div class="cart-item__content">
      <div class="cart-item__content-left">
        <h3 class="cart-item__title">
          <a href="./product-detail.html">${it.name}</a>
        </h3>
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
}

// ================== Render toàn checkout ==================
function renderCheckout(){
  const cart = cartStore.get();

  // Danh sách item
  if (!cart.length){
    listEl.innerHTML = `<p style="padding:12px 0;color:#666">Giỏ hàng trống.</p>`;
  } else {
    listEl.innerHTML = cart.map(itemHTML).join('');
  }

  // Tổng tiền
  const subtotal = cartStore.subtotal();
  const shipping = cart.length ? SHIPPING_FLAT : 0;
  const grand    = subtotal + shipping;
  const count    = cartStore.count();

  if (subItemsEl)  subItemsEl.textContent  = count;
  if (subPriceEl)  subPriceEl.textContent  = moneyVND(subtotal);
  if (shipEl)      shipEl.textContent      = moneyVND(shipping);
  if (totalEl)     totalEl.textContent     = moneyVND(grand);

  if (subMobileEl) subMobileEl.textContent = moneyVND(subtotal);
  if (shipMobileEl)shipMobileEl.textContent= moneyVND(shipping);
  if (totalMobileEl)totalMobileEl.textContent = moneyVND(grand);
}

// ================== Sự kiện: + / – / Delete ==================
listEl.addEventListener('click', (e)=>{
  const qtyBtn = e.target.closest('.js-qty');
  if (qtyBtn){
    const id = qtyBtn.dataset.id;
    const action = qtyBtn.dataset.action;
    cartStore.update(id, action === 'inc' ? +1 : -1);
    renderCheckout();
    return;
  }

  const delBtn = e.target.closest('.js-delete');
  if (delBtn){
    pendingDeleteId = delBtn.dataset.id || null;
    // mở modal xác nhận
    modal?.classList.remove('hide');
  }
});

// ================== Modal xác nhận xóa ==================
modal?.addEventListener('click', (e)=>{
  // Nhấn Cancel hoặc overlay (đều có .js-toggle) -> đóng modal
  if (e.target.closest('.js-toggle') && !e.target.closest('.btn--danger')) {
    modal.classList.add('hide');
    return;
  }
  // Nhấn Delete (nút có .btn--danger)
  if (e.target.closest('.btn--danger')){
    if (pendingDeleteId){
      cartStore.remove(pendingDeleteId);
      pendingDeleteId = null;
      renderCheckout();
    }
    modal.classList.add('hide');
  }
});

// ================== Init ==================
document.addEventListener('DOMContentLoaded', renderCheckout);
