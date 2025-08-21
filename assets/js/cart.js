// assets/js/cart.js
(() => {
  // Helpers
  const toNumberVND = (s) => parseInt(String(s||'').replace(/[^\d]/g,''), 10) || 0;
  const moneyVND = (n) => (n||0).toLocaleString('vi-VN', { style:'currency', currency:'VND' });

  // Store giỏ hàng (dùng chung)
  const CART_KEY = 'cart';
  const cartStore = {
    get(){ try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } },
    set(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); },
    add(item){
      const c = this.get();
      const i = c.findIndex(x => x.id === item.id);
      if (i > -1) c[i].qty += item.qty || 1;
      else c.push({ ...item, qty: item.qty || 1 });
      this.set(c);
    },
    update(id, delta){
      const c = this.get();
      const i = c.findIndex(x => x.id === id);
      if (i === -1) return;
      const next = c[i].qty + delta;
      if (next <= 0) c.splice(i, 1);
      else c[i].qty = next;
      this.set(c);
    },
    remove(id){ this.set(this.get().filter(x => x.id !== id)); },
    count(){ return this.get().reduce((s,x)=> s + x.qty, 0); },
    subtotal(){ return this.get().reduce((s,x)=> s + x.price * x.qty, 0); }
  };

  // Mini cart render (nếu trang có phần mini cart trên header)
  const TAX_RATE = 0;
  const SHIPPING_FLAT = 0;

  function renderMiniCart(){
    const elList     = document.getElementById('miniCartList');
    const elCount    = document.getElementById('miniCount');
    const elCountTop = document.getElementById('cartCount');
    const elSubtotal = document.getElementById('subtotal');
    const elTax      = document.getElementById('tax');
    const elShip     = document.getElementById('ship');
    const elGrand    = document.getElementById('grand');

    const items = cartStore.get();
    const count = cartStore.count();

    if (elCount)    elCount.textContent = count;
    if (elCountTop) elCountTop.textContent = count;

    const subtotal = cartStore.subtotal();
    const tax  = Math.round(subtotal * TAX_RATE);
    const ship = items.length ? SHIPPING_FLAT : 0;
    const grand = subtotal + tax + ship;

    if (elSubtotal) elSubtotal.textContent = moneyVND(subtotal);
    if (elTax)      elTax.textContent      = moneyVND(tax);
    if (elShip)     elShip.textContent     = moneyVND(ship);
    if (elGrand)    elGrand.textContent    = moneyVND(grand);

    if (!elList) return;

    if (!items.length){
      elList.innerHTML = `
        <div class="col" style="width:100%">
          <p style="padding:8px 0;color:#666">Giỏ hàng trống</p>
        </div>`;
      return;
    }

    elList.innerHTML = items.map(item => `
      <div class="col">
        <article class="cart-preview-item" data-id="${item.id}">
          <div class="cart-preview-item__img-wrap">
            <img src="${item.img}" alt class="cart-preview-item__thumb" />
          </div>
          <h3 class="cart-preview-item__title" title="${item.name}">${item.name}</h3>
          <p class="cart-preview-item__price">${moneyVND(item.price)}</p>

          <div class="mini-qty" style="display:flex;gap:6px;align-items:center;margin-top:6px">
            <button type="button" class="btn-qty" data-action="dec" data-id="${item.id}">-</button>
            <span>${item.qty}</span>
            <button type="button" class="btn-qty" data-action="inc" data-id="${item.id}">+</button>
          </div>

          <button type="button" class="mini-remove" data-action="remove" data-id="${item.id}"
                  style="margin-top:6px;color:#c00;background:none;border:0;cursor:pointer">Xóa</button>
        </article>
      </div>
    `).join('');
  }

  // Lắng nghe “Thêm vào giỏ” từ card sản phẩm (trang list)
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.btn-add-cart');
    if (!addBtn) return;
    const card = addBtn.closest('.product-card');
    const product = {
      id:   (card?.dataset.id || '').trim(),
      name: card?.dataset.name,
      price: toNumberVND(card?.dataset.price),
      img:  card?.dataset.img,
      qty:  1
    };
    if (!product.id) return;
    e.stopPropagation();
    cartStore.add(product);
    renderMiniCart();
  });

  // Dropdown mini-cart
  const toggleBtn = document.getElementById('cartToggle');
  const miniCart  = document.getElementById('miniCart');

  miniCart?.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (!id) return;
    if (action === 'dec') cartStore.update(id, -1);
    else if (action === 'inc') cartStore.update(id, +1);
    else if (action === 'remove') cartStore.remove(id);
    renderMiniCart();
  });

  miniCart?.addEventListener('pointerdown', (e) => {
    if (e.target.closest('[data-action]')) e.stopPropagation();
  });

  toggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    miniCart?.classList.toggle('is-open');
  });
  miniCart?.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => miniCart?.classList.remove('is-open'));

  document.addEventListener('DOMContentLoaded', renderMiniCart);

  // Global để trang khác dùng
  window.cartStore = cartStore;
  window.renderMiniCart = renderMiniCart;
  window.moneyVND = moneyVND;
})();
