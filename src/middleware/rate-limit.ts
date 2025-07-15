import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Simple in-memory store for rate limiting
const rateLimitStore: Record<string, RateLimitEntry> = {}

export function createRateLimit({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100, // limit each IP to 100 requests per windowMs
}: {
  windowMs?: number
  max?: number
} = {}) {
  return async (request: NextRequest) => {
    const identifier = request.ip || 'anonymous'
    const key = `ratelimit:${identifier}`
    const now = Date.now()
    
    // Clean up expired entries
    if (rateLimitStore[key] && rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
    
    // Initialize or increment
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs
      }
    } else {
      rateLimitStore[key].count++
    }
    
    const current = rateLimitStore[key].count
    const resetTime = rateLimitStore[key].resetTime
    
    if (current > max) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
          }
        }
      )
    }
    
    return null // Allow request to continue
  }
}
