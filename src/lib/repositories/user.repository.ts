import { prisma } from '@/lib/database'

export class UserRepository {
  async create(data: {
    email: string
    passwordHash: string
    role?: 'USER' | 'ADMIN'
  }) {
    return prisma.user.create({
      data: {
        ...data,
        preferences: {
          create: {}
        }
      },
      include: {
        preferences: true
      }
    })
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        preferences: true
      }
    })
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true
      }
    })
  }

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() }
    })
  }

  async setApiKey(id: string, apiKeyHash: string) {
    return prisma.user.update({
      where: { id },
      data: { apiKeyHash }
    })
  }

  async findByApiKey(apiKeyHash: string) {
    return prisma.user.findFirst({
      where: { apiKeyHash, isActive: true }
    })
  }
}

export const userRepository = new UserRepository()
