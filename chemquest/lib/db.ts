import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitialized: boolean | undefined
}

function getVercelSafeDatabaseUrl(): string {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined

  if (!isVercel) {
    return process.env.DATABASE_URL || 'file:./prisma/dev.db'
  }

  // On Vercel, only /tmp is writable
  const tmpDbPath = '/tmp/chemquest.db'

  if (!globalForPrisma.dbInitialized) {
    let needsInit = true
    if (fs.existsSync(tmpDbPath)) {
      const stats = fs.statSync(tmpDbPath)
      if (stats.size >= 100) {
        needsInit = false
      } else {
        try { fs.unlinkSync(tmpDbPath) } catch { /* ignore */ }
      }
    }

    if (needsInit) {
      const possibleSourcePaths = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'data', 'app.db'),
      ]

      for (const sourcePath of possibleSourcePaths) {
        if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).size >= 100) {
          fs.copyFileSync(sourcePath, tmpDbPath)
          break
        }
      }
    }

    globalForPrisma.dbInitialized = true
  }

  return `file:${tmpDbPath}`
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const databaseUrl = getVercelSafeDatabaseUrl()
    globalForPrisma.prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    })
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})
