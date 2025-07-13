# 🚀 GPU Swarm Trader

A real-time cryptocurrency momentum scanner that tracks tokens with 9-13% gains using live data from multiple DEX APIs.

## 🔧 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

Required API keys:
- **Moralis API**: Get from [moralis.io](https://moralis.io) (free tier available)
- **Alchemy API**: Get from [alchemy.com](https://alchemy.com) (free tier available)

### 3. Run the Application

**Development (with WebSocket server):**
```bash
npm run dev:full
```

**Production:**
```bash
npm run build
npm start
# In another terminal:
npm run ws
```

## 🌐 Real APIs Used

- **DexScreener API**: Real-time DEX data across multiple chains
- **GeckoTerminal API**: Trending pools and token analytics  
- **Honeypot.is API**: Smart contract security analysis
- **Moralis API**: Blockchain data and token metadata
- **Alchemy API**: Ethereum and Layer 2 data

## 🔥 Features

- ⚡ Real-time token scanning across Ethereum, BSC, Arbitrum, Polygon
- 📊 Live price acceleration tracking
- 🛡️ Honeypot detection and security analysis
- 📈 Interactive charts and momentum visualization
- 🎯 Customizable filters (volume, liquidity, time windows)
- 🌐 WebSocket-powered live updates

## 🏗️ Architecture

```
├── src/app/                 # Next.js 13 app directory
├── src/components/          # React components
├── src/lib/                 # Core business logic
│   ├── data-sources/        # API integrations
│   ├── acceleration-calculator.ts
│   ├── honeypot-detector.ts
│   └── realtime-store.ts
├── server/                  # WebSocket server
└── public/                  # Static assets
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker
```bash
docker build -t gpu-swarm-trader .
docker run -p 3000:3000 -p 3001:3001 gpu-swarm-trader
```

## 📊 Performance

- Scans 1000+ tokens every 5 seconds
- Sub-100ms API response times
- Real-time WebSocket updates
- Optimized React components with minimal re-renders

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run WebSocket server
npm run ws

# Run both simultaneously
npm run dev:full

# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
