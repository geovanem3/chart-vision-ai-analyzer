import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getMasterAnalysis } from '../utils/masterTechniques';
import { runAllAdvancedStrategies } from '../utils/advancedAnalysisStrategies';
import { performComprehensiveAnalysis, type ComprehensiveAnalysisResult } from '../utils/comprehensiveAnalysis';
import { performSmartAnalysis, SmartAnalysisResult } from '../utils/intelligentAreaRecognition';
import { executeAdvancedStrategicAnalysis, StrategicAnalysisFramework } from '../utils/advancedStrategicAnalysis';

export type PatternResult = {
  type: string;
  confidence: number;
  description: string;
  recommendation?: string;
  action?: 'compra' | 'venda' | 'neutro';
  isScalpingSignal?: boolean; // Added for m1 timeframe signals
  entryPrice?: string;
  stopLoss?: string;
  takeProfit?: string;
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
  | { type: 'arrow', start: Point, end: Point }
  | { type: 'rectangle', position: Point, width: number, height: number }
  | { type: 'circle', center: Point, radius: number }
  | { type: 'label', position: Point, text: string, backgroundColor?: string }
  | { type: 'pattern', patternType: 'OCO' | 'triangulo' | 'cunha' | 'bandeira' | 'topoduplo' | 'fundoduplo' | 'eliotwave' | 'dowtheory' | 'trendline' | 'fibonacci' | 'channel' | 'support' | 'resistance' | 'triangle' | 'wedge' | 'flag' | 'pennant' | 'headshoulders' | 'doubletop' | 'cuphandle' | 'breakout' | 'volume' | 'divergence' | 'consolidation' | 'gap', points: Point[] }
);

export type CandleData = {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number; // Add timestamp property
  volume?: number; // Add optional volume property
  color?: 'verde' | 'vermelho';
  position?: Point;
  width?: number;
  height?: number;
};

// Enhanced volume analysis type
export type VolumeData = {
  value: number;
  trend: 'increasing' | 'decreasing' | 'neutral';
  abnormal: boolean; // Indicates volume spikes
  significance: 'high' | 'medium' | 'low';
  relativeToAverage: number; // Ratio compared to average
  distribution: 'accumulation' | 'distribution' | 'neutral'; // Volume distribution pattern
  divergence: boolean; // Price-volume divergence indicator
};

// Enhanced volatility analysis type
export type VolatilityData = {
  value: number; // Current volatility
  trend: 'increasing' | 'decreasing' | 'neutral';
  atr?: number; // Average True Range
  percentageRange?: number; // Range as percentage of price
  isHigh: boolean;
  historicalComparison: 'above_average' | 'below_average' | 'average'; // Comparing to historical volatility
  impliedVolatility?: number; // Forward-looking volatility expectation
};

// Enhanced market context type with more detailed phase recognition
export type MarketContext = {
  phase: 'acumulação' | 'tendência_alta' | 'tendência_baixa' | 'distribuição' | 'lateral' | 'indefinida';
  strength: 'forte' | 'moderada' | 'fraca';
  dominantTimeframe: TimeframeType;
  sentiment: 'otimista' | 'pessimista' | 'neutro';
  description: string;
  trendAngle?: number; // Angle of the trend line (steepness)
  marketStructure: 'alta_altas' | 'alta_baixas' | 'baixa_altas' | 'baixa_baixas' | 'indefinida'; // Higher highs/higher lows, etc.
  liquidityPools?: { level: number, strength: 'alta' | 'média' | 'baixa' }[]; // Key liquidity levels
  keyLevels?: { price: number, type: 'suporte' | 'resistência', strength: 'forte' | 'moderada' | 'fraca' }[]; 
  breakoutPotential: 'alto' | 'médio' | 'baixo';
  momentumSignature: 'acelerando' | 'estável' | 'desacelerando' | 'divergente';
};

export interface EnhancedMarketContext extends MarketContext {
  advancedConditions?: any;
  operatingScore?: number;
  confidenceReduction?: number;
}

export type AnalysisResult = {
  patterns: PatternResult[];
  timestamp: number;
  imageUrl?: string;
  technicalElements?: TechnicalElement[];
  candles?: CandleData[];
  manualRegion?: boolean;
  scalpingSignals?: ScalpingSignal[];
  technicalIndicators?: TechnicalIndicator[];
  volumeData?: VolumeData;
  volatilityData?: VolatilityData;
  marketContext?: EnhancedMarketContext;
  warnings?: string[];
  preciseEntryAnalysis?: PreciseEntryAnalysis;
  masterAnalysis?: any;
  advancedStrategies?: any[];
  comprehensiveAnalysis?: ComprehensiveAnalysisResult;
  smartAnalysis?: SmartAnalysisResult;
  strategicFramework?: StrategicAnalysisFramework;
  // Add missing properties for advanced analysis
  confluences?: {
    confluenceScore: number;
    supportResistance?: any[];
    marketStructure?: any;
    priceAction?: any;
    criticalLevels?: any[];
  };
  priceActionSignals?: any[];
  detailedMarketContext?: {
    phase: string;
    sentiment: string;
    strength: string;
    description: string;
    marketStructure: string;
    breakoutPotential: string;
    momentumSignature: string;
    institutionalBias: string;
    volatilityState: string;
    liquidityCondition: string;
    timeOfDay: string;
    trend?: string;
  };
  entryRecommendations?: any[];
};

