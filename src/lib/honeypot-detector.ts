import axios from 'axios'

export interface HoneypotResult {
  isHoneypot: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  buyTax: number
  sellTax: number
  canSell: boolean
  reasons: string[]
  checkedAt: number
}

export class HoneypotDetector {
  private cache = new Map<string, HoneypotResult>()
  private readonly CACHE_DURATION = 5 * 60 * 1000

  async checkToken(address: string, chain: string): Promise<HoneypotResult> {
    const cacheKey = `${chain}-${address}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.checkedAt < this.CACHE_DURATION) {
      return cached
    }

    try {
      const result = await this.performHoneypotCheck(address, chain)
      this.cache.set(cacheKey, result)
      return result
    } catch (error) {
      console.error('Honeypot check failed:', error)
      return {
        isHoneypot: false,
        riskLevel: 'medium',
        buyTax: 0,
        sellTax: 0,
        canSell: true,
        reasons: ['Check failed'],
        checkedAt: Date.now()
      }
    }
  }

  private async performHoneypotCheck(address: string, chain: string): Promise<HoneypotResult> {
    const chainMap: Record<string, string> = {
      'ethereum': '1',
      'bsc': '56',
      'arbitrum': '42161',
      'polygon': '137'
    }

    const chainId = chainMap[chain] || '1'
    
    const response = await axios.get(`https://api.honeypot.is/v2/IsHoneypot`, {
      params: {
        address,
        chainID: chainId
      },
      timeout: 5000
    })

    const data = response.data

    return {
      isHoneypot: data.isHoneypot || false,
      riskLevel: this.calculateRiskLevel(data),
      buyTax: parseFloat(data.buyTax || '0'),
      sellTax: parseFloat(data.sellTax || '0'),
      canSell: !data.isHoneypot && data.sellTax < 50,
      reasons: this.extractReasons(data),
      checkedAt: Date.now()
    }
  }

  private calculateRiskLevel(data: any): 'low' | 'medium' | 'high' | 'critical' {
    if (data.isHoneypot) return 'critical'
    
    const buyTax = parseFloat(data.buyTax || '0')
    const sellTax = parseFloat(data.sellTax || '0')
    
    if (buyTax > 20 || sellTax > 20) return 'high'
    if (buyTax > 10 || sellTax > 10) return 'medium'
    
    return 'low'
  }

  private extractReasons(data: any): string[] {
    const reasons: string[] = []
    
    if (data.isHoneypot) reasons.push('Honeypot detected')
    if (data.buyTax > 10) reasons.push(`High buy tax: ${data.buyTax}%`)
    if (data.sellTax > 10) reasons.push(`High sell tax: ${data.sellTax}%`)
    if (!data.canSell) reasons.push('Cannot sell')
    
    return reasons
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }
}
