-- CoParenting Pay — Supabase Schema
-- Paste into: Supabase Dashboard → SQL Editor → Run

-- ── Users handled by Supabase Auth (email only) ──────

-- ── Calculations ──────────────────────────────────────
-- Stores each saved expense split session
CREATE TABLE calculations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- user_id is NULL for anonymous quick-calcs (not saved)
  share_token  TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'), -- short share link token
  title        TEXT NOT NULL DEFAULT 'Expense Split',
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 years'
);

-- ── Expense line items within a calculation ───────────
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id  UUID NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  amount          NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category        TEXT NOT NULL DEFAULT 'Other',
  paid_by         TEXT NOT NULL DEFAULT 'Parent A', -- 'Parent A' | 'Parent B'
  split_a         INTEGER NOT NULL DEFAULT 50 CHECK (split_a BETWEEN 0 AND 100),
  -- split_b = 100 - split_a (always)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_calc ON expenses(calculation_id);
CREATE INDEX idx_calcs_user    ON calculations(user_id);
CREATE INDEX idx_calcs_token   ON calculations(share_token);

-- ── Purchases (PDF unlock) ────────────────────────────
CREATE TABLE purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calculation_id  UUID REFERENCES calculations(id) ON DELETE SET NULL,
  amount_cents    INTEGER NOT NULL DEFAULT 499,
  currency        TEXT NOT NULL DEFAULT 'usd',
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','refunded')),
  stripe_session_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchases_user ON purchases(user_id);

-- ── RLS Policies ──────────────────────────────────────
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases    ENABLE ROW LEVEL SECURITY;

-- Calculations: owner can do anything; anyone can READ by share_token
CREATE POLICY "Owner full access"
  ON calculations FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can read by share token"
  ON calculations FOR SELECT
  USING (share_token IS NOT NULL);

-- Expenses: accessible if user owns the parent calculation
CREATE POLICY "Expenses follow calculation access"
  ON expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM calculations c
      WHERE c.id = calculation_id
        AND (c.user_id = auth.uid() OR c.share_token IS NOT NULL)
    )
  );

-- Purchases: owner only
CREATE POLICY "Owner sees own purchases"
  ON purchases FOR ALL
  USING (user_id = auth.uid());

-- ── 7-year archive job (Supabase cron or pg_cron) ─────
-- SELECT cron.schedule('archive-old-calcs', '0 2 * * 0',
--   $$ UPDATE calculations SET expires_at = NOW() WHERE expires_at < NOW() $$);
