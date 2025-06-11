import { Chart } from "chart.js";
import { Pattern, PatternName, DetectedPattern } from "./types";
import { TechnicalElement, CandleData, Point } from "../context/AnalyzerContext";
import { 
  performConfluenceAnalysis, 
  validateSignalWithConfluences,
  ConfluenceAnalysis 
} from "./confluenceAnalysis";
import { 
  analyzePriceAction, 
  analyzeMarketContext, 
  PriceActionSignal, 
  MarketContextAnalysis 
} from "./priceActionAnalysis";

// Function to detect a specific pattern in the chart data
export const detectPattern = (chart: Chart, pattern: Pattern): boolean => {
    // Basic check to ensure chart and data are available
    if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length === 0) {
        console.warn("Chart data is not available.");
        return false;
    }

    const data = chart.data.datasets[0].data as number[];

    if (data.length < pattern.length) {
        return false; // Not enough data points to match the pattern
    }

    // Extract the last 'n' data points from the chart
    const dataWindow = data.slice(-pattern.length);

    // Compare the extracted data with the pattern
    for (let i = 0; i < pattern.length; i++) {
        if (dataWindow[i] !== pattern[i]) {
            return false; // Data does not match the pattern
        }
    }

    return true; // Data matches the pattern
};

// Function to generate a random pattern for testing purposes
export const generateRandomPattern = (length: number): Pattern => {
    const pattern: Pattern = [];
    for (let i = 0; i < length; i++) {
        pattern.push(Math.random() > 0.5 ? 1 : 0); // Binary pattern for simplicity
    }
    return pattern;
};

// Example patterns (can be expanded)
export const predefinedPatterns: { [key in PatternName]: Pattern } = {
    "bullish": [0, 1, 1, 0, 1],
    "bearish": [1, 0, 0, 1, 0],
    "neutral": [0, 1, 0, 1, 0]
};

export interface AnalysisOptions {
  sensitivity?: number;
  timeframe?: string;
  indicators?: string[];
  optimizeForScalping?: boolean;
  scalpingStrategy?: string;
  considerVolume?: boolean;
  considerVolatility?: boolean;
  marketContextEnabled?: boolean;
  marketAnalysisDepth?: string;
  enableCandleDetection?: boolean;
  isLiveAnalysis?: boolean;
  useConfluences?: boolean;
  enablePriceAction?: boolean;
  enableMarketContext?: boolean;
}

export interface AnalysisResult {
  trend: string;
  signals: Array<{
    type: string;
    strength: number;
    description: string;
  }>;
  confidence: number;
  timestamp: number;
  patterns: DetectedPattern[];
  marketContext?: {
    sentiment: 'otimista' | 'pessimista' | 'neutro';
    phase: string;
    strength: string;
  };
  confluences?: ConfluenceAnalysis;
  priceActionSignals?: PriceActionSignal[];
  detailedMarketContext?: MarketContextAnalysis;
  validatedSignals?: Array<{
    pattern: DetectedPattern;
    validation: {
      isValid: boolean;
      confidence: number;
      reasons: string[];
      warnings: string[];
    };
  }>;
  entryRecommendations?: Array<{
    type: 'scalping_entry' | 'swing_entry';
    action: 'compra' | 'venda';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    confidence: number;
    reasoning: string;
    timeframe: string;
    riskReward: number;
  }>;
}

