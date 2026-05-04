-- ============================================
-- COMISIONES Y TIERS - SISTEMA FINAL
-- ============================================

-- 1. ACTUALIZAR CHECK DE USER_TYPE
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('guest', 'host', 'admin', 'agent'));

-- 2. CAMPOS DE AGENT EN USERS (si no existen)
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_referral_code VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_tier INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_subs_active INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_subs_annual INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_reservations_total INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_reservations_this_month INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_mrr_residual DECIMAL(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_last_tier_change TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_agent_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_registration_type VARCHAR(10);

-- 3. TASAS DE COMISIÓN POR TIER
CREATE TABLE IF NOT EXISTS tier_commission_rates (
  tier INT PRIMARY KEY,
  tier_name VARCHAR(50) NOT NULL,
  tier_label VARCHAR(100),
  subs_monthly_pct DECIMAL(4,2) NOT NULL,
  subs_annual_pct DECIMAL(4,2) NOT NULL,
  reservation_pct DECIMAL(4,2) NOT NULL,
  sub_affiliate_pct DECIMAL(4,2) DEFAULT 0,
  can_refer BOOLEAN DEFAULT FALSE,
  can_use_api BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar tasas de comisión
INSERT INTO tier_commission_rates (tier, tier_name, tier_label, subs_monthly_pct, subs_annual_pct, reservation_pct, sub_affiliate_pct, can_refer, can_use_api)
VALUES
  (0, 'Iniciante', '🎯 Iniciante', 3.00, 3.00, 0.50, 0, FALSE, FALSE),
  (1, 'Especialista', '⭐ Especialista', 5.00, 5.00, 1.00, 0, FALSE, FALSE),
  (2, 'Profesional', '💼 Profesional', 6.00, 6.00, 1.50, 0, FALSE, FALSE),
  (3, 'Experto', '🔥 Experto', 7.00, 7.00, 2.00, 0, FALSE, FALSE),
  (4, 'Elite', '👑 Elite', 8.00, 8.00, 2.50, 2.00, TRUE, FALSE),
  (5, 'Supremo', '💎 Supremo', 10.00, 10.00, 3.00, 2.00, TRUE, TRUE)
ON CONFLICT (tier) DO UPDATE SET
  subs_monthly_pct = EXCLUDED.subs_monthly_pct,
  subs_annual_pct = EXCLUDED.subs_annual_pct,
  reservation_pct = EXCLUDED.reservation_pct,
  sub_affiliate_pct = EXCLUDED.sub_affiliate_pct,
  can_refer = EXCLUDED.can_refer,
  can_use_api = EXCLUDED.can_use_api,
  updated_at = NOW();

-- 4. REQUISITOS POR TIER
CREATE TABLE IF NOT EXISTS tier_requirements (
  tier INT PRIMARY KEY,
  min_subs_cumulative INT,
  min_reservations_per_month INT,
  min_monthly_pace_required BOOLEAN,
  grace_period_days INT DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (tier) REFERENCES tier_commission_rates(tier)
);

INSERT INTO tier_requirements (tier, min_subs_cumulative, min_reservations_per_month, min_monthly_pace_required, grace_period_days)
VALUES
  (0, 0, 0, FALSE, 0),
  (1, 15, 10, TRUE, 30),
  (2, 40, 40, TRUE, 30),
  (3, 100, 80, TRUE, 30),
  (4, 200, 150, TRUE, 30),
  (5, 400, 300, TRUE, 30)
ON CONFLICT (tier) DO UPDATE SET
  min_subs_cumulative = EXCLUDED.min_subs_cumulative,
  min_reservations_per_month = EXCLUDED.min_reservations_per_month,
  min_monthly_pace_required = EXCLUDED.min_monthly_pace_required,
  grace_period_days = EXCLUDED.grace_period_days,
  updated_at = NOW();

-- 5. COMISIONES CONGELADAS (Período de cancelación)
CREATE TABLE IF NOT EXISTS frozen_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL,
  subscription_type VARCHAR(10) NOT NULL, -- 'monthly' | 'annual'
  amount DECIMAL(10,2) NOT NULL,
  freeze_until TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'frozen', -- 'frozen' | 'earned' | 'paid' | 'refunded'
  earned_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_frozen_commissions_agent ON frozen_commissions(agent_id);
CREATE INDEX idx_frozen_commissions_status ON frozen_commissions(status);
CREATE INDEX idx_frozen_commissions_freeze_until ON frozen_commissions(freeze_until);

-- 6. HISTORIAL DE COMISIONES (Auditoría)
CREATE TABLE IF NOT EXISTS commission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commission_type VARCHAR(50), -- 'subscription_monthly', 'subscription_annual', 'reservation', 'sub_affiliate', 'challenge_bonus'
  source_id UUID, -- subscription_id, reservation_id, etc
  amount DECIMAL(10,2) NOT NULL,
  tier INT,
  commission_pct DECIMAL(4,2),
  status VARCHAR(20) DEFAULT 'earned', -- 'frozen' | 'earned' | 'paid'
  earned_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commission_history_agent ON commission_history(agent_id);
CREATE INDEX idx_commission_history_earned_at ON commission_history(earned_at);
CREATE INDEX idx_commission_history_status ON commission_history(status);

-- 7. DESAFÍOS MENSUALES
CREATE TABLE IF NOT EXISTS monthly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type VARCHAR(50) NOT NULL, -- 'triple_threat' | 'host_magnet' | 'booking_blitz'
  challenge_name VARCHAR(100) NOT NULL,
  challenge_description TEXT,
  month_year VARCHAR(7) NOT NULL, -- 'YYYY-MM'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_monthly_challenges_month ON monthly_challenges(month_year);

-- 8. REQUISITOS POR DESAFÍO Y TIER
CREATE TABLE IF NOT EXISTS challenge_tier_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES monthly_challenges(id) ON DELETE CASCADE,
  tier INT NOT NULL,
  subs_required INT DEFAULT 0,
  reservations_required INT DEFAULT 0,
  interactions_required INT DEFAULT 0,
  prize_cash DECIMAL(10,2) DEFAULT 0,
  prize_commission_bonus_pct DECIMAL(4,2) DEFAULT 0,
  prize_commission_days INT DEFAULT 0, -- Duración del bonus en días
  prize_description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_challenge_requirements_challenge ON challenge_tier_requirements(challenge_id);

-- 9. PROGRESO DE DESAFÍOS DEL AGENTE
CREATE TABLE IF NOT EXISTS agent_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES monthly_challenges(id) ON DELETE CASCADE,
  subs_count INT DEFAULT 0,
  reservations_count INT DEFAULT 0,
  interactions_count INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  prize_claimed BOOLEAN DEFAULT FALSE,
  prize_amount DECIMAL(10,2) DEFAULT 0,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, challenge_id)
);

