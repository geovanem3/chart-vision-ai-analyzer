
import { CandleData } from '../context/AnalyzerContext';
import { DetectedPattern } from './types';

export const detectCommonPatterns = (candles: CandleData[]): DetectedPattern[] => {
  if (candles.length < 3) return [];
  
  const patterns: DetectedPattern[] = [];
  
  // Detectar padrões básicos usando dados reais dos candles
  for (let i = 2; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];
    
    // Hammer/Doji em suporte
    if (isHammer(current) && current.low <= prev.low) {
      patterns.push({
        type: 'hammer',
        action: 'compra',
        confidence: 0.75,
        description: 'Hammer em suporte'
      });
    }
    
    // Shooting Star em resistência
    if (isShootingStar(current) && current.high >= prev.high) {
      patterns.push({
        type: 'shooting_star',
        action: 'venda',
        confidence: 0.75,
        description: 'Shooting Star em resistência'
      });
    }
    
    // Engulfing bullish
    if (isBullishEngulfing(prev, current)) {
      patterns.push({
        type: 'bullish_engulfing',
        action: 'compra',
        confidence: 0.8,
        description: 'Engolfamento de alta'
      });
    }
    
    // Engulfing bearish
    if (isBearishEngulfing(prev, current)) {
      patterns.push({
        type: 'bearish_engulfing',
        action: 'venda',
        confidence: 0.8,
        description: 'Engolfamento de baixa'
      });
    }
  }
  
  return patterns;
};

const isHammer = (candle: CandleData): boolean => {
  const body = Math.abs(candle.close - candle.open);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  
  return lowerShadow > body * 2 && upperShadow < body * 0.5;
};

const isShootingStar = (candle: CandleData): boolean => {
  const body = Math.abs(candle.close - candle.open);
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  
  return upperShadow > body * 2 && lowerShadow < body * 0.5;
};

const isBullishEngulfing = (prev: CandleData, current: CandleData): boolean => {
  return prev.close < prev.open && // Candle anterior vermelho
         current.close > current.open && // Candle atual verde
         current.open < prev.close && // Abre abaixo do fechamento anterior
         current.close > prev.open; // Fecha acima da abertura anterior
};

const isBearishEngulfing = (prev: CandleData, current: CandleData): boolean => {
  return prev.close > prev.open && // Candle anterior verde
         current.close < current.open && // Candle atual vermelho
         current.open > prev.close && // Abre acima do fechamento anterior
         current.close < prev.open; // Fecha abaixo da abertura anterior
};
