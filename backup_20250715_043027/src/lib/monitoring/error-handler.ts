import { logError } from './logger'
import { metricsCollector } from './metrics'

export class ErrorHandler {
  static async handleError(error: Error, context: {
    userId?: string
    endpoint?: string
    action?: string
    metadata?: any
  }) {
    logError(error, context)
    
    await metricsCollector.recordError(
      error.name || 'UnknownError',
      context.endpoint || context.action || 'unknown'
    )

    if (process.env.SENTRY_DSN) {
      const Sentry = await import('@sentry/nextjs')
      Sentry.captureException(error, {
        user: context.userId ? { id: context.userId } : undefined,
        tags: {
          endpoint: context.endpoint,
          action: context.action
        },
        extra: context.metadata
      })
    }
  }

  static wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: { action: string }
  ) {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args)
      } catch (error) {
        await this.handleError(error as Error, {
          action: context?.action || fn.name
        })
        throw error
      }
    }
  }
}

export const handleError = ErrorHandler.handleError
export const wrapAsync = ErrorHandler.wrapAsync
