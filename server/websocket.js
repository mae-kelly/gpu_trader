const WebSocket = require('ws');
const axios = require('axios');
const { GPU } = require('gpu.js');
const os = require('os');

const PORT = 8080;
const UPDATE_INTERVAL = 100; // 100ms - MAXIMUM SPEED

class ForceGPUScanner {
    constructor() {
        this.clients = new Set();
        this.tokenCache = new Map();
        this.isScanning = false;
        this.totalScanned = 0;
        this.forceInitializeGPU();
        this.endpoints = this.buildMaxEndpoints();
    }

    forceInitializeGPU() {
        console.log('🔥 FORCING GPU INITIALIZATION...');
        
        // Try multiple GPU initialization methods
        const gpuOptions = [
            { mode: 'gpu' },
            { mode: 'webgl' },
            { mode: 'webgl2' },
            { mode: 'headlessgl' }
        ];

        for (let options of gpuOptions) {
            try {
                this.gpu = new GPU(options);
                
                // FORCE test GPU with computation
                const testKernel = this.gpu.createKernel(function(a, b) {
                    return a[this.thread.x] + b[this.thread.x];
                }).setOutput([1000]);
                
                const result = testKernel(
                    new Array(1000).fill(1),
                    new Array(1000).fill(2)
                );
                
                if (result && result.length === 1000) {
                    console.log('✅ GPU FORCED ONLINE:', options.mode);
                    this.setupGPUKernels();
                    return;
                }
            } catch (error) {
                console.log(`❌ GPU mode ${options.mode} failed:`, error.message);
            }
        }
        
        throw new Error('CRITICAL: GPU INITIALIZATION FAILED');
    }

    setupGPUKernels() {
        console.log('⚡ SETTING UP GPU KERNELS...');
        
        // Price change filter kernel - CRITICAL
        this.priceFilterGPU = this.gpu.createKernel(function(changes) {
            const change = changes[this.thread.x];
            return (change >= 9.0 && change <= 13.0) ? 1.0 : 0.0;
        }).setOutput([2000]);

        // Volume calculation kernel
        this.volumeCalcGPU = this.gpu.createKernel(function(volumes, prices, changes) {
            const vol = volumes[this.thread.x];
            const price = prices[this.thread.x];
            const change = changes[this.thread.x];
            return vol * price * (change / 100.0);
        }).setOutput([2000]);

        // Momentum calculation kernel
        this.momentumGPU = this.gpu.createKernel(function(prices, volumes, changes) {
            const momentum = (changes[this.thread.x] / 10.0) * Math.log(volumes[this.thread.x] + 1);
            return momentum;
        }).setOutput([2000]);

        console.log('🚀 GPU KERNELS READY - MAXIMUM PERFORMANCE');
    }

    buildMaxEndpoints() {
        // MAXIMUM endpoint coverage
        const chains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom'];
        const networks = ['eth', 'bsc', 'polygon_pos', 'arbitrum', 'optimism', 'avalanche', 'fantom'];
        
        let endpoints = [];
        
        // DexScreener - ALL major chains
        chains.forEach(chain => {
            endpoints.push(
                `https://api.dexscreener.com/latest/dex/search?q=${chain}`,
                `https://api.dexscreener.com/latest/dex/tokens/${chain}`,
                `https://api.dexscreener.com/latest/dex/pairs/${chain}`
            );
        });
        
        // GeckoTerminal - ALL networks
        networks.forEach(network => {
            endpoints.push(
                `https://api.geckoterminal.com/api/v2/networks/${network}/trending_pools`,
                `https://api.geckoterminal.com/api/v2/networks/${network}/new_pools`,
                `https://api.geckoterminal.com/api/v2/networks/${network}/pools?sort=h24_volume_usd_desc&limit=100`
            );
        });
        
        // CoinGecko - MASSIVE pagination
        for (let page = 1; page <= 20; page++) {
            endpoints.push(
                `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_desc&per_page=250&page=${page}`,
                `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=${page}`
            );
        }
        
        // Additional endpoints
        endpoints.push(
            'https://api.coincap.io/v2/assets?limit=2000',
            'https://api.coinpaprika.com/v1/tickers?limit=1000',
            'https://api.coinlore.net/api/tickers/?start=0&limit=100'
        );
        
        console.log(`🎯 BUILT ${endpoints.length} ENDPOINTS FOR MAXIMUM COVERAGE`);
        return endpoints;
    }

