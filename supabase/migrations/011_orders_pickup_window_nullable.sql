-- 011_orders_pickup_window_nullable.sql
-- The app stores the Sunday in pickup_date (DATE). If pickup_window_id was added
-- as NOT NULL without a default, inserts fail. Allow NULL so pickup_date is enough.

ALTER TABLE public.orders
  ALTER COLUMN pickup_window_id DROP NOT NULL;
