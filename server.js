const { realTimeServer } = require('./dist/lib/realtime/websocket-server.js')

const PORT = process.env.WS_PORT || 3001

console.log('Starting Real-Time Crypto Scanner Server...')
realTimeServer.start(PORT)

process.on('SIGINT', () => {
  console.log('Shutting down server...')
  realTimeServer.stop()
  process.exit(0)
})
