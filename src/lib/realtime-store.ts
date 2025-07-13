import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { TokenData, DexAggregator } from './data-sources/dex-aggregator'
import { HoneypotDetector, HoneypotResult } from './honeypot-detector'
import { realtimeService, RealtimeUpdate } from './realtime-service'
import { accelerationCalculator, AccelerationData } from './acceleration-calculator'

interface RealtimeState {
  tokens: Map<string, TokenData>
  honeypotResults: Map<string, HoneypotResult>
  accelerationData: Map<string, AccelerationData>
  isConnected: boolean
  lastUpdate: number
  scanningStatus: 'idle' | 'scanning' | 'error'
  totalScanned: number
  
  startRealTimeScanning: () => void
  stopRealTimeScanning: () => void
  updateToken: (token: TokenData) => void
  setHoneypotResult: (address: string, result: HoneypotResult) => void
  getFilteredTokens: (filters: any) => TokenData[]
  getTokenWithMetrics: (address: string) => TokenData & { acceleration: AccelerationData; honeypot: HoneypotResult } | null
}

const dexAggregator = new DexAggregator()
const honeypotDetector = new HoneypotDetector()

export const useRealtimeStore = create<RealtimeState>()(
  subscribeWithSelector((set, get) => ({
    tokens: new Map(),
    honeypotResults: new Map(),
    accelerationData: new Map(),
    isConnected: false,
    lastUpdate: 0,
    scanningStatus: 'idle',
    totalScanned: 0,

    startRealTimeScanning: () => {
      set({ scanningStatus: 'scanning' })
      
      realtimeService.connect()
      
      realtimeService.addListener((update: RealtimeUpdate) => {
        const state = get()
        const tokenKey = `${update.chain}-${update.tokenAddress}`
        const existingToken = state.tokens.get(tokenKey)
        
        if (existingToken) {
          const updatedToken = {
            ...existingToken,
            ...update.data,
            lastUpdate: update.timestamp
          }
          
          dexAggregator.updatePriceHistory(updatedToken, update.data.price || existingToken.price)
          
          const acceleration = accelerationCalculator.calculateRealTimeMetrics(
            updatedToken.priceHistory,
            updatedToken.price
          )
          
          set(state => ({
            tokens: new Map(state.tokens).set(tokenKey, updatedToken),
            accelerationData: new Map(state.accelerationData).set(tokenKey, acceleration),
            lastUpdate: Date.now(),
            totalScanned: state.totalScanned + 1
          }))
        }
      })
      
      const scanAllTokens = async () => {
        try {
          const allTokens = await dexAggregator.fetchAllTokens()
          const newTokens = new Map<string, TokenData>()
          const newAccelerationData = new Map<string, AccelerationData>()
          
          for (const token of allTokens) {
            const tokenKey = `${token.chain}-${token.address}`
            newTokens.set(tokenKey, token)
            
            const acceleration = accelerationCalculator.calculateRealTimeMetrics(
              token.priceHistory,
              token.price
            )
            newAccelerationData.set(tokenKey, acceleration)
            
            honeypotDetector.checkToken(token.address, token.chain).then(result => {
              set(state => ({
                honeypotResults: new Map(state.honeypotResults).set(tokenKey, result)
              }))
            })
          }
          
          set({
            tokens: newTokens,
            accelerationData: newAccelerationData,
            lastUpdate: Date.now(),
            isConnected: realtimeService.getConnectionStatus()
          })
        } catch (error) {
          console.error('Token scanning failed:', error)
          set({ scanningStatus: 'error' })
        }
      }
      
      scanAllTokens()
      setInterval(scanAllTokens, 5000)
    },

    stopRealTimeScanning: () => {
      realtimeService.disconnect()
      set({ 
        scanningStatus: 'idle', 
        isConnected: false 
      })
    },

    updateToken: (token: TokenData) => {
      const tokenKey = `${token.chain}-${token.address}`
      
      set(state => {
        const newTokens = new Map(state.tokens)
        const existingToken = newTokens.get(tokenKey)
        
        if (existingToken) {
          dexAggregator.updatePriceHistory(existingToken, token.price)
        }
        
        newTokens.set(tokenKey, token)
        
        const acceleration = accelerationCalculator.calculateRealTimeMetrics(
          token.priceHistory,
          token.price
        )
        
        return {
          tokens: newTokens,
          accelerationData: new Map(state.accelerationData).set(tokenKey, acceleration),
          lastUpdate: Date.now()
        }
      })
    },

    setHoneypotResult: (address: string, result: HoneypotResult) => {
      set(state => ({
        honeypotResults: new Map(state.honeypotResults).set(address, result)
      }))
    },

    getFilteredTokens: (filters) => {
      const state = get()
      const tokens = Array.from(state.tokens.values())
      
      return tokens.filter(token => {
        if (filters.chains && filters.chains.length > 0) {
          if (!filters.chains.includes(token.chain)) return false
        }
        
        if (filters.minVolume && token.volume24h < filters.minVolume) return false
        if (filters.minLiquidity && token.liquidity < filters.minLiquidity) return false
        
        const change = token.priceChange24h
        if (change < 9 || change > 13) return false
        
        const tokenKey = `${token.chain}-${token.address}`
        const honeypot = state.honeypotResults.get(tokenKey)
        if (filters.excludeHoneypots && honeypot?.isHoneypot) return false
        
        return true
      })
    },

    getTokenWithMetrics: (address: string) => {
      const state = get()
      const token = Array.from(state.tokens.values()).find(t => t.address === address)
      if (!token) return null
      
      const tokenKey = `${token.chain}-${token.address}`
      const acceleration = state.accelerationData.get(tokenKey) || {
        velocity: 0,
        acceleration: 0,
        momentum: 0,
        trend: 'stable' as const,
        strength: 0
      }
      const honeypot = state.honeypotResults.get(tokenKey) || {
        isHoneypot: false,
        riskLevel: 'low' as const,
        buyTax: 0,
        sellTax: 0,
        canSell: true,
        reasons: [],
        checkedAt: Date.now()
      }
      
      return {
        ...token,
        acceleration,
        honeypot
      }
    }
  }))
)
