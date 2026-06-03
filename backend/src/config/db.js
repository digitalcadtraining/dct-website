/**
 * Prisma client singleton for DCT LMS.
 * Works with Supabase PostgreSQL.
 * Keeps one PrismaClient during local hot reload and avoids noisy query logs.
 */
const { PrismaClient } = require("@prisma/client");

const globalForPrisma = global;

function createPrismaClient() {
  const log = process.env.PRISMA_QUERY_LOG === "true"
    ? ["query", "error", "warn"]
    : ["error", "warn"];

  return new PrismaClient({ log });
}

const prisma = globalForPrisma.__dctPrisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__dctPrisma = prisma;
}

async function checkDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
  return true;
}

module.exports = { prisma, checkDatabaseConnection };
