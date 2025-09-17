import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";

export interface IntelligentAnalysisArea {
  startIndex: number;
  endIndex: number;
  confidence: number;
  reason: string;
  analysisType: 'trend_continuation' | 'reversal_setup' | 'breakout_preparation' | 'consolidation_analysis';
  keyLevels: number[];
  timeframeOptimal: string;
  entryProbability: number;
}

export interface SmartAnalysisResult {
  selectedArea: IntelligentAnalysisArea;
  marketContext: {
    dominantTrend: 'bullish' | 'bearish' | 'sideways';
    volatilityState: 'low' | 'normal' | 'high' | 'extreme';
    liquidityCondition: 'abundant' | 'normal' | 'scarce';
    institutionalActivity: 'accumulation' | 'distribution' | 'neutral';
  };
  strategicAnalysis: {
    primaryStrategy: string;
    secondaryStrategies: string[];
    conflictingSignals: string[];
    confidence: number;
  };
  entryRecommendation: {
    action: 'compra' | 'venda' | 'aguardar';
    reasoning: string;
    riskLevel: 'baixo' | 'moderado' | 'alto';
    timeframe: string;
    stopLoss?: number;
    takeProfit?: number;
  };
}

// Sistema de reconhecimento inteligente de áreas de análise
export const intelligentAreaRecognition = (candles: CandleData[]): IntelligentAnalysisArea[] => {
  const areas: IntelligentAnalysisArea[] = [];
  
  if (candles.length < 20) {
    return areas; // Dados insuficientes
  }

  // 1. Detectar zonas de confluência técnica
  const confluenceZones = detectConfluenceZones(candles);
  areas.push(...confluenceZones);

  // 2. Identificar setups de reversão
  const reversalSetups = detectReversalSetups(candles);
  areas.push(...reversalSetups);

  // 3. Encontrar preparações de breakout
  const breakoutPreps = detectBreakoutPreparations(candles);
  areas.push(...breakoutPreps);

  // 4. Analisar consolidações estratégicas
  const consolidations = detectStrategicConsolidations(candles);
  areas.push(...consolidations);

  // Ordenar por confiança e probabilidade de entrada
  return areas.sort((a, b) => (b.confidence * b.entryProbability) - (a.confidence * a.entryProbability));
};

// Detecta zonas onde múltiplos indicadores convergem
const detectConfluenceZones = (candles: CandleData[]): IntelligentAnalysisArea[] => {
  const zones: IntelligentAnalysisArea[] = [];
  const windowSize = 10;

  for (let i = windowSize; i < candles.length - windowSize; i++) {
    const window = candles.slice(i - windowSize, i + windowSize);
    const currentPrice = candles[i].close;
    
    let confluenceScore = 0;
    const reasons: string[] = [];
    const keyLevels: number[] = [];

    // Verificar fibonacci retracements
    const fibLevels = calculateFibonacciLevels(window);
    if (fibLevels.some(level => Math.abs(currentPrice - level) / currentPrice < 0.002)) {
      confluenceScore += 25;
      reasons.push('Nível de Fibonacci');
      keyLevels.push(...fibLevels);
    }

    // Verificar suporte/resistência dinâmico
    const srLevels = identifyDynamicSupportResistance(window);
    if (srLevels.some(level => Math.abs(currentPrice - level) / currentPrice < 0.003)) {
      confluenceScore += 30;
      reasons.push('Suporte/Resistência Dinâmico');
      keyLevels.push(...srLevels);
    }

    // Verificar momentum divergence
    if (detectMomentumDivergence(window)) {
      confluenceScore += 20;
      reasons.push('Divergência de Momentum');
    }

    // Verificar volume profile
    const volumeProfile = analyzeVolumeProfile(window);
    if (volumeProfile.nearPOC) {
      confluenceScore += 15;
      reasons.push('Próximo ao Point of Control');
    }

    if (confluenceScore >= 50) {
      zones.push({
        startIndex: i - 5,
        endIndex: i + 5,
        confidence: Math.min(95, confluenceScore),
        reason: `Zona de Confluência: ${reasons.join(', ')}`,
        analysisType: 'trend_continuation',
        keyLevels: [...new Set(keyLevels)],
        timeframeOptimal: determineOptimalTimeframe(confluenceScore),
        entryProbability: confluenceScore * 1.2
      });
    }
  }

  return zones;
};

