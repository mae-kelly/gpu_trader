import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// Initialize Prisma client
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Redis client (simple implementation for now)
class SimpleCache {
  private cache = new Map<string, { value: any; expires: number }>()

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    return item.value
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async ping(): Promise<string> {
    return 'PONG'
  }
}

export const redis = new SimpleCache()

export async function connectDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect()
}

process.on('beforeExit', async () => {
  await disconnectDatabase()
})
