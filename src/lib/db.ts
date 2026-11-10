import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Adapter pg (TCP): estable en Node runtime (Vercel incluido). Evita el driver
// serverless de Neon, cuyo WebSocket se corrompe al ser empaquetado por webpack
// ("b.mask is not a function" → Connection terminated unexpectedly).
const databaseUrl = process.env.DATABASE_URL ?? ''
const isPostgres =
  databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')

// Sin adapter: Prisma usa el engine nativo del schema (p. ej. SQLite en tests/CI).
const adapter = isPostgres
  ? new PrismaPg({ connectionString: databaseUrl, max: 5 })
  : null

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
