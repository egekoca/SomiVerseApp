import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Car Entity
 * Otoyolda hareket eden arabalar
 * NOT: Bu sınıf artık doğrudan kullanılmıyor
 * Highways.js içinde InstancedMesh kullanılıyor
 * Geriye dönük uyumluluk için tutuluyor
 */
export class Car {
  constructor(path) {
    this.path = path;
    this.t = 0;
    this.speed = CONFIG.highways.minSpeed + Math.random() * (CONFIG.highways.maxSpeed - CONFIG.highways.minSpeed);
    
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.8, 0.8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
  }

  update() {
    this.t += this.speed;
    if (this.t > 1) this.t = 0;
    
    const pos = this.path.getPointAt(this.t);
    this.mesh.position.copy(pos);
    
    const tangent = this.path.getTangentAt(this.t);
    this.mesh.lookAt(pos.clone().add(tangent));
  }

  getMesh() {
    return this.mesh;
  }

  isComplete() {
    return this.t >= 1;
  }
}

/**
 * Car Manager - DEPRECATED
 * Artık Highways.js içinde InstancedMesh kullanılıyor
 */
export class CarManager {
  constructor(scene, path) {
    console.warn('CarManager is deprecated. Use Highways class instead.');
    this.scene = scene;
    this.path = path;
    this.cars = [];
  }

  update() {
    this.cars.forEach(car => car.update());
  }

  dispose() {
    this.cars.forEach(car => {
      this.scene.remove(car.getMesh());
    });
    this.cars = [];
  }
}

export default Car;
