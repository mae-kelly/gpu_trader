import WebSocket from 'ws'
import { dataAggregator } from './data-aggregator'
import { tokenRepository } from '@/lib/repositories/token.repository'

export class WebSocketService {
  private wss: WebSocket.Server | null = null
  private clients: Set<WebSocket> = new Set()
  private scanInterval: NodeJS.Timeout | null = null

  start(port: number = 8080) {
    this.wss = new WebSocket.Server({ port })
    
    this.wss.on('connection', (ws) => {
      console.log('Client connected. Total:', this.clients.size + 1)
      this.clients.add(ws)
      
      ws.on('close', () => {
        this.clients.delete(ws)
        console.log('Client disconnected. Total:', this.clients.size)
      })

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString())
          if (data.type === 'subscribe') {
            await this.sendLatestTokens(ws)
          }
        } catch (error) {
          console.error('WebSocket message error:', error)
        }
      })
    })

    this.startScanning()
    console.log(`WebSocket server running on port ${port}`)
  }

  private startScanning() {
    this.scanAndBroadcast()
    
    this.scanInterval = setInterval(() => {
      this.scanAndBroadcast()
    }, 10000)
  }

  private async scanAndBroadcast() {
    try {
      const tokens = await dataAggregator.fetchAllTokens()
      await dataAggregator.persistTokens(tokens)
      
      const dbTokens = await tokenRepository.findInMomentumRange()
      
      this.broadcast({
        type: 'token_update',
        data: dbTokens,
        timestamp: Date.now()
      })
      
      console.log(`Broadcasted ${dbTokens.length} tokens to ${this.clients.size} clients`)
    } catch (error) {
      console.error('Scan and broadcast error:', error)
    }
  }

  private async sendLatestTokens(ws: WebSocket) {
    try {
      const tokens = await tokenRepository.findInMomentumRange()
      ws.send(JSON.stringify({
        type: 'initial_data',
        data: tokens,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Send latest tokens error:', error)
    }
  }

  private broadcast(message: any) {
    const data = JSON.stringify(message)
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  }

  stop() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval)
    }
    
    if (this.wss) {
      this.wss.close()
    }
    
    this.clients.clear()
  }
}

export const websocketService = new WebSocketService()
