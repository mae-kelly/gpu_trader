const express = require('express')
const axios = require('axios')
const app = express()
const port = process.env.PORT || 3000

let tokens = []

async function scanTokens() {
  try {
    const response = await axios.get('https://api.dexscreener.com/latest/dex/search?q=optimism', { timeout: 5000 })
    
    tokens = []
    if (response.data.pairs) {
      response.data.pairs.forEach(pair => {
        const change = parseFloat(pair.priceChange?.h24 || 0)
        if (change >= 9 && change <= 13) {
          tokens.push({
            address: pair.baseToken?.address || '',
            symbol: pair.baseToken?.symbol || '',
            price: parseFloat(pair.priceUsd || 0),
            priceChange24h: change,
            source: 'railway'
          })
        }
      })
    }
    
    console.log(`🚂 Railway found ${tokens.length} tokens`)
  } catch (error) {
    console.error('Railway scan error:', error.message)
  }
}

app.get('/tokens', (req, res) => {
  res.json({ tokens, count: tokens.length, source: 'railway' })
})

app.listen(port, () => {
  console.log(`🚂 Railway scanner on port ${port}`)
  scanTokens()
  setInterval(scanTokens, 5000)
})
