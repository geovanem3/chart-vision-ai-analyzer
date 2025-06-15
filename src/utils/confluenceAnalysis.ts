
import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";
import { analyzeCandleContext } from "./candleAnalysis";

export interface SupportResistanceLevel {
  type: 'support' | 'resistance';
  price: number;
  strength: 'forte' | 'moderada' | 'fraca';
  confidence: number;
  touchCount: number;
  lastTouch: number;
}

export interface MarketStructureAnalysis {
  structure: 'bullish' | 'bearish' | 'neutral';
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
  swingPoints: Array<{
    type: 'high' | 'low';
    price: number;
    index: number;
  }>;
}

export interface PriceActionAnalysis {
  trend: 'alta' | 'baixa' | 'lateral';
  momentum: 'forte' | 'moderado' | 'fraco';
  strength: number;
  breakoutPotential: number;
  consolidationZone: {
    top: number;
    bottom: number;
    duration: number;
  } | null;
}

export const performConfluenceAnalysis = (candles: CandleData[], patterns: DetectedPattern[]) => {
  if (candles.length < 10) {
    return {
      confluenceScore: 0,
      supportResistance: [],
      marketStructure: { structure: 'neutral' as const },
      priceAction: { trend: 'lateral' as const, momentum: 'fraco' as const, strength: 0 }
    };
  }

  // Análise de Suporte e Resistência
  const supportResistance = identifySupportResistanceLevels(candles);
  
  // Análise de Estrutura de Mercado
  const marketStructure = analyzeMarketStructure(candles);
  
  // Análise de Price Action
  const priceAction = analyzePriceActionContext(candles);
  
  // Calcular Score de Confluência
  const confluenceScore = calculateConfluenceScore(
    supportResistance,
    marketStructure,
    priceAction,
    patterns
  );

  return {
    confluenceScore,
    supportResistance: supportResistance.slice(0, 5), // Top 5 níveis
    marketStructure,
    priceAction
  };
};

const identifySupportResistanceLevels = (candles: CandleData[]): SupportResistanceLevel[] => {
  const levels: SupportResistanceLevel[] = [];
  const priceMap = new Map<string, { count: number, lastIndex: number, type: 'support' | 'resistance' }>();
  
  // Identificar pontos de reversão (swing highs e lows)
  for (let i = 2; i < candles.length - 2; i++) {
    const current = candles[i];
    const prev2 = candles[i - 2];
    const prev1 = candles[i - 1];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];
    
    // Swing High (resistência)
    if (current.high > prev2.high && 
        current.high > prev1.high && 
        current.high > next1.high && 
        current.high > next2.high) {
      
      const priceKey = current.high.toFixed(4);
      const existing = priceMap.get(priceKey);
      
      if (existing) {
        existing.count++;
        existing.lastIndex = i;
      } else {
        priceMap.set(priceKey, { count: 1, lastIndex: i, type: 'resistance' });
      }
    }
    
    // Swing Low (suporte)
    if (current.low < prev2.low && 
        current.low < prev1.low && 
        current.low < next1.low && 
        current.low < next2.low) {
      
      const priceKey = current.low.toFixed(4);
      const existing = priceMap.get(priceKey);
      
      if (existing) {
        existing.count++;
        existing.lastIndex = i;
      } else {
        priceMap.set(priceKey, { count: 1, lastIndex: i, type: 'support' });
      }
    }
  }
  
  // Converter para array e calcular força
  priceMap.forEach((data, priceStr) => {
    const price = parseFloat(priceStr);
    const touchCount = data.count;
    const lastTouch = data.lastIndex;
    const recency = (candles.length - lastTouch) / candles.length;
    
    // Calcular força baseada em toques e recência
    let strength: 'forte' | 'moderada' | 'fraca' = 'fraca';
    if (touchCount >= 3 && recency < 0.3) strength = 'forte';
    else if (touchCount >= 2 && recency < 0.5) strength = 'moderada';
    
    // Calcular confiança
    const confidence = Math.min(95, (touchCount * 25) + ((1 - recency) * 20));
    
    if (confidence > 40) {
      levels.push({
        type: data.type,
        price,
        strength,
        confidence,
        touchCount,
        lastTouch
      });
    }
  });
  
  return levels.sort((a, b) => b.confidence - a.confidence);
};

