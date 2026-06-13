const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

async function getBatchOwner() {
  const tutor = await prisma.user.findFirst({ where: { role: "TUTOR", is_active: true }, orderBy: { created_at: "asc" }, select: { id: true } });
  if (tutor) return tutor;
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", is_active: true }, orderBy: { created_at: "asc" }, select: { id: true } });
  if (admin) return admin;
  throw new Error("No active TUTOR or ADMIN found. Create one tutor/admin first.");
}

async function main() {
  const owner = await getBatchOwner();

  const course = await prisma.course.upsert({
    where: { slug: "cad-software-tools" },
    update: {
      name: "CAD Software Tools Training",
      short_name: "CAD Tools",
      description: "Software training package for CATIA V5, UG NX and SolidWorks. Pricing: 1 course ₹10000, 2 courses ₹14000, 3 courses ₹15000.",
      duration_months: 1,
      price: 10000,
      overview_points: ["CATIA V5 software training", "UG NX software training", "SolidWorks software training", "Live day and practice day learning", "Online / Offline Pune-Nigdi / Hybrid options"],
      tools_covered: ["CATIA V5", "UG NX", "SolidWorks"],
      is_active: true,
    },
    create: {
      name: "CAD Software Tools Training",
      slug: "cad-software-tools",
      short_name: "CAD Tools",
      description: "Software training package for CATIA V5, UG NX and SolidWorks. Pricing: 1 course ₹10000, 2 courses ₹14000, 3 courses ₹15000.",
      duration_months: 1,
      price: 10000,
      overview_points: ["CATIA V5 software training", "UG NX software training", "SolidWorks software training", "Live day and practice day learning", "Online / Offline Pune-Nigdi / Hybrid options"],
      tools_covered: ["CATIA V5", "UG NX", "SolidWorks"],
      is_active: true,
    },
  });

  const batches = [
    { name: "CATIA V5 Basic - 11 AM Batch", time_slots: ["11:00 AM - 12:00 PM"] },
    { name: "UG NX Basic - 12 PM Batch", time_slots: ["12:00 PM - 1:00 PM"] },
    { name: "SolidWorks Basic - 1 PM Batch", time_slots: ["1:00 PM - 2:00 PM"] },
  ];

  for (const item of batches) {
    const existing = await prisma.batch.findFirst({
      where: { course_id: course.id, name: item.name, status: { in: ["UPCOMING", "ACTIVE"] } },
    });

    if (!existing) {
      await prisma.batch.create({
        data: {
          course_id: course.id,
          tutor_id: owner.id,
          name: item.name,
          start_date: new Date("2026-07-05T10:00:00+05:30"),
          end_date: new Date("2026-08-05T10:00:00+05:30"),
          max_students: 50,
          description: "CAD software tools training batch. Live session one day, next day practice task.",
          zoom_link: "",
          time_slots: item.time_slots,
          status: "UPCOMING",
        },
      });
    }
  }

  console.log("CAD Software Tools course and batches are ready.");
}

main().catch((err) => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
