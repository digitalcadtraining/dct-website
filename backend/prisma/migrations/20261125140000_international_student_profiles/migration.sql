CREATE TABLE "student_international_profiles" (
    "student_id" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "dial_code" TEXT NOT NULL,
    "time_zone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "student_international_profiles_pkey" PRIMARY KEY ("student_id")
);

ALTER TABLE "student_international_profiles"
ADD CONSTRAINT "student_international_profiles_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
