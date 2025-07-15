const WebSocket = require('ws')
const https = require('https')
const fs = require('fs')
const path = require('path')

class SecureWebSocketServer {
  constructor(port = 8080) {
    this.port = port
    this.wss = null
  }

  start() {
    console.log('🚀 Starting WebSocket server...')
    
    // Create WebSocket server directly on the port
    this.wss = new WebSocket.Server({ 
      port: this.port,
      perMessageDeflate: false
    })

    this.wss.on('connection', (ws, request) => {
      console.log('🔗 New WebSocket connection from:', request.socket.remoteAddress)
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString())
          console.log('📨 Received:', data)
          
          // Echo back for now
          ws.send(JSON.stringify({
            type: 'response',
            data: data,
            timestamp: new Date().toISOString()
          }))
        } catch (error) {
          console.error('❌ Error processing message:', error)
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }))
        }
      })

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed')
      })

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error)
      })

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to secure WebSocket server',
        timestamp: new Date().toISOString()
      }))
    })

    this.wss.on('error', (error) => {
      console.error('❌ WebSocket server error:', error)
    })

    console.log(`🔒 WebSocket server running on port ${this.port}`)
  }

  stop() {
    if (this.wss) {
      this.wss.close()
      console.log('🛑 WebSocket server stopped')
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new SecureWebSocketServer(8080)
  server.start()

  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully')
    server.stop()
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully')
    server.stop()
    process.exit(0)
  })
}

module.exports = SecureWebSocketServer
