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
  totalScanned: number
  getFilteredTokens: () => TokenData[]
  startRealTimeScanning: () => void
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  tokens: [],
  isConnected: false,
  totalScanned: 0,

  getFilteredTokens: () => {
    return get().tokens.filter(token => 
      token.priceChange24h >= 9 && token.priceChange24h <= 13
    );
  },

  startRealTimeScanning: () => {
    try {
      const ws = new WebSocket('ws://localhost:8080');
      
      ws.onopen = () => {
        console.log('🔥 FORCE GPU CONNECTED');
        set({ isConnected: true });
        ws.send(JSON.stringify({ type: 'subscribe' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'update' && data.tokens) {
            set({ 
              tokens: data.tokens,
              totalScanned: data.totalScanned || 0
            });
          }
        } catch (error) {}
      };

      ws.onclose = () => {
        set({ isConnected: false });
        setTimeout(() => get().startRealTimeScanning(), 3000);
      };
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  }
}));
