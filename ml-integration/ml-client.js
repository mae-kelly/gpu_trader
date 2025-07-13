const axios = require('axios')

class MLTradingClient {
  constructor(backendUrl = 'YOUR_NGROK_URL_HERE') {
    this.backendUrl = backendUrl
    this.lastAnalysis = new Map()
  }

  async analyzeTokens(tokens) {
    try {
      console.log(`🤖 Sending ${tokens.length} tokens to ML backend...`)
      
      const response = await axios.post(`${this.backendUrl}/analyze`, {
        tokens: tokens
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        console.log(`✅ ML Analysis complete for ${response.data.analyzed_count} tokens`)
        
        // Cache results
        response.data.recommendations.forEach(rec => {
          this.lastAnalysis.set(rec.address, rec)
        })
        
        return response.data.recommendations
      } else {
        console.error('❌ ML Analysis failed:', response.data.error)
        return []
      }
      
    } catch (error) {
      console.error('❌ ML Backend connection error:', error.message)
      return []
    }
  }

  getTokenAnalysis(address) {
    return this.lastAnalysis.get(address)
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.backendUrl}/health`, { timeout: 5000 })
      return response.data
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}

module.exports = { MLTradingClient }
