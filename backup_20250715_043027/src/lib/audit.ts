import { prisma } from '@/lib/database'

export class AuditService {
  async logUserAction(
    userId: string | null,
    action: string,
    resource: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          details,
          ipAddress,
          userAgent
        }
      })
    } catch (error) {
      console.error('Audit logging failed:', error)
    }
  }

  async getUserAuditLog(userId: string, limit: number = 100) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit
    })
  }

  async getSecurityEvents(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    return prisma.auditLog.findMany({
      where: {
        timestamp: { gte: since },
        action: {
          in: ['LOGIN_FAILED', 'TRADE_ORDER_PLACED', 'API_KEY_CREATED', 'PASSWORD_CHANGED']
        }
      },
      orderBy: { timestamp: 'desc' }
    })
  }
}

export const auditService = new AuditService()
