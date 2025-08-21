// GIỮ NGUYÊN hero slider
const mySlider = new Slidezy("#my-slider", {
  items: 1,
  loop: true,
  autoplayTimeout: 3000,
  autoplay: true
});

// Hàm init cho các slider sản phẩm khác (gọi SAU khi render JSON)
function initMySlider(selector, opts) {
  const defaults = { items: 6, loop: false, autoplay: false };
  const options = Object.assign({}, defaults, opts || {});
  if (!window.Slidezy) { console.error('Slidezy not loaded'); return; }
  return new Slidezy(selector, options);
}
