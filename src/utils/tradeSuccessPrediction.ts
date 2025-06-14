
import { CandleData } from "../context/AnalyzerContext";

export interface TradeSuccessPrediction {
  willSucceed: boolean;
  successProbability: number;
  entryTiming: 'same_candle' | 'next_candle';
  timeToEntry: number; // segundos restantes até a entrada ideal
  exitTime: number; // quando a entrada expira
  riskFactors: string[];
  recommendation: 'enter_now' | 'wait_next_candle' | 'skip_entry';
  candleAnalysis: {
    currentCandleProgress: number; // % da vela atual completada
    expectedCandleSize: 'small' | 'medium' | 'large' | 'explosive';
    reversalProbability: number;
    volatilityRisk: 'low' | 'medium' | 'high' | 'extreme';
  };
  nextCandlePrediction?: {
    expectedDirection: 'alta' | 'baixa' | 'lateral';
    strength: number;
    confidence: number;
  };
}

export interface TradeEntry {
  action: 'compra' | 'venda';
  confidence: number;
  currentTime: number; // timestamp atual
  entryPrice: number;
  patterns: string[];
}

// Função principal para prever sucesso de uma entrada em 60 segundos
export const predictTradeSuccess = (
  candles: CandleData[], 
  tradeEntry: TradeEntry
): TradeSuccessPrediction => {
  
  const currentCandle = candles[candles.length - 1];
  const recentCandles = candles.slice(-10);
  
  // Calcular progresso da vela atual (simulado - em produção seria tempo real)
  const currentCandleProgress = Math.random() * 100; // 0-100%
  const secondsRemaining = (100 - currentCandleProgress) * 0.6; // segundos restantes na vela
  
  // Determinar timing de entrada
  let entryTiming: 'same_candle' | 'next_candle';
  let timeToEntry: number;
  let exitTime: number;
  
  if (secondsRemaining >= 30) {
    // Ainda há tempo para entrada na mesma vela
    entryTiming = 'same_candle';
    timeToEntry = Math.max(0, 30 - (60 - secondsRemaining)); // aguardar até 30s da vela
    exitTime = 60; // expira no final da vela atual
  } else {
    // Entrada será na próxima vela
    entryTiming = 'next_candle';
    timeToEntry = secondsRemaining + 30; // aguardar próxima vela + 30s
    exitTime = secondsRemaining + 60; // expira 60s após entrada
  }
  
  // Analisar fatores de risco
  const riskAnalysis = analyzeRiskFactors(recentCandles, currentCandle, tradeEntry);
  
  // Prever tamanho e comportamento da vela
  const candleAnalysis = analyzeCandleBehavior(recentCandles, currentCandle, currentCandleProgress);
  
  // Prever próxima vela se necessário
  const nextCandlePrediction = entryTiming === 'next_candle' ? 
    predictNextCandle(recentCandles, tradeEntry) : undefined;
  
  // Calcular probabilidade de sucesso
  const successProbability = calculateSuccessProbability(
    riskAnalysis,
    candleAnalysis,
    tradeEntry,
    entryTiming,
    nextCandlePrediction
  );
  
  // Decisão final
  const willSucceed = successProbability >= 65; // Mínimo 65% para considerar entrada
  const recommendation = determineRecommendation(
    willSucceed, 
    successProbability, 
    riskAnalysis.riskLevel,
    candleAnalysis.volatilityRisk
  );
  
  return {
    willSucceed,
    successProbability,
    entryTiming,
    timeToEntry,
    exitTime,
    riskFactors: riskAnalysis.factors,
    recommendation,
    candleAnalysis,
    nextCandlePrediction
  };
};

