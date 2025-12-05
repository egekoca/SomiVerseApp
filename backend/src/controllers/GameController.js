/**
 * Game Controller
 * Oyun mantığı ve oyuncu yönetimi
 */
export class GameController {
  constructor() {
    // Basit in-memory veritabanı (gerçek projede DB kullanılır)
    this.players = new Map();
    this.buildings = this.initBuildings();
  }

  initBuildings() {
    return [
      {
        id: 'swap_city',
        name: 'SWAP CITY',
        type: 'SWAP',
        position: { x: 50, z: -50 },
        color: '#00ccff',
        description: 'Merkezi Borsa'
      },
      {
        id: 'lending_tower',
        name: 'LENDING TOWER',
        type: 'LEND',
        position: { x: -50, z: -50 },
        color: '#ff0055',
        description: 'Likidite Havuzu'
      },
      {
        id: 'mint_lab',
        name: 'MINT LAB',
        type: 'MINT',
        position: { x: 50, z: 50 },
        color: '#00ffaa',
        description: 'NFT Oluşturucu'
      },
      {
        id: 'gold_faucet',
        name: 'GOLD FAUCET',
        type: 'CLAIM',
        position: { x: -50, z: 50 },
        color: '#ffaa00',
        description: 'Günlük Ödüller'
      }
    ];
  }

  getGameStatus() {
    return {
      status: 'running',
      players: this.players.size,
      buildings: this.buildings.length,
      serverTime: new Date().toISOString()
    };
  }

  getBuildings() {
    return this.buildings;
  }

  getPlayer(id) {
    return this.players.get(id) || null;
  }

  createPlayer(data) {
    const id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const player = {
      id,
      name: data.name || 'Anonymous',
      position: { x: 0, z: 0 },
      balance: {
        ETH: 10,
        USDC: 1000,
        TKN: 0
      },
      nfts: [],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    
    this.players.set(id, player);
    return player;
  }

  updatePlayerPosition(id, x, z) {
    const player = this.players.get(id);
    if (!player) return null;
    
    player.position = { x, z };
    player.lastActive = new Date().toISOString();
    return player;
  }
}

export default GameController;

