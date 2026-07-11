-- DCT assignment storage: Google Drive metadata + 48-hour edit window
-- Safe for existing assignment and submission rows.

ALTER TABLE "assignments"
  ADD COLUMN IF NOT EXISTS "storage_provider" TEXT NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN IF NOT EXISTS "drive_file_id" TEXT,
  ADD COLUMN IF NOT EXISTS "original_filename" TEXT,
  ADD COLUMN IF NOT EXISTS "file_mime_type" TEXT,
  ADD COLUMN IF NOT EXISTS "file_size" INTEGER;

ALTER TABLE "assignment_submissions"
  ADD COLUMN IF NOT EXISTS "storage_provider" TEXT NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN IF NOT EXISTS "drive_file_id" TEXT,
  ADD COLUMN IF NOT EXISTS "original_filename" TEXT,
  ADD COLUMN IF NOT EXISTS "file_mime_type" TEXT,
  ADD COLUMN IF NOT EXISTS "file_size" INTEGER,
  ADD COLUMN IF NOT EXISTS "first_submitted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "editable_until" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "locked_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "replacement_count" INTEGER NOT NULL DEFAULT 0;

UPDATE "assignment_submissions"
SET
  "first_submitted_at" = COALESCE("first_submitted_at", "submitted_at"),
  "editable_until" = COALESCE(
    "editable_until",
    "submitted_at" + INTERVAL '48 hours'
  )
WHERE
  "first_submitted_at" IS NULL
  OR "editable_until" IS NULL;

CREATE INDEX IF NOT EXISTS "assignments_drive_file_id_idx"
  ON "assignments"("drive_file_id");

CREATE INDEX IF NOT EXISTS "assignment_submissions_drive_file_id_idx"
  ON "assignment_submissions"("drive_file_id");

CREATE INDEX IF NOT EXISTS "assignment_submissions_editable_until_idx"
  ON "assignment_submissions"("editable_until");
