import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Scene Manager
 * Daha aydınlık - morumsu atmosfer
 */
export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.colors.bg);
    
    this.setupLighting();
  }

  setupLighting() {
    // Ambient Light - GÜÇLÜ morumsu
    const ambient = new THREE.AmbientLight(0x4a3860, 3.0);
    this.scene.add(ambient);

    // Hemisphere Light - mor gökyüzü
    const hemi = new THREE.HemisphereLight(0x5544aa, 0x2a1a40, 1.2);
    this.scene.add(hemi);

    // Directional Light (Ana ışık)
    this.sun = new THREE.DirectionalLight(0xccaaff, 1.0);
    this.sun.position.set(-50, 100, -50);
    this.sun.castShadow = true;
    
    const shadowSize = CONFIG.performance.shadowMapSize;
    this.sun.shadow.mapSize.width = shadowSize;
    this.sun.shadow.mapSize.height = shadowSize;
    
    this.sun.shadow.camera.left = -80;
    this.sun.shadow.camera.right = 80;
    this.sun.shadow.camera.top = 80;
    this.sun.shadow.camera.bottom = -80;
    this.sun.shadow.camera.near = 10;
    this.sun.shadow.camera.far = 200;
    this.sun.shadow.bias = -0.001;
    
    this.scene.add(this.sun);
    
    // Ek mor atmosfer ışığı
    const purpleLight = new THREE.PointLight(0x6633aa, 1.5, 300);
    purpleLight.position.set(0, 80, 0);
    this.scene.add(purpleLight);
  }

  add(object) {
    this.scene.add(object);
  }

  remove(object) {
    this.scene.remove(object);
  }

  getScene() {
    return this.scene;
  }
}

export default SceneManager;
