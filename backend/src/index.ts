import { buildApp } from './app.js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from './db/index.js'
import { env } from './config/env.js'

async function main() {
  await migrate(db, { migrationsFolder: './drizzle' })

  const app = buildApp()

  app.listen({ port: env.port, host: '0.0.0.0' }, (err) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
  })
}

main().catch((err) => {
  console.error('Fallo al iniciar el servidor', err)
  process.exit(1)
})
