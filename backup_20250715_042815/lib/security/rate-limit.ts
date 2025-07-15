import { NextRequest, NextResponse } from 'next/server'

interface RateLimitInfo {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits = new Map<string, RateLimitInfo>()

  async checkLimit(identifier: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const now = Date.now()
    const limit = this.limits.get(identifier)

    if (!limit || now - limit.resetTime > windowMs) {
      this.limits.set(identifier, { count: 1, resetTime: now })
      return true
    }

    if (limit.count >= maxRequests) {
      return false
    }

    limit.count++
    return true
  }

  cleanup() {
    const now = Date.now()
    for (const [key, limit] of this.limits.entries()) {
      if (now - limit.resetTime > 300000) { // 5 minutes
        this.limits.delete(key)
      }
    }
  }
}

const rateLimiter = new RateLimiter()

// Cleanup old entries every minute
setInterval(() => rateLimiter.cleanup(), 60000)

export function rateLimit(requests: number = 100, windowMs: number = 60000) {
  return async (req: NextRequest) => {
    const identifier = getIdentifier(req)
    const allowed = await rateLimiter.checkLimit(identifier, requests, windowMs)
    
    if (!allowed) {
      return NextResponse.json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + windowMs).toString()
        }
      })
    }
    
    return null
  }
}

function getIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
  return `ip:${ip}`
}
