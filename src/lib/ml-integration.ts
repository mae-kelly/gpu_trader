interface MLRecommendation {
  symbol: string
  address: string
  chain: string
  recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'WEAK BUY' | 'AVOID'
  buy_score: number
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical'
  risk_confidence: number
  expected_profit_percent: number
  optimal_hold_hours: number
  optimal_hold_readable: string
  market_age_days: number
  market_maturity: string
  liquidity_ratio: number
  advice: string[]
  analysis_timestamp: string
}

class MLTradingIntegration {
  private backendUrl: string = 'YOUR_NGROK_URL_HERE'
  private analysisCache = new Map<string, MLRecommendation>()

  setBackendUrl(url: string) {
    this.backendUrl = url.replace(/\/$/, '') // Remove trailing slash
  }

  async analyzeTokens(tokens: any[]): Promise<MLRecommendation[]> {
    try {
      console.log(`🤖 Requesting ML analysis for ${tokens.length} tokens...`)
      
      const response = await fetch(`${this.backendUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokens }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ ML Analysis received for ${data.analyzed_count} tokens`)
        
        // Cache recommendations
        data.recommendations.forEach((rec: MLRecommendation) => {
          this.analysisCache.set(rec.address, rec)
        })
        
        return data.recommendations
      } else {
        throw new Error(data.error)
      }
      
    } catch (error) {
      console.error('❌ ML Analysis error:', error)
      return []
    }
  }

  getTokenRecommendation(address: string): MLRecommendation | null {
    return this.analysisCache.get(address) || null
  }

  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      } as any)
      
      const data = await response.json()
      return data.status === 'healthy'
    } catch {
      return false
    }
  }
}

export const mlTrading = new MLTradingIntegration()
export type { MLRecommendation }
