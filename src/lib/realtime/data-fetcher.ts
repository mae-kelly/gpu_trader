import axios from 'axios'
import PQueue from 'p-queue'
import pRetry from 'p-retry'

interface TokenData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_1h: number
  price_change_percentage_24h: number
  total_volume: number
  market_cap: number
  contract_address?: string
  platform?: string
}

interface HoneypotResult {
  honeypotResult: {
    isHoneypot: boolean
  }
  simulationResult?: {
    buyTax: number
    sellTax: number
    buyGas: number
    sellGas: number
  }
}

class RealTimeDataFetcher {
  private queue = new PQueue({ concurrency: 10, interval: 1000, intervalCap: 50 })
  private cache = new Map<string, { data: any, timestamp: number }>()
  private CACHE_TTL = 30000
  
  async getAllTokens(): Promise<TokenData[]> {
    const endpoints = [
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=1',
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=2',
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=3',
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=4'
    ]
    
    const allTokens: TokenData[] = []
    
    await Promise.all(endpoints.map(async (endpoint) => {
      try {
        const response = await this.queue.add(() => 
          pRetry(() => axios.get(endpoint, { timeout: 5000 }), { retries: 3 })
        )
        allTokens.push(...response.data)
      } catch (error) {
        console.error('Failed to fetch from:', endpoint)
      }
    }))

    const dexScreenerTokens = await this.getDexScreenerTokens()
    allTokens.push(...dexScreenerTokens)

    return allTokens.filter(token => 
      token.price_change_percentage_1h >= 9 && 
      token.price_change_percentage_1h <= 13
    )
  }

  async getDexScreenerTokens(): Promise<TokenData[]> {
    try {
      const response = await this.queue.add(() =>
        pRetry(() => axios.get('https://api.dexscreener.com/latest/dex/tokens', { timeout: 5000 }), { retries: 3 })
      )
      
      return response.data.pairs?.map((pair: any) => ({
        id: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        current_price: parseFloat(pair.priceUsd || '0'),
        price_change_percentage_1h: parseFloat(pair.priceChange?.h1 || '0'),
        price_change_percentage_24h: parseFloat(pair.priceChange?.h24 || '0'),
        total_volume: parseFloat(pair.volume?.h24 || '0'),
        market_cap: parseFloat(pair.fdv || '0'),
        contract_address: pair.baseToken.address,
        platform: pair.chainId
      })).filter((token: TokenData) => 
        token.price_change_percentage_1h >= 9 && 
        token.price_change_percentage_1h <= 13
      ) || []
    } catch {
      return []
    }
  }

  async checkHoneypot(contractAddress: string, chainId: string = 'ethereum'): Promise<HoneypotResult | null> {
    const cacheKey = `honeypot-${contractAddress}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      const response = await this.queue.add(() =>
        pRetry(() => axios.get(`https://api.honeypot.is/v2/IsHoneypot?address=${contractAddress}&chainID=${chainId}`, { 
          timeout: 10000 
        }), { retries: 2 })
      )
      
      const result = response.data
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } catch {
      return null
    }
  }

  async getTokenPriceHistory(tokenId: string, hours: number = 24): Promise<number[]> {
    const cacheKey = `history-${tokenId}-${hours}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.data
    }

    try {
      const response = await this.queue.add(() =>
        pRetry(() => axios.get(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=1&interval=hourly`, {
          timeout: 5000
        }), { retries: 3 })
      )
      
      const prices = response.data.prices.map((price: [number, number]) => price[1])
      this.cache.set(cacheKey, { data: prices, timestamp: Date.now() })
      return prices
    } catch {
      return []
    }
  }
}

export const dataFetcher = new RealTimeDataFetcher()
