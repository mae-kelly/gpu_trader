const WebSocket = require('ws');
const axios = require('axios');
const { GPU } = require('gpu.js');

const PORT = 8080;
const SCAN_INTERVAL = 1000; // 1 second
const TRADE_INTERVAL = 2000; // 2 seconds

class UltimateTradingBot {
    constructor() {
        this.clients = new Set();
        this.tokenCache = new Map();
        this.activePositions = new Map();
        this.tradingHistory = [];
        this.isScanning = false;
        this.isTrading = false;
        this.botRunning = false;
        this.totalScanned = 0;
        this.totalTrades = 0;
        this.totalProfit = 0;
        this.balance = 10000; // Starting balance $10k
        
        this.config = {
            maxPositionSize: 0.1, // 10% per trade
            stopLoss: -5, // 5% stop loss
            takeProfit: 15, // 15% take profit
            maxPositions: 5,
            minVolume: 50000,
            minLiquidity: 100000,
            maxBuyTax: 5,
            maxSellTax: 5
        };
        
        this.initializeGPU();
        this.buildEndpoints();
    }

    initializeGPU() {
        console.log('🔥 INITIALIZING GPU FOR TRADING ANALYSIS...');
        try {
            this.gpu = new GPU({ mode: 'gpu' });
            
            // GPU kernel for token scoring
            this.tokenScoringGPU = this.gpu.createKernel(function(
                changes, volumes, liquidities, ages, buyTaxes, sellTaxes
            ) {
                const i = this.thread.x;
                const change = changes[i];
                const volume = volumes[i];
                const liquidity = liquidities[i];
                const age = ages[i];
                const buyTax = buyTaxes[i];
                const sellTax = sellTaxes[i];
                
                let score = 0;
                
                // Momentum score (9-13% sweet spot)
                if (change >= 9 && change <= 13) {
                    score += 40 * (1 - Math.abs(change - 11) / 2);
                }
                
                // Volume score
                if (volume >= 50000) {
                    score += 25 * Math.min(volume / 500000, 1);
                }
                
                // Liquidity score
                if (liquidity >= 100000) {
                    score += 20 * Math.min(liquidity / 1000000, 1);
                }
                
                // Age score (prefer 1-30 days)
                if (age >= 1 && age <= 30) {
                    score += 10;
                }
                
                // Tax penalty
                if (buyTax + sellTax <= 10) {
                    score += 5;
                }
                
                return score;
            }).setOutput([1000]);
            
            console.log('✅ GPU TRADING KERNELS READY');
        } catch (error) {
            console.error('GPU INIT FAILED:', error);
            throw error;
        }
    }

    buildEndpoints() {
        this.endpoints = [
            'https://api.dexscreener.com/latest/dex/search?q=ethereum',
            'https://api.dexscreener.com/latest/dex/search?q=bsc',
            'https://api.dexscreener.com/latest/dex/search?q=polygon',
            'https://api.geckoterminal.com/api/v2/networks/eth/trending_pools',
            'https://api.geckoterminal.com/api/v2/networks/bsc/trending_pools',
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_desc&per_page=100&page=1'
        ];
    }

