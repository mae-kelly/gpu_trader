import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createRateLimit } from './rate-limit'

interface User {
  id: string
  email: string
  role: string
}

const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // limit each IP to 50 auth requests per windowMs
})

export async function authenticateToken(request: NextRequest) {
  // Apply rate limiting first
  const rateLimitResult = await authRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json({ error: 'Access token required' }, { status: 401 })
  }
  
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
    const decoded = jwt.verify(token, secret) as { userId: string; email: string; role: string }
    
    // Add user info to request headers for the API route
    const response = NextResponse.next()
    response.headers.set('x-user-id', decoded.userId || '')
    response.headers.set('x-user-email', decoded.email || '')
    response.headers.set('x-user-role', decoded.role || 'user')
    
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 })
  }
}

// Helper function to extract user from request headers (for use in API routes)
export function getUserFromRequest(request: NextRequest): User | null {
  const userId = request.headers.get('x-user-id')
  const email = request.headers.get('x-user-email')
  const role = request.headers.get('x-user-role')
  
  if (!userId || !email) {
    return null
  }
  
  return { id: userId, email, role: role || 'user' }
}