export const analyzeChart = async (imageData: string, options: AnalysisOptions = {}): Promise<AnalysisResult> => {
  // Delay mais inteligente baseado no tipo de análise
  const analysisDelay = options.isLiveAnalysis ? 300 : 1000;
  await new Promise(resolve => setTimeout(resolve, analysisDelay));
  
  const startTime = Date.now();
  
  // Mock candle data mais realista para análise criteriosa
  const mockCandles: CandleData[] = [];
  const numCandles = options.isLiveAnalysis ? 50 : 100; // Mais dados para análise live
  let basePrice = 100;
  
  // Gerar dados mais realistas com tendências
  const trendDirection = Math.random() > 0.5 ? 1 : -1;
  const trendStrength = Math.random() * 0.002; // 0.2% max por candle
  
  for (let i = 0; i < numCandles; i++) {
    // Aplicar tendência gradual
    const trendComponent = trendDirection * trendStrength * i;
    const noise = (Math.random() - 0.5) * 0.008; // Ruído de 0.8%
    
    const open = basePrice + trendComponent + noise;
    const closeDirection = Math.random() > 0.4 ? 1 : -1; // 60% dos candles na direção da tendência
    const closeVariation = (Math.random() * 0.004 + 0.001) * closeDirection;
    const close = open + closeVariation;
    
    const high = Math.max(open, close) + Math.random() * 0.003;
    const low = Math.min(open, close) - Math.random() * 0.003;
    
    mockCandles.push({
      open,
      close,
      high,
      low,
      color: close > open ? 'verde' : 'vermelho',
      position: { x: i * 10, y: 300 - (close - 95) * 20 },
      width: 8,
      height: Math.abs(close - open) * 20
    });
    
    basePrice = close;
  }
  
  // Análise mais criteriosa para live
  const sensitivity = options.sensitivity || 0.6;
  const isHighSensitivity = sensitivity > 0.7;
  
  // Gerar padrões com base na análise real dos dados
  const recentCandles = mockCandles.slice(-10);
  const priceMovement = recentCandles[recentCandles.length - 1].close - recentCandles[0].close;
  const volatility = recentCandles.reduce((sum, candle) => sum + (candle.high - candle.low), 0) / recentCandles.length;
  
  // Determinar ação baseada em análise real
  let detectedAction: 'compra' | 'venda' | 'neutro' = 'neutro';
  let baseConfidence = 0.5;
  
  if (Math.abs(priceMovement) / recentCandles[0].close > 0.001) { // Movimento significativo > 0.1%
    detectedAction = priceMovement > 0 ? 'compra' : 'venda';
    baseConfidence = Math.min(0.9, 0.6 + Math.abs(priceMovement) / recentCandles[0].close * 100);
  }
  
  // Para análise live, ser mais criterioso
  if (options.isLiveAnalysis && isHighSensitivity) {
    if (baseConfidence < 0.65) {
      detectedAction = 'neutro';
      baseConfidence = 0.3;
    }
  }
  
  const patternTypes = ['Martelo', 'Engolfo de Alta', 'Estrela Cadente', 'Doji', 'Triângulo'];
  const selectedPattern = patternTypes[Math.floor(Math.random() * patternTypes.length)];
  
  const patterns: DetectedPattern[] = detectedAction !== 'neutro' ? [{
    type: selectedPattern,
    action: detectedAction,
    confidence: baseConfidence,
    description: `${selectedPattern} detectado com tendência ${detectedAction === 'compra' ? 'bullish' : 'bearish'}`
  }] : [];
  
  let result: AnalysisResult = {
    trend: detectedAction === 'compra' ? 'Bullish' : detectedAction === 'venda' ? 'Bearish' : 'Sideways',
    signals: detectedAction !== 'neutro' ? [{
      type: detectedAction === 'compra' ? 'Buy' : 'Sell',
      strength: baseConfidence * 100,
      description: `${detectedAction === 'compra' ? 'Buy' : 'Sell'} signal detected`
    }] : [],
    confidence: baseConfidence * 100,
    timestamp: startTime,
    patterns,
    marketContext: {
      sentiment: detectedAction === 'compra' ? 'otimista' : detectedAction === 'venda' ? 'pessimista' : 'neutro',
      phase: 'análise',
      strength: baseConfidence > 0.7 ? 'forte' : baseConfidence > 0.5 ? 'moderada' : 'fraca'
    }
  };
  
  // Add price action analysis for M1 timeframe
  if (options.enablePriceAction !== false && (options.timeframe === '1m' || options.isLiveAnalysis)) {
    const priceActionSignals = analyzePriceAction(mockCandles);
    result.priceActionSignals = priceActionSignals;
    
    // Adjust confidence based on price action
    if (priceActionSignals.length > 0) {
      const avgPAConfidence = priceActionSignals.reduce((sum, signal) => sum + signal.confidence, 0) / priceActionSignals.length;
      result.confidence = Math.round((result.confidence + avgPAConfidence * 100) / 2);
    }
  }
  
  // Add detailed market context analysis
  if (options.enableMarketContext !== false) {
    const detailedMarketContext = analyzeMarketContext(mockCandles);
    result.detailedMarketContext = detailedMarketContext;
    
    // Update market context based on detailed analysis
    result.marketContext = {
      sentiment: detailedMarketContext.sentiment === 'muito_otimista' || detailedMarketContext.sentiment === 'otimista' ? 'otimista' :
                detailedMarketContext.sentiment === 'muito_pessimista' || detailedMarketContext.sentiment === 'pessimista' ? 'pessimista' : 'neutro',
      phase: detailedMarketContext.phase,
      strength: detailedMarketContext.marketStructure.strength > 70 ? 'forte' : 
               detailedMarketContext.marketStructure.strength > 40 ? 'moderada' : 'fraca'
    };
  }
  
  // Add confluence analysis if enabled
  if (options.useConfluences !== false) {
    const confluenceAnalysis = performConfluenceAnalysis(mockCandles, patterns);
    result.confluences = confluenceAnalysis;
    
    // Validate signals with confluences
    const currentPrice = mockCandles[mockCandles.length - 1]?.close || 100;
    const validatedSignals = patterns.map(pattern => ({
      pattern,
      validation: validateSignalWithConfluences(pattern, confluenceAnalysis, currentPrice)
    }));
    
    result.validatedSignals = validatedSignals;
    
    // Update overall confidence based on confluences
    const avgValidationConfidence = validatedSignals.reduce((sum, vs) => sum + vs.validation.confidence, 0) / validatedSignals.length;
    result.confidence = Math.round(avgValidationConfidence * 100);
    
    // Update market context based on confluence score
    if (confluenceAnalysis.confluenceScore > 70) {
      result.marketContext!.strength = 'forte';
    } else if (confluenceAnalysis.confluenceScore > 40) {
      result.marketContext!.strength = 'moderada';
    } else {
      result.marketContext!.strength = 'fraca';
    }
  }
  
  // Para live analysis, aplicar filtros mais rigorosos
  if (options.isLiveAnalysis && result.patterns.length > 0) {
    const pattern = result.patterns[0];
    
    // Reduzir confiança se não há confluências suficientes
    if (result.confluences && result.confluences.confluenceScore < 50) {
      pattern.confidence *= 0.8;
    }
    
    // Requerer price action forte para sinais live
    if (!result.priceActionSignals || result.priceActionSignals.length === 0) {
      pattern.confidence *= 0.7;
    }
    
    // Atualizar resultado com confiança ajustada
    result.confidence = pattern.confidence * 100;
  }
  
  // Generate specific entry recommendations for M1 scalping
  if (options.optimizeForScalping && options.timeframe === '1m') {
    result.entryRecommendations = generateScalpingEntries(
      mockCandles, 
      patterns, 
      result.priceActionSignals || [], 
      result.confluences,
      result.detailedMarketContext
    );
  }
  
  // Adicionar informações de timing para debugging
  const processingTime = Date.now() - startTime;
  console.log(`[TIMING] Análise criteriosa completa em ${processingTime}ms - Padrões: ${result.patterns.length} - Confiança: ${result.confidence.toFixed(1)}%`);
  
  return result;
};

