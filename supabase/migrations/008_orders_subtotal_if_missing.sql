-- Ensure subtotal_cents / delivery_cents exist for app inserts (legacy 001 vs 004 schemas).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal_cents INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_cents INTEGER NOT NULL DEFAULT 0;
