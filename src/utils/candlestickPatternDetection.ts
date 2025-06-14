
import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";

export const detectCandlestickPatterns = (candles: CandleData[]): DetectedPattern[] => {
  if (candles.length < 3) return [];
  
  const patterns: DetectedPattern[] = [];
  
  // Analisar os últimos 5 candles para padrões
  for (let i = candles.length - 5; i < candles.length - 1; i++) {
    if (i < 1) continue;
    
    const prevCandle = candles[i - 1];
    const currentCandle = candles[i];
    const nextCandle = candles[i + 1];
    
    // Detectar Martelo (Hammer)
    const hammerPattern = detectHammer(currentCandle);
    if (hammerPattern) {
      patterns.push({
        type: 'martelo',
        confidence: hammerPattern.confidence,
        description: 'Padrão Martelo detectado - Possível reversão de alta',
        action: 'compra'
      });
    }
    
    // Detectar Doji
    const dojiPattern = detectDoji(currentCandle);
    if (dojiPattern) {
      patterns.push({
        type: 'doji',
        confidence: dojiPattern.confidence,
        description: 'Padrão Doji detectado - Indecisão do mercado',
        action: 'neutro'
      });
    }
    
    // Detectar Engolfo (precisa de 2 candles)
    if (i > 0) {
      const engolfingPattern = detectEngolfing(prevCandle, currentCandle);
      if (engolfingPattern) {
        patterns.push({
          type: 'engolfo',
          confidence: engolfingPattern.confidence,
          description: `Padrão Engolfo ${engolfingPattern.type} detectado`,
          action: engolfingPattern.type === 'alta' ? 'compra' : 'venda'
        });
      }
    }
    
    // Detectar Estrela Cadente (Shooting Star)
    const shootingStarPattern = detectShootingStar(currentCandle);
    if (shootingStarPattern) {
      patterns.push({
        type: 'estrela_cadente',
        confidence: shootingStarPattern.confidence,
        description: 'Padrão Estrela Cadente detectado - Possível reversão de baixa',
        action: 'venda'
      });
    }
  }
  
  // Remover padrões duplicados e manter apenas os de maior confiança
  const uniquePatterns = patterns.reduce((acc, current) => {
    const existing = acc.find(p => p.type === current.type);
    if (!existing || current.confidence > existing.confidence) {
      return [...acc.filter(p => p.type !== current.type), current];
    }
    return acc;
  }, [] as DetectedPattern[]);
  
  return uniquePatterns.filter(p => p.confidence > 0.6); // Só retorna padrões com confiança > 60%
};

// Detectar padrão Martelo
const detectHammer = (candle: CandleData): { confidence: number } | null => {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const totalRange = candle.high - candle.low;
  
  if (totalRange === 0) return null;
  
  // Martelo: corpo pequeno no topo, pavio inferior longo
  const bodyRatio = body / totalRange;
  const lowerWickRatio = lowerWick / totalRange;
  const upperWickRatio = upperWick / totalRange;
  
  // Critérios do martelo:
  // - Corpo pequeno (< 30% do range total)
  // - Pavio inferior pelo menos 2x o corpo
  // - Pavio superior pequeno (< 10% do range)
  if (bodyRatio < 0.3 && lowerWickRatio > 0.5 && upperWickRatio < 0.1 && lowerWick > body * 2) {
    const confidence = Math.min(0.95, 0.5 + (lowerWickRatio * 0.8) + (0.3 - bodyRatio));
    return { confidence };
  }
  
  return null;
};

// Detectar padrão Doji
const detectDoji = (candle: CandleData): { confidence: number } | null => {
  const body = Math.abs(candle.close - candle.open);
  const totalRange = candle.high - candle.low;
  
  if (totalRange === 0) return null;
  
  const bodyRatio = body / totalRange;
  
  // Doji: corpo muito pequeno (< 5% do range total)
  if (bodyRatio < 0.05) {
    const confidence = Math.min(0.9, 0.8 - (bodyRatio * 10)); // Quanto menor o corpo, maior a confiança
    return { confidence };
  }
  
  return null;
};

// Detectar padrão Engolfo
const detectEngolfing = (prevCandle: CandleData, currentCandle: CandleData): { type: 'alta' | 'baixa', confidence: number } | null => {
  const prevBody = Math.abs(prevCandle.close - prevCandle.open);
  const currentBody = Math.abs(currentCandle.close - currentCandle.open);
  
  // O candle atual deve engolir completamente o anterior
  const prevIsGreen = prevCandle.close > prevCandle.open;
  const currentIsGreen = currentCandle.close > currentCandle.open;
  
  // Engolfo de Alta: candle anterior vermelho, atual verde e maior
  if (!prevIsGreen && currentIsGreen && 
      currentCandle.open < prevCandle.close && 
      currentCandle.close > prevCandle.open &&
      currentBody > prevBody * 1.2) {
    
    const confidence = Math.min(0.9, 0.6 + (currentBody / prevBody) * 0.2);
    return { type: 'alta', confidence };
  }
  
  // Engolfo de Baixa: candle anterior verde, atual vermelho e maior
  if (prevIsGreen && !currentIsGreen && 
      currentCandle.open > prevCandle.close && 
      currentCandle.close < prevCandle.open &&
      currentBody > prevBody * 1.2) {
    
    const confidence = Math.min(0.9, 0.6 + (currentBody / prevBody) * 0.2);
    return { type: 'baixa', confidence };
  }
  
  return null;
};

// Detectar Estrela Cadente (Shooting Star)
const detectShootingStar = (candle: CandleData): { confidence: number } | null => {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const totalRange = candle.high - candle.low;
  
  if (totalRange === 0) return null;
  
  const bodyRatio = body / totalRange;
  const upperWickRatio = upperWick / totalRange;
  const lowerWickRatio = lowerWick / totalRange;
  
  // Critérios da Estrela Cadente:
  // - Corpo pequeno na parte inferior
  // - Pavio superior longo (pelo menos 2x o corpo)
  // - Pavio inferior pequeno
  if (bodyRatio < 0.3 && upperWickRatio > 0.5 && lowerWickRatio < 0.1 && upperWick > body * 2) {
    const confidence = Math.min(0.95, 0.5 + (upperWickRatio * 0.8) + (0.3 - bodyRatio));
    return { confidence };
  }
  
  return null;
};
