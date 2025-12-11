import { ProfileService } from '../../services/ProfileService.js';

/**
 * PlayerManager
 * Handles all player-related operations
 */
export class PlayerManager {
  constructor(player, cameraManager, modal) {
    this.player = player;
    this.cameraManager = cameraManager;
    this.modal = modal;
    this.currentSomName = null;
  }

  update(inputSystem, collisionSystem) {
    if (this.modal.isOpen) return;

    const { dx, dz, isMoving } = inputSystem.getMovement();
    
    if (isMoving) {
      const currentPos = this.player.getPosition();
      const nextX = currentPos.x + dx;
      const nextZ = currentPos.z + dz;

      // Check for collision at new position
      if (!collisionSystem.checkCollision(nextX, nextZ)) {
        // Safe to move
        this.player.move(dx, dz);
      } else {
        // Collision detected! Try sliding
        let moved = false;

        // Try moving X only
        if (dx !== 0 && !collisionSystem.checkCollision(nextX, currentPos.z)) {
          this.player.move(dx, 0);
          moved = true;
        } 
        // Try moving Z only
        else if (dz !== 0 && !collisionSystem.checkCollision(currentPos.x, nextZ)) {
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


  handleWalletConnected(detail) {
    const { profile, somName } = detail;
    
    // Store somName for later use
    this.currentSomName = somName || null;
    
    if (this.player && profile) {
      // Always start at spawn point (0, 0, 0)
      this.resetPlayerState(profile);

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

  getCurrentSomName() {
    return this.currentSomName;
  }

  setCurrentSomName(name) {
    this.currentSomName = name;
  }
}

