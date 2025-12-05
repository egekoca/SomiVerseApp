import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * City Base
 * Koyu morumsu zemin ve yollar
 */
export class CityBase {
  constructor(scene) {
    this.scene = scene;
    this.roadPositions = [0, CONFIG.city.sideRoadDistance, -CONFIG.city.sideRoadDistance];
    this.create();
  }

  create() {
    this.createFloor();
    this.createGrid();
    this.createRoads();
  }

  createFloor() {
    const geo = new THREE.PlaneGeometry(400, 400, 1, 1);
    // Koyu mor zemin
    const mat = new THREE.MeshLambertMaterial({
      color: CONFIG.colors.ground
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  createGrid() {
    // Mor grid - daha görünür
    const grid = new THREE.GridHelper(400, 40, 0x6644cc, 0x2a1a40);
    grid.position.y = 0.12;
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  createRoads() {
    const roadW = CONFIG.city.roadWidth;
    // Mor yollar
    const roadMat = new THREE.MeshLambertMaterial({ 
      color: CONFIG.colors.road
    });

    const roadVGeo = new THREE.PlaneGeometry(roadW, 400, 1, 1);
    const roadHGeo = new THREE.PlaneGeometry(400, roadW, 1, 1);

    this.roadPositions.forEach((pos) => {
      const roadV = new THREE.Mesh(roadVGeo, roadMat);
      roadV.rotation.x = -Math.PI / 2;
      roadV.position.set(pos, 0.1, 0);
      this.scene.add(roadV);

      const roadH = new THREE.Mesh(roadHGeo, roadMat);
      roadH.rotation.x = -Math.PI / 2;
      roadH.position.set(0, 0.11, pos);
      this.scene.add(roadH);
    });
    
    this.addRoadEdges();
  }

  addRoadEdges() {
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0x5533aa,
      transparent: true,
      opacity: 0.5
    });
    
    const roadW = CONFIG.city.roadWidth;
    const intersectionGap = roadW + 5;
    
    this.roadPositions.forEach(roadPos => {
      [-10, 10].forEach(edgeOffset => {
        this.createEdgeSegments(
          roadPos + edgeOffset,
          'vertical',
          edgeMat,
          intersectionGap
        );
        
        this.createEdgeSegments(
          roadPos + edgeOffset,
          'horizontal',
          edgeMat,
          intersectionGap
        );
      });
    });
  }

  createEdgeSegments(position, direction, material, gap) {
    const range = 200;
    const intersections = this.roadPositions;
    
    let segments = [];
    let start = -range;
    
    intersections.sort((a, b) => a - b).forEach(intersection => {
      const gapStart = intersection - gap / 2;
      const gapEnd = intersection + gap / 2;
      
      if (start < gapStart) {
        segments.push({ start, end: gapStart });
      }
      start = gapEnd;
    });
    
    if (start < range) {
      segments.push({ start, end: range });
    }
    
    segments.forEach(seg => {
      const length = seg.end - seg.start;
      const center = (seg.start + seg.end) / 2;
      
      if (length > 0) {
        if (direction === 'vertical') {
          const geo = new THREE.PlaneGeometry(0.3, length);
          const edge = new THREE.Mesh(geo, material);
          edge.rotation.x = -Math.PI / 2;
          edge.position.set(position, 0.13, center);
          this.scene.add(edge);
        } else {
          const geo = new THREE.PlaneGeometry(length, 0.3);
          const edge = new THREE.Mesh(geo, material);
          edge.rotation.x = -Math.PI / 2;
          edge.position.set(center, 0.13, position);
          this.scene.add(edge);
        }
      }
    });
  }
}

export default CityBase;
