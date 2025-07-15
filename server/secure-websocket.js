const WebSocket = require('ws')

class SecureWebSocketServer {
  constructor() {
    this.clients = new Map()
  }

  start(port = 8080) {
    console.log('🚀 Starting WebSocket server...')
    
    this.wss = new WebSocket.Server({ port })

    this.wss.on('connection', this.handleConnection.bind(this))
    console.log(`🔒 WebSocket server running on port ${port}`)
  }

  handleConnection(ws, req) {
    const clientId = Math.random().toString(36).substr(2, 9)
    console.log(`🔗 Client connected: ${clientId}`)
    
    this.clients.set(ws, { 
      id: clientId, 
      connectedAt: Date.now()
    })

    ws.on('close', () => {
      this.clients.delete(ws)
      console.log(`🔌 Client disconnected: ${clientId}`)
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error.message)
      this.clients.delete(ws)
    })

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connection established',
      clientId,
      timestamp: Date.now()
    }))
  }

  stop() {
    console.log('🛑 Stopping WebSocket server...')
    if (this.wss) {
      this.wss.close()
    }
    this.clients.clear()
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
