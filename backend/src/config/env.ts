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

function ttlToSeconds(ttl: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(ttl.trim())
  if (!match) return 900
  const value = Number(match[1])
  const unit = match[2] ?? 's'
  const multiplier = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400
  return value * multiplier
}

function parseTrustProxy(value: string | undefined): boolean | string[] {
  if (!value) return false
  if (value === 'true') return true
  if (value === 'false') return false
  return value.split(',').map((entry) => entry.trim()).filter(Boolean)
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3001),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  databaseUrl,
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
}

export const jwtAccessTtlSeconds = ttlToSeconds(env.jwtExpiresIn)
export const jwtRefreshTtlSeconds = ttlToSeconds(env.jwtRefreshExpiresIn)

export function isRegistrationAllowed(): boolean {
  const flag = process.env.ALLOW_REGISTRATION
  if (flag !== undefined) return flag === 'true' || flag === '1'
  return nodeEnv !== 'production'
}