    start() {
        this.wss = new WebSocket.Server({ port: PORT });
        
        this.wss.on('connection', (ws) => {
            console.log('🤖 TRADING CLIENT CONNECTED');
            this.clients.add(ws);
            
            ws.send(JSON.stringify({
                type: 'connection',
                message: 'ULTIMATE TRADING BOT ONLINE',
                balance: this.balance,
                positions: this.activePositions.size,
                isRunning: this.botRunning
            }));
            
            ws.on('close', () => this.clients.delete(ws));
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleCommand(data);
                } catch (error) {}
            });
        });

        this.startScanning();
        console.log(`🚀 TRADING BOT SERVER: ws://localhost:${PORT}`);
    }

    handleCommand(data) {
        switch(data.type) {
            case 'start_trading':
                this.startTrading();
                break;
            case 'stop_trading':
                this.stopTrading();
                break;
            case 'update_config':
                this.updateConfig(data.config);
                break;
        }
    }

    async startScanning() {
        if (this.isScanning) return;
        this.isScanning = true;
        
        console.log('🔍 STARTING TOKEN SCANNING...');
        
        setInterval(() => this.scanTokens(), SCAN_INTERVAL);
    }

    async scanTokens() {
        try {
            const promises = this.endpoints.map(endpoint => 
                this.fetchTokens(endpoint)
            );
            
            const results = await Promise.allSettled(promises);
            let allTokens = [];
            
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    allTokens.push(...result.value);
                }
            });
            
            this.totalScanned = allTokens.length;
            
            // GPU Analysis
            const analyzedTokens = await this.analyzeTokensGPU(allTokens);
            
            // Honeypot check for top tokens
            const safeTokens = await this.checkHoneypots(analyzedTokens.slice(0, 10));
            
            this.updateTokenCache(safeTokens);
            this.broadcastUpdate();
            
            console.log(`📊 SCANNED: ${allTokens.length} | SAFE: ${safeTokens.length}`);
            
        } catch (error) {
            console.error('SCAN ERROR:', error);
        }
    }

    async fetchTokens(endpoint) {
        try {
            const response = await axios.get(endpoint, { timeout: 3000 });
            return this.parseTokenData(response.data, endpoint);
        } catch (error) {
            return [];
        }
    }

    parseTokenData(data, endpoint) {
        const tokens = [];
        
        try {
            if (data.pairs) {
                data.pairs.forEach(pair => {
                    const change = parseFloat(pair.priceChange?.h24 || 0);
                    if (change >= 8 && change <= 15) {
                        tokens.push({
                            address: pair.baseToken?.address || '',
                            symbol: pair.baseToken?.symbol || '',
                            name: pair.baseToken?.name || '',
                            price: parseFloat(pair.priceUsd || 0),
                            priceChange24h: change,
                            volume24h: parseFloat(pair.volume?.h24 || 0),
                            liquidity: parseFloat(pair.liquidity?.usd || 0),
                            chain: this.getChain(endpoint),
                            age: Math.random() * 30 + 1, // Mock age
                            timestamp: Date.now()
                        });
                    }
                });
            }
            
            if (Array.isArray(data)) {
                data.forEach(coin => {
                    const change = parseFloat(coin.price_change_percentage_24h || 0);
                    if (change >= 8 && change <= 15) {
                        tokens.push({
                            address: coin.id || '',
                            symbol: coin.symbol?.toUpperCase() || '',
                            name: coin.name || '',
                            price: parseFloat(coin.current_price || 0),
                            priceChange24h: change,
                            volume24h: parseFloat(coin.total_volume || 0),
                            liquidity: parseFloat(coin.market_cap || 0),
                            chain: 'ethereum',
                            age: Math.random() * 30 + 1,
                            timestamp: Date.now()
                        });
                    }
                });
            }
        } catch (error) {}
        
        return tokens;
    }

    async analyzeTokensGPU(tokens) {
        if (tokens.length === 0) return [];
        
        try {
            const changes = tokens.map(t => t.priceChange24h);
            const volumes = tokens.map(t => t.volume24h);
            const liquidities = tokens.map(t => t.liquidity);
            const ages = tokens.map(t => t.age || 15);
            const buyTaxes = tokens.map(t => Math.random() * 5); // Mock tax
            const sellTaxes = tokens.map(t => Math.random() * 5);
            
            // Pad arrays to 1000
            while (changes.length < 1000) {
                changes.push(0);
                volumes.push(0);
                liquidities.push(0);
                ages.push(0);
                buyTaxes.push(100);
                sellTaxes.push(100);
            }
            
            const scores = this.tokenScoringGPU(
                changes, volumes, liquidities, ages, buyTaxes, sellTaxes
            );
            
            // Add scores to tokens and sort
            for (let i = 0; i < tokens.length; i++) {
                tokens[i].tradingScore = scores[i];
            }
            
            return tokens
                .filter(t => t.tradingScore > 50)
                .sort((a, b) => b.tradingScore - a.tradingScore);
                
        } catch (error) {
            console.error('GPU ANALYSIS FAILED:', error);
            return tokens.filter(t => 
                t.priceChange24h >= 9 && t.priceChange24h <= 13 &&
                t.volume24h >= 50000
            );
        }
    }

    async checkHoneypots(tokens) {
        const safeTokens = [];
        
        for (let token of tokens) {
            try {
                // Simulate honeypot check
                const isHoneypot = Math.random() < 0.1; // 10% are honeypots
                const buyTax = Math.random() * 10;
                const sellTax = Math.random() * 10;
                
                if (!isHoneypot && buyTax <= 5 && sellTax <= 5) {
                    token.honeypotSafe = true;
                    token.buyTax = buyTax;
                    token.sellTax = sellTax;
                    safeTokens.push(token);
                }
            } catch (error) {}
        }
        
        return safeTokens;
    }

    startTrading() {
        if (this.isTrading) return;
        
        this.botRunning = true;
        this.isTrading = true;
        
        console.log('🤖 STARTING AUTOMATED TRADING...');
        
        setInterval(() => this.executeTrades(), TRADE_INTERVAL);
        
        this.broadcast({
            type: 'trading_started',
            message: 'BOT IS NOW TRADING',
            balance: this.balance
        });
    }

    stopTrading() {
        this.botRunning = false;
        this.isTrading = false;
        
        console.log('🛑 STOPPING AUTOMATED TRADING...');
        
        this.broadcast({
            type: 'trading_stopped',
            message: 'BOT STOPPED',
            balance: this.balance
        });
    }

    async executeTrades() {
        if (!this.botRunning) return;
        
        const tokens = Array.from(this.tokenCache.values())
            .filter(t => t.honeypotSafe && t.tradingScore > 70)
            .slice(0, 3);
        
        for (let token of tokens) {
            if (this.activePositions.size >= this.config.maxPositions) break;
            
            if (!this.activePositions.has(token.address)) {
                await this.buyToken(token);
            }
        }
        
        // Check exit conditions
        for (let [address, position] of this.activePositions) {
            await this.checkExitConditions(position);
        }
    }

    async buyToken(token) {
        try {
            const positionSize = this.balance * this.config.maxPositionSize;
            const quantity = positionSize / token.price;
            
            const position = {
                address: token.address,
                symbol: token.symbol,
                buyPrice: token.price,
                quantity: quantity,
                invested: positionSize,
                buyTime: Date.now(),
                currentPrice: token.price,
                pnl: 0,
                pnlPercent: 0
            };
            
            this.activePositions.set(token.address, position);
            this.balance -= positionSize;
            this.totalTrades++;
            
            console.log(`🟢 BOUGHT ${token.symbol} at $${token.price}`);
            
            this.broadcast({
                type: 'trade_executed',
                action: 'BUY',
                token: token.symbol,
                price: token.price,
                amount: quantity,
                balance: this.balance
            });
            
        } catch (error) {
            console.error('BUY ERROR:', error);
        }
    }

    async sellToken(position, reason = 'manual') {
        try {
            const sellValue = position.quantity * position.currentPrice;
            const profit = sellValue - position.invested;
            
            this.activePositions.delete(position.address);
            this.balance += sellValue;
            this.totalProfit += profit;
            
            this.tradingHistory.push({
                ...position,
                sellPrice: position.currentPrice,
                sellTime: Date.now(),
                profit: profit,
                reason: reason
            });
            
            console.log(`🔴 SOLD ${position.symbol} at $${position.currentPrice} | P&L: $${profit.toFixed(2)}`);
            
            this.broadcast({
                type: 'trade_executed',
                action: 'SELL',
                token: position.symbol,
                price: position.currentPrice,
                profit: profit,
                reason: reason,
                balance: this.balance
            });
            
        } catch (error) {
            console.error('SELL ERROR:', error);
        }
    }

    async checkExitConditions(position) {
        const currentToken = this.tokenCache.get(position.address);
        if (!currentToken) return;
        
        position.currentPrice = currentToken.price;
        position.pnl = (position.currentPrice - position.buyPrice) * position.quantity;
        position.pnlPercent = ((position.currentPrice - position.buyPrice) / position.buyPrice) * 100;
        
        // Take profit
        if (position.pnlPercent >= this.config.takeProfit) {
            await this.sellToken(position, 'take_profit');
            return;
        }
        
        // Stop loss
        if (position.pnlPercent <= this.config.stopLoss) {
            await this.sellToken(position, 'stop_loss');
            return;
        }
        
        // Time-based exit (hold max 1 hour)
        const holdTime = Date.now() - position.buyTime;
        if (holdTime > 3600000) { // 1 hour
            await this.sellToken(position, 'time_exit');
            return;
        }
    }

    getChain(endpoint) {
        if (endpoint.includes('bsc')) return 'bsc';
        if (endpoint.includes('polygon')) return 'polygon';
        return 'ethereum';
    }

    updateTokenCache(tokens) {
        tokens.forEach(token => {
            this.tokenCache.set(token.address, token);
        });
        
        // Clean old tokens
        const cutoff = Date.now() - 300000; // 5 minutes
        for (let [key, token] of this.tokenCache) {
            if (token.timestamp < cutoff) {
                this.tokenCache.delete(key);
            }
        }
    }

    broadcastUpdate() {
        const tokens = Array.from(this.tokenCache.values())
            .sort((a, b) => (b.tradingScore || 0) - (a.tradingScore || 0))
            .slice(0, 20);
        
        const positions = Array.from(this.activePositions.values());
        
        this.broadcast({
            type: 'update',
            tokens,
            positions,
            balance: this.balance,
            totalProfit: this.totalProfit,
            totalTrades: this.totalTrades,
            botRunning: this.botRunning,
            timestamp: Date.now()
        });
    }

    broadcast(data) {
        const message = JSON.stringify(data);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

// START TRADING BOT
const tradingBot = new UltimateTradingBot();
tradingBot.start();

process.on('SIGTERM', () => {
    console.log('🛑 TRADING BOT SHUTDOWN');
    process.exit(0);
});
