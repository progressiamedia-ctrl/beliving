-- Agent System Setup for Be Living
-- Run this migration in Supabase SQL Editor after existing setup

-- 1. Add 'agent' to user_type enum
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('guest', 'host', 'admin', 'agent'));

-- 2. Agent-specific columns on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_referral_code VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_commission_tier INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_specialization VARCHAR(20) DEFAULT 'hybrid';
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_agent_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_registration_type VARCHAR(10);

-- 3. Add service_fee_amount to bookings (was only calculated frontend)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_fee_amount DECIMAL(10,2) DEFAULT 0;

-- 4. Agent host referrals table
CREATE TABLE IF NOT EXISTS agent_host_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50),
  link_clicks INT DEFAULT 0,
  registered_at TIMESTAMP DEFAULT NOW(),
  first_property_created_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'prospect',
  notes TEXT,
  last_contacted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, host_id)
);

-- 5. Agent guest referrals table
CREATE TABLE IF NOT EXISTS agent_guest_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50),
  link_clicks INT DEFAULT 0,
  registered_at TIMESTAMP DEFAULT NOW(),
  first_booking_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'prospect',
  notes TEXT,
  last_contacted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, guest_id)
);

-- 6. Agent commissions table
CREATE TABLE IF NOT EXISTS agent_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  referral_type VARCHAR(10) NOT NULL,
  host_id UUID REFERENCES users(id),
  guest_id UUID REFERENCES users(id),
  property_id VARCHAR NOT NULL,
  check_in DATE,
  check_out DATE,
  nights INT,
  property_price_total DECIMAL(10,2),
  service_fee_amount DECIMAL(10,2),
  commission_percentage DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Agent commission summary (denormalized for fast queries)
CREATE TABLE IF NOT EXISTS agent_commission_summary (
  agent_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_hosts_referred INT DEFAULT 0,
  active_hosts INT DEFAULT 0,
  hosts_with_bookings INT DEFAULT 0,
  lifetime_commission_from_hosts DECIMAL(12,2) DEFAULT 0,
  pending_commission_from_hosts DECIMAL(12,2) DEFAULT 0,
  commission_from_hosts_this_month DECIMAL(12,2) DEFAULT 0,
  bookings_from_hosts_this_month INT DEFAULT 0,
  total_guests_referred INT DEFAULT 0,
  active_guests INT DEFAULT 0,
  guests_with_bookings INT DEFAULT 0,
  lifetime_commission_from_guests DECIMAL(12,2) DEFAULT 0,
  pending_commission_from_guests DECIMAL(12,2) DEFAULT 0,
  commission_from_guests_this_month DECIMAL(12,2) DEFAULT 0,
  bookings_from_guests_this_month INT DEFAULT 0,
  total_lifetime_commission DECIMAL(12,2) DEFAULT 0,
  total_pending_commission DECIMAL(12,2) DEFAULT 0,
  total_paid_commission DECIMAL(12,2) DEFAULT 0,
  total_commission_this_month DECIMAL(12,2) DEFAULT 0,
  total_bookings_this_month INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Indices for performance
CREATE INDEX IF NOT EXISTS idx_agent_host_referrals_agent ON agent_host_referrals(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_guest_referrals_agent ON agent_guest_referrals(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent ON agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_booking ON agent_commissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(agent_referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_agent_id);

-- 9. Enable Row-Level Security
ALTER TABLE agent_host_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_guest_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commission_summary ENABLE ROW LEVEL SECURITY;
