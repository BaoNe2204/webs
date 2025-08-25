const mySlider = new Slidezy("#my-slider", {
  items: 1,
  loop: true,
  autoplayTimeout: 3000,
  nav: false,
  autoplay: true
});

function initMySlider(selector, opts) {
  const defaults = { items: 5, loop: false, autoplay: false ,  nav: false};
  const options = Object.assign({}, defaults, opts || {});
  if (!window.Slidezy) { console.error('Slidezy not loaded'); return; }
  return new Slidezy(selector, options);
}
