-- DCT batch offer countdown fields
-- Run once in Supabase SQL Editor before using the admin offer timer UI.

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS offer_start_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS offer_end_at TIMESTAMP;

-- Existing pricing fields, kept here for safety if not already applied.
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS offer_name TEXT DEFAULT 'Limited Batch Offer',
ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS offer_price NUMERIC(10,2);
