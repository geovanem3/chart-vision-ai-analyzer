
export interface ChartArea {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

export interface PriceAxis {
  minPrice: number;
  maxPrice: number;
  pixelPerPrice: number;
  axisX: number;
  confidence?: number;
}

export interface DetectedCandle {
  x: number;
  y: number;
  width: number;
  height: number;
  bodyTop: number;
  bodyBottom: number;
  wickTop: number;
  wickBottom: number;
  color: 'green' | 'red' | 'black' | 'white';
  confidence: number;
}

export interface LiveAnalysisResult {
  timestamp: number;
  confidence: number;
  signal: 'compra' | 'venda' | 'neutro';
  patterns: string[];
  trend: 'alta' | 'baixa' | 'lateral';
  signalQuality?: string;
  confluenceScore?: number;
  supportResistance?: any[];
  criticalLevels?: any[];
  priceActionSignals?: any[];
  marketPhase?: string;
  institutionalBias?: string;
  entryRecommendations?: any[];
  riskReward?: number;
  warnings?: string[];
  analysisHealth?: {
    consistency: number;
    reliability: number;
    marketAlignment: boolean;
  };
  temporalValidation?: any;
  contextualInfo?: string[];
}

export interface AnalysisOptions {
  timeframe?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
  optimizeForScalping?: boolean;
  considerVolume?: boolean;
  considerVolatility?: boolean;
  enableCandleDetection?: boolean;
  scalpingStrategy?: string;
  marketContextEnabled?: boolean;
  marketAnalysisDepth?: string;
  isLiveAnalysis?: boolean;
  useConfluences?: boolean;
  enablePriceAction?: boolean;
  enableMarketContext?: boolean;
  enableIntelligentAnalysis?: boolean;
}

// Exportar interface para uso em patternDetection.ts
export interface AnalysisResult {
  patterns: any[];
  candles: any[];
  confluences?: any;
  detailedMarketContext?: any;
  priceActionSignals?: any[];
  entryRecommendations?: any[];
  intelligentAnalysis?: any;
}
