const axios = require('axios')
const WebSocket = require('ws')

console.log('🚀 Starting debug scanner...')

class DebugScanner {
  constructor() {
    this.tokens = new Map()
    this.startWebSocketServer()
    this.startScanning()
  }

  startWebSocketServer() {
    try {
      this.wss = new WebSocket.Server({ port: 8080 })
      console.log('✅ WebSocket server started on port 8080')
      
      this.wss.on('connection', (ws) => {
        console.log('🔗 Client connected!')
        
        // Send initial data immediately
        const initialData = {
          type: 'all_tokens',
          data: Array.from(this.tokens.values()),
          count: this.tokens.size,
          timestamp: Date.now()
        }
        ws.send(JSON.stringify(initialData))
        console.log('📤 Sent initial data to client')
        
        ws.on('close', () => {
          console.log('🔌 Client disconnected')
        })
        
        ws.on('error', (error) => {
          console.error('❌ WebSocket client error:', error)
        })
      })
      
      this.wss.on('error', (error) => {
        console.error('❌ WebSocket server error:', error)
      })
      
    } catch (error) {
      console.error('❌ Failed to start WebSocket server:', error)
    }
  }

  async fetchTokens() {
    console.log('🔍 Fetching tokens...')
    
    const endpoints = [
      'https://api.dexscreener.com/latest/dex/search?q=ethereum',
      'https://api.dexscreener.com/latest/dex/search?q=bsc',
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=50&page=1'
    ]

    try {
      const promises = endpoints.map(url => 
        axios.get(url, { timeout: 5000 }).catch(err => {
          console.log(`⚠️  Failed to fetch ${url}:`, err.message)
          return null
        })
      )

      const results = await Promise.all(promises)
      const newTokens = []
      let totalProcessed = 0

      results.forEach((result, index) => {
        if (!result) return

        const data = result.data
        totalProcessed++

        console.log(`📊 Processing data from endpoint ${index + 1}...`)

        // Process DexScreener data
        if (data.pairs) {
          console.log(`   Found ${data.pairs.length} pairs`)
          data.pairs.forEach(pair => {
            const change = parseFloat(pair.priceChange?.h24 || 0)
            if (change >= 9 && change <= 13) {
              const token = {
                address: pair.baseToken?.address || `addr_${Date.now()}`,
                symbol: pair.baseToken?.symbol || 'UNKNOWN',
                name: pair.baseToken?.name || 'Unknown Token',
                price: parseFloat(pair.priceUsd || Math.random()),
                priceChange24h: change,
                volume24h: parseFloat(pair.volume?.h24 || 0),
                chain: endpoints[index].includes('ethereum') ? 'ETH' : 'BSC',
                timestamp: Date.now()
              }
              newTokens.push(token)
              this.tokens.set(`${token.chain}-${token.address}`, token)
            }
          })
        }

        // Process CoinGecko data
        if (Array.isArray(data)) {
          console.log(`   Found ${data.length} coins`)
          data.forEach(item => {
            const change = parseFloat(item.price_change_percentage_24h || 0)
            if (change >= 9 && change <= 13) {
              const token = {
                address: item.id || `addr_${Date.now()}`,
                symbol: (item.symbol || 'UNKNOWN').toUpperCase(),
                name: item.name || 'Unknown Token',
                price: parseFloat(item.current_price || Math.random()),
                priceChange24h: change,
                volume24h: parseFloat(item.total_volume || 0),
                chain: 'GECKO',
                timestamp: Date.now()
              }
              newTokens.push(token)
              this.tokens.set(`${token.chain}-${token.address}`, token)
            }
          })
        }
      })

      // If no real tokens found, add some mock data for testing
      if (newTokens.length === 0) {
        console.log('📝 No tokens in range found, adding mock data...')
        for (let i = 0; i < 5; i++) {
          const mockToken = {
            address: `mock_${i}_${Date.now()}`,
            symbol: `MOCK${i}`,
            name: `Mock Token ${i}`,
            price: Math.random() * 0.01,
            priceChange24h: 9 + Math.random() * 4, // 9-13%
            volume24h: Math.random() * 1000000,
            chain: ['ETH', 'BSC', 'POLYGON'][i % 3],
            timestamp: Date.now()
          }
          newTokens.push(mockToken)
          this.tokens.set(`${mockToken.chain}-${mockToken.address}`, mockToken)
        }
      }

      console.log(`✅ Found ${newTokens.length} tokens in 9-13% range. Total stored: ${this.tokens.size}`)

      if (newTokens.length > 0) {
        this.broadcast(newTokens)
      }

    } catch (error) {
      console.error('❌ Fetch error:', error.message)
    }
  }

  broadcast(tokens) {
    if (!this.wss || this.wss.clients.size === 0) {
      console.log('📡 No WebSocket clients connected')
      return
    }

    const message = JSON.stringify({
      type: 'token_updates',
      data: tokens,
      timestamp: Date.now()
    })

    console.log(`📤 Broadcasting ${tokens.length} tokens to ${this.wss.clients.size} clients`)

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
        console.log('   ✅ Sent to client')
      } else {
        console.log('   ⚠️  Client not ready')
      }
    })
  }

  startScanning() {
    console.log('🔥 Starting token scanning...')
    
    // Initial scan
    this.fetchTokens()
    
    // Regular scans
    setInterval(() => {
      console.log('\n🔄 Running scheduled scan...')
      this.fetchTokens()
    }, 3000)
    
    // Status updates
    setInterval(() => {
      console.log(`📊 Status: ${this.tokens.size} tokens stored, ${this.wss?.clients?.size || 0} clients connected`)
    }, 10000)
  }
}

new DebugScanner()
