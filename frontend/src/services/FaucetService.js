/**
 * FaucetService
 * Handles Somnia STT faucet claims
 * Sends STT from faucet wallet to user wallet
 */
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../config/network.config.js';
import { ProfileService } from './ProfileService.js';

class FaucetServiceClass {
  constructor() {
    this.faucetConfig = null;
    this.isInitialized = false;
    this.STORAGE_KEY = 'somiverse_faucet_cooldowns';
    this.cooldowns = {};
    this.loadCooldowns();
  }

  /**
   * Initialize faucet configuration
   * Tries env variables first, then local config file
   */
  async init() {
    if (this.isInitialized) return true;

    // Try environment variables first (production)
    const envPrivateKey = import.meta.env.VITE_FAUCET_PRIVATE_KEY;
    
    if (envPrivateKey) {
      this.faucetConfig = {
        privateKey: envPrivateKey,
        amount: import.meta.env.VITE_FAUCET_AMOUNT || '0.1',
        cooldown: import.meta.env.VITE_FAUCET_COOLDOWN 
          ? parseInt(import.meta.env.VITE_FAUCET_COOLDOWN) 
          : 86400000 // 24 hours default
      };
      this.isInitialized = true;
      console.log('Faucet initialized from env variables');
      return true;
    }

    // Try local config file (development)
    try {
      const module = await import(/* @vite-ignore */ '../config/faucet.config.local.js');
      this.faucetConfig = module.FAUCET_CONFIG;
      this.isInitialized = true;
      console.log('Faucet initialized from local config');
      return true;
    } catch {
      // No config available - faucet won't work
      this.faucetConfig = { 
        privateKey: null, 
        amount: '0.1', 
        cooldown: 86400000 
      };
      this.isInitialized = true;
      console.warn('Faucet config not found - faucet disabled');
      return false;
    }
  }

  /**
   * Load cooldowns from localStorage
   * Cleans up entries older than 25 hours
   */
  loadCooldowns() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        const maxAge = 25 * 60 * 60 * 1000; // 25 hours

        // Clean old entries
        this.cooldowns = {};
        for (const [address, timestamp] of Object.entries(data)) {
          if (now - timestamp < maxAge) {
            this.cooldowns[address.toLowerCase()] = timestamp;
          }
        }
        this.saveCooldowns();
      }
    } catch (e) {
      console.error('Error loading cooldowns:', e);
      this.cooldowns = {};
    }
  }

  /**
   * Save cooldowns to localStorage
   */
  saveCooldowns() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cooldowns));
    } catch (e) {
      console.error('Error saving cooldowns:', e);
    }
  }

  /**
   * Get remaining cooldown time in milliseconds
   */
  getCooldownRemaining(address) {
    if (!address) return 0;
    
    const normalizedAddress = address.toLowerCase();
    const lastClaim = this.cooldowns[normalizedAddress];
    
    if (!lastClaim) return 0;
    
    const cooldownPeriod = this.faucetConfig?.cooldown || 86400000;
    const elapsed = Date.now() - lastClaim;
    const remaining = cooldownPeriod - elapsed;
    
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Format cooldown time for display
   */
  formatCooldownTime(address) {
    const remaining = this.getCooldownRemaining(address);
    
    if (remaining <= 0) return null;
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Check if address can claim
   */
  canClaim(address) {
    if (!address) return false;
    return this.getCooldownRemaining(address) === 0;
  }

  /**
   * Check if faucet is configured and ready
   */
  isConfigured() {
    return this.isInitialized && this.faucetConfig?.privateKey;
  }

  /**
   * Get faucet amount
   */
  getAmount() {
    return this.faucetConfig?.amount || '0.1';
  }

  /**
   * Claim tokens from faucet
   * @param {string} toAddress - Recipient wallet address
   * @returns {Promise<{success: boolean, message: string, txHash?: string}>}
   */
  async claimTokens(toAddress) {
    // Initialize if needed
    await this.init();

    // Check configuration
    if (!this.faucetConfig?.privateKey) {
      throw new Error('Faucet is not configured. Please set up faucet credentials.');
    }

    // Check cooldown
    if (!this.canClaim(toAddress)) {
      const remaining = this.formatCooldownTime(toAddress);
      throw new Error(`Please wait ${remaining} before claiming again.`);
    }

    try {
      // Connect to Somnia network
      const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
      
      // Create wallet from faucet private key
      const faucetWallet = new ethers.Wallet(this.faucetConfig.privateKey, provider);
      
      // Check faucet balance
      const balance = await provider.getBalance(faucetWallet.address);
      const amountToSend = ethers.parseEther(this.faucetConfig.amount);
      
      if (balance < amountToSend) {
        throw new Error('Faucet is empty. Please try again later.');
      }

      console.log(`Sending ${this.faucetConfig.amount} STT to ${toAddress}...`);

      // Send transaction
      const tx = await faucetWallet.sendTransaction({
        to: toAddress,
        value: amountToSend
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      // Update cooldown
      this.cooldowns[toAddress.toLowerCase()] = Date.now();
      this.saveCooldowns();

      // Add XP to profile
      ProfileService.addXP(toAddress, 25); // 25 XP for claiming
      ProfileService.updateStats(toAddress, 'faucetClaims');

      // Dispatch success event
      window.dispatchEvent(new CustomEvent('faucetClaimed', {
        detail: { 
          address: toAddress, 
          amount: this.faucetConfig.amount,
          txHash: tx.hash 
        }
      }));

      return {
        success: true,
        message: `Successfully sent ${this.faucetConfig.amount} STT!`,
        txHash: tx.hash
      };

    } catch (error) {
      console.error('Faucet claim error:', error);
      
      // Parse error message
      let message = error.message;
      if (message.includes('insufficient funds')) {
        message = 'Faucet wallet has insufficient funds.';
      } else if (message.includes('network')) {
        message = 'Network error. Please check your connection.';
      }
      
      throw new Error(message);
    }
  }

  /**
   * Get faucet wallet balance (for admin/debug)
   */
  async getFaucetBalance() {
    await this.init();
    
    if (!this.faucetConfig?.privateKey) {
      return null;
    }

    try {
      const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
      const faucetWallet = new ethers.Wallet(this.faucetConfig.privateKey, provider);
      const balance = await provider.getBalance(faucetWallet.address);
      return ethers.formatEther(balance);
    } catch (e) {
      console.error('Error getting faucet balance:', e);
      return null;
    }
  }
}

// Singleton instance
export const FaucetService = new FaucetServiceClass();
export default FaucetService;

