import { PrismaClient } from '@prisma/client'
import { existsSync, copyFileSync } from 'fs'
import { join } from 'path'

// On Vercel, only /tmp is writable. Copy the bundled seeded DB there on cold start.
function initDatabase() {
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    const tmpDb = '/tmp/dev.db'
    if (!existsSync(tmpDb)) {
      const sourceDb = join(process.cwd(), 'prisma', 'dev.db')
      if (existsSync(sourceDb)) {
        copyFileSync(sourceDb, tmpDb)
      }
    }
  }
}

initDatabase()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
