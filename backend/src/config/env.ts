import { config } from 'dotenv'

config()

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://hotel:hotel123@localhost:5432/hotel_manager',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean),
}