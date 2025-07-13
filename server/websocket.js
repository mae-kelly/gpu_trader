const WebSocket = require('ws');
const axios = require('axios');

const PORT = process.env.NEXT_PUBLIC_WS_PORT || 3001;
const UPDATE_INTERVAL = 5000; // 5 seconds

class RealTimeTokenServer {
  constructor() {
    this.clients = new Set();
    this.tokenCache = new Map();
    this.isScanning = false;
  }

  start() {
    this.wss = new WebSocket.Server({ port: PORT });
    
    this.wss.on('connection', (ws) => {
      console.log('Client connected. Total clients:', this.clients.size + 1);
      this.clients.add(ws);
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('Client disconnected. Total clients:', this.clients.size);
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'subscribe') {
            console.log('Client subscribed to updates');
          }
        } catch (error) {
          console.error('Invalid message format:', error);
        }
      });
    });

    this.startScanning();
    console.log(`🚀 Real-time WebSocket server running on port ${PORT}`);
  }

  async startScanning() {
    if (this.isScanning) return;
    this.isScanning = true;

    const scan = async () => {
      try {
        await this.fetchAndBroadcastTokens();
      } catch (error) {
        console.error('Scanning error:', error);
      }
    };

    // Initial scan
    await scan();
    
    // Regular scanning
    setInterval(scan, UPDATE_INTERVAL);
  }

  async fetchAndBroadcastTokens() {
    try {
      const tokens = await this.getAllTokensFromAPIs();
      const filteredTokens = this.filterTokensByMomentum(tokens);
      
      if (filteredTokens.length > 0) {
        this.broadcast({
          type: 'update',
          tokens: filteredTokens,
          timestamp: Date.now(),
          totalScanned: tokens.length
        });
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    }
  }

  async getAllTokensFromAPIs() {
    const promises = [
      this.fetchFromDexScreener(),
      this.fetchFromGeckoTerminal(),
    ];

    const results = await Promise.allSettled(promises);
    const allTokens = [];

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allTokens.push(...result.value);
      }
    });

    return this.deduplicateTokens(allTokens);
  }

  async fetchFromDexScreener() {
    try {
      const chains = ['ethereum', 'bsc', 'arbitrum', 'polygon'];
      const tokens = [];

      for (const chain of chains) {
        const response = await axios.get(
          `https://api.dexscreener.com/latest/dex/search/?q=${chain}`,
          { timeout: 10000 }
        );

        if (response.data.pairs) {
          response.data.pairs.forEach(pair => {
            if (pair.priceChange && pair.priceChange.h24) {
              const change = parseFloat(pair.priceChange.h24);
              if (change >= 9 && change <= 13) {
                tokens.push({
                  address: pair.baseToken.address,
                  symbol: pair.baseToken.symbol,
                  name: pair.baseToken.name,
                  price: parseFloat(pair.priceUsd || '0'),
                  priceChange24h: change,
                  volume24h: parseFloat(pair.volume?.h24 || '0'),
                  liquidity: parseFloat(pair.liquidity?.usd || '0'),
                  chain: chain,
                  source: 'dexscreener'
                });
              }
            }
          });
        }
      }

      return tokens;
    } catch (error) {
      console.error('DexScreener API error:', error.message);
      return [];
    }
  }

  async fetchFromGeckoTerminal() {
    try {
      const networks = ['eth', 'bsc', 'arbitrum', 'polygon'];
      const tokens = [];

      for (const network of networks) {
        const response = await axios.get(
          `https://api.geckoterminal.com/api/v2/networks/${network}/trending_pools`,
          { timeout: 10000 }
        );

        if (response.data.data) {
          response.data.data.forEach(pool => {
            if (pool.attributes) {
              const change = parseFloat(pool.attributes.price_change_percentage?.h24 || '0');
              if (change >= 9 && change <= 13) {
                tokens.push({
                  address: pool.relationships?.base_token?.data?.id || '',
                  symbol: pool.attributes.name?.split('/')[0] || '',
                  name: pool.attributes.name || '',
                  price: parseFloat(pool.attributes.base_token_price_usd || '0'),
                  priceChange24h: change,
                  volume24h: parseFloat(pool.attributes.volume_usd?.h24 || '0'),
                  liquidity: parseFloat(pool.attributes.reserve_in_usd || '0'),
                  chain: network,
                  source: 'geckoterminal'
                });
              }
            }
          });
        }
      }

      return tokens;
    } catch (error) {
      console.error('GeckoTerminal API error:', error.message);
      return [];
    }
  }

  filterTokensByMomentum(tokens) {
    return tokens.filter(token => {
      return token.priceChange24h >= 9 && 
             token.priceChange24h <= 13 &&
             token.volume24h >= 10000 &&
             token.liquidity >= 50000;
    });
  }

  deduplicateTokens(tokens) {
    const unique = new Map();
    
    tokens.forEach(token => {
      const key = `${token.chain}-${token.address}`;
      if (!unique.has(key) || unique.get(key).volume24h < token.volume24h) {
        unique.set(key, token);
      }
    });
    
    return Array.from(unique.values());
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

// Start server
const server = new RealTimeTokenServer();
server.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket server...');
  process.exit(0);
});
