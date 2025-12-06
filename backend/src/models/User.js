/**
 * User Model
 * Handles database interactions and business logic for player profiles
 */
import { supabase } from '../config/supabase.js';

export class User {
  constructor(data) {
    this.id = data.id;
    this.wallet_address = data.wallet_address;
    this.xp = data.xp || 0;
    this.level = data.level || 1;
    this.avatar = data.avatar || 'titan-mech';
    this.position = data.position || { x: 0, y: 0, z: 0 }; // Position support
    this.nfts = data.nfts || [];
    this.stats = data.stats || {
      swapsCompleted: 0,
      lendingActions: 0,
      nftsMinted: 0,
      faucetClaims: 0
    };
    this.achievements = data.achievements || [];
    this.visual_config = data.visual_config || {
      lightColor: '#00ffff', // Default Neon Blue
      modelType: 'standard',
      aura: 'none'
    };
    this.created_at = data.created_at;
    this.last_login = data.last_login;
  }

  /**
   * Find user by wallet address or create new one
   */
  static async findOrCreate(walletAddress) {
    const normalizedAddress = walletAddress.toLowerCase();

    // Try to find
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .single();

    if (existingUser) {
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', existingUser.id);
        
      return new User(existingUser);
    }

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error('Error finding user:', findError);
      throw findError;
    }

    // Create new
    const newUser = {
      wallet_address: normalizedAddress,
      xp: 0,
      level: 1,
      position: { x: 0, y: 0, z: 0 }, // Default spawn point
      stats: {
        swapsCompleted: 0,
        lendingActions: 0,
        nftsMinted: 0,
        faucetClaims: 0
      },
      visual_config: {
        lightColor: '#00ffff',
        modelType: 'standard',
        aura: 'none'
      }
    };

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    return new User(createdUser);
  }

  /**
   * Find user by wallet address
   */
  static async findByAddress(walletAddress) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error) return null;
    return new User(data);
  }

  /**
   * Get Leaderboard
   */
  static async getLeaderboard(limit = 10) {
    const { data, error } = await supabase
      .from('users')
      .select('wallet_address, xp, level')
      .order('xp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Leaderboard error:', error);
      return [];
    }

    return data.map((u, i) => ({
      rank: i + 1,
      address: `${u.wallet_address.slice(0, 6)}...${u.wallet_address.slice(-4)}`,
      level: u.level,
      xp: u.xp
    }));
  }

  /**
   * Update XP and Level
   * Contains logic for visual changes based on level
   */
  async addXP(amount) {
    this.xp += amount;
    this.level = this.calculateLevel(this.xp);
    this.updateVisuals();

    const { error } = await supabase
      .from('users')
      .update({
        xp: this.xp,
        level: this.level,
        visual_config: this.visual_config
      })
      .eq('id', this.id);

    if (error) throw error;
    return this;
  }

  /**
   * Update User Position
   */
  async updatePosition(pos) {
    // Validate input lightly
    if (typeof pos.x !== 'number' || typeof pos.z !== 'number') {
      throw new Error('Invalid position format');
    }

    this.position = pos;

    const { error } = await supabase
      .from('users')
      .update({ position: this.position })
      .eq('id', this.id);

    if (error) throw error;
    return this.position;
  }

  /**
   * Logic to determine character appearance based on stats
   */
  updateVisuals() {
    // Level 5+ gets Purple lights
    if (this.level >= 5) {
      this.visual_config.lightColor = '#9d00ff'; // Neon Purple
      this.visual_config.aura = 'weak_pulse';
    }
    
    // Level 10+ gets Gold lights and strong aura
    if (this.level >= 10) {
      this.visual_config.lightColor = '#ffd700'; // Gold
      this.visual_config.aura = 'strong_pulse';
    }

    // Level 20+ changes model type (Example)
    if (this.level >= 20) {
      this.visual_config.modelType = 'cyber_elite';
    }
  }

  calculateLevel(xp) {
    let level = 1;
    let requiredXP = 0;
    while (xp >= requiredXP) {
      level++;
      requiredXP = level * (level - 1) * 50;
    }
    return level - 1;
  }

  /**
   * Add NFT
   */
  async addNFT(nftData) {
    const newNFT = {
      ...nftData,
      id: `nft_${Date.now()}`,
      mintedAt: new Date().toISOString()
    };
    
    this.nfts.push(newNFT);
    this.stats.nftsMinted++;

    const { error } = await supabase
      .from('users')
      .update({
        nfts: this.nfts,
        stats: this.stats
      })
      .eq('id', this.id);

    if (error) throw error;
    return newNFT;
  }

  /**
   * Update Stats
   */
  async updateStat(statKey, increment = 1) {
    if (this.stats[statKey] !== undefined) {
      this.stats[statKey] += increment;
      
      const { error } = await supabase
        .from('users')
        .update({ stats: this.stats })
        .eq('id', this.id);
        
      if (error) throw error;
    }
    return this.stats;
  }
}
