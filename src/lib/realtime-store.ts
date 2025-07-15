"use client"
import { create } from 'zustand'
interface TokenData {
  address: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  volume24h: number
  chain: string
  timestamp: number
}
interface RealtimeState {
  tokens: TokenData[]
  isConnected: boolean
  lastUpdate: number
  totalScanned: number
  updateTrigger: number
  setTokens: (tokens: TokenData[]) => void
  addToken: (token: TokenData) => void
  setConnected: (connected: boolean) => void
  setTotalScanned: (count: number) => void
  getFilteredTokens: () => TokenData[]
  startRealTimeScanning: () => void
}
export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  tokens: [],
  isConnected: false,
  lastUpdate: 0,
  totalScanned: 0,
  updateTrigger: 0,
  setTokens: (tokens) => set((state) => ({ tokens, lastUpdate: Date.now(), updateTrigger: state.updateTrigger + 1 })),
  addToken: (token) => set((state) => {
    const newTokens = [...state.tokens.filter(t => t.address !== token.address), token]
    return { tokens: newTokens, lastUpdate: Date.now(), updateTrigger: state.updateTrigger + 1 }
  }),
  setConnected: (connected) => set({ isConnected: connected }),
  setTotalScanned: (count) => set((state) => ({ totalScanned: count, updateTrigger: state.updateTrigger + 1 })),
  getFilteredTokens: () => get().tokens.filter(token => token.priceChange24h >= 9 && token.priceChange24h <= 13),
  startRealTimeScanning: () => set({ isConnected: true })
}))
