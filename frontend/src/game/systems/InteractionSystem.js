import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Interaction System
 * Oyuncu ve binalar arası etkileşim yönetimi
 */
export class InteractionSystem {
  constructor(camera, actionButton, modal) {
    this.camera = camera;
    this.actionButton = actionButton;
    this.modal = modal;
    this.buildings = [];
    this.activeBuilding = null;
    this.enabled = true;
  }

  setBuildings(buildings) {
    this.buildings = buildings;
  }

  update(playerPosition) {
    if (!this.enabled || this.modal.isOpen) return;

    let nearest = null;
    let minDist = Infinity;

    // En yakın binayı bul
    this.buildings.forEach(building => {
      const d = building.getDistanceTo(playerPosition);
      if (d < minDist) {
        minDist = d;
        nearest = building;
      }
    });

    // Etkileşim mesafesinde mi?
    if (nearest && minDist < CONFIG.buildings.interactionRange) {
      this.activeBuilding = nearest;
      this.showInteractionUI(nearest);
    } else {
      this.activeBuilding = null;
      this.actionButton.hide();
    }
  }

  showInteractionUI(building) {
    // Rengi ayarla
    const colorHex = '#' + building.color.toString(16).padStart(6, '0');
    this.actionButton.setColor(colorHex);

    // Buton pozisyonunu hesapla
    const btnPos = new THREE.Vector3(building.x, 30, building.z);
    btnPos.project(this.camera.getCamera());

    const x = (btnPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = -(btnPos.y * 0.5 - 0.5) * window.innerHeight;

    // Butonı göster ve pozisyonla
    this.actionButton.show();
    this.actionButton.updatePosition(x, y);
    this.actionButton.setText('BAĞLAN: ' + building.title);
  }

  interact() {
    if (!this.activeBuilding) return false;

    // Modal'ı aç
    this.modal.open(
      this.activeBuilding.title,
      this.activeBuilding.contentGenerator(),
      this.activeBuilding.color
    );

    this.actionButton.hide();
    return true;
  }

  getActiveBuilding() {
    return this.activeBuilding;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.actionButton.hide();
  }
}

export default InteractionSystem;

