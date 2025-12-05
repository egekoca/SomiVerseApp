/**
 * SomiVerse - Cyberpunk Metropolis
 * Main entry point
 */

import './styles/main.css';

import { Game } from './game/Game.js';
import { Loader } from './components/Loader.js';
import { Modal } from './components/Modal.js';
import { ActionButton } from './components/ActionButton.js';

async function main() {
  // Create UI components
  const loader = new Loader();
  const modal = new Modal();
  const actionButton = new ActionButton();

  // Initialize game
  const game = new Game({
    loader,
    modal,
    actionButton
  });

  await game.init();
  game.start();

  // Global access for debugging
  window.game = game;
}

// Start when page loads
document.addEventListener('DOMContentLoaded', main);
