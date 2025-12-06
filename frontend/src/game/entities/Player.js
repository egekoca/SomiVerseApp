import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Player Entity - Titan Mech
 * Enhanced visibility with neon accents and glow effects
 */
export class Player {
  constructor() {
    this.mesh = new THREE.Group();
    this.userData = {
      leftArm: null,
      rightArm: null,
      leftLeg: null,
      rightLeg: null,
      walkTime: 0
    };
    
    // Material references for dynamic color updates
    this.neonMaterial = null;
    this.visorMaterial = null;
    this.coreRingMat = null;
    this.visorGlowMat = null;
    this.groundRingMat = null;
    this.neonGreenMaterial = null;
    this.playerLight = null;
    this.nameLabel = null;

    this.createModel();
    this.mesh.scale.set(CONFIG.player.scale, CONFIG.player.scale, CONFIG.player.scale);
  }

  setNeonColor(hexColor) {
    // Convert hex/string color to THREE.Color object
    const color = new THREE.Color(hexColor);

    // Check if we are setting to the "High Level" orange color
    // Using getHex() to compare integer color values
    const isHighLevel = color.getHex() === 0xffaa00;

    // Update main neon material - reused by many parts (stripes, rings, core)
    if (this.neonMaterial) {
      this.neonMaterial.color.set(color);
    }
    
    // Update visor material
    if (this.visorMaterial) {
      this.visorMaterial.color.set(color);
    }

    // Update glow/transparent materials
    if (this.coreRingMat) {
      this.coreRingMat.color.set(color);
    }
    if (this.visorGlowMat) {
      this.visorGlowMat.color.set(color);
    }
    if (this.groundRingMat) {
      this.groundRingMat.color.set(color);
    }

    // Update "Green" parts (Sword/Thrusters)
    // Now they follow the main neon color (Cyan default, Orange high level)
    if (this.neonGreenMaterial) {
      this.neonGreenMaterial.color.set(color);
    }

    // Update point light
    if (this.playerLight) {
      this.playerLight.color.set(color);
    }
    
    // Update label color if it exists
    if (this.nameLabel) {
      this.nameLabel.material.color.set(color);
    }
  }