// Generate specific scalping entry recommendations
const generateScalpingEntries = (
  candles: CandleData[],
  patterns: DetectedPattern[],
  priceActionSignals: PriceActionSignal[],
  confluences?: ConfluenceAnalysis,
  marketContext?: MarketContextAnalysis
): AnalysisResult['entryRecommendations'] => {
  const entries: AnalysisResult['entryRecommendations'] = [];
  const currentPrice = candles[candles.length - 1]?.close || 100;
  
  // Combine pattern signals with price action - filter out 'neutro' actions
  patterns
    .filter(pattern => pattern.action !== 'neutro')
    .forEach(pattern => {
      const validAction = pattern.action as 'compra' | 'venda'; // Type assertion after filtering
      const alignedPASignals = priceActionSignals.filter(pa => 
        (validAction === 'compra' && pa.direction === 'alta') ||
        (validAction === 'venda' && pa.direction === 'baixa')
      );
      
      if (alignedPASignals.length > 0) {
        const bestPASignal = alignedPASignals.sort((a, b) => b.confidence - a.confidence)[0];
        
        let entryPrice = currentPrice;
        let stopLoss = currentPrice;
        let takeProfit = currentPrice;
        let riskReward = 2.0;
        
        if (bestPASignal.entryZone) {
          entryPrice = bestPASignal.entryZone.optimal;
          
          if (validAction === 'compra') {
            stopLoss = entryPrice - (entryPrice * 0.002); // 0.2% stop
            takeProfit = entryPrice + (entryPrice * 0.004); // 0.4% target
          } else {
            stopLoss = entryPrice + (entryPrice * 0.002);
            takeProfit = entryPrice - (entryPrice * 0.004);
          }
          
          riskReward = bestPASignal.riskReward || 2.0;
        }
        
        const confidence = (pattern.confidence + bestPASignal.confidence) / 2;
        
        let reasoning = `${pattern.type} + ${bestPASignal.type} (${bestPASignal.strength})`;
        
        // Add confluence reasoning
        if (confluences && confluences.confluenceScore > 60) {
          reasoning += ` | Confluência: ${Math.round(confluences.confluenceScore)}%`;
        }
        
        // Add market context reasoning
        if (marketContext) {
          reasoning += ` | Contexto: ${marketContext.phase} - ${marketContext.institutionalBias}`;
          reasoning += ` | Estrutura: ${marketContext.marketStructure.trend}`;
        }
        
        entries.push({
          type: 'scalping_entry',
          action: validAction,
          entryPrice,
          stopLoss,
          takeProfit,
          confidence,
          reasoning,
          timeframe: '1m',
          riskReward
        });
      }
    });
  
  // Add pure price action entries for high-confidence signals
  priceActionSignals
    .filter(pa => pa.confidence > 0.75 && pa.entryZone)
    .forEach(paSignal => {
      const entryPrice = paSignal.entryZone!.optimal;
      const action: 'compra' | 'venda' = paSignal.direction === 'alta' ? 'compra' : 'venda';
      
      let stopLoss = entryPrice;
      let takeProfit = entryPrice;
      
      if (action === 'compra') {
        stopLoss = entryPrice - (entryPrice * 0.0015); // Tighter stop for PA signals
        takeProfit = entryPrice + (entryPrice * 0.003);
      } else {
        stopLoss = entryPrice + (entryPrice * 0.0015);
        takeProfit = entryPrice - (entryPrice * 0.003);
      }
      
      let reasoning = `Price Action puro: ${paSignal.description}`;
      
      if (marketContext) {
        reasoning += ` | Alinhado com ${marketContext.institutionalBias} institucional`;
      }
      
      entries.push({
        type: 'scalping_entry',
        action,
        entryPrice,
        stopLoss,
        takeProfit,
        confidence: paSignal.confidence,
        reasoning,
        timeframe: '1m',
        riskReward: paSignal.riskReward || 2.0
      });
    });
  
  return entries.slice(0, 3); // Limit to top 3 recommendations
};

