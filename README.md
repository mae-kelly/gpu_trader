# GPU Swarm Trader

A high-frequency cryptocurrency trading dashboard powered by GPU clusters on Google Colab with a cyberpunk-themed Vercel frontend.

## 🚀 Features

- **GPU-Powered Scanning**: Parallel processing of thousands of tokens per second
- **Real-Time Momentum Detection**: Identifies coins gaining 9-13% in rolling time windows
- **Smart Contract Analysis**: Honeypot detection and safety verification
- **Cyberpunk UI**: Futuristic dark theme with neon glow effects
- **Trading Simulation**: Risk-free testing before live deployment
- **Auto-Trading**: Autonomous swarm trading with exit strategies

## 🏗️ Architecture

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS (Vercel)
- **Backend**: Python + FastAPI (Google Colab GPU)
- **State Management**: Zustand
- **Charts**: Recharts
- **Styling**: Custom cyberpunk theme with neon effects

## 🔧 Installation

1. Run the setup scripts in order:
```bash
chmod +x *.sh
./setup-project.sh
./create-components.sh  
./create-dashboard.sh
./create-pages.sh
./finalize-app.sh
```

2. Start development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## 🎯 Core Strategy

The system implements rotational compounding by:
- Scanning all tokens for 9-13% momentum windows
- Executing micro-trades ($0.10-$1) across thousands of assets
- Monitoring acceleration (second-derivative price movement)
- Exiting immediately when momentum slows
- Reinvesting profits into new opportunities

## ⚠️ Risk Warning

High-frequency trading involves significant financial risk. This software is for educational purposes and simulation. Always test thoroughly before live trading.

## 🚀 Deployment

- Frontend: Deploy to Vercel
- Backend: Run on Google Colab with GPU runtime
- Connect via API endpoints for real-time data flow

## 📊 Dashboard Components

- **Momentum Scanner**: Live feed of qualifying tokens
- **GPU Cluster Status**: Real-time processing metrics  
- **Wallet Simulation**: Virtual trading with ROI tracking
- **Contract Analysis**: Security and honeypot checks
- **Trading Controls**: Auto-trade settings and filters

Built for the future of algorithmic trading. 🚀
