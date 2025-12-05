/**
 * ActionButton Component
 * 3D dünya üzerinde görünen etkileşim butonu
 */
export class ActionButton {
  constructor(onClick) {
    this.element = null;
    this.onClick = onClick;
    this.create();
  }

  create() {
    this.element = document.createElement('button');
    this.element.id = 'action-button';
    this.element.textContent = 'BAĞLANTI KUR';
    this.element.addEventListener('click', () => {
      if (this.onClick) this.onClick();
    });
    document.body.appendChild(this.element);
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }

  setText(text) {
    this.element.textContent = text;
  }

  updatePosition(screenX, screenY) {
    this.element.style.left = `${screenX}px`;
    this.element.style.top = `${screenY}px`;
    this.element.style.transform = 'translate(-50%, -50%)';
  }

  setColor(colorHex) {
    document.documentElement.style.setProperty('--theme-color', colorHex);
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

export default ActionButton;

