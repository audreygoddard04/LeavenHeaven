-- 012_orders_stripe_checkout.sql
--
-- Adds the stripe_checkout_session_id column so the server can
-- link a Stripe checkout session back to the saved order, and
-- expands the status CHECK constraint to include pending_payment.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

CREATE INDEX IF NOT EXISTS orders_stripe_session_idx
  ON public.orders(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- Expand status constraint to include pending_payment
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'pending_payment',
    'confirmed',
    'ready',
    'completed',
    'paid',
    'failed',
    'refunded'
  ));