// Analisar fatores de risco que podem invalidar a entrada
const analyzeRiskFactors = (
  recentCandles: CandleData[], 
  currentCandle: CandleData, 
  tradeEntry: TradeEntry
) => {
  const factors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  // 1. Volatilidade extrema
  const volatility = calculateVolatility(recentCandles);
  if (volatility > 0.3) {
    factors.push('Volatilidade extrema detectada');
    riskLevel = 'high';
  } else if (volatility > 0.15) {
    factors.push('Volatilidade elevada');
    riskLevel = 'medium';
  }
  
  // 2. Padrão de reversão recente
  const hasRecentReversal = checkRecentReversals(recentCandles);
  if (hasRecentReversal) {
    factors.push('Padrão de reversão recente detectado');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }
  
  // 3. Velas muito grandes recentemente
  const hasLargeCandles = checkLargeCandlePattern(recentCandles);
  if (hasLargeCandles) {
    factors.push('Velas grandes recentes - risco de explosão');
    riskLevel = 'medium';
  }
  
  // 4. Conflito entre padrões
  const hasConflictingPatterns = tradeEntry.patterns.length > 3;
  if (hasConflictingPatterns) {
    factors.push('Muitos padrões conflitantes');
    riskLevel = 'medium';
  }
  
  // 5. Baixa confiança do padrão principal
  if (tradeEntry.confidence < 0.7) {
    factors.push('Confiança baixa no padrão principal');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }
  
  return { factors, riskLevel };
};

// Analisar comportamento esperado da vela
const analyzeCandleBehavior = (
  recentCandles: CandleData[], 
  currentCandle: CandleData, 
  progress: number
) => {
  const currentRange = currentCandle.high - currentCandle.low;
  const avgRange = recentCandles
    .slice(-5)
    .reduce((sum, c) => sum + (c.high - c.low), 0) / 5;
  
  // Prever tamanho final da vela
  let expectedCandleSize: 'small' | 'medium' | 'large' | 'explosive';
  const sizeRatio = currentRange / avgRange;
  
  if (sizeRatio > 2.5) {
    expectedCandleSize = 'explosive';
  } else if (sizeRatio > 1.5) {
    expectedCandleSize = 'large';
  } else if (sizeRatio > 0.8) {
    expectedCandleSize = 'medium';
  } else {
    expectedCandleSize = 'small';
  }
  
  // Calcular probabilidade de reversão
  const bodySize = Math.abs(currentCandle.close - currentCandle.open);
  const upperWick = currentCandle.high - Math.max(currentCandle.open, currentCandle.close);
  const lowerWick = Math.min(currentCandle.open, currentCandle.close) - currentCandle.low;
  
  let reversalProbability = 0;
  
  // Vela com pavios grandes = maior chance de reversão
  if (upperWick > bodySize * 1.5 || lowerWick > bodySize * 1.5) {
    reversalProbability += 30;
  }
  
  // Vela já muito grande = maior chance de reversão
  if (expectedCandleSize === 'explosive') {
    reversalProbability += 40;
  } else if (expectedCandleSize === 'large') {
    reversalProbability += 20;
  }
  
  // Progresso da vela - quanto mais avançada, maior risco
  reversalProbability += progress * 0.3;
  
  // Determinar risco de volatilidade
  let volatilityRisk: 'low' | 'medium' | 'high' | 'extreme';
  if (expectedCandleSize === 'explosive') {
    volatilityRisk = 'extreme';
  } else if (expectedCandleSize === 'large' || reversalProbability > 50) {
    volatilityRisk = 'high';
  } else if (expectedCandleSize === 'medium' || reversalProbability > 30) {
    volatilityRisk = 'medium';
  } else {
    volatilityRisk = 'low';
  }
  
  return {
    currentCandleProgress: progress,
    expectedCandleSize,
    reversalProbability: Math.min(100, reversalProbability),
    volatilityRisk
  };
};

// Prever comportamento da próxima vela
const predictNextCandle = (recentCandles: CandleData[], tradeEntry: TradeEntry) => {
  const last3 = recentCandles.slice(-3);
  const momentum = calculateMomentum(last3);
  
  let expectedDirection: 'alta' | 'baixa' | 'lateral' = 'lateral';
  let strength = 50;
  let confidence = 50;
  
  // Analisar momentum
  if (momentum > 0.02) {
    expectedDirection = 'alta';
    strength = Math.min(90, 50 + momentum * 1000);
  } else if (momentum < -0.02) {
    expectedDirection = 'baixa';
    strength = Math.min(90, 50 + Math.abs(momentum) * 1000);
  }
  
  // Ajustar confiança baseada na consistência
  const consistency = calculateConsistency(last3);
  confidence = Math.min(90, 30 + consistency * 60);
  
  // Verificar se alinha com a entrada
  const alignsWithEntry = (
    (tradeEntry.action === 'compra' && expectedDirection === 'alta') ||
    (tradeEntry.action === 'venda' && expectedDirection === 'baixa')
  );
  
  if (!alignsWithEntry && expectedDirection !== 'lateral') {
    confidence *= 0.6; // Reduzir confiança se contradiz a entrada
  }
  
  return {
    expectedDirection,
    strength,
    confidence
  };
};

