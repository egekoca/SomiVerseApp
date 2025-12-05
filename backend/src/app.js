import express from 'express';
import cors from 'cors';
import { gameRoutes } from './routes/game.js';
import { defiRoutes } from './routes/defi.js';
import { profileRoutes } from './routes/profile.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/game', gameRoutes);
app.use('/api/defi', defiRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '2.1.0'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.path} not found`
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   SOMIVERSE BACKEND SERVER             ║
║   Port: ${PORT}                            ║
║   Status: ONLINE                       ║
╚════════════════════════════════════════╝
  `);
});

export default app;

