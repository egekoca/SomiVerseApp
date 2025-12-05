import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Building Builders
 * Her bina tipi için 3D model oluşturucu fonksiyonlar
 * TÜM MESH'LER frustumCulled = false
 */

function setAlwaysVisible(mesh) {
  mesh.frustumCulled = false;
  if (mesh.material) {
    mesh.material.fog = false;
  }
}

export function buildSwapCity(group) {
  // Ana kule
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(20, 70, 20),
    new THREE.MeshLambertMaterial({ color: 0x000511, fog: false })
  );
  tower.position.y = 35;
  tower.castShadow = false;
  setAlwaysVisible(tower);
  group.add(tower);

  // Neon halkalar
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.BoxGeometry(22, 1, 22),
      new THREE.MeshBasicMaterial({ color: 0x00aaff, fog: false })
    );
    ring.position.y = 15 + i * 18;
    setAlwaysVisible(ring);
    group.add(ring);
  }

  // Holografik panel
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 40),
    new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      fog: false
    })
  );
  panel.position.set(12, 40, 0);
  panel.rotation.y = Math.PI / 2;
  setAlwaysVisible(panel);
  group.add(panel);
}

export function buildLendingTower(group) {
  // Ana yapı (silindir)
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 18, 50, 8),
    new THREE.MeshLambertMaterial({ color: 0x110011, fog: false })
  );
  base.position.y = 25;
  base.castShadow = false;
  setAlwaysVisible(base);
  group.add(base);

  // Alt neon halka
  const bottomRing = new THREE.Mesh(
    new THREE.TorusGeometry(17, 0.8, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xff0066, fog: false })
  );
  bottomRing.rotation.x = Math.PI / 2;
  bottomRing.position.y = 2;
  setAlwaysVisible(bottomRing);
  group.add(bottomRing);

  // Orta neon halka
  const middleRing = new THREE.Mesh(
    new THREE.TorusGeometry(16, 0.8, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xff0066, fog: false })
  );
  middleRing.rotation.x = Math.PI / 2;
  middleRing.position.y = 25;
  setAlwaysVisible(middleRing);
  group.add(middleRing);

  // Dönen dolar simgesi
  const dollarGeo = new THREE.TorusGeometry(6, 1, 8, 32);
  const dollar = new THREE.Mesh(
    dollarGeo,
    new THREE.MeshBasicMaterial({ color: 0xffd700, fog: false })
  );
  dollar.position.y = 60;
  setAlwaysVisible(dollar);
  group.add(dollar);
  
  group.userData.animItem = dollar;
}

export function buildMintLab(group) {
  // Kubbe
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x001105, fog: false })
  );
  dome.position.y = 10;
  dome.scale.y = 2;
  dome.castShadow = false;
  setAlwaysVisible(dome);
  group.add(dome);

  // Neon halka
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(16, 0.5, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, fog: false })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 30;
  setAlwaysVisible(ring);
  group.add(ring);
}

export function buildGoldFaucet(group) {
  // Ana sütun
  const pillar = new THREE.Mesh(
    new THREE.BoxGeometry(12, 40, 12),
    new THREE.MeshLambertMaterial({ color: 0x221100, fog: false })
  );
  pillar.position.y = 20;
  pillar.castShadow = false;
  setAlwaysVisible(pillar);
  group.add(pillar);

  // Binanın üstünde altın çıkıntı
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(4, 15, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
      fog: false
    })
  );
  spire.position.y = 48;
  setAlwaysVisible(spire);
  group.add(spire);

  // Altın küre
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(3, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffcc00, fog: false })
  );
  orb.position.y = 58;
  setAlwaysVisible(orb);
  group.add(orb);

  // Altın halka
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(5, 0.5, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xffdd00, fog: false })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 45;
  setAlwaysVisible(ring);
  group.add(ring);
}

export default {
  buildSwapCity,
  buildLendingTower,
  buildMintLab,
  buildGoldFaucet
};
