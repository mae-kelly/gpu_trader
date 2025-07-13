import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

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
  updateCount: number
  startRealTimeScanning: () => void
  getFilteredTokens: () => TokenData[]
}

export const useRealtimeStore = create<RealtimeState>()(
  subscribeWithSelector((set, get) => ({
    tokens: [],
    isConnected: false,
    lastUpdate: 0,
    updateCount: 0,

    startRealTimeScanning: () => {
      console.log('🔗 Starting TRUE REAL-TIME WebSocket...')
      
      const connectWebSocket = () => {
        try {
          const ws = new WebSocket('ws://localhost:8080')
          
          ws.onopen = () => {
            console.log('✅ REAL-TIME WebSocket connected!')
            set({ isConnected: true })
          }

          ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data)
              
              if (message.type === 'realtime_update' && message.data) {
                const now = Date.now()
                
                set(state => ({ 
                  tokens: [...message.data],
                  lastUpdate: now,
                  updateCount: state.updateCount + 1
                }))
                
                // Log only every 10th update to avoid spam
                if (get().updateCount % 10 === 0) {
                  console.log(`⚡ LIVE UPDATE #${get().updateCount}: ${message.data.length} tokens`)
                }
              }
            } catch (error) {
              console.error('❌ Parse error:', error)
            }
          }

          ws.onclose = () => {
            console.log('🔌 REAL-TIME WebSocket closed, reconnecting...')
            set({ isConnected: false })
            setTimeout(connectWebSocket, 1000)
          }

          ws.onerror = (error) => {
            console.error('❌ REAL-TIME WebSocket error:', error)
          }
          
        } catch (error) {
          console.error('❌ Failed to connect:', error)
          setTimeout(connectWebSocket, 1000)
        }
      }

      connectWebSocket()
    },

    getFilteredTokens: () => {
      const tokens = get().tokens
      return tokens.filter(token => 
        token.priceChange24h >= 9 && token.priceChange24h <= 13
      ).sort((a, b) => b.priceChange24h - a.priceChange24h)
    }
  }))
)
