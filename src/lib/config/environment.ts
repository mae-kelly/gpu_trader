import Joi from 'joi'

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(64).required(),
  JWT_REFRESH_SECRET: Joi.string().min(64).required(),
  API_ENCRYPTION_KEY: Joi.string().length(32).required(),
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
  RATE_LIMIT_REQUESTS_PER_MINUTE: Joi.number().default(100),
  RATE_LIMIT_BURST: Joi.number().default(20),
  WEBHOOK_SECRET: Joi.string().min(32).required(),
  SENTRY_DSN: Joi.string().uri().optional(),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info')
}).unknown()

const { error, value: env } = envSchema.validate(process.env)

if (error) {
  throw new Error(`Environment validation error: ${error.message}`)
}

export const config = {
  NODE_ENV: env.NODE_ENV,
  DATABASE_URL: env.DATABASE_URL,
  REDIS_URL: env.REDIS_URL,
  JWT_SECRET: env.JWT_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  API_ENCRYPTION_KEY: env.API_ENCRYPTION_KEY,
  ALLOWED_ORIGINS: env.ALLOWED_ORIGINS.split(','),
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: env.RATE_LIMIT_REQUESTS_PER_MINUTE,
    BURST: env.RATE_LIMIT_BURST
  },
  WEBHOOK_SECRET: env.WEBHOOK_SECRET,
  SENTRY_DSN: env.SENTRY_DSN,
  LOG_LEVEL: env.LOG_LEVEL,
  IS_PRODUCTION: env.NODE_ENV === 'production'
}
