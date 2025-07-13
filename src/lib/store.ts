import { create } from 'zustand'
import { DashboardFilters, WalletData, CoinData, MomentumMetrics } from '@/types'

interface DashboardStore {
  filters: DashboardFilters
  wallet: WalletData
  coins: CoinData[]
  metrics: MomentumMetrics
  isLoading: boolean
  error: string | null
  
  setFilters: (filters: Partial<DashboardFilters>) => void
  setWallet: (wallet: Partial<WalletData>) => void
  setCoins: (coins: CoinData[]) => void
  setMetrics: (metrics: Partial<MomentumMetrics>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialFilters: DashboardFilters = {
  thresholdPercentage: [9, 13],
  timeWindowMinutes: 15,
  selectedChains: ['ETH', 'BSC', 'ARB'],
  minimumVolume: 10000,
  minimumLiquidity: 50000,
  autoTradeEnabled: false
}

const initialWallet: WalletData = {
  balance: 15.47,
  totalInvested: 10,
  totalProfit: 5.47,
  totalROI: 54.7,
  activePositions: 3,
  tradeHistory: [],
  roiGraphData: Array.from({ length: 12 }, (_, i) => ({
    timestamp: Date.now() - (11 - i) * 3600000,
    balance: 10 + Math.random() * 10,
    roi: Math.random() * 100
  }))
}

const initialMetrics: MomentumMetrics = {
  coinsInRange: 23,
  activeTrades: 7,
  pendingExits: 2,
  totalScanned: 15847,
  lastUpdate: Date.now()
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  filters: initialFilters,
  wallet: initialWallet,
  coins: [],
  metrics: initialMetrics,
  isLoading: false,
  error: null,

  setFilters: (newFilters) => {
    try {
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
        error: null
      }))
    } catch (error) {
      console.error('Error setting filters:', error)
      set({ error: 'Failed to update filters' })
    }
  },

  setWallet: (newWallet) => {
    try {
      set((state) => ({
        wallet: { ...state.wallet, ...newWallet },
        error: null
      }))
    } catch (error) {
      console.error('Error setting wallet:', error)
      set({ error: 'Failed to update wallet' })
    }
  },

  setCoins: (coins) => {
    try {
      set({ coins, error: null })
    } catch (error) {
      console.error('Error setting coins:', error)
      set({ error: 'Failed to update coins' })
    }
  },

  setMetrics: (newMetrics) => {
    try {
      set((state) => ({
        metrics: { ...state.metrics, ...newMetrics },
        error: null
      }))
    } catch (error) {
      console.error('Error setting metrics:', error)
      set({ error: 'Failed to update metrics' })
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set({
    filters: initialFilters,
    wallet: initialWallet,
    coins: [],
    metrics: initialMetrics,
    isLoading: false,
    error: null
  })
}))
