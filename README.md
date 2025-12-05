# 🎮 SomiVerse - Cyberpunk Metropolis

Three.js ile yapılmış interaktif 3D cyberpunk oyunu.

## 📁 Proje Yapısı

```
SomiVerse2/
├── frontend/                    # Frontend (Vite + Three.js)
│   ├── src/
│   │   ├── components/          # UI Componentları
│   │   │   ├── Loader.js        # Yükleme ekranı
│   │   │   ├── Modal.js         # HUD modal sistemi
│   │   │   ├── ActionButton.js  # 3D buton
│   │   │   └── ModalContent.js  # Modal içerik üreteçleri
│   │   ├── game/
│   │   │   ├── core/            # Çekirdek sistemler
│   │   │   │   ├── SceneManager.js
│   │   │   │   ├── CameraManager.js
│   │   │   │   └── RendererManager.js
│   │   │   ├── entities/        # Oyun varlıkları
│   │   │   │   ├── Player.js    # Titan Mech karakteri
│   │   │   │   ├── Building.js  # Bina sistemleri
│   │   │   │   └── Car.js       # Otoyol arabaları
│   │   │   ├── world/           # Dünya modülleri
│   │   │   │   ├── CityBase.js
│   │   │   │   ├── StreetLights.js
│   │   │   │   ├── Highways.js
│   │   │   │   ├── BackgroundCity.js
│   │   │   │   └── ZoneManager.js
│   │   │   ├── systems/         # Oyun sistemleri
│   │   │   │   ├── InputSystem.js
│   │   │   │   └── InteractionSystem.js
│   │   │   ├── builders/        # Bina oluşturucular
│   │   │   │   └── BuildingBuilders.js
│   │   │   ├── config.js        # Oyun ayarları
│   │   │   └── Game.js          # Ana oyun sınıfı
│   │   ├── styles/
│   │   │   └── main.css         # Tüm stiller
│   │   └── main.js              # Giriş noktası
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # Backend (Express.js)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── game.js          # Oyun API'leri
│   │   │   └── defi.js          # DeFi API'leri
│   │   ├── controllers/
│   │   │   ├── GameController.js
│   │   │   └── DefiController.js
│   │   └── app.js               # Express sunucu
│   └── package.json
│
├── package.json                 # Root package
└── README.md
```

## 🚀 Başlangıç

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Kurulum

```bash
# Projeye git
cd SomiVerse2

# Tüm bağımlılıkları yükle
npm run install:all
```

### Geliştirme

```bash
# Frontend ve Backend'i aynı anda başlat
npm run dev

# Sadece Frontend (http://localhost:3000)
npm run dev:frontend

# Sadece Backend (http://localhost:4000)
npm run dev:backend
```

### Production Build

```bash
npm run build
```

## 🎯 Özellikler

### Frontend
- **Three.js** ile 3D render
- **Modüler mimari** - Kolay genişletilebilir
- **Responsive tasarım** - Mobil uyumlu
- **Cyberpunk UI** - HUD stili arayüz

### Backend
- **RESTful API** - Express.js
- **Swap sistemi** - Token takası
- **Lending havuzları** - Likidite sağlama
- **NFT mint** - NFT oluşturma
- **Faucet** - Günlük ödüller

## 🎮 Kontroller

| Tuş | Aksiyon |
|-----|---------|
| W / ↑ | İleri |
| S / ↓ | Geri |
| A / ← | Sol |
| D / → | Sağ |
| ESC | Modal kapat |

## 🏗️ Mimari

### Component Yapısı

```
Game
├── SceneManager (Three.js Scene + Lights)
├── CameraManager (Orthographic Camera)
├── RendererManager (WebGL Renderer)
├── InputSystem (Keyboard Input)
├── InteractionSystem (Player-Building)
├── Player (Titan Mech)
├── Buildings[] (Interactive)
├── Highways (Cars)
└── World (City, Lights, Background)
```

### API Endpoints

```
GET  /api/health              - Sunucu durumu
GET  /api/game/status         - Oyun durumu
GET  /api/game/buildings      - Bina listesi
POST /api/game/player         - Oyuncu oluştur
GET  /api/defi/swap/quote     - Swap teklifi
POST /api/defi/swap/execute   - Swap yap
GET  /api/defi/lending/pools  - Havuzlar
POST /api/defi/lending/deposit - Yatırım
GET  /api/defi/nft/collections - NFT koleksiyonları
POST /api/defi/nft/mint       - NFT oluştur
GET  /api/defi/faucet/status  - Faucet durumu
POST /api/defi/faucet/claim   - Ödül al
```

## 🎨 Renk Paleti

| Renk | Hex | Kullanım |
|------|-----|----------|
| Neon Blue | `#00ccff` | Swap City |
| Neon Pink | `#ff0055` | Lending Tower |
| Neon Green | `#00ffaa` | Mint Lab |
| Gold | `#ffaa00` | Gold Faucet |
| Purple | `#aa00ff` | Grid/Accent |

## 📝 Lisans

MIT License

