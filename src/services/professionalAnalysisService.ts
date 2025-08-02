import { supabase } from '@/integrations/supabase/client';

type AnalysisPatternType = 
  | 'bullish_engulfing'
  | 'bearish_engulfing'
  | 'hammer'
  | 'doji'
  | 'shooting_star'
  | 'hanging_man'
  | 'three_white_soldiers'
  | 'three_black_crows'
  | 'morning_star'
  | 'evening_star'
  | 'piercing_pattern'
  | 'dark_cloud_cover'
  | 'harami'
  | 'tweezers'
  | 'gap_up'
  | 'gap_down'
  | 'triangle'
  | 'wedge'
  | 'flag'
  | 'pennant'
  | 'head_shoulders'
  | 'double_top'
  | 'double_bottom'
  | 'support_resistance';

export interface ProfessionalAnalysisData {
  // Dados da imagem
  image_url?: string;
  image_metadata?: any;
  analysis_region?: any;
  
  // Padrões detectados
  patterns?: any[];
  pattern_count?: number;
  primary_pattern?: AnalysisPatternType;
  pattern_confidence?: number;
  
  // Análise de mercado
  market_sentiment?: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  market_phase?: 'accumulation' | 'markup' | 'distribution' | 'markdown';
  market_strength?: number;
  market_description?: string;
  
  // Dados de volume
  volume_value?: number;
  volume_trend?: string;
  volume_abnormal?: boolean;
  volume_vs_average?: number;
  volume_significance?: string;
  
  // Dados de volatilidade
  volatility_value?: number;
  volatility_trend?: string;
  volatility_atr?: number;
  volatility_comparison?: string;
  bollinger_upper?: number;
  bollinger_lower?: number;
  
  // Análise dos mestres - Bulkowski
  bulkowski_pattern_name?: string;
  bulkowski_reliability?: number;
  bulkowski_average_move?: number;
  bulkowski_failure_rate?: number;
  bulkowski_breakout_direction?: string;
  
  // Análise dos mestres - Elder Triple Screen
  elder_long_term_trend?: string;
  elder_medium_oscillator?: string;
  elder_short_entry?: string;
  elder_confidence?: number;
  
  // Análise dos mestres - Murphy
  murphy_trend_primary?: string;
  murphy_trend_secondary?: string;
  murphy_volume_analysis?: string;
  murphy_support_resistance?: any[];
  
  // Recomendação integrada
  master_recommendation?: string;
  overall_action?: 'compra' | 'venda' | 'neutro';
  overall_confidence?: number;
  
  // Sinais de scalping
  scalping_signals?: any[];
  
  // Dados de preço (candlestick)
  candle_data?: any[];
  price_levels?: any;
  
  // Indicadores técnicos
  rsi_value?: number;
  macd_line?: number;
  macd_signal?: number;
  macd_histogram?: number;
  stochastic_k?: number;
  stochastic_d?: number;
  ema_20?: number;
  ema_50?: number;
  sma_200?: number;
  
  // Confluências e divergências
  confluences?: any[];
  divergences?: any[];
  
  // Recomendações de entrada
  entry_recommendations?: any[];
  risk_reward_ratio?: number;
  stop_loss_level?: number;
  take_profit_levels?: number[];
  
  // Timeframe da análise
  timeframe?: 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1';
  
  // Score geral da análise
  analysis_score?: number;
  reliability_score?: number;
}

export interface MarketDataSnapshot {
  symbol: string;
  timeframe: 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1';
  timestamp: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  indicators?: any;
}

class ProfessionalAnalysisService {
  /**
   * Salva uma análise profissional completa no banco de dados
   */
  async saveAnalysis(analysisData: ProfessionalAnalysisData): Promise<{ id: string } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('professional_analyses')
        .insert({
          user_id: user.id,
          ...analysisData
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao salvar análise:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço de análise:', error);
      return null;
    }
  }

