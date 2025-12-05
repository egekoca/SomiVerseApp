import { CONFIG } from '../config.js';

/**
 * Zone Manager
 * Şehir planlama ve çarpışma bölgeleri yönetimi
 */
export class ZoneManager {
  constructor() {
    this.occupiedZones = [];
    this.reserveMainZones();
  }

  reserveMainZones() {
    const { mapLimit, collisionPadding, sideRoadDistance, hubSize, buildingDistance } = CONFIG.city;

    // -- YOLLAR (Grid Sistemi) --
    // Merkez Yollar
    this.addZone(0, 0, collisionPadding, mapLimit * 2); // Dikey Merkez
    this.addZone(0, 0, mapLimit * 2, collisionPadding); // Yatay Merkez

    // Yan Yollar
    // Dikey Yanlar
    this.addZone(sideRoadDistance, 0, collisionPadding, mapLimit * 2);
    this.addZone(-sideRoadDistance, 0, collisionPadding, mapLimit * 2);

    // Yatay Yanlar
    this.addZone(0, sideRoadDistance, mapLimit * 2, collisionPadding);
    this.addZone(0, -sideRoadDistance, mapLimit * 2, collisionPadding);

    // -- ANA BİNA BÖLGELERİ --
    const dist = buildingDistance;
    this.addZone(dist, -dist, hubSize, hubSize);
    this.addZone(-dist, -dist, hubSize, hubSize);
    this.addZone(dist, dist, hubSize, hubSize);
    this.addZone(-dist, dist, hubSize, hubSize);
  }

  addZone(x, z, w, d) {
    this.occupiedZones.push({ x, z, w, d });
  }

  checkCollision(x, z, w, d) {
    for (const zone of this.occupiedZones) {
      const overlapX = Math.abs(x - zone.x) < (w + zone.w) / 2;
      const overlapZ = Math.abs(z - zone.z) < (d + zone.d) / 2;
      if (overlapX && overlapZ) return true;
    }
    return false;
  }

  getOccupiedZones() {
    return this.occupiedZones;
  }
}

export default ZoneManager;