  createNameLabel(text, color = '#00ffff') {
    // Remove existing if any
    if (this.nameLabel) {
      this.mesh.remove(this.nameLabel);
      this.nameLabel = null;
    }

    if (!text) return;

    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    // Text style
    context.font = 'bold 60px "Orbitron", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Glow effect
    context.shadowColor = color;
    context.shadowBlur = 20;
    context.fillStyle = color;
    
    // Draw text
    context.fillText(text, 256, 64);

    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      depthTest: false,
      color: 0xffffff // Base white, let texture carry color/glow
    });
    
    this.nameLabel = new THREE.Sprite(material);
    this.nameLabel.position.set(0, 3.5, 0); // Above head
    this.nameLabel.scale.set(2.75, 0.69, 1); // Aspect ratio of canvas (%10 bigger)
    
    this.mesh.add(this.nameLabel);
  }

  removeNameLabel() {
    if (this.nameLabel) {
      this.mesh.remove(this.nameLabel);
      this.nameLabel = null;
    }
  }

  createModel() {
    // Main body - lighter metallic gray (not black)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3a3a45 });
    const accentMat = new THREE.MeshLambertMaterial({ color: 0x4a4a55 });
    
    // Neon materials - Store references
    this.neonMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Default Cyan
    this.neonGreenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // For sword/thrusters (Now Cyan)
    this.visorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Default Cyan
    
    // Transparent glow materials - Store references
    this.coreRingMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff, 
      transparent: true, 
      opacity: 0.5 
    });
    
    this.visorGlowMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff, 
      transparent: true, 
      opacity: 0.4 
    });
    
    this.groundRingMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff, 
      transparent: true, 
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    const neonCyan = this.neonMaterial;
    const visorMat = this.visorMaterial;

    // === TORSO ===
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.35, 0.9, 8),
      bodyMat
    );
    torso.position.y = 1.3;
    this.mesh.add(torso);

    // Torso neon ring
    const torsoRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.05, 8, 16),
      neonCyan
    );
    torsoRing.rotation.x = Math.PI / 2;
    torsoRing.position.y = 1.1;
    this.mesh.add(torsoRing);

    // === CHEST ===
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.55, 0.55),
      accentMat
    );
    chest.position.set(0, 1.45, 0.1);
    this.mesh.add(chest);

    // Chest neon lines
    const chestLine1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.77, 0.08, 0.02),
      neonCyan
    );
    chestLine1.position.set(0, 1.55, 0.38);
    this.mesh.add(chestLine1);
    
    const chestLine2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.77, 0.08, 0.02),
      neonCyan
    );
    chestLine2.position.set(0, 1.35, 0.38);
    this.mesh.add(chestLine2);

    // Power core - bright glowing
    const core = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 16),
      neonCyan
    );
    core.position.set(0, 1.45, 0.39);
    this.mesh.add(core);
    
    // Core glow ring
    const coreRing = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.25, 16),
      this.coreRingMat
    );
    coreRing.position.set(0, 1.45, 0.38);
    this.mesh.add(coreRing);

    // === HEAD ===
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.6, 0.6),
      bodyMat
    );
    head.position.y = 2.0;
    this.mesh.add(head);

    // Helmet accent
    const helmet = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.15, 0.62),
      accentMat
    );
    helmet.position.y = 2.2;
    this.mesh.add(helmet);

    // Visor - bright glowing
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.18, 0.2),
      visorMat
    );
    visor.position.set(0, 2.0, 0.22);
    this.mesh.add(visor);

    // Visor glow effect
    const visorGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.2, 0.05),
      this.visorGlowMat
    );
    visorGlow.position.set(0, 2.0, 0.35);
    this.mesh.add(visorGlow);

    // Head side lights
    const headLight1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.3, 0.08),
      neonCyan
    );
    headLight1.position.set(-0.28, 2.0, 0.1);
    this.mesh.add(headLight1);
    
    const headLight2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.3, 0.08),
      neonCyan
    );
    headLight2.position.set(0.28, 2.0, 0.1);
    this.mesh.add(headLight2);

    // === ARMS ===
    this.createArms(bodyMat, accentMat, neonCyan);

    // === LEGS ===
    this.createLegs(bodyMat, accentMat, neonCyan);

    // === BACKPACK / JETPACK ===
    const backpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.6, 0.3),
      accentMat
    );
    backpack.position.set(0, 1.4, -0.35);
    this.mesh.add(backpack);

    // Jetpack thrusters
    const thruster1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, 0.3, 8),
      this.neonGreenMaterial
    );
    thruster1.position.set(-0.15, 1.1, -0.4);
    this.mesh.add(thruster1);
    
    const thruster2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, 0.3, 8),
      this.neonGreenMaterial
    );
    thruster2.position.set(0.15, 1.1, -0.4);
    this.mesh.add(thruster2);

    // === SWORD ===
    // Handle
    const swordHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8),
      accentMat
    );
    swordHandle.position.set(0.4, 1.6, -0.35);
    swordHandle.rotation.z = -0.5;
    this.mesh.add(swordHandle);
    
    // Blade - glowing
    const swordBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.9, 0.02),
      this.neonGreenMaterial
    );
    swordBlade.position.set(0.55, 2.0, -0.35);
    swordBlade.rotation.z = -0.5;
    this.mesh.add(swordBlade);

    // === POINT LIGHT - makes character glow ===
    this.playerLight = new THREE.PointLight(0x00ffff, 0.8, 15);
    this.playerLight.position.y = 1.5;
    this.mesh.add(this.playerLight);

    // Ground indicator ring
    const groundRing = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.0, 24),
      this.groundRingMat
    );
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.y = 0.05;
    this.mesh.add(groundRing);
  }

  createArms(bodyMat, accentMat, neonMat) {
    const shoulderGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const armGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.75, 8);

    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.55, 1.5, 0);
    
    const lShoulder = new THREE.Mesh(shoulderGeo, accentMat);
    leftArmGroup.add(lShoulder);
    
    const lArm = new THREE.Mesh(armGeo, bodyMat);
    lArm.position.y = -0.4;
    leftArmGroup.add(lArm);
    
    // Arm neon ring
    const lArmRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.03, 8, 16),
      neonMat
    );
    lArmRing.rotation.x = Math.PI / 2;
    lArmRing.position.y = -0.5;
    leftArmGroup.add(lArmRing);
    
    this.mesh.add(leftArmGroup);
    this.userData.leftArm = leftArmGroup;

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.55, 1.5, 0);
    
    const rShoulder = new THREE.Mesh(shoulderGeo, accentMat);
    rightArmGroup.add(rShoulder);
    
    const rArm = new THREE.Mesh(armGeo, bodyMat);
    rArm.position.y = -0.4;
    rightArmGroup.add(rArm);
    
    const rArmRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.03, 8, 16),
      neonMat
    );
    rArmRing.rotation.x = Math.PI / 2;
    rArmRing.position.y = -0.5;
    rightArmGroup.add(rArmRing);
    
    this.mesh.add(rightArmGroup);
    this.userData.rightArm = rightArmGroup;
  }

  createLegs(bodyMat, accentMat, neonMat) {
    const legGeo = new THREE.BoxGeometry(0.32, 0.85, 0.38);

    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.25, 0.8, 0);
    
    const lLeg = new THREE.Mesh(legGeo, bodyMat);
    lLeg.position.y = -0.4;
    leftLegGroup.add(lLeg);
    
    // Leg neon stripe
    const lLegStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.85, 0.4),
      neonMat
    );
    lLegStripe.position.set(-0.14, -0.4, 0);
    leftLegGroup.add(lLegStripe);
    
    // Knee light
    const lKnee = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.1, 0.1),
      neonMat
    );
    lKnee.position.set(0, -0.4, 0.2);
    leftLegGroup.add(lKnee);
    
    this.mesh.add(leftLegGroup);
    this.userData.leftLeg = leftLegGroup;

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.25, 0.8, 0);
    
    const rLeg = new THREE.Mesh(legGeo, bodyMat);
    rLeg.position.y = -0.4;
    rightLegGroup.add(rLeg);
    
    const rLegStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.85, 0.4),
      neonMat
    );
    rLegStripe.position.set(0.14, -0.4, 0);
    rightLegGroup.add(rLegStripe);
    
    const rKnee = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.1, 0.1),
      neonMat
    );
    rKnee.position.set(0, -0.4, 0.2);
    rightLegGroup.add(rKnee);
    
    this.mesh.add(rightLegGroup);
    this.userData.rightLeg = rightLegGroup;
  }

  move(dx, dz) {
    this.mesh.position.x += dx;
    this.mesh.position.z += dz;
    
    if (dx !== 0 || dz !== 0) {
      this.mesh.rotation.y = Math.atan2(dx, dz);
      this.animateWalk(true);
    } else {
      this.animateWalk(false);
    }
  }

  animateWalk(isMoving) {
    if (isMoving) {
      this.userData.walkTime += CONFIG.player.walkAnimationSpeed;
      const wt = this.userData.walkTime;
      
      this.userData.leftArm.rotation.x = Math.sin(wt) * 0.5;
      this.userData.rightArm.rotation.x = -Math.sin(wt) * 0.5;
      this.userData.leftLeg.rotation.x = -Math.sin(wt) * 0.6;
      this.userData.rightLeg.rotation.x = Math.sin(wt) * 0.6;
    } else {
      this.userData.leftArm.rotation.x *= 0.8;
      this.userData.rightArm.rotation.x *= 0.8;
      this.userData.leftLeg.rotation.x *= 0.8;
      this.userData.rightLeg.rotation.x *= 0.8;
    }
  }

  getPosition() {
    return this.mesh.position;
  }

  resetPosition() {
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.userData.walkTime = 0;
    this.animateWalk(false);
  }

  getMesh() {
    return this.mesh;
  }
}

export default Player;
