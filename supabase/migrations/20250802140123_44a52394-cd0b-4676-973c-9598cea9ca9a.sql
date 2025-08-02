-- Primeira, criar enums para categorizar os dados
CREATE TYPE analysis_pattern_type AS ENUM (
  'bullish_engulfing',
  'bearish_engulfing',
  'hammer',
  'doji',
  'shooting_star',
  'hanging_man',
  'three_white_soldiers',
  'three_black_crows',
  'morning_star',
  'evening_star',
  'piercing_pattern',
  'dark_cloud_cover',
  'harami',
  'tweezers',
  'gap_up',
  'gap_down',
  'triangle',
  'wedge',
  'flag',
  'pennant',
  'head_shoulders',
  'double_top',
  'double_bottom',
  'support_resistance'
);

CREATE TYPE market_sentiment AS ENUM ('bullish', 'bearish', 'neutral', 'mixed');
CREATE TYPE market_phase AS ENUM ('accumulation', 'markup', 'distribution', 'markdown');
CREATE TYPE action_type AS ENUM ('compra', 'venda', 'neutro');
CREATE TYPE timeframe_type AS ENUM ('M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1');
CREATE TYPE signal_type AS ENUM ('entrada', 'saída');

-- Tabela principal de análises técnicas profissionais
CREATE TABLE public.professional_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Dados da imagem
  image_url TEXT,
  image_metadata JSONB,
  analysis_region JSONB, -- coordenadas da região analisada
  
  -- Padrões detectados
  patterns JSONB[], -- array de objetos de padrões
  pattern_count INTEGER DEFAULT 0,
  primary_pattern analysis_pattern_type,
  pattern_confidence DECIMAL(3,2),
  
  -- Análise de mercado
  market_sentiment market_sentiment,
  market_phase market_phase,
  market_strength DECIMAL(3,2),
  market_description TEXT,
  
  -- Dados de volume
  volume_value BIGINT,
  volume_trend TEXT,
  volume_abnormal BOOLEAN DEFAULT false,
  volume_vs_average DECIMAL(5,2),
  volume_significance TEXT,
  
  -- Dados de volatilidade
  volatility_value DECIMAL(5,2),
  volatility_trend TEXT,
  volatility_atr DECIMAL(8,4),
  volatility_comparison TEXT,
  bollinger_upper DECIMAL(8,4),
  bollinger_lower DECIMAL(8,4),
  
  -- Análise dos mestres - Bulkowski
  bulkowski_pattern_name TEXT,
  bulkowski_reliability DECIMAL(3,2),
  bulkowski_average_move DECIMAL(5,2),
  bulkowski_failure_rate DECIMAL(3,2),
  bulkowski_breakout_direction TEXT,
  
  -- Análise dos mestres - Elder Triple Screen
  elder_long_term_trend TEXT,
  elder_medium_oscillator TEXT,
  elder_short_entry TEXT,
  elder_confidence DECIMAL(3,2),
  
  -- Análise dos mestres - Murphy
  murphy_trend_primary TEXT,
  murphy_trend_secondary TEXT,
  murphy_volume_analysis TEXT,
  murphy_support_resistance JSONB[], -- array de níveis S/R
  
  -- Recomendação integrada
  master_recommendation TEXT,
  overall_action action_type,
  overall_confidence DECIMAL(3,2),
  
  -- Sinais de scalping
  scalping_signals JSONB[], -- array de sinais
  
  -- Dados de preço (candlestick)
  candle_data JSONB[], -- array de dados de candles
  price_levels JSONB, -- níveis importantes de preço
  
  -- Indicadores técnicos
  rsi_value DECIMAL(5,2),
  macd_line DECIMAL(8,4),
  macd_signal DECIMAL(8,4),
  macd_histogram DECIMAL(8,4),
  stochastic_k DECIMAL(5,2),
  stochastic_d DECIMAL(5,2),
  ema_20 DECIMAL(8,4),
  ema_50 DECIMAL(8,4),
  sma_200 DECIMAL(8,4),
  
  -- Confluências e divergências
  confluences JSONB[], -- confluências identificadas
  divergences JSONB[], -- divergências identificadas
  
  -- Recomendações de entrada
  entry_recommendations JSONB[], -- recomendações específicas
  risk_reward_ratio DECIMAL(4,2),
  stop_loss_level DECIMAL(8,4),
  take_profit_levels DECIMAL(8,4)[],
  
  -- Timeframe da análise
  timeframe timeframe_type DEFAULT 'M15',
  
  -- Score geral da análise
  analysis_score DECIMAL(3,2),
  reliability_score DECIMAL(3,2)
);

-- Enable RLS
ALTER TABLE public.professional_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own analyses" 
ON public.professional_analyses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses" 
ON public.professional_analyses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" 
ON public.professional_analyses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" 
ON public.professional_analyses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_professional_analyses_user_id ON public.professional_analyses(user_id);
CREATE INDEX idx_professional_analyses_created_at ON public.professional_analyses(created_at DESC);
CREATE INDEX idx_professional_analyses_pattern ON public.professional_analyses(primary_pattern);
CREATE INDEX idx_professional_analyses_sentiment ON public.professional_analyses(market_sentiment);
CREATE INDEX idx_professional_analyses_timeframe ON public.professional_analyses(timeframe);
CREATE INDEX idx_professional_analyses_score ON public.professional_analyses(analysis_score DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_professional_analyses_updated_at
    BEFORE UPDATE ON public.professional_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para histórico de preços e dados de mercado
CREATE TABLE public.market_data_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.professional_analyses(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe timeframe_type NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- OHLCV data
  open_price DECIMAL(12,4) NOT NULL,
  high_price DECIMAL(12,4) NOT NULL,
  low_price DECIMAL(12,4) NOT NULL,
  close_price DECIMAL(12,4) NOT NULL,
  volume BIGINT NOT NULL,
  
  -- Indicadores calculados
  indicators JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for market data
ALTER TABLE public.market_data_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access market data for their analyses" 
ON public.market_data_snapshots 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.professional_analyses 
    WHERE id = market_data_snapshots.analysis_id 
    AND user_id = auth.uid()
  )
);

-- Índices para market data
CREATE INDEX idx_market_data_analysis_id ON public.market_data_snapshots(analysis_id);
CREATE INDEX idx_market_data_symbol_timeframe ON public.market_data_snapshots(symbol, timeframe);
CREATE INDEX idx_market_data_timestamp ON public.market_data_snapshots(timestamp DESC);