import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from '../config.js';

/**
 * Building Builders
 * 3D model creator functions for each building type
 * Buildings are more visible with lighter colors and bright neon
 */

// GLB Loader instance
const gltfLoader = new GLTFLoader();

function setAlwaysVisible(mesh) {
  mesh.frustumCulled = false;
  if (mesh.material) {
    mesh.material.fog = false;
  }
}

/**
 * Create floating neon text above building
 */
function createNeonText(text, color, yPosition) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const colorHex = '#' + color.toString(16).padStart(6, '0');
  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 30;
  
  ctx.fillStyle = colorHex;
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw multiple times for stronger glow
  for (let i = 0; i < 3; i++) {
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    fog: false,
    depthWrite: false
  });
  
  const geometry = new THREE.PlaneGeometry(24, 6);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = yPosition;
  mesh.rotation.y = Math.PI / 4;
  setAlwaysVisible(mesh);
  
  return mesh;
}

/**
 * Create bright neon ring
 */
function createNeonRing(radius, tubeRadius, color, y) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tubeRadius, 16, 48),
    new THREE.MeshBasicMaterial({ 
      color: color, 
      fog: false,
      transparent: true,
      opacity: 1
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = y;
  setAlwaysVisible(ring);
  return ring;
}

// ==================== SWAP CITY ====================
export function buildSwapCity(group) {
  // Main tower - DARK BLUE (not black)
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(20, 70, 20),
    new THREE.MeshLambertMaterial({ color: 0x0a1525, fog: false })
  );
  tower.position.y = 35;
  setAlwaysVisible(tower);
  group.add(tower);

  // Accent edges
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00ddff, fog: false });
  
  // Vertical edge lights
  for (let i = 0; i < 4; i++) {
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 70, 0.5),
      edgeMat
    );
    const angle = (i / 4) * Math.PI * 2;
    edge.position.set(
      Math.cos(angle) * 10,
      35,
      Math.sin(angle) * 10
    );
    setAlwaysVisible(edge);
    group.add(edge);
  }

  // Bright neon rings - CYAN
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      new THREE.BoxGeometry(22, 1.5, 22),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, fog: false })
    );
    ring.position.y = 10 + i * 15;
    setAlwaysVisible(ring);
    group.add(ring);
  }

  // Top crown
  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(18, 3, 18),
    new THREE.MeshBasicMaterial({ color: 0x00ccff, fog: false })
  );
  crown.position.y = 71;
  setAlwaysVisible(crown);
  group.add(crown);

  // Holographic panels on all sides
  const panelMat = new THREE.MeshBasicMaterial({
    color: 0x00ccff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    fog: false
  });
  
  for (let i = 0; i < 4; i++) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(12, 30), panelMat);
    const angle = (i / 4) * Math.PI * 2;
    panel.position.set(Math.cos(angle) * 11, 40, Math.sin(angle) * 11);
    panel.rotation.y = angle + Math.PI / 2;
    setAlwaysVisible(panel);
    group.add(panel);
  }

  // Ground ring
  group.add(createNeonRing(22, 1, 0x00ffff, 1));

  const neonText = createNeonText('SWAP', 0x00ffff, 80);
  group.add(neonText);
}

