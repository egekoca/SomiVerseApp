/**
 * Modal Content Generators
 * Content generator functions for each building type
 */
import { FaucetService } from '../services/FaucetService.js';
import { SomniaNameService } from '../services/SomniaNameService.js';
import { ProfileService } from '../services/ProfileService.js';
import { SwapService } from '../services/SwapService.js';
import { GearboxService } from '../services/GearboxService.js';
import { BridgeService } from '../services/BridgeService.js';
import { SWAP_CONFIG } from '../config/swap.config.js';
import { GEARBOX_CONFIG } from '../config/gearbox.config.js';

/**
 * Generate Swap UI content
 * @param {string} walletAddress - Connected wallet address (optional)
 */
export async function generateSwapContent(walletAddress = null) {
  const tokens = await SwapService.getSupportedTokens();
  const settings = SwapService.getSettings();
  
  // Default tokens (SOMI -> WSOMI for mainnet, STT -> USDT for testnet)
  const defaultFrom = 'SOMI';
  const defaultTo = 'WSOMI';
  
  // Get initial balances if wallet is connected
  let fromBalance = '0.00';
  let toBalance = '0.00';
  
  if (walletAddress) {
    try {
      fromBalance = await SwapService.getTokenBalance(defaultFrom, walletAddress);
      toBalance = await SwapService.getTokenBalance(defaultTo, walletAddress);
    } catch (error) {
      console.error('Error loading initial swap balances:', error);
    }
  }

  const isConnected = !!walletAddress;
  const buttonText = isConnected ? 'SWAP TOKENS' : 'CONNECT WALLET';
  const buttonDisabled = isConnected ? '' : 'disabled';
  
  // Get token info for default tokens
  const fromTokenInfo = SWAP_CONFIG.tokenInfo[defaultFrom] || {};
  const toTokenInfo = SWAP_CONFIG.tokenInfo[defaultTo] || {};
  
  // Determine logo URLs
  const fromLogo = fromTokenInfo.logo || '/somniablack.png';
  const fromChainLogo = fromTokenInfo.chainLogo || '/somniablack.png';
  const toLogo = toTokenInfo.logo || '/somniablack.png';
  const toChainLogo = toTokenInfo.chainLogo || '/somniablack.png';
  
  // Check if testnet (for grayscale effect)
  const fromIsTestnet = fromTokenInfo.network === 'testnet';
  const toIsTestnet = toTokenInfo.network === 'testnet';

  return `
    <style>
      .swap-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .swap-box {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(var(--theme-rgb), 0.25);
        border-radius: 10px;
        padding: 14px;
      }
      .swap-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-family: 'Courier New', monospace;
        color: rgba(255,255,255,0.8);
      }
      .swap-label {
        font-size: 0.9em;
        color: rgba(255,255,255,0.7);
      }
      .swap-balance {
        font-size: 0.85em;
        color: rgba(255,255,255,0.6);
      }
      .swap-token-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .swap-token-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 16px;
        padding: 8px 12px;
        font-family: 'Courier New', monospace;
        color: #fff;
        cursor: pointer;
        position: relative;
      }
      .swap-token-btn span {
        font-weight: 700;
      }
      .swap-token-icon {
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--token-icon, url('/somniablack.png')) center/cover no-repeat;
        filter: ${fromIsTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none'};
      }
      .swap-token-icon .badge {
        position: absolute;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--chain-icon, url('/somniablack.png')) center/cover no-repeat;
        bottom: -2px;
        right: -2px;
        border: 2px solid #0d0a14;
        filter: ${fromIsTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none'};
      }
      .swap-token-chain {
        font-size: 0.85em;
        color: rgba(255,255,255,0.6);
      }
      .swap-amount-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .swap-amount-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .swap-amount-input {
        font-size: 2.2em;
        font-weight: 700;
        color: #fff;
        background: transparent;
        border: none;
        outline: none;
        width: 100%;
        font-family: 'Courier New', monospace;
        text-align: left;
      }
      .swap-amount-input::-webkit-outer-spin-button,
      .swap-amount-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .swap-amount-input[type="number"] {
        -moz-appearance: textfield;
      }
      .swap-percent {
        display: flex;
        gap: 6px;
      }
      .swap-percent-btn {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        color: #fff;
        padding: 4px 10px;
        border-radius: 12px;
        cursor: pointer;
        font-family: 'Courier New', monospace;
        font-size: 0.8em;
        transition: all 0.2s;
      }
      .swap-percent-btn:hover {
        background: rgba(var(--theme-rgb), 0.2);
        border-color: rgba(var(--theme-rgb), 0.5);
        color: var(--theme-color);
      }
      .swap-divider {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 4px 0;
      }
      .swap-arrow {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 1.2em;
        cursor: pointer;
        transition: all 0.3s;
      }
      .swap-arrow:hover {
        background: rgba(var(--theme-rgb), 0.2);
        border-color: var(--theme-color);
        transform: rotate(180deg);
      }
      .swap-details {
        background: rgba(0, 0, 0, 0.2);
        padding: 10px;
        border-radius: 4px;
        font-size: 0.85em;
      }
      .swap-details.hidden {
        display: none;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        color: rgba(255, 255, 255, 0.7);
      }
      .detail-row.highlight {
        color: var(--theme-color);
        font-weight: bold;
        margin-top: 8px;
        border-top: 1px dashed rgba(255, 255, 255, 0.2);
        padding-top: 8px;
      }
      .swap-btn {
        width: 100%;
        padding: 14px;
        margin-top: 4px;
        font-size: 1em;
      }
      .swap-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .text-green { color: #00ffaa; }
      .text-neon { color: var(--theme-color); }
    </style>

    <div class="swap-container">
      <div class="swap-box from-box">
        <div class="swap-header">
          <span class="swap-label">FROM</span>
          <span class="swap-balance" id="from-balance">Balance: ${parseFloat(fromBalance || '0').toFixed(4)} ${defaultFrom}</span>
        </div>
        <div class="swap-token-row">
          <div class="swap-token-btn" data-token-role="from" id="swap-from-btn" 
               style="--token-icon:url('${fromLogo}'); --chain-icon:url('${fromChainLogo}');">
            <div class="swap-token-icon"><div class="badge"></div></div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span data-token-symbol>${defaultFrom}</span>
              <small class="swap-token-chain" data-token-network>${fromTokenInfo.network === 'mainnet' ? 'Mainnet' : 'Testnet'}</small>
            </div>
          </div>
        </div>
        <div class="swap-amount-row">
          <div class="swap-amount-top">
            <input type="number" class="swap-amount-input" id="from-amount" value="0" step="any" min="0" placeholder="0" />
          </div>
          <div class="swap-percent">
            <button class="swap-percent-btn" data-percent="25">25%</button>
            <button class="swap-percent-btn" data-percent="50">50%</button>
            <button class="swap-percent-btn" data-percent="75">75%</button>
            <button class="swap-percent-btn" data-percent="100">MAX</button>
          </div>
        </div>
      </div>

      <div class="swap-divider">
        <div class="swap-arrow" id="switch-tokens">⇅</div>
      </div>

      <div class="swap-box to-box">
        <div class="swap-header">
          <span class="swap-label">TO (ESTIMATED)</span>
          <span class="swap-balance" id="to-balance">Balance: ${parseFloat(toBalance || '0').toFixed(4)} ${defaultTo}</span>
        </div>
        <div class="swap-token-row">
          <div class="swap-token-btn" data-token-role="to" id="swap-to-btn"
               style="--token-icon:url('${toLogo}'); --chain-icon:url('${toChainLogo}'); ${toIsTestnet ? 'filter: grayscale(0.7) brightness(0.8);' : ''}">
            <div class="swap-token-icon" style="filter: ${toIsTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none'};"><div class="badge" style="filter: ${toIsTestnet ? 'grayscale(0.7) brightness(0.8)' : 'none'};"></div></div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span data-token-symbol>${defaultTo}</span>
              <small class="swap-token-chain" data-token-network>${toTokenInfo.network === 'mainnet' ? 'Mainnet' : 'Testnet'}</small>
            </div>
          </div>
        </div>
        <div class="swap-amount-row">
          <div class="swap-amount-top">
            <div class="swap-amount-input" id="to-amount" style="pointer-events: none; opacity: 0.7;">0</div>
          </div>
        </div>
      </div>

      <div class="swap-details hidden" id="quote-info">
        <div class="detail-row">
          <span>Rate</span>
          <span id="swap-rate">--</span>
        </div>
        <div class="detail-row">
          <span>Price Impact</span>
          <span id="price-impact" class="text-green">--</span>
        </div>
        <div class="detail-row">
          <span>Fee</span>
          <span id="swap-fee">0.3%</span>
        </div>
        <div class="detail-row highlight">
          <span>XP Reward</span>
          <span class="text-neon">+${settings.xpReward} XP</span>
        </div>
      </div>

      <button class="primary-btn swap-btn" id="swap-btn" data-action="swap" ${buttonDisabled}>
        <span class="btn-text">${buttonText}</span>
        <span class="btn-loader hidden">PROCESSING...</span>
      </button>
    </div>
  `;
}

