-- Adicionar campos para verificação de entrada e confiança
ALTER TABLE public.professional_analyses
ADD COLUMN IF NOT EXISTS entry_verification_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS entry_confidence_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_confidence_threshold numeric DEFAULT 70,
ADD COLUMN IF NOT EXISTS signal_quality text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS confluence_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_notes text,
ADD COLUMN IF NOT EXISTS smart_analysis_result jsonb,
ADD COLUMN IF NOT EXISTS strategic_framework_result jsonb,
ADD COLUMN IF NOT EXISTS is_valid_entry boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS entry_type text,
ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'medium';

-- Criar índices para melhor performance em consultas de verificação
CREATE INDEX IF NOT EXISTS idx_prof_analyses_entry_status ON public.professional_analyses(entry_verification_status);
CREATE INDEX IF NOT EXISTS idx_prof_analyses_confidence ON public.professional_analyses(entry_confidence_score);
CREATE INDEX IF NOT EXISTS idx_prof_analyses_valid_entry ON public.professional_analyses(is_valid_entry);

-- Comentários para documentação
COMMENT ON COLUMN public.professional_analyses.entry_verification_status IS 'Status: pending, verified, rejected, expired';
COMMENT ON COLUMN public.professional_analyses.entry_confidence_score IS 'Score de confiança 0-100';
COMMENT ON COLUMN public.professional_analyses.min_confidence_threshold IS 'Limiar mínimo de confiança para entrada válida';
COMMENT ON COLUMN public.professional_analyses.signal_quality IS 'Qualidade: excellent, good, fair, poor';
COMMENT ON COLUMN public.professional_analyses.confluence_count IS 'Número de confluências detectadas';
COMMENT ON COLUMN public.professional_analyses.is_valid_entry IS 'Se a entrada passou nos critérios mínimos';
COMMENT ON COLUMN public.professional_analyses.entry_type IS 'Tipo: reversal, pullback, breakout, support_test, resistance_test';
COMMENT ON COLUMN public.professional_analyses.risk_level IS 'Nível de risco: low, medium, high';