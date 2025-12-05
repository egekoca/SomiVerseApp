import express from 'express';
import { DefiController } from '../controllers/DefiController.js';

const router = express.Router();
const defiController = new DefiController();

/**
 * @route GET /api/defi/swap/quote
 * @desc Swap fiyat teklifi al
 */
router.get('/swap/quote', (req, res) => {
  const { from, to, amount } = req.query;
  const quote = defiController.getSwapQuote(from, to, parseFloat(amount));
  res.json(quote);
});

/**
 * @route POST /api/defi/swap/execute
 * @desc Swap işlemi gerçekleştir
 */
router.post('/swap/execute', (req, res) => {
  const { from, to, amount, playerId } = req.body;
  const result = defiController.executeSwap(from, to, amount, playerId);
  res.json(result);
});

/**
 * @route GET /api/defi/lending/pools
 * @desc Lending havuzlarını listele
 */
router.get('/lending/pools', (req, res) => {
  res.json(defiController.getLendingPools());
});

/**
 * @route POST /api/defi/lending/deposit
 * @desc Lending havuzuna yatırım yap
 */
router.post('/lending/deposit', (req, res) => {
  const { poolId, amount, playerId } = req.body;
  const result = defiController.deposit(poolId, amount, playerId);
  res.json(result);
});

/**
 * @route GET /api/defi/nft/collections
 * @desc NFT koleksiyonlarını listele
 */
router.get('/nft/collections', (req, res) => {
  res.json(defiController.getNFTCollections());
});

/**
 * @route POST /api/defi/nft/mint
 * @desc Yeni NFT oluştur
 */
router.post('/nft/mint', (req, res) => {
  const { collectionId, playerId } = req.body;
  const result = defiController.mintNFT(collectionId, playerId);
  res.json(result);
});

/**
 * @route GET /api/defi/faucet/status
 * @desc Faucet durumunu kontrol et
 */
router.get('/faucet/status', (req, res) => {
  const { playerId } = req.query;
  res.json(defiController.getFaucetStatus(playerId));
});

/**
 * @route POST /api/defi/faucet/claim
 * @desc Günlük ödül talep et
 */
router.post('/faucet/claim', (req, res) => {
  const { playerId } = req.body;
  const result = defiController.claimFaucet(playerId);
  res.json(result);
});

export { router as defiRoutes };

