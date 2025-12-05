import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * City Base
 * Zemin, yollar ve grid sistemi
 */
export class CityBase {
  constructor(scene) {
    this.scene = scene;
    this.create();
  }

  create() {
    this.createFloor();
    this.createGrid();
    this.createRoads();
  }

  createFloor() {
    const geo = new THREE.PlaneGeometry(400, 400, 1, 1);
    const mat = new THREE.MeshLambertMaterial({
      color: 0x050505
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  createGrid() {
    const grid = new THREE.GridHelper(400, 40, CONFIG.colors.neonPurple, 0x111122);
    grid.position.y = 0.12;
    grid.material.opacity = 0.08;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  createRoads() {
    const roadW = CONFIG.city.roadWidth;
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const roadPositions = [0, CONFIG.city.sideRoadDistance, -CONFIG.city.sideRoadDistance];

    const roadVGeo = new THREE.PlaneGeometry(roadW, 400, 1, 1);
    const roadHGeo = new THREE.PlaneGeometry(400, roadW, 1, 1);

    roadPositions.forEach((pos) => {
      // Dikey Yol
      const roadV = new THREE.Mesh(roadVGeo, roadMat);
      roadV.rotation.x = -Math.PI / 2;
      roadV.position.set(pos, 0.1, 0);
      this.scene.add(roadV);

      // Yatay Yol
      const roadH = new THREE.Mesh(roadHGeo, roadMat);
      roadH.rotation.x = -Math.PI / 2;
      roadH.position.set(0, 0.11, pos);
      this.scene.add(roadH);
    });
  }
}

export default CityBase;
