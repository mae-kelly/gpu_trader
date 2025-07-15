export interface CoinData {
  id: string
  symbol: string
  name: string
  currentPrice: number
  percentChange: number
  momentumSlope: number
  marketCap: number
  tradingVolume: number
  honeypotStatus: 'safe' | 'unsafe' | 'unknown'
  chain: string
  contractAddress: string
  timeInRange: number
  chartData: ChartDataPoint[]
  liquidity: number
  holders: number
  isTrading: boolean
}
export interface ChartDataPoint {
  timestamp: number
  price: number
  volume: number
}
export interface Trade {
  id: string
  coinId: string
  symbol: string
  type: 'buy' | 'sell'
  amount: number
  price: number
  timestamp: number
  roi: number
  status: 'pending' | 'completed' | 'failed'
}
export interface WalletData {
  balance: number
  totalInvested: number
  totalProfit: number
  totalROI: number
  activePositions: number
  tradeHistory: Trade[]
  roiGraphData: ROIDataPoint[]
}
export interface ROIDataPoint {
  timestamp: number
  balance: number
  roi: number
}
export interface DashboardFilters {
  thresholdPercentage: [number, number]
  timeWindowMinutes: number
  selectedChains: string[]
  minimumVolume: number
  minimumLiquidity: number
  autoTradeEnabled: boolean
}
export interface MomentumMetrics {
  coinsInRange: number
  activeTrades: number
  pendingExits: number
  totalScanned: number
  lastUpdate: number
}
