import { WebSocketServer, WebSocket } from 'ws'
import { dataFetcher } from './data-fetcher'
import { accelerationCalculator } from './acceleration'
import cron from 'node-cron'

interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping'
  data?: any
}

interface ServerMessage {
  type: 'tokens' | 'acceleration' | 'honeypot' | 'error' | 'pong'
  data: any
  timestamp: number
}

class RealTimeServer {
  private wss: WebSocketServer | null = null
  private clients = new Set<WebSocket>()
  private isRunning = false
  
  start(port: number = 3001) {
    if (this.isRunning) return
    
    this.wss = new WebSocketServer({ port })
    this.isRunning = true
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws)
      
      ws.on('message', (data) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString())
          this.handleClientMessage(ws, message)
        } catch (error) {
          this.sendError(ws, 'Invalid message format')
        }
      })
      
      ws.on('close', () => {
        this.clients.delete(ws)
      })
      
      ws.on('error', () => {
        this.clients.delete(ws)
      })
    })
    
    this.startDataCollection()
    console.log(`WebSocket server running on port ${port}`)
  }
  
  private handleClientMessage(ws: WebSocket, message: ClientMessage) {
    switch (message.type) {
      case 'ping':
        this.send(ws, { type: 'pong', data: null, timestamp: Date.now() })
        break
      case 'subscribe':
        break
      case 'unsubscribe':
        break
    }
  }
  
  private startDataCollection() {
    cron.schedule('*/5 * * * * *', async () => {
      await this.collectAndBroadcastData()
    })
  }
  
  private async collectAndBroadcastData() {
    try {
      const tokens = await dataFetcher.getAllTokens()
      
      const enrichedTokens = await Promise.all(tokens.map(async (token) => {
        const acceleration = accelerationCalculator.addPricePoint(token.id, token.current_price)
        const momentumScore = accelerationCalculator.getMomentumScore(token.id)
        
        let honeypotStatus = 'unknown'
        if (token.contract_address) {
          const honeypotResult = await dataFetcher.checkHoneypot(token.contract_address)
          if (honeypotResult) {
            honeypotStatus = honeypotResult.honeypotResult.isHoneypot ? 'unsafe' : 'safe'
          }
        }
        
        return {
          ...token,
          acceleration,
          momentumScore,
          honeypotStatus,
          timestamp: Date.now()
        }
      }))
      
      this.broadcast({
        type: 'tokens',
        data: enrichedTokens,
        timestamp: Date.now()
      })
      
    } catch (error) {
      console.error('Data collection error:', error)
      this.broadcast({
        type: 'error',
        data: 'Failed to collect token data',
        timestamp: Date.now()
      })
    }
  }
  
  private broadcast(message: ServerMessage) {
    const data = JSON.stringify(message)
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  }
  
  private send(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }
  
  private sendError(ws: WebSocket, error: string) {
    this.send(ws, {
      type: 'error',
      data: error,
      timestamp: Date.now()
    })
  }
  
  stop() {
    if (this.wss) {
      this.wss.close()
      this.isRunning = false
    }
  }
}

export const realTimeServer = new RealTimeServer()
