import { Server } from 'ws'
import { NextApiRequest, NextApiResponse } from 'next'
import { DexAggregator } from '../../src/lib/data-sources/dex-aggregator'

const wss = new Server({ port: 3001 })
const dexAggregator = new DexAggregator()

let clients: Set<any> = new Set()

wss.on('connection', (ws) => {
  clients.add(ws)
  console.log('Client connected. Total clients:', clients.size)

  ws.on('close', () => {
    clients.delete(ws)
    console.log('Client disconnected. Total clients:', clients.size)
  })

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      if (data.type === 'subscribe') {
        console.log('Client subscribed to updates')
      }
    } catch (error) {
      console.error('Invalid message format:', error)
    }
  })
})

const broadcastUpdate = (data: any) => {
  const message = JSON.stringify(data)
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message)
    }
  })
}

setInterval(async () => {
  try {
    const tokens = await dexAggregator.fetchAllTokens()
    tokens.forEach(token => {
      broadcastUpdate({
        type: 'update',
        pair: {
          baseToken: {
            address: token.address,
            symbol: token.symbol,
            name: token.name
          },
          priceUsd: token.price.toString(),
          priceChange: {
            h24: token.priceChange24h.toString()
          },
          volume: {
            h24: token.volume24h.toString()
          },
          liquidity: {
            usd: token.liquidity.toString()
          },
          chainId: token.chain
        }
      })
    })
  } catch (error) {
    console.error('Failed to fetch and broadcast updates:', error)
  }
}, 5000)

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'WebSocket server running on port 3001' })
}
