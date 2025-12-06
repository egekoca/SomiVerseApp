/**
 * Billboards - LED Advertisement Panels
 * Large standalone billboard structures like in the reference image
 */
import * as THREE from 'three';

export class Billboards {
  constructor(scene) {
    this.scene = scene;
    this.billboards = [];
    this.time = 0;
    
    // Billboard positions - Strategic locations in the city
    this.positions = [
      { x: 0, z: -70, rotY: 0, scale: 1.3 },           // North - facing south
      { x: 75, z: 0, rotY: -Math.PI / 2, scale: 1.2 }, // East - facing west
      { x: -75, z: 0, rotY: Math.PI / 2, scale: 1.2 }, // West - facing east
    ];
  }

  async create() {
    // Load logo texture
    const textureLoader = new THREE.TextureLoader();
    
    try {
      const logoTexture = await new Promise((resolve, reject) => {
        textureLoader.load('/Somi.png', resolve, undefined, reject);
      });
      
      logoTexture.colorSpace = THREE.SRGBColorSpace;
      
      this.positions.forEach((pos, index) => {
        this.createBillboard(pos, logoTexture, index);
      });
    } catch (e) {
      console.log('Logo texture not loaded, using fallback');
      this.positions.forEach((pos, index) => {
        this.createBillboard(pos, null, index);
      });
    }
  }

