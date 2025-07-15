import { prisma } from '@/lib/database'

export class TokenRepository {
  async upsert(data: {
    address: string
    chain: string
    symbol: string
    name: string
    price: number
    priceChange24h: number
    volume24h: number
    liquidity: number
    marketCap: number
    isHoneypot?: boolean
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN'
  }) {
    return prisma.token.upsert({
      where: {
        address_chain: {
          address: data.address,
          chain: data.chain
        }
      },
      update: {
        price: data.price,
        priceChange24h: data.priceChange24h,
        volume24h: data.volume24h,
        liquidity: data.liquidity,
        marketCap: data.marketCap,
        lastUpdate: new Date()
      },
      create: data
    })
  }

  async findInMomentumRange(min: number = 9, max: number = 13) {
    return prisma.token.findMany({
      where: {
        priceChange24h: {
          gte: min,
          lte: max
        },
        lastUpdate: {
          gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      },
      orderBy: { priceChange24h: 'desc' },
      take: 100
    })
  }

  async addPriceHistory(tokenId: string, price: number, volume: number) {
    await prisma.priceHistory.create({
      data: {
        tokenId,
        price,
        volume
      }
    })

    await prisma.priceHistory.deleteMany({
      where: {
        tokenId,
        timestamp: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
  }

  async findByAddress(address: string, chain: string) {
    return prisma.token.findUnique({
      where: {
        address_chain: { address, chain }
      },
      include: {
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 50
        },
        analysis: {
          orderBy: { analysisTimestamp: 'desc' },
          take: 1
        }
      }
    })
  }
}

export const tokenRepository = new TokenRepository()
