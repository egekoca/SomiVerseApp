/**
 * LevelUpPopup Component
 * Shows level up notification with special message for level 5
 */
export class LevelUpPopup {
  constructor() {
    this.element = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'levelup-popup';
    this.element.className = 'levelup-popup';
    document.body.appendChild(this.element);
  }

  show(newLevel, previousLevel) {
    const isLevel5 = newLevel === 5;
    
    const colorClass = newLevel >= 5 ? 'levelup-orange' : 'levelup-blue';

    // Ensure visible before binding events
    this.element.style.display = 'flex';
    this.element.style.pointerEvents = 'all';

    this.element.innerHTML = `
      <div class="levelup-content ${colorClass}">
        <div class="levelup-title">LEVEL UP!</div>
        <div class="levelup-level">Level ${newLevel}</div>
        ${isLevel5 ? `
          <div class="levelup-special">
            <div class="levelup-special-text">New appearance unlocked!</div>
          </div>
        ` : ''}
        <button class="levelup-close">OK</button>
      </div>
    `;

    // Bind close button
    const closeBtn = this.element.querySelector('.levelup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      });
    }

    // Show with animation
    setTimeout(() => {
      this.element.classList.add('show');
    }, 10);

    // Auto-hide after 1.5 seconds
    setTimeout(() => {
      this.hide();
    }, 1500);
  }

  hide() {
    this.element.classList.remove('show');
    this.element.style.pointerEvents = 'none';
    // Fully hide after transition
    setTimeout(() => {
      this.element.style.display = 'none';
      this.element.innerHTML = '';
    }, 300);
  }
}

export default LevelUpPopup;

