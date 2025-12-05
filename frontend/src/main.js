/**
 * SomiVerse - Cyberpunk Metropolis
 * Main entry point
 */

import './styles/main.css';

import { Game } from './game/Game.js';
import { Loader } from './components/Loader.js';
import { Modal } from './components/Modal.js';
import { ActionButton } from './components/ActionButton.js';
import { WalletButton } from './components/WalletButton.js';
import { ProfileModal } from './components/ProfileModal.js';
import { ProfileService } from './services/ProfileService.js';

async function main() {
  // Create UI components
  const loader = new Loader();
  const modal = new Modal();
  const actionButton = new ActionButton();
  const profileModal = new ProfileModal();
  const walletButton = new WalletButton(profileModal);

  // Initialize game
  const game = new Game({
    loader,
    modal,
    actionButton
  });

  await game.init();
  game.start();

  // Wallet connection events
  window.addEventListener('walletConnected', (e) => {
    console.log('Wallet connected:', e.detail.account);
    console.log('Profile:', e.detail.profile);
  });

  window.addEventListener('walletDisconnected', () => {
    console.log('Wallet disconnected');
  });

  // XP events
  window.addEventListener('xpGained', (e) => {
    console.log(`+${e.detail.amount} XP! Total: ${e.detail.totalXP} (Level ${e.detail.level})`);
  });

  // Global access for debugging
  window.game = game;
  window.wallet = walletButton;
  window.profile = ProfileService;
}

// Start when page loads
document.addEventListener('DOMContentLoaded', main);