    start() {
        this.wss = new WebSocket.Server({ port: PORT });
        
        this.wss.on('connection', (ws) => {
            console.log('🔥 GPU CLIENT CONNECTED. Total:', this.clients.size + 1);
            this.clients.add(ws);
            
            ws.send(JSON.stringify({
                type: 'connection',
                message: 'FORCE GPU SCANNER ONLINE',
                gpu_mode: this.gpu.mode,
                gpu_kernels: 'ACTIVE',
                timestamp: Date.now()
            }));

            if (this.tokenCache.size > 0) {
                this.forceTransmit(ws);
            }
            
            ws.on('close', () => this.clients.delete(ws));
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    if (data.type === 'subscribe') {
                        this.forceTransmit(ws);
                    }
                } catch (error) {}
            });
        });

        this.forceStartScanning();
        console.log(`🚀 FORCE GPU SCANNER ONLINE: ws://localhost:${PORT}`);
        console.log(`⚡ GPU MODE: ${this.gpu.mode}`);
    }

    async forceStartScanning() {
        if (this.isScanning) return;
        this.isScanning = true;

        console.log('💀 STARTING FORCE GPU SCANNING - NO LIMITS');
        
        // Immediate scan
        await this.gpuScan();
        
        // Ultra-fast interval
        setInterval(() => this.gpuScan(), UPDATE_INTERVAL);
        
        // Force broadcast every 50ms
        setInterval(() => this.forceBroadcast(), 50);
    }

    async gpuScan() {
        try {
            console.log('🌐 GPU SCANNING ALL ENDPOINTS...');
            
            // Parallel fetch with no limits
            const promises = this.endpoints.map(endpoint => 
                this.fetchWithGPU(endpoint)
            );

            const results = await Promise.allSettled(promises);
            let allTokens = [];
            let successCount = 0;

            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value.length > 0) {
                    allTokens.push(...result.value);
                    successCount++;
                }
            });

            if (allTokens.length > 0) {
                // FORCE GPU PROCESSING
                const gpuFiltered = this.forceGPUFilter(allTokens);
                this.updateCacheGPU(gpuFiltered);
                this.totalScanned = allTokens.length;

                console.log(`🔥 GPU PROCESSED: ${allTokens.length} → ${gpuFiltered.length} tokens`);
            }

        } catch (error) {
            console.error('💥 GPU SCAN ERROR:', error);
        }
    }

    forceGPUFilter(tokens) {
        try {
            // Extract data for GPU processing
            const changes = tokens.map(t => t.priceChange24h || 0);
            const volumes = tokens.map(t => t.volume24h || 0);
            const prices = tokens.map(t => t.price || 0);
            
            // Pad arrays to fixed size for GPU
            while (changes.length < 2000) {
                changes.push(0);
                volumes.push(0);
                prices.push(0);
            }
            
            // GPU filter execution
            const filterResults = this.priceFilterGPU(changes);
            const momentumResults = this.momentumGPU(prices, volumes, changes);
            
            // Process GPU results
            const filtered = [];
            for (let i = 0; i < tokens.length; i++) {
                if (filterResults[i] > 0.5) { // GPU returns float
                    filtered.push({
                        ...tokens[i],
                        gpuMomentum: momentumResults[i],
                        gpuProcessed: true
                    });
                }
            }
            
            return filtered;
        } catch (error) {
            console.error('GPU FILTER ERROR:', error);
            // Fallback to CPU
            return tokens.filter(t => t.priceChange24h >= 9 && t.priceChange24h <= 13);
        }
    }

    async fetchWithGPU(endpoint) {
        try {
            const response = await axios.get(endpoint, {
                timeout: 3000,
                headers: {
                    'User-Agent': 'ForceGPUTrader/1.0',
                    'Accept': 'application/json'
                }
            });
            
            return this.parseTokenData(response.data, endpoint);
        } catch (error) {
            return [];
        }
    }

    parseTokenData(data, endpoint) {
        const tokens = [];
        
        try {
            // DexScreener format
            if (data.pairs) {
                data.pairs.forEach(pair => {
                    const change = parseFloat(pair.priceChange?.h24 || 0);
                    if (change > 0) {
                        tokens.push({
                            address: pair.baseToken?.address || '',
                            symbol: pair.baseToken?.symbol || '',
                            name: pair.baseToken?.name || '',
                            price: parseFloat(pair.priceUsd || 0),
                            priceChange24h: change,
                            volume24h: parseFloat(pair.volume?.h24 || 0),
                            chain: this.getChain(endpoint),
                            source: 'dexscreener',
                            timestamp: Date.now()
                        });
                    }
                });
            }
            
            // GeckoTerminal format
            if (data.data && Array.isArray(data.data)) {
                data.data.forEach(item => {
                    const change = parseFloat(item.attributes?.price_change_percentage?.h24 || 0);
                    if (change > 0) {
                        tokens.push({
                            address: item.relationships?.base_token?.data?.id || '',
                            symbol: item.attributes?.name?.split('/')[0] || '',
                            name: item.attributes?.name || '',
                            price: parseFloat(item.attributes?.base_token_price_usd || 0),
                            priceChange24h: change,
                            volume24h: parseFloat(item.attributes?.volume_usd?.h24 || 0),
                            chain: this.getChain(endpoint),
                            source: 'geckoterminal',
                            timestamp: Date.now()
                        });
                    }
                });
            }
            
            // CoinGecko format
            if (Array.isArray(data)) {
                data.forEach(coin => {
                    const change = parseFloat(coin.price_change_percentage_24h || 0);
                    if (change > 0) {
                        tokens.push({
                            address: coin.contract_address || coin.id,
                            symbol: coin.symbol?.toUpperCase() || '',
                            name: coin.name || '',
                            price: parseFloat(coin.current_price || 0),
                            priceChange24h: change,
                            volume24h: parseFloat(coin.total_volume || 0),
                            chain: 'ethereum',
                            source: 'coingecko',
                            timestamp: Date.now()
                        });
                    }
                });
            }
        } catch (error) {}
        
        return tokens;
    }

    getChain(endpoint) {
        if (endpoint.includes('ethereum') || endpoint.includes('/eth/')) return 'ethereum';
        if (endpoint.includes('bsc')) return 'bsc';
        if (endpoint.includes('polygon')) return 'polygon';
        if (endpoint.includes('arbitrum')) return 'arbitrum';
        if (endpoint.includes('optimism')) return 'optimism';
        return 'ethereum';
    }

    updateCacheGPU(tokens) {
        tokens.forEach(token => {
            const key = `${token.chain}-${token.address}-${token.symbol}`;
            this.tokenCache.set(key, token);
        });
        
        // Remove old entries
        const cutoff = Date.now() - 60000; // 1 minute
        for (let [key, token] of this.tokenCache) {
            if (token.timestamp < cutoff) {
                this.tokenCache.delete(key);
            }
        }
    }

    forceBroadcast() {
        if (this.clients.size === 0) return;
        
        const tokens = Array.from(this.tokenCache.values())
            .sort((a, b) => (b.gpuMomentum || b.priceChange24h) - (a.gpuMomentum || a.priceChange24h));
        
        this.broadcast({
            type: 'update',
            tokens,
            timestamp: Date.now(),
            totalScanned: this.totalScanned,
            gpu_mode: this.gpu.mode,
            gpu_processed: true
        });
    }

    forceTransmit(ws) {
        const tokens = Array.from(this.tokenCache.values());
        ws.send(JSON.stringify({
            type: 'update',
            tokens,
            timestamp: Date.now(),
            totalScanned: this.totalScanned,
            gpu_mode: this.gpu.mode
        }));
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

// FORCE START
try {
    const scanner = new ForceGPUScanner();
    scanner.start();
    
    process.on('SIGTERM', () => {
        console.log('🛑 FORCE GPU SCANNER SHUTDOWN');
        process.exit(0);
    });
} catch (error) {
    console.error('💥 CRITICAL GPU FAILURE:', error);
    process.exit(1);
}
