import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Scene Manager
 * Three.js sahne yönetimi ve ışıklandırma
 */
export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.colors.bg);
    
    // Fog ekle - uzak objeler render edilmez
    this.scene.fog = new THREE.Fog(CONFIG.colors.bg, 100, 300);
    
    this.setupLighting();
  }

  setupLighting() {
    // Ambient Light - ana aydınlatma
    const ambient = new THREE.AmbientLight(0x404060, 1.5);
    this.scene.add(ambient);

    // Hemisphere Light - doğal aydınlatma
    const hemi = new THREE.HemisphereLight(0x606080, 0x404040, 0.5);
    this.scene.add(hemi);

    // Directional Light (Güneş)
    this.sun = new THREE.DirectionalLight(0xffaaee, 1.0);
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
