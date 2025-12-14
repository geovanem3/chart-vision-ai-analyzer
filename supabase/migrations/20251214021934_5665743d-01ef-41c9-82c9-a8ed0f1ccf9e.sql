-- Biblioteca de padrões de candlestick para análise local
CREATE TABLE public.pattern_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name text NOT NULL UNIQUE,
  pattern_type text NOT NULL CHECK (pattern_type IN ('bullish', 'bearish', 'neutral')),
  description text,
  reliability_score numeric DEFAULT 0.5,
  average_move_percent numeric DEFAULT 0,
  failure_rate numeric DEFAULT 0.3,
  confirmation_required boolean DEFAULT true,
  volume_requirement text DEFAULT 'normal',
  timeframe_preference text[] DEFAULT ARRAY['M15', 'H1', 'H4'],
  visual_characteristics jsonb,
  entry_rules jsonb,
  exit_rules jsonb,
  created_at timestamptz DEFAULT now()
);

-- Regras de indicadores técnicos para análise local
CREATE TABLE public.indicator_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_name text NOT NULL,
  rule_name text NOT NULL,
  condition_type text NOT NULL CHECK (condition_type IN ('oversold', 'overbought', 'crossover', 'divergence', 'trend', 'range')),
  signal_type text NOT NULL CHECK (signal_type IN ('buy', 'sell', 'neutral', 'warning')),
  threshold_min numeric,
  threshold_max numeric,
  weight numeric DEFAULT 1.0,
  description text,
  parameters jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(indicator_name, rule_name)
);

-- Cache de análises da IA para reutilização
CREATE TABLE public.analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  market_conditions_hash text NOT NULL,
  timeframe text NOT NULL,
  analysis_result jsonb NOT NULL,
  patterns_detected text[],
  sentiment text,
  confidence_score numeric,
  hit_count integer DEFAULT 1,
  last_used_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

