// assets/js/product-detail.js
(function () {
  // ===== Helpers chung =====
  const $ = (s, r = document) => r.querySelector(s);
  const toNumber = (v) =>
    typeof v === "number" ? v : parseInt(String(v || "").replace(/[^\d]/g, ""), 10) || 0;
  const moneyVND = (n) =>
    (n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  const TAX_RATE = 0.10;

  // Chuẩn hoá phần trăm -> số thập phân (5%|"-5%"|5|0.05 -> 0.05|-0.05)
  const parsePercent = (v) => {
    if (v == null) return 0;
    if (typeof v === "number") return v > 1 ? v / 100 : v;
    const m = String(v).trim().match(/-?\d+(\.\d+)?/);
    if (!m) return 0;
    return parseFloat(m[0]) / 100;
  };

  const slugify = (str = "") =>
    String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // ===== Specs (Thông số) =====
  async function renderSpecsForProduct(prod, pid) {
    const list = document.getElementById("specList");
    if (!list) return;

    try {
      const res = await fetch("./json/specs.json", { cache: "no-store" });
      const map = await res.json();

      const candidates = [
        prod?.id,
        pid,
        slugify(pid || ""),
        slugify(prod?.title || ""),
      ].filter(Boolean);
      const key = candidates.find((k) => Object.prototype.hasOwnProperty.call(map, k));
      const spec = key ? map[key] : null;

      list.innerHTML = spec
        ? Object.entries(spec)
          .map(
            ([k, v]) => `
          <li class="spec-item">
            <span class="spec-k">${k}:</span>
            <span class="spec-v">${v}</span>
          </li>`
          )
          .join("")
        : '<li class="spec-item">Chưa có thông số cho sản phẩm này.</li>';
    } catch (e) {
      console.error("[specs] lỗi tải specs.json:", e);
    }
  }

  async function renderDescription(pid) {
    const el = document.getElementById("descContent");
    if (!el) return;

    try {
      el.classList.add("is-loading");
      const res = await fetch("./json/descriptions.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const map = await res.json();
      const keys = [pid, slugify(pid || "")].filter(Boolean);
      const arr =
        map[keys[0]] ||
        map[keys[1]] ||
        [];

      el.innerHTML = arr.length ? arr.join("") : "<p>Chưa có mô tả cho sản phẩm này.</p>";
    } catch (err) {
      console.error("[desc] lỗi tải descriptions.json:", err);
      el.innerHTML = '<p style="color:#c00">Không tải được mô tả.</p>';
    } finally {
      el.classList.remove("is-loading");
    }
  }

  // ===== Toggle “Xem thêm ưu đãi” =====
  function bindOfferToggleOnce() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".offer-block__toggle");
      if (!btn) return;

      const moreItems = document.querySelectorAll(".offer-block__item--more");
      const expanded = btn.getAttribute("data-expanded") === "true";

      moreItems.forEach((li) => li.classList.toggle("pd-hide", expanded)); // true => ẩn lại
      btn.setAttribute("data-expanded", (!expanded).toString());
      btn.textContent = expanded ? "Xem thêm ưu đãi khác" : "Thu gọn ưu đãi";
    });
  }
  // ===== Helpers chung =====
  // (giữ nguyên $ , toNumber , moneyVND , TAX_RATE , parsePercent , slugify ...)

  // Thêm HÀM NÀY vào trong IIFE, phía trên "===== Main ====="
  (function () {
    // Helpers
    const toNumber = (v) => parseInt(String(v || "").replace(/[^\d]/g, ""), 10) || 0;
    const moneyVND = (n) => (n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    // Lấy giá đang HIỂN THỊ (ưu tiên các ô giá trên trang)
    function getCurrentProductPrice() {
      const elMain1 = document.querySelector(".prod-info__total-price"); // giá chính (trước thuế/đã giảm)
      const elMain2 = document.getElementById("total-price");            // fallback id cũ
      const elAlt1 = document.querySelector(".prod-info__price");       // giá phụ (sau thuế)
      const elAlt2 = document.getElementById("price");                  // fallback id cũ
      const holder = document.getElementById("productHolder");          // dataset nếu có

      const raw =
        (elMain1 && elMain1.textContent) ||
        (elMain2 && elMain2.textContent) ||
        (elAlt1 && elAlt1.textContent) ||
        (elAlt2 && elAlt2.textContent) ||
        (holder && holder.dataset && holder.dataset.price) || "";

      return toNumber(raw);
    }

    // Tính & gắn "Chỉ từ …/tháng" cho 2 nút trả góp
    function updateInstallmentButtons() {
      const price = getCurrentProductPrice();
      if (!price) return;

      document.querySelectorAll(".btn.btn--primary-blue.prod-info__buy").forEach((btn) => {
        // Cho phép set số tháng riêng: data-months="6", mặc định 12
        const months = parseInt(btn.getAttribute("data-months"), 10) || 12;
        const perMonth = Math.ceil(price / months);

        let sub = btn.querySelector(".button-title");
        if (!sub) {
          sub = document.createElement("span");
          sub.className = "button-title";
          btn.appendChild(sub);
        }
        sub.textContent = `Chỉ từ ${moneyVND(perMonth)}/tháng`;
      });
    }

    // Chạy khi DOM sẵn sàng
    document.addEventListener("DOMContentLoaded", updateInstallmentButtons);

    // Nếu giá được cập nhật động sau khi fetch, theo dõi thay đổi text để cập nhật lại
    const priceTargets = [
      ".prod-info__total-price",
      "#total-price",
      ".prod-info__price",
      "#price",
    ];
    const targetEl = priceTargets.map((s) => document.querySelector(s)).find(Boolean);
    if (targetEl) {
      const mo = new MutationObserver(updateInstallmentButtons);
      mo.observe(targetEl, { childList: true, characterData: true, subtree: true });
    }

    // Cho phép nơi khác gọi lại khi bạn thay giá thủ công
    window.updateInstallmentButtons = updateInstallmentButtons;
  })();

  // ===== Main =====
  document.addEventListener("DOMContentLoaded", async () => {
    // Lấy pid từ URL (fallback lastProductId)
    const params = new URLSearchParams(location.search);
    let pid = params.get("id") || localStorage.getItem("lastProductId");
    if (!pid) {
      console.warn("[product-detail] thiếu id trên URL");
      return;
    }
    pid = decodeURIComponent(pid);
    localStorage.setItem("lastProductId", pid);

    // DOM hooks
    const listBig = $(".prod-preview__list");
    const listThumb = $(".prod-preview__thumbs");
    const titleEl = $(".prod-info__heading");
    const totalEl = $(".prod-info__price");        // Tổng sau thuế
    const taxEl = $(".prod-info__tax");          // % Thuế
    const priceEl = $(".prod-info__total-price");  // Giá sau giảm (trước thuế)
    const addBtn = $(".prod-info__add-to-cart");

    // Lấy dữ liệu sản phẩm
    let data;
    try {
      data = await fetch("./products.json").then((r) => r.json());
    } catch (e) {
      console.error("[product-detail] Lỗi load products.json:", e);
      return;
    }

    const all = Object.values(data).flat();
    const withId = all.map((p) => ({ ...p, _id: p.id || p.link || p.title }));
    const prod =
      withId.find((p) => p._id === pid) ||
      withId.find((p) => slugify(p.title) === slugify(pid));

    if (!prod) {
      titleEl && (titleEl.textContent = "Product not found");
      console.warn("[product-detail] Không tìm thấy sản phẩm với id:", pid);
      return;
    }

    // Gallery
    const gallery = (prod.images?.length ? prod.images : [prod.image, prod.image, prod.image, prod.image]).filter(Boolean);

    if (listBig) {
      listBig.innerHTML = gallery
        .map(
          (src) => `
        <div class="prod-preview__item">
          <img src="${src}" alt="" class="prod-preview__img" />
        </div>`
        )
        .join("");
    }

    if (listThumb) {
      listThumb.innerHTML = gallery
        .map(
          (src, i) => `
        <img src="${src}" alt="" class="prod-preview__thumb-img ${i === 0 ? "prod-preview__thumb-img--current" : ""}" data-idx="${i}" />`
        )
        .join("");

      listThumb.addEventListener("click", (e) => {
        const img = e.target.closest(".prod-preview__thumb-img");
        if (!img) return;
        const idx = +img.dataset.idx;

        [...listThumb.querySelectorAll(".prod-preview__thumb-img")].forEach((t) =>
          t.classList.remove("prod-preview__thumb-img--current")
        );
        img.classList.add("prod-preview__thumb-img--current");

        const bigItems = listBig?.querySelectorAll(".prod-preview__item");
        bigItems?.[idx]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
    }

    // ===== Giá, giảm giá & thuế =====
    const rawPrice = toNumber(prod.price);      
    const rawOldPrice = toNumber(prod.oldPrice);
    const hasValidOld = rawOldPrice && rawOldPrice > rawPrice;


    // Thuế: ưu tiên prod.tax nếu có, fallback TAX_RATE
    const taxRate = (typeof prod.tax === "number") ? prod.tax : TAX_RATE;

    let priceAfterDiscount;
    let percentDisplay = "";

    if (hasValidOld) {
      priceAfterDiscount = rawPrice;

      const p = parsePercent(prod.discount);
      if (p) {
        percentDisplay = `${Math.round(p * 100)}%`;
      } else {
        const rate = (rawPrice && rawOldPrice) ? (rawPrice / rawOldPrice - 1) : 0; // âm
        percentDisplay = rate ? `${Math.round(rate * 100)}%` : "";
      }
    } else {
      let discountRate = parsePercent(prod.discount); // ví dụ "10%" -> 0.1
      if (discountRate > 0) discountRate = -Math.abs(discountRate); // ép thành số âm để giảm

      // Nếu không có discount thì giữ nguyên rawPrice
      if (discountRate) {
        priceAfterDiscount = Math.max(0, Math.round(rawPrice * (1 + discountRate)));
        percentDisplay = `${Math.round(discountRate * 100)}%`;
      } else {
        priceAfterDiscount = rawPrice;
        percentDisplay = "";
      }
    }


    const totalAfterTax = Math.round(priceAfterDiscount * (1 + taxRate));


    // Gán UI
    titleEl && (titleEl.textContent = prod.title);
    priceEl && (priceEl.textContent = moneyVND(priceAfterDiscount)); // trước thuế
    taxEl && (taxEl.textContent = `${Math.round(taxRate * 100)}%`);
    totalEl && (totalEl.textContent = hasValidOld ? moneyVND(rawOldPrice) : "");

    // Badge % giảm (tự chèn nếu chưa có)
    let discountEl = $(".prod-info__tax");
    if (!discountEl && taxEl) {
      discountEl = document.createElement("span");
      discountEl.className = "prod-info__tax";
      taxEl.parentNode.insertBefore(discountEl, taxEl);
    }
    if (discountEl) {
      if (percentDisplay) {
        discountEl.textContent = percentDisplay;   // ví dụ "-10%"
        discountEl.classList.remove("pd-hide");
      } else {
        discountEl.textContent = "";
        discountEl.classList.add("pd-hide");
      }
    }


    // Add to cart
    addBtn?.addEventListener("click", (e) => {
      e.preventDefault();

      // Lấy số lượng từ input, ràng buộc tối thiểu 1
      const qtyInput = document.getElementById("detailQty");
      let qty = parseInt(qtyInput?.value, 10);
      if (!Number.isFinite(qty) || qty < 1) qty = 1;

      window.cartStore?.add({
        id: prod._id,
        name: prod.title,
        price: priceAfterDiscount,          // giá đã giảm (trước thuế)
        img: prod.image || gallery[0],
        qty,                                 // <-- dùng số lượng người dùng chọn
      });

      // Cập nhật mini cart
      window.renderMiniCart?.();
    });

    // Render Thông số & Mô tả
    await renderSpecsForProduct(prod, pid);
    await renderDescription(prod.id || pid);

    // Toggle ưu đãi
    bindOfferToggleOnce();
  });
})();

// Nút + / −
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#detailQtyWrap .qty-btn");
  if (!btn) return;

  const delta = parseInt(btn.dataset.delta, 10) || 0;
  const input = document.getElementById("detailQty");
  if (!input) return;

  let current = parseInt(input.value, 10) || 1;
  current = Math.max(1, current + delta);
  input.value = String(current);
});

