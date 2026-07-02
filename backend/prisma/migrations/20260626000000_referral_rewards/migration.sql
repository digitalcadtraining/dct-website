ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_key ON users(referral_code);
CREATE INDEX IF NOT EXISTS users_referral_code_idx ON users(referral_code);

ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS referral_code TEXT;
CREATE INDEX IF NOT EXISTS pending_registrations_referral_code_idx ON pending_registrations(referral_code);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_student_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  pending_registration_id TEXT,
  enrollment_id TEXT,
  referral_code TEXT NOT NULL,
  reward_amount NUMERIC(10,2) NOT NULL DEFAULT 2000,
  status TEXT NOT NULL DEFAULT 'PENDING',
  eligible_at TIMESTAMP(3),
  credited_at TIMESTAMP(3),
  notes TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS referral_rewards_referrer_id_idx ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS referral_rewards_referred_student_id_idx ON referral_rewards(referred_student_id);
CREATE INDEX IF NOT EXISTS referral_rewards_status_idx ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS referral_rewards_eligible_at_idx ON referral_rewards(eligible_at);
