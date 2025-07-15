import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex')
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex')

interface User {
  id: string
  email: string
  passwordHash: string
  role: 'user' | 'admin'
  isActive: boolean
  apiKeyHash?: string
  createdAt: Date
  lastLogin?: Date
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

  generateApiKey(): string {
    return 'gpuswarm_' + crypto.randomBytes(32).toString('hex')
  }

  async hashApiKey(apiKey: string): Promise<string> {
    return crypto.createHash('sha256').update(apiKey).digest('hex')
  }

  async createUser(email: string, password: string, role: 'user' | 'admin' = 'user'): Promise<User> {
    const id = crypto.randomUUID()
    const passwordHash = await this.hashPassword(password)
    const user: User = {
      id,
      email,
      passwordHash,
      role,
      isActive: true,
      createdAt: new Date()
    }
    this.users.set(id, user)
    return user
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email)
    if (!user || !user.isActive) return null
    
    const isValid = await this.verifyPassword(password, user.passwordHash)
    if (!isValid) return null
    
    user.lastLogin = new Date()
    return user
  }

  getUser(id: string): User | null {
    return this.users.get(id) || null
  }
}

export const authService = new AuthService()
