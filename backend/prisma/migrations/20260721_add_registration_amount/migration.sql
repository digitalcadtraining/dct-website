ALTER TABLE "enrollments"
ADD COLUMN IF NOT EXISTS "registration_amount" DECIMAL(10,2);

UPDATE "enrollments"
SET "registration_amount" = 999
WHERE "registration_amount" IS NULL
  AND "payment_status" = 'PAID';

UPDATE "enrollments"
SET "registration_amount" = 0
WHERE "registration_amount" IS NULL;