  createBillboard(pos, logoTexture, index) {
    const group = new THREE.Group();
    group.position.set(pos.x, 0, pos.z);
    group.rotation.y = pos.rotY;

    const width = 18 * pos.scale;
    const height = 10 * pos.scale;
    const poleHeight = 12 * pos.scale;
    const screenY = poleHeight + height / 2;

    // === MAIN POLE (Single thick pillar like in image) ===
    const poleMat = new THREE.MeshLambertMaterial({
      color: 0x1a1a2a,
      emissive: 0x050508,
      emissiveIntensity: 0.3
    });

    // Main vertical pole
    const mainPole = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, poleHeight, 1.5),
      poleMat
    );
    mainPole.position.y = poleHeight / 2;
    group.add(mainPole);

    // Pole base - wider foundation
    const baseMat = new THREE.MeshLambertMaterial({
      color: 0x2a2a3a,
      emissive: 0x080810,
      emissiveIntensity: 0.2
    });
    
    const poleBase = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 3),
      baseMat
    );
    poleBase.position.y = 0.5;
    group.add(poleBase);

    // === SCREEN FRAME (Dark frame around screen) ===
    const frameMat = new THREE.MeshLambertMaterial({
      color: 0x0a0a1a,
      emissive: 0x020205,
      emissiveIntensity: 0.5
    });

    // Main frame box
    const frameDepth = 0.8;
    const framePadding = 0.8;
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(width + framePadding * 2, height + framePadding * 2, frameDepth),
      frameMat
    );
    frame.position.set(0, screenY, 0);
    group.add(frame);

    // === LED SCREEN ===
    let screenMat;
    if (logoTexture) {
      screenMat = new THREE.MeshBasicMaterial({
        map: logoTexture,
        toneMapped: false,
        transparent: true
      });
    } else {
      const canvas = this.createFallbackCanvas(width, height);
      const canvasTexture = new THREE.CanvasTexture(canvas);
      screenMat = new THREE.MeshBasicMaterial({
        map: canvasTexture,
        toneMapped: false
      });
    }

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      screenMat
    );
    screen.position.set(0, screenY, frameDepth / 2 + 0.02);
    group.add(screen);

    // Store reference for animation
    this.billboards.push({
      screen,
      material: screenMat,
      index,
      group
    });

    // === BLUE NEON BORDER (Like in the image) ===
    const neonBlueMat = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
      transparent: true,
      opacity: 0.95
    });

    const borderThickness = 0.12;
    
    // Top border
    const topBorder = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.3, borderThickness, 0.15),
      neonBlueMat
    );
    topBorder.position.set(0, screenY + height / 2 + 0.1, frameDepth / 2 + 0.1);
    group.add(topBorder);

    // Bottom border
    const bottomBorder = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.3, borderThickness, 0.15),
      neonBlueMat
    );
    bottomBorder.position.set(0, screenY - height / 2 - 0.1, frameDepth / 2 + 0.1);
    group.add(bottomBorder);

    // Left border
    const leftBorder = new THREE.Mesh(
      new THREE.BoxGeometry(borderThickness, height + 0.3, 0.15),
      neonBlueMat
    );
    leftBorder.position.set(-width / 2 - 0.1, screenY, frameDepth / 2 + 0.1);
    group.add(leftBorder);

    // Right border
    const rightBorder = new THREE.Mesh(
      new THREE.BoxGeometry(borderThickness, height + 0.3, 0.15),
      neonBlueMat
    );
    rightBorder.position.set(width / 2 + 0.1, screenY, frameDepth / 2 + 0.1);
    group.add(rightBorder);

    // === TOP SPOTLIGHTS (Like in the image - row of lights on top) ===
    const spotCount = 8;
    const spotSpacing = width / (spotCount + 1);
    const spotLightMat = new THREE.MeshBasicMaterial({ 
      color: 0xaaccff,
      transparent: true,
      opacity: 0.9
    });

    for (let i = 1; i <= spotCount; i++) {
      const spotX = -width / 2 + spotSpacing * i;
      
      // Light housing
      const housing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 0.3, 8),
        frameMat
      );
      housing.position.set(spotX, screenY + height / 2 + framePadding + 0.3, 0.2);
      group.add(housing);

      // Light bulb/lens
      const lens = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        spotLightMat
      );
      lens.position.set(spotX, screenY + height / 2 + framePadding + 0.1, 0.35);
      group.add(lens);
    }

    // === MAIN ILLUMINATION LIGHT ===
    const mainLight = new THREE.PointLight(0x4488ff, 3, 40);
    mainLight.position.set(0, screenY, 5);
    group.add(mainLight);
    
    // Store light for animation
    this.billboards[this.billboards.length - 1].mainLight = mainLight;

    // === SCREEN GLOW (Soft light from screen) ===
    const screenGlow = new THREE.PointLight(0xffffff, 1.5, 25);
    screenGlow.position.set(0, screenY, 3);
    group.add(screenGlow);
    
    this.billboards[this.billboards.length - 1].screenGlow = screenGlow;

    this.scene.add(group);
  }

  createFallbackCanvas(width, height) {
    const canvas = document.createElement('canvas');
    const scale = 60;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0020');
    gradient.addColorStop(0.5, '#150040');
    gradient.addColorStop(1, '#0a0020');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Main text
    ctx.font = 'bold 100px Orbitron, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Glow
    ctx.shadowColor = '#6644ff';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#8866ff';
    ctx.fillText('SOMIVERSE', canvas.width / 2, canvas.height / 2 - 40);
    
    // Subtitle
    ctx.font = '36px Share Tech Mono, monospace';
    ctx.fillStyle = '#00ccff';
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 20;
    ctx.fillText('THE FUTURE OF GAMING', canvas.width / 2, canvas.height / 2 + 60);

    return canvas;
  }

  update(deltaTime) {
    this.time += deltaTime;

    this.billboards.forEach((billboard, index) => {
      // Gentle light pulsing
      const pulse = Math.sin(this.time * 1.5 + index * 0.5) * 0.2 + 0.8;
      
      if (billboard.mainLight) {
        billboard.mainLight.intensity = 3 * pulse;
      }
      
      if (billboard.screenGlow) {
        billboard.screenGlow.intensity = 1.5 * pulse;
      }


      // Occasional screen flicker (very rare, subtle)
      if (Math.random() < 0.0005) {
        if (billboard.material.opacity !== undefined) {
          billboard.material.opacity = 0.85;
          setTimeout(() => {
            if (billboard.material) billboard.material.opacity = 1;
          }, 30);
        }
      }
    });
  }

  // API for future ad system
  setBillboardContent(index, texture) {
    if (this.billboards[index]) {
      this.billboards[index].material.map = texture;
      this.billboards[index].material.needsUpdate = true;
    }
  }

  addBillboard(position, texture) {
    this.createBillboard(position, texture, this.billboards.length);
  }
}

export default Billboards;