-- Configurações de análise por usuário
CREATE TABLE public.user_analysis_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  preferred_timeframes text[] DEFAULT ARRAY['M15', 'H1'],
  risk_tolerance text DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  min_confidence_threshold numeric DEFAULT 60,
  use_ai_when_available boolean DEFAULT true,
  fallback_to_local boolean DEFAULT true,
  indicators_enabled text[] DEFAULT ARRAY['RSI', 'MACD', 'EMA', 'BOLLINGER'],
  patterns_enabled text[] DEFAULT ARRAY['hammer', 'doji', 'engulfing', 'morning_star', 'evening_star'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Histórico de decisões de análise (audit trail)
CREATE TABLE public.analysis_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analysis_source text NOT NULL CHECK (analysis_source IN ('ai', 'local', 'cache', 'hybrid')),
  decision_type text NOT NULL CHECK (decision_type IN ('buy', 'sell', 'hold', 'wait')),
  confidence_score numeric,
  patterns_used text[],
  indicators_used text[],
  price_at_decision numeric,
  timeframe text,
  reasoning jsonb,
  outcome text,
  outcome_recorded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pattern_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analysis_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_decisions ENABLE ROW LEVEL SECURITY;

-- Pattern library é público (leitura)
CREATE POLICY "Anyone can read pattern library" ON public.pattern_library FOR SELECT USING (true);

-- Indicator rules é público (leitura)
CREATE POLICY "Anyone can read indicator rules" ON public.indicator_rules FOR SELECT USING (true);

-- Analysis cache é público (leitura) - compartilhado entre usuários
CREATE POLICY "Anyone can read analysis cache" ON public.analysis_cache FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert cache" ON public.analysis_cache FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update cache" ON public.analysis_cache FOR UPDATE USING (auth.uid() IS NOT NULL);

-- User settings - apenas o próprio usuário
CREATE POLICY "Users can manage their own settings" ON public.user_analysis_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Analysis decisions - apenas o próprio usuário
CREATE POLICY "Users can manage their own decisions" ON public.analysis_decisions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_analysis_cache_key ON public.analysis_cache(cache_key);
CREATE INDEX idx_analysis_cache_conditions ON public.analysis_cache(market_conditions_hash);
CREATE INDEX idx_analysis_cache_expires ON public.analysis_cache(expires_at);
CREATE INDEX idx_analysis_decisions_user ON public.analysis_decisions(user_id, created_at DESC);
CREATE INDEX idx_pattern_library_type ON public.pattern_library(pattern_type);
CREATE INDEX idx_indicator_rules_name ON public.indicator_rules(indicator_name);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_analysis_settings_updated_at
  BEFORE UPDATE ON public.user_analysis_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir padrões básicos de candlestick
INSERT INTO public.pattern_library (pattern_name, pattern_type, description, reliability_score, average_move_percent, failure_rate, visual_characteristics, entry_rules, exit_rules) VALUES
('hammer', 'bullish', 'Martelo - reversão de baixa para alta', 0.65, 2.5, 0.35, 
  '{"body_position": "upper", "lower_shadow": "long", "upper_shadow": "none_or_small", "body_size": "small"}',
  '{"confirmation": "next_candle_bullish", "volume": "above_average"}',
  '{"stop_loss": "below_hammer_low", "take_profit": "2x_body_size"}'),
('doji', 'neutral', 'Doji - indecisão do mercado', 0.50, 1.0, 0.50,
  '{"body_size": "very_small", "shadows": "equal_or_similar", "open_close": "same_or_very_close"}',
  '{"confirmation": "wait_next_candle", "context": "important_at_extremes"}',
  '{"depends_on": "confirmation_direction"}'),
('bullish_engulfing', 'bullish', 'Engolfo de alta - forte reversão', 0.75, 3.0, 0.25,
  '{"first_candle": "bearish_small", "second_candle": "bullish_large", "engulfs": "body_completely"}',
  '{"confirmation": "immediate_or_next_candle", "volume": "high_on_second"}',
  '{"stop_loss": "below_pattern_low", "take_profit": "previous_resistance"}'),
('bearish_engulfing', 'bearish', 'Engolfo de baixa - forte reversão', 0.75, 3.0, 0.25,
  '{"first_candle": "bullish_small", "second_candle": "bearish_large", "engulfs": "body_completely"}',
  '{"confirmation": "immediate_or_next_candle", "volume": "high_on_second"}',
  '{"stop_loss": "above_pattern_high", "take_profit": "previous_support"}'),
('morning_star', 'bullish', 'Estrela da Manhã - reversão forte de 3 velas', 0.80, 4.0, 0.20,
  '{"first": "bearish_large", "second": "small_body_gap_down", "third": "bullish_large_closes_above_first_mid"}',
  '{"confirmation": "third_candle_is_confirmation", "volume": "increasing"}',
  '{"stop_loss": "below_second_candle_low", "take_profit": "measured_move"}'),
('evening_star', 'bearish', 'Estrela da Noite - reversão forte de 3 velas', 0.80, 4.0, 0.20,
  '{"first": "bullish_large", "second": "small_body_gap_up", "third": "bearish_large_closes_below_first_mid"}',
  '{"confirmation": "third_candle_is_confirmation", "volume": "increasing"}',
  '{"stop_loss": "above_second_candle_high", "take_profit": "measured_move"}'),
('shooting_star', 'bearish', 'Estrela Cadente - reversão no topo', 0.65, 2.5, 0.35,
  '{"body_position": "lower", "upper_shadow": "long", "lower_shadow": "none_or_small", "body_size": "small"}',
  '{"confirmation": "next_candle_bearish", "location": "after_uptrend"}',
  '{"stop_loss": "above_shadow_high", "take_profit": "2x_body_size"}'),
('hanging_man', 'bearish', 'Homem Enforcado - possível reversão no topo', 0.55, 2.0, 0.45,
  '{"body_position": "upper", "lower_shadow": "long", "upper_shadow": "none_or_small", "location": "after_uptrend"}',
  '{"confirmation": "required_bearish_next", "volume": "important"}',
  '{"stop_loss": "above_high", "take_profit": "previous_support"}'),
('three_white_soldiers', 'bullish', 'Três Soldados Brancos - forte continuação de alta', 0.85, 5.0, 0.15,
  '{"three_candles": "bullish", "opens": "within_previous_body", "closes": "near_highs", "bodies": "increasing_or_similar"}',
  '{"confirmation": "pattern_is_confirmation", "volume": "steady_or_increasing"}',
  '{"stop_loss": "below_first_soldier_low", "take_profit": "measured_move"}'),
('three_black_crows', 'bearish', 'Três Corvos Negros - forte continuação de baixa', 0.85, 5.0, 0.15,
  '{"three_candles": "bearish", "opens": "within_previous_body", "closes": "near_lows", "bodies": "increasing_or_similar"}',
  '{"confirmation": "pattern_is_confirmation", "volume": "steady_or_increasing"}',
  '{"stop_loss": "above_first_crow_high", "take_profit": "measured_move"}');

-- Inserir regras de indicadores
INSERT INTO public.indicator_rules (indicator_name, rule_name, condition_type, signal_type, threshold_min, threshold_max, weight, description, parameters) VALUES
('RSI', 'oversold_extreme', 'oversold', 'buy', 0, 20, 1.5, 'RSI abaixo de 20 - sobrevenda extrema', '{"period": 14}'),
('RSI', 'oversold_moderate', 'oversold', 'buy', 20, 30, 1.0, 'RSI entre 20-30 - sobrevenda moderada', '{"period": 14}'),
('RSI', 'overbought_extreme', 'overbought', 'sell', 80, 100, 1.5, 'RSI acima de 80 - sobrecompra extrema', '{"period": 14}'),
('RSI', 'overbought_moderate', 'overbought', 'sell', 70, 80, 1.0, 'RSI entre 70-80 - sobrecompra moderada', '{"period": 14}'),
('RSI', 'neutral_zone', 'range', 'neutral', 40, 60, 0.5, 'RSI na zona neutra', '{"period": 14}'),
('MACD', 'bullish_crossover', 'crossover', 'buy', null, null, 1.2, 'MACD cruza acima da linha de sinal', '{"fast": 12, "slow": 26, "signal": 9}'),
('MACD', 'bearish_crossover', 'crossover', 'sell', null, null, 1.2, 'MACD cruza abaixo da linha de sinal', '{"fast": 12, "slow": 26, "signal": 9}'),
('MACD', 'bullish_divergence', 'divergence', 'buy', null, null, 1.5, 'Preço faz mínimas mais baixas, MACD faz mínimas mais altas', '{}'),
('MACD', 'bearish_divergence', 'divergence', 'sell', null, null, 1.5, 'Preço faz máximas mais altas, MACD faz máximas mais baixas', '{}'),
('EMA', 'golden_cross', 'crossover', 'buy', null, null, 1.3, 'EMA curta cruza acima da EMA longa', '{"short": 20, "long": 50}'),
('EMA', 'death_cross', 'crossover', 'sell', null, null, 1.3, 'EMA curta cruza abaixo da EMA longa', '{"short": 20, "long": 50}'),
('EMA', 'price_above_ema200', 'trend', 'buy', null, null, 0.8, 'Preço acima da EMA 200 - tendência de alta', '{"period": 200}'),
('EMA', 'price_below_ema200', 'trend', 'sell', null, null, 0.8, 'Preço abaixo da EMA 200 - tendência de baixa', '{"period": 200}'),
('BOLLINGER', 'touch_lower_band', 'oversold', 'buy', null, null, 1.0, 'Preço toca banda inferior de Bollinger', '{"period": 20, "std": 2}'),
('BOLLINGER', 'touch_upper_band', 'overbought', 'sell', null, null, 1.0, 'Preço toca banda superior de Bollinger', '{"period": 20, "std": 2}'),
('BOLLINGER', 'squeeze', 'range', 'warning', null, null, 1.2, 'Bandas de Bollinger contraídas - movimento iminente', '{"period": 20, "std": 2}'),
('STOCHASTIC', 'oversold', 'oversold', 'buy', 0, 20, 1.0, 'Estocástico abaixo de 20', '{"k": 14, "d": 3}'),
('STOCHASTIC', 'overbought', 'overbought', 'sell', 80, 100, 1.0, 'Estocástico acima de 80', '{"k": 14, "d": 3}'),
('STOCHASTIC', 'bullish_crossover', 'crossover', 'buy', null, null, 1.1, '%K cruza acima de %D em zona de sobrevenda', '{"k": 14, "d": 3}'),
('STOCHASTIC', 'bearish_crossover', 'crossover', 'sell', null, null, 1.1, '%K cruza abaixo de %D em zona de sobrecompra', '{"k": 14, "d": 3}'),
('VOLUME', 'above_average', 'trend', 'warning', null, null, 0.7, 'Volume acima da média - confirmação de movimento', '{"period": 20}'),
('VOLUME', 'climax', 'trend', 'warning', null, null, 1.0, 'Volume extremamente alto - possível exaustão', '{"threshold": 2.5}');