// Calcular probabilidade final de sucesso
const calculateSuccessProbability = (
  riskAnalysis: any,
  candleAnalysis: any,
  tradeEntry: TradeEntry,
  entryTiming: 'same_candle' | 'next_candle',
  nextCandlePrediction?: any
): number => {
  
  let baseProbability = tradeEntry.confidence * 100;
  
  // Ajustar por timing
  if (entryTiming === 'same_candle') {
    // Entrada na mesma vela - mais arriscado
    baseProbability -= candleAnalysis.currentCandleProgress * 0.3;
    baseProbability -= candleAnalysis.reversalProbability * 0.5;
  } else {
    // Entrada na próxima vela - usar previsão
    if (nextCandlePrediction) {
      baseProbability = (baseProbability + nextCandlePrediction.confidence) / 2;
    }
  }
  
  // Penalizar por fatores de risco
  switch (riskAnalysis.riskLevel) {
    case 'high':
      baseProbability *= 0.6;
      break;
    case 'medium':
      baseProbability *= 0.8;
      break;
    default:
      break;
  }
  
  // Penalizar por volatilidade
  switch (candleAnalysis.volatilityRisk) {
    case 'extreme':
      baseProbability *= 0.4;
      break;
    case 'high':
      baseProbability *= 0.7;
      break;
    case 'medium':
      baseProbability *= 0.9;
      break;
    default:
      break;
  }
  
  // Ajustar por tamanho de vela esperado
  if (candleAnalysis.expectedCandleSize === 'explosive') {
    baseProbability *= 0.5; // Velas explosivas são muito arriscadas
  } else if (candleAnalysis.expectedCandleSize === 'large') {
    baseProbability *= 0.8;
  }
  
  return Math.max(0, Math.min(100, baseProbability));
};

// Determinar recomendação final
const determineRecommendation = (
  willSucceed: boolean,
  successProbability: number,
  riskLevel: 'low' | 'medium' | 'high',
  volatilityRisk: 'low' | 'medium' | 'high' | 'extreme'
): 'enter_now' | 'wait_next_candle' | 'skip_entry' => {
  
  if (!willSucceed || successProbability < 65) {
    return 'skip_entry';
  }
  
  if (riskLevel === 'high' || volatilityRisk === 'extreme') {
    return 'skip_entry';
  }
  
  if (volatilityRisk === 'high' || riskLevel === 'medium') {
    return 'wait_next_candle';
  }
  
  return 'enter_now';
};

// Funções auxiliares
const calculateVolatility = (candles: CandleData[]): number => {
  const ranges = candles.map(c => (c.high - c.low) / c.close);
  return ranges.reduce((sum, r) => sum + r, 0) / ranges.length;
};

const checkRecentReversals = (candles: CandleData[]): boolean => {
  if (candles.length < 3) return false;
  
  const last3 = candles.slice(-3);
  const directions = last3.map(c => c.close > c.open ? 'up' : 'down');
  
  // Verificar se há reversão nos últimos 3 candles
  return directions[0] !== directions[1] || directions[1] !== directions[2];
};

const checkLargeCandlePattern = (candles: CandleData[]): boolean => {
  const avgRange = candles.reduce((sum, c) => sum + (c.high - c.low), 0) / candles.length;
  const recent = candles.slice(-3);
  
  return recent.some(c => (c.high - c.low) > avgRange * 1.8);
};

const calculateMomentum = (candles: CandleData[]): number => {
  if (candles.length < 2) return 0;
  
  const first = candles[0].close;
  const last = candles[candles.length - 1].close;
  
  return (last - first) / first;
};

const calculateConsistency = (candles: CandleData[]): number => {
  if (candles.length < 2) return 0;
  
  const directions = candles.map(c => c.close > c.open ? 1 : -1);
  const sameDirection = directions.every(d => d === directions[0]);
  
  return sameDirection ? 1 : 0.3;
};
