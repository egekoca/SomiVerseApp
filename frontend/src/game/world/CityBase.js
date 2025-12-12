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

    // Roundabout parameters
    const roundaboutRadius = 25; // Roundabout radius
    this.roundaboutInnerRadius = 15; // Inner island radius (store for edge creation)
    const roundaboutInnerRadius = this.roundaboutInnerRadius;
    const roundaboutY = 0.1;
    const roadY = 0.1; // Roads at same level

    // Create roundabout as solid disk - exactly same material as roads (no color differences)
    // Roundabout should be at same level as roads for seamless connection
    const roundaboutGeo = new THREE.CircleGeometry(roundaboutRadius, 64);
    const roundabout = new THREE.Mesh(roundaboutGeo, roadMat);
    roundabout.rotation.x = -Math.PI / 2;
    roundabout.position.set(0, roundaboutY, 0);
    roundabout.renderOrder = 0; // Ensure proper rendering order
    this.scene.add(roundabout);

    // Create roundabout center island (empty/hollow - ground color)
    const islandMat = new THREE.MeshLambertMaterial({ 
      color: CONFIG.colors.ground
    });
    const islandGeo = new THREE.CircleGeometry(roundaboutInnerRadius, 64);
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.rotation.x = -Math.PI / 2;
    island.position.set(0, roundaboutY + 0.01, 0); // Slightly above to create hollow effect
    this.scene.add(island);

    // Load and place base.glb logo in center
    this.loadRoundaboutLogo(roundaboutInnerRadius, roundaboutY);

    // Create roads connecting to roundabout
    // Instead of full roads, create road segments that connect to roundabout
    const roadVGeo = new THREE.PlaneGeometry(roadW, 400, 1, 1);
    const roadHGeo = new THREE.PlaneGeometry(400, roadW, 1, 1);

    this.roadPositions.forEach((pos) => {
      // Vertical roads - split into two segments (before and after roundabout)
      if (pos !== 0) {
        // Side roads (not center) - full length
        const roadV = new THREE.Mesh(roadVGeo, roadMat);
        roadV.rotation.x = -Math.PI / 2;
        roadV.position.set(pos, roundaboutY, 0);
        this.scene.add(roadV);
      } else {
        // Center vertical road - extend all the way to roundabout edge (no gap, continuous)
        const segmentLength = 200;
        const roundaboutEdge = roundaboutRadius;
        
        // North segment - extends seamlessly to roundabout (overlap for continuous look)
        const roadVNorth = new THREE.Mesh(
          new THREE.PlaneGeometry(roadW, segmentLength - roundaboutEdge + 2, 1, 1), // +2 for overlap
          roadMat
        );
        roadVNorth.rotation.x = -Math.PI / 2;
        roadVNorth.position.set(0, roadY - 0.001, (segmentLength + roundaboutEdge - 1) / 2); // Slightly lower
        roadVNorth.renderOrder = 1; // Render after roundabout
        this.scene.add(roadVNorth);

        // South segment - extends seamlessly to roundabout (overlap for continuous look)
        const roadVSouth = new THREE.Mesh(
          new THREE.PlaneGeometry(roadW, segmentLength - roundaboutEdge + 2, 1, 1), // +2 for overlap
          roadMat
        );
        roadVSouth.rotation.x = -Math.PI / 2;
        roadVSouth.position.set(0, roadY - 0.001, -(segmentLength + roundaboutEdge - 1) / 2); // Slightly lower
        roadVSouth.renderOrder = 1; // Render after roundabout
        this.scene.add(roadVSouth);
      }

      // Horizontal roads - split into two segments (before and after roundabout)
      if (pos !== 0) {
        // Side roads (not center) - full length
        const roadH = new THREE.Mesh(roadHGeo, roadMat);
        roadH.rotation.x = -Math.PI / 2;
        roadH.position.set(0, roundaboutY, pos);
        this.scene.add(roadH);
      } else {
        // Center horizontal road - extend all the way to roundabout edge (no gap, continuous)
        const segmentLength = 200;
        const roundaboutEdge = roundaboutRadius;
        
        // East segment - extends seamlessly to roundabout (overlap for continuous look)
        const roadHEast = new THREE.Mesh(
          new THREE.PlaneGeometry(segmentLength - roundaboutEdge + 2, roadW, 1, 1), // +2 for overlap
          roadMat
        );
        roadHEast.rotation.x = -Math.PI / 2;
        roadHEast.position.set((segmentLength + roundaboutEdge - 1) / 2, roadY - 0.001, 0); // Slightly lower
        roadHEast.renderOrder = 1; // Render after roundabout
        this.scene.add(roadHEast);

        // West segment - extends seamlessly to roundabout (overlap for continuous look)
        const roadHWest = new THREE.Mesh(
          new THREE.PlaneGeometry(segmentLength - roundaboutEdge + 2, roadW, 1, 1), // +2 for overlap
          roadMat
        );
        roadHWest.rotation.x = -Math.PI / 2;
        roadHWest.position.set(-(segmentLength + roundaboutEdge - 1) / 2, roadY - 0.001, 0); // Slightly lower
        roadHWest.renderOrder = 1; // Render after roundabout
        this.scene.add(roadHWest);
      }
    });
    
    this.addRoadEdges(roundaboutRadius);
  }

  addRoadEdges(roundaboutRadius = 0) {
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0x5533aa,
      transparent: true,
      opacity: 0.5
    });
    
    const roadW = CONFIG.city.roadWidth;
    const intersectionGap = roadW + 5;
    
    // Create roundabout outer edge with gaps at road intersections
    if (roundaboutRadius > 0) {
      this.createRoundaboutEdge(roundaboutRadius, edgeMat, roadW);
    }
    
    this.roadPositions.forEach(roadPos => {
      [-10, 10].forEach(edgeOffset => {
        // For center roads, skip the roundabout area completely (no edges in intersection)
        const gapSize = roadPos === 0 ? roundaboutRadius + 5 : intersectionGap;
        
        this.createEdgeSegments(
          roadPos + edgeOffset,
          'vertical',
          edgeMat,
          gapSize,
          roadPos === 0 ? roundaboutRadius : 0
        );
        
        this.createEdgeSegments(
          roadPos + edgeOffset,
          'horizontal',
          edgeMat,
          gapSize,
          roadPos === 0 ? roundaboutRadius : 0
        );
      });
    });
  }

  createRoundaboutEdge(radius, material, roadWidth) {
    const edgeY = 0.13;
    const edgeThickness = 0.2;
    // Larger gap to ensure no lines at road intersections
    const gapAngle = Math.atan2((roadWidth + 4) / 2, radius); // Increased gap for road intersections
    
    // Create 4 arc segments, each skipping one road direction
    // Road directions: North (0), East (PI/2), South (PI), West (3PI/2 or -PI/2)
    
    // Segment 1: From East+gap to South-gap (skipping East road at PI/2)
    this.createArcMesh(radius, edgeThickness, material, edgeY, 
      Math.PI / 2 + gapAngle, Math.PI - gapAngle);
    
    // Segment 2: From South+gap to West-gap (skipping South road at PI)
    this.createArcMesh(radius, edgeThickness, material, edgeY,
      Math.PI + gapAngle, 3 * Math.PI / 2 - gapAngle);
    
    // Segment 3: From West+gap to North-gap (skipping West road at 3PI/2)
    // Handle wrap-around: from 3PI/2+gap to 2PI, then from -PI to -gapAngle
    if (3 * Math.PI / 2 + gapAngle < 2 * Math.PI) {
      this.createArcMesh(radius, edgeThickness, material, edgeY,
        3 * Math.PI / 2 + gapAngle, 2 * Math.PI);
    }
    if (-gapAngle > -Math.PI) {
      this.createArcMesh(radius, edgeThickness, material, edgeY,
        -Math.PI, -gapAngle);
    }
    
    // Segment 4: From North+gap to East-gap (skipping North road at 0)
    if (gapAngle < Math.PI / 2) {
      this.createArcMesh(radius, edgeThickness, material, edgeY,
        gapAngle, Math.PI / 2 - gapAngle);
    }
  }

  createArcMesh(radius, thickness, material, y, startAngle, endAngle) {
    // Create arc using RingGeometry
    const segments = 16;
    const angleRange = endAngle - startAngle;
    const innerRadius = radius - thickness;
    
    // Create ring segment
    const arcGeo = new THREE.RingGeometry(innerRadius, radius, segments, 1, startAngle, angleRange);
    const arc = new THREE.Mesh(arcGeo, material);
    arc.rotation.x = -Math.PI / 2;
    arc.position.set(0, y, 0);
    this.scene.add(arc);
  }

  createEdgeSegments(position, direction, material, gap, roundaboutRadius = 0) {
    const range = 200;
    const intersections = this.roadPositions;
    
    let segments = [];
    let start = -range;
    
    intersections.sort((a, b) => a - b).forEach(intersection => {
      // For center intersection (0, 0), use roundabout radius
      const actualGap = (intersection === 0 && roundaboutRadius > 0) ? roundaboutRadius * 2 : gap;
      const gapStart = intersection - actualGap / 2;
      const gapEnd = intersection + actualGap / 2;
      
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

  loadRoundaboutLogo(radius, y) {
    // Load SomniaNoBackGround.png as texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/SomniaNoBackGround.png',
      (texture) => {
        // Create a plane to display the image
        const logoSize = radius * 2.6; // Logo size based on roundabout inner radius (larger)
        const geometry = new THREE.PlaneGeometry(logoSize, logoSize);
        
        // Create material with the texture
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 1.0,
          side: THREE.DoubleSide,
          fog: false
        });
        
        // Create mesh
        const logo = new THREE.Mesh(geometry, material);
        logo.rotation.x = -Math.PI / 2; // Rotate to horizontal (flat on ground)
        logo.position.set(0, y + 0.05, 0); // Center of roundabout, slightly above ground
        logo.renderOrder = 999; // Render on top
        
        this.scene.add(logo);
      },
      undefined,
      (error) => {
        console.error('Error loading roundabout logo:', error);
      }
    );
  }
}

export default CityBase;
