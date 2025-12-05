/**
 * Game Configuration
 * Dark purple color palette
 */

export const CONFIG = {
  colors: {
    // Dark purple background (not pure black)
    bg: 0x0d0a14,
    
    // Neon colors
    neonPink: 0xff0055,
    neonBlue: 0x00ccff,
    neonPurple: 0xaa00ff,
    neonGreen: 0x00ffaa,
    
    // Building and city - PURPLE TONES
    buildingBase: 0x1a1428,      // Dark purple building
    buildingLight: 0x251a35,     // Light purple building
    ground: 0x0f0c18,            // Purple ground
    road: 0x1a1525,              // Purple road
    
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
