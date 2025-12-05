import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Background City
 * Arka plan binaları ve dolgu yapılar
 */
export class BackgroundCity {
  constructor(scene, occupiedZones) {
    this.scene = scene;
    this.occupiedZones = occupiedZones;
    this.instancedBuildings = null;
    this.neonStrips = null;
    
    this.create();
  }

  create() {
    const { backgroundCount, spawnRange } = CONFIG.buildings;
    
    const buildingData = [];
    let attempts = 0;
    const maxAttempts = backgroundCount * 3;
    
    while (buildingData.length < backgroundCount && attempts < maxAttempts) {
      attempts++;
      
      const x = (Math.random() - 0.5) * spawnRange;
      const z = (Math.random() - 0.5) * spawnRange;
      const w = 8 + Math.random() * 10;
      const d = 8 + Math.random() * 10;
      const h = 15 + Math.random() * 40;

      if (!this.checkCollision(x, z, w, d)) {
        buildingData.push({ x, z, w, d, h });
        this.occupiedZones.push({ x, z, w: w + 5, d: d + 5 });
      }
    }

    this.createInstancedBuildings(buildingData);
    this.createNeonStrips(buildingData);
  }

  createInstancedBuildings(buildingData) {
    const count = buildingData.length;
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    const material = new THREE.MeshLambertMaterial({
      color: CONFIG.colors.buildingBase
    });
    
    this.instancedBuildings = new THREE.InstancedMesh(geometry, material, count);
    this.instancedBuildings.castShadow = false;
    this.instancedBuildings.receiveShadow = true;
    
    const dummy = new THREE.Object3D();
    
    buildingData.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      this.instancedBuildings.setMatrixAt(i, dummy.matrix);
    });
    
    this.instancedBuildings.instanceMatrix.needsUpdate = true;
    this.scene.add(this.instancedBuildings);
  }

  createNeonStrips(buildingData) {
    // %20'sine neon ekle
    const stripData = buildingData.filter(() => Math.random() > 0.8);
    
    if (stripData.length === 0) return;
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x330033 });
    
    this.neonStrips = new THREE.InstancedMesh(geometry, material, stripData.length);
    
    const dummy = new THREE.Object3D();
    
    stripData.forEach((b, i) => {
      const stripH = Math.random() * (b.h - 5) + 2;
      dummy.position.set(b.x, stripH, b.z);
      dummy.scale.set(b.w + 0.2, 1, b.d + 0.2);
      dummy.updateMatrix();
      this.neonStrips.setMatrixAt(i, dummy.matrix);
    });
    
    this.neonStrips.instanceMatrix.needsUpdate = true;
    this.scene.add(this.neonStrips);
  }

  checkCollision(x, z, w, d) {
    for (const zone of this.occupiedZones) {
      const overlapX = Math.abs(x - zone.x) < (w + zone.w) / 2;
      const overlapZ = Math.abs(z - zone.z) < (d + zone.d) / 2;
      if (overlapX && overlapZ) return true;
    }
    return false;
  }

  dispose() {
    if (this.instancedBuildings) {
      this.instancedBuildings.geometry.dispose();
      this.instancedBuildings.material.dispose();
      this.scene.remove(this.instancedBuildings);
    }
    if (this.neonStrips) {
      this.neonStrips.geometry.dispose();
      this.neonStrips.material.dispose();
      this.scene.remove(this.neonStrips);
    }
  }
}

export default BackgroundCity;
