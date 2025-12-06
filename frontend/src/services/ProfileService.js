/**
 * ProfileService
 * Manages user profiles, XP, and NFTs via Backend API
 */

const API_URL = 'http://localhost:4000/api';

class ProfileServiceClass {
  constructor() {
    this.currentProfile = null;
  }

  /**
   * Helper for API requests
   */
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      return null;
    }
  }

  /**
   * Get or create profile (Login)
   */
  async getOrCreateProfile(walletAddress) {
    if (!walletAddress) return null;

    // Call backend to find or create
    const profile = await this.request(`/profile/${walletAddress}`, {
      method: 'POST', // Using POST for "create or update" semantics
      body: JSON.stringify({}) 
    });

    if (profile) {
      this.currentProfile = profile;
    }

    return profile;
  }

  /**
   * Get profile by wallet address
   */
  async getProfile(walletAddress) {
    return await this.request(`/profile/${walletAddress}`);
  }

  /**
   * Add XP to profile
   */
  async addXP(walletAddress, amount) {
    const response = await this.request(`/profile/${walletAddress}/xp`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });

    if (response) {
      // Update local cache if it matches current profile
      if (this.currentProfile && this.currentProfile.wallet_address === walletAddress) {
        this.currentProfile.xp = response.xp;
        this.currentProfile.level = response.level;
        this.currentProfile.visual_config = response.visual_config;
      }

      // Dispatch XP event
      window.dispatchEvent(new CustomEvent('xpGained', {
        detail: { amount, totalXP: response.xp, level: response.level }
      }));
      
      // If visual config changed, we might want to dispatch an event for that too
      if (response.visual_config) {
         window.dispatchEvent(new CustomEvent('visualsUpdated', {
            detail: response.visual_config
         }));
      }
    }

    return response;
  }

  /**
   * Add NFT to profile
   */
  async addNFT(walletAddress, nft) {
    const newNFT = await this.request(`/profile/${walletAddress}/nft`, {
      method: 'POST',
      body: JSON.stringify(nft)
    });

    if (newNFT && this.currentProfile && this.currentProfile.wallet_address === walletAddress) {
      this.currentProfile.nfts.push(newNFT);
    }

    return newNFT;
  }

  /**
   * Update stats
   */
  async updateStats(walletAddress, statKey, increment = 1) {
    const stats = await this.request(`/profile/${walletAddress}/stats`, {
      method: 'PATCH',
      body: JSON.stringify({ stat: statKey, increment })
    });

    if (stats && this.currentProfile && this.currentProfile.wallet_address === walletAddress) {
      this.currentProfile.stats = stats;
    }

    return stats;
  }

  /**
   * Update position
   */
  async updatePosition(walletAddress, pos) {
    // Optimization: Don't wait for response
    this.request(`/profile/${walletAddress}/position`, {
      method: 'POST',
      body: JSON.stringify(pos)
    });
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
  
  // Helpers for calculations (Client side prediction if needed, but truth is on server)
  getXPForNextLevel(currentLevel) {
    return (currentLevel + 1) * currentLevel * 50;
  }
}

// Singleton instance
export const ProfileService = new ProfileServiceClass();
export default ProfileService;
