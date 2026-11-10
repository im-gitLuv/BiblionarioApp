import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import WebSocket from 'ws'

neonConfig.webSocketConstructor = WebSocket

const databaseUrl = process.env.DATABASE_URL
const adapter = databaseUrl && new URL(databaseUrl).hostname.endsWith('.neon.tech')
  ? new PrismaNeon({ connectionString: databaseUrl })
  : undefined

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
