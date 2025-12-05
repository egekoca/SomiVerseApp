/**
 * Modal Content Generators
 * Her bina tipi için modal içeriği üreten fonksiyonlar
 */

export function generateSwapContent() {
  return `
    <div class="defi-row">
      <span class="defi-label">GÖNDERİLEN</span>
      <span class="defi-value">1.5 ETH</span>
    </div>
    <div class="defi-row">
      <span class="defi-label">ALINAN (TAHMİNİ)</span>
      <span class="defi-value">4500 USDC</span>
    </div>
    <div class="defi-row">
      <span class="defi-label">KOMİSYON</span>
      <span class="defi-value">0.3%</span>
    </div>
    <button class="primary-btn">SWAP BAŞLAT</button>
  `;
}

export function generateLendingContent() {
  return `
    <div class="defi-row">
      <span class="defi-label">TOPLAM YATIRIM</span>
      <span class="defi-value">$12,450,000</span>
    </div>
    <div class="defi-row">
      <span class="defi-label">APY (FAİZ)</span>
      <span class="defi-value text-green">+4.5%</span>
    </div>
    <div class="defi-row">
      <span class="defi-label">BORÇ LİMİTİ</span>
      <span class="defi-value">80%</span>
    </div>
    <button class="primary-btn">FON EKLE</button>
  `;
}

export function generateMintContent() {
  return `
    <div class="nft-preview">
      <div class="nft-preview-box">?</div>
      <div class="nft-preview-label">PREVIEW</div>
    </div>
    <div class="defi-row">
      <span class="defi-label">KOLEKSİYON</span>
      <span class="defi-value">CYBER PUNKS</span>
    </div>
    <div class="defi-row">
      <span class="defi-label">FİYAT</span>
      <span class="defi-value">0.05 ETH</span>
    </div>
    <button class="primary-btn">NFT ÜRET</button>
  `;
}

export function generateFaucetContent() {
  return `
    <div class="countdown">23:59:00</div>
    <p class="countdown-label">/// NEXT CYCLE COOLDOWN</p>
    <div class="defi-row">
      <span class="defi-label">GÜNLÜK ÖDÜL</span>
      <span class="defi-value">100 TKN</span>
    </div>
    <button class="primary-btn">TALEP ET</button>
  `;
}

export default {
  generateSwapContent,
  generateLendingContent,
  generateMintContent,
  generateFaucetContent
};

