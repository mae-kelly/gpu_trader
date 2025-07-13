export default async function handler(req, res) {
  const axios = require('axios')
  
  try {
    const endpoints = [
      'https://api.dexscreener.com/latest/dex/search?q=arbitrum',
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1'
    ]

    const promises = endpoints.map(url => 
      axios.get(url, { timeout: 5000 }).catch(() => null)
    )

    const results = await Promise.all(promises)
    const tokens = []

    results.forEach(result => {
      if (!result) return

      const data = result.data

      if (data.pairs) {
        data.pairs.forEach(pair => {
          const change = parseFloat(pair.priceChange?.h24 || 0)
          if (change >= 9 && change <= 13) {
            tokens.push({
              address: pair.baseToken?.address || '',
              symbol: pair.baseToken?.symbol || '',
              price: parseFloat(pair.priceUsd || 0),
              priceChange24h: change,
              source: 'vercel'
            })
          }
        })
      }

      if (Array.isArray(data)) {
        data.forEach(item => {
          const change = parseFloat(item.price_change_percentage_24h || 0)
          if (change >= 9 && change <= 13) {
            tokens.push({
              address: item.id,
              symbol: item.symbol.toUpperCase(),
              price: parseFloat(item.current_price || 0),
              priceChange24h: change,
              source: 'vercel'
            })
          }
        })
      }
    })

    res.json({ tokens, count: tokens.length, source: 'vercel' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
