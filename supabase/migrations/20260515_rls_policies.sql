-- ════════════════════════════════════════════════════════════════════════════
-- WeUp — Row Level Security policies
-- Run this in Supabase Dashboard → SQL Editor, or via: supabase db push
-- ════════════════════════════════════════════════════════════════════════════

-- ── profiles table ───────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies before recreating
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;

-- Users can only read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update their own profile, but cannot change their plan
-- (plan changes must come through the service-role webhook, not the client)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent client-side plan escalation: plan column must not change
    -- (the webhook uses service_role which bypasses RLS entirely)
    AND plan = (SELECT plan FROM profiles WHERE id = auth.uid())
  );

-- Users cannot delete their profile (handled by admin/edge function)
CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE
  USING (FALSE);


-- ── transactions table ────────────────────────────────────────────────────────
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON transactions;

-- Users can only read their own transactions
CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert transactions only for themselves
-- Free plan limit (30/month) is enforced in the application layer;
-- RLS can optionally enforce it via a function check:
CREATE OR REPLACE FUNCTION check_free_plan_tx_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan    text;
  tx_count     int;
  current_year int  := EXTRACT(YEAR  FROM now())::int;
  current_mon  int  := EXTRACT(MONTH FROM now())::int;
BEGIN
  SELECT plan INTO user_plan FROM profiles WHERE id = auth.uid();

  -- Pro and Family plans have no limit
  IF user_plan IN ('pro', 'family') THEN
    RETURN TRUE;
  END IF;

  -- Free plan: count this month's transactions
  SELECT COUNT(*) INTO tx_count
  FROM transactions
  WHERE user_id = auth.uid()
    AND EXTRACT(YEAR  FROM date::date) = current_year
    AND EXTRACT(MONTH FROM date::date) = current_mon;

  RETURN tx_count < 30;
END;
$$;

CREATE POLICY "transactions_insert_own" ON transactions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND check_free_plan_tx_limit()
  );

-- Users can update only their own transactions
CREATE POLICY "transactions_update_own" ON transactions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete only their own transactions
CREATE POLICY "transactions_delete_own" ON transactions
  FOR DELETE
  USING (user_id = auth.uid());


-- ── Service-role note ─────────────────────────────────────────────────────────
-- The mp-webhook edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses
-- RLS entirely. This is intentional — plan upgrades must be server-side only.
-- Never expose the service-role key to the browser.
