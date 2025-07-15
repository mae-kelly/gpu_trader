import Joi from 'joi'
import { NextResponse } from 'next/server'

export const schemas = {
  userRegister: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase, uppercase, number, and special character'
      }),
    confirmPassword: Joi.ref('password')
  }),

  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  tradeOrder: Joi.object({
    symbol: Joi.string().alphanum().min(2).max(10).required(),
    side: Joi.string().valid('buy', 'sell').required(),
    quantity: Joi.number().positive().max(1000000).required(),
    orderType: Joi.string().valid('market', 'limit', 'stop').required(),
    price: Joi.number().positive().when('orderType', {
      is: Joi.valid('limit', 'stop'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    timeInForce: Joi.string().valid('day', 'gtc', 'ioc', 'fok').default('day')
  }),

  tokenQuery: Joi.object({
    address: Joi.string().pattern(new RegExp('^0x[a-fA-F0-9]{40}$')).required(),
    chain: Joi.string().valid('ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism').required()
  })
}

export function validateBody(schema: Joi.ObjectSchema) {
  return async (req: any) => {
    try {
      const body = await req.json()
      const { error, value } = schema.validate(body, { abortEarly: false })
      
      if (error) {
        return NextResponse.json({
          error: 'Validation failed',
          details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
        }, { status: 400 })
      }
      
      req.validatedBody = value
      return null
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
  }
}
