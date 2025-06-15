
import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";
import { analyzeCandleMetrics } from "./candleAnalysis";

// Detectar padrão Martelo (Hammer)
const detectHammer = (candles: CandleData[], index: number): DetectedPattern | null => {
  if (index < 1) return null;
  
  const currentCandle = candles[index];
  const prevCandle = candles[index - 1];
  
  const metrics = analyzeCandleMetrics(currentCandle);
  
  // Critérios para Martelo:
  // 1. Pavio inferior pelo menos 2x o tamanho do corpo
  // 2. Pavio superior pequeno (máximo 10% do range total)
  // 3. Corpo pequeno (máximo 30% do range total)
  // 4. Candle anterior deve ser bearish (confirmando reversão)
  
  const bodySize = Math.abs(currentCandle.close - currentCandle.open);
  const totalRange = currentCandle.high - currentCandle.low;
  const lowerWick = Math.min(currentCandle.open, currentCandle.close) - currentCandle.low;
  const upperWick = currentCandle.high - Math.max(currentCandle.open, currentCandle.close);
  
  if (totalRange === 0) return null;
  
  const bodyPercent = (bodySize / totalRange) * 100;
  const lowerWickPercent = (lowerWick / totalRange) * 100;
  const upperWickPercent = (upperWick / totalRange) * 100;
  
  // Verificar critérios do martelo
  const isValidHammer = 
    lowerWickPercent >= 50 &&  // Pavio inferior dominante
    upperWickPercent <= 20 &&  // Pavio superior pequeno
    bodyPercent <= 40 &&       // Corpo relativamente pequeno
    lowerWick >= bodySize * 1.5; // Pavio inferior pelo menos 1.5x o corpo
  
  if (!isValidHammer) return null;
  
  // Verificar contexto bearish anterior para confirmação de reversão
  const prevIsBearish = prevCandle.close < prevCandle.open;
  let confidence = 0.6;
  
  // Ajustar confiança baseado no contexto
  if (prevIsBearish) confidence += 0.2;
  if (lowerWickPercent > 60) confidence += 0.1;
  if (bodyPercent < 20) confidence += 0.1;
  
  // Verificar se está em uma tendência de baixa (últimos 3 candles)
  if (index >= 3) {
    const trend = candles.slice(index - 3, index).every((c, i, arr) => 
      i === 0 || c.close < arr[i - 1].close
    );
    if (trend) confidence += 0.15;
  }
  
  return {
    type: 'Martelo',
    confidence: Math.min(0.95, confidence),
    description: `Martelo detectado - Pavio inferior: ${lowerWickPercent.toFixed(1)}%, Corpo: ${bodyPercent.toFixed(1)}%`,
    action: 'compra'
  };
};

// Detectar padrão Engolfo de Alta (Bullish Engulfing)
const detectBullishEngulfing = (candles: CandleData[], index: number): DetectedPattern | null => {
  if (index < 1) return null;
  
  const currentCandle = candles[index];
  const prevCandle = candles[index - 1];
  
  // Critérios para Engolfo de Alta:
  // 1. Candle anterior deve ser bearish (vermelho)
  // 2. Candle atual deve ser bullish (verde)
  // 3. Corpo do candle atual deve "engolir" completamente o corpo do anterior
  // 4. Volume maior (se disponível)
  
  const prevIsBearish = prevCandle.close < prevCandle.open;
  const currentIsBullish = currentCandle.close > currentCandle.open;
  
  if (!prevIsBearish || !currentIsBullish) return null;
  
  // Verificar se o corpo atual engolfa o anterior
  const currentBodyTop = Math.max(currentCandle.open, currentCandle.close);
  const currentBodyBottom = Math.min(currentCandle.open, currentCandle.close);
  const prevBodyTop = Math.max(prevCandle.open, prevCandle.close);
  const prevBodyBottom = Math.min(prevCandle.open, prevCandle.close);
  
  const isEngulfing = 
    currentBodyBottom < prevBodyBottom && 
    currentBodyTop > prevBodyTop;
  
  if (!isEngulfing) return null;
  
  // Calcular proporção do engolfo
  const prevBodySize = Math.abs(prevCandle.close - prevCandle.open);
  const currentBodySize = Math.abs(currentCandle.close - currentCandle.open);
  const engulfingRatio = currentBodySize / prevBodySize;
  
  let confidence = 0.65;
  
  // Ajustar confiança baseado na força do engolfo
  if (engulfingRatio > 1.5) confidence += 0.2;
  else if (engulfingRatio > 1.2) confidence += 0.1;
  
  // Verificar se está em uma tendência de baixa (melhor contexto para reversão)
  if (index >= 2) {
    const isDowntrend = candles.slice(index - 2, index).every((c, i, arr) => 
      i === 0 || c.close <= arr[i - 1].close
    );
    if (isDowntrend) confidence += 0.15;
  }
  
  // Verificar força do candle atual
  const currentRange = currentCandle.high - currentCandle.low;
  const bodyToRangeRatio = currentBodySize / currentRange;
  if (bodyToRangeRatio > 0.7) confidence += 0.1; // Corpo dominante
  
  return {
    type: 'Engolfo de Alta',
    confidence: Math.min(0.95, confidence),
    description: `Engolfo de Alta - Ratio: ${engulfingRatio.toFixed(2)}x, Corpo atual: ${bodyToRangeRatio.toFixed(2)}`,
    action: 'compra'
  };
};

// Função principal para detectar padrões de candlestick reais
export const detectCandlestickPatterns = (candles: CandleData[]): DetectedPattern[] => {
  if (candles.length < 2) return [];
  
  const patterns: DetectedPattern[] = [];
  
  // Analisar apenas os últimos 10 candles para performance
  const startIndex = Math.max(1, candles.length - 10);
  
  for (let i = startIndex; i < candles.length; i++) {
    // Detectar Martelo
    const hammer = detectHammer(candles, i);
    if (hammer) {
      patterns.push(hammer);
    }
    
    // Detectar Engolfo de Alta
    const bullishEngulfing = detectBullishEngulfing(candles, i);
    if (bullishEngulfing) {
      patterns.push(bullishEngulfing);
    }
  }
  
  // Retornar apenas os padrões mais recentes e confiáveis
  return patterns
    .filter(pattern => pattern.confidence > 0.5)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3); // Máximo 3 padrões
};

// Função para validar padrão em tempo real
export const validateRealtimePattern = (
  candles: CandleData[], 
  patternType: string
): { isValid: boolean; confidence: number; description: string } => {
  if (candles.length < 2) {
    return { isValid: false, confidence: 0, description: 'Dados insuficientes' };
  }
  
  const lastIndex = candles.length - 1;
  
  switch (patternType.toLowerCase()) {
    case 'martelo':
      const hammer = detectHammer(candles, lastIndex);
      return {
        isValid: hammer !== null,
        confidence: hammer?.confidence || 0,
        description: hammer?.description || 'Martelo não detectado'
      };
      
    case 'engolfo de alta':
      const engulfing = detectBullishEngulfing(candles, lastIndex);
      return {
        isValid: engulfing !== null,
        confidence: engulfing?.confidence || 0,
        description: engulfing?.description || 'Engolfo de Alta não detectado'
      };
      
    default:
      return { isValid: false, confidence: 0, description: 'Padrão não suportado' };
  }
};
