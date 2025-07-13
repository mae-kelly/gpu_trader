const { gpuScanner } = require('../src/lib/gpu-scanner.js')

console.log('🚀 FREE GPU Scanner starting...')
console.log('📡 Using only free APIs - no rate limits!')

process.on('SIGINT', () => {
  console.log('🛑 Shutting down GPU scanner...')
  gpuScanner.stop()
  process.exit(0)
})
