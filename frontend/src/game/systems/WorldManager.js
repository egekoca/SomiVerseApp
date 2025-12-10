import { CONFIG } from '../config.js';
import { CityBase } from '../world/CityBase.js';
import { StreetLights } from '../world/StreetLights.js';
import { Highways } from '../world/Highways.js';
import { BackgroundCity } from '../world/BackgroundCity.js';
import { ZoneManager } from '../world/ZoneManager.js';
import { Billboards } from '../world/Billboards.js';
import { HugeBillboards } from '../world/HugeBillboards.js';
import { Building } from '../entities/Building.js';
import {
  buildSwapCity,
  buildLendingTower,
  buildMintLab,
  buildGoldFaucet,
  buildDomainHub,
  buildBridge
} from '../builders/BuildingBuilders.js';
import {
  generateSwapContent,
  generateLendingContent,
  generateMintContent,
  generateFaucetContent,
  generateDomainContent,
  generateBridgeContent
} from '../../components/ModalContent.js';

/**
 * WorldManager
 * Handles world creation and management
 */
export class WorldManager {
  constructor(scene, zoneManager) {
    this.scene = scene;
    this.zoneManager = zoneManager;
    this.highways = null;
    this.billboards = null;
    this.hugeBillboards = null;
    this.buildings = [];
    this.physicsColliders = [];
  }

  async create() {
    // City base
    new CityBase(this.scene);

    // Street lights
    new StreetLights(this.scene);

    // Highways
    this.highways = new Highways(this.scene);

    // Background buildings
    const bgCity = new BackgroundCity(this.scene, this.zoneManager.getOccupiedZones());
    // Add background buildings to physics collision
    this.physicsColliders.push(...bgCity.getColliders());

    // LED Billboards
    this.billboards = new Billboards(this.scene);
    await this.billboards.create();

    // Huge Boundary Billboards
    this.hugeBillboards = new HugeBillboards(this.scene);
    await this.hugeBillboards.create();

    // Interactive buildings
    this.createInteractiveBuildings();
  }

  createInteractiveBuildings() {
    const dist = CONFIG.city.buildingDistance;
    const domainX = -dist * 3; // further left of faucet lane
    const domainZ = dist;
    const bridgeX = -dist * 3.0; // Left of Lend, not too close to edge
    const bridgeZ = -dist * 1.0; // Align roughly with Lend's Z row

    // Add Main Building Colliders (Box 30x30)
    const mainColliderSize = 30;
    this.physicsColliders.push(
      { x: dist, z: -dist, w: mainColliderSize, d: mainColliderSize }, // Swap
      { x: -dist, z: -dist, w: mainColliderSize, d: mainColliderSize }, // Lend
      { x: dist, z: dist, w: mainColliderSize, d: mainColliderSize }, // Mint
      { x: -dist, z: dist, w: mainColliderSize, d: mainColliderSize }, // Faucet
      { x: domainX, z: domainZ, w: mainColliderSize, d: mainColliderSize }, // Domain
      { x: bridgeX, z: bridgeZ, w: mainColliderSize * 0.6, d: mainColliderSize * 0.6 } // Bridge (smaller collider)
    );

    // SWAP CITY
    const swapBuilding = new Building({
      x: dist,
      z: -dist,
      color: CONFIG.colors.neonBlue,
      title: 'SWAP CITY',
      subtitle: 'CENTRAL EXCHANGE',
      type: 'SWAP',
      builderFn: buildSwapCity,
      contentGenerator: generateSwapContent
    });
    this.scene.add(swapBuilding.getMesh());
    this.buildings.push(swapBuilding);

    // LENDING TOWER
    const lendingBuilding = new Building({
      x: -dist,
      z: -dist,
      color: CONFIG.colors.neonPink,
      title: 'LENDING TOWER',
      subtitle: 'LIQUIDITY POOL',
      type: 'LEND',
      builderFn: buildLendingTower,
      contentGenerator: generateLendingContent
    });
    this.scene.add(lendingBuilding.getMesh());
    this.buildings.push(lendingBuilding);

    // BRIDGE
    const bridgeBuilding = new Building({
      x: bridgeX,
      z: bridgeZ,
      color: 0xff0022, // Neon red (button/ring color)
      title: 'BRIDGE',
      subtitle: 'CROSS-CHAIN BRIDGE',
      type: 'BRIDGE',
      builderFn: buildBridge,
      contentGenerator: generateBridgeContent
    });
    this.scene.add(bridgeBuilding.getMesh());
    this.buildings.push(bridgeBuilding);

    // MINT LAB
    const mintBuilding = new Building({
      x: dist,
      z: dist,
      color: CONFIG.colors.neonGreen,
      title: 'MINT LAB',
      subtitle: 'NFT CREATOR',
      type: 'MINT',
      builderFn: buildMintLab,
      contentGenerator: generateMintContent
    });
    this.scene.add(mintBuilding.getMesh());
    this.buildings.push(mintBuilding);

    // GOLD FAUCET
    const faucetBuilding = new Building({
      x: -dist,
      z: dist,
      color: CONFIG.colors.gold,
      title: 'STT FAUCET',
      subtitle: 'DAILY REWARDS',
      type: 'CLAIM',
      builderFn: buildGoldFaucet,
      contentGenerator: generateFaucetContent
    });
    this.scene.add(faucetBuilding.getMesh());
    this.buildings.push(faucetBuilding);

    // SOMNIA DOMAIN SERVICE (center hub)
    const domainBuilding = new Building({
      x: domainX,
      z: domainZ,
      color: CONFIG.colors.neonPurple,
      title: 'SOMNIA DOMAIN SERVICE',
      subtitle: 'GET YOUR .SOMI',
      type: 'DOMAIN',
      builderFn: buildDomainHub,
      contentGenerator: generateDomainContent
    });
    this.scene.add(domainBuilding.getMesh());
    this.buildings.push(domainBuilding);
  }

  update(deltaTime) {
    // Update highway cars
    if (this.highways) {
      this.highways.update();
    }

    // Update billboards
    if (this.billboards) {
      this.billboards.update(deltaTime);
    }

    // Update building animations
    this.buildings.forEach(building => building.update());
  }

  getBuildings() {
    return this.buildings;
  }

  getPhysicsColliders() {
    return this.physicsColliders;
  }

  getHugeBillboards() {
    return this.hugeBillboards;
  }

  dispose() {
    if (this.highways) {
      this.highways.dispose();
    }
  }
}

