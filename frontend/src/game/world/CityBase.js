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

    // Create roundabout ONLY at center intersection (0, 0)
    this.createRoundaboutAtIntersection(0, 0, roundaboutRadius, roundaboutInnerRadius, roundaboutY, roadMat);

    // Create roads connecting to roundabout
    // Center roads connect to roundabout, side roads are full length
    const roadVGeo = new THREE.PlaneGeometry(roadW, 400, 1, 1);
    const roadHGeo = new THREE.PlaneGeometry(400, roadW, 1, 1);

    this.roadPositions.forEach((pos) => {
      // Vertical roads
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

      // Horizontal roads
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
    
    // Create roundabout outer edge - full circle with lower opacity (softer line) ONLY at center
    if (roundaboutRadius > 0) {
      const roundaboutEdgeMat = new THREE.MeshBasicMaterial({
        color: 0x5533aa,
        transparent: true,
        opacity: 0.25 // Softer, more subtle line
      });
      this.createRoundaboutFullEdge(roundaboutRadius, roundaboutEdgeMat, 0, 0);
    }
    
    this.roadPositions.forEach(roadPos => {
      [-10, 10].forEach(edgeOffset => {
        // For center roads, skip the roundabout area completely (no edges in intersection)
        // For side roads, use normal gap at all intersections (normal road intersections)
        const gapSize = roadPos === 0 ? roundaboutRadius + 5 : intersectionGap;
        const useRoundaboutGap = roadPos === 0 ? roundaboutRadius : 0; // Only center roads use roundabout gap
        
        this.createEdgeSegments(
          roadPos + edgeOffset,
          'vertical',
          edgeMat,
          gapSize,
          useRoundaboutGap,
          roundaboutRadius // Pass roundabout radius for exact contact calculation
        );
        
        this.createEdgeSegments(
          roadPos + edgeOffset,
          'horizontal',
          edgeMat,
          gapSize,
          useRoundaboutGap,
          roundaboutRadius // Pass roundabout radius for exact contact calculation
        );
      });
    });
  }

  createRoundaboutFullEdge(radius, material, x = 0, z = 0) {
    const edgeY = 0.13;
    const edgeThickness = 0.2;
    
    // Create full circle edge (no gaps) - softer, more subtle
    const innerRadius = radius - edgeThickness;
    const arcGeo = new THREE.RingGeometry(innerRadius, radius, 64);
    const arc = new THREE.Mesh(arcGeo, material);
    arc.rotation.x = -Math.PI / 2;
    arc.position.set(x, edgeY, z);
    this.scene.add(arc);
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

  createEdgeSegments(position, direction, material, gap, roundaboutRadius = 0, roundaboutRadiusForContact = 0) {
    const range = 200;
    const intersections = this.roadPositions;
    
    let segments = [];
    let start = -range;
    
    intersections.sort((a, b) => a - b).forEach(intersection => {
      // For center intersection (0, 0), calculate exact contact point with roundabout edge
      // For other intersections, use normal gap
      let actualGap;
      if (intersection === 0 && roundaboutRadius > 0 && roundaboutRadiusForContact > 0) {
        // Calculate exact contact point: edge should touch roundabout edge exactly
        // Roundabout edge is at radius roundaboutRadiusForContact
        // Road edge is at position (which is roadPos + edgeOffset, typically ±10)
        // Using Pythagorean theorem: roundaboutRadius^2 = roadEdgeDistance^2 + contactDistance^2
        const roadEdgeDistance = Math.abs(position);
        if (roadEdgeDistance < roundaboutRadiusForContact) {
          // Calculate the point where road edge touches roundabout edge
          const contactDistance = Math.sqrt(roundaboutRadiusForContact * roundaboutRadiusForContact - roadEdgeDistance * roadEdgeDistance);
          actualGap = contactDistance * 2; // Gap on both sides (symmetric)
        } else {
          // If edge is outside roundabout, no gap needed
          actualGap = 0;
        }
      } else {
        actualGap = (intersection === 0 && roundaboutRadius > 0) ? roundaboutRadius * 2 : gap;
      }
      
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

  createRoundaboutAtIntersection(x, z, radius, innerRadius, y, roadMat) {
    // Create roundabout as solid disk - exactly same material as roads
    const roundaboutGeo = new THREE.CircleGeometry(radius, 64);
    const roundabout = new THREE.Mesh(roundaboutGeo, roadMat);
    roundabout.rotation.x = -Math.PI / 2;
    roundabout.position.set(x, y, z);
    roundabout.renderOrder = 0;
    this.scene.add(roundabout);

    // Create roundabout center island (empty/hollow - ground color)
    const islandMat = new THREE.MeshLambertMaterial({ 
      color: CONFIG.colors.ground
    });
    const islandGeo = new THREE.CircleGeometry(innerRadius, 64);
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.rotation.x = -Math.PI / 2;
    island.position.set(x, y + 0.01, z);
    this.scene.add(island);

    // Load and place logo in center
    this.loadRoundaboutLogo(innerRadius, y, x, z);
  }

  loadRoundaboutLogo(radius, y, x = 0, z = 0) {
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
        logo.position.set(x, y + 0.05, z); // Center of roundabout, slightly above ground
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
