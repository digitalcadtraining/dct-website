-- DCT payment receipt feature
-- Run once in Supabase SQL Editor before deploying the new backend.

CREATE TABLE IF NOT EXISTS payment_receipts (
  id TEXT PRIMARY KEY,
  installment_id TEXT NOT NULL UNIQUE,
  receipt_number TEXT NOT NULL UNIQUE,
  payment_method TEXT,
  transaction_ref TEXT,
  details_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_receipts_installment_fk
    FOREIGN KEY (installment_id)
    REFERENCES enrollment_installments(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS payment_receipts_installment_id_idx
  ON payment_receipts(installment_id);

CREATE INDEX IF NOT EXISTS payment_receipts_receipt_number_idx
  ON payment_receipts(receipt_number);
