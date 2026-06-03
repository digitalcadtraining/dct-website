require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in backend/.env");
  }

  const prisma = new PrismaClient({ log: ["error"] });
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count().catch(() => null);
    const courseCount = await prisma.course.count().catch(() => null);
    console.log("✅ Supabase/PostgreSQL connection OK");
    if (userCount !== null) console.log(`Users: ${userCount}`);
    if (courseCount !== null) console.log(`Courses: ${courseCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Database check failed:", err.message);
  process.exit(1);
});
