
// ============ Tabzy giữ nguyên ============
const tabs3 = new Tabzy("#sliding-tabs", { onChange: updateActiveLine });
function updateActiveLine() {
  const activeTab = tabs3.currentTab;
  const tabLi = activeTab.closest("li");
  const activeLine = tabs3.container.nextElementSibling;
  activeLine.style.width = `${tabLi.offsetWidth}px`;
  activeLine.style.transform = `translateX(${tabLi.offsetLeft}px)`;
}
updateActiveLine();

const sliderMap = {
  "my-slider1": "slide1",
  "my-slider2": "slide2",
  "my-slider3": "slide3",
  "my-slider4": "slide4",
  "my-slider5": "slide5",
  "my-slider6": "slide6",
  "my-slider7": "slide7",
  "my-slider8": "slide8",
  "my-slider9": "slide9",
  "my-slider10": "slide10",
  "my-slider11": "slide11",
  "my-slider12": "slide12"

};


// ============ Render sản phẩm (thêm nút Add) ============
function renderProducts(containerId, products = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = products.map(p => {
    const pid = p.id || p.link || p.title;      // ưu tiên id
    const href = `./product-detail.html?id=${encodeURIComponent(pid)}`;

    return `
      <div class="slidezy-item">
        <article class="product-card"
          data-id="${pid}"
          data-name="${p.title}"
          data-price="${p.price}"
          data-img="${p.image}">
          <div class="product-card__img-wrap">
            <a href="${href}">
              <img src="${p.image}" alt class="product-card__thumb">
            </a>
          </div>
          <h3 class="product-card__title"> 
            <a href="${href}">${p.title}</a>
          </h3>
          <div class="product-card__tag">
          ${(p.tags || []).map(tag => `<p>${tag}</p>`).join('')}
        </div>

        <p class="product-card__price">${p.price}</p>
        <div class="product-card__list-old">
          <p class="product-card__price-old">${p.oldPrice || ""}</p>
          <p class="percent">${p.discount || ""}</p>
        </div>

        <div class="product-card__row">
          <img src="./assets/icons/star.svg" alt class="product-card__star">
          <span class="product-card__score">${p.score || ""}</span>
          <p class="vote-txt">• Đã bán ${p.sold || ""}</p>
        </div> 
          <button class="btn-add-cart">Thêm vào giỏ</button>
        </article>
      </div>`;
  }).join('');
}


// ============ Helpers tiền tệ ============
const toNumberVND = (s) => parseInt(String(s || '').replace(/[^\d]/g, ''), 10) || 0;
const moneyVND = (n) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

// ============ Cart store ============
const CART_KEY = 'cart';
const cartStore = {
  get() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } },
  set(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); },
  add(item) {
    const c = this.get();
    const i = c.findIndex(x => x.id === item.id);
    if (i > -1) c[i].qty += item.qty || 1;
    else c.push({ ...item, qty: item.qty || 1 });
    this.set(c);
  },
  update(id, delta) {
    const c = this.get();
    const i = c.findIndex(x => x.id === id);
    if (i === -1) return;
    const next = c[i].qty + delta;
    if (next <= 0) {
      // về 0 thì xóa hẳn
      c.splice(i, 1);
    } else {
      c[i].qty = next;
    }
    this.set(c);
  },
  remove(id) { this.set(this.get().filter(x => x.id !== id)); },
  count() { return this.get().reduce((s, x) => s + x.qty, 0); },
  subtotal() { return this.get().reduce((s, x) => s + x.price * x.qty, 0); }
};


// ============ Load JSON & init sliders ============
async function loadAllSlides() {
  try {
    const res = await fetch('./products.json');
    const data = await res.json();
    Object.entries(sliderMap).forEach(([id, key]) => {
      renderProducts(id, data[key] || []);
    });
    if (typeof initMySlider === "function") {
      ["#my-slider1", "#my-slider2", "#my-slider3", "#my-slider4", "#my-slider5", "#my-slider6", "#my-slider7", "#my-slider8", "#my-slider9", "#my-slider10", "#my-slider11", "#my-slider12"]
        .forEach(sel => initMySlider(sel));
    }
  } catch (err) {
    console.error("Lỗi load JSON:", err);
  }
}

// ============ Account dropdown (giữ nguyên) ============
document.addEventListener('DOMContentLoaded', () => {
  const acc = document.querySelector('.header-action__account');
  if (!acc) return;
  acc.addEventListener('click', (e) => {
    if (e.target.closest('a')) e.preventDefault();
    e.stopPropagation();
    acc.classList.toggle('is-open');
  });
  document.addEventListener('click', () => acc.classList.remove('is-open'));
});

// ============ Mini cart elements ============
const elList = document.getElementById('miniCartList');
const elCount = document.getElementById('miniCount');   // trong dropdown
const elCountTop = document.getElementById('cartCount');   // trên nút
const elSubtotal = document.getElementById('subtotal');
const elTax = document.getElementById('tax');
const elShip = document.getElementById('ship');
const elGrand = document.getElementById('grand');

