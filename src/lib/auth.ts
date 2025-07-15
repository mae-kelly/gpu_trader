import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production'

interface User {
  id: string
  email: string
  passwordHash: string
  role: 'USER' | 'ADMIN'
  isActive: boolean
}

export class AuthService {
  private users: Map<string, User> = new Map()

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '7d' })
    return { accessToken, refreshToken }
  }

  verifyToken(token: string, type: 'access' | 'refresh' = 'access') {
    const secret = type === 'access' ? JWT_SECRET : JWT_REFRESH_SECRET
    return jwt.verify(token, secret) as { userId: string; type: string }
  }

  async createUser(email: string, password: string, role: 'USER' | 'ADMIN' = 'USER'): Promise<User> {
    const id = crypto.randomUUID()
    const passwordHash = await this.hashPassword(password)
    const user: User = {
      id,
      email,
      passwordHash,
      role,
      isActive: true
    }
    this.users.set(id, user)
    return user
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email)
    if (!user || !user.isActive) return null
    
    const isValid = await this.verifyPassword(password, user.passwordHash)
    if (!isValid) return null
    
    return user
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.email === email) || null
  }

  generateApiKey(): string {
    return 'gst_' + crypto.randomBytes(32).toString('hex')
  }
}

export const authService = new AuthService()

// Create default admin user
authService.createUser('admin@gpuswarm.com', 'ChangeThisPassword123!', 'ADMIN')
