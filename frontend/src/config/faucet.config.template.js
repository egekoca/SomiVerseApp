/**
 * Faucet Configuration Template
 * Copy this file to faucet.config.local.js and fill in your values
 * DO NOT commit faucet.config.local.js to git!
 */
export const FAUCET_CONFIG = {
  // Private key of the faucet wallet (holds STT to distribute)
  privateKey: 'YOUR_PRIVATE_KEY_HERE',
  
  // Amount of STT to send per claim
  amount: '0.1',
  
  // Cooldown in milliseconds (default: 24 hours)
  cooldown: 86400000
};
