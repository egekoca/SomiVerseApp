import * as THREE from 'three';

// Core
import { SceneManager } from './core/SceneManager.js';
import { CameraManager } from './core/CameraManager.js';
import { RendererManager } from './core/RendererManager.js';

// Entities
import { Player } from './entities/Player.js';
import { Building } from './entities/Building.js';

// World
import { ZoneManager } from './world/ZoneManager.js';

// Systems
import { InputSystem } from './systems/InputSystem.js';
import { InteractionSystem } from './systems/InteractionSystem.js';
import { PlayerManager } from './systems/PlayerManager.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { WorldManager } from './systems/WorldManager.js';

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
    this.zoneManager = null;
    
    this.inputSystem = null;
    this.interactionSystem = null;
    this.playerManager = null;
    this.collisionSystem = null;
    this.worldManager = null;
    
    this.isRunning = false;
    this.animationId = null;
    this.clock = new THREE.Clock();

    // Raycaster for click interactions
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  async init() {
    // Initialize core systems
    this.sceneManager = new SceneManager();
    this.cameraManager = new CameraManager();
    this.rendererManager = new RendererManager();

    // Zone manager
    this.zoneManager = new ZoneManager();

    // Initialize collision system
    this.collisionSystem = new CollisionSystem();

    // Initialize world manager
    this.worldManager = new WorldManager(this.sceneManager.getScene(), this.zoneManager);
    await this.worldManager.create();
    
    // Add physics colliders from world
    this.collisionSystem.addColliders(this.worldManager.getPhysicsColliders());

    // Create player
    this.createPlayer();

    // Initialize player manager
    this.playerManager = new PlayerManager(this.player, this.cameraManager, this.modal);

    // Initialize input system
    this.inputSystem = new InputSystem();

    // Initialize interaction system
    this.interactionSystem = new InteractionSystem(
      this.cameraManager,
      this.actionButton,
      this.modal
    );
    this.interactionSystem.setBuildings(this.worldManager.getBuildings());

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

    // Listen for primary domain changes
    window.addEventListener('primaryDomainSet', async (e) => {
      const { domain } = e.detail;
      console.log('Primary domain set:', domain);
      
      // Update stored somName
      if (this.playerManager) {
        this.playerManager.setCurrentSomName(domain);
        
        // Update player label if profile exists
        const profile = ProfileService.getCurrentProfile();
        if (profile && this.player) {
          this.playerManager.updatePlayerLabel(profile, domain);
        }
      }
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
      if (this.playerManager) {
        this.playerManager.updatePlayerLabel(profile, this.playerManager.getCurrentSomName());
      }
      }
    });

    // Save position before unload
    window.addEventListener('beforeunload', () => {
      if (this.playerManager && this.collisionSystem) {
        this.playerManager.savePosition(this.collisionSystem.getColliders());
      }
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
    const hugeBillboards = this.worldManager?.getHugeBillboards();
    if (hugeBillboards) {
      const meshes = hugeBillboards.getBillboards();
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
    const hugeBillboards = this.worldManager?.getHugeBillboards();
    if (this.modal.isOpen || !hugeBillboards) return;

    // Calculate mouse position
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.cameraManager.getCamera());

    const meshes = hugeBillboards.getBillboards();
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


  createPlayer() {
    this.player = new Player();
    this.sceneManager.add(this.player.getMesh());
  }

  handleWalletConnected(detail) {
    if (this.playerManager) {
      this.playerManager.handleWalletConnected(detail);
    }
  }

  resetPlayerState(profileData = null) {
    if (this.playerManager) {
      this.playerManager.resetPlayerState(profileData);
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
    if (this.playerManager && this.collisionSystem) {
      this.playerManager.update(this.inputSystem, this.collisionSystem);
    }

    // Save position periodically if connected
    if (this.playerManager && this.playerManager.shouldSavePosition(now)) {
      this.playerManager.savePosition(this.collisionSystem.getColliders());
      this.playerManager.markPositionSaved(now);
    }

    // Update world (highways, billboards, buildings)
    if (this.worldManager) {
      this.worldManager.update(deltaTime);
    }

    // Check interactions
    if (this.player) {
      this.interactionSystem.update(this.player.getPosition());
    }

    // Render
    this.rendererManager.render(
      this.sceneManager.getScene(),
      this.cameraManager.getCamera()
    );
  }


  onResize() {
    this.cameraManager.onResize();
    this.rendererManager.onResize();
  }

  dispose() {
    this.stop();
    if (this.worldManager) {
      this.worldManager.dispose();
    }
    this.rendererManager.dispose();
  }
}

export default Game;
