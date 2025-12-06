import { CONFIG } from '../config.js';

/**
 * Input System
 * Klavye girdileri yönetimi
 */
export class InputSystem {
  constructor() {
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      up: false,
      down: false,
      left: false,
      right: false
    };
    
    this.enabled = true;
    this.actionCallback = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));
  }

  onAction(callback) {
    this.actionCallback = callback;
  }

  handleKey(e, state) {
    if (!this.enabled) return;
    
    const k = e.key.toLowerCase();
    
    // Action key (Enter) - Trigger only on key down
    if (k === 'enter' && state && this.actionCallback) {
      this.actionCallback();
      return;
    }

    if (['w', 'arrowup'].includes(k)) {
      this.keys.w = state;
      this.keys.up = state;
    }
    if (['a', 'arrowleft'].includes(k)) {
      this.keys.a = state;
      this.keys.left = state;
    }
    if (['s', 'arrowdown'].includes(k)) {
      this.keys.s = state;
      this.keys.down = state;
    }
    if (['d', 'arrowright'].includes(k)) {
      this.keys.d = state;
      this.keys.right = state;
    }
  }

  getMovement() {
    if (!this.enabled) return { dx: 0, dz: 0, isMoving: false };
    
    const speed = CONFIG.player.speed;
    let dx = 0;
    let dz = 0;

    if (this.keys.w || this.keys.up) dz = -speed;
    if (this.keys.s || this.keys.down) dz = speed;
    if (this.keys.a || this.keys.left) dx = -speed;
    if (this.keys.d || this.keys.right) dx = speed;

    return {
      dx,
      dz,
      isMoving: dx !== 0 || dz !== 0
    };
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    // Tüm tuşları sıfırla
    Object.keys(this.keys).forEach(key => {
      this.keys[key] = false;
    });
  }

  isEnabled() {
    return this.enabled;
  }
}

export default InputSystem;
