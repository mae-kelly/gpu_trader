import { CoinData, WalletData, MomentumMetrics } from '@/types'

// Simulated network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchMomentumCoins(filters: any): Promise<CoinData[]> {
  try {
    await delay(300)
    
    const mockData: CoinData[] = [
      {
        id: '1',
        symbol: 'PEPE',
        name: 'Pepe',
        currentPrice: 0.000001234,
        percentChange: 11.5,
        momentumSlope: 2.3,
        marketCap: 5200000,
        tradingVolume: 1200000,
        honeypotStatus: 'safe',
        chain: 'ETH',
        contractAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
        timeInRange: 8,
        chartData: Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (23 - i) * 3600000,
          price: 0.000001234 * (1 + Math.random() * 0.2 - 0.1),
          volume: 50000 + Math.random() * 100000
        })),
        liquidity: 850000,
        holders: 12543,
        isTrading: false
      },
      {
        id: '2',
        symbol: 'SHIB',
        name: 'Shiba Inu',
        currentPrice: 0.00000876,
        percentChange: 9.8,
        momentumSlope: 1.7,
        marketCap: 8400000,
        tradingVolume: 2100000,
        honeypotStatus: 'safe',
        chain: 'ETH',
        contractAddress: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
        timeInRange: 12,
        chartData: Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (23 - i) * 3600000,
          price: 0.00000876 * (1 + Math.random() * 0.15 - 0.075),
          volume: 80000 + Math.random() * 150000
        })),
        liquidity: 1200000,
        holders: 25847,
        isTrading: true
      },
      {
        id: '3',
        symbol: 'DOGE',
        name: 'Dogecoin',
        currentPrice: 0.087,
        percentChange: 12.3,
        momentumSlope: 3.1,
        marketCap: 12500000,
        tradingVolume: 3200000,
        honeypotStatus: 'safe',
        chain: 'BSC',
        contractAddress: '0xba2ae424d960c26247dd6c32edc70b295c744c43',
        timeInRange: 5,
        chartData: Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (23 - i) * 3600000,
          price: 0.087 * (1 + Math.random() * 0.25 - 0.125),
          volume: 120000 + Math.random() * 200000
        })),
        liquidity: 2100000,
        holders: 45231,
        isTrading: false
      }
    ]

    // Filter based on threshold
    const filtered = mockData.filter(coin => 
      coin.percentChange >= filters.thresholdPercentage[0] && 
      coin.percentChange <= filters.thresholdPercentage[1]
    )

    return filtered
  } catch (error) {
    console.error('Error fetching momentum coins:', error)
    throw new Error('Failed to fetch momentum coins')
  }
}

export async function fetchWalletData(): Promise<WalletData> {
  try {
    await delay(200)
    
    return {
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
  } catch (error) {
    console.error('Error fetching wallet data:', error)
    throw new Error('Failed to fetch wallet data')
  }
}

export async function fetchMomentumMetrics(): Promise<MomentumMetrics> {
  try {
    await delay(100)
    
    // Simulate changing metrics
    const baseScanned = 15000
    const variation = Math.floor(Math.random() * 2000)
    
    return {
      coinsInRange: 20 + Math.floor(Math.random() * 10),
      activeTrades: 5 + Math.floor(Math.random() * 8),
      pendingExits: Math.floor(Math.random() * 5),
      totalScanned: baseScanned + variation,
      lastUpdate: Date.now()
    }
  } catch (error) {
    console.error('Error fetching momentum metrics:', error)
    throw new Error('Failed to fetch momentum metrics')
  }
}

export async function executeTrade(coinId: string, type: 'buy' | 'sell', amount: number) {
  try {
    await delay(1000)
    
    // Simulate trade execution
    return {
      id: Math.random().toString(36).substr(2, 9),
      coinId,
      symbol: 'PEPE',
      type,
      amount,
      price: 0.000001234,
      timestamp: Date.now(),
      roi: type === 'sell' ? Math.random() * 20 - 5 : 0,
      status: 'completed' as const
    }
  } catch (error) {
    console.error('Error executing trade:', error)
    throw new Error('Failed to execute trade')
  }
}
