/**
 * Profile Routes
 * API endpoints for user profiles
 */
import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController.js';

const router = Router();

// Get leaderboard
router.get('/leaderboard', ProfileController.getLeaderboard);

// Get profile by address
router.get('/:address', ProfileController.getProfile);

// Create or update profile
router.post('/:address', ProfileController.createOrUpdateProfile);
router.put('/:address', ProfileController.createOrUpdateProfile);

// Add XP
router.post('/:address/xp', ProfileController.addXP);

// Add NFT
router.post('/:address/nfts', ProfileController.addNFT);

// Update stats
router.post('/:address/stats', ProfileController.updateStats);

// Update position
router.post('/:address/position', ProfileController.updatePosition);

export { router as profileRoutes };
