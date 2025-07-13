const axios = require('axios')
const WebSocket = require('ws')

class LocalScanner {
  constructor() {
    this.tokens = new Map()
    this.wss = new WebSocket.Server({ port: 8080 })
    this.setupWebSocket()
    this.startScanning()
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('🔗 Client connected')
      ws.send(JSON.stringify({
        type: 'all_tokens',
        data: Array.from(this.tokens.values()),
        count: this.tokens.size
      }))
    })
  }

  async fetchTokens() {
    const endpoints = [
      'https://api.dexscreener.com/latest/dex/search?q=ethereum',
      'https://api.dexscreener.com/latest/dex/search?q=bsc', 
      'https://api.dexscreener.com/latest/dex/search?q=polygon',
      'https://api.geckoterminal.com/api/v2/networks/eth/trending_pools',
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=1',
      'https://api.coincap.io/v2/assets?limit=100'
    ]

    try {
      const promises = endpoints.map(url => 
        axios.get(url, { timeout: 3000 }).catch(() => null)
      )

      const results = await Promise.all(promises)
      const newTokens = []

      results.forEach((result, index) => {
        if (!result) return

        const data = result.data

        if (data.pairs) {
          data.pairs.forEach(pair => {
            const change = parseFloat(pair.priceChange?.h24 || 0)
            if (change >= 9 && change <= 13) {
              const token = {
                address: pair.baseToken?.address || '',
                symbol: pair.baseToken?.symbol || '',
                name: pair.baseToken?.name || '',
                price: parseFloat(pair.priceUsd || 0),
                priceChange24h: change,
                volume24h: parseFloat(pair.volume?.h24 || 0),
                liquidity: parseFloat(pair.liquidity?.usd || 0),
                chain: endpoints[index].includes('ethereum') ? 'ETH' : 
                       endpoints[index].includes('bsc') ? 'BSC' : 'POLYGON',
                timestamp: Date.now()
              }
              newTokens.push(token)
              this.tokens.set(`${token.chain}-${token.address}`, token)
            }
          })
        }

        if (Array.isArray(data)) {
          data.forEach(item => {
            const change = parseFloat(item.changePercent24Hr || item.percent_change_24h || 0)
            if (change >= 9 && change <= 13) {
              const token = {
                address: item.id || '',
                symbol: (item.symbol || '').toUpperCase(),
                name: item.name || '',
                price: parseFloat(item.priceUsd || item.price || 0),
                priceChange24h: change,
                volume24h: parseFloat(item.volumeUsd24Hr || item.volume_24h || 0),
                chain: 'MULTI',
                timestamp: Date.now()
              }
              newTokens.push(token)
              this.tokens.set(`${token.chain}-${token.address}`, token)
            }
          })
        }

        if (data.data && Array.isArray(data.data)) {
          data.data.forEach(item => {
            const change = parseFloat(item.attributes?.price_change_percentage?.h24 || 0)
            if (change >= 9 && change <= 13) {
              const token = {
                address: item.relationships?.base_token?.data?.id || '',
                symbol: item.attributes?.name?.split('/')[0] || '',
                name: item.attributes?.name || '',
                price: parseFloat(item.attributes?.base_token_price_usd || 0),
                priceChange24h: change,
                volume24h: parseFloat(item.attributes?.volume_usd?.h24 || 0),
                chain: 'GECKO',
                timestamp: Date.now()
              }
              newTokens.push(token)
              this.tokens.set(`${token.chain}-${token.address}`, token)
            }
          })
        }
      })

      if (newTokens.length > 0) {
        console.log(`📊 Found ${newTokens.length} tokens in range. Total: ${this.tokens.size}`)
        this.broadcast(newTokens)
      }

    } catch (error) {
      console.error('Fetch error:', error.message)
    }
  }

  broadcast(tokens) {
    const message = JSON.stringify({
      type: 'token_updates',
      data: tokens,
      timestamp: Date.now()
    })

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  startScanning() {
    console.log('🔥 Starting local scanner...')
    this.fetchTokens()
    setInterval(() => this.fetchTokens(), 2000)
  }
}

new LocalScanner()
console.log('📡 Local scanner running on ws://localhost:8080')
