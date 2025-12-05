import express from 'express';
import { GameController } from '../controllers/GameController.js';

const router = express.Router();
const gameController = new GameController();

/**
 * @route GET /api/game/status
 * @desc Oyun durumunu getir
 */
router.get('/status', (req, res) => {
  res.json(gameController.getGameStatus());
});

/**
 * @route GET /api/game/buildings
 * @desc Bina listesini getir
 */
router.get('/buildings', (req, res) => {
  res.json(gameController.getBuildings());
});

/**
 * @route GET /api/game/player/:id
 * @desc Oyuncu bilgilerini getir
 */
router.get('/player/:id', (req, res) => {
  const player = gameController.getPlayer(req.params.id);
  if (player) {
    res.json(player);
  } else {
    res.status(404).json({ error: 'Player not found' });
  }
});

/**
 * @route POST /api/game/player
 * @desc Yeni oyuncu oluştur
 */
router.post('/player', (req, res) => {
  const player = gameController.createPlayer(req.body);
  res.status(201).json(player);
});

/**
 * @route PUT /api/game/player/:id/position
 * @desc Oyuncu pozisyonunu güncelle
 */
router.put('/player/:id/position', (req, res) => {
  const { x, z } = req.body;
  const result = gameController.updatePlayerPosition(req.params.id, x, z);
  if (result) {
    res.json(result);
  } else {
    res.status(404).json({ error: 'Player not found' });
  }
});

export { router as gameRoutes };

