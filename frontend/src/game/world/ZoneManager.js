import { CONFIG } from '../config.js';

/**
 * Zone Manager
 * Şehir planlama ve çarpışma bölgeleri yönetimi
 * Ana bina alanları daha geniş rezerve edildi
 */
export class ZoneManager {
  constructor() {
    this.occupiedZones = [];
    this.reserveMainZones();
  }

  reserveMainZones() {
    const { mapLimit, collisionPadding, sideRoadDistance, buildingDistance } = CONFIG.city;

    // -- YOLLAR (Grid Sistemi) --
    // Merkez Yollar
    this.addZone(0, 0, collisionPadding, mapLimit * 2);
    this.addZone(0, 0, mapLimit * 2, collisionPadding);

    // Yan Yollar - Dikey
    this.addZone(sideRoadDistance, 0, collisionPadding, mapLimit * 2);
    this.addZone(-sideRoadDistance, 0, collisionPadding, mapLimit * 2);

    // Yan Yollar - Yatay
    this.addZone(0, sideRoadDistance, mapLimit * 2, collisionPadding);
    this.addZone(0, -sideRoadDistance, mapLimit * 2, collisionPadding);

    // -- ANA BİNA BÖLGELERİ --
    // Daha geniş alan rezerve et - arka plan binaları girmesin
    const dist = buildingDistance;
    const hubSize = 70; // Daha geniş alan (50 -> 70)
    
    // 4 ana bina alanı
    this.addZone(dist, -dist, hubSize, hubSize);   // Sağ üst - SWAP
    this.addZone(-dist, -dist, hubSize, hubSize);  // Sol üst - LEND
    this.addZone(dist, dist, hubSize, hubSize);    // Sağ alt - MINT
    this.addZone(-dist, dist, hubSize, hubSize);   // Sol alt - CLAIM
    // Somnia Domain Service - west of faucet (shifted further left)
    this.addZone(-dist * 2.5, dist, hubSize, hubSize);

    // -- BILLBOARD ALANLARI --
    // 3 büyük reklam panosu
    const billboardSize = 30;
    this.addZone(0, -70, billboardSize, billboardSize);    // North
    this.addZone(75, 0, billboardSize, billboardSize);     // East
    this.addZone(-75, 0, billboardSize, billboardSize);    // West
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
