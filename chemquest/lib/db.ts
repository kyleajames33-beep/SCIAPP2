import { PrismaClient } from '@prisma/client'
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
  
  console.log('[DB] Environment check:', {
    isVercel,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  })
  
  if (!isVercel) {
    // Local development - use the configured DATABASE_URL
    const localUrl = process.env.DATABASE_URL || 'file:./data/app.db'
    console.log('[DB] Local environment, using:', localUrl)
    return localUrl
  }

  // On Vercel, we need to use /tmp directory
  const tmpDbPath = '/tmp/chemquest.db'
  
  // Check if database already exists in /tmp (from a previous invocation in the same instance)
  if (!globalForPrisma.dbInitialized) {
    console.log('[DB] Vercel environment detected, checking /tmp database...')
    
    // Check if file exists and is a valid SQLite database
    let needsInit = true
    if (fs.existsSync(tmpDbPath)) {
      const stats = fs.statSync(tmpDbPath)
      // SQLite files start with a specific header - valid files are > 100 bytes typically
      if (stats.size >= 100) {
        console.log('[DB] Found existing database in /tmp, size:', stats.size)
        needsInit = false
      } else {
        // File exists but is empty or corrupted - delete it
        console.log('[DB] Found invalid/empty database file, removing...')
        try {
          fs.unlinkSync(tmpDbPath)
        } catch (e) {
          console.log('[DB] Could not remove invalid file:', e)
        }
      }
    }
    
    if (needsInit) {
      console.log('[DB] Initializing fresh database in /tmp...')
      
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
            const sourceStats = fs.statSync(sourcePath)
            if (sourceStats.size >= 100) {
              console.log(`[DB] Copying database from ${sourcePath} to ${tmpDbPath}`)
              fs.copyFileSync(sourcePath, tmpDbPath)
              copied = true
              break
            }
          }
        }
        
        if (!copied) {
          // No source database - Prisma will create tables via db-init.ts
          // DO NOT create an empty file - let SQLite create it properly
          console.log('[DB] No source database found - will initialize schema on first request')
        }
      } catch (error) {
        console.error('[DB] Error during database initialization:', error)
        // Don't create empty file - let the error propagate
      }
    }
    
    globalForPrisma.dbInitialized = true
  }
  
  return `file:${tmpDbPath}`
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const databaseUrl = getVercelSafeDatabaseUrl()
    console.log(`[DB] Creating Prisma client with URL: ${databaseUrl}`)
    
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
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
