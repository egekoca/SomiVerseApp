# SomiVerse

A 3D interactive cyberpunk metaverse built with Three.js, featuring DeFi integrations, NFT minting, domain registration, and blockchain-based gameplay mechanics.

## Overview

SomiVerse is a browser-based 3D metaverse game that combines immersive cyberpunk aesthetics with real blockchain functionality. Players navigate a futuristic cityscape, interact with various buildings to perform DeFi operations, mint NFTs, register domains, and earn experience points through on-chain activities.

## Architecture

This is a monorepo project consisting of:

- **Frontend**: Vite + Three.js application with modular game systems
- **Backend**: Express.js REST API with Supabase integration for user profiles and data persistence

## Project Structure

```
SomiVerse2/
├── frontend/                    # Frontend application (Vite + Three.js)
│   ├── src/
│   │   ├── components/          # UI components
│   │   │   ├── Loader.js        # Loading screen
│   │   │   ├── Modal.js         # HUD modal system
│   │   │   ├── Header.js        # Top navigation bar
│   │   │   ├── ProfileModal.js  # User profile modal
│   │   │   └── ModalContent.js  # Modal content generators
│   │   ├── game/
│   │   │   ├── core/            # Core rendering systems
│   │   │   │   ├── SceneManager.js
│   │   │   │   ├── CameraManager.js
│   │   │   │   └── RendererManager.js
│   │   │   ├── entities/        # Game entities
│   │   │   │   ├── Player.js    # Titan Mech character
│   │   │   │   ├── Building.js  # Interactive buildings
│   │   │   │   └── Car.js       # Highway vehicles
│   │   │   ├── world/           # World modules
│   │   │   │   ├── CityBase.js
│   │   │   │   ├── StreetLights.js
│   │   │   │   ├── Highways.js
│   │   │   │   ├── BackgroundCity.js
│   │   │   │   ├── Billboards.js
│   │   │   │   └── HugeBillboards.js
│   │   │   ├── systems/         # Game systems
│   │   │   │   ├── InputSystem.js
│   │   │   │   ├── InteractionSystem.js
│   │   │   │   ├── CollisionSystem.js
│   │   │   │   ├── PlayerManager.js
│   │   │   │   └── WorldManager.js
│   │   │   ├── builders/        # Building constructors
│   │   │   │   └── BuildingBuilders.js
│   │   │   ├── config.js        # Game configuration
│   │   │   └── Game.js          # Main game class
│   │   ├── services/            # Blockchain services
│   │   │   ├── SwapService.js   # Token swap functionality
│   │   │   ├── BridgeService.js # Cross-chain bridging
│   │   │   ├── GearboxService.js # Lending protocol integration
│   │   │   ├── DomainService.js # .somi domain registration
│   │   │   ├── FaucetService.js # Testnet token faucet
│   │   │   ├── ProfileService.js # User profile management
│   │   │   └── SomniaNameService.js # Domain resolution
│   │   ├── config/              # Configuration files
│   │   │   ├── swap.config.js
│   │   │   ├── domain.config.js
│   │   │   ├── gearbox.config.js
│   │   │   └── network.config.js
│   │   ├── styles/
│   │   │   └── main.css         # Global styles
│   │   └── main.js              # Application entry point
│   ├── public/                  # Static assets
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # Backend API (Express.js)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── game.js          # Game API endpoints
│   │   │   ├── defi.js          # DeFi API endpoints
│   │   │   └── profile.js       # Profile API endpoints
│   │   ├── controllers/
│   │   │   ├── GameController.js
│   │   │   ├── DefiController.js
│   │   │   └── ProfileController.js
│   │   ├── models/
│   │   │   └── User.js          # User data model
│   │   ├── config/
│   │   │   └── supabase.js      # Supabase client
│   │   └── app.js               # Express server
│   ├── package.json
│   └── railway.json             # Railway deployment config
│
├── package.json                 # Root package.json
└── README.md
```

## Features

### Gameplay

- **3D Cyberpunk City**: Explore a procedurally generated futuristic metropolis
- **Interactive Buildings**: Interact with various buildings to access DeFi features
- **Character Progression**: Earn XP and level up through on-chain activities
- **Real-time Movement**: Smooth character controls with collision detection

### DeFi Integration

