/**
 * Modal Content Generators
 * Content generator functions for each building type
 */
import { FaucetService } from '../services/FaucetService.js';
import { ProfileService } from '../services/ProfileService.js';
import { SwapService } from '../services/SwapService.js';
import { SWAP_CONFIG } from '../config/swap.config.js';

/**
 * Generate Swap UI content
 * @param {string} walletAddress - Connected wallet address (optional)
 */
export function generateSwapContent(walletAddress = null) {
  const tokens = SwapService.getSupportedTokens();
  const settings = SwapService.getSettings();
  
  // Generate token options HTML
  const tokenOptionsFrom = tokens.map(t => 
    `<option value="${t.symbol}" ${t.symbol === 'STT' ? 'selected' : ''}>${t.symbol}</option>`
  ).join('');
  
  const tokenOptionsTo = tokens.map(t => 
    `<option value="${t.symbol}" ${t.symbol === 'USDT' ? 'selected' : ''}>${t.symbol}</option>`
  ).join('');

  const isConnected = !!walletAddress;
  const buttonText = isConnected ? 'SWAP TOKENS' : 'CONNECT WALLET';
  const buttonDisabled = isConnected ? '' : 'disabled';

  return `
    <style>
      .swap-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      .swap-box {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(var(--theme-rgb), 0.3);
        padding: 12px;
        border-radius: 4px;
      }
      .swap-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 0.8em;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'Courier New', monospace;
      }
      .input-row {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(var(--theme-rgb), 0.5);
        padding: 5px 10px;
        border-radius: 4px;
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
        min-width: 80px;
      }
      .token-select:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .token-select option {
        background: #1a1428;
        color: #fff;
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
      .swap-divider {
        display: flex;
        justify-content: center;
        margin: -10px 0;
        z-index: 2;
        position: relative;
      }
      .switch-btn {
        background: #0d0a14;
        border: 2px solid var(--theme-color);
        color: var(--theme-color);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        font-size: 1.2em;
      }
      .switch-btn:hover {
        background: var(--theme-color);
        color: #0d0a14;
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
        padding: 15px;
        font-size: 1.1em;
        margin-top: 10px;
      }
      .swap-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .swap-status {
        text-align: center;
        padding: 8px;
        margin-bottom: 10px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.85em;
      }
      .swap-status.ready {
        background: rgba(0, 255, 170, 0.1);
        border: 1px solid rgba(0, 255, 170, 0.3);
        color: #00ffaa;
      }
      .swap-status.not-connected {
        background: rgba(255, 170, 0, 0.1);
        border: 1px solid rgba(255, 170, 0, 0.3);
        color: #ffaa00;
      }
      .text-green { color: #00ffaa; }
      .text-neon { color: var(--theme-color); }
      .estimated-badge {
        font-size: 0.7em;
        background: rgba(255, 170, 0, 0.2);
        color: #ffaa00;
        padding: 2px 6px;
        border-radius: 3px;
        margin-left: 5px;
      }
    </style>

    <div class="swap-container">
      <div class="swap-status ${isConnected ? 'ready' : 'not-connected'}">
        ${isConnected ? '● READY TO SWAP' : '○ WALLET NOT CONNECTED'}
      </div>

      <div class="swap-box from-box">
        <div class="swap-header">
          <span class="swap-label">FROM</span>
          <span class="swap-balance" id="from-balance">Balance: --</span>
        </div>
        <div class="input-row">
          <input type="number" class="cyber-input" id="from-amount" placeholder="0.0" value="" step="0.01" min="0">
          <select class="token-select" id="from-token">
            ${tokenOptionsFrom}
          </select>
        </div>
        <div class="percent-row">
          <button class="percent-btn" data-percent="25">25%</button>
          <button class="percent-btn" data-percent="50">50%</button>
          <button class="percent-btn" data-percent="75">75%</button>
          <button class="percent-btn" data-percent="100">MAX</button>
        </div>
      </div>

      <div class="swap-divider">
        <button class="switch-btn" id="switch-tokens">⇅</button>
      </div>

      <div class="swap-box to-box">
        <div class="swap-header">
          <span class="swap-label">TO (ESTIMATED)</span>
          <span class="swap-balance" id="to-balance">Balance: --</span>
        </div>
        <div class="input-row">
          <input type="number" class="cyber-input" id="to-amount" placeholder="0.0" readonly>
          <select class="token-select" id="to-token">
            ${tokenOptionsTo}
          </select>
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
      
      <div class="faucet-message hidden"></div>
    </div>
  `;
}

export function generateLendingContent() {
  return `
    <div class="defi-row">
      <span class="defi-label">TOTAL DEPOSITS</span>
      <span class="defi-value">$12,450,000</span>
    </div>
    <div class="defi-row">
      <span class="defi-label">APY (INTEREST)</span>
      <span class="defi-value text-green">+4.5%</span>
    </div>
    <div class="defi-row">
      <span class="defi-label">BORROW LIMIT</span>
      <span class="defi-value">80%</span>
    </div>
    <button class="primary-btn" data-action="lend">ADD FUNDS</button>
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
      <div class="faucet-status ${statusClass}">
        ${canClaim ? 'READY TO CLAIM' : (walletAddress ? 'ON COOLDOWN' : 'WALLET NOT CONNECTED')}
      </div>
      
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

export default {
  generateSwapContent,
  generateLendingContent,
  generateMintContent,
  generateFaucetContent
};
