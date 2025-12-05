/**
 * SomiVerse - Cyberpunk Metropolis
 * Ana giriş noktası
 */

import './styles/main.css';

import { Game } from './game/Game.js';
import { Loader } from './components/Loader.js';
import { Modal } from './components/Modal.js';
import { ActionButton } from './components/ActionButton.js';

async function main() {
  // UI componentlarını oluştur
  const loader = new Loader();
  const modal = new Modal();
  const actionButton = new ActionButton();

  // Oyunu başlat
  const game = new Game({
    loader,
    modal,
    actionButton
  });

  await game.init();
  game.start();

  // Global erişim için (debug)
  window.game = game;
}

// Sayfa yüklenince başlat
document.addEventListener('DOMContentLoaded', main);

