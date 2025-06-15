
import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";
import { analyzeCandleMetrics, validatePatternReliability } from "./candleAnalysis";

export const detectCandlestickPatterns = (candles: CandleData[]): DetectedPattern[] => {
  if (candles.length < 3) return [];

  const patterns: DetectedPattern[] = [];
  
  // Analisar últimos 10 candles para padrões
  const analysisWindow = Math.min(10, candles.length);
  const recentCandles = candles.slice(-analysisWindow);
  
  for (let i = 1; i < recentCandles.length; i++) {
    const current = recentCandles[i];
    const previous = recentCandles[i - 1];
    const previousCandles = recentCandles.slice(0, i);
    
    // Detectar Doji
    const dojiPattern = detectDoji(current);
    if (dojiPattern) {
      const validation = validatePatternReliability(current, previousCandles, 'doji');
      if (validation.isReliable) {
        patterns.push({
          ...dojiPattern,
          confidence: validation.confidence
        });
      }
    }
    
    // Detectar Martelo
    const hammerPattern = detectHammer(current);
    if (hammerPattern) {
      const validation = validatePatternReliability(current, previousCandles, 'martelo');
      if (validation.isReliable) {
        patterns.push({
          ...hammerPattern,
          confidence: validation.confidence
        });
      }
    }
    
    // Detectar Estrela Cadente
    const shootingStarPattern = detectShootingStar(current);
    if (shootingStarPattern) {
      const validation = validatePatternReliability(current, previousCandles, 'estrela cadente');
      if (validation.isReliable) {
        patterns.push({
          ...shootingStarPattern,
          confidence: validation.confidence
        });
      }
    }
    
    // Detectar Engolfo (precisa de 2 candles)
    if (i > 0) {
      const engulfingPattern = detectEngulfing(previous, current);
      if (engulfingPattern) {
        const validation = validatePatternReliability(current, previousCandles, 'engolfo');
        if (validation.isReliable) {
          patterns.push({
            ...engulfingPattern,
            confidence: validation.confidence
          });
        }
      }
    }
    
    // Detectar Pin Bar
    const pinBarPattern = detectPinBar(current);
    if (pinBarPattern) {
      const validation = validatePatternReliability(current, previousCandles, 'pin bar');
      if (validation.isReliable) {
        patterns.push({
          ...pinBarPattern,
          confidence: validation.confidence
        });
      }
    }
  }
  
  // Filtrar padrões duplicados e ordenar por confiança
  return patterns
    .filter((pattern, index, self) => 
      index === self.findIndex(p => p.type === pattern.type)
    )
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Máximo 5 padrões mais confiáveis
};

const detectDoji = (candle: CandleData): DetectedPattern | null => {
  const metrics = analyzeCandleMetrics(candle);
  
  if (metrics.isDoji) {
    return {
      type: 'doji',
      confidence: 0.7,
      description: `Doji detectado - Indecisão do mercado (corpo: ${metrics.bodyPercent.toFixed(1)}%)`,
      action: 'neutro'
    };
  }
  
  return null;
};

const detectHammer = (candle: CandleData): DetectedPattern | null => {
  const metrics = analyzeCandleMetrics(candle);
  
  if (metrics.isHammer) {
    return {
      type: 'martelo',
      confidence: 0.75,
      description: `Martelo detectado - Padrão de reversão bullish (pavio inferior: ${metrics.lowerWickPercent.toFixed(1)}%)`,
      action: 'compra'
    };
  }
  
  return null;
};

const detectShootingStar = (candle: CandleData): DetectedPattern | null => {
  const metrics = analyzeCandleMetrics(candle);
  
  if (metrics.isShootingStar) {
    return {
      type: 'estrela_cadente',
      confidence: 0.75,
      description: `Estrela Cadente detectada - Padrão de reversão bearish (pavio superior: ${metrics.upperWickPercent.toFixed(1)}%)`,
      action: 'venda'
    };
  }
  
  return null;
};

const detectEngulfing = (previous: CandleData, current: CandleData): DetectedPattern | null => {
  const prevMetrics = analyzeCandleMetrics(previous);
  const currMetrics = analyzeCandleMetrics(current);
  
  // Engolfo de Alta (Bullish Engulfing)
  if (prevMetrics.candleType === 'bearish' && 
      currMetrics.candleType === 'bullish' &&
      current.open < previous.close &&
      current.close > previous.open &&
      currMetrics.bodySize > prevMetrics.bodySize * 1.2) {
    
    return {
      type: 'engolfo_alta',
      confidence: 0.8,
      description: 'Engolfo de Alta - Reversão bullish forte',
      action: 'compra'
    };
  }
  
  // Engolfo de Baixa (Bearish Engulfing)
  if (prevMetrics.candleType === 'bullish' && 
      currMetrics.candleType === 'bearish' &&
      current.open > previous.close &&
      current.close < previous.open &&
      currMetrics.bodySize > prevMetrics.bodySize * 1.2) {
    
    return {
      type: 'engolfo_baixa',
      confidence: 0.8,
      description: 'Engolfo de Baixa - Reversão bearish forte',
      action: 'venda'
    };
  }
  
  return null;
};

const detectPinBar = (candle: CandleData): DetectedPattern | null => {
  const metrics = analyzeCandleMetrics(candle);
  
  if (metrics.isPinBar) {
    if (metrics.wickDominance === 'lower') {
      return {
        type: 'pin_bar_bullish',
        confidence: 0.7,
        description: `Pin Bar Bullish - Rejeição de baixa (pavio inferior: ${metrics.lowerWickPercent.toFixed(1)}%)`,
        action: 'compra'
      };
    } else if (metrics.wickDominance === 'upper') {
      return {
        type: 'pin_bar_bearish',
        confidence: 0.7,
        description: `Pin Bar Bearish - Rejeição de alta (pavio superior: ${metrics.upperWickPercent.toFixed(1)}%)`,
        action: 'venda'
      };
    }
  }
  
  return null;
};
