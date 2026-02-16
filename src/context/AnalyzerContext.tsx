import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { analyzeChartWithAI, convertAIAnalysisToPatterns, AIAnalysisResult, AnalysisSource } from '../services/chartAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { convertAIToDbFormat, convertDbToSavedAnalysis, SavedAnalysis } from '@/hooks/useAnalysisPersistence';

export type PatternResult = {
  type: string;
  confidence: number;
  description: string;
  recommendation?: string;
  action?: 'compra' | 'venda' | 'neutro';
};

export type Point = {
  x: number;
  y: number;
};

export type TechnicalElement = {
  type: 'line' | 'arrow' | 'rectangle' | 'circle' | 'label' | 'pattern';
  color: string;
  thickness?: number;
  dashArray?: number[];
  label?: string;
  backgroundColor?: string;
} & (
  | { type: 'line', points: Point[] }
  | { type: 'arrow', start: Point, end: Point }
  | { type: 'rectangle', position: Point, width: number, height: number }
  | { type: 'circle', center: Point, radius: number }
  | { type: 'label', position: Point, text: string, backgroundColor?: string }
  | { type: 'pattern', patternType: string, points: Point[] }
);

export type MarketContext = {
  phase: string;
  sentiment: string;
  volatility: string;
  description: string;
  trend: string;
  trendStrength: number;
};

export type AnalysisResult = {
  id?: string;
  patterns: PatternResult[];
  timestamp: number;
  imageUrl?: string;
  warnings?: string[];
  marketContext?: MarketContext;
  supportLevels?: string[];
  resistanceLevels?: string[];
  recommendation?: {
    action: string;
    confidence: number;
    reasoning: string;
    riskLevel: string;
  };
  fearGreedAnalysis?: {
    level: string;
    score: number;
    signals: string[];
    interpretation: string;
  };
  smartMoney?: {
    detected: boolean;
    action: string;
    evidence: string[];
    entryZone: string;
    confidence: number;
  };
  savedToDb?: boolean;
  source?: AnalysisSource;
};

export type RegionType = 'rectangle' | 'circle';

