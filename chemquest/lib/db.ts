// PRISMA DISABLED - Using Supabase instead
// import { PrismaClient } from '@prisma/client'
// import * as fs from 'fs'
// import * as path from 'path'

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
//   dbInitialized: boolean | undefined
// }

// function getVercelSafeDatabaseUrl(): string {
//   ... old prisma code ...
// }

// function getPrismaClient(): PrismaClient {
//   ... old prisma code ...
// }

// export const prisma = new Proxy({} as PrismaClient, {
//   get(_target, prop) {
//     const client = getPrismaClient()
//     const value = (client as any)[prop]
//     return typeof value === 'function' ? value.bind(client) : value
//   }
// })

// Placeholder export to prevent import errors
export const prisma = {} as any