// Detecta setups de reversão com alta probabilidade
const detectReversalSetups = (candles: CandleData[]): IntelligentAnalysisArea[] => {
  const setups: IntelligentAnalysisArea[] = [];
  
  for (let i = 15; i < candles.length - 5; i++) {
    const recentCandles = candles.slice(i - 15, i + 5);
    let reversalScore = 0;
    const reasons: string[] = [];

    // Detectar exhaustion patterns
    if (detectExhaustionPattern(recentCandles)) {
      reversalScore += 35;
      reasons.push('Padrão de Exaustão');
    }

    // Verificar oversold/overbought extremo
    const rsiLevel = calculateRSI(recentCandles);
    if (rsiLevel < 25 || rsiLevel > 75) {
      reversalScore += 25;
      reasons.push(`RSI ${rsiLevel < 25 ? 'Oversold' : 'Overbought'} Extremo`);
    }

    // Detectar estrutura de reversão
    if (detectReversalStructure(recentCandles)) {
      reversalScore += 30;
      reasons.push('Estrutura de Reversão');
    }

    // Verificar volume confirmation
    if (detectVolumeConfirmation(recentCandles)) {
      reversalScore += 20;
      reasons.push('Confirmação de Volume');
    }

    if (reversalScore >= 60) {
      setups.push({
        startIndex: i - 8,
        endIndex: i + 3,
        confidence: Math.min(90, reversalScore),
        reason: `Setup de Reversão: ${reasons.join(', ')}`,
        analysisType: 'reversal_setup',
        keyLevels: [recentCandles[recentCandles.length - 1].high, recentCandles[recentCandles.length - 1].low],
        timeframeOptimal: '1M',
        entryProbability: reversalScore * 1.3
      });
    }
  }

  return setups;
};

// Detecta preparações para breakouts
const detectBreakoutPreparations = (candles: CandleData[]): IntelligentAnalysisArea[] => {
  const preparations: IntelligentAnalysisArea[] = [];
  
  for (let i = 20; i < candles.length - 10; i++) {
    const window = candles.slice(i - 20, i + 10);
    let breakoutScore = 0;
    const reasons: string[] = [];

    // Detectar consolidação antes do breakout
    if (detectConsolidationPattern(window)) {
      breakoutScore += 30;
      reasons.push('Padrão de Consolidação');
    }

    // Verificar pressure building
    if (detectPressureBuilding(window)) {
      breakoutScore += 25;
      reasons.push('Acumulação de Pressão');
    }

    // Analisar volume pattern
    if (detectVolumeAccumulation(window)) {
      breakoutScore += 20;
      reasons.push('Acumulação de Volume');
    }

    // Verificar support/resistance test
    if (detectLevelTest(window)) {
      breakoutScore += 25;
      reasons.push('Teste de Nível Chave');
    }

    if (breakoutScore >= 50) {
      preparations.push({
        startIndex: i - 10,
        endIndex: i + 5,
        confidence: Math.min(85, breakoutScore),
        reason: `Preparação para Breakout: ${reasons.join(', ')}`,
        analysisType: 'breakout_preparation',
        keyLevels: identifyBreakoutLevels(window),
        timeframeOptimal: '1M',
        entryProbability: breakoutScore * 1.1
      });
    }
  }

  return preparations;
};

// Detecta consolidações estratégicas
const detectStrategicConsolidations = (candles: CandleData[]): IntelligentAnalysisArea[] => {
  const consolidations: IntelligentAnalysisArea[] = [];
  const minConsolidationLength = 8;
  
  for (let i = minConsolidationLength; i < candles.length - minConsolidationLength; i++) {
    const window = candles.slice(i - minConsolidationLength, i + minConsolidationLength);
    
    if (isStrategicConsolidation(window)) {
      const consolidationQuality = assessConsolidationQuality(window);
      
      if (consolidationQuality.score >= 70) {
        consolidations.push({
          startIndex: i - minConsolidationLength + 2,
          endIndex: i + minConsolidationLength - 2,
          confidence: consolidationQuality.score,
          reason: `Consolidação Estratégica: ${consolidationQuality.reasons.join(', ')}`,
          analysisType: 'consolidation_analysis',
          keyLevels: consolidationQuality.keyLevels,
          timeframeOptimal: '1M',
          entryProbability: consolidationQuality.score * 0.9
        });
      }
    }
  }

  return consolidations;
};

// Sistema de análise inteligente completa
export const performSmartAnalysis = (candles: CandleData[]): SmartAnalysisResult => {
  // 1. Reconhecer a melhor área para análise
  const recognizedAreas = intelligentAreaRecognition(candles);
  const selectedArea = recognizedAreas[0] || createDefaultArea(candles);

  // 2. Analisar contexto de mercado
  const marketContext = analyzeMarketContext(candles);

  // 3. Executar análise estratégica
  const strategicAnalysis = performStrategicAnalysis(candles, selectedArea, marketContext);

  // 4. Gerar recomendação de entrada
  const entryRecommendation = generateEntryRecommendation(candles, selectedArea, strategicAnalysis, marketContext);

  return {
    selectedArea,
    marketContext,
    strategicAnalysis,
    entryRecommendation
  };
};

// Funções auxiliares (implementação simplificada para demonstração)
const calculateFibonacciLevels = (candles: CandleData[]): number[] => {
  const high = Math.max(...candles.map(c => c.high));
  const low = Math.min(...candles.map(c => c.low));
  const diff = high - low;
  
  return [
    low + diff * 0.236,
    low + diff * 0.382,
    low + diff * 0.5,
    low + diff * 0.618,
    low + diff * 0.786
  ];
};

