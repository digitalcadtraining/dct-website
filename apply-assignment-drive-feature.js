#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const packageRoot = __dirname;
const projectRoot = path.resolve(process.argv[2] || process.cwd());
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  projectRoot,
  `.dct-assignment-backup-${stamp}`,
);

const replacementFiles = [
  "backend/src/services/googleDrive.service.js",
  "backend/src/controllers/session.controller.js",
  "backend/src/routes/assignment.routes.js",
  "frontend/src/pages/student/AssignmentsPages.jsx",
  "frontend/src/pages/tutor/TutorAssignments.jsx",
  "backend/prisma/migrations/20260711170000_assignment_google_drive/migration.sql",
];

function fail(message) {
  console.error(`\nERROR: ${message}\n`);
  process.exit(1);
}

function read(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) fail(`Missing project file: ${relativePath}`);
  return fs.readFileSync(fullPath, "utf8");
}

function backup(relativePath) {
  const source = path.join(projectRoot, relativePath);
  if (!fs.existsSync(source)) return;
  const target = path.join(backupRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function write(relativePath, content) {
  const fullPath = path.join(projectRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`Updated: ${relativePath}`);
}

function replaceOnce(content, search, replacement, label) {
  const count = content.split(search).length - 1;
  if (count !== 1) {
    fail(
      `${label}: expected one exact match, found ${count}. ` +
        "Your repo may have changed after this package was prepared. " +
        "No unsafe replacement was performed.",
    );
  }
  return content.replace(search, replacement);
}

const requiredProjectFiles = [
  "backend/prisma/schema.prisma",
  "backend/src/controllers/batch.controller.js",
  "frontend/src/services/api.js",
  "backend/src/controllers/session.controller.js",
  "backend/src/routes/assignment.routes.js",
  "frontend/src/pages/student/AssignmentsPages.jsx",
  "frontend/src/pages/tutor/TutorAssignments.jsx",
];

requiredProjectFiles.forEach((file) => {
  if (!fs.existsSync(path.join(projectRoot, file))) {
    fail(`This does not look like the DCT project. Missing: ${file}`);
  }
});

fs.mkdirSync(backupRoot, { recursive: true });
[
  ...requiredProjectFiles,
  "backend/prisma/schema.prisma",
  "backend/src/controllers/batch.controller.js",
  "frontend/src/services/api.js",
].forEach(backup);

for (const relativePath of replacementFiles) {
  const source = path.join(packageRoot, relativePath);
  if (!fs.existsSync(source)) fail(`Package file missing: ${relativePath}`);
  const target = path.join(projectRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`Copied: ${relativePath}`);
}

// Prisma schema: replace only the two assignment models.
{
  let content = read("backend/prisma/schema.prisma");

  const assignmentModel = `model Assignment {
  id          String            @id @default(cuid())
  batch_id    String
  batch       Batch             @relation(fields: [batch_id], references: [id])
  session_id  String?
  session     ScheduledSession? @relation(fields: [session_id], references: [id])
  title       String
  description String?
  file_url    String?
  due_date    DateTime?
  created_at  DateTime          @default(now())

  submissions AssignmentSubmission[]

  @@index([batch_id])
  @@index([session_id])
  @@index([due_date])
  @@map("assignments")
}`;

  const newAssignmentModel = `model Assignment {
  id                String            @id @default(cuid())
  batch_id          String
  batch             Batch             @relation(fields: [batch_id], references: [id])
  session_id        String?
  session           ScheduledSession? @relation(fields: [session_id], references: [id])
  title             String
  description       String?
  file_url          String?
  storage_provider  String            @default("LOCAL")
  drive_file_id     String?
  original_filename String?
  file_mime_type    String?
  file_size         Int?
  due_date          DateTime?
  created_at        DateTime          @default(now())

  submissions AssignmentSubmission[]

  @@index([batch_id])
  @@index([session_id])
  @@index([due_date])
  @@index([drive_file_id])
  @@map("assignments")
}`;

  const submissionModel = `model AssignmentSubmission {
  id            String           @id @default(cuid())
  assignment_id String
  assignment    Assignment       @relation(fields: [assignment_id], references: [id])
  student_id    String
  student       User             @relation(fields: [student_id], references: [id])
  file_url      String
  submitted_at  DateTime         @default(now())
  status        SubmissionStatus @default(SUBMITTED)
  grade         String?
  feedback      String?
  reviewed_at   DateTime?

  @@unique([assignment_id, student_id])
  @@index([assignment_id])
  @@index([student_id])
  @@index([status])
  @@index([submitted_at])
  @@map("assignment_submissions")
}`;

  const newSubmissionModel = `model AssignmentSubmission {
  id                 String           @id @default(cuid())
  assignment_id      String
  assignment         Assignment       @relation(fields: [assignment_id], references: [id])
  student_id         String
  student            User             @relation(fields: [student_id], references: [id])
  file_url           String
  storage_provider   String           @default("LOCAL")
  drive_file_id      String?
  original_filename  String?
  file_mime_type     String?
  file_size          Int?
  first_submitted_at DateTime?
  submitted_at       DateTime         @default(now())
  editable_until     DateTime?
  locked_at          DateTime?
  replacement_count  Int              @default(0)
  status             SubmissionStatus @default(SUBMITTED)
  grade              String?
  feedback           String?
  reviewed_at        DateTime?

  @@unique([assignment_id, student_id])
  @@index([assignment_id])
  @@index([student_id])
  @@index([status])
  @@index([submitted_at])
  @@index([editable_until])
  @@index([drive_file_id])
  @@map("assignment_submissions")
}`;

  content = replaceOnce(
    content,
    assignmentModel,
    newAssignmentModel,
    "Prisma Assignment model",
  );
  content = replaceOnce(
    content,
    submissionModel,
    newSubmissionModel,
    "Prisma AssignmentSubmission model",
  );
  write("backend/prisma/schema.prisma", content);
}

// Batch progress: only mature/locked submissions count.
{
  let content = read("backend/src/controllers/batch.controller.js");

  const oldProgress = `function progressFromAssignments(batch, storedProgress = 0) {
  const assignments = Array.isArray(batch.assignments) ? batch.assignments : [];
  const total = assignments.length;
  if (total === 0)
    return Math.max(0, Math.min(100, Math.round(Number(storedProgress || 0))));
  const submitted = assignments.filter(
    (a) => Array.isArray(a.submissions) && a.submissions.length > 0,
  ).length;
  return Math.round((submitted / total) * 100);
}`;

  const newProgress = `function progressFromAssignments(batch, storedProgress = 0) {
  const assignments = Array.isArray(batch.assignments) ? batch.assignments : [];
  const total = assignments.length;

  if (total === 0)
    return Math.max(0, Math.min(100, Math.round(Number(storedProgress || 0))));

  const now = Date.now();
  const editWindowMs =
    Math.max(1, Number(process.env.ASSIGNMENT_EDIT_WINDOW_HOURS || 48)) *
    60 *
    60 *
    1000;

  const completed = assignments.filter((assignment) =>
    (assignment.submissions || []).some((submission) => {
      if (!submission || submission.status === "RESUBMIT") return false;

      const effectiveLockTime = submission.editable_until
        ? new Date(submission.editable_until).getTime()
        : submission.submitted_at
          ? new Date(submission.submitted_at).getTime() + editWindowMs
          : Number.POSITIVE_INFINITY;

      return Number.isFinite(effectiveLockTime) && effectiveLockTime <= now;
    }),
  ).length;

  return Math.round((completed / total) * 100);
}`;

  const oldSelect = `select: {
                    id: true,
                    status: true,
                    submitted_at: true,
                  },`;

  const newSelect = `select: {
                    id: true,
                    status: true,
                    submitted_at: true,
                    editable_until: true,
                    locked_at: true,
                  },`;

  content = replaceOnce(
    content,
    oldProgress,
    newProgress,
    "Assignment progress function",
  );
  content = replaceOnce(
    content,
    oldSelect,
    newSelect,
    "Enrolled batch submission fields",
  );
  write("backend/src/controllers/batch.controller.js", content);
}

// Frontend API: authenticated private file download methods.
{
  let content = read("frontend/src/services/api.js");

  const mediaFunction = `export function mediaUrl(filePath) {
  if (!filePath) return "";
  if (/^https?:\\/\\//i.test(filePath)) return filePath;
  return \`${"${BACKEND}"}/\${String(filePath).replace(/^\\/+/, "").replace(/\\\\/g, "/")}\`;
}`;

  const mediaAndDownload = `${mediaFunction}

function fileNameFromDisposition(disposition, fallback) {
  if (!disposition) return fallback;
  const utfMatch = disposition.match(/filename\\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {}
  }
  const basicMatch = disposition.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1] || fallback;
}

async function downloadPrivateFile(
  path,
  preferredFileName,
  requestedRole,
  retry = true,
) {
  const role = normalizeRole(requestedRole || roleFromBrowserPath());
  const token = getRoleToken(role);
  const response = await fetch(\`${"${BASE}"}\${path}\`, {
    credentials: "include",
    headers: {
      ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
    },
  });

  if (response.status === 401 && retry && !isAuthRoute(path)) {
    try {
      const refreshResponse = await fetch(
        \`${"${BASE}"}/auth/refresh?role=\${encodeURIComponent(role)}\`,
        { method: "POST", credentials: "include" },
      );
      const refreshData = await parseResponse(refreshResponse);
      const newToken =
        refreshData?.data?.access_token ||
        refreshData?.data?.accessToken ||
        refreshData?.access_token ||
        refreshData?.accessToken ||
        "";

      if (refreshResponse.ok && newToken) {
        const existingUser = getRoleUser(role);
        if (existingUser) saveRoleSession(role, existingUser, newToken);
        else localStorage.setItem(ROLE_KEYS[role].tokenKey, newToken);
        return downloadPrivateFile(
          path,
          preferredFileName,
          role,
          false,
        );
      }
    } catch {}
  }

  if (!response.ok) {
    const payload = await parseResponse(response);
    throw new Error(payload.message || "Download failed.");
  }

  const blob = await response.blob();
  const fileName = fileNameFromDisposition(
    response.headers.get("content-disposition"),
    preferredFileName || "download",
  );
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}`;

  content = replaceOnce(
    content,
    mediaFunction,
    mediaAndDownload,
    "Private download helper insertion",
  );

  const oldAssignmentApi = `export const assignmentApi = {
  getForBatch: (batchId) => http(\`/assignments/batch/\${batchId}\`),
  create: (data, file) => {
    const fd = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.append(k, v);
    });
    if (file) fd.append("file", file);
    return http("/assignments", { method: "POST", role: "tutor", body: fd });
  },
  submit: (assignmentId, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return http(\`/assignments/\${assignmentId}/submit\`, {
      method: "POST",
      role: "student",
      body: fd,
    });
  },
  tutorSubmissions: (batchId = "", sessionId = "") =>
    http(
      \`/assignments/tutor/submissions\${toQuery({ batch_id: batchId, session_id: sessionId })}\`,
      { role: "tutor" },
    ),
  reviewSubmission: (submissionId, data) =>
    http(\`/assignments/submissions/\${submissionId}/review\`, {
      method: "PATCH",
      role: "tutor",
      body: JSON.stringify(data),
    }),
};`;

  const newAssignmentApi = `export const assignmentApi = {
  getForBatch: (batchId) => http(\`/assignments/batch/\${batchId}\`),
  create: (data, file) => {
    const fd = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.append(k, v);
    });
    if (file) fd.append("file", file);
    return http("/assignments", { method: "POST", role: "tutor", body: fd });
  },
  submit: (assignmentId, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return http(\`/assignments/\${assignmentId}/submit\`, {
      method: "POST",
      role: "student",
      body: fd,
    });
  },
  downloadAssignment: (
    assignmentId,
    fileName = "assignment",
    role = roleFromBrowserPath(),
  ) =>
    downloadPrivateFile(
      \`/assignments/\${assignmentId}/download\`,
      fileName,
      role,
    ),
  downloadSubmission: (
    submissionId,
    fileName = "student-assignment",
    role = roleFromBrowserPath(),
  ) =>
    downloadPrivateFile(
      \`/assignments/submissions/\${submissionId}/download\`,
      fileName,
      role,
    ),
  tutorSubmissions: (batchId = "", sessionId = "") =>
    http(
      \`/assignments/tutor/submissions\${toQuery({ batch_id: batchId, session_id: sessionId })}\`,
      { role: "tutor" },
    ),
  reviewSubmission: (submissionId, data) =>
    http(\`/assignments/submissions/\${submissionId}/review\`, {
      method: "PATCH",
      role: "tutor",
      body: JSON.stringify(data),
    }),
};`;

  content = replaceOnce(
    content,
    oldAssignmentApi,
    newAssignmentApi,
    "Frontend assignment API",
  );
  write("frontend/src/services/api.js", content);
}

console.log(`\nAssignment feature applied successfully.`);
console.log(`Backup created at:\n${backupRoot}`);
console.log("\nNext steps:");
console.log("1. Run the included SQL migration in Supabase.");
console.log("2. Run: cd backend && npx prisma format && npx prisma generate");
console.log("3. Add Google Drive environment values to Render.");
console.log("4. Test locally before committing and deploying.\n");
