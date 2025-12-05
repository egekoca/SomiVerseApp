/**
 * ProfileService
 * Manages user profiles, XP, and NFTs
 */

const STORAGE_KEY = 'somiverse_profiles';

class ProfileServiceClass {
  constructor() {
    this.currentProfile = null;
  }

  /**
   * Get all profiles from storage
   */
  getAllProfiles() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error reading profiles:', e);
      return {};
    }
  }

  /**
   * Save all profiles to storage
   */
  saveProfiles(profiles) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Error saving profiles:', e);
    }
  }

  /**
   * Check if profile exists for wallet
   */
  profileExists(walletAddress) {
    const profiles = this.getAllProfiles();
    return !!profiles[walletAddress.toLowerCase()];
  }

  /**
   * Create new profile for wallet
   */
  createProfile(walletAddress) {
    const profiles = this.getAllProfiles();
    const address = walletAddress.toLowerCase();

    if (profiles[address]) {
      return profiles[address];
    }

    const newProfile = {
      walletAddress: address,
      displayAddress: walletAddress,
      avatar: 'titan-mech', // Default avatar
      xp: 0,
      level: 1,
      nfts: [],
      stats: {
        swapsCompleted: 0,
        lendingActions: 0,
        nftsMinted: 0,
        faucetClaims: 0
      },
      achievements: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    profiles[address] = newProfile;
    this.saveProfiles(profiles);
    this.currentProfile = newProfile;

    console.log('Profile created for:', address);
    return newProfile;
  }

  /**
   * Get profile by wallet address
   */
  getProfile(walletAddress) {
    const profiles = this.getAllProfiles();
    const address = walletAddress.toLowerCase();
    return profiles[address] || null;
  }

  /**
   * Get or create profile
   */
  getOrCreateProfile(walletAddress) {
    let profile = this.getProfile(walletAddress);
    
    if (!profile) {
      profile = this.createProfile(walletAddress);
    } else {
      // Update last login
      profile.lastLogin = new Date().toISOString();
      this.updateProfile(walletAddress, profile);
    }

    this.currentProfile = profile;
    return profile;
  }

  /**
   * Update profile
   */
  updateProfile(walletAddress, updates) {
    const profiles = this.getAllProfiles();
    const address = walletAddress.toLowerCase();

    if (profiles[address]) {
      profiles[address] = { ...profiles[address], ...updates };
      this.saveProfiles(profiles);
      this.currentProfile = profiles[address];
      return profiles[address];
    }
    return null;
  }

  /**
   * Add XP to profile
   */
  addXP(walletAddress, amount) {
    const profile = this.getProfile(walletAddress);
    if (profile) {
      const newXP = profile.xp + amount;
      const newLevel = this.calculateLevel(newXP);
      
      this.updateProfile(walletAddress, {
        xp: newXP,
        level: newLevel
      });

      // Dispatch XP event
      window.dispatchEvent(new CustomEvent('xpGained', {
        detail: { amount, totalXP: newXP, level: newLevel }
      }));

      return { xp: newXP, level: newLevel };
    }
    return null;
  }

  /**
   * Calculate level from XP
   */
  calculateLevel(xp) {
    // Level thresholds: 0, 100, 300, 600, 1000, 1500, 2100...
    // Formula: level n requires n*(n-1)*50 XP
    let level = 1;
    let requiredXP = 0;
    
    while (xp >= requiredXP) {
      level++;
      requiredXP = level * (level - 1) * 50;
    }
    
    return level - 1;
  }

  /**
   * Get XP required for next level
   */
  getXPForNextLevel(currentLevel) {
    return (currentLevel + 1) * currentLevel * 50;
  }

  /**
   * Add NFT to profile
   */
  addNFT(walletAddress, nft) {
    const profile = this.getProfile(walletAddress);
    if (profile) {
      const nfts = [...profile.nfts, {
        ...nft,
        id: `nft_${Date.now()}`,
        mintedAt: new Date().toISOString()
      }];
      
      this.updateProfile(walletAddress, { nfts });
      return nfts;
    }
    return null;
  }

  /**
   * Update stats
   */
  updateStats(walletAddress, statKey, increment = 1) {
    const profile = this.getProfile(walletAddress);
    if (profile && profile.stats[statKey] !== undefined) {
      const stats = {
        ...profile.stats,
        [statKey]: profile.stats[statKey] + increment
      };
      this.updateProfile(walletAddress, { stats });
      return stats;
    }
    return null;
  }

  /**
   * Get current profile
   */
  getCurrentProfile() {
    return this.currentProfile;
  }

  /**
   * Clear current profile (on disconnect)
   */
  clearCurrentProfile() {
    this.currentProfile = null;
  }
}

// Singleton instance
export const ProfileService = new ProfileServiceClass();
export default ProfileService;

