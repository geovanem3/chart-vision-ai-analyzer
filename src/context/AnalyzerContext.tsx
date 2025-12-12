import React, { createContext, useContext, useState, ReactNode } from 'react';
import { analyzeChartWithAI, convertAIAnalysisToPatterns, AIAnalysisResult } from '../services/chartAnalysisService';

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

export type TimeframeType = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

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
  analyzeChartRegion: (imageUrl: string, region?: SelectedRegion) => Promise<void>;
};

const AnalyzerContext = createContext<AnalyzerContextType | undefined>(undefined);

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

  const analyzeChartRegion = async (imageUrl: string, region?: SelectedRegion) => {
    setIsAnalyzing(true);
    
    try {
      console.log('🔍 Iniciando análise com IA Gemini...');
      
      // Análise com IA real
      const aiAnalysis: AIAnalysisResult = await analyzeChartWithAI(imageUrl, timeframe);
      const aiPatterns = convertAIAnalysisToPatterns(aiAnalysis);
      
      console.log('✅ Análise com IA concluída:', aiAnalysis);

      // Construir resultado final
      const results: AnalysisResult = {
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
        }
      };

      setAnalysisResults(results);
      console.log('✅ Análise finalizada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro durante análise:', error);
      setAnalysisResults({
        patterns: [],
        timestamp: Date.now(),
        warnings: ['Erro durante a análise: ' + (error as Error).message]
      });
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
        analyzeChartRegion,
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
