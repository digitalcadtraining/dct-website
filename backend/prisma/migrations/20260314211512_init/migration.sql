-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TUTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('THEORY', 'CAD', 'BOTH');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ScheduledSessionStatus" AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'RESUBMIT');

-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('STUDENT_REGISTER', 'TUTOR_REGISTER', 'LOGIN', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "overview_points" JSONB NOT NULL DEFAULT '[]',
    "tools_covered" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_applications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "years_exp" INTEGER NOT NULL,
    "companies" TEXT NOT NULL,
    "work_experience" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "time_slots" JSONB NOT NULL DEFAULT '[]',
    "hide_identity" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT NOT NULL,
    "languages" JSONB NOT NULL DEFAULT '[]',
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "applied_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_on" TIMESTAMP(3),
    "rejection_note" TEXT,
    "user_id" TEXT,

    CONSTRAINT "tutor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus_templates" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "session_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SessionType" NOT NULL DEFAULT 'BOTH',

    CONSTRAINT "syllabus_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus_projects" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "highlights" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "syllabus_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "max_students" INTEGER NOT NULL DEFAULT 50,
    "description" TEXT,
    "zoom_link" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'UPCOMING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_ref" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_sessions" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "session_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SessionType" NOT NULL DEFAULT 'BOTH',
    "scheduled_at" TIMESTAMP(3),
    "duration_minutes" INTEGER NOT NULL DEFAULT 90,
    "zoom_link" TEXT,
    "recording_url" TEXT,
    "notes_url" TEXT,
    "status" "ScheduledSessionStatus" NOT NULL DEFAULT 'UPCOMING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "session_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT,
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "grade" TEXT,
    "feedback" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queries" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "session_id" TEXT,
    "batch_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "status" "QueryStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMP(3),

    CONSTRAINT "queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "otp_verifications_phone_purpose_idx" ON "otp_verifications"("phone", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_applications_user_id_key" ON "tutor_applications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_batch_id_key" ON "enrollments"("student_id", "batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_assignment_id_student_id_key" ON "assignment_submissions"("assignment_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "tutor_applications" ADD CONSTRAINT "tutor_applications_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_applications" ADD CONSTRAINT "tutor_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_templates" ADD CONSTRAINT "syllabus_templates_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "tutor_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_projects" ADD CONSTRAINT "syllabus_projects_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "tutor_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_sessions" ADD CONSTRAINT "scheduled_sessions_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "scheduled_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queries" ADD CONSTRAINT "queries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queries" ADD CONSTRAINT "queries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "scheduled_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
