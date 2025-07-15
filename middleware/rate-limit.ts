import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/database'
import jwt from 'jsonwebtoken'

export function rateLimit(requests: number = 100, windowMs: number = 60000) {
  return async (req: NextRequest) => {
    try {
      const identifier = getIdentifier(req)
      const key = `ratelimit:${identifier}`
      
      const current = await redis.incr(key)
      
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000))
      }
      
      if (current > requests) {
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
    } catch (error) {
      console.error('Rate limiting error:', error)
      return null // Allow request if rate limiting fails
    }
  }
}

function getIdentifier(req: NextRequest): string {
  // Try to get user ID from token first
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    try {
      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      return `user:${decoded.userId}`
    } catch {}
  }
  
  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
  return `ip:${ip}`
}