// ==================== LENDING TOWER ====================
export function buildLendingTower(group) {
  // Main structure - DARK PURPLE (not black)
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 18, 50, 12),
    new THREE.MeshLambertMaterial({ color: 0x1a0a20, fog: false })
  );
  base.position.y = 25;
  setAlwaysVisible(base);
  group.add(base);

  // Bright pink neon rings
  group.add(createNeonRing(19, 1, 0xff0088, 2));
  group.add(createNeonRing(17, 0.8, 0xff0088, 25));
  group.add(createNeonRing(15, 0.8, 0xff0088, 48));

  // Vertical neon lines
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xff0066, fog: false });
  for (let i = 0; i < 8; i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 50, 0.5),
      lineMat
    );
    const angle = (i / 8) * Math.PI * 2;
    line.position.set(
      Math.cos(angle) * 16,
      25,
      Math.sin(angle) * 16
    );
    setAlwaysVisible(line);
    group.add(line);
  }

  // Somnia Logo (3D GLB model) - Rotating
  const logoContainer = new THREE.Group();
  logoContainer.position.y = 60;
  group.add(logoContainer);
  
  // Load Somnia 3D logo
  gltfLoader.load('/base.glb', (gltf) => {
    const model = gltf.scene;
    
    // Scale and position the model
    model.scale.set(12, 12, 12);
    
    // Make all meshes glow with pink/magenta color
    model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({ 
          color: 0xff0088, 
          fog: false 
        });
        child.frustumCulled = false;
      }
    });
    
    logoContainer.add(model);
  }, undefined, (error) => {
    console.error('Error loading Somnia logo:', error);
    // Fallback: create simple torus if GLB fails to load
    const fallback = new THREE.Mesh(
      new THREE.TorusGeometry(8, 1.5, 16, 48),
      new THREE.MeshBasicMaterial({ color: 0xff0088, fog: false })
    );
    logoContainer.add(fallback);
  });
  
  group.userData.animItem = logoContainer;

  const neonText = createNeonText('LEND', 0xff0088, 90);
  group.add(neonText);
}

