import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Street Lights
 * Sokak lambaları sistemi
 */
export class StreetLights {
  constructor(scene) {
    this.scene = scene;
    this.instancedPoles = null;
    this.instancedHeads = null;
    this.instancedBulbs = null;
    this.lightCount = 0;
    
    this.create();
  }

  create() {
    const roadPositions = [0, CONFIG.city.sideRoadDistance, -CONFIG.city.sideRoadDistance];
    const { spacing, offset, range } = CONFIG.streetLights;
    
    const positions = [];
    
    roadPositions.forEach(x => {
      for (let z = -range; z <= range; z += spacing) {
        const isIntersection = roadPositions.some(rz => Math.abs(z - rz) < 15);
        if (!isIntersection) {
          positions.push({ x: x + offset, z, rot: Math.PI });
          positions.push({ x: x - offset, z, rot: 0 });
        }
      }
    });

    roadPositions.forEach(z => {
      for (let x = -range; x <= range; x += spacing) {
        const isIntersection = roadPositions.some(rx => Math.abs(x - rx) < 15);
        if (!isIntersection) {
          positions.push({ x, z: z + offset, rot: -Math.PI / 2 });
          positions.push({ x, z: z - offset, rot: Math.PI / 2 });
        }
      }
    });

    this.lightCount = positions.length;
    this.createInstancedLights(positions);
    this.addKeyLights();
  }

  createInstancedLights(positions) {
    const count = positions.length;
    
    const poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 10, 6);
    const headGeo = new THREE.BoxGeometry(2, 0.5, 1);
    const bulbGeo = new THREE.BoxGeometry(1.5, 0.3, 0.8);
    
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const headMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.streetLight });
    
    this.instancedPoles = new THREE.InstancedMesh(poleGeo, poleMat, count);
    this.instancedHeads = new THREE.InstancedMesh(headGeo, headMat, count);
    this.instancedBulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, count);
    
    this.instancedPoles.castShadow = false;
    this.instancedPoles.receiveShadow = false;
    
    const dummy = new THREE.Object3D();
    
    positions.forEach((pos, i) => {
      dummy.position.set(pos.x, 5, pos.z);
      dummy.rotation.set(0, pos.rot, 0);
      dummy.updateMatrix();
      this.instancedPoles.setMatrixAt(i, dummy.matrix);
      
      const headOffsetX = Math.sin(pos.rot + Math.PI/2) * 1;
      const headOffsetZ = Math.cos(pos.rot + Math.PI/2) * 1;
      dummy.position.set(pos.x + headOffsetX, 10, pos.z + headOffsetZ);
      dummy.updateMatrix();
      this.instancedHeads.setMatrixAt(i, dummy.matrix);
      
      dummy.position.set(pos.x + headOffsetX, 9.7, pos.z + headOffsetZ);
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

  addKeyLights() {
    const keyPositions = [
      { x: 0, z: 0 },
      { x: 100, z: 0 },
      { x: -100, z: 0 },
      { x: 0, z: 100 },
      { x: 0, z: -100 }
    ];
    
    keyPositions.forEach(pos => {
      const light = new THREE.PointLight(CONFIG.colors.streetLight, 0.5, 50);
      light.position.set(pos.x, 12, pos.z);
      this.scene.add(light);
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
