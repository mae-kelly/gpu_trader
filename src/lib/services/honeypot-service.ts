import axios from 'axios'
import { tokenRepository } from '@/lib/repositories/token.repository'
import { cacheService } from '@/lib/cache'

interface HoneypotResult {
  isHoneypot: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  buyTax: number
  sellTax: number
  canSell: boolean
}

export class HoneypotService {
  async checkToken(address: string, chain: string): Promise<HoneypotResult> {
    const cacheKey = `honeypot:${chain}:${address}`
    const cached = await cacheService.get<HoneypotResult>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const chainId = this.getChainId(chain)
      const response = await axios.get('https://api.honeypot.is/v2/IsHoneypot', {
        params: { address, chainID: chainId },
        timeout: 10000
      })

      const result: HoneypotResult = {
        isHoneypot: response.data.isHoneypot || false,
        riskLevel: this.calculateRiskLevel(response.data),
        buyTax: parseFloat(response.data.buyTax || '0'),
        sellTax: parseFloat(response.data.sellTax || '0'),
        canSell: !response.data.isHoneypot && parseFloat(response.data.sellTax || '0') < 50
      }

      await cacheService.set(cacheKey, result, 3600)
      return result
    } catch (error) {
      console.error('Honeypot check failed:', error)
      return {
        isHoneypot: false,
        riskLevel: 'MEDIUM',
        buyTax: 0,
        sellTax: 0,
        canSell: true
      }
    }
  }

  private getChainId(chain: string): string {
    const chainMap: Record<string, string> = {
      'ethereum': '1',
      'bsc': '56',
      'polygon': '137',
      'arbitrum': '42161',
      'optimism': '10'
    }
    return chainMap[chain] || '1'
  }

  private calculateRiskLevel(data: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (data.isHoneypot) return 'CRITICAL'
    
    const buyTax = parseFloat(data.buyTax || '0')
    const sellTax = parseFloat(data.sellTax || '0')
    
    if (buyTax > 20 || sellTax > 20) return 'HIGH'
    if (buyTax > 10 || sellTax > 10) return 'MEDIUM'
    return 'LOW'
  }

  async batchCheckTokens(tokens: Array<{id: string, address: string, chain: string}>) {
    const promises = tokens.map(async token => {
      const result = await this.checkToken(token.address, token.chain)
      
      await tokenRepository.upsert({
        address: token.address,
        chain: token.chain,
        symbol: '',
        name: '',
        price: 0,
        priceChange24h: 0,
        volume24h: 0,
        liquidity: 0,
        marketCap: 0,
        isHoneypot: result.isHoneypot,
        riskLevel: result.riskLevel
      })
    })

    await Promise.allSettled(promises)
  }
}

export const honeypotService = new HoneypotService()
