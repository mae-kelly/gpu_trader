import axios from 'axios'

export interface TokenData {
  address: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  marketCap: number
  chain: string
  lastUpdate: number
  priceHistory: Array<{ timestamp: number; price: number }>
}

export class DexAggregator {
  private tokens = new Map<string, TokenData>()
  private priceFeeds = new Map<string, Array<{ timestamp: number; price: number }>>()
  
  async fetchAllTokens(): Promise<TokenData[]> {
    const sources = [
      this.fetchFromDexScreener(),
      this.fetchFromDexTools(),
      this.fetchFromGeckoTerminal(),
      this.fetchFromBirdEye(),
      this.fetchFromPoocoin()
    ]
    
    const results = await Promise.allSettled(sources)
    const allTokens: TokenData[] = []
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allTokens.push(...result.value)
      }
    })
    
    return this.deduplicateTokens(allTokens)
  }

  private async fetchFromDexScreener(): Promise<TokenData[]> {
    try {
      const [eth, bsc, arb, poly] = await Promise.all([
        axios.get('https://api.dexscreener.com/latest/dex/tokens/trending/ethereum'),
        axios.get('https://api.dexscreener.com/latest/dex/tokens/trending/bsc'),
        axios.get('https://api.dexscreener.com/latest/dex/tokens/trending/arbitrum'),
        axios.get('https://api.dexscreener.com/latest/dex/tokens/trending/polygon')
      ])
      
      const tokens: TokenData[] = []
      
      ;[eth.data, bsc.data, arb.data, poly.data].forEach((data, index) => {
        const chain = ['ethereum', 'bsc', 'arbitrum', 'polygon'][index]
        if (data.pairs) {
          data.pairs.forEach((pair: any) => {
            if (pair.priceChange && pair.priceChange.h24) {
              const change = parseFloat(pair.priceChange.h24)
              if (change >= 9 && change <= 13) {
                tokens.push({
                  address: pair.baseToken.address,
                  symbol: pair.baseToken.symbol,
                  name: pair.baseToken.name,
                  price: parseFloat(pair.priceUsd || '0'),
                  priceChange24h: change,
                  volume24h: parseFloat(pair.volume?.h24 || '0'),
                  liquidity: parseFloat(pair.liquidity?.usd || '0'),
                  marketCap: parseFloat(pair.fdv || '0'),
                  chain,
                  lastUpdate: Date.now(),
                  priceHistory: []
                })
              }
            }
          })
        }
      })
      
      return tokens
    } catch (error) {
      console.error('DexScreener fetch failed:', error)
      return []
    }
  }

  private async fetchFromDexTools(): Promise<TokenData[]> {
    try {
      const response = await axios.get('https://www.dextools.io/shared/data/pools', {
        params: {
          chain: 'ether,bsc,arbitrum,polygon',
          sort: 'priceChange24h',
          order: 'desc',
          limit: 500
        }
      })
      
      const tokens: TokenData[] = []
      
      if (response.data.data) {
        response.data.data.forEach((token: any) => {
          const change = parseFloat(token.priceChange24h || '0')
          if (change >= 9 && change <= 13) {
            tokens.push({
              address: token.address,
              symbol: token.symbol,
              name: token.name,
              price: parseFloat(token.price || '0'),
              priceChange24h: change,
              volume24h: parseFloat(token.volume24h || '0'),
              liquidity: parseFloat(token.liquidity || '0'),
              marketCap: parseFloat(token.marketCap || '0'),
              chain: token.chain,
              lastUpdate: Date.now(),
              priceHistory: []
            })
          }
        })
      }
      
      return tokens
    } catch (error) {
      console.error('DexTools fetch failed:', error)
      return []
    }
  }

  private async fetchFromGeckoTerminal(): Promise<TokenData[]> {
    try {
      const networks = ['eth', 'bsc', 'arbitrum', 'polygon']
      const tokens: TokenData[] = []
      
      for (const network of networks) {
        const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${network}/pools`, {
          params: {
            sort: 'h24_volume_usd_desc',
            limit: 100
          }
        })
        
        if (response.data.data) {
          response.data.data.forEach((pool: any) => {
            if (pool.attributes) {
              const change = parseFloat(pool.attributes.price_change_percentage?.h24 || '0')
              if (change >= 9 && change <= 13) {
                tokens.push({
                  address: pool.relationships?.base_token?.data?.id || '',
                  symbol: pool.attributes.name?.split('/')[0] || '',
                  name: pool.attributes.name || '',
                  price: parseFloat(pool.attributes.base_token_price_usd || '0'),
                  priceChange24h: change,
                  volume24h: parseFloat(pool.attributes.volume_usd?.h24 || '0'),
                  liquidity: parseFloat(pool.attributes.reserve_in_usd || '0'),
                  marketCap: parseFloat(pool.attributes.fdv_usd || '0'),
                  chain: network,
                  lastUpdate: Date.now(),
                  priceHistory: []
                })
              }
            }
          })
        }
      }
      
      return tokens
    } catch (error) {
      console.error('GeckoTerminal fetch failed:', error)
      return []
    }
  }

  private async fetchFromBirdEye(): Promise<TokenData[]> {
    try {
      const response = await axios.get('https://public-api.birdeye.so/public/tokenlist', {
        params: {
          sort_by: 'v24hChangePercent',
          sort_type: 'desc',
          limit: 500
        },
        headers: {
          'X-API-KEY': process.env.BIRDEYE_API_KEY || ''
        }
      })
      
      const tokens: TokenData[] = []
      
      if (response.data.data?.tokens) {
        response.data.data.tokens.forEach((token: any) => {
          const change = parseFloat(token.v24hChangePercent || '0')
          if (change >= 9 && change <= 13) {
            tokens.push({
              address: token.address,
              symbol: token.symbol,
              name: token.name,
              price: parseFloat(token.price || '0'),
              priceChange24h: change,
              volume24h: parseFloat(token.v24hUSD || '0'),
              liquidity: parseFloat(token.liquidity || '0'),
              marketCap: parseFloat(token.mc || '0'),
              chain: 'solana',
              lastUpdate: Date.now(),
              priceHistory: []
            })
          }
        })
      }
      
      return tokens
    } catch (error) {
      console.error('BirdEye fetch failed:', error)
      return []
    }
  }

  private async fetchFromPoocoin(): Promise<TokenData[]> {
    try {
      const response = await axios.get('https://poocoin.app/api/v2/tokens/bsc/top', {
        params: {
          sort: 'price_change_24h',
          limit: 200
        }
      })
      
      const tokens: TokenData[] = []
      
      if (response.data) {
        response.data.forEach((token: any) => {
          const change = parseFloat(token.price_change_24h || '0')
          if (change >= 9 && change <= 13) {
            tokens.push({
              address: token.contract,
              symbol: token.symbol,
              name: token.name,
              price: parseFloat(token.price || '0'),
              priceChange24h: change,
              volume24h: parseFloat(token.volume_24h || '0'),
              liquidity: parseFloat(token.liquidity || '0'),
              marketCap: parseFloat(token.market_cap || '0'),
              chain: 'bsc',
              lastUpdate: Date.now(),
              priceHistory: []
            })
          }
        })
      }
      
      return tokens
    } catch (error) {
      console.error('Poocoin fetch failed:', error)
      return []
    }
  }

  private deduplicateTokens(tokens: TokenData[]): TokenData[] {
    const unique = new Map<string, TokenData>()
    
    tokens.forEach(token => {
      const key = `${token.chain}-${token.address}`
      if (!unique.has(key) || unique.get(key)!.lastUpdate < token.lastUpdate) {
        unique.set(key, token)
      }
    })
    
    return Array.from(unique.values())
  }

  updatePriceHistory(token: TokenData, price: number): void {
    const key = `${token.chain}-${token.address}`
    if (!this.priceFeeds.has(key)) {
      this.priceFeeds.set(key, [])
    }
    
    const history = this.priceFeeds.get(key)!
    history.push({ timestamp: Date.now(), price })
    
    if (history.length > 100) {
      history.shift()
    }
    
    token.priceHistory = [...history]
  }

  calculateAcceleration(token: TokenData): number {
    if (token.priceHistory.length < 3) return 0
    
    const recent = token.priceHistory.slice(-3)
    const velocity1 = (recent[1].price - recent[0].price) / (recent[1].timestamp - recent[0].timestamp)
    const velocity2 = (recent[2].price - recent[1].price) / (recent[2].timestamp - recent[1].timestamp)
    
    return (velocity2 - velocity1) / (recent[2].timestamp - recent[1].timestamp) * 1000000
  }
}
