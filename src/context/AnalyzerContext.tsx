import React, { createContext, useContext, useState } from 'react';

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  position?: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
  color?: string;
}

export interface PatternResult {
  type: string;
  confidence: number;
  description: string;
  recommendation: string;
  action: 'compra' | 'venda' | 'neutro';
  isScalpingSignal?: boolean;
}

export interface TechnicalElement {
  id: string;
  type: 'trendline' | 'rectangle' | 'circle' | 'ellipse' | 'fibonacci' | 'pattern' | 'line' | 'label' | 'arrow';
  points?: Point[];
  color: string;
  thickness?: number;
  dashArray?: number[];
  backgroundColor?: string;
  
  // For arrow elements
  start?: Point;
  end?: Point;
  
  // For rectangle elements
  position?: Point;
  width?: number;
  height?: number;
  
  // For circle elements
  center?: Point;
  radius?: number;
  
  // For label elements
  text?: string;
  
  // For pattern elements
  patternType?: string;
  label?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface VolumeData {
  value: number;
  trend: string;
  abnormal: boolean;
  significance: string;
  relativeToAverage: number;
  distribution: string;
  divergence: boolean;
}

export interface VolatilityData {
  value: number;
  trend: string;
  atr: number;
  percentageRange: number;
  isHigh: boolean;
  historicalComparison: string;
  impliedVolatility: number;
}

export interface TechnicalIndicator {
  name: string;
  value: string;
  signal: string;
  strength: string;
  description: string;
}

export interface ScalpingSignal {
  type: string;
  action: 'compra' | 'venda';
  price: string;
  confidence: number;
  timeframe: string;
  description: string;
}

export interface DetectedPattern {
  type: string;
  confidence: number;
  description: string;
  action: 'compra' | 'venda';
}

export interface MarketContext {
  phase: string;
  sentiment: string;
  strength: string;
  description: string;
}

export interface EnhancedMarketContext extends MarketContext {
  dominantTimeframe: string;
  marketStructure: string;
  breakoutPotential: string;
  momentumSignature: string;
  advancedConditions: any;
  operatingScore: number;
  confidenceReduction: number;
  keyLevels?: any[];
}

export interface SelectedRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'rectangle' | 'circle';
  radius?: number;
  centerX?: number;
  centerY?: number;
}

export type MarkupToolType = 'line' | 'arrow' | 'rectangle' | 'circle' | 'label' | 'trendline' | 'eliotwave' | 'dowtheory';

export interface AnalysisResult {
  patterns: PatternResult[];
  timestamp: number;
  imageUrl: string;
  technicalElements: TechnicalElement[];
  candles: CandleData[];
  scalpingSignals: ScalpingSignal[];
  technicalIndicators: TechnicalIndicator[];
  volumeData: VolumeData;
  volatilityData: VolatilityData;
  marketContext: EnhancedMarketContext;
  warnings: string[];
  preciseEntryAnalysis: {
    exactMinute: string;
    entryType: 'reversão' | 'continuação' | 'breakout';
    nextCandleExpectation: string;
    priceAction: string;
    confirmationSignal: string;
    riskRewardRatio: number;
    entryInstructions: string;
  };
  confluences: any;
  priceActionSignals: any[];
  detailedMarketContext: {
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
    trend: string;
  };
  entryRecommendations: any[];
  tradeSuccessPredictions?: import('../utils/tradeSuccessPrediction').TradeSuccessPrediction[];
  masterAnalysis?: any;
  manualRegion?: any;
}

interface AnalyzerContextProps {
  analysisResults: AnalysisResult | null;
  setAnalysisResults: React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
  capturedImage: string | null;
  setCapturedImage: React.Dispatch<React.SetStateAction<string | null>>;
  isAnalyzing: boolean;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  timeframe: string;
  setTimeframe: React.Dispatch<React.SetStateAction<string>>;
  optimizeForScalping: boolean;
  setOptimizeForScalping: React.Dispatch<React.SetStateAction<boolean>>;
  considerVolume: boolean;
  setConsiderVolume: React.Dispatch<React.SetStateAction<boolean>>;
  considerVolatility: boolean;
  setConsiderVolatility: React.Dispatch<React.SetStateAction<boolean>>;
  enableCandleDetection: boolean;
  setEnableCandleDetection: React.Dispatch<React.SetStateAction<boolean>>;
  scalpingStrategy: string;
  setScalpingStrategy: React.Dispatch<React.SetStateAction<string>>;
  marketContextEnabled: boolean;
  setMarketContextEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  marketAnalysisDepth: string;
  setMarketAnalysisDepth: React.Dispatch<React.SetStateAction<string>>;
  
