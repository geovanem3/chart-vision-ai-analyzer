import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIAnalysisResult } from '@/services/chartAnalysisService';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type AnalysisRow = Database['public']['Tables']['professional_analyses']['Row'];
type AnalysisInsert = Database['public']['Tables']['professional_analyses']['Insert'];

export interface SavedAnalysis {
  id: string;
  timestamp: number;
  signal: 'compra' | 'venda' | 'neutro';
  confidence: number;
  trend: 'bullish' | 'bearish' | 'lateral';
  patterns: string[];
  reasoning: string;
  riskLevel: string;
  supportLevels: string[];
  resistanceLevels: string[];
  imageUrl?: string;
  timeframe?: string;
  source: 'capture' | 'live';
}

// Convert AI analysis result to database format
export const convertAIToDbFormat = (
  aiResult: AIAnalysisResult,
  imageUrl?: string,
  timeframe?: string,
  source: 'capture' | 'live' = 'capture'
): Partial<AnalysisInsert> => {
  // Map AI trend to database sentiment
  const sentimentMap: Record<string, 'bullish' | 'bearish' | 'neutral'> = {
    bullish: 'bullish',
    bearish: 'bearish',
    lateral: 'neutral'
  };

  // Map timeframe string to database enum
  const timeframeMap: Record<string, 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1'> = {
    '1m': 'M1',
    '5m': 'M5',
    '15m': 'M15',
    '30m': 'M30',
    '1h': 'H1',
    '4h': 'H4',
    '1d': 'D1',
    '1w': 'W1'
  };

  return {
    image_url: imageUrl,
    patterns: aiResult.patterns.map(p => ({
      type: p.type,
      confidence: p.confidence,
      description: p.description,
      location: p.location
    })),
    pattern_count: aiResult.patterns.length,
    primary_pattern: aiResult.patterns.length > 0 
      ? (aiResult.patterns[0].type.toLowerCase().replace(/\s+/g, '_') as any)
      : null,
    pattern_confidence: aiResult.patterns.length > 0 
      ? Math.min(aiResult.patterns[0].confidence <= 1 ? aiResult.patterns[0].confidence * 100 : aiResult.patterns[0].confidence, 99999)
      : null,
    market_sentiment: sentimentMap[aiResult.trend] || 'neutral',
    market_phase: aiResult.marketContext.phase.toLowerCase().includes('acumul') 
      ? 'accumulation' 
      : aiResult.marketContext.phase.toLowerCase().includes('distrib') 
        ? 'distribution' 
        : aiResult.marketContext.phase.toLowerCase().includes('alta') || aiResult.marketContext.phase.toLowerCase().includes('markup')
          ? 'markup'
          : 'markdown',
    market_strength: Math.min(aiResult.trendStrength <= 1 ? aiResult.trendStrength * 100 : aiResult.trendStrength, 99999),
    market_description: aiResult.recommendation.reasoning,
    overall_action: aiResult.recommendation.action,
    overall_confidence: Math.min(aiResult.recommendation.confidence <= 1 ? aiResult.recommendation.confidence * 100 : aiResult.recommendation.confidence, 99999),
    analysis_score: Math.min(aiResult.recommendation.confidence <= 1 ? aiResult.recommendation.confidence * 100 : aiResult.recommendation.confidence, 99999),
    reliability_score: Math.min(aiResult.trendStrength <= 1 ? aiResult.trendStrength * 100 : aiResult.trendStrength, 99999),
    risk_level: aiResult.recommendation.riskLevel,
    timeframe: timeframe ? timeframeMap[timeframe] : 'M15',
    price_levels: {
      support: aiResult.supportLevels,
      resistance: aiResult.resistanceLevels
    },
    smart_analysis_result: {
      trend: aiResult.trend,
      trendStrength: aiResult.trendStrength,
      patterns: aiResult.patterns,
      recommendation: aiResult.recommendation,
      marketContext: aiResult.marketContext,
      supportLevels: aiResult.supportLevels,
      resistanceLevels: aiResult.resistanceLevels,
      warnings: aiResult.warnings,
      source,
      analyzedAt: new Date().toISOString()
    }
  };
};

