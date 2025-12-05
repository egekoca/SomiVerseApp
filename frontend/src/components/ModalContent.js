/**
 * Modal Content Generators
 * Content generator functions for each building type
 */

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
    <button class="primary-btn">START SWAP</button>
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
    <button class="primary-btn">ADD FUNDS</button>
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
    <button class="primary-btn">MINT NFT</button>
  `;
}

export function generateFaucetContent() {
  return `
    <div class="countdown">23:59:00</div>
    <p class="countdown-label">/// NEXT CYCLE COOLDOWN</p>
    <div class="defi-row">
      <span class="defi-label">DAILY REWARD</span>
      <span class="defi-value">100 TKN</span>
    </div>
    <button class="primary-btn">CLAIM</button>
  `;
}

export default {
  generateSwapContent,
  generateLendingContent,
  generateMintContent,
  generateFaucetContent
};
