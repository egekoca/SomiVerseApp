/**
 * Loader Component
 * Oyun yüklenirken gösterilen ekran
 */
export class Loader {
  constructor() {
    this.element = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'loader';
    this.element.innerHTML = `
      SİSTEM BAĞLANIYOR...
      <div class="loader-bar"></div>
    `;
    document.body.appendChild(this.element);
  }

  hide(delay = 800) {
    setTimeout(() => {
      this.element.classList.add('hidden');
    }, delay);
  }

  show() {
    this.element.classList.remove('hidden');
  }

  setText(text) {
    this.element.innerHTML = `
      ${text}
      <div class="loader-bar"></div>
    `;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

export default Loader;

