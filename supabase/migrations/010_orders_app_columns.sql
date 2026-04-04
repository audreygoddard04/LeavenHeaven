-- 010_orders_app_columns.sql
-- Run in Supabase SQL Editor if you see errors like:
--   "Could not find the 'items' column of 'orders'"
--
-- This adds the JSON line-items column + pickup date to the legacy 001_init
-- orders table (which only had Stripe-style money columns).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pickup_date DATE;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS include_sample BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow customers to insert their own pre-orders (001 only had SELECT)
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
