/**
 * ProfileController
 * Handles profile-related operations using Supabase via User model
 */
import { User } from '../models/User.js';

export class ProfileController {
  /**
   * Get profile by wallet address
   */
  static async getProfile(req, res) {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    try {
      const user = await User.findByAddress(address);

      if (!user) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get Profile Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create or update profile (Login/Connect)
   */
  static async createOrUpdateProfile(req, res) {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    try {
      const user = await User.findOrCreate(address);
      res.json(user);
    } catch (error) {
      console.error('Create/Update Profile Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Add XP to profile
   */
  static async addXP(req, res) {
    const { address } = req.params;
    const { amount } = req.body;

    if (!address || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Wallet address and XP amount required' });
    }

    try {
      let user = await User.findByAddress(address);
      
      if (!user) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      user = await user.addXP(amount);

      res.json({
        xp: user.xp,
        level: user.level,
        added: amount,
        visual_config: user.visual_config // Return visual updates
      });
    } catch (error) {
      console.error('Add XP Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Add NFT to profile
   */
  static async addNFT(req, res) {
    const { address } = req.params;
    const nft = req.body;

    if (!address || !nft) {
      return res.status(400).json({ error: 'Wallet address and NFT data required' });
    }

    try {
      let user = await User.findByAddress(address);

      if (!user) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const newNFT = await user.addNFT(nft);
      res.json(newNFT);
    } catch (error) {
      console.error('Add NFT Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update stats
   */
  static async updateStats(req, res) {
    const { address } = req.params;
    const { stat, increment = 1 } = req.body;

    if (!address || !stat) {
      return res.status(400).json({ error: 'Wallet address and stat key required' });
    }

    try {
      let user = await User.findByAddress(address);

      if (!user) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const stats = await user.updateStat(stat, increment);
      res.json(stats);
    } catch (error) {
      console.error('Update Stats Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update Position
   */
  static async updatePosition(req, res) {
    const { address } = req.params;
    const { x, y, z } = req.body;

    if (!address || x === undefined || z === undefined) {
      return res.status(400).json({ error: 'Wallet address and position (x, z) required' });
    }

    try {
      let user = await User.findByAddress(address);

      if (!user) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const newPos = await user.updatePosition({ x, y: y || 0, z });
      res.json(newPos);
    } catch (error) {
      console.error('Update Position Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(req, res) {
    const { limit = 10 } = req.query;

    try {
      const leaderboard = await User.getLeaderboard(parseInt(limit));
      res.json(leaderboard);
    } catch (error) {
      console.error('Leaderboard Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default ProfileController;
