import * as THREE from 'three';

// Core
import { SceneManager } from './core/SceneManager.js';
import { CameraManager } from './core/CameraManager.js';
import { RendererManager } from './core/RendererManager.js';

// Entities
import { Player } from './entities/Player.js';
import { Building } from './entities/Building.js';

// World
import { CityBase } from './world/CityBase.js';
import { StreetLights } from './world/StreetLights.js';
import { Highways } from './world/Highways.js';
import { BackgroundCity } from './world/BackgroundCity.js';
import { ZoneManager } from './world/ZoneManager.js';
import { Billboards } from './world/Billboards.js';

// Systems
import { InputSystem } from './systems/InputSystem.js';
import { InteractionSystem } from './systems/InteractionSystem.js';

// Builders
import {
  buildSwapCity,
  buildLendingTower,
  buildMintLab,
  buildGoldFaucet
} from './builders/BuildingBuilders.js';

// Content
import {
  generateSwapContent,
  generateLendingContent,
  generateMintContent,
  generateFaucetContent
} from '../components/ModalContent.js';

// Config
import { CONFIG } from './config.js';
import { ProfileService } from '../services/ProfileService.js';

/**
 * Main Game Class
 * Coordinates all game systems
 */
export class Game {
  constructor(options = {}) {
    this.loader = options.loader;
    this.modal = options.modal;
    this.actionButton = options.actionButton;
    
    this.sceneManager = null;
    this.cameraManager = null;
    this.rendererManager = null;
    
    this.player = null;
    this.buildings = [];
    this.zoneManager = null;
    this.highways = null;
    this.billboards = null;
    
    this.inputSystem = null;
    this.interactionSystem = null;
    
    this.isRunning = false;
    this.animationId = null;
    this.clock = new THREE.Clock();
    
    this.lastPositionSave = 0;
    this.saveInterval = 5000; // Save every 5 seconds
  }

  async init() {
    // Initialize core systems
    this.sceneManager = new SceneManager();
    this.cameraManager = new CameraManager();
    this.rendererManager = new RendererManager();

    // Zone manager
    this.zoneManager = new ZoneManager();

    // Create world
    await this.createWorld();

    // Create player
    this.createPlayer();

    // Initialize input system
    this.inputSystem = new InputSystem();

    // Initialize interaction system
    this.interactionSystem = new InteractionSystem(
      this.cameraManager,
      this.actionButton,
      this.modal
    );
    this.interactionSystem.setBuildings(this.buildings);

    // Action button click handler
    this.actionButton.onClick = () => {
      if (this.interactionSystem.interact()) {
        this.inputSystem.disable();
      }
    };

    // Re-enable input when modal closes
    this.modal.setOnClose(() => {
      this.inputSystem.enable();
    });

    // Input Action (Enter Key)
    this.inputSystem.onAction(() => {
      if (this.interactionSystem.interact()) {
        this.inputSystem.disable();
      }
    });

    // Resize handler
    window.addEventListener('resize', () => this.onResize());

    // Hide loader
    if (this.loader) {
      this.loader.hide();
    }

    // Player Reset Logic on Wallet Changes
    window.addEventListener('walletConnected', (e) => {
      this.handleWalletConnected(e.detail);
    });

    window.addEventListener('walletDisconnected', () => {
      this.resetPlayerState();
    });
    
    // Save position before unload
    window.addEventListener('beforeunload', () => {
      this.savePlayerPosition();
    });

    return this;
  }

  async createWorld() {
    const scene = this.sceneManager.getScene();

    // City base
    new CityBase(scene);

    // Street lights
    new StreetLights(scene);

    // Highways
    this.highways = new Highways(scene);

    // Background buildings
    new BackgroundCity(scene, this.zoneManager.getOccupiedZones());

    // LED Billboards
    this.billboards = new Billboards(scene);
    await this.billboards.create();

    // Interactive buildings
    this.createInteractiveBuildings();
  }

