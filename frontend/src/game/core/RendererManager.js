import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Renderer Manager
 * Three.js renderer yönetimi
 * OPTIMIZED: Performans ayarları eklendi
 */
export class RendererManager {
  constructor(container = document.body) {
    this.container = container;
    this.renderer = this.createRenderer();
    this.container.appendChild(this.renderer.domElement);
  }

  createRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: CONFIG.performance.antialias,
      powerPreference: 'high-performance',
      stencil: false, // OPTIMIZE: Kullanılmıyorsa kapat
      depth: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // OPTIMIZE: Pixel ratio sınırlandırıldı
    renderer.setPixelRatio(CONFIG.performance.pixelRatio);
    
    // OPTIMIZE: Gölge ayarları
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap; // PCFSoftShadowMap -> BasicShadowMap
    
    // OPTIMIZE: Render ayarları
    renderer.sortObjects = true;
    renderer.info.autoReset = false; // Manuel reset için
    
    return renderer;
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  getDomElement() {
    return this.renderer.domElement;
  }

  // OPTIMIZE: Performans istatistikleri
  getStats() {
    const info = this.renderer.info;
    return {
      triangles: info.render.triangles,
      calls: info.render.calls,
      geometries: info.memory.geometries,
      textures: info.memory.textures
    };
  }

  resetStats() {
    this.renderer.info.reset();
  }

  dispose() {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

export default RendererManager;
