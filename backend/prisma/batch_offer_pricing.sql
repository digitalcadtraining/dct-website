-- Batch-wise offer pricing fields for DCT course pages
-- Run this once in Supabase SQL Editor or using psql.

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS offer_name TEXT DEFAULT 'Limited Batch Offer',
ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS offer_price NUMERIC(10,2);

-- Optional: initialize empty batch prices from course price
UPDATE batches b
SET original_price = COALESCE(b.original_price, c.price),
    offer_price = COALESCE(b.offer_price, c.price),
    offer_name = COALESCE(b.offer_name, 'Limited Batch Offer')
FROM courses c
WHERE b.course_id = c.id;
