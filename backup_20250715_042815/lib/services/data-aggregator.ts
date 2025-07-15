import axios from 'axios'
import { tokenRepository } from '@/lib/repositories/token.repository'
import { cacheService } from '@/lib/cache'
import PQueue from 'p-queue'
import pRetry from 'p-retry'

interface TokenData {
  address: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  marketCap: number
  chain: string
}

export class DataAggregator {
  private queue = new PQueue({ concurrency: 10, interval: 1000, intervalCap: 50 })
  private endpoints = [
    'https://api.dexscreener.com/latest/dex/search?q=ethereum',
    'https://api.dexscreener.com/latest/dex/search?q=bsc',
    'https://api.dexscreener.com/latest/dex/search?q=polygon',
    'https://api.dexscreener.com/latest/dex/search?q=arbitrum',
    'https://api.geckoterminal.com/api/v2/networks/eth/trending_pools',
    'https://api.geckoterminal.com/api/v2/networks/bsc/trending_pools',
    'https://api.geckoterminal.com/api/v2/networks/polygon/trending_pools',
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=1'
  ]

  async fetchAllTokens(): Promise<TokenData[]> {
    const cacheKey = 'all_tokens'
    const cached = await cacheService.get<TokenData[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    const promises = this.endpoints.map(endpoint => 
      this.queue.add(() => this.fetchFromEndpoint(endpoint))
    )

    const results = await Promise.allSettled(promises)
    const allTokens: TokenData[] = []

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allTokens.push(...result.value)
      }
    })

    const filteredTokens = this.deduplicateAndFilter(allTokens)
    await cacheService.set(cacheKey, filteredTokens, 30)
    
    return filteredTokens
  }

  private async fetchFromEndpoint(endpoint: string): Promise<TokenData[]> {
    return pRetry(async () => {
      const response = await axios.get(endpoint, {
        timeout: 10000,
        headers: {
          'User-Agent': 'GPU-Swarm-Trader/1.0',
          'Accept': 'application/json'
        }
      })
      
      return this.parseResponse(response.data, endpoint)
    }, {
      retries: 3,
      minTimeout: 1000,
      onFailedAttempt: error => {
        console.log(`Attempt ${error.attemptNumber} failed for ${endpoint}`)
      }
    })
  }

  private parseResponse(data: any, endpoint: string): TokenData[] {
    const tokens: TokenData[] = []
    
    try {
      if (data.pairs) {
        data.pairs.forEach((pair: any) => {
          const change = parseFloat(pair.priceChange?.h24 || '0')
          if (change >= 9 && change <= 13 && pair.baseToken?.address) {
            tokens.push({
              address: pair.baseToken.address,
              symbol: pair.baseToken.symbol || '',
              name: pair.baseToken.name || pair.baseToken.symbol || '',
              price: parseFloat(pair.priceUsd || '0'),
              priceChange24h: change,
              volume24h: parseFloat(pair.volume?.h24 || '0'),
              liquidity: parseFloat(pair.liquidity?.usd || '0'),
              marketCap: parseFloat(pair.fdv || '0'),
              chain: this.getChainFromEndpoint(endpoint)
            })
          }
        })
      }

      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((item: any) => {
          const change = parseFloat(item.attributes?.price_change_percentage?.h24 || '0')
          if (change >= 9 && change <= 13) {
            tokens.push({
              address: item.relationships?.base_token?.data?.id || '',
              symbol: item.attributes?.name?.split('/')[0] || '',
              name: item.attributes?.name || '',
              price: parseFloat(item.attributes?.base_token_price_usd || '0'),
              priceChange24h: change,
              volume24h: parseFloat(item.attributes?.volume_usd?.h24 || '0'),
              liquidity: parseFloat(item.attributes?.reserve_in_usd || '0'),
              marketCap: parseFloat(item.attributes?.fdv_usd || '0'),
              chain: this.getChainFromEndpoint(endpoint)
            })
          }
        })
      }

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const change = parseFloat(item.price_change_percentage_24h || '0')
          if (change >= 9 && change <= 13) {
            tokens.push({
              address: item.contract_address || item.id,
              symbol: (item.symbol || '').toUpperCase(),
              name: item.name || item.symbol || '',
              price: parseFloat(item.current_price || '0'),
              priceChange24h: change,
              volume24h: parseFloat(item.total_volume || '0'),
              liquidity: parseFloat(item.market_cap || '0'),
              marketCap: parseFloat(item.market_cap || '0'),
              chain: 'ethereum'
            })
          }
        })
      }
    } catch (error) {
      console.error('Parse error for endpoint:', endpoint, error)
    }

    return tokens
  }

  private getChainFromEndpoint(endpoint: string): string {
    if (endpoint.includes('ethereum') || endpoint.includes('eth')) return 'ethereum'
    if (endpoint.includes('bsc')) return 'bsc'
    if (endpoint.includes('polygon')) return 'polygon'
    if (endpoint.includes('arbitrum')) return 'arbitrum'
    if (endpoint.includes('optimism')) return 'optimism'
    return 'ethereum'
  }

  private deduplicateAndFilter(tokens: TokenData[]): TokenData[] {
    const uniqueTokens = new Map<string, TokenData>()
    
    tokens.forEach(token => {
      if (token.address && token.symbol && token.price > 0) {
        const key = `${token.chain}-${token.address}`
        const existing = uniqueTokens.get(key)
        
        if (!existing || token.volume24h > existing.volume24h) {
          uniqueTokens.set(key, token)
        }
      }
    })

    return Array.from(uniqueTokens.values())
      .filter(token => token.volume24h >= 1000)
      .sort((a, b) => b.priceChange24h - a.priceChange24h)
  }

  async persistTokens(tokens: TokenData[]): Promise<void> {
    const promises = tokens.map(token => 
      this.queue.add(() => tokenRepository.upsert({
        ...token,
        riskLevel: 'UNKNOWN'
      }))
    )

    await Promise.allSettled(promises)
  }
}

export const dataAggregator = new DataAggregator()
