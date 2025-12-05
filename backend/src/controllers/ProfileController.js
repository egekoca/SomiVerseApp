/**
 * ProfileController
 * Handles profile-related operations
 */

// In-memory storage (replace with database in production)
const profiles = new Map();

export class ProfileController {
  /**
   * Get profile by wallet address
   */
  static getProfile(req, res) {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const normalizedAddress = address.toLowerCase();
    const profile = profiles.get(normalizedAddress);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  }

  /**
   * Create or update profile
   */
  static createOrUpdateProfile(req, res) {
    const { address } = req.params;
    const updates = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const normalizedAddress = address.toLowerCase();
    let profile = profiles.get(normalizedAddress);

    if (!profile) {
      // Create new profile
      profile = {
        walletAddress: normalizedAddress,
        displayAddress: address,
        avatar: 'titan-mech',
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
    } else {
      // Update existing profile
      profile = { ...profile, ...updates, lastLogin: new Date().toISOString() };
    }

    profiles.set(normalizedAddress, profile);
    res.json(profile);
  }

  /**
   * Add XP to profile
   */
  static addXP(req, res) {
    const { address } = req.params;
    const { amount } = req.body;

    if (!address || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Wallet address and XP amount required' });
    }

    const normalizedAddress = address.toLowerCase();
    const profile = profiles.get(normalizedAddress);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    profile.xp += amount;
    profile.level = ProfileController.calculateLevel(profile.xp);
    profiles.set(normalizedAddress, profile);

    res.json({
      xp: profile.xp,
      level: profile.level,
      added: amount
    });
  }

  /**
   * Add NFT to profile
   */
  static addNFT(req, res) {
    const { address } = req.params;
    const nft = req.body;

    if (!address || !nft) {
      return res.status(400).json({ error: 'Wallet address and NFT data required' });
    }

    const normalizedAddress = address.toLowerCase();
    const profile = profiles.get(normalizedAddress);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const newNFT = {
      ...nft,
      id: `nft_${Date.now()}`,
      mintedAt: new Date().toISOString()
    };

    profile.nfts.push(newNFT);
    profile.stats.nftsMinted++;
    profiles.set(normalizedAddress, profile);

    res.json(newNFT);
  }

  /**
   * Update stats
   */
  static updateStats(req, res) {
    const { address } = req.params;
    const { stat, increment = 1 } = req.body;

    if (!address || !stat) {
      return res.status(400).json({ error: 'Wallet address and stat key required' });
    }

    const normalizedAddress = address.toLowerCase();
    const profile = profiles.get(normalizedAddress);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.stats[stat] !== undefined) {
      profile.stats[stat] += increment;
      profiles.set(normalizedAddress, profile);
    }

    res.json(profile.stats);
  }

  /**
   * Get leaderboard
   */
  static getLeaderboard(req, res) {
    const { limit = 10 } = req.query;

    const leaderboard = Array.from(profiles.values())
      .sort((a, b) => b.xp - a.xp)
      .slice(0, parseInt(limit))
      .map((p, index) => ({
        rank: index + 1,
        address: `${p.displayAddress.slice(0, 6)}...${p.displayAddress.slice(-4)}`,
        level: p.level,
        xp: p.xp
      }));

    res.json(leaderboard);
  }

  /**
   * Calculate level from XP
   */
  static calculateLevel(xp) {
    let level = 1;
    let requiredXP = 0;
    
    while (xp >= requiredXP) {
      level++;
      requiredXP = level * (level - 1) * 50;
    }
    
    return level - 1;
  }
}

export default ProfileController;

