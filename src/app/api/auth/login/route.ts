import { NextRequest, NextResponse } from 'next/server'
import { validateBody, schemas } from '@/lib/validation/schemas'
import { securityHeaders } from '@/lib/security/headers'
import { rateLimit } from '@/lib/security/rate-limit'
import { authService } from '@/lib/auth'

export async function POST(req: NextRequest) {
  // Apply strict rate limiting for login attempts
  const rateLimitResponse = await rateLimit(5, 60000)(req) // 5 attempts per minute
  if (rateLimitResponse) return rateLimitResponse

  const validation = await validateBody(schemas.userLogin)(req)
  if (validation) return validation

  try {
    const { email, password } = (req as any).validatedBody
    
    const user = await authService.authenticate(email, password)
    if (!user) {
      return NextResponse.json({
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens(user.id)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    })

    return securityHeaders(response)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({
      error: 'Login failed'
    }, { status: 500 })
  }
}
