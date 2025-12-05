import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Background City
 * Koyu morumsu binalar - DAHA GÖRÜNÜR
 */
export class BackgroundCity {
  constructor(scene, occupiedZones) {
    this.scene = scene;
    this.occupiedZones = occupiedZones;
    this.instancedBuildings = null;
    
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
    this.createRoofNeonLines(buildingData);
    this.createSideNeonStrips(buildingData);
  }

  createInstancedBuildings(buildingData) {
    const count = buildingData.length;
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    // Koyu mor bina - DAHA AÇIK
    const material = new THREE.MeshLambertMaterial({
      color: CONFIG.colors.buildingBase
    });
    
    this.instancedBuildings = new THREE.InstancedMesh(geometry, material, count);
    this.instancedBuildings.castShadow = false;
    this.instancedBuildings.receiveShadow = true;
    
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    
    buildingData.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      this.instancedBuildings.setMatrixAt(i, dummy.matrix);
      
      // Mor tonları - DAHA GÖRÜNÜR
      const hue = 0.75 + Math.random() * 0.08;  // Mor
      const saturation = 0.4 + Math.random() * 0.2;
      const lightness = 0.12 + Math.random() * 0.08; // Daha açık
      color.setHSL(hue, saturation, lightness);
      this.instancedBuildings.setColorAt(i, color);
    });
    
    this.instancedBuildings.instanceMatrix.needsUpdate = true;
    this.instancedBuildings.instanceColor.needsUpdate = true;
    this.scene.add(this.instancedBuildings);
  }

  createRoofNeonLines(buildingData) {
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x9955dd,
      transparent: true,
      opacity: 0.8
    });
    
    buildingData.forEach(b => {
      const thickness = 0.3;
      const y = b.h + 0.1;
      
      // Ön kenar
      const frontLine = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, thickness, thickness),
        lineMat
      );
      frontLine.position.set(b.x, y, b.z + b.d / 2);
      this.scene.add(frontLine);
      
      // Arka kenar
      const backLine = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, thickness, thickness),
        lineMat
      );
      backLine.position.set(b.x, y, b.z - b.d / 2);
      this.scene.add(backLine);
      
      // Sol kenar
      const leftLine = new THREE.Mesh(
        new THREE.BoxGeometry(thickness, thickness, b.d),
        lineMat
      );
      leftLine.position.set(b.x - b.w / 2, y, b.z);
      this.scene.add(leftLine);
      
      // Sağ kenar
      const rightLine = new THREE.Mesh(
        new THREE.BoxGeometry(thickness, thickness, b.d),
        lineMat
      );
      rightLine.position.set(b.x + b.w / 2, y, b.z);
      this.scene.add(rightLine);
    });
  }

  createSideNeonStrips(buildingData) {
    const stripData = buildingData.filter(() => Math.random() > 0.7);
    
    if (stripData.length === 0) return;
    
    const colors = [0x7744cc, 0x5533aa, 0x8855dd, 0x6644bb];
    
    stripData.forEach(b => {
      const stripH = Math.random() * (b.h - 10) + 5;
      const stripColor = colors[Math.floor(Math.random() * colors.length)];
      
      const material = new THREE.MeshBasicMaterial({ 
        color: stripColor,
        transparent: true,
        opacity: 0.7
      });
      
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(b.w + 0.3, 0.5, b.d + 0.3),
        material
      );
      strip.position.set(b.x, stripH, b.z);
      this.scene.add(strip);
    });
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
  }
}

export default BackgroundCity;
