import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as schema from '../src/db/schema.js'

const adminUrl = process.env.DB_ADMIN_URL ?? 'postgres://hotel:hotel123@localhost:5432/postgres'
const testDbName = process.env.TEST_DB_NAME ?? 'hotel_manager_test'
const testDbUrl = process.env.TEST_DATABASE_URL ?? adminUrl.replace(/\/\w+$/, `/${testDbName}`)

export default async function globalSetup() {
  const admin = postgres(adminUrl, { max: 5 })

  const existing = await admin`SELECT 1 FROM pg_database WHERE datname = ${testDbName}`
  if (existing.length === 0) {
    await admin.unsafe(`CREATE DATABASE ${testDbName}`)
  }
  await admin.end()

  const client = postgres(testDbUrl, { max: 5 })
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: './drizzle' })

  await db.execute(`TRUNCATE users, rooms, guests, reservations, products, sales, invoices, expenses RESTART IDENTITY CASCADE`)

  const adminHash = await bcrypt.hash('Password123!', 10)
  const now = new Date().toISOString()
  await db.insert(schema.users).values({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Admin',
    email: 'admin@test.com',
    passwordHash: adminHash,
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  })

  await client.end()
}