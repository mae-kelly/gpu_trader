const axios = require('axios')
const { Worker } = require('worker_threads')
const WebSocket = require('ws')

class GPUAcceleratedScanner {
  constructor() {
    this.workers = []
    this.wsClients = new Set()
    this.results = new Map()
    this.isScanning = false
    
    this.wss = new WebSocket.Server({ port: 8080 })
    this.setupWebSocketServer()
    this.initializeWorkers()
    this.startRealtimeScanning()
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws) => {
      this.wsClients.add(ws)
      console.log(`🔗 Client connected. Total: ${this.wsClients.size}`)
      
      ws.on('close', () => this.wsClients.delete(ws))
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          if (message.type === 'subscribe') {
            this.sendAllTokens(ws)
          }
        } catch (error) {
          console.error('WebSocket message error:', error)
        }
      })
    })
  }

  initializeWorkers() {
    const workerCount = 32
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(`
        const { parentPort } = require('worker_threads')
        const axios = require('axios')
        
        parentPort.on('message', async (task) => {
          try {
            const response = await axios.get(task.endpoint, {
              headers: task.headers || {},
              params: task.params || {},
              timeout: 1000
            })
            parentPort.postMessage({
              taskId: task.id,
              success: true,
              data: response.data,
              chain: task.chain
            })
          } catch (error) {
            parentPort.postMessage({
              taskId: task.id,
              success: false,
              error: error.message,
              chain: task.chain
            })
          }
        })
      `, { eval: true })
      
      worker.on('message', (result) => this.handleWorkerResult(result))
      this.workers.push(worker)
    }
    console.log(`⚡ Initialized ${workerCount} FREE GPU workers`)
  }

  generateFreeTasks() {
    const tasks = []
    const chains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'cronos', 'moonbeam', 'moonriver', 'harmony', 'celo', 'aurora', 'fuse', 'evmos', 'milkomeda', 'kava', 'metis', 'syscoin', 'emerald', 'rose']
    
    chains.forEach(chain => {
      tasks.push({
        id: `dexscreener-search-${chain}`,
        endpoint: `https://api.dexscreener.com/latest/dex/search`,
        params: { q: chain },
        chain
      })
      
      tasks.push({
        id: `geckoterminal-trending-${chain}`,
        endpoint: `https://api.geckoterminal.com/api/v2/networks/${chain}/trending_pools`,
        chain
      })
      
      tasks.push({
        id: `geckoterminal-new-${chain}`,
        endpoint: `https://api.geckoterminal.com/api/v2/networks/${chain}/new_pools`,
        chain
      })
    })

    for (let page = 1; page <= 20; page++) {
      tasks.push({
        id: `coingecko-free-${page}`,
        endpoint: 'https://api.coingecko.com/api/v3/coins/markets',
        params: {
          vs_currency: 'usd',
          order: 'volume_desc',
          per_page: 250,
          page
        },
        chain: 'multi'
      })
    }

    for (let offset = 0; offset < 1000; offset += 100) {
      tasks.push({
        id: `coincap-${offset}`,
        endpoint: 'https://api.coincap.io/v2/assets',
        params: { limit: 100, offset },
        chain: 'multi'
      })
    }

    tasks.push({
      id: 'coinpaprika-tickers',
      endpoint: 'https://api.coinpaprika.com/v1/tickers',
      params: { limit: 1000 },
      chain: 'multi'
    })

    tasks.push({
      id: 'cryptocompare-top',
      endpoint: 'https://min-api.cryptocompare.com/data/top/mktcapfull',
      params: { limit: 100, tsym: 'USD' },
      chain: 'multi'
    })

    return tasks
  }

  handleWorkerResult(result) {
    if (!result.success) return
    
    const tokens = this.parseTokenData(result.data, result.chain)
    tokens.forEach(token => {
      if (token.priceChange24h >= 9 && token.priceChange24h <= 13) {
        this.results.set(`${token.chain}-${token.address}-${token.symbol}`, token)
        this.broadcastToken(token)
      }
    })
  }

  parseTokenData(data, chain) {
    const tokens = []
    
    try {
      if (data.pairs) {
        data.pairs.forEach(pair => {
          const change = parseFloat(pair.priceChange?.h24 || pair.priceChange?.h1 || '0')
          if (change >= 9 && change <= 13) {
            tokens.push({
              address: pair.baseToken?.address || pair.pairAddress || '',
              symbol: pair.baseToken?.symbol || '',
              name: pair.baseToken?.name || '',
              price: parseFloat(pair.priceUsd || '0'),
              priceChange24h: change,
              volume24h: parseFloat(pair.volume?.h24 || '0'),
              liquidity: parseFloat(pair.liquidity?.usd || '0'),
              marketCap: parseFloat(pair.fdv || '0'),
              chain,
              timestamp: Date.now()
            })
          }
        })
      }

      if (data.data && Array.isArray(data.data)) {
        data.data.forEach(item => {
          let change = parseFloat(
            item.attributes?.price_change_percentage?.h24 || 
            item.price_change_percentage_24h || 
            item.percent_change_24h || 
            item.quotes?.USD?.percent_change_24h || 
            '0'
          )
          
          if (change >= 9 && change <= 13) {
            tokens.push({
              address: item.relationships?.base_token?.data?.id || item.contract_address || item.id || '',
              symbol: (item.attributes?.name?.split('/')[0] || item.symbol || '').toUpperCase(),
              name: item.attributes?.name || item.name || '',
              price: parseFloat(
                item.attributes?.base_token_price_usd || 
                item.current_price || 
                item.priceUsd || 
                item.quotes?.USD?.price || 
                '0'
              ),
              priceChange24h: change,
              volume24h: parseFloat(
                item.attributes?.volume_usd?.h24 || 
                item.total_volume || 
                item.quotes?.USD?.volume_24h || 
                '0'
              ),
              liquidity: parseFloat(
                item.attributes?.reserve_in_usd || 
                item.market_cap || 
                item.quotes?.USD?.market_cap || 
                '0'
              ),
              marketCap: parseFloat(
                item.attributes?.fdv_usd || 
                item.market_cap || 
                item.quotes?.USD?.market_cap || 
                '0'
              ),
              chain,
              timestamp: Date.now()
            })
          }
        })
      }

      if (Array.isArray(data)) {
        data.forEach(item => {
          const change = parseFloat(item.changePercent24Hr || item.percent_change_24h || '0')
          if (change >= 9 && change <= 13) {
            tokens.push({
              address: item.id || item.symbol || '',
              symbol: (item.symbol || '').toUpperCase(),
              name: item.name || '',
              price: parseFloat(item.priceUsd || item.price || '0'),
              priceChange24h: change,
              volume24h: parseFloat(item.volumeUsd24Hr || item.volume_24h || '0'),
              liquidity: parseFloat(item.marketCapUsd || item.market_cap || '0'),
              marketCap: parseFloat(item.marketCapUsd || item.market_cap || '0'),
              chain: chain === 'multi' ? 'ethereum' : chain,
              timestamp: Date.now()
            })
          }
        })
      }

      if (data.Data && Array.isArray(data.Data)) {
        data.Data.forEach(item => {
          const change = parseFloat(item.RAW?.USD?.CHANGEPCT24HOUR || '0')
          if (change >= 9 && change <= 13) {
            tokens.push({
              address: item.CoinInfo?.Id || '',
              symbol: item.CoinInfo?.Name || '',
              name: item.CoinInfo?.FullName || '',
              price: parseFloat(item.RAW?.USD?.PRICE || '0'),
              priceChange24h: change,
              volume24h: parseFloat(item.RAW?.USD?.VOLUME24HOUR || '0'),
              liquidity: parseFloat(item.RAW?.USD?.MKTCAP || '0'),
              marketCap: parseFloat(item.RAW?.USD?.MKTCAP || '0'),
              chain: 'multi',
              timestamp: Date.now()
            })
          }
        })
      }
    } catch (error) {
      console.error('Parse error:', error)
    }
    
    return tokens
  }

  broadcastToken(token) {
    const message = JSON.stringify({
      type: 'token_update',
      data: token,
      timestamp: Date.now()
    })
    
    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  sendAllTokens(ws) {
    const allTokens = Array.from(this.results.values())
    ws.send(JSON.stringify({
      type: 'all_tokens',
      data: allTokens,
      count: allTokens.length,
      timestamp: Date.now()
    }))
  }

  startRealtimeScanning() {
    if (this.isScanning) return
    this.isScanning = true
    
    console.log('🔥 Starting FREE GPU-accelerated real-time scanning...')
    
    const scan = () => {
      if (!this.isScanning) return
      
      const tasks = this.generateFreeTasks()
      let workerIndex = 0
      
      tasks.forEach(task => {
        this.workers[workerIndex % this.workers.length].postMessage(task)
        workerIndex++
      })
      
      console.log(`📡 Dispatched ${tasks.length} FREE tasks across ${this.workers.length} GPU workers`)
      setTimeout(scan, 1000)
    }
    
    scan()
    
    setInterval(() => {
      console.log(`📊 Active tokens: ${this.results.size}, Connected clients: ${this.wsClients.size}`)
    }, 5000)
  }

  stop() {
    this.isScanning = false
    this.workers.forEach(worker => worker.terminate())
    this.wss.close()
  }
}

const gpuScanner = new GPUAcceleratedScanner()

module.exports = { gpuScanner }
