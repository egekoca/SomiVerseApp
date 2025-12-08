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
import { HugeBillboards } from './world/HugeBillboards.js';

// Systems
import { InputSystem } from './systems/InputSystem.js';
import { InteractionSystem } from './systems/InteractionSystem.js';

// Builders
import {
  buildSwapCity,
  buildLendingTower,
  buildMintLab,
  buildGoldFaucet,
  buildDomainHub
} from './builders/BuildingBuilders.js';

// Content
import {
  generateSwapContent,
  generateLendingContent,
  generateMintContent,
  generateFaucetContent,
  generateDomainContent
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
    this.hugeBillboards = null;
    
    this.inputSystem = null;
    this.interactionSystem = null;
    
    this.isRunning = false;
    this.animationId = null;
    this.clock = new THREE.Clock();
    
    this.lastPositionSave = 0;
    this.saveInterval = 5000; // Save every 5 seconds

    this.physicsColliders = []; // Store collision boxes for physics

    // Raycaster for click interactions
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Somnia domain name for current player
    this.currentSomName = null;
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

    // Click handler for scene interactions (e.g. billboards)
    window.addEventListener('click', (e) => this.onSceneClick(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

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
    
    // Update player label on XP gain
    window.addEventListener('xpGained', (e) => {
      const { totalXP, level } = e.detail;
      // We need the address, getting it from current profile service
      const profile = ProfileService.getCurrentProfile();
      if (profile) {
        // Update profile object with new level/xp for the label check
        profile.level = level;
        profile.xp = totalXP;
        // Use stored somName (already set in handleWalletConnected)
        this.updatePlayerLabel(profile, this.currentSomName);
      }
    });

    // Save position before unload
    window.addEventListener('beforeunload', () => {
      this.savePlayerPosition();
    });

    return this;
  }

  onSceneClick(event) {
    if (this.modal.isOpen) return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.cameraManager.getCamera());

    // Check intersections with huge billboards
    if (this.hugeBillboards) {
      const meshes = this.hugeBillboards.getBillboards();
      const intersects = this.raycaster.intersectObjects(meshes, true);

      for (let i = 0; i < intersects.length; i++) {
        // Traverse up to find user data
        let obj = intersects[i].object;
        while (obj) {
          if (obj.userData && obj.userData.isLink) {
            window.open(obj.userData.url, '_blank');
            return;
          }
          obj = obj.parent;
        }
      }
    }
  }

  onMouseMove(event) {
    if (this.modal.isOpen || !this.hugeBillboards) return;

    // Calculate mouse position
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.cameraManager.getCamera());

    const meshes = this.hugeBillboards.getBillboards();
    const intersects = this.raycaster.intersectObjects(meshes, true);
    
    let isHoveringLink = false;
    for (let i = 0; i < intersects.length; i++) {
      let obj = intersects[i].object;
      while (obj) {
        if (obj.userData && obj.userData.isLink) {
          isHoveringLink = true;
          break;
        }
        obj = obj.parent;
      }
      if (isHoveringLink) break;
    }

    // Change cursor style
    document.body.style.cursor = isHoveringLink ? 'pointer' : 'default';
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
    const bgCity = new BackgroundCity(scene, this.zoneManager.getOccupiedZones());
    // Add background buildings to physics collision
    this.physicsColliders.push(...bgCity.getColliders());

    // LED Billboards
    this.billboards = new Billboards(scene);
    await this.billboards.create();

    // Huge Boundary Billboards
    this.hugeBillboards = new HugeBillboards(scene);
    await this.hugeBillboards.create();

    // Interactive buildings
    this.createInteractiveBuildings();
  }

  createInteractiveBuildings() {
    const scene = this.sceneManager.getScene();
    const dist = CONFIG.city.buildingDistance;
    const domainX = -dist * 3; // further left of faucet lane
    const domainZ = dist;

    // Add Main Building Colliders (Box 30x30)
    // These are slightly larger than meshes to prevent walking into base rings
    const mainColliderSize = 30;
    this.physicsColliders.push(
      { x: dist, z: -dist, w: mainColliderSize, d: mainColliderSize }, // Swap
      { x: -dist, z: -dist, w: mainColliderSize, d: mainColliderSize }, // Lend
      { x: dist, z: dist, w: mainColliderSize, d: mainColliderSize }, // Mint
      { x: -dist, z: dist, w: mainColliderSize, d: mainColliderSize }, // Faucet
      { x: domainX, z: domainZ, w: mainColliderSize, d: mainColliderSize } // Domain
    );

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
      title: 'STT FAUCET',
      subtitle: 'DAILY REWARDS',
      type: 'CLAIM',
      builderFn: buildGoldFaucet,
      contentGenerator: generateFaucetContent
    });
    scene.add(faucetBuilding.getMesh());
    this.buildings.push(faucetBuilding);

    // SOMNIA DOMAIN SERVICE (center hub)
    const domainBuilding = new Building({
      x: domainX,
      z: domainZ,
      color: CONFIG.colors.neonPurple,
      title: 'SOMNIA DOMAIN SERVICE',
      subtitle: 'GET YOUR .SOMI',
      type: 'DOMAIN',
      builderFn: buildDomainHub,
      contentGenerator: generateDomainContent
    });
    scene.add(domainBuilding.getMesh());
    this.buildings.push(domainBuilding);
  }

  createPlayer() {
    this.player = new Player();
    this.sceneManager.add(this.player.getMesh());
  }

  handleWalletConnected(detail) {
    const { profile, somName } = detail;
    
    // Store somName for later use
    this.currentSomName = somName || null;
    
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

      // Update Name Label with Somnia domain support
      this.updatePlayerLabel(profile, somName);
    }
  }

  updatePlayerLabel(profile, somName = null) {
    if (!this.player || !profile) return;

    // Use passed somName or fallback to stored value
    const displaySomName = somName || this.currentSomName;

    const level = parseInt(profile.level || 1);
    let labelColor = '#00ffff'; // Default Cyan
    
    // Level 5+ Logic: Change character visuals to Orange
    if (level >= 5) {
      labelColor = '#ffaa00'; // Neon Orange
      this.player.setNeonColor(0xffaa00);
    } else {
      this.player.setNeonColor(0x00ffff);
    }
    
    // Show label for all levels
    const addr = profile.wallet_address;
    if (addr) {
      // Use Somnia domain name if available, otherwise shortened address
      const displayName = displaySomName || `${addr.slice(0, 6)}...${addr.slice(-4)}`;
      this.player.createNameLabel(displayName, labelColor);
    }
  }

  /**
   * Resets player position to spawn
   */
  resetPlayerState(profileData = null) {
    // Clear Somnia domain name
    this.currentSomName = null;
    
    if (this.player) {
      this.player.resetPosition();
      this.player.removeNameLabel();
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

  checkCollision(x, z) {
    const playerSize = 2; // Approximate character width/depth
    const mapLimit = CONFIG.city.mapLimit;
    
    // Check map boundaries
    if (Math.abs(x) > mapLimit || Math.abs(z) > mapLimit) {
      return true;
    }
    
    // Check building collisions
    for (const box of this.physicsColliders) {
      if (Math.abs(x - box.x) < (box.w + playerSize) / 2 &&
          Math.abs(z - box.z) < (box.d + playerSize) / 2) {
        return true;
      }
    }
    return false;
  }

  updatePlayer() {
    if (this.modal.isOpen) return;

    const { dx, dz, isMoving } = this.inputSystem.getMovement();
    
    if (isMoving) {
      const currentPos = this.player.getPosition();
      const nextX = currentPos.x + dx;
      const nextZ = currentPos.z + dz;

      // Check for collision at new position
      if (!this.checkCollision(nextX, nextZ)) {
        // Safe to move
        this.player.move(dx, dz);
      } else {
        // Collision detected! Try sliding
        let moved = false;

        // Try moving X only
        if (dx !== 0 && !this.checkCollision(nextX, currentPos.z)) {
          this.player.move(dx, 0);
          moved = true;
        } 
        // Try moving Z only
        else if (dz !== 0 && !this.checkCollision(currentPos.x, nextZ)) {
          this.player.move(0, dz);
          moved = true;
        }

        // If neither worked, we are stuck or running into a corner. 
        // We still need to update rotation to face the input direction even if blocked
        if (!moved) {
          // Manually update rotation to face input
          this.player.getMesh().rotation.y = Math.atan2(dx, dz);
          this.player.animateWalk(true); // Keep walking animation running "against wall"
        }
      }
      
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