export type RectangleRegion = {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CircleRegion = {
  type: 'circle';
  centerX: number;
  centerY: number;
  radius: number;
};

export type SelectedRegion = RectangleRegion | CircleRegion;

export type MarkupSize = 'small' | 'medium' | 'large';

export type MarkupToolType = 'line' | 'arrow' | 'rectangle' | 'circle' | 'label';

export type TimeframeType = '1m' | '5m';
export type AnalysisModeType = 'full' | 'single_candle';

type AnalyzerContextType = {
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  analysisResults: AnalysisResult | null;
  setAnalysisResults: (results: AnalysisResult | null) => void;
  selectedRegion: SelectedRegion | null;
  setSelectedRegion: (region: SelectedRegion | null) => void;
  resetAnalysis: () => void;
  showTechnicalMarkup: boolean;
  setShowTechnicalMarkup: (show: boolean) => void;
  regionType: RegionType;
  setRegionType: (type: RegionType) => void;
  isManualAdjustment: boolean;
  setIsManualAdjustment: (manual: boolean) => void;
  markupSize: MarkupSize;
  setMarkupSize: (size: MarkupSize) => void;
  manualMarkupTool: MarkupToolType;
  setManualMarkupTool: (tool: MarkupToolType) => void;
  manualMarkups: TechnicalElement[];
  addManualMarkup: (markup: TechnicalElement) => void;
  clearManualMarkups: () => void;
  removeLastMarkup: () => void;
  isMarkupMode: boolean;
  setMarkupMode: (enabled: boolean) => void;
  timeframe: TimeframeType;
  setTimeframe: (timeframe: TimeframeType) => void;
  analysisMode: AnalysisModeType;
  setAnalysisMode: (mode: AnalysisModeType) => void;
  forceFailure: boolean;
  setForceFailure: (force: boolean) => void;
  analyzeChartRegion: (imageUrl: string, region?: SelectedRegion) => Promise<void>;
  loadLastAnalysis: () => Promise<AnalysisResult | null>;
  recentAnalyses: SavedAnalysis[];
  loadRecentAnalyses: () => Promise<void>;
};

export const AnalyzerContext = createContext<AnalyzerContextType | undefined>(undefined);

export const AnalyzerProvider = ({ children }: { children: ReactNode }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<SelectedRegion | null>(null);
  const [showTechnicalMarkup, setShowTechnicalMarkup] = useState(true);
  const [regionType, setRegionType] = useState<RegionType>('circle');
  const [isManualAdjustment, setIsManualAdjustment] = useState(false);
  const [markupSize, setMarkupSize] = useState<MarkupSize>('medium');
  const [manualMarkupTool, setManualMarkupTool] = useState<MarkupToolType>('line');
  const [manualMarkups, setManualMarkups] = useState<TechnicalElement[]>([]);
  const [isMarkupMode, setMarkupMode] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeType>('1m');
  const [analysisMode, setAnalysisMode] = useState<AnalysisModeType>('full');
  const [forceFailure, setForceFailure] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<SavedAnalysis[]>([]);

  const resetAnalysis = () => {
    setCapturedImage(null);
    setIsAnalyzing(false);
    setAnalysisResults(null);
    setSelectedRegion(null);
  };

  const addManualMarkup = (markup: TechnicalElement) => {
    setManualMarkups(prev => [...prev, markup]);
  };

  const clearManualMarkups = () => {
    setManualMarkups([]);
  };

  const removeLastMarkup = () => {
    setManualMarkups(prev => prev.slice(0, -1));
  };

  // Save analysis to database
  const saveAnalysisToDb = async (
    aiResult: AIAnalysisResult,
    imageUrl?: string
  ): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('⚠️ Usuário não autenticado - análise não será salva');
        return null;
      }

      const dbData = convertAIToDbFormat(aiResult, imageUrl, timeframe, 'capture');
      
      const { data, error } = await supabase
        .from('professional_analyses')
        .insert({
          user_id: user.id,
          ...dbData
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Erro ao salvar análise:', error);
        return null;
      }

      console.log('✅ Análise salva no banco com ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ Erro ao salvar análise:', error);
      return null;
    }
  };

  // Load last analysis from database (fallback)
  const loadLastAnalysis = useCallback(async (): Promise<AnalysisResult | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('professional_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        console.log('Nenhuma análise anterior encontrada');
        return null;
      }

      const saved = convertDbToSavedAnalysis(data);
      
      // Convert to AnalysisResult format
      const result: AnalysisResult = {
        id: saved.id,
        patterns: saved.patterns.map(p => ({
          type: p,
          confidence: saved.confidence,
          description: saved.reasoning
        })),
        timestamp: saved.timestamp,
        imageUrl: saved.imageUrl,
        supportLevels: saved.supportLevels,
        resistanceLevels: saved.resistanceLevels,
        recommendation: {
          action: saved.signal,
          confidence: saved.confidence,
          reasoning: saved.reasoning,
          riskLevel: saved.riskLevel
        },
        marketContext: {
          phase: '',
          sentiment: saved.trend,
          volatility: 'normal',
          description: saved.reasoning,
          trend: saved.trend,
          trendStrength: saved.confidence
        },
        savedToDb: true
      };

      console.log('✅ Análise anterior carregada do banco');
      return result;
    } catch (error) {
      console.error('❌ Erro ao carregar análise:', error);
      return null;
    }
  }, []);

  // Load recent analyses
  const loadRecentAnalyses = useCallback(async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('professional_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Erro ao carregar análises recentes:', error);
        return;
      }

      const analyses = (data || []).map(convertDbToSavedAnalysis);
      setRecentAnalyses(analyses);
      console.log(`✅ ${analyses.length} análises recentes carregadas`);
    } catch (error) {
      console.error('❌ Erro ao carregar análises:', error);
    }
  }, []);

  const analyzeChartRegion = async (imageUrl: string, region?: SelectedRegion) => {
    setIsAnalyzing(true);
    
    try {
      console.log('🔍 Iniciando análise...');
      
      // Análise com IA (com fallback automático do backend)
      // Se forceFailure está ativo, simular falha para testar fallback
      if (forceFailure) {
        console.warn('🧪 STRESS TEST: Forçando falha da IA para testar fallbacks');
        throw new Error('STRESS_TEST: Falha forçada para teste de fallback');
      }

      const response = await analyzeChartWithAI(imageUrl, timeframe, analysisMode);
      const aiAnalysis = response.analysis;
      const analysisSource = response.source;
      const aiPatterns = convertAIAnalysisToPatterns(aiAnalysis);
      
      if (analysisSource !== 'ai') {
        console.warn(`⚠️ Usando fallback: ${analysisSource} - ${response.fallbackReason}`);
      } else {
        console.log('✅ Análise com IA concluída:', aiAnalysis);
      }

      // Salvar no banco de dados (apenas se veio da IA real)
      const savedId = analysisSource === 'ai' ? await saveAnalysisToDb(aiAnalysis, imageUrl) : null;

      // Construir resultado final
      const results: AnalysisResult = {
        id: savedId || undefined,
        patterns: aiPatterns,
        timestamp: Date.now(),
        imageUrl,
        warnings: aiAnalysis.warnings || [],
        supportLevels: aiAnalysis.supportLevels,
        resistanceLevels: aiAnalysis.resistanceLevels,
        recommendation: {
          action: aiAnalysis.recommendation.action,
          confidence: aiAnalysis.recommendation.confidence,
          reasoning: aiAnalysis.recommendation.reasoning,
          riskLevel: aiAnalysis.recommendation.riskLevel
        },
        marketContext: {
          phase: aiAnalysis.marketContext.phase,
          sentiment: aiAnalysis.marketContext.sentiment,
          volatility: aiAnalysis.marketContext.volatility,
          description: aiAnalysis.recommendation.reasoning,
          trend: aiAnalysis.trend,
          trendStrength: aiAnalysis.trendStrength
        },
        fearGreedAnalysis: aiAnalysis.fearGreedAnalysis,
        smartMoney: aiAnalysis.smartMoney,
        savedToDb: !!savedId,
        source: analysisSource
      };

      setAnalysisResults(results);
      
      // Atualizar lista de análises recentes
      loadRecentAnalyses();
      
      console.log('✅ Análise finalizada e salva com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro durante análise:', error);
      
      // Tentar carregar última análise do banco como fallback
      console.log('🔄 Tentando carregar última análise do banco...');
      const lastAnalysis = await loadLastAnalysis();
      
      if (lastAnalysis) {
        setAnalysisResults({
          ...lastAnalysis,
          warnings: [
            'Erro na análise em tempo real. Exibindo última análise salva.',
            (error as Error).message
          ]
        });
      } else {
        setAnalysisResults({
          patterns: [],
          timestamp: Date.now(),
          warnings: ['Erro durante a análise: ' + (error as Error).message]
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AnalyzerContext.Provider
      value={{
        capturedImage,
        setCapturedImage,
        isAnalyzing,
        setIsAnalyzing,
        analysisResults,
        setAnalysisResults,
        selectedRegion,
        setSelectedRegion,
        resetAnalysis,
        showTechnicalMarkup,
        setShowTechnicalMarkup,
        regionType,
        setRegionType,
        isManualAdjustment,
        setIsManualAdjustment,
        markupSize,
        setMarkupSize,
        manualMarkupTool,
        setManualMarkupTool,
        manualMarkups,
        addManualMarkup,
        clearManualMarkups,
        removeLastMarkup,
        isMarkupMode,
        setMarkupMode,
        timeframe,
        setTimeframe,
        analysisMode,
        setAnalysisMode,
        forceFailure,
        setForceFailure,
        analyzeChartRegion,
        loadLastAnalysis,
        recentAnalyses,
        loadRecentAnalyses,
      }}
    >
      {children}
    </AnalyzerContext.Provider>
  );
};

export const useAnalyzer = () => {
  const context = useContext(AnalyzerContext);
  if (context === undefined) {
    throw new Error('useAnalyzer must be used within an AnalyzerProvider');
  }
  return context;
};
