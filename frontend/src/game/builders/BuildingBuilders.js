import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Building Builders
 * Her bina tipi için 3D model oluşturucu fonksiyonlar
 */

export function buildSwapCity(group) {
  // Ana kule
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(20, 70, 20),
    new THREE.MeshLambertMaterial({ color: 0x000511 })
  );
  tower.position.y = 35;
  tower.castShadow = false;
  group.add(tower);

  // Neon halkalar
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.BoxGeometry(22, 1, 22),
      new THREE.MeshBasicMaterial({ color: 0x00aaff })
    );
    ring.position.y = 15 + i * 18;
    group.add(ring);
  }

  // Holografik panel
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 40),
    new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
  );
  panel.position.set(12, 40, 0);
  panel.rotation.y = Math.PI / 2;
  group.add(panel);
}

export function buildLendingTower(group) {
  // Ana yapı (silindir)
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 18, 50, 8),
    new THREE.MeshLambertMaterial({ color: 0x110011 })
  );
  base.position.y = 25;
  base.castShadow = false;
  group.add(base);

  // Dönen dolar simgesi
  const dollarGeo = new THREE.TorusGeometry(6, 1, 8, 32);
  const dollar = new THREE.Mesh(
    dollarGeo,
    new THREE.MeshBasicMaterial({ color: 0xffd700 })
  );
  dollar.position.y = 60;
  group.add(dollar);
  
  group.userData.animItem = dollar;
}

export function buildMintLab(group) {
  // Kubbe
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x001105 })
  );
  dome.position.y = 10;
  dome.scale.y = 2;
  dome.castShadow = false;
  group.add(dome);

  // Neon halka
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(16, 0.5, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 30;
  group.add(ring);
}

export function buildGoldFaucet(group) {
  // Sütun
  const pillar = new THREE.Mesh(
    new THREE.BoxGeometry(12, 40, 12),
    new THREE.MeshLambertMaterial({ color: 0x221100 })
  );
  pillar.position.y = 20;
  pillar.castShadow = false;
  group.add(pillar);

  // Altın akışı
  const flow = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 6, 30, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.6
    })
  );
  flow.position.y = 25;
  group.add(flow);
  
  group.userData.animItem = flow;
  group.userData.animType = 'float';
}

export default {
  buildSwapCity,
  buildLendingTower,
  buildMintLab,
  buildGoldFaucet
};