  /**
   * Busca análises do usuário com filtros opcionais
   */
  async getUserAnalyses(
    limit: number = 50,
    filters?: {
      sentiment?: 'bullish' | 'bearish' | 'neutral' | 'mixed';
      pattern?: AnalysisPatternType;
      timeframe?: 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1';
      minScore?: number;
    }
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      let query = supabase
        .from('professional_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Aplicar filtros se fornecidos
      if (filters?.sentiment) {
        query = query.eq('market_sentiment', filters.sentiment);
      }
      
      if (filters?.pattern) {
        query = query.eq('primary_pattern', filters.pattern);
      }
      
      if (filters?.timeframe) {
        query = query.eq('timeframe', filters.timeframe);
      }
      
      if (filters?.minScore) {
        query = query.gte('analysis_score', filters.minScore);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar análises:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço de busca:', error);
      return [];
    }
  }

  /**
   * Busca uma análise específica por ID
   */
  async getAnalysisById(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('professional_analyses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar análise:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço de busca:', error);
      return null;
    }
  }

  /**
   * Atualiza uma análise existente
   */
  async updateAnalysis(id: string, updatedData: Partial<ProfessionalAnalysisData>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('professional_analyses')
        .update(updatedData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar análise:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço de atualização:', error);
      return null;
    }
  }