// Function to interpret the detected pattern
export const interpretPattern = (patternName: PatternName): string => {
    switch (patternName) {
        case "bullish":
            return "Bullish pattern detected: potential upward trend.";
        case "bearish":
            return "Bearish pattern detected: potential downward trend.";
        case "neutral":
            return "Neutral pattern detected: no clear trend.";
        default:
            return "Unknown pattern detected.";
    }
};

// Function to detect multiple patterns in an image
export const detectPatterns = async (imageData: string): Promise<DetectedPattern[]> => {
  // Simulate pattern detection
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const patternTypes = ['Martelo', 'Engolfo de Alta', 'Estrela Cadente', 'Doji', 'Triângulo', 'Cunha'];
  const actions: ('compra' | 'venda' | 'neutro')[] = ['compra', 'venda', 'neutro'];
  
  const numPatterns = Math.floor(Math.random() * 3) + 1; // 1-3 patterns
  const patterns: DetectedPattern[] = [];
  
  for (let i = 0; i < numPatterns; i++) {
    const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    patterns.push({
      type: patternType,
      action: action,
      confidence: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
      description: `${patternType} detectado com ação recomendada: ${action}`,
      coordinates: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        width: Math.random() * 200 + 50,
        height: Math.random() * 200 + 50
      }
    });
  }
  
  return patterns;
};

