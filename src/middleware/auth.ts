import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface User {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
}

export function withAuth(handler: (req: NextRequest, user: User) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const authHeader = req.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
      }

      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
      
      const user: User = {
        id: decoded.userId,
        email: decoded.email || 'unknown',
        role: decoded.role || 'USER'
      }

      return handler(req, user)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }
}
