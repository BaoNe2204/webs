const days = [
    "Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư",
    "Thứ Năm", "Thứ Sáu", "Thứ Bảy"
];

function formatDate(date) {
    return `${days[date.getDay()]}, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
}

const today = new Date();
const after2 = new Date();
after2.setDate(today.getDate() + 2);

// Nội dung tiếng Việt
const text = `1. Vận chuyển, đến vào khoảng thời gian từ ${formatDate(today)} — ${formatDate(after2)}`;

document.querySelector(".cart-info__heading--lv2").innerText = text;
// ===== Helpers =====
const CART_KEY = "cart";
const getCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
};
const formatMoney = (n) =>
    (n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// Node refs
const elOrderItemCount = document.getElementById("orderItemCount");
const elSumItemsQty = document.getElementById("sumItemsQty");
const elSumSubtotal = document.getElementById("sumSubtotal");
const elSumShipping = document.getElementById("sumShipping");
const elSumEstimated = document.getElementById("sumEstimated");
const elSumPay = document.getElementById("sumPay");
const elPayBtn = document.getElementById("payBtn");

// Radio shipping
const shipRadios = document.querySelectorAll('input[name="delivery-method"]');

function getSubtotal() {
    const items = getCart();
    return items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
}
function getItemCount() {
    const items = getCart();
    return items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
}
function getSelectedShipping() {
    const checked = document.querySelector('input[name="delivery-method"]:checked');
    const v = checked ? Number(checked.value) : 0;
    return isNaN(v) ? 0 : v;
}

function updateSummary() {
    const qty = getItemCount();
    const subtotal = getSubtotal();
    const ship = qty > 0 ? getSelectedShipping() : 0; // giỏ trống thì ship 0
    const estimated = subtotal + ship;

    if (elOrderItemCount) elOrderItemCount.textContent = qty;
    if (elSumItemsQty) elSumItemsQty.textContent = qty;
    if (elSumSubtotal) elSumSubtotal.textContent = formatMoney(subtotal);
    if (elSumShipping) elSumShipping.textContent = ship === 0 ? "Free" : formatMoney(ship);
    if (elSumEstimated) elSumEstimated.textContent = formatMoney(estimated);
    if (elSumPay) elSumPay.textContent = formatMoney(estimated);

    // Optional: disable Pay khi giỏ trống
    if (elPayBtn) {
        if (qty === 0) {
            elPayBtn.classList.add("btn--disabled");
            elPayBtn.setAttribute("aria-disabled", "true");
        } else {
            elPayBtn.classList.remove("btn--disabled");
            elPayBtn.removeAttribute("aria-disabled");
        }
    }
}

// Listen change shipping
shipRadios.forEach(r => r.addEventListener("change", updateSummary));

// Init on load
document.addEventListener("DOMContentLoaded", updateSummary);
