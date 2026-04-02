-- 006_fix_orders_schema.sql
--
-- The orders table was created by 001_init.sql with a schema that doesn't match
-- the app. Migration 004_orders_table.sql used CREATE TABLE IF NOT EXISTS, so the
-- new columns were never added (the table already existed). This migration patches
-- the live table to match what the app actually inserts.

-- 1. Add missing columns the app writes
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS items          JSONB    NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS include_sample BOOLEAN  NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pickup_date    DATE;

-- 2. Give the legacy NOT-NULL columns a default of 0 so the app can omit them
--    (the app doesn't send subtotal_cents / delivery_cents)
ALTER TABLE public.orders
  ALTER COLUMN subtotal_cents SET DEFAULT 0,
  ALTER COLUMN delivery_cents SET DEFAULT 0;

-- 3. Expand the status CHECK constraint to include the new workflow values
--    (original only allowed: pending, paid, failed, refunded)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'paid', 'failed', 'refunded'));

-- 4. Ensure customers can INSERT their own orders
--    (001_init.sql had no INSERT policy; 004 added one but only when the table
--    was freshly created — which never happened)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'orders'
      AND policyname = 'Users can insert own orders'
  ) THEN
    CREATE POLICY "Users can insert own orders" ON public.orders
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Index to support admin queries filtered by pickup window
CREATE INDEX IF NOT EXISTS orders_pickup_date_idx ON public.orders(pickup_date);
