#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(process.argv[2] || process.cwd());

function target(relativePath) {
  return path.join(projectRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(target(relativePath), "utf8");
}

function write(relativePath, content) {
  const filePath = target(relativePath);
  const backup = `${filePath}.certificate-backup-${Date.now()}`;

  fs.copyFileSync(filePath, backup);
  fs.writeFileSync(filePath, content, "utf8");

  console.log(`Updated: ${relativePath}`);
  console.log(`Backup:  ${path.relative(projectRoot, backup)}`);
}

function patchPackageJson() {
  const relativePath = "backend/package.json";
  const pkg = JSON.parse(read(relativePath));

  pkg.dependencies = pkg.dependencies || {};

  if (!pkg.dependencies.sharp) {
    pkg.dependencies.sharp = "^0.34.3";
  }

  write(relativePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function patchSchema() {
  const relativePath = "backend/prisma/schema.prisma";
  let text = read(relativePath);

  if (!text.includes("certificate CourseCertificate?")) {
    const marker = "  installments EnrollmentInstallment[]";

    if (!text.includes(marker)) {
      throw new Error("Enrollment installments marker not found in schema.prisma");
    }

    text = text.replace(
      marker,
      `${marker}
  certificate  CourseCertificate?`,
    );
  }

  if (!text.includes("model CourseCertificate")) {
    const marker = "model ReferralReward {";

    if (!text.includes(marker)) {
      throw new Error("ReferralReward marker not found in schema.prisma");
    }

    const model = `model CourseCertificate {
  id                 String     @id @default(cuid())
  enrollment_id      String     @unique
  enrollment         Enrollment @relation(fields: [enrollment_id], references: [id], onDelete: Cascade)

  certificate_number String     @unique
  course_code        String
  issue_year         Int
  sequence           Int

  student_name       String
  course_name        String
  batch_name         String
  batch_start_date   DateTime
  batch_end_date     DateTime

  issued_at           DateTime   @default(now())
  issued_by_id        String?
  is_active           Boolean    @default(true)

  created_at          DateTime   @default(now())
  updated_at          DateTime   @updatedAt

  @@unique([course_code, issue_year, sequence])
  @@index([enrollment_id])
  @@index([certificate_number])
  @@index([is_active])
  @@map("course_certificates")
}

`;

    text = text.replace(marker, `${model}${marker}`);
  }

  write(relativePath, text);
}

function patchRoutesIndex() {
  const relativePath = "backend/src/routes/index.js";
  let text = read(relativePath);

  if (!text.includes('router.use("/certificates"')) {
    const marker =
      'router.use("/installments", require("./installment.routes"));';

    if (!text.includes(marker)) {
      throw new Error("Installment route marker not found.");
    }

    text = text.replace(
      marker,
      `${marker}
router.use("/certificates", require("./certificate.routes"));`,
    );
  }

  write(relativePath, text);
}

function patchAdminRoutes() {
  const relativePath = "backend/src/routes/admin.routes.js";
  let text = read(relativePath);

  if (!text.includes('require("../controllers/certificate.controller")')) {
    const marker = 'const admin = require("../controllers/admin.controller");';

    if (!text.includes(marker)) {
      throw new Error("Admin controller import marker not found.");
    }

    text = text.replace(
      marker,
      `${marker}
const certificate = require("../controllers/certificate.controller");`,
    );
  }

  if (!text.includes("/certificates/enrollments/:enrollmentId/issue")) {
    const marker = 'router.get("/tutors", admin.listTutors);';

    if (!text.includes(marker)) {
      throw new Error("Admin tutors route marker not found.");
    }

    text = text.replace(
      marker,
      `router.post(
  "/certificates/enrollments/:enrollmentId/issue",
  certificate.issueCertificate,
);
router.patch(
  "/certificates/enrollments/:enrollmentId/revoke",
  certificate.revokeCertificate,
);

${marker}`,
    );
  }

  write(relativePath, text);
}

function patchMyCourses() {
  const relativePath = "frontend/src/pages/student/MyCourses.jsx";
  let text = read(relativePath);

  if (!text.includes('CertificateCard from "../../components/certificate/CertificateCard.jsx"')) {
    const marker =
      'import { batchApi, installmentApi } from "../../services/api.js";';

    if (!text.includes(marker)) {
      throw new Error("MyCourses API import marker not found.");
    }

    text = text.replace(
      marker,
      `${marker}
import { certificateApi } from "../../services/certificateApi.js";
import CertificateCard from "../../components/certificate/CertificateCard.jsx";`,
    );
  }

  if (!text.includes("function mergeCertificateData")) {
    const marker = "export default function MyCourses() {";

    if (!text.includes(marker)) {
      throw new Error("MyCourses component marker not found.");
    }

    const helper = `function mergeCertificateData(enrollments, certificates) {
  const certificateMap = new Map(
    (certificates || []).map((certificate) => [
      certificate.enrollment_id,
      certificate,
    ]),
  );

  return (enrollments || []).map((enrollment) => ({
    ...enrollment,
    certificate: certificateMap.get(enrollmentKey(enrollment)) || null,
  }));
}

`;

    text = text.replace(marker, `${helper}${marker}`);
  }

  text = text.replace(
    `const [courseRes, paymentRes] = await Promise.all([
        batchApi.enrolled(),
        installmentApi.mine(),
      ]);`,
    `const [courseRes, paymentRes, certificateRes] = await Promise.all([
        batchApi.enrolled(),
        installmentApi.mine(),
        certificateApi.mine(),
      ]);`,
  );

  text = text.replace(
    `setEnrollments(
        mergePaymentData(courseRes?.data || [], paymentRes?.data || []),
      );`,
    `setEnrollments(
        mergeCertificateData(
          mergePaymentData(courseRes?.data || [], paymentRes?.data || []),
          certificateRes?.data || [],
        ),
      );`,
  );

  const oldGrid = `gridTemplateColumns: "repeat(auto-fit,minmax(260px,320px))",`;
  const newGrid = `gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,560px),1fr))",`;

  const gridPosition = text.lastIndexOf(oldGrid);

  if (gridPosition >= 0) {
    text =
      text.slice(0, gridPosition) +
      newGrid +
      text.slice(gridPosition + oldGrid.length);
  }

  const oldMap = `{enrollments.map((enrollment, index) => (
              <CourseCard
                key={enrollmentKey(enrollment) || index}
                enrollment={enrollment}
                index={index}
                onReceipt={openReceipt}
              />
            ))}`;

  const newMap = `{enrollments.map((enrollment, index) => (
              <div
                key={enrollmentKey(enrollment) || index}
                className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(280px,1fr)]"
              >
                <CourseCard
                  enrollment={enrollment}
                  index={index}
                  onReceipt={openReceipt}
                />

                <CertificateCard certificate={enrollment.certificate} />
              </div>
            ))}`;

  if (!text.includes(oldMap)) {
    throw new Error("MyCourses enrollment card map marker not found.");
  }

  text = text.replace(oldMap, newMap);

  write(relativePath, text);
}

function patchAdminStudents() {
  const relativePath = "frontend/src/pages/admin/AdminStudents.jsx";
  let text = read(relativePath);

  if (!text.includes('certificateApi } from "../../services/certificateApi.js"')) {
    const marker = 'import { adminApi } from "../../services/api.js";';

    if (!text.includes(marker)) {
      throw new Error("AdminStudents API import marker not found.");
    }

    text = text.replace(
      marker,
      `${marker}
import { certificateApi } from "../../services/certificateApi.js";`,
    );
  }

  if (!text.includes("const issueCertificate = async")) {
    const marker = "  const toggle = async (id) => {";

    if (!text.includes(marker)) {
      throw new Error("AdminStudents toggle marker not found.");
    }

    const handler = `  const issueCertificate = async (enrollment) => {
    try {
      setError("");

      const response = await certificateApi.issue(enrollment.id);
      const number = response?.data?.certificate_number || "Generated";

      window.alert(\`Certificate issued successfully.\\nCertificate No: \${number}\`);
    } catch (err) {
      setError(err.message || "Could not issue certificate.");
    }
  };

`;

    text = text.replace(marker, `${handler}${marker}`);
  }

  const powerBlock = `                        <button
                          type="button"
                          onClick={() => onToggle(student.id)}
                          className="ml-2 rounded-lg border border-gray-200 p-2"
                          title="Enable or disable student"
                        >
                          <Power size={13} />
                        </button>`;

  if (!text.includes("Issue Certificate")) {
    if (!text.includes(powerBlock)) {
      throw new Error("AdminStudents account power button marker not found.");
    }

    text = text.replace(
      powerBlock,
      `${powerBlock}

                        <button
                          type="button"
                          onClick={() => onIssueCertificate(enrollment)}
                          className="mt-2 block rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-black text-amber-800"
                        >
                          Issue Certificate
                        </button>`,
    );
  }

  text = text.replace(
    `  onEditEmi,
  savingPaymentId,`,
    `  onEditEmi,
  onIssueCertificate,
  savingPaymentId,`,
  );

  text = text.replace(
    `                onEditEmi={setEmiTarget}
                savingPaymentId={savingPaymentId}`,
    `                onEditEmi={setEmiTarget}
                onIssueCertificate={issueCertificate}
                savingPaymentId={savingPaymentId}`,
  );

  write(relativePath, text);
}

patchPackageJson();
patchSchema();
patchRoutesIndex();
patchAdminRoutes();
patchMyCourses();
patchAdminStudents();

console.log("\nCertificate feature patches applied.");
console.log("Copy the new files from this ZIP before running the patcher.");
