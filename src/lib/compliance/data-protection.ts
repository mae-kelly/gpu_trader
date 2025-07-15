import { prisma } from '@/lib/database'
import { auditService } from '@/lib/audit'

export class DataProtectionService {
  async anonymizeUser(userId: string, reason: string): Promise<void> {
    await auditService.logUserAction(userId, 'DATA_ANONYMIZATION', 'user', { reason })
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `anonymized_${Date.now()}@deleted.local`,
        isActive: false,
        apiKeyHash: null
      }
    })

    await prisma.trade.updateMany({
      where: { userId },
      data: { userId: 'ANONYMIZED' }
    })

    await prisma.watchlistItem.deleteMany({
      where: { userId }
    })
  }

  async exportUserData(userId: string): Promise<any> {
    await auditService.logUserAction(userId, 'DATA_EXPORT', 'user')
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trades: true,
        watchlist: true,
        preferences: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      preferences: user.preferences,
      trades: user.trades.map(trade => ({
        id: trade.id,
        type: trade.type,
        amount: trade.amount,
        price: trade.price,
        createdAt: trade.createdAt,
        executedAt: trade.executedAt
      })),
      watchlist: user.watchlist,
      exportedAt: new Date().toISOString()
    }
  }

  async deleteUserData(userId: string, reason: string): Promise<void> {
    await auditService.logUserAction(userId, 'DATA_DELETION', 'user', { reason })
    
    await prisma.watchlistItem.deleteMany({ where: { userId } })
    await prisma.trade.deleteMany({ where: { userId } })
    await prisma.userPreferences.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
  }

  async getDataRetentionReport(): Promise<any> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

    const inactiveUsers = await prisma.user.count({
      where: {
        lastLogin: { lt: ninetyDaysAgo },
        isActive: true
      }
    })

    const oldTrades = await prisma.trade.count({
      where: { createdAt: { lt: oneYearAgo } }
    })

    const oldLogs = await prisma.auditLog.count({
      where: { timestamp: { lt: thirtyDaysAgo } }
    })

    return {
      inactiveUsers,
      oldTrades,
      oldLogs,
      recommendedActions: [
        inactiveUsers > 0 && 'Consider anonymizing inactive users',
        oldTrades > 1000 && 'Archive old trade data',
        oldLogs > 10000 && 'Clean up old audit logs'
      ].filter(Boolean)
    }
  }
}

export const dataProtectionService = new DataProtectionService()
