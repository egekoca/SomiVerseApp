/**
 * Loader Component
 * Loading screen with SomiVerse logo
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Loader {
  constructor() {
    this.element = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.model = null;
    this.animationId = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'loader';
    this.element.innerHTML = `
      <div class="loader-bg"></div>
      <div class="loader-content">
        <img src="/Somi.png" alt="SomiVerse" class="loader-logo" style="display: block; width: 400px; max-width: 80vw; height: auto; margin-bottom: 20px;" />
        <div class="loader-text">CONNECTING TO SYSTEM...</div>
        <div class="loader-bar-container" style="display: flex; align-items: center; justify-content: center; gap: 20px;">
          <div id="loader-3d-container" style="width: 60px; height: 60px; position: relative; flex-shrink: 0;"></div>
          <div class="loader-bar"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.element);
    
    // Initialize 3D scene
    this.init3DScene();
    
    // Debug: Check if image is loaded
    const img = this.element.querySelector('.loader-logo');
    if (img) {
      img.onerror = () => {
        console.error('Failed to load Somi.png');
      };
      img.onload = () => {
        console.log('Somi.png loaded successfully');
      };
    }
  }

  init3DScene() {
    const container = this.element.querySelector('#loader-3d-container');
    if (!container) return;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent background

    // Create camera
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.set(0, 0, 10);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(60, 60);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Add lights (brighter for better visibility)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
    
    // Add point light for better visibility
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 0, 10);
    this.scene.add(pointLight);

    // Load 3D model
    const loader = new GLTFLoader();
    loader.load(
      '/base.glb',
      (gltf) => {
        this.model = gltf.scene.clone();
        
        // Scale the model
        this.model.scale.set(3, 3, 3);
        
        // Center the model
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        
        // Make it red
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({ 
              color: 0xff0000, // Red color
              emissive: 0xff0000,
              emissiveIntensity: 0.8,
              metalness: 0.5,
              roughness: 0.3
            });
            child.frustumCulled = false;
          }
        });
        
        this.scene.add(this.model);
        this.animate();
      },
      undefined,
      (error) => {
        console.error('Error loading 3D logo:', error);
        // Fallback: create a simple rotating geometry (red torus)
        const geometry = new THREE.TorusGeometry(2, 0.4, 16, 100);
        const material = new THREE.MeshStandardMaterial({ 
          color: 0xff0000, // Red color
          emissive: 0xff0000,
          emissiveIntensity: 0.8
        });
        this.model = new THREE.Mesh(geometry, material);
        this.scene.add(this.model);
        this.animate();
      }
    );
  }

  animate() {
    if (!this.renderer || !this.scene || !this.camera) return;
    
    this.animationId = requestAnimationFrame(() => this.animate());
    
    if (this.model) {
      this.model.rotation.y += 0.01; // Rotate continuously
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  hide(delay = 1500) {
    setTimeout(() => {
      this.element.classList.add('hidden');
    }, delay);
  }

  show() {
    this.element.classList.remove('hidden');
  }

  setText(text) {
    const textEl = this.element.querySelector('.loader-text');
    if (textEl) {
      textEl.textContent = text;
    }
  }

  destroy() {
    this.stopAnimation();
    
    if (this.renderer) {
      this.renderer.dispose();
      const canvas = this.renderer.domElement;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
    
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
    
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

export default Loader;
