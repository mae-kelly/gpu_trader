export interface CryptoPrice {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  lastUpdated: string
}

export interface OrderBookEntry {
  price: number
  quantity: number
  total: number
}

export interface OrderBook {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  lastUpdateId: number
}

export interface Trade {
  id: string
  symbol: string
  price: number
  quantity: number
  side: 'buy' | 'sell'
  timestamp: number
}

export interface Portfolio {
  totalValue: number
  assets: PortfolioAsset[]
  performance24h: number
}

export interface PortfolioAsset {
  symbol: string
  quantity: number
  averagePrice: number
  currentPrice: number
  value: number
  pnl: number
  pnlPercentage: number
}
