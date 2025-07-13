const WebSocket = require('ws')
const axios = require('axios')
const { MLTradingClient } = require('./ml-integration/ml-client')

console.log('🤖 Starting EXTREME Scanner with ML Analysis...')

const wss = new WebSocket.Server({ port: 8080 })
const mlClient = new MLTradingClient('YOUR_NGROK_URL_HERE')

let allTokens = new Map()
let mlAnalysis = new Map()

wss.on('connection', function(ws) {
  console.log('🔗 Client connected! Total:', wss.clients.size)
  broadcastTokensWithML()
  ws.on('close', () => console.log('🔌 Client disconnected'))
})

function broadcastTokensWithML() {
  if (wss.clients.size === 0) return
  
  const tokens = Array.from(allTokens.values()).map(token => {
    const ml = mlAnalysis.get(token.address)
    return {
      ...token,
      ml: ml || null
    }
  })
  
  const message = JSON.stringify({
    type: 'realtime_update_with_ml',
    data: tokens,
    timestamp: Date.now()
  })
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
  
  console.log(`📡 Broadcast ${tokens.length} tokens (${mlAnalysis.size} with ML) to ${wss.clients.size} clients`)
}

// Include all the extreme scanning logic from before...
// [Previous extreme scanning code here]

// Add ML analysis every 60 seconds
setInterval(async () => {
  if (allTokens.size > 0) {
    console.log('🤖 Running ML analysis on all tokens...')
    
    const tokensArray = Array.from(allTokens.values())
    const recommendations = await mlClient.analyzeTokens(tokensArray)
    
    recommendations.forEach(rec => {
      mlAnalysis.set(rec.address, rec)
    })
    
    console.log(`🧠 ML Analysis complete: ${recommendations.length} recommendations`)
    broadcastTokensWithML()
  }
}, 60000)

console.log('✅ EXTREME Scanner with ML running!')
console.log('🤖 ML analysis every 60 seconds')
console.log('🔄 Set your Colab ngrok URL in the code')
