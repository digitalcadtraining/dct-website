/**
 * Database Seed
 * Run: npm run db:seed
 * Creates: admin account, 2 DCT courses
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ── Create Admin Account ────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    || "admin@digitalcadtraining.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@DCT2025";
  const adminName     = process.env.ADMIN_NAME     || "Super Admin";
  const adminPhone    = process.env.ADMIN_PHONE    || "9999999999";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const password_hash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: adminName, email: adminEmail,
        phone: adminPhone, password_hash,
        role: "ADMIN", is_verified: true, is_active: true,
      },
    });
    console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`);
  }

  // ── Create Courses ──────────────────────────────────────
  const courses = [
    {
      name: "Plastic Product Design",
      slug: "plastic-product-design",
      short_name: "PPD",
      description: "Master CATIA V5 surfacing, mould design, and plastic part manufacturing from scratch to industry standard. Learn real skills used at Tier-1 automotive and consumer product companies.",
      duration_months: 4,
      price: 18000,
      overview_points: [
        "CATIA V5 from basics to advanced surfacing",
        "Complete mould design workflow",
        "Real industry plastic part projects",
        "GD&T and drawing standards",
        "Placement preparation and support",
      ],
      tools_covered: ["CATIA V5", "CATIA Surfacing", "CATIA Mould Design", "AutoCAD (basics)"],
    },
    {
      name: "BIW Product Design",
      slug: "biw-product-design",
      short_name: "BIW",
      description: "Learn Body-in-White design for automotive, including structural analysis, welding design, and CATIA BIW tools used at Tier-1 companies like Tata, Mahindra, and L&T.",
      duration_months: 4,
      price: 18000,
      overview_points: [
        "Body-in-White (BIW) fundamentals",
        "Automotive structural design concepts",
        "Weld joint design and analysis",
        "CATIA BIW tools mastery",
        "Industry project: full BIW assembly",
        "Placement at automotive companies",
      ],
      tools_covered: ["CATIA V5", "CATIA BIW Workbench", "CATIA Assembly Design", "CATIA DMU"],
    },
  ];

  for (const courseData of courses) {
    const exists = await prisma.course.findUnique({ where: { slug: courseData.slug } });
    if (!exists) {
      await prisma.course.create({ data: courseData });
      console.log(`✅ Course created: ${courseData.name}`);
    } else {
      console.log(`ℹ️  Course already exists: ${courseData.name}`);
    }
  }

  console.log("\n✅ Seed complete!");
  console.log("─────────────────────────────────────────");
  console.log(`Admin Login:`);
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log("─────────────────────────────────────────\n");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
