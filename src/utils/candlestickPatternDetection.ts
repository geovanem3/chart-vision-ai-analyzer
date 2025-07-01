import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";
import { analyzeCandleMetrics, validatePatternReliability } from "./candleAnalysis";

export const detectCandlestickPatterns = (candles: CandleData[]): DetectedPattern[] => {
  if (candles.length < 3) return [];

  const patterns: DetectedPattern[] = [];
  
  // Analisar últimos 15 candles para mais padrões
  const analysisWindow = Math.min(15, candles.length);
  const recentCandles = candles.slice(-analysisWindow);
  
  console.log(`🔍 Analisando ${analysisWindow} candles para TODOS os padrões disponíveis`);
  
  for (let i = 2; i < recentCandles.length; i++) {
    const current = recentCandles[i];
    const previous = recentCandles[i - 1];
    const previous2 = i >= 2 ? recentCandles[i - 2] : null;
    const previousCandles = recentCandles.slice(0, i);
    
    // === PADRÕES DE REVERSÃO ===
    
    // 1. Doji e variantes
    const dojiPattern = detectDoji(current);
    if (dojiPattern) {
      const validation = validatePatternReliability(current, previousCandles, 'doji');
      if (validation.isReliable) {
        patterns.push({ ...dojiPattern, confidence: validation.confidence });
      }
    }
    
    const dragonFlyDoji = detectDragonFlyDoji(current);
    if (dragonFlyDoji) {
      const validation = validatePatternReliability(current, previousCandles, 'dragonfly doji');
      if (validation.isReliable) {
        patterns.push({ ...dragonFlyDoji, confidence: validation.confidence });
      }
    }
    
    const graveStoneDoji = detectGraveStoneDoji(current);
    if (graveStoneDoji) {
      const validation = validatePatternReliability(current, previousCandles, 'gravestone doji');
      if (validation.isReliable) {
        patterns.push({ ...graveStoneDoji, confidence: validation.confidence });
      }
    }
    
    // 2. Martelos e variantes
    const hammerPattern = detectHammer(current);
    if (hammerPattern) {
      const validation = validatePatternReliability(current, previousCandles, 'martelo');
      if (validation.isReliable) {
        patterns.push({ ...hammerPattern, confidence: validation.confidence });
      }
    }
    
    const invertedHammer = detectInvertedHammer(current);
    if (invertedHammer) {
      const validation = validatePatternReliability(current, previousCandles, 'inverted hammer');
      if (validation.isReliable) {
        patterns.push({ ...invertedHammer, confidence: validation.confidence });
      }
    }
    
    // 3. Estrelas
    const shootingStarPattern = detectShootingStar(current);
    if (shootingStarPattern) {
      const validation = validatePatternReliability(current, previousCandles, 'estrela cadente');
      if (validation.isReliable) {
        patterns.push({ ...shootingStarPattern, confidence: validation.confidence });
      }
    }
    
    // 4. Spinning Tops
    const spinningTop = detectSpinningTop(current);
    if (spinningTop) {
      const validation = validatePatternReliability(current, previousCandles, 'spinning top');
      if (validation.isReliable) {
        patterns.push({ ...spinningTop, confidence: validation.confidence });
      }
    }
    
    // === PADRÕES DE DOIS CANDLES ===
    
    if (i > 0) {
      // Engolfo
      const engulfingPattern = detectEngulfing(previous, current);
      if (engulfingPattern) {
        const validation = validatePatternReliability(current, previousCandles, 'engolfo');
        if (validation.isReliable) {
          patterns.push({ ...engulfingPattern, confidence: validation.confidence });
        }
      }
      
      // Harami
      const haramiPattern = detectHarami(previous, current);
      if (haramiPattern) {
        const validation = validatePatternReliability(current, previousCandles, 'harami');
        if (validation.isReliable) {
          patterns.push({ ...haramiPattern, confidence: validation.confidence });
        }
      }
      
      // Piercing Line / Dark Cloud Cover
      const piercingPattern = detectPiercingLine(previous, current);
      if (piercingPattern) {
        const validation = validatePatternReliability(current, previousCandles, 'piercing line');
        if (validation.isReliable) {
          patterns.push({ ...piercingPattern, confidence: validation.confidence });
        }
      }
      
      // Tweezer Tops/Bottoms
      const tweezerPattern = detectTweezer(previous, current);
      if (tweezerPattern) {
        const validation = validatePatternReliability(current, previousCandles, 'tweezer');
        if (validation.isReliable) {
          patterns.push({ ...tweezerPattern, confidence: validation.confidence });
        }
      }
    }
    
    // === PADRÕES DE TRÊS CANDLES ===
    
    if (i >= 2 && previous2) {
      // Morning Star / Evening Star
      const morningStarPattern = detectMorningStar(previous2, previous, current);
      if (morningStarPattern) {
        const validation = validatePatternReliability(current, previousCandles, 'morning star');
        if (validation.isReliable) {
          patterns.push({ ...morningStarPattern, confidence: validation.confidence });
        }
      }
      
      const eveningStarPattern = detectEveningStar(previous2, previous, current);
      if (eveningStarPattern) {
        const validation = validatePatternReliability(current, previousCandles, 'evening star');
        if (validation.isReliable) {
          patterns.push({ ...eveningStarPattern, confidence: validation.confidence });
        }
      }
      
      // Three White Soldiers / Three Black Crows
      const threeWhiteSoldiers = detectThreeWhiteSoldiers(previous2, previous, current);
      if (threeWhiteSoldiers) {
        const validation = validatePatternReliability(current, previousCandles, 'three white soldiers');
        if (validation.isReliable) {
          patterns.push({ ...threeWhiteSoldiers, confidence: validation.confidence });
        }
      }
      
      const threeBlackCrows = detectThreeBlackCrows(previous2, previous, current);
      if (threeBlackCrows) {
        const validation = validatePatternReliability(current, previousCandles, 'three black crows');
        if (validation.isReliable) {
          patterns.push({ ...threeBlackCrows, confidence: validation.confidence });
        }
      }
    }
    
    // Pin Bar (melhorado)
    const pinBarPattern = detectPinBar(current);
    if (pinBarPattern) {
      const validation = validatePatternReliability(current, previousCandles, 'pin bar');
      if (validation.isReliable) {
        patterns.push({ ...pinBarPattern, confidence: validation.confidence });
      }
    }
    
    // === PADRÕES DE CONTINUAÇÃO ===
    
    // Marubozu
    const marubozuPattern = detectMarubozu(current);
    if (marubozuPattern) {
      const validation = validatePatternReliability(current, previousCandles, 'marubozu');
      if (validation.isReliable) {
        patterns.push({ ...marubozuPattern, confidence: validation.confidence });
      }
    }
  }
  
  console.log(`📊 DETECTADOS ${patterns.length} padrões TOTAIS antes da filtragem`);
  
  // Filtrar padrões duplicados e ordenar por confiança
  const uniquePatterns = patterns
    .filter((pattern, index, self) => 
      index === self.findIndex(p => p.type === pattern.type)
    )
    .sort((a, b) => b.confidence - a.confidence);
  
  console.log(`✅ PADRÕES ÚNICOS FINAIS: ${uniquePatterns.length}`);
  uniquePatterns.forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern.type} - ${pattern.action} (${Math.round(pattern.confidence * 100)}%)`);
  });
  
  return uniquePatterns.slice(0, 10); // Top 10 padrões mais confiáveis
};

// === IMPLEMENTAÇÃO DOS PADRÕES ===

// Manter funções existentes
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

// Novos padrões implementados:

const detectDragonFlyDoji = (candle: CandleData): DetectedPattern | null => {
  const metrics = analyzeCandleMetrics(candle);
  
  if (metrics.bodyPercent < 5 && 
      metrics.lowerWickPercent > 70 && 
      metrics.upperWickPercent < 10) {
    return {
      type: 'dragonfly_doji',
      confidence: 0.8,
      description: `Dragonfly Doji - Reversão bullish forte (pavio inferior: ${metrics.lowerWickPercent.toFixed(1)}%)`,
      action: 'compra'
    };
  }
  return null;
};

const detectGraveStoneDoji = (candle: CandleData): DetectedPattern | null => {
  const metrics = analyzeCandleMetrics(candle);
  
  if (metrics.bodyPercent < 5 && 
      metrics.upperWickPercent > 70 && 
      metrics.lowerWickPercent < 10) {
    return {
      type: 'gravestone_doji',
      confidence: 0.8,
      description: `Gravestone Doji - Reversão bearish forte (pavio superior: ${metrics.upperWickPercent.toFixed(1)}%)`,
      action: 'venda'
    };
  }
  return null;
};

const detectInvertedHammer = (candle: CandleData): DetectedPattern | null => {
  const metrics = analyzeCandleMetrics(candle);
  
  if (metrics.upperWickPercent > 60 && 
      metrics.bodyPercent < 30 && 
      metrics.lowerWickPercent < 20 &&
      metrics.candleType === 'bullish') {
    return {
      type: 'inverted_hammer',
      confidence: 0.75,
      description: `Inverted Hammer - Reversão bullish (pavio superior: ${metrics.upperWickPercent.toFixed(1)}%)`,
      action: 'compra'
    };
  }
  return null;
};

const detectSpinningTop = (candle: CandleData): DetectedPattern | null => {
  const metrics = analyzeCandleMetrics(candle);
  
  if (metrics.bodyPercent < 25 && 
      metrics.upperWickPercent > 25 && 
      metrics.lowerWickPercent > 25) {
    return {
      type: 'spinning_top',
      confidence: 0.6,
      description: `Spinning Top - Indecisão (corpo: ${metrics.bodyPercent.toFixed(1)}%)`,
      action: 'neutro'
    };
  }
  return null;
};

const detectHarami = (previous: CandleData, current: CandleData): DetectedPattern | null => {
  const prevMetrics = analyzeCandleMetrics(previous);
  const currMetrics = analyzeCandleMetrics(current);
  
  // Harami Bullish
  if (prevMetrics.candleType === 'bearish' && 
      currMetrics.candleType === 'bullish' &&
      current.high < previous.high &&
      current.low > previous.low &&
      currMetrics.bodySize < prevMetrics.bodySize * 0.7) {
    
    return {
      type: 'harami_bullish',
      confidence: 0.7,
      description: 'Harami Bullish - Reversão de tendência',
      action: 'compra'
    };
  }
  
  // Harami Bearish
  if (prevMetrics.candleType === 'bullish' && 
      currMetrics.candleType === 'bearish' &&
      current.high < previous.high &&
      current.low > previous.low &&
      currMetrics.bodySize < prevMetrics.bodySize * 0.7) {
    
    return {
      type: 'harami_bearish',
      confidence: 0.7,
      description: 'Harami Bearish - Reversão de tendência',
      action: 'venda'
    };
  }
  
  return null;
};

const detectPiercingLine = (previous: CandleData, current: CandleData): DetectedPattern | null => {
  const prevMetrics = analyzeCandleMetrics(previous);
  const currMetrics = analyzeCandleMetrics(current);
  
  // Piercing Line
  if (prevMetrics.candleType === 'bearish' && 
      currMetrics.candleType === 'bullish' &&
      current.open < previous.close &&
      current.close > (previous.open + previous.close) / 2 &&
      current.close < previous.open) {
    
    return {
      type: 'piercing_line',
      confidence: 0.75,
      description: 'Piercing Line - Reversão bullish',
      action: 'compra'
    };
  }
  
  // Dark Cloud Cover
  if (prevMetrics.candleType === 'bullish' && 
      currMetrics.candleType === 'bearish' &&
      current.open > previous.close &&
      current.close < (previous.open + previous.close) / 2 &&
      current.close > previous.open) {
    
    return {
      type: 'dark_cloud_cover',
      confidence: 0.75,
      description: 'Dark Cloud Cover - Reversão bearish',
      action: 'venda'
    };
  }
  
  return null;
};

const detectTweezer = (previous: CandleData, current: CandleData): DetectedPattern | null => {
  const tolerance = 0.001;
  
  // Tweezer Tops
  if (Math.abs(previous.high - current.high) < tolerance &&
      previous.high > previous.open && previous.high > previous.close &&
      current.high > current.open && current.high > current.close) {
    
    return {
      type: 'tweezer_tops',
      confidence: 0.7,
      description: 'Tweezer Tops - Reversão bearish',
      action: 'venda'
    };
  }
  
  // Tweezer Bottoms
  if (Math.abs(previous.low - current.low) < tolerance &&
      previous.low < previous.open && previous.low < previous.close &&
      current.low < current.open && current.low < current.close) {
    
    return {
      type: 'tweezer_bottoms',
      confidence: 0.7,
      description: 'Tweezer Bottoms - Reversão bullish',
      action: 'compra'
    };
  }
  
  return null;
};

const detectMorningStar = (first: CandleData, second: CandleData, third: CandleData): DetectedPattern | null => {
  const firstMetrics = analyzeCandleMetrics(first);
  const secondMetrics = analyzeCandleMetrics(second);
  const thirdMetrics = analyzeCandleMetrics(third);
  
  if (firstMetrics.candleType === 'bearish' &&
      secondMetrics.bodyPercent < 20 &&
      thirdMetrics.candleType === 'bullish' &&
      third.close > (first.open + first.close) / 2) {
    
    return {
      type: 'morning_star',
      confidence: 0.85,
      description: 'Morning Star - Reversão bullish forte',
      action: 'compra'
    };
  }
  
  return null;
};

const detectEveningStar = (first: CandleData, second: CandleData, third: CandleData): DetectedPattern | null => {
  const firstMetrics = analyzeCandleMetrics(first);
  const secondMetrics = analyzeCandleMetrics(second);
  const thirdMetrics = analyzeCandleMetrics(third);
  
  if (firstMetrics.candleType === 'bullish' &&
      secondMetrics.bodyPercent < 20 &&
      thirdMetrics.candleType === 'bearish' &&
      third.close < (first.open + first.close) / 2) {
    
    return {
      type: 'evening_star',
      confidence: 0.85,
      description: 'Evening Star - Reversão bearish forte',
      action: 'venda'
    };
  }
  
  return null;
};

const detectThreeWhiteSoldiers = (first: CandleData, second: CandleData, third: CandleData): DetectedPattern | null => {
  const firstMetrics = analyzeCandleMetrics(first);
  const secondMetrics = analyzeCandleMetrics(second);
  const thirdMetrics = analyzeCandleMetrics(third);
  
  if (firstMetrics.candleType === 'bullish' &&
      secondMetrics.candleType === 'bullish' &&
      thirdMetrics.candleType === 'bullish' &&
      second.close > first.close &&
      third.close > second.close &&
      firstMetrics.bodyPercent > 50 &&
      secondMetrics.bodyPercent > 50 &&
      thirdMetrics.bodyPercent > 50) {
    
    return {
      type: 'three_white_soldiers',
      confidence: 0.8,
      description: 'Three White Soldiers - Continuação bullish',
      action: 'compra'
    };
  }
  
  return null;
};

const detectThreeBlackCrows = (first: CandleData, second: CandleData, third: CandleData): DetectedPattern | null => {
  const firstMetrics = analyzeCandleMetrics(first);
  const secondMetrics = analyzeCandleMetrics(second);
  const thirdMetrics = analyzeCandleMetrics(third);
  
  if (firstMetrics.candleType === 'bearish' &&
      secondMetrics.candleType === 'bearish' &&
      thirdMetrics.candleType === 'bearish' &&
      second.close < first.close &&
      third.close < second.close &&
      firstMetrics.bodyPercent > 50 &&
      secondMetrics.bodyPercent > 50 &&
      thirdMetrics.bodyPercent > 50) {
    
    return {
      type: 'three_black_crows',
      confidence: 0.8,
      description: 'Three Black Crows - Continuação bearish',
      action: 'venda'
    };
  }
  
  return null;
};

const detectMarubozu = (candle: CandleData): DetectedPattern | null => {
  const metrics = analyzeCandleMetrics(candle);
  
  if (metrics.bodyPercent > 90 && 
      metrics.upperWickPercent < 5 && 
      metrics.lowerWickPercent < 5) {
    
    return {
      type: metrics.candleType === 'bullish' ? 'marubozu_bullish' : 'marubozu_bearish',
      confidence: 0.75,
      description: `Marubozu ${metrics.candleType === 'bullish' ? 'Bullish' : 'Bearish'} - Continuação forte`,
      action: metrics.candleType === 'bullish' ? 'compra' : 'venda'
    };
  }
  
  return null;
};