/**
 * Generate Lending UI content (Gearbox Protocol)
 * @param {string} walletAddress - Connected wallet address (optional)
 */
export function generateLendingContent(walletAddress = null) {
  const isConnected = !!walletAddress;
  const settings = GearboxService.getSettings();
  
  // Only WSOMI is used for Gearbox (no token selection needed)

  return `
    <style>
      .lending-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      .lending-status {
        text-align: center;
        padding: 8px;
        margin-bottom: 10px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.85em;
      }
      .lending-status.ready {
        background: rgba(255, 0, 85, 0.1);
        border: 1px solid rgba(255, 0, 85, 0.3);
        color: #ff0055;
      }
      .lending-status.not-connected {
        background: rgba(255, 170, 0, 0.1);
        border: 1px solid rgba(255, 170, 0, 0.3);
        color: #ffaa00;
      }
      .pool-selector {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(var(--theme-rgb), 0.3);
        padding: 12px;
        border-radius: 4px;
      }
      .pool-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 0.8em;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'Courier New', monospace;
      }
      .token-select {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(var(--theme-rgb), 0.3);
        color: var(--theme-color);
        padding: 6px 10px;
        border-radius: 15px;
        cursor: pointer;
        font-weight: bold;
        font-family: 'Courier New', monospace;
        outline: none;
        width: 100%;
      }
      .lending-box {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(var(--theme-rgb), 0.3);
        padding: 12px;
        border-radius: 4px;
      }
      .input-row {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(var(--theme-rgb), 0.5);
        padding: 5px 10px;
        border-radius: 4px;
        margin-top: 8px;
      }
      .input-row:focus-within {
        border-color: var(--theme-color);
        box-shadow: 0 0 10px rgba(var(--theme-rgb), 0.2);
      }
      .cyber-input {
        background: transparent;
        border: none;
        color: #fff;
        font-size: 1.2em;
        width: 100%;
        font-family: 'Courier New', monospace;
        outline: none;
      }
      .cyber-input::-webkit-outer-spin-button,
      .cyber-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .percent-row {
        display: flex;
        gap: 8px;
        margin-top: 10px;
        justify-content: flex-end;
      }
      .percent-btn {
        background: transparent;
        border: 1px solid rgba(var(--theme-rgb), 0.3);
        color: var(--theme-color);
        padding: 2px 8px;
        font-size: 0.7em;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Courier New', monospace;
      }
      .percent-btn:hover {
        background: rgba(var(--theme-rgb), 0.2);
        border-color: var(--theme-color);
      }
      .pool-stats {
        background: rgba(0, 0, 0, 0.2);
        padding: 10px;
        border-radius: 4px;
        font-size: 0.85em;
        margin-top: 10px;
      }
      .stat-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        color: rgba(255, 255, 255, 0.7);
      }
      .stat-row.highlight {
        color: var(--theme-color);
        font-weight: bold;
        margin-top: 8px;
        border-top: 1px dashed rgba(255, 255, 255, 0.2);
        padding-top: 8px;
      }
      .action-buttons {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }
      .action-btn {
        flex: 1;
        padding: 12px;
        font-size: 1em;
      }
      .text-green { color: #00ffaa; }
      .text-neon { color: var(--theme-color); }
      .deposit-balance {
        font-size: 0.9em;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 5px;
      }
    </style>

    <div class="lending-container">
      <!-- Deposit/Withdraw Tabs -->
      <div class="lending-tabs" style="display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <button class="lending-tab active" data-tab="deposit" style="flex: 1; padding: 10px; background: transparent; border: none; border-bottom: 2px solid var(--theme-color, #00ffcc); color: var(--theme-color, #00ffcc); cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.9em; text-transform: uppercase;">
          SUPPLY LIQUIDITY
        </button>
        <button class="lending-tab" data-tab="withdraw" style="flex: 1; padding: 10px; background: transparent; border: none; border-bottom: 2px solid transparent; color: rgba(255,255,255,0.5); cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.9em; text-transform: uppercase;">
          WITHDRAW LIQUIDITY
        </button>
      </div>

      <!-- Deposit Tab Content -->
      <div class="lending-tab-content" data-content="deposit">
        <div class="lending-box" style="margin-top: 0;">
          <div class="pool-header" style="margin-bottom: 15px;">
            <span>YOU DEPOSIT</span>
          </div>
          <div class="input-row" style="position: relative;">
            <input type="number" class="cyber-input" id="lend-amount" placeholder="0" value="" step="0.01" min="0" style="width: 100%; padding-right: 80px;">
            <div style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 0.9em; color: rgba(255,255,255,0.7);">Wallet balance: <span id="lend-balance">0.0</span></span>
              <button class="percent-btn" data-percent="100" style="padding: 5px 12px; font-size: 0.8em;">MAX</button>
            </div>
          </div>
          <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3);">
              <img src="/somniablack.png" alt="WSOMI" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            </div>
            <span style="font-weight: bold; color: #fff;">WSOMI</span>
          </div>

          <div style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9em;">
              <span style="color: rgba(255,255,255,0.7);">You get</span>
              <span id="you-get-amount" style="color: var(--theme-color, #00ffcc); font-weight: bold;">0.00 dWSOMI-V3-1</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
              <span style="color: rgba(255,255,255,0.7);">Current APY</span>
              <span id="pool-apy" style="color: #fff;">0%</span>
            </div>
          </div>
        </div>

      <div class="action-buttons" style="margin-top: 20px;">
        <button class="primary-btn action-btn" id="deposit-btn" data-action="deposit" ${isConnected ? '' : 'disabled'} style="width: 100%; padding: 15px; font-size: 1em;">
          <span class="btn-text">${isConnected ? 'SUPPLY LIQUIDITY' : 'ENTER AMOUNT'}</span>
          <span class="btn-loader hidden">PROCESSING...</span>
        </button>
      </div>
      </div>

      <!-- Withdraw Tab Content -->
      <div class="lending-tab-content" data-content="withdraw" style="display: none;">
        <div class="lending-box" style="margin-top: 0;">
          <div class="pool-header" style="margin-bottom: 15px;">
            <span>YOU WITHDRAW</span>
          </div>
          <div class="input-row" style="position: relative;">
            <input type="number" class="cyber-input" id="lend-amount-withdraw" placeholder="0" value="" step="0.01" min="0" style="width: 100%; padding-right: 120px;">
            <div style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 0.9em; color: rgba(255,255,255,0.7);">Supply balance: <span id="lend-balance-withdraw">0.0</span></span>
              <button class="percent-btn" data-percent="100" style="padding: 5px 12px; font-size: 0.8em;">MAX</button>
            </div>
          </div>
          <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 0.7em; color: #fff;">⋯</span>
            </div>
            <span style="font-weight: bold; color: #fff;">dWSOMI-V3-1</span>
          </div>

          <div style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9em;">
              <span style="color: rgba(255,255,255,0.7);">You get</span>
              <span id="you-get-amount-withdraw" style="color: var(--theme-color, #00ffcc); font-weight: bold;">0.00 WSOMI</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
              <span style="color: rgba(255,255,255,0.7);">Available Liq.</span>
              <span id="available-liquidity" style="color: #fff;">--</span>
            </div>
          </div>
        </div>

        <div class="action-buttons" style="margin-top: 20px;">
          <button class="primary-btn action-btn" id="withdraw-btn" data-action="withdraw" ${isConnected ? '' : 'disabled'} style="width: 100%; padding: 15px; font-size: 1em;">
            <span class="btn-text">${isConnected ? 'WITHDRAW LIQUIDITY' : 'ENTER AMOUNT'}</span>
            <span class="btn-loader hidden">PROCESSING...</span>
          </button>
        </div>
      </div>

      <!-- Your Positions Section (below tabs) -->
      ${isConnected ? `
      <div class="positions-section" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(var(--theme-rgb), 0.3); padding: 15px; border-radius: 4px; margin-top: 20px;">
        <div class="pool-header" style="margin-bottom: 12px;">
          <span>POSITIONS IN MARKETS</span>
        </div>
        <div class="position-row" style="display: flex; align-items: center; gap: 15px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 4px;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
            <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3);">
              <img src="/somniablack.png" alt="SOMI" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            </div>
            <div>
              <div style="font-weight: bold; color: #fff; font-size: 1em;">SOMI</div>
              <div style="font-size: 0.75em; color: rgba(255,255,255,0.5);">Gearbox Pool</div>
            </div>
          </div>
          <div style="flex: 1; text-align: right;">
            <div style="font-size: 0.85em; color: rgba(255,255,255,0.7); margin-bottom: 4px;">Supply</div>
            <div id="position-supply" style="font-weight: bold; color: #fff; font-size: 0.9em;">0.00 WSOMI</div>
          </div>
          <div style="flex: 1; text-align: right;">
            <div style="font-size: 0.85em; color: rgba(255,255,255,0.7); margin-bottom: 4px;">Supply APY</div>
            <div id="position-apy" style="font-weight: bold; color: var(--theme-color, #00ffcc); font-size: 0.9em;">0%</div>
          </div>
          <div style="flex: 1; text-align: right;">
            <div style="font-size: 0.85em; color: rgba(255,255,255,0.7); margin-bottom: 4px;">Your Balance</div>
            <div id="position-balance" style="font-weight: bold; color: #fff; font-size: 0.9em;">0.00 dWSOMI-V3-1</div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Powered by Gearbox -->
      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
        <span style="font-size: 0.75em; color: rgba(255,255,255,0.5); font-family: 'Courier New', monospace;">POWERED BY</span>
        <span style="font-size: 0.75em; color: rgba(255,255,255,0.7); font-family: 'Courier New', monospace;">GearBox Protocol</span>
        <img src="/gearbox.avif" alt="Gearbox" style="height: 20px; width: auto; opacity: 0.8;">
      </div>
      
      <div class="faucet-message hidden"></div>
    </div>
  `;
}

export function generateMintContent() {
  return `
    <div class="nft-preview">
      <div class="nft-preview-box">?</div>
      <div class="nft-preview-label">PREVIEW</div>
    </div>
    <div class="defi-row">
      <span class="defi-label">COLLECTION</span>
      <span class="defi-value">CYBER PUNKS</span>
    </div>
    <div class="defi-row">
      <span class="defi-label">PRICE</span>
      <span class="defi-value">0.05 ETH</span>
    </div>
    <button class="primary-btn" data-action="mint">MINT NFT</button>
  `;
}

/**
 * Generate Faucet content with live data
 */
export function generateFaucetContent(walletAddress = null) {
  const amount = FaucetService.getAmount();
  const canClaim = walletAddress ? FaucetService.canClaim(walletAddress) : false;
  const cooldownText = walletAddress ? FaucetService.formatCooldownTime(walletAddress) : null;
  
  let buttonText = 'CONNECT WALLET';
  let buttonDisabled = '';
  let statusClass = '';
  let countdownDisplay = '';
  
  if (walletAddress) {
    if (canClaim) {
      buttonText = `CLAIM ${amount} STT`;
      statusClass = 'ready';
    } else {
      buttonText = 'ON COOLDOWN';
      buttonDisabled = 'disabled';
      statusClass = 'cooldown';
      countdownDisplay = `
        <div class="cooldown-timer">
          <span class="cooldown-label">NEXT CLAIM IN</span>
          <span class="cooldown-value">${cooldownText}</span>
        </div>
      `;
    }
  }

  return `
    <div class="faucet-container">
      ${countdownDisplay}
      
      <div class="defi-row">
        <span class="defi-label">NETWORK</span>
        <span class="defi-value">SOMNIA</span>
      </div>
      <div class="defi-row">
        <span class="defi-label">REWARD</span>
        <span class="defi-value">${amount} STT</span>
      </div>
      <div class="defi-row">
        <span class="defi-label">COOLDOWN PERIOD</span>
        <span class="defi-value">24 HOURS</span>
      </div>
      <div class="defi-row">
        <span class="defi-label">XP REWARD</span>
        <span class="defi-value text-green">+25 XP</span>
      </div>
      
      <button class="primary-btn faucet-btn ${statusClass}" data-action="faucet" ${buttonDisabled}>
        <span class="btn-text">${buttonText}</span>
        <span class="btn-loader hidden">PROCESSING...</span>
      </button>
      
      <div class="faucet-message hidden"></div>
    </div>
  `;
}

/**
 * Somnia Domain Service content
 * Two tabs: Register Domain and Domain Management
 */
export async function generateDomainContent(walletAddress = null) {
  const isConnected = !!walletAddress;
  
  return `
    <style>
      .domain-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      .domain-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      .domain-tab {
        flex: 1;
        padding: 10px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: rgba(255,255,255,0.5);
        cursor: pointer;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        text-transform: uppercase;
        transition: all 0.3s;
      }
      .domain-tab.active {
        border-bottom-color: var(--theme-color, #aa00ff);
        color: var(--theme-color, #aa00ff);
      }
      .domain-tab:hover {
        color: var(--theme-color, #aa00ff);
      }
      .domain-tab-content {
        display: none;
      }
      .domain-tab-content.active {
        display: block;
      }
      .domain-input-container {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(var(--theme-rgb), 0.3);
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 15px;
      }
      .domain-input-row {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(40, 40, 40, 0.8);
        border: 1px solid rgba(var(--theme-rgb), 0.5);
        padding: 10px;
        border-radius: 4px;
      }
      .domain-input-row:focus-within {
        border-color: var(--theme-color, #aa00ff);
        box-shadow: 0 0 10px rgba(var(--theme-rgb), 0.2);
      }
      .domain-input {
        background: transparent;
        border: none;
        color: #fff;
        font-size: 1.1em;
        flex: 1;
        font-family: 'Courier New', monospace;
        outline: none;
      }
      .domain-suffix {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(var(--theme-rgb), 0.3);
        color: var(--theme-color, #aa00ff);
        padding: 8px 15px;
        border-radius: 4px;
        font-weight: bold;
        font-family: 'Courier New', monospace;
        white-space: nowrap;
      }
      .domain-hint {
        font-size: 0.75em;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 8px;
        font-family: 'Courier New', monospace;
      }
      .domain-status {
        text-align: center;
        padding: 8px;
        margin-bottom: 10px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.85em;
      }
      .domain-status.available {
        background: rgba(0, 255, 170, 0.1);
        border: 1px solid rgba(0, 255, 170, 0.3);
        color: #00ffaa;
      }
      .domain-status.unavailable {
        background: rgba(255, 0, 85, 0.1);
        border: 1px solid rgba(255, 0, 85, 0.3);
        color: #ff0055;
      }
      .domain-status.checking {
        background: rgba(255, 170, 0, 0.1);
        border: 1px solid rgba(255, 170, 0, 0.3);
        color: #ffaa00;
      }
      .domain-status.not-connected {
        background: rgba(255, 170, 0, 0.1);
        border: 1px solid rgba(255, 170, 0, 0.3);
        color: #ffaa00;
      }
      .domain-register-btn {
        width: 100%;
        padding: 15px;
        font-size: 1.1em;
        margin-top: 10px;
      }
      .domain-register-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .domain-cost {
        text-align: center;
        margin-top: 10px;
        font-size: 0.9em;
        color: rgba(255, 255, 255, 0.7);
        font-family: 'Courier New', monospace;
      }
      .domain-cost strong {
        color: var(--theme-color, #aa00ff);
      }
      .domain-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .domain-item {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(var(--theme-rgb), 0.3);
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 15px;
      }
      .domain-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .domain-name-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .domain-name {
        font-size: 1.3em;
        font-weight: bold;
        color: var(--theme-color, #aa00ff);
        font-family: 'Courier New', monospace;
      }
      .domain-name.primary {
        color: var(--theme-color, #aa00ff);
      }
      .domain-primary-badge {
        background: transparent;
        color: var(--theme-color, #aa00ff);
        padding: 0;
        font-size: 0.9em;
        font-family: 'Courier New', monospace;
        font-weight: normal;
      }
      .domain-expiry {
        font-size: 0.9em;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 15px;
        font-family: 'Courier New', monospace;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .domain-expiry::before {
        content: '📅';
        font-size: 1em;
      }
      .domain-actions-row {
        display: flex;
        gap: 12px;
      }
      .domain-action-btn {
        flex: 1;
        padding: 12px 20px;
        font-size: 0.95em;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
        border: none;
      }
      .domain-action-btn.set-primary {
        background: #0066ff;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .domain-action-btn.set-primary:hover:not(:disabled) {
        background: #0052cc;
        transform: translateY(-1px);
      }
      .domain-action-btn.set-primary:disabled {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.5);
        cursor: not-allowed;
      }
      .domain-action-btn.renew {
        background: var(--theme-color, #aa00ff);
        color: #fff;
      }
      .domain-action-btn.renew:hover {
        background: #8800cc;
        transform: translateY(-1px);
      }
      .domain-action-btn.secondary {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #fff;
      }
      .domain-action-btn.secondary:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .domain-action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .domain-refresh-btn {
        background: transparent;
        border: 1px solid rgba(var(--theme-rgb), 0.3);
        color: var(--theme-color, #aa00ff);
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'Courier New', monospace;
        font-size: 0.85em;
        transition: all 0.3s;
      }
      .domain-refresh-btn:hover {
        background: rgba(var(--theme-rgb), 0.2);
        border-color: var(--theme-color, #aa00ff);
      }
      .domain-empty {
        text-align: center;
        padding: 40px 20px;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'Courier New', monospace;
      }
    </style>

    <div class="domain-container">
      <!-- Tabs -->
      <div class="domain-tabs">
        <button class="domain-tab active" data-tab="register">
          + Register Domain
        </button>
        <button class="domain-tab" data-tab="management">
          Domain Management
        </button>
      </div>

      <!-- Register Tab -->
      <div class="domain-tab-content active" data-content="register">
        <div class="domain-input-container">
          <div class="domain-input-row">
            <input 
              type="text" 
              class="domain-input" 
              id="domain-name-input" 
              placeholder="e.g., mydomain (only letters, numbers, hyphens)"
              maxlength="63"
            >
            <div class="domain-suffix">.somi</div>
          </div>
          <div class="domain-hint">
            Only letters (a-z), numbers (0-9), and hyphens (-) are allowed. Special characters will be removed.
          </div>
        </div>

        <div class="domain-status not-connected" id="domain-status" style="display: ${isConnected ? 'none' : 'block'};">
          ${isConnected ? '' : 'Please connect your wallet to register a domain'}
        </div>

        <div class="domain-cost">
          Registration cost: <strong>5 SOMI</strong>
        </div>

        <button 
          class="primary-btn domain-register-btn" 
          id="domain-register-btn"
          data-action="domain-register"
          ${isConnected ? '' : 'disabled'}
        >
          ${isConnected ? 'REGISTER DOMAIN' : 'CONNECT WALLET'}
        </button>
      </div>

      <!-- Management Tab -->
      <div class="domain-tab-content" data-content="management">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0; color: #fff; font-family: 'Courier New', monospace;">Domain Management</h3>
          <button class="domain-refresh-btn" id="domain-refresh-btn" data-action="domain-refresh">
            ↻ Refresh
          </button>
        </div>

        <div id="domain-primary-section" style="display: none; background: rgba(0,0,0,0.4); padding: 18px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(var(--theme-rgb), 0.4);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--theme-color, #aa00ff); font-size: 1.2em;">★</span>
              <span style="color: rgba(255,255,255,0.8); font-family: 'Courier New', monospace; font-size: 0.95em;">Primary Domain: </span>
              <span id="domain-primary-name" style="color: var(--theme-color, #aa00ff); font-weight: bold; font-family: 'Courier New', monospace; font-size: 1.05em;"></span>
            </div>
            <button class="domain-action-btn secondary" id="domain-clear-primary-btn" data-action="domain-clear-primary" style="padding: 8px 16px; font-size: 0.85em; white-space: nowrap;">
              Clear Primary
            </button>
          </div>
        </div>

        <div id="domain-list" class="domain-list">
          <div class="domain-empty">
            ${isConnected ? 'Loading domains...' : 'Please connect your wallet to view your domains'}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate Bridge content (simple UI for bridging to Somnia Mainnet SOMI)
 */
export async function generateBridgeContent(walletAddress = null) {
  const isConnected = !!walletAddress;
  const buttonText = isConnected ? 'BRIDGE' : 'CONNECT WALLET';
  const buttonDisabled = isConnected ? '' : 'disabled';

  // Load initial balances if wallet is connected
  let sellBalance = '0.00';
  let buyBalance = '0.00';
  let sellToken = 'ETH';
  let sellNetwork = 'Base';

  if (isConnected) {
    try {
      await BridgeService.init();
      // Default: Base ETH
      sellBalance = await BridgeService.getBaseETHBalance();
      buyBalance = await BridgeService.getSOMIBalance();
    } catch (error) {
      console.error('Error loading initial bridge balances:', error);
    }
  }

  return `
    <style>
      .bridge-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .bridge-card {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(var(--theme-rgb, 255,0,85), 0.25);
        border-radius: 10px;
        padding: 14px;
      }
      .bridge-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        font-family: 'Courier New', monospace;
        color: rgba(255,255,255,0.8);
      }
      .bridge-row:last-child { margin-bottom: 0; }
      .bridge-amount {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .bridge-amount-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .bridge-amount-value {
        font-size: 2.2em;
        font-weight: 700;
        color: #fff;
        background: transparent;
        border: none;
        outline: none;
        width: 100%;
        font-family: 'Courier New', monospace;
        text-align: left;
      }
      .bridge-amount-value::-webkit-outer-spin-button,
      .bridge-amount-value::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .bridge-amount-value[type="number"] {
        -moz-appearance: textfield;
      }
      .bridge-balance {
        font-size: 0.9em;
        color: rgba(255,255,255,0.6);
      }
      .bridge-token-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 16px;
        padding: 8px 12px;
        font-family: 'Courier New', monospace;
        color: #fff;
        cursor: pointer;
        position: relative;
      }
      .bridge-token-btn span {
        font-weight: 700;
      }
      .bridge-token-icon {
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--token-icon, url('/somniablack.png')) center/cover no-repeat;
      }
      .bridge-token-icon .badge {
        position: absolute;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--chain-icon, url('/somniablack.png')) center/cover no-repeat;
        bottom: -2px;
        right: -2px;
        border: 2px solid #0d0a14;
      }
      .bridge-token-icon {
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--token-icon, url('/somniablack.png')) center/cover no-repeat;
      }
      .bridge-token-icon .badge {
        position: absolute;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--chain-icon, url('/somniablack.png')) center/cover no-repeat;
        bottom: -2px;
        right: -2px;
        border: 2px solid #0d0a14;
      }
      .bridge-percent {
        display: flex;
        gap: 6px;
      }
      .bridge-percent button,
      .bridge-percent-btn {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        color: #fff;
        padding: 4px 10px;
        border-radius: 12px;
        cursor: pointer;
        font-family: 'Courier New', monospace;
        font-size: 0.8em;
        transition: all 0.2s;
      }
      .bridge-percent button:hover,
      .bridge-percent-btn:hover {
        background: rgba(var(--theme-rgb, 255,0,85), 0.2);
        border-color: rgba(var(--theme-rgb, 255,0,85), 0.5);
        color: var(--theme-color, #ff0055);
      }
      .bridge-divider {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 4px 0;
      }
      .bridge-arrow {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 1.2em;
      }
      .bridge-footer {
        font-size: 0.85em;
        color: rgba(255,255,255,0.6);
        font-family: 'Courier New', monospace;
        text-align: center;
        margin-top: 6px;
      }
      .bridge-btn {
        width: 100%;
        padding: 14px;
        margin-top: 4px;
        font-size: 1em;
      }
      /* Small panel disabled; using full-screen selector below */
      .bridge-label {
        font-size: 0.9em;
        color: rgba(255,255,255,0.7);
      }
      .bridge-chain {
        font-size: 0.85em;
        color: rgba(255,255,255,0.6);
      }
    </style>

    <div class="bridge-container">
      <div class="bridge-card">
        <div class="bridge-row">
          <span class="bridge-label">Sell</span>
          <div class="bridge-token-btn" data-token-role="sell" id="bridge-sell-btn" style="--token-icon:url('https://assets.coingecko.com/coins/images/279/large/ethereum.png'); --chain-icon:url('https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png');">
            <div class="bridge-token-icon"><div class="badge"></div></div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span data-token-symbol>ETH</span>
              <small class="bridge-chain" data-token-chain>Base</small>
            </div>
          </div>
        </div>
        <div class="bridge-amount">
          <div class="bridge-amount-top">
            <input type="number" class="bridge-amount-value" id="bridge-amount-input" value="0" step="any" min="0" placeholder="0" />
            <div class="bridge-balance">Balance: ${parseFloat(sellBalance || '0').toFixed(4)} ${sellToken}</div>
          </div>
          <div class="bridge-percent">
            <button class="bridge-percent-btn" data-percent="25">25%</button>
            <button class="bridge-percent-btn" data-percent="50">50%</button>
            <button class="bridge-percent-btn" data-percent="75">75%</button>
            <button class="bridge-percent-btn" data-percent="100">MAX</button>
          </div>
        </div>
      </div>

      <div class="bridge-divider">
        <div class="bridge-arrow">↓</div>
      </div>

      <div class="bridge-card">
        <div class="bridge-row">
          <span class="bridge-label">Buy</span>
          <div class="bridge-token-btn" style="cursor: default; gap: 10px; --token-icon:url('/somniablack.png'); --chain-icon:url('/somniablack.png');">
            <div class="bridge-token-icon"><div class="badge"></div></div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span>SOMI</span>
              <small class="bridge-chain">Somnia</small>
            </div>
          </div>
        </div>
        <div class="bridge-amount">
          <div class="bridge-amount-top">
            <div class="bridge-amount-value">0</div>
            <div class="bridge-balance">Balance: ${parseFloat(buyBalance || '0').toFixed(4)} SOMI</div>
          </div>
        </div>
      </div>

      <button class="primary-btn bridge-btn" ${buttonDisabled} data-action="bridge">
        <span class="btn-text">${buttonText}</span>
      </button>
      <div class="bridge-footer">Bridge assets to Somnia Mainnet (SOMI)</div>
    </div>

  `;
}

export default {
  generateSwapContent,
  generateLendingContent,
  generateMintContent,
  generateFaucetContent,
  generateDomainContent,
  generateBridgeContent
};