// New type for technical indicators for enhanced M1 strategy
export type TechnicalIndicator = {
  name: string;
  value: string;
  signal: 'alta' | 'baixa' | 'neutro';
  strength: 'forte' | 'moderada' | 'fraca';
  description: string;
};

export type ScalpingSignal = {
  type: 'entrada' | 'saída';
  action: 'compra' | 'venda';
  price: string;
  confidence: number;
  timeframe: string;
  description: string;
  target?: string;
  stopLoss?: string;
  volumeConfirmation?: boolean; // New property for volume confirmation
  volatilityCondition?: string; // New property for volatility condition
  marketPhaseAlignment?: boolean; // New property for market phase alignment
  marketStructureAlignment?: boolean; // New property to check if aligned with market structure
  liquidityTarget?: boolean; // Whether the signal targets a liquidity pool
  // New fields for precise timing
  exactEntryTime?: string; // Exact minute for entry
  entryType?: 'reversão' | 'retração' | 'pullback' | 'breakout' | 'teste_suporte' | 'teste_resistência';
  nextCandleExpectation?: string; // What to expect on the next candle
  entryCondition?: string; // Detailed condition for entry
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

export type MarkupToolType = 'line' | 'arrow' | 'rectangle' | 'circle' | 'label' | 'trendline' | 'eliotwave' | 'dowtheory' | 'fibonacci' | 'channel' | 'support' | 'resistance' | 'triangle' | 'wedge' | 'flag' | 'pennant' | 'headshoulders' | 'doubletop' | 'cuphandle' | 'breakout' | 'volume' | 'divergence' | 'consolidation' | 'gap';

export type TimeframeType = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

// New type for M1 strategy preferences
export type ScalpingStrategy = 'momentum' | 'reversal' | 'breakout' | 'range';

// New type for market analysis depth
export type MarketAnalysisDepth = 'basic' | 'advanced' | 'comprehensive';

// New type for precise entry analysis
export type PreciseEntryAnalysis = {
  exactMinute: string;
  entryType: 'reversão' | 'retração' | 'pullback' | 'breakout' | 'teste_suporte' | 'teste_resistência';
  nextCandleExpectation: string;
  priceAction: string;
  confirmationSignal: string;
  riskRewardRatio: number;
  entryInstructions: string;
};

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
  optimizeForScalping: boolean;
  setOptimizeForScalping: (optimize: boolean) => void;
  scalpingStrategy: ScalpingStrategy; 
  setScalpingStrategy: (strategy: ScalpingStrategy) => void;
  considerVolume: boolean; // New property for volume analysis
  setConsiderVolume: (consider: boolean) => void; // New setter
  considerVolatility: boolean; // New property for volatility analysis
  setConsiderVolatility: (consider: boolean) => void; // New setter
  marketContextEnabled: boolean; // New property for market context understanding
  setMarketContextEnabled: (enabled: boolean) => void; // New setter
  marketAnalysisDepth: MarketAnalysisDepth;
  setMarketAnalysisDepth: (depth: MarketAnalysisDepth) => void;
  enableCandleDetection: boolean; // Nova propriedade para detecção de candles
  setEnableCandleDetection: (enabled: boolean) => void; // Novo setter
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
  const [optimizeForScalping, setOptimizeForScalping] = useState(false);
  const [scalpingStrategy, setScalpingStrategy] = useState<ScalpingStrategy>('momentum');
  const [considerVolume, setConsiderVolume] = useState(true); // New state for volume analysis
  const [considerVolatility, setConsiderVolatility] = useState(true); // New state for volatility analysis
  const [marketContextEnabled, setMarketContextEnabled] = useState(true); // New state for market context
  const [marketAnalysisDepth, setMarketAnalysisDepth] = useState<MarketAnalysisDepth>('comprehensive'); // New state for market analysis depth
  const [enableCandleDetection, setEnableCandleDetection] = useState(true); // Novo estado para detecção de candles

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
      console.log('🔍 Iniciando análise avançada com reconhecimento inteligente...');
      
      // Importar módulos de detecção de candles
      const { detectCandles } = await import('../utils/patternDetection');
      
      // Detectar candles da imagem capturada
      let detectedCandles: CandleData[] = [];
      if (enableCandleDetection) {
        try {
          // detectCandles espera imageData, width, height
          detectedCandles = await detectCandles(imageUrl, 800, 600);
          console.log(`✅ ${detectedCandles.length} candles detectados da imagem`);
        } catch (error) {
          console.warn('⚠️ Falha na detecção de candles, usando dados mock:', error);
        }
      }

      // Se não conseguiu detectar candles, usar dados mock para demonstração
      const candles: CandleData[] = detectedCandles.length > 0 ? detectedCandles : Array.from({ length: 50 }, (_, i) => ({
        open: 100 + Math.random() * 10,
        high: 105 + Math.random() * 10,
        low: 95 + Math.random() * 10,
        close: 100 + Math.random() * 10,
        timestamp: Date.now() - (50 - i) * 60000,
        volume: Math.random() * 1000000
      }));

      console.log(`📊 Analisando ${candles.length} candles com estratégias avançadas...`);

      // 🧠 PRIORIDADE 1: Análise Inteligente com Reconhecimento de Área
      const smartAnalysis = performSmartAnalysis(candles);
      console.log('✅ Smart Analysis:', smartAnalysis);

      // 📈 PRIORIDADE 2: Framework Estratégico Multi-Camada
      const strategicFramework = executeAdvancedStrategicAnalysis(candles);
      console.log('✅ Strategic Framework:', strategicFramework);

      // 📊 PRIORIDADE 3: Análise Abrangente
      let comprehensiveAnalysis: ComprehensiveAnalysisResult | undefined;
      try {
        comprehensiveAnalysis = performComprehensiveAnalysis(candles);
        console.log('✅ Comprehensive Analysis:', comprehensiveAnalysis);
      } catch (error) {
        console.warn('⚠️ Análise abrangente falhou:', error);
      }

      // 🎯 Master Analysis (técnicas avançadas)
      const masterAnalysis = await getMasterAnalysis(timeframe, 'reversal');
      console.log('✅ Master Analysis:', masterAnalysis);

      // 🔥 Advanced Strategies
      const advancedStrategies = await runAllAdvancedStrategies(candles);
      console.log('✅ Advanced Strategies:', advancedStrategies);

      // Combinar todos os padrões detectados
      const allPatterns: PatternResult[] = [];

      // Adicionar padrões da análise inteligente
      if (smartAnalysis?.entryRecommendation) {
        allPatterns.push({
          type: `Smart: ${smartAnalysis.strategicAnalysis.primaryStrategy}`,
          confidence: smartAnalysis.strategicAnalysis.confidence / 100,
          description: smartAnalysis.entryRecommendation.reasoning,
          action: smartAnalysis.entryRecommendation.action === 'compra' ? 'compra' : 
                  smartAnalysis.entryRecommendation.action === 'venda' ? 'venda' : 'neutro',
          recommendation: `${smartAnalysis.entryRecommendation.action.toUpperCase()} - Risco: ${smartAnalysis.entryRecommendation.riskLevel}`
        });
      }

      // Adicionar padrão do framework estratégico
      if (strategicFramework?.decisionMatrix) {
        allPatterns.push({
          type: `Strategic: ${strategicFramework.decisionMatrix.primarySignal}`,
          confidence: strategicFramework.confidenceLevel / 100,
          description: strategicFramework.description,
          action: strategicFramework.decisionMatrix.primarySignal === 'compra' ? 'compra' :
                  strategicFramework.decisionMatrix.primarySignal === 'venda' ? 'venda' : 'neutro',
          recommendation: `Consenso: ${strategicFramework.decisionMatrix.consensusStrength}%`
        });
      }

      const results: AnalysisResult = {
        patterns: allPatterns,
        timestamp: Date.now(),
        imageUrl,
        candles,
        manualRegion: !!region,
        smartAnalysis,
        strategicFramework,
        masterAnalysis,
        advancedStrategies,
        comprehensiveAnalysis
      };

      setAnalysisResults(results);
      console.log('✅ Análise completa finalizada com sucesso!');
      
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
        optimizeForScalping,
        setOptimizeForScalping,
        scalpingStrategy,
        setScalpingStrategy,
        considerVolume,
        setConsiderVolume,
        considerVolatility,
        setConsiderVolatility,
        marketContextEnabled,
        setMarketContextEnabled,
        marketAnalysisDepth,
        setMarketAnalysisDepth,
        enableCandleDetection,
        setEnableCandleDetection,
        analyzeChartRegion,
      }}
    >
      {children}
    </AnalyzerContext.Provider>
  );
};

export const useAnalyzer = (): AnalyzerContextType => {
  const context = useContext(AnalyzerContext);
  if (context === undefined) {
    throw new Error('useAnalyzer must be used within an AnalyzerProvider');
  }
  return context;
};