// ==================== SOMNIA DOMAIN SERVICE ====================
export function buildDomainHub(group) {
  // Simple large building box (like background buildings but bigger)
  const width = 25;
  const depth = 25;
  const height = 45;
  
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshLambertMaterial({ color: CONFIG.colors.buildingBase, fog: false })
  );
  building.position.y = height / 2;
  setAlwaysVisible(building);
  group.add(building);

  // Neon border on top (like background buildings)
  const topLine = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.3, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.8, fog: false })
  );
  topLine.position.set(0, height + 0.1, depth / 2);
  setAlwaysVisible(topLine);
  group.add(topLine);

  // Billboard frame - ONLY EDGES (no fill, just corners/borders)
  const frameWidth = width * 0.85;
  const frameHeight = height * 0.5;
  const frameThickness = 0.15; // Thickness of the border lines
  const frameDepth = 0.1;
  
  const frameMat = new THREE.MeshBasicMaterial({ color: 0xaa00ff, fog: false });
  
  // Helper function to create frame edges (only borders, no fill)
  const createFrameEdges = (fw, fh, pos, rotY = 0) => {
    const frameGroup = new THREE.Group();
    frameGroup.position.copy(pos);
    frameGroup.rotation.y = rotY;
    
    // Top edge
    const topEdge = new THREE.Mesh(
      new THREE.BoxGeometry(fw, frameThickness, frameDepth),
      frameMat
    );
    topEdge.position.set(0, fh / 2, 0);
    frameGroup.add(topEdge);
    
    // Bottom edge
    const bottomEdge = new THREE.Mesh(
      new THREE.BoxGeometry(fw, frameThickness, frameDepth),
      frameMat
    );
    bottomEdge.position.set(0, -fh / 2, 0);
    frameGroup.add(bottomEdge);
    
    // Left edge
    const leftEdge = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, fh, frameDepth),
      frameMat
    );
    leftEdge.position.set(-fw / 2, 0, 0);
    frameGroup.add(leftEdge);
    
    // Right edge
    const rightEdge = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, fh, frameDepth),
      frameMat
    );
    rightEdge.position.set(fw / 2, 0, 0);
    frameGroup.add(rightEdge);
    
    return frameGroup;
  };
  
  // Front frame (only edges)
  const frameFront = createFrameEdges(frameWidth, frameHeight, 
    new THREE.Vector3(0, height * 0.55, depth / 2 + 0.15), 0);
  setAlwaysVisible(frameFront);
  group.add(frameFront);
  
  // Back frame (only edges)
  const frameBack = createFrameEdges(frameWidth, frameHeight,
    new THREE.Vector3(0, height * 0.55, -depth / 2 - 0.15), Math.PI);
  setAlwaysVisible(frameBack);
  group.add(frameBack);
  
  // Right side frame (only edges)
  const frameRight = createFrameEdges(depth, frameHeight,
    new THREE.Vector3(width / 2 + 0.15, height * 0.55, 0), Math.PI / 2);
  setAlwaysVisible(frameRight);
  group.add(frameRight);

  // Billboard screen (animated scrolling text) - transparent background, only text
  const createBillboardTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d', { alpha: true }); // Alpha channel for transparent background
    
    // No background fill - transparent, only text will be drawn
    // Frame provides the purple border
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.premultiplyAlpha = false; // Don't premultiply alpha
    texture.format = THREE.RGBAFormat; // Explicit format
    return { texture, canvas }; // Return both
  };
  
  const { texture: tex, canvas: billboardCanvas } = createBillboardTexture();
  tex.minFilter = THREE.LinearFilter; // Better filtering to prevent aliasing
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false; // Disable mipmaps for crisp text
  tex.needsUpdate = true;
  
  // Front billboard - Transparent background, only text visible, inside frame
  const billboardFront = new THREE.Mesh(
    new THREE.PlaneGeometry(frameWidth, frameHeight),
    new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.FrontSide,
      transparent: true, // Transparent background, only text visible
      toneMapped: false, // Keep colors bright
      depthWrite: false // Don't write depth for transparent objects
    })
  );
  billboardFront.position.set(0, height * 0.55, depth / 2 + 0.2); // Inside frame (frame is at 0.15, billboard slightly forward)
  billboardFront.renderOrder = 1; // Render after frame edges
  setAlwaysVisible(billboardFront);
  group.add(billboardFront);
  
  // Back billboard - Transparent background, only text visible, inside frame
  const billboardBack = new THREE.Mesh(
    new THREE.PlaneGeometry(frameWidth, frameHeight),
    new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.FrontSide,
      transparent: true, // Transparent background, only text visible
      toneMapped: false, // Keep colors bright
      depthWrite: false // Don't write depth for transparent objects
    })
  );
  billboardBack.position.set(0, height * 0.55, -depth / 2 - 0.2); // Inside frame (frame is at -0.15, billboard slightly back)
  billboardBack.rotation.y = Math.PI; // Face opposite direction
  billboardBack.renderOrder = 1; // Render after frame edges
  setAlwaysVisible(billboardBack);
  group.add(billboardBack);
  
  // Right side billboard - Transparent background, only text visible, inside frame
  const billboardRight = new THREE.Mesh(
    new THREE.PlaneGeometry(depth, frameHeight),
    new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.FrontSide,
      transparent: true, // Transparent background, only text visible
      toneMapped: false, // Keep colors bright
      depthWrite: false // Don't write depth for transparent objects
    })
  );
  billboardRight.position.set(width / 2 + 0.2, height * 0.55, 0); // Inside frame (frame is at 0.15, billboard slightly right)
  billboardRight.rotation.y = Math.PI / 2; // Face right
  billboardRight.renderOrder = 1; // Render after frame edges
  setAlwaysVisible(billboardRight);
  group.add(billboardRight);
  
  // Store texture and canvas for animation
  group.userData.billboardTexture = tex;
  group.userData.billboardCanvas = billboardCanvas; // Store canvas directly
}

// ==================== MINT LAB ====================
export function buildMintLab(group) {
  // Dome - DARK GREEN (not black)
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(18, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x051510, fog: false })
  );
  dome.position.y = 10;
  dome.scale.y = 2;
  setAlwaysVisible(dome);
  group.add(dome);

  // Bright green neon rings
  group.add(createNeonRing(20, 1, 0x00ff88, 1));
  group.add(createNeonRing(18, 0.8, 0x00ff88, 20));
  group.add(createNeonRing(14, 0.8, 0x00ff88, 32));
  group.add(createNeonRing(8, 0.6, 0x00ff88, 38));

  // Dome meridian lines
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x00ff66, fog: false });
  for (let i = 0; i < 8; i++) {
    const curve = new THREE.EllipseCurve(0, 0, 18, 36, 0, Math.PI, false, 0);
    const points = curve.getPoints(20);
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, p.y + 10, 0))
    );
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color: 0x00ff66 })
    );
    line.rotation.y = (i / 8) * Math.PI * 2;
    setAlwaysVisible(line);
    group.add(line);
  }

  // Top beacon
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(3, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ff88, fog: false })
  );
  beacon.position.y = 42;
  setAlwaysVisible(beacon);
  group.add(beacon);

  const neonText = createNeonText('MINT', 0x00ff88, 52);
  group.add(neonText);
}