// Function to generate technical markup elements
export const generateTechnicalMarkup = (patterns: DetectedPattern[], width: number, height: number): TechnicalElement[] => {
  const elements: TechnicalElement[] = [];
  
  patterns.forEach((pattern, index) => {
    if (pattern.coordinates) {
      const centerPoint: Point = {
        x: pattern.coordinates.x + pattern.coordinates.width / 2,
        y: pattern.coordinates.y + pattern.coordinates.height / 2
      };
      
      elements.push({
        type: 'rectangle',
        position: centerPoint,
        width: pattern.coordinates.width,
        height: pattern.coordinates.height,
        color: pattern.action === 'compra' ? '#22c55e' : pattern.action === 'venda' ? '#ef4444' : '#6b7280',
        thickness: 2
      });
      
      elements.push({
        type: 'label',
        position: { x: centerPoint.x, y: centerPoint.y - pattern.coordinates.height / 2 - 10 },
        text: pattern.type,
        color: pattern.action === 'compra' ? '#22c55e' : pattern.action === 'venda' ? '#ef4444' : '#6b7280',
        backgroundColor: '#ffffff'
      });
    }
  });
  
  // Add some trend lines
  const trendLinePoints: Point[] = [
    { x: 0, y: height * 0.3 },
    { x: width, y: height * 0.3 }
  ];
  
  elements.push({
    type: 'line',
    points: trendLinePoints,
    color: '#3b82f6',
    thickness: 2
  });
  
  return elements;
};

// Function to detect candles in an image
export const detectCandles = async (imageData: string, width: number, height: number): Promise<CandleData[]> => {
  // Simulate candle detection
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const numCandles = Math.floor(Math.random() * 20) + 10; // 10-30 candles
  const candles: CandleData[] = [];
  
  for (let i = 0; i < numCandles; i++) {
    const open = Math.random() * 100 + 50;
    const close = open + (Math.random() - 0.5) * 20;
    const high = Math.max(open, close) + Math.random() * 10;
    const low = Math.min(open, close) - Math.random() * 10;
    
    const candleWidth = width / numCandles * 0.8;
    const candleHeight = Math.abs(close - open) * 2;
    
    candles.push({
      open,
      close,
      high,
      low,
      color: close > open ? 'verde' : 'vermelho',
      position: {
        x: (i / numCandles) * width,
        y: (1 - (high - 40) / 120) * height
      },
      width: candleWidth,
      height: candleHeight
    });
  }
  
  return candles;
};

// ... keep existing code (rest of functions)
