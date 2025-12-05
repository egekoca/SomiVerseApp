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
    
    this.inputSystem = null;
    this.interactionSystem = null;
    
    this.isRunning = false;
    this.animationId = null;
  }

  async init() {
    // Initialize core systems
    this.sceneManager = new SceneManager();
    this.cameraManager = new CameraManager();
    this.rendererManager = new RendererManager();

    // Zone manager
    this.zoneManager = new ZoneManager();

    // Create world
    this.createWorld();

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

    // Resize handler
    window.addEventListener('resize', () => this.onResize());

    // Hide loader
    if (this.loader) {
      this.loader.hide();
    }

    return this;
  }

  createWorld() {
    const scene = this.sceneManager.getScene();

    // City base
    new CityBase(scene);

    // Street lights
    new StreetLights(scene);

    // Highways
    this.highways = new Highways(scene);

    // Background buildings
    new BackgroundCity(scene, this.zoneManager.getOccupiedZones());

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

    // Update player movement
    this.updatePlayer();

    // Update highway cars
    if (this.highways) {
      this.highways.update();
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
