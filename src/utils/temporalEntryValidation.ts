
import { CandleData } from "../context/AnalyzerContext";

export interface TemporalValidation {
  shouldEnter: boolean;
  timeToExpiry: number;
  expiryCandle: 'current' | 'next';
  winProbability: number;
  riskFactors: string[];
  volatilityRisk: 'low' | 'medium' | 'high';
  reversalRisk: 'low' | 'medium' | 'high';
  candleSizeRisk: 'low' | 'medium' | 'high';
  recommendation: 'enter' | 'wait' | 'skip';
  reasoning: string;
}

export interface EntryTiming {
  secondsIntoCandle: number;
  secondsRemaining: number;
  expiryType: '30s' | '60s';
}

// Validar se a entrada tem chance real de vitória
export const validateTemporalEntry = (
  candles: CandleData[],
  signal: 'compra' | 'venda',
  confidence: number,
  entryTiming: EntryTiming
): TemporalValidation => {
  const current = candles[candles.length - 1];
  const previous = candles[candles.length - 2];
  const recent5 = candles.slice(-5);
  
  // Determinar qual vela será a de expiração
  const expiryCandle = entryTiming.expiryType === '30s' ? 'current' : 'next';
  const timeToExpiry = entryTiming.expiryType === '30s' ? 
    entryTiming.secondsRemaining : 
    entryTiming.secondsRemaining + 60;
  
  // Análise de volatilidade atual
  const volatilityRisk = analyzeVolatilityRisk(recent5, current);
  
  // Análise de risco de reversão
  const reversalRisk = analyzeReversalRisk(recent5, current, signal);
  
  // Análise de tamanho de vela (explosão)
  const candleSizeRisk = analyzeCandleSizeRisk(recent5, current, entryTiming.secondsIntoCandle);
  
  // Calcular probabilidade de vitória
  const winProbability = calculateWinProbability(
    confidence,
    volatilityRisk,
    reversalRisk,
    candleSizeRisk,
    timeToExpiry,
    signal,
    current,
    previous
  );
  
  // Identificar fatores de risco
  const riskFactors = identifyRiskFactors(
    volatilityRisk,
    reversalRisk,
    candleSizeRisk,
    timeToExpiry,
    entryTiming.secondsIntoCandle
  );
  
  // Determinar recomendação
  const recommendation = determineRecommendation(
    winProbability,
    riskFactors.length,
    timeToExpiry,
    entryTiming.secondsIntoCandle
  );
  
  // Gerar raciocínio
  const reasoning = generateReasoning(
    recommendation,
    winProbability,
    riskFactors,
    expiryCandle,
    timeToExpiry
  );
  
  return {
    shouldEnter: recommendation === 'enter',
    timeToExpiry,
    expiryCandle,
    winProbability,
    riskFactors,
    volatilityRisk,
    reversalRisk,
    candleSizeRisk,
    recommendation,
    reasoning
  };
};

// Analisar risco de volatilidade
const analyzeVolatilityRisk = (recent5: CandleData[], current: CandleData): 'low' | 'medium' | 'high' => {
  const recentRanges = recent5.map(c => ((c.high - c.low) / c.close) * 100);
  const avgRange = recentRanges.reduce((a, b) => a + b, 0) / recentRanges.length;
  const currentRange = ((current.high - current.low) / current.close) * 100;
  
  // Se o range atual já é muito maior que a média, há risco de explosão
  if (currentRange > avgRange * 2) return 'high';
  if (currentRange > avgRange * 1.5) return 'medium';
  
  // Verificar se há tendência de aumento de volatilidade
  const lastTwoRanges = recentRanges.slice(-2);
  if (lastTwoRanges.every((range, i) => i === 0 || range > lastTwoRanges[i - 1])) {
    return 'medium';
  }
  
  return 'low';
};

