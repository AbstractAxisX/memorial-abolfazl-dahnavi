import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

// Always cache on globalThis — in production too! Without this, each request
// creates a new PrismaClient instance, causing memory leaks and crashes.
globalForPrisma.prisma = db
