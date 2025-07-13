const WebSocket = require('ws')
const axios = require('axios')

console.log('🚀 Starting REAL TOKENS ONLY Scanner...')

const wss = new WebSocket.Server({ port: 8080 })
console.log('✅ WebSocket server on port 8080')

let realTokens = new Map()

wss.on('connection', function(ws) {
  console.log('🔗 Client connected! Total:', wss.clients.size)
  
  // Send existing real tokens
  const data = {
    type: 'all_tokens',
    data: Array.from(realTokens.values()),
    count: realTokens.size,
    timestamp: Date.now()
  }
  
  ws.send(JSON.stringify(data))
  console.log(`📤 Sent ${realTokens.size} real tokens to client`)
  
  ws.on('close', () => console.log('🔌 Client disconnected'))
})

async function scanRealTokens() {
  console.log('🔍 Scanning for REAL tokens only...')
  
  const endpoints = [
    'https://api.dexscreener.com/latest/dex/search?q=ethereum',
    'https://api.dexscreener.com/latest/dex/search?q=bsc',
    'https://api.dexscreener.com/latest/dex/search?q=polygon',
    'https://api.dexscreener.com/latest/dex/search?q=arbitrum',
    'https://api.geckoterminal.com/api/v2/networks/eth/trending_pools',
    'https://api.geckoterminal.com/api/v2/networks/bsc/trending_pools'
  ]
  
  let totalFound = 0
  let newTokens = []
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Fetching: ${endpoint}`)
      const response = await axios.get(endpoint, { timeout: 3000 })
      
      if (response.data.pairs) {
        response.data.pairs.forEach(pair => {
          const change = parseFloat(pair.priceChange?.h24 || 0)
          
          if (change >= 9 && change <= 13) {
            const token = {
              address: pair.baseToken?.address || '',
              symbol: pair.baseToken?.symbol || '',
              name: pair.baseToken?.name || '',
              price: parseFloat(pair.priceUsd || 0),
              priceChange24h: change,
              volume24h: parseFloat(pair.volume?.h24 || 0),
              chain: endpoint.includes('bsc') ? 'BSC' : 
                     endpoint.includes('polygon') ? 'POLYGON' :
                     endpoint.includes('arbitrum') ? 'ARBITRUM' : 'ETH',
              timestamp: Date.now()
            }
            
            if (token.symbol && token.address && token.price > 0) {
              const key = `${token.chain}-${token.address}`
              realTokens.set(key, token)
              newTokens.push(token)
              totalFound++
            }
          }
        })
      }
      
      if (response.data.data) {
        response.data.data.forEach(pool => {
          const change = parseFloat(pool.attributes?.price_change_percentage?.h24 || 0)
          
          if (change >= 9 && change <= 13) {
            const token = {
              address: pool.relationships?.base_token?.data?.id || '',
              symbol: pool.attributes?.name?.split('/')[0] || '',
              name: pool.attributes?.name || '',
              price: parseFloat(pool.attributes?.base_token_price_usd || 0),
              priceChange24h: change,
              volume24h: parseFloat(pool.attributes?.volume_usd?.h24 || 0),
              chain: endpoint.includes('bsc') ? 'BSC' : 'ETH',
              timestamp: Date.now()
            }
            
            if (token.symbol && token.address && token.price > 0) {
              const key = `${token.chain}-${token.address}`
              realTokens.set(key, token)
              newTokens.push(token)
              totalFound++
            }
          }
        })
      }
      
    } catch (error) {
      console.log(`⚠️  ${endpoint} failed: ${error.message}`)
    }
  }
  
  console.log(`✅ Found ${totalFound} REAL tokens in 9-13% range`)
  console.log(`📊 Total stored: ${realTokens.size} real tokens`)
  
  if (newTokens.length > 0 && wss.clients.size > 0) {
    const message = JSON.stringify({
      type: 'token_updates',
      data: newTokens,
      timestamp: Date.now()
    })
    
    console.log(`📤 Broadcasting ${newTokens.length} real tokens to ${wss.clients.size} clients`)
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  } else if (newTokens.length === 0) {
    console.log('📭 No new tokens in 9-13% range this scan')
  }
}

// Initial scan
scanRealTokens()

// Scan every 5 seconds for real tokens
setInterval(scanRealTokens, 5000)

// Status every 30 seconds
setInterval(() => {
  console.log(`📊 REAL TOKENS: ${realTokens.size} stored, ${wss.clients.size} clients`)
}, 30000)

console.log('✅ REAL TOKENS ONLY scanner running!')
