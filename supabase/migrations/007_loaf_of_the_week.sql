-- 007_loaf_of_the_week.sql
-- A simple key/value settings table used to store the featured loaf of the week.

CREATE TABLE IF NOT EXISTS public.site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone (including visitors) can read settings
CREATE POLICY "Anyone can read settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can write settings
CREATE POLICY "Admins can write settings"
  ON public.site_settings FOR ALL
  USING (public.is_admin());

-- Seed the loaf_of_the_week row (null = auto-rotate)
INSERT INTO public.site_settings (key, value)
VALUES ('loaf_of_the_week', null)
ON CONFLICT (key) DO NOTHING;
