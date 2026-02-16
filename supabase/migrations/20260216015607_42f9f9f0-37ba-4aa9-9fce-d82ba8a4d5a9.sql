-- Fix numeric precision for columns that receive percentage values (0-100)
ALTER TABLE public.professional_analyses 
  ALTER COLUMN analysis_score TYPE numeric(7,2),
  ALTER COLUMN reliability_score TYPE numeric(7,2),
  ALTER COLUMN overall_confidence TYPE numeric(7,2),
  ALTER COLUMN pattern_confidence TYPE numeric(7,2),
  ALTER COLUMN market_strength TYPE numeric(7,2),
  ALTER COLUMN elder_confidence TYPE numeric(7,2),
  ALTER COLUMN bulkowski_reliability TYPE numeric(7,2),
  ALTER COLUMN bulkowski_failure_rate TYPE numeric(7,2);