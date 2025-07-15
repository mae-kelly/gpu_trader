'use client'
import { useEffect, useState, useRef } from 'react'

export interface WebSocketMessage {
  type: string
  data: any
}

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      ws.current = new WebSocket(url)
      
      ws.current.onopen = () => setIsConnected(true)
      ws.current.onclose = () => setIsConnected(false)
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          setLastMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      return () => {
        ws.current?.close()
      }
    }
  }, [url])

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    }
  }

  return { isConnected, lastMessage, sendMessage }
}
