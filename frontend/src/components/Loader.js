/**
 * Loader Component
 * Loading screen with SomiVerse logo
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
      <div class="loader-bg"></div>
      <div class="loader-content">
        <img src="/Somi.png" alt="SomiVerse" class="loader-logo" />
        <div class="loader-text">CONNECTING TO SYSTEM...</div>
        <div class="loader-bar"></div>
      </div>
    `;
    document.body.appendChild(this.element);
  }

  hide(delay = 1500) {
    setTimeout(() => {
      this.element.classList.add('hidden');
    }, delay);
  }

  show() {
    this.element.classList.remove('hidden');
  }

  setText(text) {
    const textEl = this.element.querySelector('.loader-text');
    if (textEl) {
      textEl.textContent = text;
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

export default Loader;
