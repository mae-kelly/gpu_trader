import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { rateLimit } from './rate-limit'
import { authService } from '../auth'

interface User {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
}

export function withAuth(handler: (req: NextRequest, user: User) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      // Apply rate limiting first
      const rateLimitResult = await rateLimit(100, 60000)(req)
      if (rateLimitResult) return rateLimitResult

      // Extract token from Authorization header
      const authHeader = req.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
      }

      const token = authHeader.substring(7)
      
      // Verify JWT token
      const decoded = authService.verifyToken(token)
      
      // Get user from service
      const user = await authService.findUserById(decoded.userId)
      if (!user || !user.isActive) {
        return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
      }

      // Call the actual handler with authenticated user
      return handler(req, user)
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }
}
