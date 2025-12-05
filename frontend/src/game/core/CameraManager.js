import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Camera Manager
 * Orthographic kamera yönetimi
 */
export class CameraManager {
  constructor() {
    this.d = CONFIG.camera.distance;
    this.camera = this.createCamera();
  }

  createCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.OrthographicCamera(
      -this.d * aspect,
      this.d * aspect,
      this.d,
      -this.d,
      1,
      1000
    );
    
    const { x, y, z } = CONFIG.camera.positionOffset;
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    
    return camera;
  }

  followTarget(targetPosition, smoothing = 0.1) {
    const { x, z } = CONFIG.camera.positionOffset;
    
    this.camera.position.x += (targetPosition.x + x - this.camera.position.x) * smoothing;
    this.camera.position.z += (targetPosition.z + z - this.camera.position.z) * smoothing;
    this.camera.lookAt(targetPosition.x, 0, targetPosition.z);
  }

  onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left = -this.d * aspect;
    this.camera.right = this.d * aspect;
    this.camera.top = this.d;
    this.camera.bottom = -this.d;
    this.camera.updateProjectionMatrix();
  }

  getCamera() {
    return this.camera;
  }
}

export default CameraManager;

