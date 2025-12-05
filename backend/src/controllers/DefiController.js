/**
 * DeFi Controller
 * Swap, Lending, NFT ve Faucet işlemleri
 */
export class DefiController {
  constructor() {
    // Mock fiyatlar
    this.prices = {
      ETH: 3000,
      USDC: 1,
      TKN: 0.1
    };

    // Lending havuzları
    this.lendingPools = [
      { id: 'eth_pool', name: 'ETH Pool', apy: 4.5, totalDeposits: 12450000, currency: 'ETH' },
      { id: 'usdc_pool', name: 'USDC Pool', apy: 6.2, totalDeposits: 8200000, currency: 'USDC' },
      { id: 'tkn_pool', name: 'TKN Pool', apy: 12.5, totalDeposits: 3500000, currency: 'TKN' }
    ];

    // NFT Koleksiyonları
    this.nftCollections = [
      { id: 'cyber_punks', name: 'CYBER PUNKS', price: 0.05, currency: 'ETH', totalMinted: 1234, maxSupply: 10000 },
      { id: 'neon_riders', name: 'NEON RIDERS', price: 0.03, currency: 'ETH', totalMinted: 567, maxSupply: 5000 },
      { id: 'titan_mechs', name: 'TITAN MECHS', price: 0.1, currency: 'ETH', totalMinted: 89, maxSupply: 1000 }
    ];

    // Faucet talepleri (playerId -> lastClaim timestamp)
    this.faucetClaims = new Map();
    this.dailyReward = 100; // TKN
  }

  getSwapQuote(from, to, amount) {
    const fromPrice = this.prices[from] || 1;
    const toPrice = this.prices[to] || 1;
    const fee = 0.003; // 0.3%
    
    const outputAmount = (amount * fromPrice / toPrice) * (1 - fee);
    
    return {
      from,
      to,
      inputAmount: amount,
      outputAmount: outputAmount.toFixed(6),
      rate: (fromPrice / toPrice).toFixed(6),
      fee: `${fee * 100}%`,
      priceImpact: '0.1%' // Mock
    };
  }

  executeSwap(from, to, amount, playerId) {
    const quote = this.getSwapQuote(from, to, amount);
    
    return {
      success: true,
      transactionId: `tx_${Date.now()}`,
      ...quote,
      timestamp: new Date().toISOString()
    };
  }

  getLendingPools() {
    return this.lendingPools.map(pool => ({
      ...pool,
      borrowLimit: '80%',
      utilizationRate: `${(Math.random() * 40 + 50).toFixed(1)}%`
    }));
  }

  deposit(poolId, amount, playerId) {
    const pool = this.lendingPools.find(p => p.id === poolId);
    if (!pool) {
      return { success: false, error: 'Pool not found' };
    }

    return {
      success: true,
      poolId,
      amount,
      estimatedYield: (amount * pool.apy / 100).toFixed(2),
      transactionId: `deposit_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  getNFTCollections() {
    return this.nftCollections.map(col => ({
      ...col,
      remaining: col.maxSupply - col.totalMinted,
      soldPercentage: `${((col.totalMinted / col.maxSupply) * 100).toFixed(1)}%`
    }));
  }

  mintNFT(collectionId, playerId) {
    const collection = this.nftCollections.find(c => c.id === collectionId);
    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }

    if (collection.totalMinted >= collection.maxSupply) {
      return { success: false, error: 'Collection sold out' };
    }

    const tokenId = collection.totalMinted + 1;
    collection.totalMinted++;

    return {
      success: true,
      nft: {
        id: `${collectionId}_${tokenId}`,
        collection: collection.name,
        tokenId,
        rarity: this.getRandomRarity(),
        attributes: this.generateRandomAttributes()
      },
      transactionId: `mint_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  getRandomRarity() {
    const rand = Math.random();
    if (rand < 0.05) return 'Legendary';
    if (rand < 0.15) return 'Epic';
    if (rand < 0.35) return 'Rare';
    return 'Common';
  }

  generateRandomAttributes() {
    return {
      power: Math.floor(Math.random() * 100),
      speed: Math.floor(Math.random() * 100),
      defense: Math.floor(Math.random() * 100)
    };
  }

  getFaucetStatus(playerId) {
    const lastClaim = this.faucetClaims.get(playerId);
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000; // 24 saat
    
    if (!lastClaim) {
      return {
        canClaim: true,
        nextClaimIn: 0,
        reward: this.dailyReward
      };
    }

    const timeSinceClaim = now - lastClaim;
    const canClaim = timeSinceClaim >= cooldownMs;
    const nextClaimIn = canClaim ? 0 : cooldownMs - timeSinceClaim;

    return {
      canClaim,
      nextClaimIn,
      nextClaimFormatted: this.formatTime(nextClaimIn),
      reward: this.dailyReward
    };
  }

  claimFaucet(playerId) {
    const status = this.getFaucetStatus(playerId);
    
    if (!status.canClaim) {
      return {
        success: false,
        error: 'Cooldown active',
        nextClaimIn: status.nextClaimFormatted
      };
    }

    this.faucetClaims.set(playerId, Date.now());

    return {
      success: true,
      reward: this.dailyReward,
      currency: 'TKN',
      transactionId: `faucet_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  formatTime(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

export default DefiController;