  createInteractiveBuildings() {
    const scene = this.sceneManager.getScene();
    const dist = CONFIG.city.buildingDistance;

    // SWAP CITY
    const swapBuilding = new Building({
      x: dist,
      z: -dist,
      color: CONFIG.colors.neonBlue,
      title: 'SWAP CITY',
      subtitle: 'CENTRAL EXCHANGE',
      type: 'SWAP',
      builderFn: buildSwapCity,
      contentGenerator: generateSwapContent
    });
    scene.add(swapBuilding.getMesh());
    this.buildings.push(swapBuilding);

    // LENDING TOWER
    const lendingBuilding = new Building({
      x: -dist,
      z: -dist,
      color: CONFIG.colors.neonPink,
      title: 'LENDING TOWER',
      subtitle: 'LIQUIDITY POOL',
      type: 'LEND',
      builderFn: buildLendingTower,
      contentGenerator: generateLendingContent
    });
    scene.add(lendingBuilding.getMesh());
    this.buildings.push(lendingBuilding);

    // MINT LAB
    const mintBuilding = new Building({
      x: dist,
      z: dist,
      color: CONFIG.colors.neonGreen,
      title: 'MINT LAB',
      subtitle: 'NFT CREATOR',
      type: 'MINT',
      builderFn: buildMintLab,
      contentGenerator: generateMintContent
    });
    scene.add(mintBuilding.getMesh());
    this.buildings.push(mintBuilding);

    // GOLD FAUCET
    const faucetBuilding = new Building({
      x: -dist,
      z: dist,
      color: CONFIG.colors.gold,
      title: 'GOLD FAUCET',
      subtitle: 'DAILY REWARDS',
      type: 'CLAIM',
      builderFn: buildGoldFaucet,
      contentGenerator: generateFaucetContent
    });
    scene.add(faucetBuilding.getMesh());
    this.buildings.push(faucetBuilding);
  }

  createPlayer() {
    this.player = new Player();
    this.sceneManager.add(this.player.getMesh());
  }

  handleWalletConnected(detail) {
    const { profile } = detail;
    
    console.log('Wallet Connected. Profile Data:', profile);
    
    if (this.player && profile) {
      // Check if profile has saved position
      // FIX: Don't check for 0.1 threshold, load whatever is saved
      if (profile.position && typeof profile.position.x === 'number') {
        
        const x = Number(profile.position.x);
        const z = Number(profile.position.z);

        // If saved position is exactly 0,0,0 (spawn), it's fine to load it
        this.player.getMesh().position.set(x, 0, z);
        this.cameraManager.followTarget(this.player.getPosition());
        
        // Sync local saved pos so we don't re-save immediately
        this.lastSavedPos = { x, y: 0, z };
        
        console.log('Player LOADED at saved position:', {x, z});
      } else {
        // No saved position object -> Reset to start
        console.log('No valid position data. Resetting to spawn.');
        this.resetPlayerState(profile);
      }

      // Apply visuals
      if (profile.visual_config) {
        // TODO: Implement visual updates
      }
    }
  }

  /**
   * Resets player position to spawn
   */
  resetPlayerState(profileData = null) {
    if (this.player) {
      this.player.resetPosition();
      this.cameraManager.followTarget(this.player.getPosition());
      console.log('Player reset to spawn point.');
    }
  }

  start() {
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  animate() {
    if (!this.isRunning) return;
    
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    const now = Date.now();

    // Update player movement
    this.updatePlayer();

    // Save position periodically if connected
    if (now - this.lastPositionSave > this.saveInterval) {
      this.savePlayerPosition();
      this.lastPositionSave = now;
    }

    // Update highway cars
    if (this.highways) {
      this.highways.update();
    }

    // Update billboards
    if (this.billboards) {
      this.billboards.update(deltaTime);
    }

    // Update building animations
    this.buildings.forEach(building => building.update());

    // Check interactions
    this.interactionSystem.update(this.player.getPosition());

    // Render
    this.rendererManager.render(
      this.sceneManager.getScene(),
      this.cameraManager.getCamera()
    );
  }

  updatePlayer() {
    if (this.modal.isOpen) return;

    const { dx, dz, isMoving } = this.inputSystem.getMovement();
    
    if (isMoving) {
      this.player.move(dx, dz);
      this.cameraManager.followTarget(this.player.getPosition());
    } else {
      this.player.animateWalk(false);
    }
  }
  
  savePlayerPosition() {
    const profile = ProfileService.getCurrentProfile();
    // Only save if we have a profile AND the player is active
    if (profile && this.player) {
      const pos = this.player.getPosition();
      const posData = { x: pos.x, y: pos.y, z: pos.z };
      
      // Optimization: Don't save if didn't move significantly since last save
      if (this.lastSavedPos && 
          Math.abs(this.lastSavedPos.x - pos.x) < 0.5 && 
          Math.abs(this.lastSavedPos.z - pos.z) < 0.5) {
        return;
      }

      console.log('Saving player position:', posData);
      ProfileService.updatePosition(profile.wallet_address, posData);
      this.lastSavedPos = { ...posData };
    }
  }

  onResize() {
    this.cameraManager.onResize();
    this.rendererManager.onResize();
  }

  dispose() {
    this.stop();
    if (this.highways) {
      this.highways.dispose();
    }
    this.rendererManager.dispose();
  }
}

export default Game;
