import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db, client } from './index.js'

await migrate(db, { migrationsFolder: './drizzle' })
console.log('Migrations applied')
await client.end()