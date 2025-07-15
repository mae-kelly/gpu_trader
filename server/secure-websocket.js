const WebSocket = require('ws')
const jwt = require('jsonwebtoken')
const https = require('https')
const fs = require('fs')

class SecureWebSocketServer {
  constructor() {
    this.clients = new Map()
    this.messageCount = new Map()
  }

  start(port = 8080) {
    console.log('🚀 Starting secure WebSocket server...')
    
    const serverOptions = { port }
    
    // Use HTTPS in production if certificates exist
    if (process.env.NODE_ENV === 'production' && 
        process.env.SSL_CERT_PATH && 
        fs.existsSync(process.env.SSL_CERT_PATH)) {
      serverOptions.server = https.createServer({
        cert: fs.readFileSync(process.env.SSL_CERT_PATH),
        key: fs.readFileSync(process.env.SSL_KEY_PATH)
      })
      console.log('🔒 Using HTTPS for WebSocket server')
    }

    this.wss = new WebSocket.Server({
      ...serverOptions,
      verifyClient: this.verifyClient.bind(this)
    })

    this.wss.on('connection', this.handleConnection.bind(this))
    this.startCleanup()
    console.log(`🔒 Secure WebSocket server running on port ${port}`)
  }

  verifyClient(info) {
    try {
      // In development, allow connections without token for testing
      if (process.env.NODE_ENV === 'development') {
        return true
      }

      const url = new URL(info.req.url, 'ws://localhost')
      const token = url.searchParams.get('token')
      
      if (!token) {
        console.log('WebSocket connection rejected: No token provided')
        return false
      }

      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-in-production')
      return true
    } catch (error) {
      console.log('WebSocket connection rejected: Invalid token')
      return false
    }
  }

  handleConnection(ws, req) {
    const clientId = Math.random().toString(36).substr(2, 9)
    console.log(`🔗 Client connected: ${clientId}`)
    
    this.clients.set(ws, { 
      id: clientId, 
      lastActivity: Date.now(),
      connectedAt: Date.now()
    })
    
    this.messageCount.set(ws, { count: 0, resetTime: Date.now() })

    ws.on('message', (message) => {
      if (this.rateLimitMessage(ws)) {
        this.handleMessage(ws, message)
      } else {
        console.log(`Rate limit exceeded for client ${clientId}`)
        ws.close(1008, 'Rate limit exceeded')
      }
    })

    ws.on('close', () => {
      this.clients.delete(ws)
      this.messageCount.delete(ws)
      console.log(`🔌 Client disconnected: ${clientId}`)
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error.message)
      this.clients.delete(ws)
      this.messageCount.delete(ws)
    })

    // Send welcome message
    this.sendMessage(ws, {
      type: 'connected',
      message: 'Secure connection established',
      clientId,
      timestamp: Date.now()
    })
  }

  rateLimitMessage(ws) {
    const now = Date.now()
    const limit = this.messageCount.get(ws)
    
    if (now - limit.resetTime > 60000) {
      limit.count = 0
      limit.resetTime = now
    }
    
    limit.count++
    return limit.count <= 60 // 60 messages per minute
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message)
      const client = this.clients.get(ws)
      
      if (!client) return

      client.lastActivity = Date.now()

      switch (data.type) {
        case 'subscribe':
          this.handleSubscription(ws, data)
          break
        case 'ping':
          this.sendMessage(ws, { 
            type: 'pong', 
            timestamp: Date.now() 
          })
          break
        default:
          console.log('Unknown message type:', data.type)
      }
    } catch (error) {
      console.error('Message handling error:', error)
    }
  }

  handleSubscription(ws, data) {
    console.log('Client subscribed to updates:', data.channels || 'all')
    this.sendMessage(ws, {
      type: 'subscription_confirmed',
      channels: data.channels || ['all'],
      timestamp: Date.now()
    })
  }

  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  broadcast(message, filter = null) {
    const data = JSON.stringify(message)
    let sentCount = 0
    
    this.clients.forEach((client, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        if (!filter || filter(client)) {
          ws.send(data)
          sentCount++
        }
      }
    })
    
    console.log(`📡 Broadcast sent to ${sentCount} clients`)
  }

  startCleanup() {
    setInterval(() => {
      const now = Date.now()
      const timeout = 5 * 60 * 1000 // 5 minutes

      this.clients.forEach((client, ws) => {
        if (now - client.lastActivity > timeout) {
          console.log(`Cleaning up inactive client: ${client.id}`)
          ws.terminate()
          this.clients.delete(ws)
          this.messageCount.delete(ws)
        }
      })
    }, 60000) // Check every minute
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  }

  stop() {
    console.log('🛑 Stopping WebSocket server...')
    if (this.wss) {
      this.wss.close()
    }
    this.clients.clear()
    this.messageCount.clear()
  }
}

module.exports = { SecureWebSocketServer }

// Start server if run directly
if (require.main === module) {
  const server = new SecureWebSocketServer()
  server.start(process.env.WS_PORT || 8080)
  
  // Graceful shutdown
  process.on('SIGTERM', () => server.stop())
  process.on('SIGINT', () => server.stop())
}