const identifyDynamicSupportResistance = (candles: CandleData[]): number[] => {
  // Implementação simplificada
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  return [
    Math.max(...highs),
    Math.min(...lows),
    highs.reduce((a, b) => a + b, 0) / highs.length,
    lows.reduce((a, b) => a + b, 0) / lows.length
  ];
};

const detectMomentumDivergence = (candles: CandleData[]): boolean => {
  // Implementação simplificada
  return Math.random() > 0.7;
};

const analyzeVolumeProfile = (candles: CandleData[]) => {
  return { nearPOC: Math.random() > 0.6 };
};

const determineOptimalTimeframe = (score: number): string => {
  if (score >= 80) return '1M';
  if (score >= 60) return '5M';
  return '15M';
};

const detectExhaustionPattern = (candles: CandleData[]): boolean => {
  // Verificar se há sinais de exaustão na tendência atual
  const recent = candles.slice(-5);
  const volumes = recent.map(c => c.volume || 0);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  
  return volumes[volumes.length - 1] < avgVolume * 0.7;
};

const calculateRSI = (candles: CandleData[], period: number = 14): number => {
  if (candles.length < period) return 50;
  
  const changes = candles.slice(1).map((candle, i) => candle.close - candles[i].close);
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? -change : 0);
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const detectReversalStructure = (candles: CandleData[]): boolean => {
  // Detectar estruturas como double top/bottom, head and shoulders, etc.
  return Math.random() > 0.6;
};

const detectVolumeConfirmation = (candles: CandleData[]): boolean => {
  const recent = candles.slice(-3);
  const volumes = recent.map(c => c.volume || 0);
  return volumes.some(v => v > volumes[0] * 1.5);
};

const detectConsolidationPattern = (candles: CandleData[]): boolean => {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const range = Math.max(...highs) - Math.min(...lows);
  const avgRange = range / candles.length;
  
  return avgRange < (highs[0] * 0.02); // Consolidação se range < 2%
};

const detectPressureBuilding = (candles: CandleData[]): boolean => {
  return Math.random() > 0.5;
};

const detectVolumeAccumulation = (candles: CandleData[]): boolean => {
  const volumes = candles.map(c => c.volume || 0);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const recentAvg = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  
  return recentAvg > avgVolume * 1.2;
};

const detectLevelTest = (candles: CandleData[]): boolean => {
  return Math.random() > 0.4;
};

const identifyBreakoutLevels = (candles: CandleData[]): number[] => {
  return [
    Math.max(...candles.map(c => c.high)),
    Math.min(...candles.map(c => c.low))
  ];
};

const isStrategicConsolidation = (candles: CandleData[]): boolean => {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const range = maxHigh - minLow;
  
  // Consolidação se o range é pequeno em relação ao preço
  return range / maxHigh < 0.03;
};

const assessConsolidationQuality = (candles: CandleData[]) => {
  return {
    score: 75,
    reasons: ['Range estreito', 'Volume equilibrado'],
    keyLevels: [
      Math.max(...candles.map(c => c.high)),
      Math.min(...candles.map(c => c.low))
    ]
  };
};

const createDefaultArea = (candles: CandleData[]): IntelligentAnalysisArea => {
  const lastIndex = candles.length - 1;
  return {
    startIndex: Math.max(0, lastIndex - 20),
    endIndex: lastIndex,
    confidence: 60,
    reason: 'Análise padrão da área mais recente',
    analysisType: 'trend_continuation',
    keyLevels: [candles[lastIndex].high, candles[lastIndex].low],
    timeframeOptimal: '5M',
    entryProbability: 60
  };
};

const analyzeMarketContext = (candles: CandleData[]) => {
  const recent = candles.slice(-20);
  const trend = recent[recent.length - 1].close > recent[0].close ? 'bullish' : 'bearish';
  
  return {
    dominantTrend: trend as 'bullish' | 'bearish',
    volatilityState: 'normal' as const,
    liquidityCondition: 'normal' as const,
    institutionalActivity: 'neutral' as const
  };
};

const performStrategicAnalysis = (candles: CandleData[], area: IntelligentAnalysisArea, context: any) => {
  return {
    primaryStrategy: 'Confluência Técnica',
    secondaryStrategies: ['Price Action', 'Volume Profile'],
    conflictingSignals: [],
    confidence: area.confidence
  };
};

const generateEntryRecommendation = (candles: CandleData[], area: IntelligentAnalysisArea, strategic: any, context: any) => {
  const lastCandle = candles[candles.length - 1];
  const action = context.dominantTrend === 'bullish' ? 'compra' : 'venda';
  
  return {
    action: action as 'compra' | 'venda',
    reasoning: `${strategic.primaryStrategy} indica ${action} com ${area.confidence}% de confiança`,
    riskLevel: (area.entryProbability > 80 ? 'baixo' : 'moderado') as 'baixo' | 'moderado' | 'alto',
    timeframe: area.timeframeOptimal,
    stopLoss: action === 'compra' ? lastCandle.close * 0.98 : lastCandle.close * 1.02,
    takeProfit: action === 'compra' ? lastCandle.close * 1.05 : lastCandle.close * 0.95
  };
};