// Chặn ký tự ngoài số & bỏ 0 đầu
const qtyInput = document.getElementById("detailQty");
qtyInput?.addEventListener("input", () => {
  const cleaned = (qtyInput.value.match(/\d+/g) || ["1"]).join("");
  qtyInput.value = String(Math.max(1, parseInt(cleaned, 10) || 1));
});
updateInstallmentButtons();
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const slugify = (str = "") =>
    String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  function bumpViews(key) {
    const LS_KEY = "productViews";
    let map = {};
    try { map = JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { }
    map[key] = (map[key] || 0) + 1;
    localStorage.setItem(LS_KEY, JSON.stringify(map));
    return map[key];
  }

  function renderMeta({ prod, pid }) {
    const rateEl = $("#metaRating");
    const cmtEl = $("#metaComments");
    const viewsEl = $("#metaViews");
    const soldEl = $("#metaSold");

    // Rating
    let score = 0;
    if (prod.score) {
      const s = String(prod.score).replace(",", ".").match(/[\d.]+/);
      score = s ? parseFloat(s[0]) : 0;
    }
    if (rateEl) rateEl.textContent = score.toFixed(1).replace(".0", "");

    // Comments (default 0)
    if (cmtEl) cmtEl.textContent = prod.commentsCount ? String(prod.commentsCount) : "0";

    // Views
    const viewKey = "pv_" + (prod.id || pid || slugify(prod.title || ""));
    const views = bumpViews(viewKey);
    if (viewsEl) viewsEl.textContent = views.toLocaleString("vi-VN");

    // Sold
    if (soldEl) soldEl.textContent = prod.sold ? String(prod.sold) : "0";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(location.search);
    let pid = params.get("id") || localStorage.getItem("lastProductId");
    if (!pid) return;
    pid = decodeURIComponent(pid);

    if (window.__currentProduct) {
      renderMeta({ prod: window.__currentProduct, pid });
      return;
    }

    fetch("./products.json")
      .then(r => r.json())
      .then(data => {
        const all = Object.values(data).flat();
        const withId = all.map((p) => ({ ...p, _id: p.id || p.link || p.title }));
        const prod = withId.find(p => p._id === pid) ||
          withId.find(p => slugify(p.title) === slugify(pid));
        if (prod) renderMeta({ prod, pid });
      })
      .catch(() => { });
  });
})();
