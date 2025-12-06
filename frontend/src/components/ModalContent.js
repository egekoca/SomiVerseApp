/**
 * Modal Content Generators
 * Content generator functions for each building type
 */
import { FaucetService } from '../services/FaucetService.js';
import { ProfileService } from '../services/ProfileService.js';

export function generateSwapContent() {
  return `
    <div class="defi-row">
      <span class="defi-label">SENDING</span>
      <span class="defi-value">1.5 ETH</span>
    </div>
    <div class="defi-row">
      <span class="defi-label">RECEIVING (ESTIMATED)</span>
      <span class="defi-value">4500 USDC</span>
    </div>
    <div class="defi-row">
      <span class="defi-label">FEE</span>
      <span class="defi-value">0.3%</span>
    </div>
    <button class="primary-btn" data-action="swap">START SWAP</button>
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