// ==================== GOLD FAUCET ====================
export function buildGoldFaucet(group) {
  const goldNeon = new THREE.MeshBasicMaterial({ color: 0xffaa00, fog: false });
  const goldBright = new THREE.MeshBasicMaterial({ color: 0xffcc00, fog: false });
  // Dark brown-orange (not black)
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2a1a08, fog: false });
  
  // Base platform
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(14, 16, 5, 12),
    bodyMat
  );
  platform.position.y = 2.5;
  setAlwaysVisible(platform);
  group.add(platform);

  // Platform neon edge
  group.add(createNeonRing(15, 0.8, 0xffaa00, 0.5));
  group.add(createNeonRing(15, 0.8, 0xffaa00, 5));

  // Main vertical pipe
  const mainPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 4, 40, 12),
    bodyMat
  );
  mainPipe.position.y = 25;
  setAlwaysVisible(mainPipe);
  group.add(mainPipe);

  // Pipe neon rings
  group.add(createNeonRing(5, 0.5, 0xffcc00, 10));
  group.add(createNeonRing(5, 0.5, 0xffcc00, 25));
  group.add(createNeonRing(5, 0.5, 0xffcc00, 40));

  // Top cap
  const topCap = new THREE.Mesh(
    new THREE.SphereGeometry(5, 16, 16),
    bodyMat
  );
  topCap.position.y = 45;
  setAlwaysVisible(topCap);
  group.add(topCap);

  // Spout arm
  const spout = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 15, 8),
    bodyMat
  );
  spout.position.set(8, 40, 0);
  spout.rotation.z = Math.PI / 2;
  setAlwaysVisible(spout);
  group.add(spout);

  // Spout tip (downward)
  const spoutTip = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2, 10, 8),
    bodyMat
  );
  spoutTip.position.set(15, 36, 0);
  spoutTip.rotation.z = 0.2;
  setAlwaysVisible(spoutTip);
  group.add(spoutTip);

  // Spout neon ring
  const spoutRing = new THREE.Mesh(
    new THREE.TorusGeometry(3, 0.4, 8, 32),
    goldBright
  );
  spoutRing.position.set(15, 40, 0);
  spoutRing.rotation.x = Math.PI / 2;
  setAlwaysVisible(spoutRing);
  group.add(spoutRing);

  // WATER STREAM - bright orange neon
  const waterStream = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 2, 28, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.85,
      fog: false
    })
  );
  waterStream.position.set(15, 17, 0);
  setAlwaysVisible(waterStream);
  group.add(waterStream);

  // Water glow (inner stream)
  const waterGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 1, 28, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      fog: false
    })
  );
  waterGlow.position.set(15, 17, 0);
  setAlwaysVisible(waterGlow);
  group.add(waterGlow);

  // Splash pool
  const pool = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, 1, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
      fog: false
    })
  );
  pool.position.set(15, 1, 0);
  setAlwaysVisible(pool);
  group.add(pool);

  // Splash rings
  group.add(createNeonRing(6, 0.6, 0xffcc00, 2));
  const innerSplash = createNeonRing(3, 0.4, 0xffdd00, 2.5);
  innerSplash.position.x = 15;
  group.add(innerSplash);
  
  const outerSplash = createNeonRing(6, 0.5, 0xffaa00, 2);
  outerSplash.position.x = 15;
  group.add(outerSplash);

  // Main ground ring
  group.add(createNeonRing(18, 1, 0xffaa00, 0.5));

  const neonText = createNeonText('FAUCET', 0xffcc00, 55);
  group.add(neonText);
}

export default {
  buildSwapCity,
  buildLendingTower,
  buildMintLab,
  buildGoldFaucet
};
