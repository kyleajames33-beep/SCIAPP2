import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitialized: boolean | undefined
}

/**
 * On Vercel, the filesystem is read-only except for /tmp.
 * We need to:
 * 1. Copy the database to /tmp on cold starts
 * 2. Use the /tmp path for DATABASE_URL
 * 
 * NOTE: Data in /tmp is EPHEMERAL and will be lost on cold starts.
 * For production, use a proper cloud database (PostgreSQL on Neon/Supabase).
 */
function getVercelSafeDatabaseUrl(): string {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined
  
  if (!isVercel) {
    // Local development - use the configured DATABASE_URL
    return process.env.DATABASE_URL || 'file:./data/app.db'
  }

  // On Vercel, we need to use /tmp directory
  const tmpDbPath = '/tmp/chemquest.db'
  
  // Check if database already exists in /tmp (from a previous invocation in the same instance)
  if (!globalForPrisma.dbInitialized && !fs.existsSync(tmpDbPath)) {
    console.log('[DB] Vercel environment detected, initializing database in /tmp...')
    
    try {
      // Try to copy the bundled database if it exists
      const possibleSourcePaths = [
        path.join(process.cwd(), 'data', 'app.db'),
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), '.next', 'server', 'data', 'app.db'),
      ]
      
      let copied = false
      for (const sourcePath of possibleSourcePaths) {
        if (fs.existsSync(sourcePath)) {
          console.log(`[DB] Copying database from ${sourcePath} to ${tmpDbPath}`)
          fs.copyFileSync(sourcePath, tmpDbPath)
          copied = true
          break
        }
      }
      
      if (!copied) {
        console.log('[DB] No existing database found, creating fresh database...')
        // Create the database using prisma db push
        // This will create the tables based on the schema
        try {
          execSync(`DATABASE_URL="file:${tmpDbPath}" npx prisma db push --accept-data-loss --skip-generate 2>&1`, {
            timeout: 30000,
            encoding: 'utf-8',
          })
          console.log('[DB] Fresh database created successfully')
        } catch (pushError) {
          // If prisma db push fails, create an empty file and let Prisma handle it
          console.log('[DB] Prisma db push failed, creating empty database file')
          fs.writeFileSync(tmpDbPath, '')
        }
      }
      
      globalForPrisma.dbInitialized = true
    } catch (error) {
      console.error('[DB] Error initializing database:', error)
      // Create empty file as fallback
      fs.writeFileSync(tmpDbPath, '')
      globalForPrisma.dbInitialized = true
    }
  }
  
  return `file:${tmpDbPath}`
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const databaseUrl = getVercelSafeDatabaseUrl()
    console.log(`[DB] Initializing Prisma with database URL: ${databaseUrl.substring(0, 50)}...`)
    
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
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
