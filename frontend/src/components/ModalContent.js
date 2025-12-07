/**
 * Modal Content Generators
 * Content generator functions for each building type
 */
import { FaucetService } from '../services/FaucetService.js';
import { ProfileService } from '../services/ProfileService.js';
import { SwapService } from '../services/SwapService.js';
import { GearboxService } from '../services/GearboxService.js';
import { SWAP_CONFIG } from '../config/swap.config.js';
import { GEARBOX_CONFIG } from '../config/gearbox.config.js';

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
      <div class="lending-status ${isConnected ? 'ready' : 'not-connected'}">
        ${isConnected ? '● GEARBOX PROTOCOL READY' : '○ WALLET NOT CONNECTED'}
      </div>

      <!-- Your Positions Section -->
      ${isConnected ? `
      <div class="positions-section" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(var(--theme-rgb), 0.3); padding: 15px; border-radius: 4px; margin-bottom: 15px;">
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
          
          <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 8px; font-size: 0.85em; color: rgba(255,255,255,0.6); line-height: 1.6;">
            Diesel (LP) Tokens automatically earn organic borrow rates proportional to your share of the Market. GEAR rewards need to be claimed separately.
          </div>

          <div style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9em;">
              <span style="color: rgba(255,255,255,0.7);">You get</span>
              <span id="you-get-amount" style="color: var(--theme-color, #00ffcc); font-weight: bold;">0.00 dWSOMI-V3-1</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9em;">
              <span style="color: rgba(255,255,255,0.7);">WSOMI per dWSOMI-V3-1</span>
              <span style="color: #fff;">1.000000</span>
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
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9em;">
              <span style="color: rgba(255,255,255,0.7);">dWSOMI-V3-1 per WSOMI</span>
              <span style="color: #fff;">1.000000</span>
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
