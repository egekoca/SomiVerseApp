import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Player Entity - Titan Mech
 * Oyuncunun kontrol ettiği robot karakter
 * OPTIMIZED: Segment sayıları azaltıldı, material basitleştirildi
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
    
    this.createModel();
    this.mesh.scale.set(CONFIG.player.scale, CONFIG.player.scale, CONFIG.player.scale);
  }

  createModel() {
    // OPTIMIZE: MeshLambertMaterial kullan
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const jointMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const neonMat = new THREE.MeshBasicMaterial({
      color: CONFIG.colors.neonGreen
    });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    // Gövde - OPTIMIZE: Segment azaltıldı
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.3, 0.8, 6),
      darkMat
    );
    torso.position.y = 1.3;
    this.mesh.add(torso);

    // Göğüs
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.5, 0.5),
      darkMat
    );
    chest.position.set(0, 1.4, 0.1);
    this.mesh.add(chest);

    // Neon Çekirdek - OPTIMIZE: Segment azaltıldı
    const core = new THREE.Mesh(
      new THREE.CircleGeometry(0.15, 8),
      neonMat
    );
    core.position.set(0, 1.4, 0.36);
    this.mesh.add(core);

    // Kafa
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.55, 0.55),
      darkMat
    );
    head.position.y = 1.95;
    this.mesh.add(head);

    // Vizör
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.47, 0.15, 0.35),
      visorMat
    );
    visor.position.set(0, 1.95, 0.15);
    this.mesh.add(visor);

    // Kollar
    this.createArms(darkMat, jointMat);

    // Bacaklar
    this.createLegs(darkMat);

    // Kılıç - OPTIMIZE: Segment azaltıldı
    const swordHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6),
      neonMat
    );
    swordHandle.position.set(0.3, 1.6, -0.4);
    swordHandle.rotation.z = -0.5;
    this.mesh.add(swordHandle);

    // OPTIMIZE: Oyuncu gölge düşürmesin (çok pahalı)
    this.mesh.traverse(child => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
  }

  createArms(darkMat, jointMat) {
    const shoulderGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6);

    // Sol Kol
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.5, 1.5, 0);
    leftArmGroup.add(new THREE.Mesh(shoulderGeo, darkMat));
    const lArm = new THREE.Mesh(armGeo, jointMat);
    lArm.position.y = -0.35;
    leftArmGroup.add(lArm);
    this.mesh.add(leftArmGroup);
    this.userData.leftArm = leftArmGroup;

    // Sağ Kol
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.5, 1.5, 0);
    rightArmGroup.add(new THREE.Mesh(shoulderGeo, darkMat));
    const rArm = new THREE.Mesh(armGeo, jointMat);
    rArm.position.y = -0.35;
    rightArmGroup.add(rArm);
    this.mesh.add(rightArmGroup);
    this.userData.rightArm = rightArmGroup;
  }

  createLegs(darkMat) {
    const legGeo = new THREE.BoxGeometry(0.3, 0.8, 0.35);

    // Sol Bacak
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.25, 0.8, 0);
    const lLeg = new THREE.Mesh(legGeo, darkMat);
    lLeg.position.y = -0.4;
    leftLegGroup.add(lLeg);
    this.mesh.add(leftLegGroup);
    this.userData.leftLeg = leftLegGroup;

    // Sağ Bacak
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.25, 0.8, 0);
    const rLeg = new THREE.Mesh(legGeo, darkMat);
    rLeg.position.y = -0.4;
    rightLegGroup.add(rLeg);
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
      // Yavaşça durma pozisyonuna dön
      this.userData.leftArm.rotation.x *= 0.8;
      this.userData.rightArm.rotation.x *= 0.8;
      this.userData.leftLeg.rotation.x *= 0.8;
      this.userData.rightLeg.rotation.x *= 0.8;
    }
  }

  getPosition() {
    return this.mesh.position;
  }

  getMesh() {
    return this.mesh;
  }
}

export default Player;
