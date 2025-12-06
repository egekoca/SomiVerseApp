import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class HugeBillboards {
  constructor(scene) {
    this.scene = scene;
    this.billboards = [];
  }

  async create() {
    const textureLoader = new THREE.TextureLoader();
    let texture;

    try {
      texture = await new Promise((resolve, reject) => {
        textureLoader.load('/somniahorizontal.avif', resolve, undefined, reject);
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      // Fix graininess/pixelation at angles
      texture.anisotropy = 16; 
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
    } catch (e) {
      console.error('Failed to load huge billboard texture:', e);
      return;
    }

    const mapLimit = CONFIG.city.mapLimit; // 200
    const distance = mapLimit + 15; // Moved closer to boundary (was +50)
    const width = mapLimit * 1.0; // Reduced width further (was * 1.2)
    const height = width / 4; // Maintain aspect ratio
    const elevation = height / 2 + 10; // Lift slightly off ground

    // Positions: Only North (Top) and West (Left) visible to user
    const positions = [
      { x: 0, z: -distance, rotY: 0 },           // North (facing South/City)
      { x: -distance, z: 0, rotY: Math.PI / 2 }  // West (facing East/City)
    ];

    positions.forEach(pos => {
      this.createBillboard(pos, width, height, texture, elevation);
    });
  }

  createBillboard(pos, width, height, texture, elevation) {
    const group = new THREE.Group();
    group.position.set(pos.x, elevation, pos.z);
    group.rotation.y = pos.rotY;

    // Billboard Material (Emissive for night visibility)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide, // Only visible from front
      transparent: false, // Disabled transparency to prevent Z-fighting/sorting issues
      toneMapped: false // Keep colors bright
    });

    // Main Plane
    const geometry = new THREE.PlaneGeometry(width, height);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { isLink: true, url: 'https://somnia.network/' }; // Add interactivity data
    group.add(mesh);

    // Backing (so it's not invisible from behind, or maybe just dark)
    const backGeo = new THREE.PlaneGeometry(width, height);
    const backMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -2.0; // Increased distance to prevent Z-fighting (was -0.1)
    group.add(backMesh);

    // Frame/Border (Neon style)
    const frameThickness = 2;
    const frameGeo = new THREE.BoxGeometry(width + frameThickness, height + frameThickness, 1);
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -1.0; // Moved behind main mesh (was -0.5)
    group.add(frame);

    // Neon Edge
    const edgeGeo = new THREE.BoxGeometry(width + frameThickness + 1, height + frameThickness + 1, 0.5);
    const edgeMat = new THREE.MeshBasicMaterial({ 
      color: 0xaa00ff, // Purple neon matching theme
      transparent: true, 
      opacity: 0.5 
    });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.z = -1.0; // Match frame depth
    group.add(edge);
    
    // Bottom Supports (Pillars)
    const pillarHeight = elevation;
    const pillarGeo = new THREE.BoxGeometry(4, pillarHeight, 4);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    
    // Left Pillar
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-width / 2 + 10, -height/2 - pillarHeight/2, 0);
    group.add(leftPillar);

    // Right Pillar
    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(width / 2 - 10, -height/2 - pillarHeight/2, 0);
    group.add(rightPillar);

    this.scene.add(group);
    this.billboards.push(group);
  }

  getBillboards() {
    return this.billboards;
  }
}

export default HugeBillboards;