const analyzeMarketStructure = (candles: CandleData[]): MarketStructureAnalysis => {
  const swingPoints = findSwingPoints(candles);
  
  // Analisar padrão de highs e lows
  const highs = swingPoints.filter(p => p.type === 'high').map(p => p.price);
  const lows = swingPoints.filter(p => p.type === 'low').map(p => p.price);
  
  // Verificar Higher Highs e Higher Lows
  const higherHighs = isSequenceIncreasing(highs.slice(-3));
  const higherLows = isSequenceIncreasing(lows.slice(-3));
  
  // Verificar Lower Highs e Lower Lows
  const lowerHighs = isSequenceDecreasing(highs.slice(-3));
  const lowerLows = isSequenceDecreasing(lows.slice(-3));
  
  // Determinar estrutura geral
  let structure: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (higherHighs && higherLows) structure = 'bullish';
  else if (lowerHighs && lowerLows) structure = 'bearish';
  
  return {
    structure,
    higherHighs,
    higherLows,
    lowerHighs,
    lowerLows,
    swingPoints: swingPoints.slice(-10) // Últimos 10 swing points
  };
};

const findSwingPoints = (candles: CandleData[]) => {
  const swingPoints: Array<{ type: 'high' | 'low'; price: number; index: number }> = [];
  
  for (let i = 2; i < candles.length - 2; i++) {
    const current = candles[i];
    const prev2 = candles[i - 2];
    const prev1 = candles[i - 1];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];
    
    // Swing High
    if (current.high > prev2.high && 
        current.high > prev1.high && 
        current.high > next1.high && 
        current.high > next2.high) {
      swingPoints.push({ type: 'high', price: current.high, index: i });
    }
    
    // Swing Low
    if (current.low < prev2.low && 
        current.low < prev1.low && 
        current.low < next1.low && 
        current.low < next2.low) {
      swingPoints.push({ type: 'low', price: current.low, index: i });
    }
  }
  
  return swingPoints;
};

const analyzePriceActionContext = (candles: CandleData[]): PriceActionAnalysis => {
  const candleContext = analyzeCandleContext(candles);
  const recent10 = candles.slice(-10);
  
  // Detectar zona de consolidação
  const highs = recent10.map(c => c.high);
  const lows = recent10.map(c => c.low);
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const range = maxHigh - minLow;
  const avgPrice = (maxHigh + minLow) / 2;
  const rangePercent = (range / avgPrice) * 100;
  
  let consolidationZone = null;
  if (rangePercent < 0.5) { // Range menor que 0.5%
    consolidationZone = {
      top: maxHigh,
      bottom: minLow,
      duration: recent10.length
    };
  }
  
  // Calcular potencial de breakout
  const volatility = recent10.reduce((sum, candle) => {
    return sum + ((candle.high - candle.low) / candle.close) * 100;
  }, 0) / recent10.length;
  
  const breakoutPotential = consolidationZone ? 
    Math.min(100, (1 / rangePercent) * volatility * 20) : 
    Math.min(100, volatility * 10);
  
  return {
    trend: candleContext.trend,
    momentum: candleContext.strength > 70 ? 'forte' : candleContext.strength > 40 ? 'moderado' : 'fraco',
    strength: candleContext.strength,
    breakoutPotential,
    consolidationZone
  };
};

const calculateConfluenceScore = (
  supportResistance: SupportResistanceLevel[],
  marketStructure: MarketStructureAnalysis,
  priceAction: PriceActionAnalysis,
  patterns: DetectedPattern[]
): number => {
  let score = 0;
  
  // Score por níveis de S/R (máximo 30 pontos)
  const strongLevels = supportResistance.filter(level => level.strength === 'forte').length;
  const moderateLevels = supportResistance.filter(level => level.strength === 'moderada').length;
  score += (strongLevels * 10) + (moderateLevels * 5);
  score = Math.min(30, score);
  
  // Score por estrutura de mercado (máximo 25 pontos)
  if (marketStructure.structure === 'bullish' || marketStructure.structure === 'bearish') {
    score += 15;
    if ((marketStructure.higherHighs && marketStructure.higherLows) ||
        (marketStructure.lowerHighs && marketStructure.lowerLows)) {
      score += 10;
    }
  }
  
  // Score por price action (máximo 25 pontos)
  if (priceAction.trend !== 'lateral') {
    score += 10;
    if (priceAction.momentum === 'forte') score += 10;
    else if (priceAction.momentum === 'moderado') score += 5;
  }
  if (priceAction.breakoutPotential > 70) score += 5;
  
  // Score por padrões detectados (máximo 20 pontos)
  const strongPatterns = patterns.filter(p => p.confidence > 0.7).length;
  const moderatePatterns = patterns.filter(p => p.confidence > 0.5 && p.confidence <= 0.7).length;
  score += (strongPatterns * 8) + (moderatePatterns * 4);
  score = Math.min(20, score);
  
  return Math.min(100, score);
};

const isSequenceIncreasing = (sequence: number[]): boolean => {
  if (sequence.length < 2) return false;
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i] <= sequence[i - 1]) return false;
  }
  return true;
};

const isSequenceDecreasing = (sequence: number[]): boolean => {
  if (sequence.length < 2) return false;
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i] >= sequence[i - 1]) return false;
  }
  return true;
};
