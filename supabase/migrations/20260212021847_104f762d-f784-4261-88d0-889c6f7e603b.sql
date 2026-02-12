
-- 1. Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can read analysis cache" ON public.analysis_cache;
DROP POLICY IF EXISTS "Anyone can read pattern library" ON public.pattern_library;
DROP POLICY IF EXISTS "Anyone can read indicator rules" ON public.indicator_rules;

-- 2. Restrict to authenticated users only
CREATE POLICY "Authenticated users can read analysis cache"
ON public.analysis_cache FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read pattern library"
ON public.pattern_library FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read indicator rules"
ON public.indicator_rules FOR SELECT
USING (auth.uid() IS NOT NULL);
