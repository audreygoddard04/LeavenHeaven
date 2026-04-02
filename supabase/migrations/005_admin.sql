-- Add is_admin flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Security-definer function so admin RLS policies don't recurse into themselves
-- (runs with elevated privileges internally, never exposes data directly)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  )
$$;

-- Admins can read ALL orders (existing policy only covers own orders)
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

-- Admins can update order status (pending → confirmed → ready → completed)
CREATE POLICY "Admins can update order status"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- Admins can read all profiles (to show customer names alongside orders)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());
