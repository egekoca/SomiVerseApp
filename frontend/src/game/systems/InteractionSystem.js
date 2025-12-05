import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Interaction System
 * Player and building interaction management
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

    // Find nearest building
    this.buildings.forEach(building => {
      const d = building.getDistanceTo(playerPosition);
      if (d < minDist) {
        minDist = d;
        nearest = building;
      }
    });

    // Check if within interaction range
    if (nearest && minDist < CONFIG.buildings.interactionRange) {
      this.activeBuilding = nearest;
      this.showInteractionUI(nearest);
    } else {
      this.activeBuilding = null;
      this.actionButton.hide();
    }
  }

  showInteractionUI(building) {
    // Set color
    const colorHex = '#' + building.color.toString(16).padStart(6, '0');
    this.actionButton.setColor(colorHex);

    // Calculate button position
    const btnPos = new THREE.Vector3(building.x, 30, building.z);
    btnPos.project(this.camera.getCamera());

    const x = (btnPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = -(btnPos.y * 0.5 - 0.5) * window.innerHeight;

    // Show and position button
    this.actionButton.show();
    this.actionButton.updatePosition(x, y);
    this.actionButton.setText('CONNECT: ' + building.title);
  }

  interact() {
    if (!this.activeBuilding) return false;

    // Open modal
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
