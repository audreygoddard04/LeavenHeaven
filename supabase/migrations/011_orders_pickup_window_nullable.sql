-- 011_orders_pickup_window_nullable.sql
-- The app stores the Sunday in orders.pickup_date. If pickup_window_id is NOT NULL
-- with no default, inserts fail. Run this once in Supabase SQL Editor.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'pickup_window_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.orders ALTER COLUMN pickup_window_id DROP NOT NULL';
  END IF;
END $$;
