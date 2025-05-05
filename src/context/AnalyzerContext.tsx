
import React, { createContext, useContext, useState, ReactNode } from 'react';

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
} & (
  | { type: 'line', points: Point[] }
  | { type: 'arrow', start: Point, end: Point }
  | { type: 'arrow', start: Point, end: Point }
  | { type: 'rectangle', position: Point, width: number, height: number }
  | { type: 'circle', center: Point, radius: number }
  | { type: 'label', position: Point, text: string, backgroundColor?: string }
  | { type: 'pattern', patternType: 'OCO' | 'triangulo' | 'cunha' | 'bandeira' | 'topoduplo' | 'fundoduplo' | 'eliotwave' | 'dowtheory' | 'trendline', points: Point[] }
);

export type CandleData = {
  open: number;
  high: number;
  low: number;
  close: number;
  color: 'verde' | 'vermelho';
  position: Point;
  width: number;
  height: number;
};

// New type for volume analysis
export type VolumeData = {
  value: number;
  trend: 'increasing' | 'decreasing' | 'neutral';
  abnormal: boolean; // Indicates volume spikes
  significance: 'high' | 'medium' | 'low';
  relativeToAverage: number; // Ratio compared to average
};

// New type for volatility analysis
export type VolatilityData = {
  value: number; // Current volatility
  trend: 'increasing' | 'decreasing' | 'neutral';
  atr?: number; // Average True Range
  percentageRange?: number; // Range as percentage of price
  isHigh: boolean;
};

// New type for market context
export type MarketContext = {
  phase: 'acumulação' | 'tendência' | 'distribuição' | 'indefinida';
  strength: 'forte' | 'moderada' | 'fraca';
  dominantTimeframe: TimeframeType;
  sentiment: 'otimista' | 'pessimista' | 'neutro';
  description: string;
};

export type AnalysisResult = {
  patterns: PatternResult[];
  timestamp: number;
  imageUrl?: string;
  technicalElements?: TechnicalElement[];
  candles?: CandleData[];
  manualRegion?: boolean;
  scalpingSignals?: ScalpingSignal[]; // Added for scalping signals
  technicalIndicators?: TechnicalIndicator[]; // Added for technical indicators
  volumeData?: VolumeData; // New for volume analysis
  volatilityData?: VolatilityData; // New for volatility analysis
  marketContext?: MarketContext; // New for market context understanding
};

// New type for technical indicators for enhanced M1 strategy
export type TechnicalIndicator = {
  name: string;
  value: string;
  trend: 'alta' | 'baixa' | 'neutro';
  significance: 'alta' | 'média' | 'baixa';
  description?: string;
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

export type MarkupToolType = 'line' | 'arrow' | 'rectangle' | 'circle' | 'label' | 'trendline' | 'eliotwave' | 'dowtheory';

export type TimeframeType = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

// New type for M1 strategy preferences
export type ScalpingStrategy = 'momentum' | 'reversal' | 'breakout' | 'range';

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
