import { CONFIG } from '../config.js';

/**
 * CollisionSystem
 * Handles collision detection
 */
export class CollisionSystem {
  constructor() {
    this.physicsColliders = [];
  }

  addCollider(collider) {
    this.physicsColliders.push(collider);
  }

  addColliders(colliders) {
    this.physicsColliders.push(...colliders);
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

  getColliders() {
    return this.physicsColliders;
  }
}

