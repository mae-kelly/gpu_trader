import { prisma } from '@/lib/database'

export class UserRepository {
  async create(data: {
    email: string
    passwordHash: string
    role?: 'USER' | 'ADMIN'
  }) {
    return prisma.user.create({
      data
    })
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    })
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id }
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
