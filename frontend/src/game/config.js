/**
 * Oyun Konfigürasyonu
 * Koyu morumsu renk paleti
 */

export const CONFIG = {
  colors: {
    // Koyu morumsu arka plan (simsiyah değil)
    bg: 0x0d0a14,
    
    // Neon renkler
    neonPink: 0xff0055,
    neonBlue: 0x00ccff,
    neonPurple: 0xaa00ff,
    neonGreen: 0x00ffaa,
    
    // Bina ve şehir - MORUMSU TONLAR
    buildingBase: 0x1a1428,      // Koyu mor bina
    buildingLight: 0x251a35,     // Açık mor bina
    ground: 0x0f0c18,            // Mor zemin
    road: 0x1a1525,              // Mor yol
    
    streetLight: 0xeeddff,
    gold: 0xffaa00
  },
  
  camera: {
    distance: 50,
    positionOffset: { x: 60, y: 60, z: 60 }
  },
  
  player: {
    speed: 0.8,
    scale: 6,
    walkAnimationSpeed: 0.15
  },
  
  city: {
    mapLimit: 200,
    roadWidth: 20,
    collisionPadding: 25,
    sideRoadDistance: 100,
    hubSize: 50,
    buildingDistance: 50
  },
  
  buildings: {
    interactionRange: 35,
    backgroundCount: 50,
    spawnRange: 300
  },
  
  highways: {
    carSpawnInterval: 1200,
    maxCars: 15,
    minSpeed: 0.001,
    maxSpeed: 0.002
  },
  
  streetLights: {
    spacing: 50,
    offset: 15,
    range: 150
  },

  performance: {
    shadowMapSize: 1024,
    maxLights: 8,
    enableStreetLightSpots: false,
    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
    antialias: true
  }
};

export default CONFIG;
