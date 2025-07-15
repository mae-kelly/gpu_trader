import { NextRequest, NextResponse } from 'next/server'
import { validateBody, schemas } from '@/lib/validation/schemas'
import { securityHeaders } from '@/lib/security/headers'
import { authService } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const validation = await validateBody(schemas.userRegister)(req)
  if (validation) return validation

  try {
    const { email, password } = (req as any).validatedBody
    
    // Check if user already exists
    const existingUser = await authService.findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({
        error: 'User already exists'
      }, { status: 409 })
    }

    // Create user
    const user = await authService.createUser(email, password)

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
    console.error('Registration error:', error)
    return NextResponse.json({
      error: 'Registration failed'
    }, { status: 500 })
  }
}
