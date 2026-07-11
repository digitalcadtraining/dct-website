-- Run only if the table/model was not already created.
CREATE TABLE IF NOT EXISTS enrollment_installments (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  installment_no INTEGER NOT NULL,
  label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT,
  payment_ref TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, installment_no)
);
CREATE INDEX IF NOT EXISTS enrollment_installments_enrollment_id_idx ON enrollment_installments(enrollment_id);
CREATE INDEX IF NOT EXISTS enrollment_installments_status_idx ON enrollment_installments(status);
CREATE INDEX IF NOT EXISTS enrollment_installments_due_date_idx ON enrollment_installments(due_date);