const TAX_RATE = 0;
const SHIPPING_FLAT = 0;

function renderMiniCart() {
  const items = cartStore.get();
  const count = cartStore.count();

  if (elCount) elCount.textContent = count;
  if (elCountTop) elCountTop.textContent = count;

  const subtotal = cartStore.subtotal();
  const tax = Math.round(subtotal * TAX_RATE);
  const ship = items.length ? SHIPPING_FLAT : 0;
  const grand = subtotal + tax + ship;

  if (elSubtotal) elSubtotal.textContent = moneyVND(subtotal);
  if (elTax) elTax.textContent = moneyVND(tax);
  if (elShip) elShip.textContent = moneyVND(ship);
  if (elGrand) elGrand.textContent = moneyVND(grand);

  if (!elList) return;
  if (!items.length) {
    elList.innerHTML = `<div class="col" style="width:100%"><p style="padding:8px 0;color:#666">Giỏ hàng trống</p></div>`;
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
        <button type="button" class="btn-qty" data-action="dec" data-id="${item.id}" aria-label="Giảm">-</button>
        <span>${item.qty}</span>
        <button type="button" class="btn-qty" data-action="inc" data-id="${item.id}" aria-label="Tăng">+</button>
      </div>

      <button type="button" class="mini-remove" data-action="remove" data-id="${item.id}"
              style="margin-top:6px;color:#c00;background:none;border:0;cursor:pointer">
        Xóa
      </button>
    </article>
  </div>
`).join('');


}

// ============ CHỈ 1 listener cho Add/Inc/Dec/Remove ============
document.addEventListener('click', (e) => {
  // Thêm vào giỏ (card sản phẩm)
  const addBtn = e.target.closest('.btn-add-cart');
  if (addBtn) {
    const card = addBtn.closest('.product-card');
    const product = {
      id: (card.dataset.id || '').trim(),
      name: card.dataset.name,
      price: toNumberVND(card.dataset.price),
      img: card.dataset.img,
      qty: 1
    };
    if (!product.id) return;
    e.stopPropagation();
    cartStore.add(product);
    renderMiniCart();
    return;
  }

  const decBtn = e.target.closest('.btn-qty.dec');
  const incBtn = e.target.closest('.btn-qty.inc');
  if (decBtn || incBtn) {
    e.stopPropagation(); 
    const id = (decBtn?.dataset.id || incBtn?.dataset.id || '').trim();
    if (!id) return;
    cartStore.update(id, decBtn ? -1 : +1);
    renderMiniCart();
    return;
  }

  // Nút xóa
  const rmBtn = e.target.closest('.mini-remove');
  if (rmBtn) {
    e.stopPropagation();
    const id = (rmBtn.dataset.id || '').trim();
    if (!id) return;
    cartStore.remove(id);
    renderMiniCart();
    return;
  }
});


// ============ Toggle dropdown bằng class .is-open ============
const toggleBtn = document.getElementById('cartToggle');
const miniCart = document.getElementById('miniCart');

cartStore.update = function (id, delta) {
  const c = this.get();
  const i = c.findIndex(x => x.id === id);
  if (i === -1) return;
  const next = c[i].qty + delta;
  if (next <= 0) c.splice(i, 1);
  else c[i].qty = next;
  this.set(c);
};

miniCart?.addEventListener('click', (e) => {
  e.stopPropagation();

  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = (btn.dataset.id || '').trim();
  if (!id) return;

  if (action === 'dec') {
    cartStore.update(id, -1);
  } else if (action === 'inc') {
    cartStore.update(id, 1);
  } else if (action === 'remove') {
    cartStore.remove(id);
  }

  renderMiniCart();
});

miniCart?.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('[data-action]');
  if (btn) e.stopPropagation();
});



toggleBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  miniCart.classList.toggle('is-open');
});
miniCart?.addEventListener('click', (e) => e.stopPropagation());
document.addEventListener('click', () => miniCart?.classList.remove('is-open'));

// ============ Init ============
document.addEventListener('DOMContentLoaded', () => {
  loadAllSlides();
  renderMiniCart();
});

let countDownDate = new Date().getTime() + (6 * 60 * 60 * 1000);

let timer = setInterval(function () {
  let now = new Date().getTime();
  let distance = countDownDate - now;

  if (distance < 0) {
    clearInterval(timer);
    document.getElementById("countdown").innerHTML = "Đã kết thúc";
    return;
  }

  let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById("hours").innerHTML = String(hours).padStart(2, '0');
  document.getElementById("minutes").innerHTML = String(minutes).padStart(2, '0');
  document.getElementById("seconds").innerHTML = String(seconds).padStart(2, '0');
}, 1000);
