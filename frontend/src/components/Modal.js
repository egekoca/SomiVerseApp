/**
 * Modal Component
 * HUD-style modal window system with action handlers
 */
import { FaucetService } from '../services/FaucetService.js';
import { SwapService } from '../services/SwapService.js';
import { GearboxService } from '../services/GearboxService.js';

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
    this.currentFromBalance = 0; // For swap percent calculations
    
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
    this.footerEl = this.modal.querySelector('.modal-footer');

    // Event listeners
    this.modal.querySelector('#modal-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Interaction delegation
    this.bodyEl.addEventListener('click', (e) => {
      // Action buttons
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        this.handleAction(actionBtn.dataset.action, actionBtn);
        return;
      }

      // Swap Percent buttons
      if (e.target.classList.contains('percent-btn')) {
        this.handleSwapPercent(e.target.textContent);
      }

      // Swap Switch button - handled in initSwapUI for SWAP type modals
    });

    // Input listener for swap calculation (legacy - now handled in initSwapUI)
    this.bodyEl.addEventListener('input', (e) => {
      if (e.target.classList.contains('cyber-input') && e.target.closest('.from-box')) {
        // Only trigger if swap modal is open and handler exists
        if (this.currentType === 'SWAP' && typeof this.handleSwapQuote === 'function') {
          this.handleSwapQuote();
        }
      }
    });
  }

  setupWalletListener() {
    // Listen for wallet connection
    window.addEventListener('walletConnected', (e) => {
      this.walletAddress = e.detail.account;
      // Refresh content if modal is open
      if (this.isOpen) {
        if (this.currentType === 'CLAIM') {
          this.refreshFaucetContent();
        } else if (this.currentType === 'SWAP') {
          this.refreshSwapContent();
        }
      }
    });

    window.addEventListener('walletDisconnected', () => {
      this.walletAddress = null;
      if (this.isOpen) {
        if (this.currentType === 'CLAIM') {
          this.refreshFaucetContent();
        } else         if (this.currentType === 'SWAP') {
          this.refreshSwapContent();
        } else if (this.currentType === 'LEND') {
          this.refreshLendingContent();
        }
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

    // Initialize services based on type
    if (type === 'CLAIM') {
      FaucetService.init();
    }

    // Initialize swap UI if needed
    if (type === 'SWAP') {
      this.initSwapUI();
    }

    // Initialize lending UI if needed
    if (type === 'LEND') {
      this.initLendingUI();
      // Hide footer for lending modal
      if (this.footerEl) {
        this.footerEl.style.display = 'none';
      }
    } else {
      // Show footer for other modals
      if (this.footerEl) {
        this.footerEl.style.display = '';
      }
    }

    // Auto-focus on first interactive element
    setTimeout(() => {
      const focusable = this.bodyEl.querySelector('input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (focusable) {
        focusable.focus();
      }
    }, 50);
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
        await this.handleSwapExecute(button);
        break;
      case 'deposit':
        await this.handleLendingDeposit(button);
        break;
      case 'withdraw':
        await this.handleLendingWithdraw(button);
        break;
      case 'lend':
        // Legacy support
        await this.handleLendingDeposit(button);
        break;
      case 'mint':
        await this.simulateTransaction(button, 'NFT MINTED: CYBER PUNK #8842', 150);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  // --- SWAP HANDLERS ---

  /**
   * Initialize Swap UI event listeners
   */
  initSwapUI() {
    SwapService.init();
    
    // Load balances if wallet connected
    this.loadSwapBalances();

    // Amount input - get quote on change
    const fromAmountInput = this.bodyEl.querySelector('#from-amount');
    if (fromAmountInput) {
      fromAmountInput.addEventListener('input', () => this.handleSwapQuote());
      fromAmountInput.addEventListener('change', () => this.handleSwapQuote());
    }

    // Token selectors - get quote on change
    const fromTokenSelect = this.bodyEl.querySelector('#from-token');
    const toTokenSelect = this.bodyEl.querySelector('#to-token');
    
    if (fromTokenSelect) {
      fromTokenSelect.addEventListener('change', () => {
        this.loadSwapBalances();
        this.handleSwapQuote();
      });
    }
    
    if (toTokenSelect) {
      toTokenSelect.addEventListener('change', () => {
        this.loadSwapBalances();
        this.handleSwapQuote();
      });
    }

    // Switch tokens button
    const switchBtn = this.bodyEl.querySelector('#switch-tokens');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => this.handleSwapSwitch());
    }

    // Percent buttons
    const percentBtns = this.bodyEl.querySelectorAll('.percent-btn');
    percentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const percent = btn.dataset.percent;
        this.handleSwapPercent(percent);
      });
    });
  }

  /**
   * Load token balances for swap UI
   */
  async loadSwapBalances() {
    if (!this.walletAddress) return;

    const fromTokenSelect = this.bodyEl.querySelector('#from-token');
    const toTokenSelect = this.bodyEl.querySelector('#to-token');
    const fromBalanceEl = this.bodyEl.querySelector('#from-balance');
    const toBalanceEl = this.bodyEl.querySelector('#to-balance');

    if (!fromTokenSelect || !toTokenSelect) return;

    const fromToken = fromTokenSelect.value;
    const toToken = toTokenSelect.value;

    try {
      // Load from token balance
      const fromBalance = await SwapService.getBalance(fromToken, this.walletAddress);
      if (fromBalanceEl) {
        fromBalanceEl.textContent = `Balance: ${parseFloat(fromBalance).toFixed(4)}`;
      }
      this.currentFromBalance = parseFloat(fromBalance);

      // Load to token balance
      const toBalance = await SwapService.getBalance(toToken, this.walletAddress);
      if (toBalanceEl) {
        toBalanceEl.textContent = `Balance: ${parseFloat(toBalance).toFixed(4)}`;
      }
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  }

  /**
   * Handle percent button click
   */
  handleSwapPercent(percentStr) {
    const fromInput = this.bodyEl.querySelector('#from-amount');
    if (!fromInput || !this.currentFromBalance) return;

    const percent = percentStr === '100' ? 100 : parseInt(percentStr);
    let amount = (this.currentFromBalance * percent) / 100;
    
    // Leave some for gas if using native token
    const fromToken = this.bodyEl.querySelector('#from-token')?.value;
    if (fromToken === 'STT' && percent === 100) {
      amount = Math.max(0, amount - 0.01); // Reserve 0.01 STT for gas
    }

    fromInput.value = amount.toFixed(4);
    this.handleSwapQuote();
  }

  /**
   * Handle token switch button
   */
  handleSwapSwitch() {
    const fromTokenSelect = this.bodyEl.querySelector('#from-token');
    const toTokenSelect = this.bodyEl.querySelector('#to-token');
    const fromAmountInput = this.bodyEl.querySelector('#from-amount');
    const toAmountInput = this.bodyEl.querySelector('#to-amount');

    if (!fromTokenSelect || !toTokenSelect) return;

    // Swap token selections
    const tempToken = fromTokenSelect.value;
    fromTokenSelect.value = toTokenSelect.value;
    toTokenSelect.value = tempToken;

    // Swap amounts
    if (fromAmountInput && toAmountInput) {
      fromAmountInput.value = toAmountInput.value;
      toAmountInput.value = '';
    }

    // Reload balances and quote
    this.loadSwapBalances();
    this.handleSwapQuote();
  }

  /**
   * Get and display swap quote
   */
  async handleSwapQuote() {
    const fromToken = this.bodyEl.querySelector('#from-token')?.value;
    const toToken = this.bodyEl.querySelector('#to-token')?.value;
    const amount = this.bodyEl.querySelector('#from-amount')?.value;
    const toAmountInput = this.bodyEl.querySelector('#to-amount');
    const swapBtn = this.bodyEl.querySelector('#swap-btn');
    const quoteInfo = this.bodyEl.querySelector('#quote-info');

    // Validate input
    if (!amount || parseFloat(amount) <= 0 || fromToken === toToken) {
      if (toAmountInput) toAmountInput.value = '';
      if (quoteInfo) quoteInfo.classList.add('hidden');
      if (swapBtn && this.walletAddress) swapBtn.disabled = true;
      return;
    }

    try {
      const quote = await SwapService.getSwapQuote(fromToken, toToken, amount);

      // Update output amount
      if (toAmountInput) {
        toAmountInput.value = quote.outputAmount;
      }

      // Update quote details
      const rateEl = this.bodyEl.querySelector('#swap-rate');
      const impactEl = this.bodyEl.querySelector('#price-impact');
      const feeEl = this.bodyEl.querySelector('#swap-fee');

      if (rateEl) {
        let rateText = `1 ${fromToken} = ${quote.rate} ${toToken}`;
        if (quote.estimated) {
          rateText += ' <span class="estimated-badge">EST</span>';
        }
        rateEl.innerHTML = rateText;
      }
      if (impactEl) impactEl.textContent = quote.priceImpact;
      if (feeEl) feeEl.textContent = `${quote.fee} ${fromToken}`;

      // Show quote info
      if (quoteInfo) quoteInfo.classList.remove('hidden');

      // Enable swap button
      if (swapBtn && this.walletAddress) {
        swapBtn.disabled = false;
        const btnText = swapBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'SWAP TOKENS';
      }

    } catch (error) {
      console.error('Quote error:', error);
      if (toAmountInput) toAmountInput.value = '';
      if (quoteInfo) quoteInfo.classList.add('hidden');
      this.showMessage('Failed to get quote: ' + error.message, 'error');
    }
  }

  /**
   * Execute swap transaction
   */
  async handleSwapExecute(button) {
    // Check wallet connection
    if (!this.walletAddress) {
      window.dispatchEvent(new CustomEvent('requestWalletConnect'));
      this.showMessage('Please connect your wallet first.', 'warning');
      return;
    }

    const fromToken = this.bodyEl.querySelector('#from-token')?.value;
    const toToken = this.bodyEl.querySelector('#to-token')?.value;
    const amount = this.bodyEl.querySelector('#from-amount')?.value;

    // Validate
    if (!amount || parseFloat(amount) <= 0) {
      this.showMessage('Please enter a valid amount', 'error');
      return;
    }

    if (fromToken === toToken) {
      this.showMessage('Cannot swap same token', 'error');
      return;
    }

    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    const originalText = btnText ? btnText.textContent : '';

    // Show loading state
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    button.disabled = true;

    try {
      const result = await SwapService.swapTokens(fromToken, toToken, amount);

      if (result.success) {
        // Show XP Popup
        this.showXPPopup('SWAP COMPLETED', 50);

        // Show transaction link
        if (result.txHash) {
          this.showTxLink(result.txHash);
        }

        // Reload balances after successful swap
        setTimeout(() => {
          this.loadSwapBalances();
          // Clear input
          const fromAmountInput = this.bodyEl.querySelector('#from-amount');
          const toAmountInput = this.bodyEl.querySelector('#to-amount');
          if (fromAmountInput) fromAmountInput.value = '';
          if (toAmountInput) toAmountInput.value = '';
          const quoteInfo = this.bodyEl.querySelector('#quote-info');
          if (quoteInfo) quoteInfo.classList.add('hidden');
        }, 2000);
      }

    } catch (error) {
      console.error('Swap error:', error);
      this.showMessage(error.message, 'error');
    } finally {
      // Reset button state
      if (btnText) {
        btnText.classList.remove('hidden');
        btnText.textContent = originalText;
      }
      if (btnLoader) btnLoader.classList.add('hidden');
      button.disabled = false;
    }
  }

  /**
   * Simulate transaction for demo purposes
   */
  async simulateTransaction(button, successMessage, xpReward) {
    if (!this.walletAddress) {
      window.dispatchEvent(new CustomEvent('requestWalletConnect'));
      this.showMessage('Please connect your wallet first.', 'warning');
      return;
    }

    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    const originalText = btnText ? btnText.textContent : '';

    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    button.disabled = true;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Show XP Popup instead of inline message for major actions
    this.showXPPopup(successMessage.split(':')[0], xpReward);
    
    // Reset button
    if (btnText) btnText.classList.remove('hidden');
    if (btnLoader) btnLoader.classList.add('hidden');
    button.disabled = false;

    // Add XP locally for demo
    if (window.profile && typeof window.profile.addXP === 'function') {
        window.profile.addXP(this.walletAddress, xpReward);
    }
  }

  /**
   * Show Full Screen XP Popup
   */
  showXPPopup(actionName, xpAmount) {
    const popup = document.createElement('div');
    popup.className = 'xp-popup';
    popup.innerHTML = `
      <div class="xp-popup-content">
        <button class="xp-close-btn">×</button>
        <div class="xp-header">MISSION ACCOMPLISHED</div>
        <div class="xp-action">${actionName}</div>
        <div class="xp-amount">+${xpAmount} <span class="xp-label">XP</span></div>
      </div>
    `;
    document.body.appendChild(popup);
    
    // Add styles dynamically if not present
    if (!document.getElementById('xp-popup-style')) {
      const style = document.createElement('style');
      style.id = 'xp-popup-style';
      style.textContent = `
        .xp-popup {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          background: rgba(0,0,0,0.7);
          animation: fadeIn 0.3s forwards;
        }
        .xp-popup-content {
          position: relative;
          background: rgba(10, 10, 20, 0.95);
          border: 2px solid var(--theme-color, #00ffcc);
          padding: 30px 50px;
          text-align: center;
          border-radius: 10px;
          box-shadow: 0 0 30px rgba(var(--theme-rgb), 0, 255, 204), 0.5);
          transform: scale(0.8);
          animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .xp-close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.5em;
          cursor: pointer;
          transition: color 0.2s;
          line-height: 1;
          padding: 0 5px;
        }
        .xp-close-btn:hover {
          color: #fff;
        }
        .xp-header {
          color: #fff;
          font-family: 'Courier New', monospace;
          font-size: 1.2em;
          margin-bottom: 10px;
          letter-spacing: 2px;
        }
        .xp-action {
          color: var(--theme-color, #00ffcc);
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        .xp-amount {
          font-size: 3em;
          color: #fff;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255,255,255,0.5);
        }
        .xp-label {
          font-size: 0.4em;
          color: #888;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.5); } to { transform: scale(1); } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      `;
      document.head.appendChild(style);
    }

    // Close handler
    const closeBtn = popup.querySelector('.xp-close-btn');
    const removePopup = () => {
      if (popup.parentNode) {
        popup.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
          if (popup.parentNode) popup.parentNode.removeChild(popup);
        }, 300);
      }
    };

    closeBtn.addEventListener('click', removePopup);
    
    // Allow closing by clicking outside content
    popup.addEventListener('click', (e) => {
      if (e.target === popup) removePopup();
    });

    // Auto-remove after animation (increased delay to allow reading)
    setTimeout(removePopup, 3000);
  }

  /**
   * Handle faucet claim
   */
  async handleFaucetClaim(button) {
    // Check wallet connection
    if (!this.walletAddress) {
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

    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    button.disabled = true;

    try {
      const result = await FaucetService.claimTokens(this.walletAddress);
      
      // Use XP Popup instead of inline message
      this.showXPPopup('FAUCET CLAIM SUCCESSFUL', 25);
      
      // Show transaction link separately or in notification
      // For now, let's show it inline briefly
      if (result.txHash) {
        this.showMessage('Transaction Sent', 'success');
      }

      setTimeout(() => {
        this.refreshFaucetContent();
      }, 2000);

    } catch (error) {
      this.showMessage(error.message, 'error');
      if (btnText) btnText.classList.remove('hidden');
      if (btnLoader) btnLoader.classList.add('hidden');
      button.disabled = false;
    }
  }

  // ... existing methods (refreshFaucetContent, showMessage, etc.) ...
  
  /**
   * Refresh faucet modal content
   */
  async refreshFaucetContent() {
    const { generateFaucetContent } = await import('./ModalContent.js');
    this.bodyEl.innerHTML = generateFaucetContent(this.walletAddress);
  }

  /**
   * Refresh swap modal content
   */
  async refreshSwapContent() {
    const { generateSwapContent } = await import('./ModalContent.js');
    this.bodyEl.innerHTML = generateSwapContent(this.walletAddress);
    this.initSwapUI();
  }

  /**
   * Refresh lending modal content
   */
  async refreshLendingContent() {
    const { generateLendingContent } = await import('./ModalContent.js');
    this.bodyEl.innerHTML = generateLendingContent(this.walletAddress);
    this.initLendingUI();
  }

  showMessage(text, type = 'info', xpAmount = 0) {
    let messageEl = this.bodyEl.querySelector('.faucet-message');
    
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'faucet-message';
      this.bodyEl.appendChild(messageEl);
    }

    const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
    // XP badge is removed from inline message as we have popup now
    
    messageEl.innerHTML = `
      <div class="msg-row">
        <span class="msg-icon">${icon}</span>
        <span class="msg-text">${text.toUpperCase()}</span>
      </div>
    `;
    
    messageEl.className = `faucet-message ${type}`;
    messageEl.classList.remove('hidden');

    if (type !== 'error') {
      setTimeout(() => {
        messageEl.classList.add('hidden');
      }, 5000);
    }
  }

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

  // --- LENDING HANDLERS (Gearbox Protocol) ---

  /**
   * Initialize Lending UI event listeners
   */
  initLendingUI() {
    GearboxService.init();
    
    // Tab switching
    const tabs = this.bodyEl.querySelectorAll('.lending-tab');
    const tabContents = this.bodyEl.querySelectorAll('.lending-tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Update tab styles
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.borderBottomColor = 'transparent';
          t.style.color = 'rgba(255,255,255,0.5)';
        });
        tab.classList.add('active');
        tab.style.borderBottomColor = 'var(--theme-color, #00ffcc)';
        tab.style.color = 'var(--theme-color, #00ffcc)';
        
        // Show/hide tab contents
        tabContents.forEach(content => {
          if (content.dataset.content === targetTab) {
            content.style.display = 'block';
          } else {
            content.style.display = 'none';
          }
        });
        
        // Load data for the active tab
        this.loadLendingData();
      });
    });
    
    // Load balances and pool data
    this.loadLendingData();

    // No token selector needed - only WSOMI is used

    // Amount inputs
    const amountInputs = this.bodyEl.querySelectorAll('#lend-amount, #lend-amount-withdraw');
    amountInputs.forEach(amountInput => {
      if (amountInput) {
        amountInput.addEventListener('input', async () => {
          await this.updateLendingPreview();
        });
      }
    });

    // Percent buttons
    const percentBtns = this.bodyEl.querySelectorAll('.percent-btn');
    percentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const percent = btn.dataset.percent;
        this.handleLendingPercent(percent);
      });
    });
  }

  /**
   * Update lending preview (amount calculations)
   */
  async updateLendingPreview() {
    // Get active tab
    const activeTab = this.bodyEl.querySelector('.lending-tab.active');
    if (!activeTab) return;
    
    const tabType = activeTab.dataset.tab;
    
    if (tabType === 'deposit') {
      const amountInput = this.bodyEl.querySelector('#lend-amount');
      const youGetEl = this.bodyEl.querySelector('#you-get-amount');
      if (amountInput && youGetEl) {
        const amount = parseFloat(amountInput.value) || 0;
        youGetEl.textContent = `${amount.toFixed(2)} dWSOMI-V3-1`;
      }
    } else if (tabType === 'withdraw') {
      const amountInput = this.bodyEl.querySelector('#lend-amount-withdraw');
      const youGetEl = this.bodyEl.querySelector('#you-get-amount-withdraw');
      if (amountInput && youGetEl) {
        const amount = parseFloat(amountInput.value) || 0;
        
        if (amount > 0 && this.walletAddress) {
          // Calculate preview WSOMI from dWSOMI-V3-1 shares
          try {
            const previewWSOMI = await GearboxService.previewWithdraw(amount);
            youGetEl.textContent = `${previewWSOMI.toFixed(6)} WSOMI`;
          } catch (e) {
            // Fallback to 1:1 ratio if preview fails
            youGetEl.textContent = `${amount.toFixed(6)} WSOMI`;
          }
        } else {
          youGetEl.textContent = `0.00 WSOMI`;
        }
      }
    }
  }

  /**
   * Load lending data (balances, pool stats)
   */
  async loadLendingData() {
    if (!this.walletAddress) return;

    // Get active tab
    const activeTab = this.bodyEl.querySelector('.lending-tab.active');
    const tabType = activeTab ? activeTab.dataset.tab : 'deposit';
    
    // Only WSOMI is used (no token selection)
    const tokenSymbol = 'WSOMI';
    
    // Get elements based on active tab
    const balanceEl = tabType === 'deposit'
      ? this.bodyEl.querySelector('#lend-balance')
      : this.bodyEl.querySelector('#lend-balance-withdraw');
    
    const apyEl = tabType === 'deposit'
      ? this.bodyEl.querySelector('#pool-apy')
      : null;
    
    const availableLiquidityEl = this.bodyEl.querySelector('#available-liquidity');

    try {
      let walletBalance = '0';
      
      if (tabType === 'deposit') {
        // Deposit tab: show wallet balance
        try {
          walletBalance = await GearboxService.getWSOMIBalance(this.walletAddress) || '0';
          if (walletBalance === '0' || parseFloat(walletBalance) === 0) {
            try {
              const wsttBalance = await SwapService.getBalance('WSTT', this.walletAddress) || '0';
              if (parseFloat(wsttBalance) > 0) {
                walletBalance = wsttBalance;
              }
            } catch (e) {
              // Ignore
            }
          }
        } catch (e) {
          console.error('Error getting WSOMI balance:', e);
          walletBalance = '0';
        }
        
        if (balanceEl) {
          const balanceNum = parseFloat(walletBalance || '0');
          balanceEl.textContent = balanceNum.toFixed(2);
        }
        this.currentLendBalance = parseFloat(walletBalance || '0');
      } else {
        // Withdraw tab: show dWSOMI-V3-1 balance (shares balance)
        try {
          walletBalance = await GearboxService.getDieselBalance(tokenSymbol, this.walletAddress) || '0';
        } catch (e) {
          walletBalance = '0';
        }
        
        if (balanceEl) {
          const balanceNum = parseFloat(walletBalance || '0');
          balanceEl.textContent = balanceNum.toFixed(2);
        }
        this.currentLendBalance = parseFloat(walletBalance || '0');
      }

      // Load pool APY
      let apy = 0;
      try {
        apy = await GearboxService.getPoolAPY(tokenSymbol) || 0;
      } catch (e) {
        apy = 0;
      }
      
      if (apyEl) {
        apyEl.textContent = `APY: ${apy.toFixed(2)}%`;
      }

      // Load pool stats
      try {
        const pools = await GearboxService.getPools();
        const pool = pools.find(p => p.token === 'WSOMI');
        if (pool) {
          if (apyEl) {
            const apy = await GearboxService.getPoolAPY('WSOMI') || 0;
            apyEl.textContent = `${apy.toFixed(0)}%`;
          }
          if (availableLiquidityEl) {
            const availLiq = pool.availableLiquidity || '0';
            const availLiqNum = parseFloat(availLiq);
            if (availLiqNum >= 1000000) {
              availableLiquidityEl.textContent = `${(availLiqNum / 1000000).toFixed(2)}M WSOMI`;
            } else if (availLiqNum >= 1000) {
              availableLiquidityEl.textContent = `${(availLiqNum / 1000).toFixed(2)}K WSOMI`;
            } else {
              availableLiquidityEl.textContent = `${availLiqNum.toFixed(2)} WSOMI`;
            }
          }
        }
      } catch (e) {
        // Pool stats failed to load - set defaults
        if (apyEl) {
          apyEl.textContent = '0%';
        }
        if (availableLiquidityEl) {
          availableLiquidityEl.textContent = '0 WSOMI';
        }
      }

      // Load position data (user's supply position)
      try {
        const positionSupplyEl = this.bodyEl.querySelector('#position-supply');
        const positionApyEl = this.bodyEl.querySelector('#position-apy');
        const positionBalanceEl = this.bodyEl.querySelector('#position-balance');
        
        if (positionSupplyEl || positionApyEl || positionBalanceEl) {
          // Get user's deposit balance (WSOMI equivalent)
          const depositBalance = await GearboxService.getDepositBalance(tokenSymbol, this.walletAddress) || '0';
          const depositBalanceNum = parseFloat(depositBalance);
          
          // Get user's Diesel balance (shares)
          const dieselBalance = await GearboxService.getDieselBalance(tokenSymbol, this.walletAddress) || '0';
          const dieselBalanceNum = parseFloat(dieselBalance);
          
          // Get APY
          const positionAPY = await GearboxService.getPoolAPY(tokenSymbol) || 0;
          
          if (positionSupplyEl) {
            positionSupplyEl.textContent = `${depositBalanceNum.toFixed(2)} WSOMI`;
          }
          
          if (positionApyEl) {
            positionApyEl.textContent = `${positionAPY.toFixed(2)}%`;
          }
          
          if (positionBalanceEl) {
            positionBalanceEl.textContent = `${dieselBalanceNum.toFixed(2)} dWSOMI-V3-1`;
          }
        }
      } catch (e) {
        console.error('Error loading position data:', e);
        // Set defaults
        const positionSupplyEl = this.bodyEl.querySelector('#position-supply');
        const positionApyEl = this.bodyEl.querySelector('#position-apy');
        const positionBalanceEl = this.bodyEl.querySelector('#position-balance');
        
        if (positionSupplyEl) positionSupplyEl.textContent = '0.00 WSOMI';
        if (positionApyEl) positionApyEl.textContent = '0%';
        if (positionBalanceEl) positionBalanceEl.textContent = '0.00 dWSOMI-V3-1';
      }
    } catch (error) {
      console.error('Error loading lending data:', error);
    }
  }

  /**
   * Handle percent button click
   */
  async handleLendingPercent(percentStr) {
    // Get active tab
    const activeTab = this.bodyEl.querySelector('.lending-tab.active');
    const tabType = activeTab ? activeTab.dataset.tab : 'deposit';
    
    const amountInput = tabType === 'deposit'
      ? this.bodyEl.querySelector('#lend-amount')
      : this.bodyEl.querySelector('#lend-amount-withdraw');
    
    if (!amountInput) return;

    // For withdraw, use dWSOMI-V3-1 balance (currentLendBalance is already in dWSOMI-V3-1)
    // For deposit, use WSOMI balance
    const balance = this.currentLendBalance || 0;
    
    if (balance === 0) return;

    const percent = percentStr === '100' ? 100 : parseInt(percentStr);
    let amount = (balance * percent) / 100;
    
    // Reserve some for gas if native token (only for deposit)
    if (tabType === 'deposit') {
      const tokenSelect = this.bodyEl.querySelector('#lend-token');
      const tokenSymbol = tokenSelect?.value;
      if (tokenSymbol === 'STT' && percent === 100) {
        amount = Math.max(0, amount - 0.01); // Reserve 0.01 STT for gas
      }
    }
    
    amountInput.value = amount.toFixed(4);
    await this.updateLendingPreview();
  }

  /**
   * Handle deposit action
   */
  async handleLendingDeposit(button) {
    if (!this.walletAddress) {
      window.dispatchEvent(new CustomEvent('requestWalletConnect'));
      this.showMessage('Please connect your wallet first.', 'warning');
      return;
    }

    const amountInput = this.bodyEl.querySelector('#lend-amount');
    const tokenSymbol = 'WSOMI'; // Only WSOMI is used
    const amount = amountInput?.value;

    if (!amount || parseFloat(amount) <= 0) {
      this.showMessage('Please enter a valid amount', 'error');
      return;
    }

    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    const originalText = btnText ? btnText.textContent : '';

    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    button.disabled = true;

    try {
      const result = await GearboxService.deposit(tokenSymbol, amount);

      if (result.success) {
        this.showXPPopup('DEPOSIT SUCCESSFUL', 75);
        
        // Reload data
        setTimeout(() => {
          this.loadLendingData();
          if (amountInput) amountInput.value = '';
        }, 2000);
      }
    } catch (error) {
      this.showMessage(error.message, 'error');
    } finally {
      if (btnText) {
        btnText.classList.remove('hidden');
        btnText.textContent = originalText;
      }
      if (btnLoader) btnLoader.classList.add('hidden');
      button.disabled = false;
    }
  }

  /**
   * Handle withdraw action
   */
  async handleLendingWithdraw(button) {
    if (!this.walletAddress) {
      window.dispatchEvent(new CustomEvent('requestWalletConnect'));
      this.showMessage('Please connect your wallet first.', 'warning');
      return;
    }

    const amountInput = this.bodyEl.querySelector('#lend-amount-withdraw');
    const tokenSymbol = 'WSOMI'; // Only WSOMI is used
    const amount = amountInput?.value;

    if (!amount || parseFloat(amount) <= 0) {
      this.showMessage('Please enter a valid amount', 'error');
      return;
    }

    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    const originalText = btnText ? btnText.textContent : '';

    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    button.disabled = true;

    try {
      const result = await GearboxService.withdraw(tokenSymbol, amount);

      if (result.success) {
        this.showXPPopup('WITHDRAW SUCCESSFUL', 50);
        
        // Reload data
        setTimeout(() => {
          this.loadLendingData();
          if (amountInput) amountInput.value = '';
        }, 2000);
      }
    } catch (error) {
      this.showMessage(error.message, 'error');
    } finally {
      if (btnText) {
        btnText.classList.remove('hidden');
        btnText.textContent = originalText;
      }
      if (btnLoader) btnLoader.classList.add('hidden');
      button.disabled = false;
    }
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

export default Modal;
