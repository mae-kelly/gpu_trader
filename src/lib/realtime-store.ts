// Simple store without external dependencies
interface TokenData {
  symbol: string
  price: number
  change: number
  volume: number
  marketCap?: number
  momentum?: number
  rsi?: number
  trend?: 'up' | 'down' | 'neutral'
}

class SimpleRealtimeStore {
  private prices: Record<string, number> = {}
  private isConnected = false
  private lastUpdate: Date | null = null
  private totalScanned = 0
  private tokens: TokenData[] = []
  private updateTrigger = 0
  private listeners: Array<() => void> = []
  private isScanning = false
  private scanningInterval: NodeJS.Timeout | null = null

  updatePrice(symbol: string, price: number) {
    this.prices[symbol] = price
    this.lastUpdate = new Date()
    this.updateTrigger++
    this.notifyListeners()
  }

  setConnected(connected: boolean) {
    this.isConnected = connected
    this.notifyListeners()
  }

  setTotalScanned(count: number) {
    this.totalScanned = count
    this.updateTrigger++
    this.notifyListeners()
  }

  setTokens(tokens: TokenData[]) {
    this.tokens = tokens
    this.lastUpdate = new Date()
    this.updateTrigger++
    this.notifyListeners()
  }

  addToken(token: TokenData) {
    const existingIndex = this.tokens.findIndex(t => t.symbol === token.symbol)
    if (existingIndex >= 0) {
      this.tokens[existingIndex] = { ...this.tokens[existingIndex], ...token }
    } else {
      this.tokens.push(token)
    }
    this.lastUpdate = new Date()
    this.updateTrigger++
    this.notifyListeners()
  }

  startRealTimeScanning() {
    if (this.isScanning) {
      console.log('Scanning already in progress')
      return
    }

    this.isScanning = true
    this.setConnected(true)
    console.log('🚀 Starting real-time token scanning...')

    // Simulate scanning process
    this.scanningInterval = setInterval(() => {
      // Simulate finding new tokens or updating existing ones
      this.totalScanned += Math.floor(Math.random() * 10) + 1
      this.lastUpdate = new Date()
      this.updateTrigger++
      this.notifyListeners()
    }, 2000) // Update every 2 seconds

    this.notifyListeners()
  }

  stopRealTimeScanning() {
    if (!this.isScanning) {
      console.log('No scanning in progress')
      return
    }

    this.isScanning = false
    this.setConnected(false)
    
    if (this.scanningInterval) {
      clearInterval(this.scanningInterval)
      this.scanningInterval = null
    }

    console.log('🛑 Stopped real-time token scanning')
    this.notifyListeners()
  }

  clearTokens() {
    this.tokens = []
    this.totalScanned = 0
    this.lastUpdate = null
    this.updateTrigger++
    console.log('🧹 Cleared all token data')
    this.notifyListeners()
  }

  exportTokens() {
    const data = {
      tokens: this.tokens,
      totalScanned: this.totalScanned,
      lastUpdate: this.lastUpdate,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tokens-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('📥 Token data exported')
  }

  getFilteredTokens(filter?: {
    minPrice?: number
    maxPrice?: number
    minVolume?: number
    trend?: 'up' | 'down' | 'neutral'
    sortBy?: 'price' | 'change' | 'volume' | 'momentum'
    sortOrder?: 'asc' | 'desc'
  }) {
    let filtered = [...this.tokens]

    // Apply filters
    if (filter) {
      if (filter.minPrice !== undefined) {
        filtered = filtered.filter(token => token.price >= filter.minPrice!)
      }
      if (filter.maxPrice !== undefined) {
        filtered = filtered.filter(token => token.price <= filter.maxPrice!)
      }
      if (filter.minVolume !== undefined) {
        filtered = filtered.filter(token => token.volume >= filter.minVolume!)
      }
      if (filter.trend) {
        filtered = filtered.filter(token => token.trend === filter.trend)
      }

      // Apply sorting
      if (filter.sortBy) {
        filtered.sort((a, b) => {
          let aVal = a[filter.sortBy!]
          let bVal = b[filter.sortBy!]
          
          if (typeof aVal === 'undefined') aVal = 0
          if (typeof bVal === 'undefined') bVal = 0
          
          const multiplier = filter.sortOrder === 'desc' ? -1 : 1
          return (aVal - bVal) * multiplier
        })
      }
    }

    return filtered
  }

  getPrices() {
    return { ...this.prices }
  }

  getIsScanning() {
    return this.isScanning
  }

  getState() {
    return {
      prices: { ...this.prices },
      isConnected: this.isConnected,
      lastUpdate: this.lastUpdate,
      totalScanned: this.totalScanned,
      tokens: [...this.tokens],
      updateTrigger: this.updateTrigger,
      isScanning: this.isScanning
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  // Initialize empty store
  initialize() {
    this.tokens = []
    this.totalScanned = 0
    this.isConnected = false
    this.lastUpdate = null
    this.updateTrigger = 0
    this.isScanning = false
    if (this.scanningInterval) {
      clearInterval(this.scanningInterval)
      this.scanningInterval = null
    }
  }
}

export const realtimeStore = new SimpleRealtimeStore()

// Initialize empty store
realtimeStore.initialize()

// React hook
import { useState, useEffect } from 'react'

interface RealtimeState {
  prices: Record<string, number>
  isConnected: boolean
  lastUpdate: Date | null
  totalScanned: number
  tokens: TokenData[]
  updateTrigger: number
  isScanning: boolean
}

export function useRealtimeStore(): RealtimeState & {
  updatePrice: (symbol: string, price: number) => void
  setConnected: (connected: boolean) => void
  setTotalScanned: (count: number) => void
  setTokens: (tokens: TokenData[]) => void
  addToken: (token: TokenData) => void
  getFilteredTokens: (filter?: {
    minPrice?: number
    maxPrice?: number
    minVolume?: number
    trend?: 'up' | 'down' | 'neutral'
    sortBy?: 'price' | 'change' | 'volume' | 'momentum'
    sortOrder?: 'asc' | 'desc'
  }) => TokenData[]
  startRealTimeScanning: () => void
  stopRealTimeScanning: () => void
  clearTokens: () => void
  exportTokens: () => void
} {
  const [state, setState] = useState(() => realtimeStore.getState())

  useEffect(() => {
    const unsubscribe = realtimeStore.subscribe(() => {
      setState(realtimeStore.getState())
    })
    return unsubscribe
  }, [])

  return {
    ...state,
    updatePrice: (symbol: string, price: number) => realtimeStore.updatePrice(symbol, price),
    setConnected: (connected: boolean) => realtimeStore.setConnected(connected),
    setTotalScanned: (count: number) => realtimeStore.setTotalScanned(count),
    setTokens: (tokens: TokenData[]) => realtimeStore.setTokens(tokens),
    addToken: (token: TokenData) => realtimeStore.addToken(token),
    getFilteredTokens: (filter?) => realtimeStore.getFilteredTokens(filter),
    startRealTimeScanning: () => realtimeStore.startRealTimeScanning(),
    stopRealTimeScanning: () => realtimeStore.stopRealTimeScanning(),
    clearTokens: () => realtimeStore.clearTokens(),
    exportTokens: () => realtimeStore.exportTokens()
  }
}

export type { TokenData }