CREATE INDEX idx_agent_challenge_agent ON agent_challenge_progress(agent_id);
CREATE INDEX idx_agent_challenge_challenge ON agent_challenge_progress(challenge_id);
CREATE INDEX idx_agent_challenge_completed ON agent_challenge_progress(completed);

-- 10. SUB-AFILIADOS
CREATE TABLE IF NOT EXISTS agent_sub_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sub_affiliate_commission_pct DECIMAL(4,2) DEFAULT 2.00,
  lifetime_commission_earned DECIMAL(12,2) DEFAULT 0,
  lifetime_commission_paid DECIMAL(12,2) DEFAULT 0,
  referred_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  deactivated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_agent_id, referred_agent_id),
  CONSTRAINT no_self_affiliate CHECK (referrer_agent_id != referred_agent_id)
);

CREATE INDEX idx_sub_affiliates_referrer ON agent_sub_affiliates(referrer_agent_id);
CREATE INDEX idx_sub_affiliates_referred ON agent_sub_affiliates(referred_agent_id);
CREATE INDEX idx_sub_affiliates_active ON agent_sub_affiliates(is_active);

-- 11. COMISIONES DE SUB-AFILIADOS (Tracking)
CREATE TABLE IF NOT EXISTS sub_affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_affiliate_id UUID NOT NULL REFERENCES agent_sub_affiliates(id) ON DELETE CASCADE,
  referred_agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referrer_agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_commission_id UUID NOT NULL REFERENCES commission_history(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  commission_pct DECIMAL(4,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'earned', -- 'earned' | 'paid'
  earned_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sub_affiliate_commissions_referrer ON sub_affiliate_commissions(referrer_agent_id);
CREATE INDEX idx_sub_affiliate_commissions_referred ON sub_affiliate_commissions(referred_agent_id);

-- 12. BONIFICACIONES ACTIVAS
CREATE TABLE IF NOT EXISTS agent_active_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bonus_type VARCHAR(50) NOT NULL, -- 'velocity' | 'retention' | 'challenge' | 'affiliate' | 'tier_up'
  bonus_label VARCHAR(100),
  bonus_pct_subs DECIMAL(4,2) DEFAULT 0,
  bonus_pct_reservations DECIMAL(4,2) DEFAULT 0,
  bonus_cash DECIMAL(10,2) DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_active_bonuses_agent ON agent_active_bonuses(agent_id);
CREATE INDEX idx_active_bonuses_expires ON agent_active_bonuses(expires_at);
CREATE INDEX idx_active_bonuses_active ON agent_active_bonuses(is_active);

-- 13. HISTORIAL DE CAMBIOS DE TIER
CREATE TABLE IF NOT EXISTS tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_tier INT,
  to_tier INT NOT NULL,
  reason VARCHAR(100), -- 'requirements_met' | 'auto_downgrade' | 'recovery' | 'admin_change'
  details TEXT,
  changed_by VARCHAR(50), -- 'system' | 'admin' | 'user_id'
  changed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tier_history_agent ON tier_history(agent_id);
CREATE INDEX idx_tier_history_changed_at ON tier_history(changed_at);

-- 14. MÉTRICAS MENSUALES DEL AGENTE (Para cálculos rápidos)
CREATE TABLE IF NOT EXISTS agent_monthly_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- 'YYYY-MM'
  subs_new INT DEFAULT 0,
  subs_active INT DEFAULT 0,
  reservations_count INT DEFAULT 0,
  reservations_value DECIMAL(12,2) DEFAULT 0,
  commission_earned DECIMAL(12,2) DEFAULT 0,
  commission_paid DECIMAL(12,2) DEFAULT 0,
  sub_affiliate_commission DECIMAL(12,2) DEFAULT 0,
  bonus_commission DECIMAL(12,2) DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, month_year)
);