  /**
   * Deleta uma análise
   */
  async deleteAnalysis(id: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('professional_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao deletar análise:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro no serviço de deleção:', error);
      return false;
    }
  }

  /**
   * Salva snapshot de dados de mercado relacionado a uma análise
   */
  async saveMarketDataSnapshot(analysisId: string, marketData: MarketDataSnapshot) {
    try {
      const { data, error } = await supabase
        .from('market_data_snapshots')
        .insert({
          analysis_id: analysisId,
          ...marketData
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar dados de mercado:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço de dados de mercado:', error);
      return null;
    }
  }

  /**
   * Busca estatísticas das análises do usuário
   */
  async getUserAnalyticsStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar estatísticas básicas
      const { data: stats, error: statsError } = await supabase
        .from('professional_analyses')
        .select('market_sentiment, overall_action, analysis_score, reliability_score, created_at')
        .eq('user_id', user.id);

      if (statsError) {
        console.error('Erro ao buscar estatísticas:', statsError);
        return null;
      }

      // Calcular métricas
      const totalAnalyses = stats?.length || 0;
      const bullishCount = stats?.filter(s => s.market_sentiment === 'bullish').length || 0;
      const bearishCount = stats?.filter(s => s.market_sentiment === 'bearish').length || 0;
      const buySignals = stats?.filter(s => s.overall_action === 'compra').length || 0;
      const sellSignals = stats?.filter(s => s.overall_action === 'venda').length || 0;
      
      const avgAnalysisScore = stats?.length 
        ? stats.reduce((acc, s) => acc + (s.analysis_score || 0), 0) / stats.length 
        : 0;
        
      const avgReliabilityScore = stats?.length 
        ? stats.reduce((acc, s) => acc + (s.reliability_score || 0), 0) / stats.length 
        : 0;

      return {
        totalAnalyses,
        sentimentDistribution: {
          bullish: bullishCount,
          bearish: bearishCount,
          neutral: totalAnalyses - bullishCount - bearishCount
        },
        actionDistribution: {
          buy: buySignals,
          sell: sellSignals,
          neutral: totalAnalyses - buySignals - sellSignals
        },
        averageScores: {
          analysis: avgAnalysisScore,
          reliability: avgReliabilityScore
        }
      };
    } catch (error) {
      console.error('Erro no serviço de estatísticas:', error);
      return null;
    }
  }

  /**
   * Converte dados de análise do formato atual para o formato da base de dados
   */
  convertAnalysisToDbFormat(analysisResults: any): ProfessionalAnalysisData {
    const dbData: ProfessionalAnalysisData = {};

    // Converter padrões
    if (analysisResults.patterns) {
      dbData.patterns = analysisResults.patterns;
      dbData.pattern_count = analysisResults.patterns.length;
      
      // Determinar padrão primário (o com maior confiança)
      if (analysisResults.patterns.length > 0) {
        const primaryPattern = analysisResults.patterns.reduce((prev: any, curr: any) => 
          (curr.confidence > prev.confidence) ? curr : prev
        );
        dbData.primary_pattern = primaryPattern.type;
        dbData.pattern_confidence = primaryPattern.confidence;
      }
    }

    // Converter contexto de mercado
    if (analysisResults.marketContext) {
      const mc = analysisResults.marketContext;
      dbData.market_sentiment = mc.sentiment;
      dbData.market_phase = mc.phase;
      dbData.market_strength = mc.strength;
      dbData.market_description = mc.description;
    }

    // Converter dados de volume
    if (analysisResults.volumeData) {
      const vd = analysisResults.volumeData;
      dbData.volume_value = vd.value;
      dbData.volume_trend = vd.trend;
      dbData.volume_abnormal = vd.abnormal;
      dbData.volume_vs_average = vd.relativeToAverage;
      dbData.volume_significance = vd.significance;
    }

    // Converter dados de volatilidade
    if (analysisResults.volatilityData) {
      const vod = analysisResults.volatilityData;
      dbData.volatility_value = vod.value;
      dbData.volatility_trend = vod.trend;
      dbData.volatility_atr = vod.atr;
      dbData.volatility_comparison = vod.historicalComparison;
      dbData.bollinger_upper = vod.bollingerBands?.upper;
      dbData.bollinger_lower = vod.bollingerBands?.lower;
    }

    // Converter análise dos mestres
    if (analysisResults.masterAnalysis) {
      const ma = analysisResults.masterAnalysis;
      
      // Bulkowski
      if (ma.bulkowski) {
        dbData.bulkowski_pattern_name = ma.bulkowski.name;
        dbData.bulkowski_reliability = ma.bulkowski.reliability;
        dbData.bulkowski_average_move = ma.bulkowski.averageMove;
        dbData.bulkowski_failure_rate = ma.bulkowski.failureRate;
        dbData.bulkowski_breakout_direction = ma.bulkowski.breakoutDirection;
      }
      
      // Elder
      if (ma.tripleScreen) {
        dbData.elder_long_term_trend = ma.tripleScreen.longTermTrend;
        dbData.elder_medium_oscillator = ma.tripleScreen.mediumTermOscillator;
        dbData.elder_short_entry = ma.tripleScreen.shortTermEntry;
        dbData.elder_confidence = ma.tripleScreen.confidence;
      }
      
      // Murphy
      if (ma.murphy) {
        dbData.murphy_trend_primary = ma.murphy.trendAnalysis?.primary;
        dbData.murphy_trend_secondary = ma.murphy.trendAnalysis?.secondary;
        dbData.murphy_volume_analysis = ma.murphy.volumeAnalysis?.trend;
        dbData.murphy_support_resistance = ma.murphy.supportResistance;
      }
      
      dbData.master_recommendation = ma.masterRecommendation;
    }

    // Converter sinais de scalping
    if (analysisResults.scalpingSignals) {
      dbData.scalping_signals = analysisResults.scalpingSignals;
    }

    // Converter dados de candles
    if (analysisResults.candles) {
      dbData.candle_data = analysisResults.candles;
    }

    // Converter confluências e divergências
    if (analysisResults.confluences) {
      dbData.confluences = analysisResults.confluences;
    }
    
    if (analysisResults.divergences) {
      dbData.divergences = analysisResults.divergences;
    }

    // Converter recomendações de entrada
    if (analysisResults.entryRecommendations) {
      dbData.entry_recommendations = analysisResults.entryRecommendations;
    }

    // Definir scores baseados na análise
    if (analysisResults.patterns && analysisResults.patterns.length > 0) {
      const avgConfidence = analysisResults.patterns.reduce((acc: number, p: any) => acc + (p.confidence || 0), 0) / analysisResults.patterns.length;
      dbData.analysis_score = avgConfidence;
      dbData.reliability_score = avgConfidence * 0.9; // Um pouco menor que o score de análise
    }

    // Definir timeframe padrão
    dbData.timeframe = 'M15';

    return dbData;
  }
}

export const professionalAnalysisService = new ProfessionalAnalysisService();