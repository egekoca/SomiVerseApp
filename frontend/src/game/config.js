/**
 * Oyun Konfigürasyonu
 * Tüm sabit değerler ve renk ayarları burada tanımlanır
 */

export const CONFIG = {
  colors: {
    bg: 0x050510,
    neonPink: 0xff0055,
    neonBlue: 0x00ccff,
    neonPurple: 0xaa00ff,
    neonGreen: 0x00ffaa,
    buildingBase: 0x111118,
    buildingWindow: 0x222233,
    streetLight: 0xffffee,
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
    spacing: 60,
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
