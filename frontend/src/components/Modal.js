/**
 * Modal Component
 * HUD-style modal window system with action handlers
 */
import { FaucetService } from '../services/FaucetService.js';

export class Modal {
  constructor() {
    this.overlay = null;
    this.modal = null;
    this.titleEl = null;
    this.bodyEl = null;
    this.isOpen = false;
    this.onClose = null;
    this.currentType = null;
    this.walletAddress = null;
    
    this.create();
    this.setupWalletListener();
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
        <span>V.2.1.0</span>
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

    // Action button delegation
    this.bodyEl.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        this.handleAction(actionBtn.dataset.action, actionBtn);
      }
    });
  }

  setupWalletListener() {
    // Listen for wallet connection
    window.addEventListener('walletConnected', (e) => {
      this.walletAddress = e.detail.account;
      // Refresh content if faucet modal is open
      if (this.isOpen && this.currentType === 'CLAIM') {
        this.refreshFaucetContent();
      }
    });

    window.addEventListener('walletDisconnected', () => {
      this.walletAddress = null;
      if (this.isOpen && this.currentType === 'CLAIM') {
        this.refreshFaucetContent();
      }
    });
  }

  open(title, content, color = null, type = null) {
    this.titleEl.textContent = title;
    this.bodyEl.innerHTML = content;
    this.currentType = type;
    
    if (color) {
      const colorHex = '#' + color.toString(16).padStart(6, '0');
      document.documentElement.style.setProperty('--theme-color', colorHex);
    }
    
    this.overlay.classList.add('active');
    this.isOpen = true;

    // Initialize faucet service if needed
    if (type === 'CLAIM') {
      FaucetService.init();
    }
  }

  close() {
    this.overlay.classList.remove('active');
    this.isOpen = false;
    this.currentType = null;
    if (this.onClose) this.onClose();
  }

  /**
   * Handle action button clicks
   */
  async handleAction(action, button) {
    switch (action) {
      case 'faucet':
        await this.handleFaucetClaim(button);
        break;
      case 'swap':
        this.showMessage('Swap feature coming soon!', 'info');
        break;
      case 'lend':
        this.showMessage('Lending feature coming soon!', 'info');
        break;
      case 'mint':
        this.showMessage('NFT Minting feature coming soon!', 'info');
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  /**
   * Handle faucet claim
   */
  async handleFaucetClaim(button) {
    // Check wallet connection
    if (!this.walletAddress) {
      // Trigger wallet connection
      window.dispatchEvent(new CustomEvent('requestWalletConnect'));
      this.showMessage('Please connect your wallet first.', 'warning');
      return;
    }

    // Check if can claim
    if (!FaucetService.canClaim(this.walletAddress)) {
      const remaining = FaucetService.formatCooldownTime(this.walletAddress);
      this.showMessage(`Please wait ${remaining} before claiming again.`, 'warning');
      return;
    }

    // Update button to loading state
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    button.disabled = true;

    try {
      const result = await FaucetService.claimTokens(this.walletAddress);
      
      // Success
      this.showMessage(result.message, 'success');
      
      // Show transaction link
      if (result.txHash) {
        this.showTxLink(result.txHash);
      }

      // Refresh content after short delay
      setTimeout(() => {
        this.refreshFaucetContent();
      }, 2000);

    } catch (error) {
      // Error
      this.showMessage(error.message, 'error');
      
      // Reset button
      if (btnText) btnText.classList.remove('hidden');
      if (btnLoader) btnLoader.classList.add('hidden');
      button.disabled = false;
    }
  }

  /**
   * Refresh faucet modal content
   */
  async refreshFaucetContent() {
    const { generateFaucetContent } = await import('./ModalContent.js');
    this.bodyEl.innerHTML = generateFaucetContent(this.walletAddress);
  }

  /**
   * Show message in modal
   */
  showMessage(text, type = 'info') {
    let messageEl = this.bodyEl.querySelector('.faucet-message');
    
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'faucet-message';
      this.bodyEl.appendChild(messageEl);
    }

    messageEl.textContent = text;
    messageEl.className = `faucet-message ${type}`;
    messageEl.classList.remove('hidden');

    // Auto-hide after 5 seconds for non-errors
    if (type !== 'error') {
      setTimeout(() => {
        messageEl.classList.add('hidden');
      }, 5000);
    }
  }

  /**
   * Show transaction link
   */
  showTxLink(txHash) {
    const explorerUrl = `https://dream-explorer.somnia.network/tx/${txHash}`;
    
    let linkEl = this.bodyEl.querySelector('.tx-link');
    if (!linkEl) {
      linkEl = document.createElement('a');
      linkEl.className = 'tx-link';
      linkEl.target = '_blank';
      linkEl.rel = 'noopener noreferrer';
      this.bodyEl.appendChild(linkEl);
    }

    linkEl.href = explorerUrl;
    linkEl.textContent = `View Transaction: ${txHash.slice(0, 10)}...`;
    linkEl.classList.remove('hidden');
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

  setWalletAddress(address) {
    this.walletAddress = address;
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

export default Modal;