- **Token Swapping**: Swap between SOMI, WSOMI, STT, and USDT tokens
- **Cross-chain Bridging**: Bridge assets between Ethereum, Base, and Somnia networks
- **Lending Protocol**: Deposit and withdraw liquidity using Gearbox Protocol
- **Domain Registration**: Register and manage .somi domains on Somnia Mainnet

### Blockchain Features

- **Multi-chain Support**: Ethereum Mainnet, Base Mainnet, and Somnia Mainnet
- **Wallet Integration**: MetaMask and other Web3 wallet support
- **Transaction History**: Track all on-chain activities in user profile
- **NFT Minting**: Create and manage NFTs within the game

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Web3 wallet (MetaMask recommended)
- Supabase account (for backend data persistence)

## Installation

### Clone the repository

```bash
git clone <repository-url>
cd SomiVerse2
```

### Install dependencies

```bash
# Install all dependencies (frontend and backend)
npm run install:all
```

Or install separately:

```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install
```

### Environment Setup

#### Frontend

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:4000
```

#### Backend

Create a `.env` file in the `backend/` directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=4000
```

## Development

### Start development servers

```bash
# Start both frontend and backend concurrently
npm run dev

# Start only frontend (http://localhost:3000)
npm run dev:frontend

# Start only backend (http://localhost:4000)
npm run dev:backend
```

### Build for production

```bash
# Build frontend
npm run build

# The built files will be in frontend/dist/
```

## Controls

| Key | Action |
|-----|--------|
| W / ↑ | Move forward |
| S / ↓ | Move backward |
| A / ← | Move left |
| D / → | Move right |
| ESC | Close modal |
| Mouse | Rotate camera (in profile modal) |

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server status and version information.

### Game Endpoints

```
GET  /api/game/status         # Game server status
GET  /api/game/buildings      # List of interactive buildings
POST /api/game/player         # Create new player
```

### Profile Endpoints

```
GET  /api/profile/:address              # Get user profile
POST /api/profile/:address              # Create or update profile
POST /api/profile/:address/xp            # Add XP to profile
POST /api/profile/:address/stats         # Update user statistics
POST /api/profile/:address/position      # Update player position
GET  /api/profile/:address/transactions  # Get transaction history
POST /api/profile/:address/transactions  # Add transaction to history
GET  /api/profile/leaderboard            # Get leaderboard
GET  /api/profile/domain/:address        # Get Somnia domain for address
```

### DeFi Endpoints

```
GET  /api/defi/swap/quote           # Get swap quote
POST /api/defi/swap/execute         # Execute swap
GET  /api/defi/lending/pools         # Get lending pools
POST /api/defi/lending/deposit      # Deposit to lending pool
GET  /api/defi/nft/collections       # Get NFT collections
POST /api/defi/nft/mint              # Mint NFT
GET  /api/defi/faucet/status         # Get faucet status
POST /api/defi/faucet/claim          # Claim faucet rewards
```

## Building Types

The game features several interactive buildings, each with unique functionality:

- **Swap City**: Token swapping between SOMI, WSOMI, STT, and USDT
- **Lending Tower**: Deposit and withdraw liquidity using Gearbox Protocol
- **Mint Lab**: Create and manage NFTs
- **Gold Faucet**: Claim testnet tokens (24-hour cooldown)
- **Bridge Building**: Cross-chain asset bridging (coming soon)
- **Domain Building**: Register and manage .somi domains

## Color Palette

| Color | Hex Code | Usage |
|-------|----------|-------|
| Neon Blue | `#00ccff` | Swap City building |
| Neon Pink | `#ff0055` | Lending Tower building |
| Neon Green | `#00ffaa` | Mint Lab building |
| Gold | `#ffaa00` | Gold Faucet building |
| Purple | `#aa00ff` | Grid accents and UI elements |

## Technology Stack

### Frontend

- **Three.js**: 3D graphics rendering
- **Vite**: Build tool and development server
- **Ethers.js**: Blockchain interactions
- **Vanilla JavaScript**: Core game logic

### Backend

- **Express.js**: REST API server
- **Supabase**: Database and user management
- **Node.js**: Runtime environment

## Deployment

### Frontend (Vercel)

The frontend is configured for deployment on Vercel. Ensure environment variables are set in Vercel dashboard.

### Backend (Railway)

The backend includes Railway configuration. Deploy using:

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically detect and deploy the backend

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License

Copyright (c) 2024 SomiVerse

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
