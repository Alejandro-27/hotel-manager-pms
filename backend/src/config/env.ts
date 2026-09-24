import { config } from 'dotenv'

config()

const nodeEnv = process.env.NODE_ENV ?? 'development'
const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-me'
const databaseUrl = process.env.DATABASE_URL ?? 'postgres://hotel:hotel123@localhost:5432/hotel_manager'

if (nodeEnv === 'production') {
  if (jwtSecret === 'dev-secret-change-me') {
    throw new Error('JWT_SECRET debe configurarse explícitamente en producción')
  }
  if (databaseUrl === 'postgres://hotel:hotel123@localhost:5432/hotel_manager') {
    throw new Error('DATABASE_URL debe configurarse explícitamente en producción')
  }
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3001),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  databaseUrl,
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean),
}