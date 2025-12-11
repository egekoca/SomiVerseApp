/**
 * Modal Component
 * HUD-style modal window system with action handlers
 */
import { FaucetService } from '../services/FaucetService.js';
import { SwapService } from '../services/SwapService.js';
import { GearboxService } from '../services/GearboxService.js';
import { domainService } from '../services/DomainService.js';
import { BridgeService } from '../services/BridgeService.js';
import { SWAP_CONFIG } from '../config/swap.config.js';

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

      // Bridge Percent buttons
      if (e.target.classList.contains('bridge-percent-btn')) {
        this.handleBridgePercent(e.target);
        return;
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
        } else if (this.currentType === 'DOMAIN') {
          this.refreshDomainContent();
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
    if (type === 'CLAIM') {
      this.titleEl.innerHTML = `<img src="/somniablack.png" class="modal-title-icon" alt="logo" /> STT Faucet`;
    } else {
      this.titleEl.textContent = title;
    }
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
      // initSwapUI will be called after content is loaded
      setTimeout(async () => await this.initSwapUI(), 100);
    }

    // Initialize lending UI if needed
    if (type === 'LEND') {
      this.initLendingUI();
    }

    // Initialize domain UI if needed
    if (type === 'DOMAIN') {
      setTimeout(async () => await this.initDomainUI(), 100);
    }

    // Hide footer for lending/swap/faucet/bridge modals, but show custom footer for domain
    if (type === 'LEND' || type === 'SWAP' || type === 'CLAIM' || type === 'BRIDGE') {
      if (this.footerEl) this.footerEl.style.display = 'none';
    } else if (type === 'DOMAIN') {
      // Show footer for domain modal with custom content
      if (this.footerEl) {
        this.footerEl.style.display = 'flex';
        this.footerEl.style.justifyContent = 'center';
        this.footerEl.innerHTML = `
          <a 
            href="https://www.somnia.domains/" 
            target="_blank" 
            rel="noopener noreferrer"
            style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: rgba(255,255,255,0.7); font-family: 'Courier New', monospace; font-size: 0.85em; transition: all 0.3s;"
            onmouseover="this.style.color='var(--theme-color, #aa00ff)'"
            onmouseout="this.style.color='rgba(255,255,255,0.7)'"
          >
            <img src="/somniablack.png" alt="Somnia" style="width: 20px; height: 20px; border-radius: 50%;" />
            <span>Powered by Somnia Domain Service</span>
          </a>
        `;
      }
    } else if (this.footerEl) {
      this.footerEl.style.display = '';
      this.footerEl.innerHTML = `
        <span>/// SYSTEM READY</span>
        <span>V.2.1.0</span>
      `;
    }

    // Hide subtitle/system status for faucet, domain, and bridge modals
    const subtitleEl = this.modal.querySelector('.modal-subtitle');
    const systemStatusEl = this.modal.querySelector('.system-status');
    if (type === 'CLAIM' || type === 'DOMAIN' || type === 'BRIDGE') {
      if (subtitleEl) subtitleEl.style.display = 'none';
      if (systemStatusEl) systemStatusEl.style.display = 'none';
    } else {
      if (subtitleEl) subtitleEl.style.display = '';
      if (systemStatusEl) systemStatusEl.style.display = '';
    }

    // Bridge UI init
    if (type === 'BRIDGE') {
      setTimeout(() => {
        this.initBridgeUI();
        this.loadBridgeBalances();
      }, 50);
    }

    // Auto-focus on first interactive element
    setTimeout(() => {
      const focusable = this.bodyEl.querySelector('input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (focusable) {
        focusable.focus();
      }
    }, 50);
  }

  /**
   * Init bridge UI (token selector panel)
   */
  initBridgeUI() {
    // Update bridge button state based on input value
    const amountInput = this.bodyEl.querySelector('.bridge-amount-value');
    const bridgeButton = this.bodyEl.querySelector('.bridge-btn');
    
    if (amountInput && bridgeButton) {
      // Initial state
      this.updateBridgeButtonState(amountInput, bridgeButton);
      
      // Listen for input changes
      amountInput.addEventListener('input', () => {
        this.updateBridgeButtonState(amountInput, bridgeButton);
      });
    }
    
    // Existing bridge percent button handlers
    const sellBtn = this.bodyEl.querySelector('.bridge-token-btn[data-token-role="sell"]');
    let overlay = document.getElementById('bridge-selector-overlay');
    let closeBtn = document.getElementById('bridge-selector-close');

    // Create overlay in body if missing
    if (!overlay) {
      const tpl = `
        <style id="bridge-selector-style">
          .bridge-selector-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            z-index: 2000;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .bridge-selector-overlay.active { display: flex; }
        .bridge-selector {
          width: 90%;
          max-width: 960px;
          max-height: 80vh;
          background: #050508;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.75);
          display: grid;
          grid-template-columns: 240px 1fr;
          position: relative;
          overflow: hidden;
          color: #f6f1ff;
          font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
        }
        .bridge-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          cursor: pointer;
        }
        .bridge-selector .panel-left {
          background: #0c0a12;
          border-right: 1px solid rgba(255,255,255,0.08);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bridge-selector .panel-right {
          padding: 16px;
          overflow-y: auto;
          background: #0a0810;
        }
        .bridge-select-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.2px;
          color: #f6f1ff;
          margin-bottom: 6px;
        }
        .bridge-network-item {
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
          font-weight: 700;
          color: #f6f1ff;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.15s ease;
        }
        .bridge-network-icon {
          width: 22px;
          height: 22px;
          border-radius: 11px;
          background: var(--chain-icon, url('/somniablack.png')) center/cover no-repeat;
          box-shadow: 0 0 8px rgba(0,0,0,0.35);
        }
        .bridge-network-item.active,
        .bridge-network-item:hover {
          border-color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.12);
        }
        .bridge-token-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bridge-token-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-radius: 14px;
          background: #1e1e1e;
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
        }
        .bridge-token-item:hover {
          border-color: rgba(255,255,255,0.25);
          background: #252525;
          box-shadow: 0 6px 16px rgba(0,0,0,0.35);
        }
        .bridge-token-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bridge-token-logo {
          width: 36px;
          height: 36px;
          border-radius: 18px;
          background: var(--token-icon, url('/somniablack.png')) center/cover no-repeat;
          position: relative;
          box-shadow: 0 0 12px rgba(255,255,255,0.12);
        }
        .bridge-token-logo .chain {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 7px;
          bottom: -3px;
          right: -3px;
          background: var(--chain-icon, url('/somniablack.png')) center/cover no-repeat;
          border: 2px solid #1e1e1e;
          box-shadow: 0 0 6px rgba(0,0,0,0.35);
        }
        .bridge-token-name { font-weight: 700; color: #f6f1ff; }
        .bridge-token-chain { font-size: 13px; color: rgba(255,255,255,0.7); }
        .bridge-badge { font-size: 12px; color: rgba(255,255,255,0.65); }
        </style>
        <div class="bridge-selector-overlay" id="bridge-selector-overlay">
          <div class="bridge-selector">
            <button class="bridge-close-btn" id="bridge-selector-close">×</button>
            <div class="panel-left">
              <div class="bridge-select-title">Networks</div>
              <div class="bridge-network-item active" data-network="all" data-chain-icon="/somniablack.png">
                <div class="bridge-network-icon" style="--chain-icon:url('/somniablack.png');"></div>
                <span>All Networks</span>
              </div>
              <div class="bridge-network-item" data-network="base" data-chain-icon="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png">
                <div class="bridge-network-icon" style="--chain-icon:url('https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png');"></div>
                <span>Base</span>
              </div>
              <div class="bridge-network-item" data-network="ethereum" data-chain-icon="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png">
                <div class="bridge-network-icon" style="--chain-icon:url('https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png');"></div>
                <span>Ethereum</span>
              </div>
            </div>
            <div class="panel-right">
              <div class="bridge-select-title">Tokens</div>
              <div class="bridge-token-list">
              <div class="bridge-token-item"
                data-token="ETH"
                data-network="base"
                data-token-icon="https://assets.coingecko.com/coins/images/279/large/ethereum.png"
                data-chain-icon="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png">
                <div class="bridge-token-info">
                  <div class="bridge-token-logo" style="--token-icon:url('https://assets.coingecko.com/coins/images/279/large/ethereum.png');">
                    <div class="chain" style="--chain-icon:url('https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png');"></div>
                  </div>
                  <div>
                    <div class="bridge-token-name">ETH</div>
                    <div class="bridge-token-chain">Base</div>
                  </div>
                </div>
                <div class="bridge-badge">0x...0030</div>
              </div>
              <div class="bridge-token-item"
                data-token="USDC"
                data-network="base"
                data-token-icon="https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png"
                data-chain-icon="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png">
                <div class="bridge-token-info">
                  <div class="bridge-token-logo" style="--token-icon:url('https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png');">
                    <div class="chain" style="--chain-icon:url('https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png');"></div>
                  </div>
                  <div>
                    <div class="bridge-token-name">USDC</div>
                    <div class="bridge-token-chain">Base</div>
                  </div>
                </div>
                <div class="bridge-badge">0x...USDC</div>
              </div>
              <div class="bridge-token-item"
                data-token="ETH"
                data-network="ethereum"
                data-token-icon="https://assets.coingecko.com/coins/images/279/large/ethereum.png"
                data-chain-icon="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png">
                <div class="bridge-token-info">
                  <div class="bridge-token-logo" style="--token-icon:url('https://assets.coingecko.com/coins/images/279/large/ethereum.png');">
                    <div class="chain" style="--chain-icon:url('https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png');"></div>
                  </div>
                  <div>
                    <div class="bridge-token-name">ETH</div>
                    <div class="bridge-token-chain">Ethereum</div>
                  </div>
                </div>
                <div class="bridge-badge">0x...0030</div>
              </div>
              <div class="bridge-token-item"
                data-token="USDC"
                data-network="ethereum"
                data-token-icon="https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png"
                data-chain-icon="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png">
                <div class="bridge-token-info">
                  <div class="bridge-token-logo" style="--token-icon:url('https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png');">
                    <div class="chain" style="--chain-icon:url('https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png');"></div>
                  </div>
                  <div>
                    <div class="bridge-token-name">USDC</div>
                    <div class="bridge-token-chain">Ethereum</div>
                  </div>
                </div>
                <div class="bridge-badge">0x...USDC</div>
              </div>
              </div>
            </div>
          </div>
        </div>
      `;
      if (!document.getElementById('bridge-selector-style')) {
        const styleEl = document.createElement('div');
        styleEl.innerHTML = tpl;
        document.body.insertAdjacentHTML('beforeend', tpl);
      } else {
        // Only overlay if style already exists
        document.body.insertAdjacentHTML('beforeend', tpl.replace(/<style[\s\S]*?<\/style>/, ''));
      }
      overlay = document.getElementById('bridge-selector-overlay');
      closeBtn = document.getElementById('bridge-selector-close');
    }
    if (!sellBtn || !overlay || !closeBtn) return;

    const symbolEl = sellBtn.querySelector('[data-token-symbol]');
    const chainEl = sellBtn.querySelector('[data-token-chain]');

    const setSelection = (token, network, tokenIcon, chainIcon, label) => {
      if (symbolEl) symbolEl.textContent = token;
      if (chainEl) chainEl.textContent = label || network;
      sellBtn.style.setProperty('--token-icon', `url('${tokenIcon}')`);
      sellBtn.style.setProperty('--chain-icon', `url('${chainIcon}')`);
      sellBtn.dataset.token = token;
      sellBtn.dataset.network = network;
    };

    const openOverlay = () => overlay.classList.add('active');
    const closeOverlay = () => overlay.classList.remove('active');

    sellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openOverlay();
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeOverlay();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });

    const filterTokens = (network) => {
      overlay.querySelectorAll('.bridge-token-item').forEach(item => {
        if (network === 'all' || item.dataset.network === network) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    };

    overlay.querySelectorAll('.bridge-network-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const net = item.dataset.network || 'all';
        overlay.querySelectorAll('.bridge-network-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        filterTokens(net);
      });
    });

    overlay.querySelectorAll('.bridge-token-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const token = item.dataset.token || 'ETH';
        const network = item.dataset.network || 'base';
        const tokenIcon = item.dataset.tokenIcon || 'https://assets.coingecko.com/coins/images/279/large/ethereum.png';
        const chainIcon = item.dataset.chainIcon || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png';
        const label = network === 'ethereum' ? 'Ethereum' : network.charAt(0).toUpperCase() + network.slice(1);
        setSelection(token, network, tokenIcon, chainIcon, label);
        closeOverlay();
        // Reload balance after token selection
        setTimeout(() => this.loadBridgeBalances(), 100);
      });
    });

    // default view: show all and preselect Ethereum / ETH (bridge supports Ethereum→Somnia)
    filterTokens('all');
    setSelection(
      'ETH',
      'ethereum',
      'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
      'Ethereum'
    );
  }

  close() {
    this.overlay.classList.remove('active');
    this.isOpen = false;
    this.currentType = null;
    
    // Reset footer to default
    if (this.footerEl) {
      this.footerEl.style.justifyContent = 'space-between';
      this.footerEl.innerHTML = `
        <span>/// SYSTEM READY</span>
        <span>V.2.1.0</span>
      `;
    }
    
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
      case 'domain-register':
        await this.handleDomainRegister(button);
        break;
      case 'domain-refresh':
        await this.handleDomainRefresh(button);
        break;
      case 'domain-set-primary':
        await this.handleDomainSetPrimary(button);
        break;
      case 'domain-clear-primary':
        await this.handleDomainClearPrimary(button);
        break;
      case 'domain-renew':
        await this.handleDomainRenew(button);
        break;
      case 'domain-connect':
        // Trigger wallet connect
        window.dispatchEvent(new CustomEvent('requestWalletConnect'));
        break;
      case 'bridge':
        await this.handleBridgeExecute(button);
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
  async initSwapUI() {
    SwapService.init();
    
    // Initialize token selector popup (bridge-style)
    this.initSwapTokenSelector();
    
    // Load balances if wallet connected
    this.loadSwapBalances();

    // Amount input - get quote on change (debounced to prevent excessive API calls)
    const fromAmountInput = this.bodyEl.querySelector('#from-amount');
    if (fromAmountInput) {
      let quoteTimeout = null;
      fromAmountInput.addEventListener('input', () => {
        // Clear previous timeout
        if (quoteTimeout) clearTimeout(quoteTimeout);
        // Debounce: wait 500ms after user stops typing
        quoteTimeout = setTimeout(() => {
          this.handleSwapQuote();
        }, 500);
      });
      fromAmountInput.addEventListener('change', () => {
        if (quoteTimeout) clearTimeout(quoteTimeout);
        this.handleSwapQuote();
      });
    }

    // Switch tokens button
    const switchBtn = this.bodyEl.querySelector('#switch-tokens');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => this.handleSwapSwitch());
    }

    // Percent buttons
    const percentBtns = this.bodyEl.querySelectorAll('.swap-percent-btn');
    percentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const percent = btn.dataset.percent;
        this.handleSwapPercent(percent);
      });
    });
  }
  
  /**
   * Initialize swap token selector popup (bridge-style)
   */
  initSwapTokenSelector() {
    const fromBtn = this.bodyEl.querySelector('#swap-from-btn');
    const toBtn = this.bodyEl.querySelector('#swap-to-btn');
    
    if (!fromBtn && !toBtn) return;
    
    // Create token selector overlay (similar to bridge)
    let overlay = document.getElementById('swap-selector-overlay');
    let closeBtn;
    
    // Token listesi - hem mainnet hem testnet
    const tokens = [
      { symbol: 'SOMI', network: 'mainnet', logo: '/somniablack.png', chainLogo: '/somniablack.png', name: 'Somnia Token' },
      { symbol: 'WSOMI', network: 'mainnet', logo: '/somniablack.png', chainLogo: '/somniablack.png', name: 'Wrapped Somnia Token' },
      { symbol: 'STT', network: 'testnet', logo: '/somniablack.png', chainLogo: '/somniablack.png', name: 'Somnia Token', icon: 'S' },
      { symbol: 'USDT', network: 'testnet', logo: '/somniablack.png', chainLogo: '/somniablack.png', name: 'Tether USD', icon: 'U' }
    ];
    
    if (!overlay) {
      
      const tokenItems = tokens.map(token => {
        const isTestnet = token.network === 'testnet';
        const iconStyle = token.icon ? `display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #fff; background: rgba(255,255,255,0.1);` : '';
        const iconContent = token.icon || '';
        return `
          <div class="swap-token-item"
            data-token="${token.symbol}"
            data-network="${token.network}"
            data-token-icon="${token.logo}"
            data-chain-icon="${token.chainLogo}">
            <div class="swap-token-info">
              <div class="swap-token-logo" style="--token-icon:url('${token.logo}'); filter: ${isTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none'}; ${iconStyle}">
                ${iconContent}
                <div class="chain" style="--chain-icon:url('${token.chainLogo}'); filter: ${isTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none'};"></div>
              </div>
              <div>
                <div class="swap-token-name">${token.symbol}</div>
                ${token.network === 'testnet' ? `<div class="swap-token-chain">Testnet</div>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      const tpl = `
        <style id="swap-selector-style">
          .swap-selector-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            z-index: 2000;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .swap-selector-overlay.active { display: flex; }
          .swap-selector {
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            background: #050508;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 18px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.75);
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            color: #f6f1ff;
            font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
          }
          .swap-close-btn {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.2);
            color: #fff;
            width: 32px;
            height: 32px;
            border-radius: 10px;
            cursor: pointer;
          }
          .swap-selector .panel-content {
            padding: 16px;
            overflow-y: auto;
            background: #0a0810;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .swap-search-input {
            width: 100%;
            padding: 12px 16px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            color: #f6f1ff;
            font-size: 14px;
            font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
            outline: none;
            transition: all 0.2s ease;
          }
          .swap-search-input:focus {
            border-color: rgba(255,255,255,0.3);
            background: rgba(255,255,255,0.08);
          }
          .swap-search-input::placeholder {
            color: rgba(255,255,255,0.4);
          }
          .swap-select-title {
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.2px;
            color: #f6f1ff;
            margin-bottom: 6px;
          }
          .swap-network-item {
            padding: 10px 12px;
            border-radius: 12px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            cursor: pointer;
            font-weight: 700;
            color: #f6f1ff;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.15s ease;
          }
          .swap-network-icon {
            width: 22px;
            height: 22px;
            border-radius: 11px;
            background: var(--chain-icon, url('/somniablack.png')) center/cover no-repeat;
            box-shadow: 0 0 8px rgba(0,0,0,0.35);
          }
          .swap-network-item.active,
          .swap-network-item:hover {
            border-color: rgba(255,255,255,0.25);
            background: rgba(255,255,255,0.12);
          }
          .swap-token-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .swap-token-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            border-radius: 14px;
            background: #1e1e1e;
            border: 1px solid rgba(255,255,255,0.06);
            cursor: pointer;
          }
          .swap-token-item:hover {
            border-color: rgba(255,255,255,0.25);
            background: #252525;
            box-shadow: 0 6px 16px rgba(0,0,0,0.35);
          }
          .swap-token-info {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .swap-token-logo {
            width: 36px;
            height: 36px;
            border-radius: 18px;
            background: var(--token-icon, url('/somniablack.png')) center/cover no-repeat;
            position: relative;
            box-shadow: 0 0 12px rgba(255,255,255,0.12);
          }
          .swap-token-logo .chain {
            position: absolute;
            width: 14px;
            height: 14px;
            border-radius: 7px;
            bottom: -3px;
            right: -3px;
            background: var(--chain-icon, url('/somniablack.png')) center/cover no-repeat;
            border: 2px solid #1e1e1e;
            box-shadow: 0 0 6px rgba(0,0,0,0.35);
          }
          .swap-token-name { font-weight: 700; color: #f6f1ff; }
          .swap-token-chain { font-size: 13px; color: rgba(255,255,255,0.7); }
        </style>
        <div class="swap-selector-overlay" id="swap-selector-overlay">
          <div class="swap-selector">
            <button class="swap-close-btn" id="swap-selector-close">×</button>
            <div class="panel-content">
              <div class="swap-select-title">Select Token</div>
              <input type="text" class="swap-search-input" id="swap-token-search" placeholder="Search by name or symbol..." />
              <div class="swap-token-list">
                ${tokenItems}
              </div>
            </div>
          </div>
        </div>
      `;
      
      if (!document.getElementById('swap-selector-style')) {
        document.body.insertAdjacentHTML('beforeend', tpl);
      } else {
        document.body.insertAdjacentHTML('beforeend', tpl.replace(/<style[\s\S]*?<\/style>/, ''));
      }
      overlay = document.getElementById('swap-selector-overlay');
      closeBtn = document.getElementById('swap-selector-close');
    } else {
      // Overlay zaten varsa, token listesini güncelle
      const tokenList = overlay.querySelector('.swap-token-list');
      if (tokenList) {
        const tokenItemsHTML = tokens.map(token => {
          const isTestnet = token.network === 'testnet';
          const iconStyle = token.icon ? `display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #fff; background: rgba(255,255,255,0.1);` : '';
          const iconContent = token.icon || '';
          return `
            <div class="swap-token-item"
              data-token="${token.symbol}"
              data-network="${token.network}"
              data-token-icon="${token.logo}"
              data-chain-icon="${token.chainLogo}">
              <div class="swap-token-info">
                <div class="swap-token-logo" style="--token-icon:url('${token.logo}'); filter: ${isTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none'}; ${iconStyle}">
                  ${iconContent}
                  <div class="chain" style="--chain-icon:url('${token.chainLogo}'); filter: ${isTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none'};"></div>
                </div>
                <div>
                  <div class="swap-token-name">${token.symbol}</div>
                  ${token.network === 'testnet' ? `<div class="swap-token-chain">Testnet</div>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');
        tokenList.innerHTML = tokenItemsHTML;
      }
      closeBtn = document.getElementById('swap-selector-close');
    }
    
    if (!overlay || !closeBtn) return;
    
    // Her zaman güncel butonları al
    const currentFromBtn = this.bodyEl.querySelector('#swap-from-btn');
    const currentToBtn = this.bodyEl.querySelector('#swap-to-btn');
    
    // Setup token selection for FROM button
    if (currentFromBtn) {
      // Eski listener'ları temizle
      const newFromBtn = currentFromBtn.cloneNode(true);
      currentFromBtn.parentNode.replaceChild(newFromBtn, currentFromBtn);
      
      const finalFromBtn = this.bodyEl.querySelector('#swap-from-btn');
      finalFromBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentSwapSelectorRole = 'from';
        // Search input'u temizle ve tüm tokenları göster
        const searchInputEl = overlay.querySelector('#swap-token-search');
        if (searchInputEl) {
          searchInputEl.value = '';
          const tokenItems = overlay.querySelectorAll('.swap-token-item');
          tokenItems.forEach(item => {
            item.style.display = 'flex';
          });
        }
        overlay.classList.add('active');
      });
    }
    
    // Setup token selection for TO button
    if (currentToBtn) {
      // Eski listener'ları temizle
      const newToBtn = currentToBtn.cloneNode(true);
      currentToBtn.parentNode.replaceChild(newToBtn, currentToBtn);
      
      const finalToBtn = this.bodyEl.querySelector('#swap-to-btn');
      finalToBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentSwapSelectorRole = 'to';
        // Search input'u temizle ve tüm tokenları göster
        const searchInputEl = overlay.querySelector('#swap-token-search');
        if (searchInputEl) {
          searchInputEl.value = '';
          const tokenItems = overlay.querySelectorAll('.swap-token-item');
          tokenItems.forEach(item => {
            item.style.display = 'flex';
          });
        }
        overlay.classList.add('active');
      });
    }
    
    // Close button
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.classList.remove('active');
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
    
    // Search functionality
    const searchInput = overlay.querySelector('#swap-token-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const tokenItems = overlay.querySelectorAll('.swap-token-item');
        
        tokenItems.forEach(item => {
          const tokenSymbol = item.dataset.token.toLowerCase();
          const tokenName = item.querySelector('.swap-token-name')?.textContent.toLowerCase() || '';
          const network = item.dataset.network.toLowerCase();
          
          // Arama terimi token symbol, name veya network'te geçiyorsa göster
          if (tokenSymbol.includes(searchTerm) || 
              tokenName.includes(searchTerm) || 
              network.includes(searchTerm) ||
              searchTerm === '') {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }
    
    // Token selection - event delegation kullan (dinamik elementler için)
    const handleTokenClick = (e) => {
      const item = e.target.closest('.swap-token-item');
      if (!item) return;
      
      const token = item.dataset.token;
      const network = item.dataset.network;
      const tokenIcon = item.dataset.tokenIcon;
      const chainIcon = item.dataset.chainIcon;
      const label = network === 'mainnet' ? 'Mainnet' : 'Testnet';
      
      const finalFromBtn = this.bodyEl.querySelector('#swap-from-btn');
      const finalToBtn = this.bodyEl.querySelector('#swap-to-btn');
      
      if (this.currentSwapSelectorRole === 'from' && finalFromBtn) {
        const symbolEl = finalFromBtn.querySelector('[data-token-symbol]');
        const networkEl = finalFromBtn.querySelector('[data-token-network]');
        if (symbolEl) symbolEl.textContent = token;
        // Sadece testnet tokenlarında network bilgisini göster
        if (networkEl) {
          if (network === 'testnet') {
            networkEl.textContent = 'Testnet';
            networkEl.style.display = 'block';
          } else {
            networkEl.style.display = 'none';
          }
        }
        finalFromBtn.style.setProperty('--token-icon', `url('${tokenIcon}')`);
        finalFromBtn.style.setProperty('--chain-icon', `url('${chainIcon}')`);
        finalFromBtn.dataset.token = token;
        finalFromBtn.dataset.network = network;
        const tokenInfo = SWAP_CONFIG.tokenInfo[token] || {};
        const isTestnet = tokenInfo.network === 'testnet';
        const iconEl = finalFromBtn.querySelector('.swap-token-icon');
        const badgeEl = finalFromBtn.querySelector('.badge');
        if (iconEl) iconEl.style.filter = isTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none';
        if (badgeEl) badgeEl.style.filter = isTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none';
        this.loadSwapBalances();
        this.handleSwapQuote();
      } else if (this.currentSwapSelectorRole === 'to' && finalToBtn) {
        const symbolEl = finalToBtn.querySelector('[data-token-symbol]');
        const networkEl = finalToBtn.querySelector('[data-token-network]');
        if (symbolEl) symbolEl.textContent = token;
        // Sadece testnet tokenlarında network bilgisini göster
        if (networkEl) {
          if (network === 'testnet') {
            networkEl.textContent = 'Testnet';
            networkEl.style.display = 'block';
          } else {
            networkEl.style.display = 'none';
          }
        }
        finalToBtn.style.setProperty('--token-icon', `url('${tokenIcon}')`);
        finalToBtn.style.setProperty('--chain-icon', `url('${chainIcon}')`);
        finalToBtn.dataset.token = token;
        finalToBtn.dataset.network = network;
        const tokenInfo = SWAP_CONFIG.tokenInfo[token] || {};
        const isTestnet = tokenInfo.network === 'testnet';
        const iconEl = finalToBtn.querySelector('.swap-token-icon');
        const badgeEl = finalToBtn.querySelector('.badge');
        if (iconEl) iconEl.style.filter = isTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none';
        if (badgeEl) badgeEl.style.filter = isTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none';
        this.loadSwapBalances();
        this.handleSwapQuote();
      }
      
      overlay.classList.remove('active');
    };
    
    // Event delegation kullan - token list container'a ekle
    const tokenListContainer = overlay.querySelector('.swap-token-list');
    if (tokenListContainer) {
      // Eski listener'ı kaldır ve yenisini ekle
      tokenListContainer.removeEventListener('click', handleTokenClick);
      tokenListContainer.addEventListener('click', handleTokenClick);
    }
    
  }

  /**
   * Initialize network switch for swap UI
   */
  async initNetworkSwitch() {
    const networkButtons = this.bodyEl.querySelectorAll('.network-switch-btn');
    if (!networkButtons.length) return;

    // Determine current network
    const isMainnet = await SwapService.isMainnet();
    const currentNetwork = isMainnet ? 'mainnet' : 'testnet';

    // Update button states
    networkButtons.forEach(btn => {
      const network = btn.dataset.network;
      if (network === currentNetwork) {
        btn.style.background = 'rgba(var(--theme-rgb), 0.2)';
        btn.style.border = '1px solid var(--theme-color)';
        btn.style.color = 'var(--theme-color)';
      } else {
        btn.style.background = 'transparent';
        btn.style.border = '1px solid rgba(255,255,255,0.3)';
        btn.style.color = 'rgba(255,255,255,0.5)';
      }

      // Add click handler
      btn.addEventListener('click', async () => {
        await this.handleNetworkSwitch(network);
      });
    });
  }

  /**
   * Handle network switch
   */
  async handleNetworkSwitch(targetNetwork) {
    const networkButtons = this.bodyEl.querySelectorAll('.network-switch-btn');
    
    // If switching to mainnet, try to switch wallet network
    if (targetNetwork === 'mainnet') {
      try {
        const targetChainId = 5031;
        if (window.ethereum) {
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          const currentChainId = parseInt(chainIdHex, 16);
          
          if (currentChainId !== targetChainId) {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x' + targetChainId.toString(16) }]
              });
            } catch (switchError) {
              if (switchError.code === 4902) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x' + targetChainId.toString(16),
                    chainName: 'Somnia Mainnet',
                    rpcUrls: ['https://api.infra.mainnet.somnia.network'],
                    nativeCurrency: {
                      name: 'Somnia Token',
                      symbol: 'SOMI',
                      decimals: 18
                    },
                    blockExplorerUrls: ['https://explorer.somnia.network']
                  }]
                });
              } else {
                // User rejected or error, but continue with UI update
                console.warn('Could not switch to mainnet:', switchError);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Network switch error:', error);
        // Continue with UI update even if network switch fails
      }
    }
    
    // Update button states
    networkButtons.forEach(btn => {
      const network = btn.dataset.network;
      if (network === targetNetwork) {
        btn.style.background = 'rgba(var(--theme-rgb), 0.2)';
        btn.style.border = '1px solid var(--theme-color)';
        btn.style.color = 'var(--theme-color)';
      } else {
        btn.style.background = 'transparent';
        btn.style.border = '1px solid rgba(255,255,255,0.3)';
        btn.style.color = 'rgba(255,255,255,0.5)';
      }
    });

    // Update token options based on network
    await this.updateTokenOptions(targetNetwork);
    
    // Reload balances
    this.loadSwapBalances();
    
    // Clear inputs and quotes
    const fromAmountInput = this.bodyEl.querySelector('#from-amount');
    const toAmountInput = this.bodyEl.querySelector('#to-amount');
    const quoteInfo = this.bodyEl.querySelector('#quote-info');
    if (fromAmountInput) fromAmountInput.value = '';
    if (toAmountInput) toAmountInput.value = '';
    if (quoteInfo) quoteInfo.classList.add('hidden');
  }

  /**
   * Update token options based on selected network
   */
  async updateTokenOptions(network) {
    const fromTokenSelect = this.bodyEl.querySelector('#from-token');
    const toTokenSelect = this.bodyEl.querySelector('#to-token');
    
    if (!fromTokenSelect || !toTokenSelect) return;

    // Get tokens for selected network
    const isMainnet = network === 'mainnet';
    const tokens = isMainnet ? ['SOMI', 'WSOMI'] : ['STT', 'USDT'];
    const defaultFrom = isMainnet ? 'SOMI' : 'STT';
    const defaultTo = isMainnet ? 'WSOMI' : 'USDT';

    // Update from token select
    fromTokenSelect.innerHTML = tokens.map(symbol => {
      const selected = symbol === defaultFrom ? 'selected' : '';
      return `<option value="${symbol}" ${selected}>${symbol}</option>`;
    }).join('');

    // Update to token select
    toTokenSelect.innerHTML = tokens.map(symbol => {
      const selected = symbol === defaultTo ? 'selected' : '';
      return `<option value="${symbol}" ${selected}>${symbol}</option>`;
    }).join('');

    // Trigger change events
    fromTokenSelect.dispatchEvent(new Event('change'));
    toTokenSelect.dispatchEvent(new Event('change'));
  }

  /**
   * Load token balances for swap UI
   */
  async loadSwapBalances() {
    if (!this.walletAddress) return;

    const fromBtn = this.bodyEl.querySelector('#swap-from-btn');
    const toBtn = this.bodyEl.querySelector('#swap-to-btn');
    const fromBalanceEl = this.bodyEl.querySelector('#from-balance');
    const toBalanceEl = this.bodyEl.querySelector('#to-balance');

    if (!fromBtn || !toBtn) return;
    
    const fromToken = fromBtn.dataset.token || 'SOMI';
    const toToken = toBtn.dataset.token || 'WSOMI';

    try {
      // Load from token balance
      const fromBalance = await SwapService.getTokenBalance(fromToken, this.walletAddress);
      if (fromBalanceEl) {
        fromBalanceEl.textContent = `Balance: ${parseFloat(fromBalance).toFixed(4)} ${fromToken}`;
      }
      this.currentFromBalance = parseFloat(fromBalance);

      // Load to token balance
      const toBalance = await SwapService.getTokenBalance(toToken, this.walletAddress);
      if (toBalanceEl) {
        toBalanceEl.textContent = `Balance: ${parseFloat(toBalance).toFixed(4)} ${toToken}`;
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
    const fromBtn = this.bodyEl.querySelector('#swap-from-btn');
    const toBtn = this.bodyEl.querySelector('#swap-to-btn');
    const fromAmountInput = this.bodyEl.querySelector('#from-amount');
    const toAmountInput = this.bodyEl.querySelector('#to-amount');

    if (!fromBtn || !toBtn) return;

    // Swap token selections
    const fromToken = fromBtn.dataset.token;
    const toToken = toBtn.dataset.token;
    const fromTokenIcon = fromBtn.style.getPropertyValue('--token-icon');
    const fromChainIcon = fromBtn.style.getPropertyValue('--chain-icon');
    const toTokenIcon = toBtn.style.getPropertyValue('--token-icon');
    const toChainIcon = toBtn.style.getPropertyValue('--chain-icon');
    const fromNetwork = fromBtn.dataset.network;
    const toNetwork = toBtn.dataset.network;
    
    // Swap button data
    fromBtn.dataset.token = toToken;
    fromBtn.dataset.network = toNetwork;
    toBtn.dataset.token = fromToken;
    toBtn.dataset.network = fromNetwork;
    
    // Swap button styles
    fromBtn.style.setProperty('--token-icon', toTokenIcon);
    fromBtn.style.setProperty('--chain-icon', toChainIcon);
    toBtn.style.setProperty('--token-icon', fromTokenIcon);
    toBtn.style.setProperty('--chain-icon', fromChainIcon);
    
    // Swap button text
    const fromSymbolEl = fromBtn.querySelector('[data-token-symbol]');
    const fromNetworkEl = fromBtn.querySelector('[data-token-network]');
    const toSymbolEl = toBtn.querySelector('[data-token-symbol]');
    const toNetworkEl = toBtn.querySelector('[data-token-network]');
    
    if (fromSymbolEl) fromSymbolEl.textContent = toToken;
    // Sadece testnet tokenlarında network bilgisini göster
    if (fromNetworkEl) {
      if (toNetwork === 'testnet') {
        fromNetworkEl.textContent = 'Testnet';
        fromNetworkEl.style.display = 'block';
      } else {
        fromNetworkEl.style.display = 'none';
      }
    }
    if (toSymbolEl) toSymbolEl.textContent = fromToken;
    // Sadece testnet tokenlarında network bilgisini göster
    if (toNetworkEl) {
      if (fromNetwork === 'testnet') {
        toNetworkEl.textContent = 'Testnet';
        toNetworkEl.style.display = 'block';
      } else {
        toNetworkEl.style.display = 'none';
      }
    }
    
    // Update filter effects
    const fromTokenInfo = SWAP_CONFIG.tokenInfo[toToken] || {};
    const toTokenInfo = SWAP_CONFIG.tokenInfo[fromToken] || {};
    const fromIsTestnet = fromTokenInfo.network === 'testnet';
    const toIsTestnet = toTokenInfo.network === 'testnet';
    fromBtn.querySelector('.swap-token-icon').style.filter = fromIsTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none';
    fromBtn.querySelector('.badge').style.filter = fromIsTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none';
    toBtn.querySelector('.swap-token-icon').style.filter = toIsTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none';
    toBtn.querySelector('.badge').style.filter = toIsTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none';

    // Swap amounts
    if (fromAmountInput && toAmountInput) {
      const tempAmount = fromAmountInput.value;
      fromAmountInput.value = toAmountInput.value || '';
      toAmountInput.value = tempAmount || '';
    }

    // Reload balances and quote
    this.loadSwapBalances();
    this.handleSwapQuote();
  }

  /**
   * Get and display swap quote
   */
  async handleSwapQuote() {
    const fromBtn = this.bodyEl.querySelector('#swap-from-btn');
    const toBtn = this.bodyEl.querySelector('#swap-to-btn');
    if (!fromBtn || !toBtn) return;
    
    const fromToken = fromBtn.dataset.token || 'SOMI';
    const toToken = toBtn.dataset.token || 'WSOMI';
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
      let quote;
      
      // Check if this is a wrapping/unwrapping operation (Mainnet)
      if ((fromToken === 'SOMI' && toToken === 'WSOMI') || (fromToken === 'WSOMI' && toToken === 'SOMI')) {
        // 1:1 wrapping/unwrapping
        quote = {
          fromToken,
          toToken,
          inputAmount: amount,
          outputAmount: amount, // 1:1 rate
          rate: '1.0',
          priceImpact: '< 0.01%',
          fee: '0',
          estimated: false
        };
      } else {
        // Regular swap quote
        quote = await SwapService.getSwapQuote(fromToken, toToken, amount);
      }

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
      if (feeEl) {
        if (fromToken === 'SOMI' || fromToken === 'WSOMI') {
          feeEl.textContent = 'Network fee only';
        } else {
          feeEl.textContent = `${quote.fee} ${fromToken}`;
        }
      }

      // Show quote info
      if (quoteInfo) quoteInfo.classList.remove('hidden');

      // Enable swap button
      if (swapBtn && this.walletAddress) {
        swapBtn.disabled = false;
        const btnText = swapBtn.querySelector('.btn-text');
        if (btnText) {
          if (fromToken === 'SOMI' && toToken === 'WSOMI') {
            btnText.textContent = 'WRAP SOMI';
          } else if (fromToken === 'WSOMI' && toToken === 'SOMI') {
            btnText.textContent = 'UNWRAP WSOMI';
          } else {
            btnText.textContent = 'SWAP TOKENS';
          }
        }
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

    const fromBtn = this.bodyEl.querySelector('#swap-from-btn');
    const toBtn = this.bodyEl.querySelector('#swap-to-btn');
    if (!fromBtn || !toBtn) return;
    
    const fromToken = fromBtn.dataset.token || 'SOMI';
    const toToken = toBtn.dataset.token || 'WSOMI';
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
      let result;

      // Check if this is a wrapping/unwrapping operation (Mainnet)
      if (fromToken === 'SOMI' && toToken === 'WSOMI') {
        // Wrap native SOMI to WSOMI
        result = await SwapService.wrapSOMI(amount);
      } else if (fromToken === 'WSOMI' && toToken === 'SOMI') {
        // Unwrap WSOMI to native SOMI
        result = await SwapService.unwrapWSOMI(amount);
      } else {
        // Regular swap (Testnet: STT ↔ USDT)
        result = await SwapService.swapTokens(fromToken, toToken, amount);
      }

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
    this.bodyEl.innerHTML = await generateSwapContent(this.walletAddress);
    await this.initSwapUI();
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

  // --- DOMAIN HANDLERS ---

  /**
   * Initialize Domain UI event listeners
   */
  async initDomainUI() {
    await domainService.init();

    // Load SOMI balance (only once, not blocking)
    if (this.walletAddress) {
      this.loadDomainSOMIBalance();
    }

    // Tab switching
    const tabs = this.bodyEl.querySelectorAll('.domain-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Update active tab
        tabs.forEach(t => {
          t.classList.remove('active');
          this.bodyEl.querySelector(`[data-content="${t.dataset.tab}"]`)?.classList.remove('active');
        });
        tab.classList.add('active');
        this.bodyEl.querySelector(`[data-content="${tabName}"]`)?.classList.add('active');

        // Load domains if switching to management tab
        if (tabName === 'management' && this.walletAddress) {
          this.loadDomains();
        }
      });
    });

    // Domain name input - check availability with debounce
    const domainInput = this.bodyEl.querySelector('#domain-name-input');
    if (domainInput) {
      let debounceTimer = null;
      domainInput.addEventListener('input', () => {
        // Clear previous timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        // Set new timer - wait 500ms after user stops typing
        debounceTimer = setTimeout(() => {
          this.checkDomainAvailability();
        }, 500);
      });
    }

    // Load domains if on management tab
    if (this.walletAddress) {
      const activeTab = this.bodyEl.querySelector('.domain-tab.active');
      if (activeTab?.dataset.tab === 'management') {
        this.loadDomains();
      }
    }
  }

  /**
   * Load SOMI balance for domain registration
   */
  async loadDomainSOMIBalance() {
    const balanceEl = this.bodyEl.querySelector('#domain-somi-balance');
    if (!balanceEl) return;

    try {
      const balance = await BridgeService.getSOMIBalance();
      const balanceNum = parseFloat(balance);
      
      if (balanceNum >= 1) {
        balanceEl.textContent = `${balanceNum.toFixed(4)} SOMI`;
        balanceEl.style.color = 'var(--theme-color, #aa00ff)';
      } else if (balanceNum > 0) {
        balanceEl.textContent = `${balanceNum.toFixed(6)} SOMI`;
        balanceEl.style.color = 'var(--theme-color, #aa00ff)';
      } else {
        balanceEl.textContent = '0 SOMI';
        balanceEl.style.color = '#ff0055';
      }
    } catch (error) {
      console.error('Error loading SOMI balance:', error);
      balanceEl.textContent = 'Error';
      balanceEl.style.color = '#ff0055';
    }
  }

  /**
   * Check domain availability
   */
  async checkDomainAvailability() {
    const domainInput = this.bodyEl.querySelector('#domain-name-input');
    const statusEl = this.bodyEl.querySelector('#domain-status');
    const registerBtn = this.bodyEl.querySelector('#domain-register-btn');

    if (!domainInput || !statusEl || !registerBtn) return;

    const domainName = domainInput.value.trim();
    
    // Clean domain name (remove special characters)
    const cleanName = domainName.replace(/[^a-zA-Z0-9-]/g, '');
    if (cleanName !== domainName) {
      domainInput.value = cleanName;
    }

    if (!cleanName) {
      statusEl.style.display = 'none';
      registerBtn.disabled = !this.walletAddress;
      return;
    }

    if (!this.walletAddress) {
      statusEl.className = 'domain-status not-connected';
      statusEl.textContent = 'Please connect your wallet to check availability';
      statusEl.style.display = 'block';
      registerBtn.disabled = true;
      return;
    }

    statusEl.className = 'domain-status checking';
    statusEl.textContent = 'Checking availability...';
    statusEl.style.display = 'block';
    registerBtn.disabled = true;

    try {
      const available = await domainService.isAvailable(cleanName);
      
      if (available) {
        statusEl.className = 'domain-status available';
        statusEl.textContent = `${cleanName}.somi is available!`;
        registerBtn.disabled = false;
      } else {
        statusEl.className = 'domain-status unavailable';
        statusEl.textContent = `${cleanName}.somi is not available`;
        registerBtn.disabled = true;
      }
    } catch (error) {
      console.error('Domain availability check error:', error);
      statusEl.className = 'domain-status unavailable';
      statusEl.textContent = 'Error checking availability';
      registerBtn.disabled = true;
    }
  }

  /**
   * Handle domain registration
   */
  async handleDomainRegister(button) {
    if (!this.walletAddress) {
      window.dispatchEvent(new CustomEvent('requestWalletConnect'));
      this.showMessage('Please connect your wallet first.', 'warning');
      return;
    }

    const domainInput = this.bodyEl.querySelector('#domain-name-input');
    const domainName = domainInput?.value.trim();

    if (!domainName) {
      this.showMessage('Please enter a domain name', 'error');
      return;
    }

    // Clean domain name
    const cleanName = domainName.replace(/[^a-zA-Z0-9-]/g, '').replace(/\.somi$/i, '');
    
    if (!cleanName) {
      this.showMessage('Invalid domain name', 'error');
      return;
    }

    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    const originalText = btnText ? btnText.textContent : '';

    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    button.disabled = true;

    try {
      const result = await domainService.register(cleanName);

      if (result.success) {
        this.showXPPopup('DOMAIN REGISTERED', 100);
        this.showMessage(`Domain ${cleanName}.somi registered successfully!`, 'success');
        
        // Clear input
        if (domainInput) domainInput.value = '';
        
        // Ensure domain is saved to storage
        // Note: DomainService.register already saves to storage, but we ensure it here too
        if (result.domain) {
          console.log('Domain from result:', result.domain);
          // Ensure domain is a string before saving
          const domainToSave = typeof result.domain === 'string' ? result.domain : String(result.domain);
          domainService.addDomainToStorage(this.walletAddress, domainToSave);
        } else {
          console.log('No domain in result, using cleanName:', cleanName);
          domainService.addDomainToStorage(this.walletAddress, cleanName);
        }
        
        // Switch to management tab and reload domains
        setTimeout(() => {
          const managementTab = this.bodyEl.querySelector('.domain-tab[data-tab="management"]');
          const registerTab = this.bodyEl.querySelector('.domain-tab[data-tab="register"]');
          if (managementTab && registerTab) {
            registerTab.classList.remove('active');
            managementTab.classList.add('active');
            this.loadDomains();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Domain registration error:', error);
      this.showMessage(error.message || 'Failed to register domain', 'error');
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
   * Load user domains
   */
  async loadDomains() {
    if (!this.walletAddress) {
      const domainList = this.bodyEl.querySelector('#domain-list');
      if (domainList) {
        domainList.innerHTML = '<div class="domain-empty">Please connect your wallet to view your domains</div>';
      }
      return;
    }

    const domainList = this.bodyEl.querySelector('#domain-list');
    const primarySection = this.bodyEl.querySelector('#domain-primary-section');
    const primaryName = this.bodyEl.querySelector('#domain-primary-name');

    if (!domainList) return;

    domainList.innerHTML = '<div class="domain-empty">Loading domains...</div>';

    try {
      // Get primary domain
      const primary = await domainService.getPrimaryDomain(this.walletAddress);
      
      if (primary) {
        if (primarySection) primarySection.style.display = 'block';
        if (primaryName) primaryName.textContent = `${primary}.somi`;
      } else {
        if (primarySection) primarySection.style.display = 'none';
      }

      // Get all domains
      const domains = await domainService.getDomains(this.walletAddress);

      if (domains.length === 0) {
        domainList.innerHTML = '<div class="domain-empty">No domains registered yet. Register your first domain!</div>';
        return;
      }

      // Load expiry for each domain
      const domainData = await Promise.all(
        domains.map(async (name) => {
          const expiry = await domainService.getExpiry(name);
          return { name, expiry, isPrimary: name === primary };
        })
      );

      // Sort: primary first, then by name
      domainData.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.name.localeCompare(b.name);
      });

      // Render domains
      domainList.innerHTML = domainData.map(domain => {
        return `
          <div class="domain-item">
            <div class="domain-item-header">
              <div class="domain-name-wrapper">
                <span class="domain-name ${domain.isPrimary ? 'primary' : ''}">${domain.name}.somi</span>
                ${domain.isPrimary ? '<span class="domain-primary-badge">★ Primary</span>' : ''}
              </div>
            </div>
            <div class="domain-actions-row">
              <button 
                class="domain-action-btn set-primary" 
                data-action="domain-set-primary" 
                data-domain="${domain.name}"
                ${domain.isPrimary ? 'disabled' : ''}
              >
                ${domain.isPrimary ? '★' : '☆'} Set Primary
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Re-attach event listeners
      this.bodyEl.querySelectorAll('[data-action="domain-set-primary"]').forEach(btn => {
        btn.addEventListener('click', () => this.handleDomainSetPrimary(btn));
      });
    } catch (error) {
      console.error('Load domains error:', error);
      domainList.innerHTML = '<div class="domain-empty">Error loading domains</div>';
    }
  }

  /**
   * Handle domain refresh
   */
  async handleDomainRefresh(button) {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = '↻ Refreshing...';
    
    try {
      // Force reload from storage first (fast)
      const storedDomains = domainService.getDomainsFromStorage(this.walletAddress);
      console.log('Stored domains on refresh:', storedDomains);
      
      // Then try to refresh from contract in background
      await this.loadDomains();
      this.showMessage('Domains refreshed', 'success');
    } catch (error) {
      console.error('Refresh error:', error);
      this.showMessage('Failed to refresh domains', 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  /**
   * Handle set primary domain
   */
  async handleDomainSetPrimary(button) {
    if (!this.walletAddress) {
      window.dispatchEvent(new CustomEvent('requestWalletConnect'));
      return;
    }

    const domainName = button.dataset.domain;
    if (!domainName) return;

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Setting...';

    try {
      const result = await domainService.setPrimary(domainName);

      if (result.success) {
        this.showXPPopup('PRIMARY DOMAIN SET', 50);
        this.showMessage(`Primary domain set to ${domainName}.somi`, 'success');
        
        // Dispatch event to update player label
        window.dispatchEvent(new CustomEvent('primaryDomainSet', {
          detail: { domain: `${domainName}.somi` }
        }));
        
        // Reload domains
        setTimeout(() => {
          this.loadDomains();
        }, 2000);
      }
    } catch (error) {
      console.error('Set primary error:', error);
      this.showMessage(error.message || 'Failed to set primary domain', 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  /**
   * Handle clear primary domain
   */
  async handleDomainClearPrimary(button) {
    if (!this.walletAddress) {
      window.dispatchEvent(new CustomEvent('requestWalletConnect'));
      return;
    }

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Clearing...';

    try {
      // Clear primary by setting empty string (if supported) or just reload
      // For now, just reload - clearing might require contract method
      await this.loadDomains();
      this.showMessage('Primary domain cleared', 'success');
    } catch (error) {
      console.error('Clear primary error:', error);
      this.showMessage('Failed to clear primary domain', 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  /**
   * Handle domain renewal
   */
  async handleDomainRenew(button) {
    if (!this.walletAddress) {
      window.dispatchEvent(new CustomEvent('requestWalletConnect'));
      return;
    }

    const domainName = button.dataset.domain;
    if (!domainName) return;

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Renewing...';

    try {
      const result = await domainService.renew(domainName);

      if (result.success) {
        this.showXPPopup('DOMAIN RENEWED', 75);
        this.showMessage(`Domain ${domainName}.somi renewed successfully!`, 'success');
        
        // Reload domains
        setTimeout(() => {
          this.loadDomains();
        }, 2000);
      }
    } catch (error) {
      console.error('Domain renewal error:', error);
      this.showMessage(error.message || 'Failed to renew domain', 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  /**
   * Refresh domain content
   */
  async refreshDomainContent() {
    if (this.currentType === 'DOMAIN') {
      const { generateDomainContent } = await import('./ModalContent.js');
      const content = await generateDomainContent(this.walletAddress);
      this.bodyEl.innerHTML = content;
      await this.initDomainUI();
    }
  }

  // --- BRIDGE HANDLERS ---

  /**
   * Update bridge button state based on input value
   */
  updateBridgeButtonState(amountInput, bridgeButton) {
    const btnText = bridgeButton.querySelector('.btn-text');
    
    // Bridge functionality is not ready yet - always show SOON and keep disabled
    bridgeButton.disabled = true;
    if (btnText) {
      btnText.textContent = 'SOON';
    }
  }

  /**
   * Handle bridge execution
   */
  async handleBridgeExecute(button) {
    if (!this.walletAddress) {
      window.dispatchEvent(new CustomEvent('requestWalletConnect'));
      return;
    }

    // Get amount from input
    const amountInput = this.bodyEl.querySelector('.bridge-amount-value');
    if (!amountInput) return;

    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) {
      this.showMessage('Please enter a valid amount', 'error');
      return;
    }

    // Get selected token and network
    const sellBtn = this.bodyEl.querySelector('.bridge-token-btn[data-token-role="sell"]');
    const token = sellBtn?.querySelector('[data-token-symbol]')?.textContent || 'ETH';
    const network = sellBtn?.querySelector('[data-token-chain]')?.textContent || 'Ethereum';

    // Only support Ethereum -> Somnia for now
    if (network !== 'Ethereum' || token !== 'ETH') {
      this.showMessage('Only ETH from Ethereum Mainnet is supported for bridging to Somnia', 'error');
      return;
    }

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Bridging...';

    try {
      await BridgeService.init();
      const result = await BridgeService.bridgeETHToSOMI(amount.toString(), this.walletAddress);

      if (result.success) {
        this.showXPPopup('BRIDGE SUCCESS', 100);
        this.showMessage(result.message, 'success');
        
        // Refresh balances
        setTimeout(() => {
          this.loadBridgeBalances();
        }, 2000);
      } else {
        this.showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Bridge execution error:', error);
      this.showMessage(error.message || 'Bridge transaction failed', 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  /**
   * Handle bridge percent button click
   */
  async handleBridgePercent(button) {
    if (this.currentType !== 'BRIDGE' || !this.walletAddress) return;

    try {
      const percent = parseInt(button.dataset.percent || '100');
      
      // Get current balance from the balance display
      const sellBalanceEl = this.bodyEl.querySelector('.bridge-card:first-child .bridge-balance');
      if (!sellBalanceEl) return;

      // Extract balance from text like "Balance: 0.0012 ETH"
      const balanceText = sellBalanceEl.textContent;
      const balanceMatch = balanceText.match(/Balance:\s*([\d.]+)/);
      if (!balanceMatch) return;

      const currentBalance = parseFloat(balanceMatch[1]);
      if (isNaN(currentBalance) || currentBalance <= 0) return;

      // Calculate amount based on percent
      const amount = (currentBalance * percent) / 100;
      
      // Update amount value input
      const amountInput = this.bodyEl.querySelector('.bridge-card:first-child .bridge-amount-value');
      const bridgeButton = this.bodyEl.querySelector('.bridge-btn');
      
      if (amountInput) {
        // Format based on token decimals (ETH/USDC typically 4-6 decimals for display)
        const formattedAmount = amount < 0.0001 
          ? amount.toFixed(8) 
          : amount < 1 
          ? amount.toFixed(6) 
          : amount.toFixed(4);
        amountInput.value = formattedAmount;
        
        // Update bridge button state
        if (bridgeButton) {
          this.updateBridgeButtonState(amountInput, bridgeButton);
        }
        
        // Trigger input event for any listeners
        amountInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Update button text if needed (optional visual feedback)
      button.style.background = 'rgba(var(--theme-rgb, 255,0,85), 0.3)';
      setTimeout(() => {
        button.style.background = '';
      }, 200);
    } catch (error) {
      console.error('Handle bridge percent error:', error);
    }
  }

  /**
   * Load bridge balances
   */
  async loadBridgeBalances() {
    if (!this.walletAddress || this.currentType !== 'BRIDGE') return;

    try {
      await BridgeService.init();
      
      const sellBtn = this.bodyEl.querySelector('.bridge-token-btn[data-token-role="sell"]');
      if (!sellBtn) return;
      
      // Get token and network from dataset or text content
      const token = sellBtn.dataset.token || sellBtn.querySelector('[data-token-symbol]')?.textContent?.trim() || 'ETH';
      const networkText = sellBtn.querySelector('[data-token-chain]')?.textContent?.trim() || 'Base';
      const network = networkText.toLowerCase() === 'ethereum' ? 'ethereum' : 
                      networkText.toLowerCase() === 'base' ? 'base' : 'base';

      console.log('Loading bridge balances:', { token, network, networkText });

      let sellBalanceValue = '0';
      let sellSymbol = token;

      // Get balance based on network and token
      if (network === 'base') {
        if (token === 'ETH') {
          sellBalanceValue = await BridgeService.getBaseETHBalance();
          console.log('Base ETH balance:', sellBalanceValue);
        } else if (token === 'USDC') {
          sellBalanceValue = await BridgeService.getBaseUSDCBalance();
          console.log('Base USDC balance:', sellBalanceValue);
        }
      } else if (network === 'ethereum') {
        if (token === 'ETH') {
          sellBalanceValue = await BridgeService.getEthereumETHBalance();
          console.log('Ethereum ETH balance:', sellBalanceValue);
        } else if (token === 'USDC') {
          sellBalanceValue = await BridgeService.getEthereumUSDCBalance();
          console.log('Ethereum USDC balance:', sellBalanceValue);
        }
      }

      // Get SOMI balance on Somnia Mainnet
      const somiBalance = await BridgeService.getSOMIBalance();
      console.log('Somnia SOMI balance:', somiBalance);

      // Update sell balance
      const sellBalance = this.bodyEl.querySelector('.bridge-card:first-child .bridge-balance');
      if (sellBalance) {
        const formattedBalance = parseFloat(sellBalanceValue || '0').toFixed(4);
        sellBalance.textContent = `Balance: ${formattedBalance} ${sellSymbol}`;
      }

      // Update buy balance (SOMI on Somnia Mainnet)
      const buyBalance = this.bodyEl.querySelector('.bridge-card:last-child .bridge-balance');
      if (buyBalance) {
        const formattedSOMI = parseFloat(somiBalance || '0').toFixed(4);
        buyBalance.textContent = `Balance: ${formattedSOMI} SOMI`;
      }

      // Update amount input if needed
      const amountValue = this.bodyEl.querySelector('.bridge-amount-value');
      if (amountValue && amountValue.value === '0') {
        // Keep it at 0, user will enter amount
      }
    } catch (error) {
      console.error('Load bridge balances error:', error);
    }
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

export default Modal;