// Convert database row to SavedAnalysis format
export const convertDbToSavedAnalysis = (row: AnalysisRow): SavedAnalysis => {
  const smartResult = row.smart_analysis_result as any;
  
  return {
    id: row.id,
    timestamp: new Date(row.created_at).getTime(),
    signal: row.overall_action || 'neutro',
    confidence: row.overall_confidence || 0,
    trend: smartResult?.trend || 'lateral',
    patterns: row.patterns?.map((p: any) => p.type || p) || [],
    reasoning: row.market_description || smartResult?.recommendation?.reasoning || '',
    riskLevel: row.risk_level || 'médio',
    supportLevels: smartResult?.supportLevels || (row.price_levels as any)?.support || [],
    resistanceLevels: smartResult?.resistanceLevels || (row.price_levels as any)?.resistance || [],
    imageUrl: row.image_url || undefined,
    timeframe: row.timeframe || undefined,
    source: smartResult?.source || 'capture'
  };
};

export const useAnalysisPersistence = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  // Save analysis to database
  const saveAnalysis = useCallback(async (
    aiResult: AIAnalysisResult,
    imageUrl?: string,
    timeframe?: string,
    source: 'capture' | 'live' = 'capture'
  ): Promise<string | null> => {
    if (!user) {
      console.warn('⚠️ Usuário não autenticado - análise não será salva no banco');
      return null;
    }

    setIsSaving(true);
    
    try {
      const dbData = convertAIToDbFormat(aiResult, imageUrl, timeframe, source);
      
      const { data, error } = await supabase
        .from('professional_analyses')
        .insert({
          user_id: user.id,
          ...dbData
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Erro ao salvar análise no banco:', error);
        return null;
      }

      console.log('✅ Análise salva no banco com ID:', data.id);
      setLastSavedId(data.id);
      return data.id;
      
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar análise:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  // Get recent analyses from database
  const getRecentAnalyses = useCallback(async (
    limit: number = 10,
    source?: 'capture' | 'live'
  ): Promise<SavedAnalysis[]> => {
    if (!user) {
      console.warn('⚠️ Usuário não autenticado');
      return [];
    }

    try {
      let query = supabase
        .from('professional_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar análises:', error);
        return [];
      }

      const analyses = (data || [])
        .map(convertDbToSavedAnalysis)
        .filter(a => !source || a.source === source);

      console.log(`✅ ${analyses.length} análises carregadas do banco`);
      return analyses;
      
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar análises:', error);
      return [];
    }
  }, [user]);

  // Get the last analysis from database (for fallback when AI fails)
  const getLastAnalysis = useCallback(async (
    source?: 'capture' | 'live'
  ): Promise<SavedAnalysis | null> => {
    const analyses = await getRecentAnalyses(1, source);
    return analyses[0] || null;
  }, [getRecentAnalyses]);

  // Get analysis by ID
  const getAnalysisById = useCallback(async (id: string): Promise<SavedAnalysis | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('professional_analyses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.error('❌ Erro ao buscar análise por ID:', error);
        return null;
      }

      return convertDbToSavedAnalysis(data);
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      return null;
    }
  }, [user]);

  // Get analysis statistics
  const getAnalysisStats = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('professional_analyses')
        .select('overall_action, market_sentiment, overall_confidence, created_at')
        .eq('user_id', user.id);

      if (error || !data) return null;

      const total = data.length;
      const buySignals = data.filter(d => d.overall_action === 'compra').length;
      const sellSignals = data.filter(d => d.overall_action === 'venda').length;
      const avgConfidence = data.reduce((acc, d) => acc + (d.overall_confidence || 0), 0) / total;

      return {
        total,
        buySignals,
        sellSignals,
        neutralSignals: total - buySignals - sellSignals,
        avgConfidence: avgConfidence || 0
      };
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return null;
    }
  }, [user]);

  return {
    saveAnalysis,
    getRecentAnalyses,
    getLastAnalysis,
    getAnalysisById,
    getAnalysisStats,
    isSaving,
    lastSavedId,
    isAuthenticated: !!user
  };
};