  // Chart markup and region selection properties
  showTechnicalMarkup: boolean;
  setShowTechnicalMarkup: React.Dispatch<React.SetStateAction<boolean>>;
  markupSize: number;
  setMarkupSize: React.Dispatch<React.SetStateAction<number>>;
  manualMarkups: TechnicalElement[];
  setManualMarkups: React.Dispatch<React.SetStateAction<TechnicalElement[]>>;
  selectedRegion: any;
  setSelectedRegion: React.Dispatch<React.SetStateAction<any>>;
  regionType: string;
  setRegionType: React.Dispatch<React.SetStateAction<string>>;
  isMarkupMode: boolean;
  setIsMarkupMode: React.Dispatch<React.SetStateAction<boolean>>;
  manualMarkupTool: string;
  setManualMarkupTool: React.Dispatch<React.SetStateAction<string>>;
  addManualMarkup: (markup: TechnicalElement) => void;
  resetAnalysis: () => void;
  setMarkupMode: (mode: boolean) => void;
  clearManualMarkups: () => void;
  removeLastMarkup: () => void;
}

const AnalyzerContext = createContext<AnalyzerContextProps | undefined>(undefined);

export const useAnalyzer = (): AnalyzerContextProps => {
  const context = useContext(AnalyzerContext);
  if (!context) {
    throw new Error("useAnalyzer must be used within an AnalyzerProvider");
  }
  return context;
};

export const AnalyzerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeframe, setTimeframe] = useState('1m');
  const [optimizeForScalping, setOptimizeForScalping] = useState(true);
  const [considerVolume, setConsiderVolume] = useState(true);
  const [considerVolatility, setConsiderVolatility] = useState(true);
  const [enableCandleDetection, setEnableCandleDetection] = useState(true);
  const [scalpingStrategy, setScalpingStrategy] = useState('estrategia_padrao');
  const [marketContextEnabled, setMarketContextEnabled] = useState(true);
  const [marketAnalysisDepth, setMarketAnalysisDepth] = useState('superficial');
  
  // Chart markup and region selection states
  const [showTechnicalMarkup, setShowTechnicalMarkup] = useState(true);
  const [markupSize, setMarkupSize] = useState(1);
  const [manualMarkups, setManualMarkups] = useState<TechnicalElement[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [regionType, setRegionType] = useState('full');
  const [isMarkupMode, setIsMarkupMode] = useState(false);
  const [manualMarkupTool, setManualMarkupTool] = useState('line');

  const addManualMarkup = (markup: TechnicalElement) => {
    setManualMarkups(prev => [...prev, markup]);
  };

  const resetAnalysis = () => {
    setAnalysisResults(null);
    setCapturedImage(null);
    setSelectedRegion(null);
    setManualMarkups([]);
  };

  const setMarkupMode = (mode: boolean) => {
    setIsMarkupMode(mode);
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
        analysisResults,
        setAnalysisResults,
        capturedImage,
        setCapturedImage,
        isAnalyzing,
        setIsAnalyzing,
        timeframe,
        setTimeframe,
        optimizeForScalping,
        setOptimizeForScalping,
        considerVolume,
        setConsiderVolume,
        considerVolatility,
        setConsiderVolatility,
        enableCandleDetection,
        setEnableCandleDetection,
        scalpingStrategy,
        setScalpingStrategy,
        marketContextEnabled,
        setMarketContextEnabled,
        marketAnalysisDepth,
        setMarketAnalysisDepth,
        showTechnicalMarkup,
        setShowTechnicalMarkup,
        markupSize,
        setMarkupSize,
        manualMarkups,
        setManualMarkups,
        selectedRegion,
        setSelectedRegion,
        regionType,
        setRegionType,
        isMarkupMode,
        setIsMarkupMode,
        manualMarkupTool,
        setManualMarkupTool,
        addManualMarkup,
        resetAnalysis,
        setMarkupMode,
        clearManualMarkups,
        removeLastMarkup
      }}
    >
      {children}
    </AnalyzerContext.Provider>
  );
};