CREATE INDEX idx_agent_monthly_metrics_agent ON agent_monthly_metrics(agent_id);
CREATE INDEX idx_agent_monthly_metrics_month ON agent_monthly_metrics(month_year);

-- 15. LEADERBOARD (Caché para performance)
CREATE TABLE IF NOT EXISTS leaderboard_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year VARCHAR(7) NOT NULL,
  leaderboard_type VARCHAR(50) NOT NULL, -- 'earnings' | 'subs_new' | 'reservations' | 'growth'
  rank INT,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value DECIMAL(12,2),
  prize_earned BOOLEAN DEFAULT FALSE,
  prize_amount DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(month_year, leaderboard_type, rank)
);

CREATE INDEX idx_leaderboard_month ON leaderboard_monthly(month_year);
CREATE INDEX idx_leaderboard_agent ON leaderboard_monthly(agent_id);

-- NOTE: Unfreeze logic is handled by cron job in app/api/cron/unfreeze-commissions/route.ts
-- This provides better control over freeze periods and prevents database-level race conditions

-- ============================================
-- FUNCIÓN PARA AUTO TIER UP/DOWN
-- ============================================

CREATE OR REPLACE FUNCTION check_agent_tier_eligibility()
RETURNS void AS $$
DECLARE
  agent_record RECORD;
  new_tier INT;
  current_tier INT;
  min_subs INT;
  min_reservations INT;
BEGIN
  FOR agent_record IN
    SELECT id, agent_tier, agent_subs_active, agent_reservations_this_month, agent_reservations_total
    FROM users
    WHERE user_type = 'agent' AND agent_enabled = TRUE
  LOOP
    current_tier := agent_record.agent_tier;

    -- Check tier up
    FOR new_tier IN 1..5 LOOP
      SELECT min_subs_cumulative, min_reservations_per_month
      INTO min_subs, min_reservations
      FROM tier_requirements
      WHERE tier = new_tier;

      IF agent_record.agent_subs_active >= min_subs
         AND agent_record.agent_reservations_this_month >= min_reservations
         AND new_tier > current_tier THEN

        UPDATE users SET agent_tier = new_tier, agent_last_tier_change = NOW()
        WHERE id = agent_record.id;

        INSERT INTO tier_history (agent_id, from_tier, to_tier, reason, changed_by)
        VALUES (agent_record.id, current_tier, new_tier, 'requirements_met', 'system');

        current_tier := new_tier;
      END IF;
    END LOOP;

    -- Check tier down (2 meses bajo requisitos)
    -- Implementar lógica más adelante si es necesario
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ÍNDICES ADICIONALES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_agent_tier ON users(agent_tier);
CREATE INDEX IF NOT EXISTS idx_users_agent_enabled ON users(agent_enabled);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_agent_id);

-- ============================================
-- PERMISOS
-- ============================================

GRANT SELECT ON tier_commission_rates TO authenticated;
GRANT SELECT ON tier_requirements TO authenticated;
GRANT SELECT ON agent_monthly_metrics TO authenticated;
GRANT SELECT ON leaderboard_monthly TO authenticated;
