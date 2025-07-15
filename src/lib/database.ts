import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

declare global {
  var __prisma: PrismaClient | undefined
  var __redis: Redis | undefined
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

export const redis = globalThis.__redis || new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
  globalThis.__redis = redis
}

export async function connectDatabase() {
  try {
    await prisma.$connect()
    await redis.ping()
    console.log('✅ Database connections established')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect()
  await redis.quit()
}

process.on('beforeExit', async () => {
  await disconnectDatabase()
})
