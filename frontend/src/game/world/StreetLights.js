import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Street Lights
 * Mor tonlu sokak lambaları
 */
export class StreetLights {
  constructor(scene) {
    this.scene = scene;
    this.instancedPoles = null;
    this.instancedHeads = null;
    this.instancedBulbs = null;
    this.lightCount = 0;
    this.positions = [];
    
    this.create();
  }

  create() {
    const roadPositions = [0, CONFIG.city.sideRoadDistance, -CONFIG.city.sideRoadDistance];
    const { spacing, offset, range } = CONFIG.streetLights;
    
    roadPositions.forEach(x => {
      for (let z = -range; z <= range; z += spacing) {
        // Skip roundabout area (center intersection)
        const isRoundabout = x === 0 && Math.abs(z) < 30; // Skip roundabout area
        const isIntersection = roadPositions.some(rz => Math.abs(z - rz) < 20);
        if (!isRoundabout && !isIntersection) {
          this.positions.push({ x: x + offset, z, rot: Math.PI, side: 1 });
          this.positions.push({ x: x - offset, z, rot: 0, side: -1 });
        }
      }
    });

    roadPositions.forEach(z => {
      for (let x = -range; x <= range; x += spacing) {
        // Skip roundabout area (center intersection)
        const isRoundabout = z === 0 && Math.abs(x) < 30; // Skip roundabout area
        const isIntersection = roadPositions.some(rx => Math.abs(x - rx) < 20);
        if (!isRoundabout && !isIntersection) {
          this.positions.push({ x, z: z + offset, rot: -Math.PI / 2, side: 1 });
          this.positions.push({ x, z: z - offset, rot: Math.PI / 2, side: -1 });
        }
      }
    });

    this.lightCount = this.positions.length;
    this.createInstancedLights();
    this.addStreetLightGlow();
  }

  createInstancedLights() {
    const count = this.positions.length;
    
    const poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 10, 6);
    const headGeo = new THREE.BoxGeometry(2, 0.5, 1);
    const bulbGeo = new THREE.BoxGeometry(1.5, 0.3, 0.8);
    
    // Mor tonlu
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x3a2850 });
    const headMat = new THREE.MeshLambertMaterial({ color: 0x4a3860 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xeeddff });
    
    this.instancedPoles = new THREE.InstancedMesh(poleGeo, poleMat, count);
    this.instancedHeads = new THREE.InstancedMesh(headGeo, headMat, count);
    this.instancedBulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, count);
    
    const dummy = new THREE.Object3D();
    
    this.positions.forEach((pos, i) => {
      dummy.position.set(pos.x, 5, pos.z);
      dummy.rotation.set(0, pos.rot, 0);
      dummy.updateMatrix();
      this.instancedPoles.setMatrixAt(i, dummy.matrix);
      
      const headOffsetX = Math.sin(pos.rot + Math.PI/2) * 1.5;
      const headOffsetZ = Math.cos(pos.rot + Math.PI/2) * 1.5;
      dummy.position.set(pos.x + headOffsetX, 10, pos.z + headOffsetZ);
      dummy.updateMatrix();
      this.instancedHeads.setMatrixAt(i, dummy.matrix);
      
      dummy.position.set(pos.x + headOffsetX, 9.6, pos.z + headOffsetZ);
      dummy.updateMatrix();
      this.instancedBulbs.setMatrixAt(i, dummy.matrix);
    });
    
    this.instancedPoles.frustumCulled = true;
    this.instancedHeads.frustumCulled = true;
    this.instancedBulbs.frustumCulled = true;
    
    this.scene.add(this.instancedPoles);
    this.scene.add(this.instancedHeads);
    this.scene.add(this.instancedBulbs);
  }

  addStreetLightGlow() {
    this.positions.forEach((pos, i) => {
      if (i % 2 === 0) {
        const headOffsetX = Math.sin(pos.rot + Math.PI/2) * 1.5;
        const headOffsetZ = Math.cos(pos.rot + Math.PI/2) * 1.5;
        
        // Mor-beyaz ışık
        const light = new THREE.PointLight(0xbb99dd, 0.6, 25, 2);
        light.position.set(
          pos.x + headOffsetX,
          9,
          pos.z + headOffsetZ
        );
        this.scene.add(light);
        
        const glowX = pos.x + headOffsetX * 3;
        const glowZ = pos.z + headOffsetZ * 3;
        
        const glowGeo = new THREE.CircleGeometry(3, 16);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0x9977bb,
          transparent: true,
          opacity: 0.25
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.x = -Math.PI / 2;
        glow.position.set(glowX, 0.14, glowZ);
        this.scene.add(glow);
        
        const innerGlowGeo = new THREE.CircleGeometry(1.5, 16);
        const innerGlowMat = new THREE.MeshBasicMaterial({
          color: 0xbb99dd,
          transparent: true,
          opacity: 0.3
        });
        const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
        innerGlow.rotation.x = -Math.PI / 2;
        innerGlow.position.set(glowX, 0.15, glowZ);
        this.scene.add(innerGlow);
      }
    });
  }

  dispose() {
    if (this.instancedPoles) {
      this.instancedPoles.dispose();
      this.scene.remove(this.instancedPoles);
    }
    if (this.instancedHeads) {
      this.instancedHeads.dispose();
      this.scene.remove(this.instancedHeads);
    }
    if (this.instancedBulbs) {
      this.instancedBulbs.dispose();
      this.scene.remove(this.instancedBulbs);
    }
  }
}

export default StreetLights;
