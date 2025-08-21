// assets/js/product-detail.js
(function () {
  // ===== Helpers chung =====
  const $ = (s, r = document) => r.querySelector(s);
  const toNumber = (v) =>
    typeof v === "number" ? v : parseInt(String(v || "").replace(/[^\d]/g, ""), 10) || 0;
  const moneyVND = (n) =>
    (n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  const TAX_RATE = 0.10;

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

  // ===== Mô tả sản phẩm (Description) =====
  async function renderDescription(pid) {
    const el = document.getElementById("descContent");
    if (!el) return;

    try {
      el.classList.add("is-loading");
      const res = await fetch("./json/descriptions.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const map = await res.json();
      // thử nhiều key: nguyên văn, slug, ...
      const keys = [pid, slugify(pid || "")].filter(Boolean);
      const arr =
        map[keys[0]] ||
        map[keys[1]] ||
        []; // nếu chưa có -> mảng rỗng

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
    const  totalEl = $(".prod-info__price");
    const taxEl = $(".prod-info__tax");
    const priceEl = $(".prod-info__total-price");
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
        <img src="${src}" alt="" class="prod-preview__thumb-img ${
          i === 0 ? "prod-preview__thumb-img--current" : ""
        }" data-idx="${i}" />`
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

    // Giá & thuế
    const priceNum = toNumber(prod.price);
    titleEl && (titleEl.textContent = prod.title);
    priceEl && (priceEl.textContent = moneyVND(priceNum));
    taxEl && (taxEl.textContent = `${Math.round(TAX_RATE * 100)}%`);
    totalEl && (totalEl.textContent = moneyVND(Math.round(priceNum * (1 + TAX_RATE))));

    // Add to cart
    addBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      window.cartStore?.add({
        id: prod._id,
        name: prod.title,
        price: priceNum,
        img: prod.image || gallery[0],
        qty: 1,
      });
      window.renderMiniCart?.();
    });

    // Render Thông số & Mô tả
    await renderSpecsForProduct(prod, pid);
    await renderDescription(prod.id || pid);

    // Toggle ưu đãi
    bindOfferToggleOnce();
  });
})();
