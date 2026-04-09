-- Track whether a welcome email has been sent so we only send it once.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_sent BOOLEAN NOT NULL DEFAULT false;