// Analisar risco de reversão
const analyzeReversalRisk = (
  recent5: CandleData[], 
  current: CandleData, 
  signal: 'compra' | 'venda'
): 'low' | 'medium' | 'high' => {
  const bodySize = Math.abs(current.close - current.open);
  const upperWick = current.high - Math.max(current.open, current.close);
  const lowerWick = Math.min(current.open, current.close) - current.low;
  const totalRange = current.high - current.low;
  
  // Verificar sinais de rejeição contrários ao sinal
  if (signal === 'compra' && upperWick > bodySize * 1.5 && upperWick > totalRange * 0.4) {
    return 'high'; // Rejeição no topo em sinal de compra
  }
  
  if (signal === 'venda' && lowerWick > bodySize * 1.5 && lowerWick > totalRange * 0.4) {
    return 'high'; // Rejeição no fundo em sinal de venda
  }
  
  // Verificar momentum contrário nos últimos candles
  const bullishCandles = recent5.filter(c => c.close > c.open).length;
  const bearishCandles = recent5.filter(c => c.close < c.open).length;
  
  if (signal === 'compra' && bearishCandles >= 4) return 'medium';
  if (signal === 'venda' && bullishCandles >= 4) return 'medium';
  
  // Verificar se o movimento já foi muito extenso
  const prices = recent5.map(c => c.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const movePercent = ((maxPrice - minPrice) / minPrice) * 100;
  
  if (movePercent > 0.3) return 'medium'; // Movimento já muito extenso
  
  return 'low';
};

// Analisar risco de explosão de vela
const analyzeCandleSizeRisk = (
  recent5: CandleData[], 
  current: CandleData, 
  secondsIntoCandle: number
): 'low' | 'medium' | 'high' => {
  const currentRange = current.high - current.low;
  const avgRange = recent5.slice(0, -1).reduce((sum, c) => sum + (c.high - c.low), 0) / 4;
  
  // Se já estamos com range muito acima da média
  if (currentRange > avgRange * 2.5) return 'high';
  if (currentRange > avgRange * 1.8) return 'medium';
  
  // Se ainda estamos no início da vela, risco de explosão é maior
  if (secondsIntoCandle < 15) {
    return 'medium'; // Muita coisa pode acontecer ainda
  }
  
  // Se estamos perto do final da vela, risco menor
  if (secondsIntoCandle > 45) {
    return 'low';
  }
  
  return 'low';
};

// Calcular probabilidade de vitória
const calculateWinProbability = (
  confidence: number,
  volatilityRisk: 'low' | 'medium' | 'high',
  reversalRisk: 'low' | 'medium' | 'high',
  candleSizeRisk: 'low' | 'medium' | 'high',
  timeToExpiry: number,
  signal: 'compra' | 'venda',
  current: CandleData,
  previous: CandleData
): number => {
  let probability = confidence; // Começar com a confiança base
  
  // Penalizar por volatilidade alta
  if (volatilityRisk === 'high') probability *= 0.6;
  else if (volatilityRisk === 'medium') probability *= 0.8;
  
  // Penalizar por risco de reversão
  if (reversalRisk === 'high') probability *= 0.5;
  else if (reversalRisk === 'medium') probability *= 0.75;
  
  // Penalizar por risco de explosão de vela
  if (candleSizeRisk === 'high') probability *= 0.7;
  else if (candleSizeRisk === 'medium') probability *= 0.85;
  
  // Ajustar por tempo disponível
  if (timeToExpiry < 20) probability *= 0.7; // Muito pouco tempo
  else if (timeToExpiry < 35) probability *= 0.85;
  
  // Verificar direção atual da vela
  const currentDirection = current.close > current.open ? 'alta' : 'baixa';
  if ((signal === 'compra' && currentDirection === 'baixa') ||
      (signal === 'venda' && currentDirection === 'alta')) {
    probability *= 0.8; // Contrário à direção atual
  }
  
  return Math.max(0.1, Math.min(1, probability));
};

// Identificar fatores de risco
const identifyRiskFactors = (
  volatilityRisk: 'low' | 'medium' | 'high',
  reversalRisk: 'low' | 'medium' | 'high',
  candleSizeRisk: 'low' | 'medium' | 'high',
  timeToExpiry: number,
  secondsIntoCandle: number
): string[] => {
  const factors: string[] = [];
  
  if (volatilityRisk === 'high') factors.push('Alta volatilidade detectada');
  if (reversalRisk === 'high') factors.push('Alto risco de reversão');
  if (candleSizeRisk === 'high') factors.push('Risco de explosão de vela');
  
  if (timeToExpiry < 20) factors.push('Tempo insuficiente para expiração');
  if (secondsIntoCandle < 10) factors.push('Entrada muito cedo na vela');
  if (secondsIntoCandle > 55) factors.push('Entrada muito tarde na vela');
  
  return factors;
};

// Determinar recomendação final
const determineRecommendation = (
  winProbability: number,
  riskFactorsCount: number,
  timeToExpiry: number,
  secondsIntoCandle: number
): 'enter' | 'wait' | 'skip' => {
  // Nunca entrar com probabilidade muito baixa
  if (winProbability < 0.4) return 'skip';
  
  // Nunca entrar com muitos fatores de risco
  if (riskFactorsCount >= 3) return 'skip';
  
  // Nunca entrar com tempo insuficiente
  if (timeToExpiry < 15) return 'skip';
  
  // Aguardar se há riscos moderados mas probabilidade ainda boa
  if (riskFactorsCount === 2 && winProbability < 0.65) return 'wait';
  
  // Aguardar se entrada muito cedo ou tarde demais
  if (secondsIntoCandle < 5 || secondsIntoCandle > 58) return 'wait';
  
  // Entrar apenas com boa probabilidade e poucos riscos
  if (winProbability >= 0.6 && riskFactorsCount <= 1) return 'enter';
  
  return 'wait';
};

// Gerar raciocínio da decisão
const generateReasoning = (
  recommendation: 'enter' | 'wait' | 'skip',
  winProbability: number,
  riskFactors: string[],
  expiryCandle: 'current' | 'next',
  timeToExpiry: number
): string => {
  const probPercent = Math.round(winProbability * 100);
  
  switch (recommendation) {
    case 'enter':
      return `✅ ENTRAR - Probabilidade ${probPercent}% | Expira na vela ${expiryCandle === 'current' ? 'atual' : 'próxima'} (${timeToExpiry}s) | Riscos baixos`;
    
    case 'wait':
      return `⏳ AGUARDAR - Probabilidade ${probPercent}% | Riscos: ${riskFactors.join(', ')} | Aguardar melhores condições`;
    
    case 'skip':
      return `❌ PULAR - Probabilidade ${probPercent}% | Riscos altos: ${riskFactors.join(', ')} | Buscar próxima oportunidade`;
  }
};

// Calcular timing da entrada baseado no momento atual
export const calculateEntryTiming = (currentTime: Date = new Date()): EntryTiming => {
  const seconds = currentTime.getSeconds();
  const secondsIntoCandle = seconds;
  const secondsRemaining = 60 - seconds;
  
  // Determinar tipo de expiração baseado no timing
  const expiryType = secondsIntoCandle <= 30 ? '30s' : '60s';
  
  return {
    secondsIntoCandle,
    secondsRemaining,
    expiryType
  };
};
