import { useEffect, useRef, useState } from 'react'

interface ServerMessage {
  type: 'tokens' | 'acceleration' | 'honeypot' | 'error' | 'pong'
  data: any
  timestamp: number
}

export function useRealTimeData() {
  const [tokens, setTokens] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  
  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    
    try {
      const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001')
      wsRef.current = ws
      
      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
        console.log('WebSocket connected')
        
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          } else {
            clearInterval(pingInterval)
          }
        }, 30000)
      }
      
      ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data)
          
          switch (message.type) {
            case 'tokens':
              setTokens(message.data)
              setLastUpdate(message.timestamp)
              break
            case 'error':
              setError(message.data)
              break
            case 'pong':
              break
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }
      
      ws.onclose = () => {
        setIsConnected(false)
        console.log('WebSocket disconnected')
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 5000)
      }
      
      ws.onerror = () => {
        setError('WebSocket connection error')
        setIsConnected(false)
      }
      
    } catch (err) {
      setError('Failed to create WebSocket connection')
      setIsConnected(false)
    }
  }
  
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
  }
  
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [])
  
  return {
    tokens,
    isConnected,
    error,
    lastUpdate,
    connect,
    disconnect
  }
}
