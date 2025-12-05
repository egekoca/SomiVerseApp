/**
 * Modal Component
 * HUD-style modal window system
 */
export class Modal {
  constructor() {
    this.overlay = null;
    this.modal = null;
    this.titleEl = null;
    this.bodyEl = null;
    this.isOpen = false;
    this.onClose = null;
    
    this.create();
  }

  create() {
    // Overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'modal-overlay';
    
    // Modal
    this.modal = document.createElement('div');
    this.modal.id = 'game-modal';
    this.modal.innerHTML = `
      <div class="modal-header">
        <div>
          <h2 class="modal-title" id="m-title">TITLE</h2>
          <div class="modal-subtitle">SECURE CONNECTION ESTABLISHED</div>
        </div>
        <div class="system-status">
          NET: ONLINE<br>
          PING: 12ms<br>
          ID: #8842-X
        </div>
        <button class="close-btn" id="modal-close">×</button>
      </div>
      <div class="modal-body" id="m-body"></div>
      <div class="modal-footer">
        <span>/// SYSTEM READY</span>
        <span>V.2.0.4</span>
      </div>
    `;

    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    // Element references
    this.titleEl = this.modal.querySelector('#m-title');
    this.bodyEl = this.modal.querySelector('#m-body');

    // Event listeners
    this.modal.querySelector('#modal-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  open(title, content, color = null) {
    this.titleEl.textContent = title;
    this.bodyEl.innerHTML = content;
    
    if (color) {
      const colorHex = '#' + color.toString(16).padStart(6, '0');
      document.documentElement.style.setProperty('--theme-color', colorHex);
    }
    
    this.overlay.classList.add('active');
    this.isOpen = true;
  }

  close() {
    this.overlay.classList.remove('active');
    this.isOpen = false;
    if (this.onClose) this.onClose();
  }

  setContent(content) {
    this.bodyEl.innerHTML = content;
  }

  setTitle(title) {
    this.titleEl.textContent = title;
  }

  setOnClose(callback) {
    this.onClose = callback;
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

export default Modal;
