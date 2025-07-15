import { TokenData } from './data-sources/dex-aggregator'
export interface RealtimeUpdate {
  type: 'price' | 'volume' | 'liquidity' | 'new_token'
  tokenAddress: string
  chain: string
  data: Partial<TokenData>
  timestamp: number
}
export class RealtimeService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Array<(update: RealtimeUpdate) => void> = []
  private isConnected = false
  connect(): void {
    if (typeof window === 'undefined') return
    try {
      this.ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'wss://api.dexscreener.com/updates')
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.subscribeToUpdates()
      }
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.isConnected = false
        this.attemptReconnect()
      }
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.attemptReconnect()
    }
  }
  private subscribeToUpdates(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    const subscription = {
      type: 'subscribe',
      channels: ['pairs', 'tokens'],
      filters: {
        priceChangeMin: 9,
        priceChangeMax: 13,
        chains: ['ethereum', 'bsc', 'arbitrum', 'polygon', 'solana']
      }
    }
    this.ws.send(JSON.stringify(subscription))
  }
  private handleMessage(data: any): void {
    if (data.type === 'update' && data.pair) {
      const pair = data.pair
      const change = parseFloat(pair.priceChange?.h24 || '0')
      if (change >= 9 && change <= 13) {
        const update: RealtimeUpdate = {
          type: 'price',
          tokenAddress: pair.baseToken?.address || '',
          chain: pair.chainId || '',
          data: {
            price: parseFloat(pair.priceUsd || '0'),
            priceChange24h: change,
            volume24h: parseFloat(pair.volume?.h24 || '0'),
            liquidity: parseFloat(pair.liquidity?.usd || '0'),
            lastUpdate: Date.now()
          },
          timestamp: Date.now()
        }
        this.notifyListeners(update)
      }
    }
  }
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)
    setTimeout(() => {
      this.connect()
    }, delay)
  }
  addListener(listener: (update: RealtimeUpdate) => void): void {
    this.listeners.push(listener)
  }
  removeListener(listener: (update: RealtimeUpdate) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener)
  }
  private notifyListeners(update: RealtimeUpdate): void {
    this.listeners.forEach(listener => {
      try {
        listener(update)
      } catch (error) {
        console.error('Listener error:', error)
      }
    })
  }
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }
  getConnectionStatus(): boolean {
    return this.isConnected
  }
}
export const realtimeService = new RealtimeService()
