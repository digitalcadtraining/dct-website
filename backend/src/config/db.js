/**
 * Prisma client singleton
 * Re-uses the same instance in development (avoids too-many-connections on hot reload)
 */

const { PrismaClient } = require("@prisma/client");

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };
