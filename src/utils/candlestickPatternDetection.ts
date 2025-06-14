
import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";

export const detectCandlestickPatterns = (candles: CandleData[]): DetectedPattern[] => {
  if (candles.length < 5) return [];
  
  const patterns: DetectedPattern[] = [];
  
  // Analisar os últimos 10 candles para padrões mais complexos
  for (let i = Math.max(0, candles.length - 10); i < candles.length - 1; i++) {
    if (i < 2) continue;
    
    const candle1 = candles[i - 2];
    const candle2 = candles[i - 1];
    const candle3 = candles[i];
    const candle4 = i + 1 < candles.length ? candles[i + 1] : null;
    
    // === PADRÕES DE 1 CANDLE ===
    
    // Martelo (Hammer)
    const hammerPattern = detectHammer(candle3);
    if (hammerPattern) {
      patterns.push({
        type: 'martelo',
        confidence: hammerPattern.confidence,
        description: 'Padrão Martelo - Reversão de alta',
        action: 'compra'
      });
    }
    
    // Doji
    const dojiPattern = detectDoji(candle3);
    if (dojiPattern) {
      patterns.push({
        type: 'doji',
        confidence: dojiPattern.confidence,
        description: 'Padrão Doji - Indecisão do mercado',
        action: 'neutro'
      });
    }
    
    // Estrela Cadente (Shooting Star)
    const shootingStarPattern = detectShootingStar(candle3);
    if (shootingStarPattern) {
      patterns.push({
        type: 'estrela_cadente',
        confidence: shootingStarPattern.confidence,
        description: 'Padrão Estrela Cadente - Reversão de baixa',
        action: 'venda'
      });
    }
    
    // Spinning Top
    const spinningTopPattern = detectSpinningTop(candle3);
    if (spinningTopPattern) {
      patterns.push({
        type: 'spinning_top',
        confidence: spinningTopPattern.confidence,
        description: 'Padrão Spinning Top - Indecisão',
        action: 'neutro'
      });
    }
    
    // Marubozu
    const marubozuPattern = detectMarubozu(candle3);
    if (marubozuPattern) {
      patterns.push({
        type: 'marubozu',
        confidence: marubozuPattern.confidence,
        description: `Padrão Marubozu ${marubozuPattern.type} - Força direcionnal`,
        action: marubozuPattern.type === 'alta' ? 'compra' : 'venda'
      });
    }
    
    // === PADRÕES DE 2 CANDLES ===
    
    // Engolfo
    const engolfingPattern = detectEngolfing(candle2, candle3);
    if (engolfingPattern) {
      patterns.push({
        type: 'engolfo',
        confidence: engolfingPattern.confidence,
        description: `Padrão Engolfo ${engolfingPattern.type}`,
        action: engolfingPattern.type === 'alta' ? 'compra' : 'venda'
      });
    }
    
    // Piercing Line / Dark Cloud Cover
    const piercingPattern = detectPiercingLineDarkCloud(candle2, candle3);
    if (piercingPattern) {
      patterns.push({
        type: piercingPattern.type,
        confidence: piercingPattern.confidence,
        description: piercingPattern.description,
        action: piercingPattern.action
      });
    }
    
    // Harami
    const haramiPattern = detectHarami(candle2, candle3);
    if (haramiPattern) {
      patterns.push({
        type: 'harami',
        confidence: haramiPattern.confidence,
        description: `Padrão Harami ${haramiPattern.type}`,
        action: haramiPattern.type === 'alta' ? 'compra' : 'venda'
      });
    }
    
    // Tweezer Tops/Bottoms
    const tweezerPattern = detectTweezer(candle2, candle3);
    if (tweezerPattern) {
      patterns.push({
        type: 'tweezer',
        confidence: tweezerPattern.confidence,
        description: `Padrão Tweezer ${tweezerPattern.type}`,
        action: tweezerPattern.type === 'top' ? 'venda' : 'compra'
      });
    }
    
    // === PADRÕES DE 3 CANDLES ===
    
    // Estrela da Manhã / Estrela da Tarde
    const starPattern = detectMorningEveningStar(candle1, candle2, candle3);
    if (starPattern) {
      patterns.push({
        type: starPattern.type,
        confidence: starPattern.confidence,
        description: starPattern.description,
        action: starPattern.action
      });
    }
    
    // Three White Soldiers / Three Black Crows
    const threeSoldiersPattern = detectThreeSoldiersCrows(candle1, candle2, candle3);
    if (threeSoldiersPattern) {
      patterns.push({
        type: threeSoldiersPattern.type,
        confidence: threeSoldiersPattern.confidence,
        description: threeSoldiersPattern.description,
        action: threeSoldiersPattern.action
      });
    }
    
    // Inside Bar / Outside Bar
    const insideOutsidePattern = detectInsideOutsideBar(candle2, candle3);
    if (insideOutsidePattern) {
      patterns.push({
        type: insideOutsidePattern.type,
        confidence: insideOutsidePattern.confidence,
        description: insideOutsidePattern.description,
        action: insideOutsidePattern.action
      });
    }
    
    // Pin Bar
    const pinBarPattern = detectPinBar(candle3, candle2);
    if (pinBarPattern) {
      patterns.push({
        type: 'pin_bar',
        confidence: pinBarPattern.confidence,
        description: `Pin Bar ${pinBarPattern.type}`,
        action: pinBarPattern.type === 'alta' ? 'compra' : 'venda'
      });
    }
  }
  
  // Remover duplicados e ordenar por confiança
  const uniquePatterns = patterns.reduce((acc, current) => {
    const existing = acc.find(p => p.type === current.type);
    if (!existing || current.confidence > existing.confidence) {
      return [...acc.filter(p => p.type !== current.type), current];
    }
    return acc;
  }, [] as DetectedPattern[]);
  
  return uniquePatterns.filter(p => p.confidence > 0.5).sort((a, b) => b.confidence - a.confidence);
};

// === IMPLEMENTAÇÕES DOS PADRÕES ===

// Martelo (já existia - mantendo)
const detectHammer = (candle: CandleData): { confidence: number } | null => {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const totalRange = candle.high - candle.low;
  
  if (totalRange === 0) return null;
  
  const bodyRatio = body / totalRange;
  const lowerWickRatio = lowerWick / totalRange;
  const upperWickRatio = upperWick / totalRange;
  
  if (bodyRatio < 0.3 && lowerWickRatio > 0.5 && upperWickRatio < 0.1 && lowerWick > body * 2) {
    const confidence = Math.min(0.95, 0.5 + (lowerWickRatio * 0.8) + (0.3 - bodyRatio));
    return { confidence };
  }
  
  return null;
};

// Doji (já existia - mantendo)
const detectDoji = (candle: CandleData): { confidence: number } | null => {
  const body = Math.abs(candle.close - candle.open);
  const totalRange = candle.high - candle.low;
  
  if (totalRange === 0) return null;
  
  const bodyRatio = body / totalRange;
  
  if (bodyRatio < 0.05) {
    const confidence = Math.min(0.9, 0.8 - (bodyRatio * 10));
    return { confidence };
  }
  
  return null;
};

// Estrela Cadente (já existia - mantendo)
const detectShootingStar = (candle: CandleData): { confidence: number } | null => {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const totalRange = candle.high - candle.low;
  
  if (totalRange === 0) return null;
  
  const bodyRatio = body / totalRange;
  const upperWickRatio = upperWick / totalRange;
  const lowerWickRatio = lowerWick / totalRange;
  
  if (bodyRatio < 0.3 && upperWickRatio > 0.5 && lowerWickRatio < 0.1 && upperWick > body * 2) {
    const confidence = Math.min(0.95, 0.5 + (upperWickRatio * 0.8) + (0.3 - bodyRatio));
    return { confidence };
  }
  
  return null;
};

// NOVO: Spinning Top
const detectSpinningTop = (candle: CandleData): { confidence: number } | null => {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const totalRange = candle.high - candle.low;
  
  if (totalRange === 0) return null;
  
  const bodyRatio = body / totalRange;
  const upperWickRatio = upperWick / totalRange;
  const lowerWickRatio = lowerWick / totalRange;
  
  // Spinning Top: corpo pequeno, pavios similares em ambos os lados
  if (bodyRatio < 0.25 && upperWickRatio > 0.2 && lowerWickRatio > 0.2 && 
      Math.abs(upperWickRatio - lowerWickRatio) < 0.3) {
    const confidence = Math.min(0.85, 0.6 + (0.25 - bodyRatio) * 2);
    return { confidence };
  }
  
  return null;
};

// NOVO: Marubozu
const detectMarubozu = (candle: CandleData): { type: 'alta' | 'baixa', confidence: number } | null => {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const totalRange = candle.high - candle.low;
  
  if (totalRange === 0) return null;
  
  const bodyRatio = body / totalRange;
  const upperWickRatio = upperWick / totalRange;
  const lowerWickRatio = lowerWick / totalRange;
  
  // Marubozu: corpo ocupa quase todo o range (>85%), pavios mínimos
  if (bodyRatio > 0.85 && upperWickRatio < 0.05 && lowerWickRatio < 0.05) {
    const type = candle.close > candle.open ? 'alta' : 'baixa';
    const confidence = Math.min(0.9, 0.7 + bodyRatio * 0.2);
    return { type, confidence };
  }
  
  return null;
};

// Engolfo (já existia - mantendo)
const detectEngolfing = (prevCandle: CandleData, currentCandle: CandleData): { type: 'alta' | 'baixa', confidence: number } | null => {
  const prevBody = Math.abs(prevCandle.close - prevCandle.open);
  const currentBody = Math.abs(currentCandle.close - currentCandle.open);
  
  const prevIsGreen = prevCandle.close > prevCandle.open;
  const currentIsGreen = currentCandle.close > currentCandle.open;
  
  // Engolfo de Alta
  if (!prevIsGreen && currentIsGreen && 
      currentCandle.open < prevCandle.close && 
      currentCandle.close > prevCandle.open &&
      currentBody > prevBody * 1.2) {
    
    const confidence = Math.min(0.9, 0.6 + (currentBody / prevBody) * 0.2);
    return { type: 'alta', confidence };
  }
  
  // Engolfo de Baixa
  if (prevIsGreen && !currentIsGreen && 
      currentCandle.open > prevCandle.close && 
      currentCandle.close < prevCandle.open &&
      currentBody > prevBody * 1.2) {
    
    const confidence = Math.min(0.9, 0.6 + (currentBody / prevBody) * 0.2);
    return { type: 'baixa', confidence };
  }
  
  return null;
};

// NOVO: Piercing Line / Dark Cloud Cover
const detectPiercingLineDarkCloud = (candle1: CandleData, candle2: CandleData): { type: string, confidence: number, description: string, action: 'compra' | 'venda' } | null => {
  const body1 = Math.abs(candle1.close - candle1.open);
  const body2 = Math.abs(candle2.close - candle2.open);
  
  const candle1IsGreen = candle1.close > candle1.open;
  const candle2IsGreen = candle2.close > candle2.open;
  
  // Piercing Line (reversão de alta)
  if (!candle1IsGreen && candle2IsGreen) {
    const midPoint = (candle1.open + candle1.close) / 2;
    
    if (candle2.open < candle1.close && candle2.close > midPoint && candle2.close < candle1.open) {
      const penetration = (candle2.close - candle1.close) / body1;
      if (penetration > 0.5) {
        const confidence = Math.min(0.85, 0.6 + penetration * 0.3);
        return {
          type: 'piercing_line',
          confidence,
          description: 'Padrão Piercing Line - Reversão de alta',
          action: 'compra'
        };
      }
    }
  }
  
  // Dark Cloud Cover (reversão de baixa)
  if (candle1IsGreen && !candle2IsGreen) {
    const midPoint = (candle1.open + candle1.close) / 2;
    
    if (candle2.open > candle1.close && candle2.close < midPoint && candle2.close > candle1.open) {
      const penetration = (candle1.close - candle2.close) / body1;
      if (penetration > 0.5) {
        const confidence = Math.min(0.85, 0.6 + penetration * 0.3);
        return {
          type: 'dark_cloud_cover',
          confidence,
          description: 'Padrão Dark Cloud Cover - Reversão de baixa',
          action: 'venda'
        };
      }
    }
  }
  
  return null;
};

// NOVO: Harami
const detectHarami = (candle1: CandleData, candle2: CandleData): { type: 'alta' | 'baixa', confidence: number } | null => {
  const body1 = Math.abs(candle1.close - candle1.open);
  const body2 = Math.abs(candle2.close - candle2.open);
  
  const candle1IsGreen = candle1.close > candle1.open;
  const candle2IsGreen = candle2.close > candle2.open;
  
  // Harami: segundo candle dentro do corpo do primeiro
  const candle2High = Math.max(candle2.open, candle2.close);
  const candle2Low = Math.min(candle2.open, candle2.close);
  const candle1High = Math.max(candle1.open, candle1.close);
  const candle1Low = Math.min(candle1.open, candle1.close);
  
  if (candle2High < candle1High && candle2Low > candle1Low && body2 < body1 * 0.7) {
    // Harami de Alta: primeiro candle bearish, segundo bullish
    if (!candle1IsGreen && candle2IsGreen) {
      const confidence = Math.min(0.8, 0.6 + (body1 / body2) * 0.1);
      return { type: 'alta', confidence };
    }
    
    // Harami de Baixa: primeiro candle bullish, segundo bearish
    if (candle1IsGreen && !candle2IsGreen) {
      const confidence = Math.min(0.8, 0.6 + (body1 / body2) * 0.1);
      return { type: 'baixa', confidence };
    }
  }
  
  return null;
};

// NOVO: Tweezer Tops/Bottoms
const detectTweezer = (candle1: CandleData, candle2: CandleData): { type: 'top' | 'bottom', confidence: number } | null => {
  const priceTolerance = Math.max(candle1.high, candle2.high) * 0.001; // 0.1% tolerance
  
  // Tweezer Top: máximos similares
  if (Math.abs(candle1.high - candle2.high) < priceTolerance) {
    const candle1IsGreen = candle1.close > candle1.open;
    const candle2IsGreen = candle2.close > candle2.open;
    
    if (candle1IsGreen && !candle2IsGreen) {
      const confidence = 0.75;
      return { type: 'top', confidence };
    }
  }
  
  // Tweezer Bottom: mínimos similares
  if (Math.abs(candle1.low - candle2.low) < priceTolerance) {
    const candle1IsGreen = candle1.close > candle1.open;
    const candle2IsGreen = candle2.close > candle2.open;
    
    if (!candle1IsGreen && candle2IsGreen) {
      const confidence = 0.75;
      return { type: 'bottom', confidence };
    }
  }
  
  return null;
};

// NOVO: Morning Star / Evening Star
const detectMorningEveningStar = (candle1: CandleData, candle2: CandleData, candle3: CandleData): { type: string, confidence: number, description: string, action: 'compra' | 'venda' } | null => {
  const body1 = Math.abs(candle1.close - candle1.open);
  const body2 = Math.abs(candle2.close - candle2.open);
  const body3 = Math.abs(candle3.close - candle3.open);
  
  const candle1IsGreen = candle1.close > candle1.open;
  const candle3IsGreen = candle3.close > candle3.open;
  
  // Morning Star (reversão de alta)
  if (!candle1IsGreen && candle3IsGreen && body2 < body1 * 0.5 && body2 < body3 * 0.5) {
    if (candle2.high < Math.min(candle1.close, candle3.open) && candle3.close > (candle1.open + candle1.close) / 2) {
      const confidence = 0.8;
      return {
        type: 'morning_star',
        confidence,
        description: 'Padrão Morning Star - Reversão de alta',
        action: 'compra'
      };
    }
  }
  
  // Evening Star (reversão de baixa)
  if (candle1IsGreen && !candle3IsGreen && body2 < body1 * 0.5 && body2 < body3 * 0.5) {
    if (candle2.low > Math.max(candle1.close, candle3.open) && candle3.close < (candle1.open + candle1.close) / 2) {
      const confidence = 0.8;
      return {
        type: 'evening_star',
        confidence,
        description: 'Padrão Evening Star - Reversão de baixa',
        action: 'venda'
      };
    }
  }
  
  return null;
};

// NOVO: Three White Soldiers / Three Black Crows
const detectThreeSoldiersCrows = (candle1: CandleData, candle2: CandleData, candle3: CandleData): { type: string, confidence: number, description: string, action: 'compra' | 'venda' } | null => {
  const candle1IsGreen = candle1.close > candle1.open;
  const candle2IsGreen = candle2.close > candle2.open;
  const candle3IsGreen = candle3.close > candle3.open;
  
  // Three White Soldiers
  if (candle1IsGreen && candle2IsGreen && candle3IsGreen) {
    if (candle2.close > candle1.close && candle3.close > candle2.close &&
        candle2.open > candle1.open && candle2.open < candle1.close &&
        candle3.open > candle2.open && candle3.open < candle2.close) {
      
      const confidence = 0.82;
      return {
        type: 'three_white_soldiers',
        confidence,
        description: 'Padrão Three White Soldiers - Forte alta',
        action: 'compra'
      };
    }
  }
  
  // Three Black Crows
  if (!candle1IsGreen && !candle2IsGreen && !candle3IsGreen) {
    if (candle2.close < candle1.close && candle3.close < candle2.close &&
        candle2.open < candle1.open && candle2.open > candle1.close &&
        candle3.open < candle2.open && candle3.open > candle2.close) {
      
      const confidence = 0.82;
      return {
        type: 'three_black_crows',
        confidence,
        description: 'Padrão Three Black Crows - Forte baixa',
        action: 'venda'
      };
    }
  }
  
  return null;
};

// NOVO: Inside Bar / Outside Bar
const detectInsideOutsideBar = (candle1: CandleData, candle2: CandleData): { type: string, confidence: number, description: string, action: 'compra' | 'venda' | 'neutro' } | null => {
  // Inside Bar: candle2 dentro do range de candle1
  if (candle2.high < candle1.high && candle2.low > candle1.low) {
    return {
      type: 'inside_bar',
      confidence: 0.65,
      description: 'Inside Bar - Consolidação',
      action: 'neutro'
    };
  }
  
  // Outside Bar: candle2 engloba candle1
  if (candle2.high > candle1.high && candle2.low < candle1.low) {
    const candle2IsGreen = candle2.close > candle2.open;
    return {
      type: 'outside_bar',
      confidence: 0.75,
      description: 'Outside Bar - Movimento forte',
      action: candle2IsGreen ? 'compra' : 'venda'
    };
  }
  
  return null;
};

// NOVO: Pin Bar
const detectPinBar = (currentCandle: CandleData, prevCandle: CandleData): { type: 'alta' | 'baixa', confidence: number } | null => {
  const body = Math.abs(currentCandle.close - currentCandle.open);
  const upperWick = currentCandle.high - Math.max(currentCandle.open, currentCandle.close);
  const lowerWick = Math.min(currentCandle.open, currentCandle.close) - currentCandle.low;
  const totalRange = currentCandle.high - currentCandle.low;
  
  if (totalRange === 0) return null;
  
  const bodyRatio = body / totalRange;
  
  // Pin Bar deve ter corpo pequeno (<30%)
  if (bodyRatio > 0.3) return null;
  
  // Pin Bar de Alta (rejection de baixa)
  if (lowerWick > totalRange * 0.6 && upperWick < totalRange * 0.2) {
    // Verificar se testou níveis baixos em relação ao candle anterior
    if (currentCandle.low < prevCandle.low) {
      const confidence = Math.min(0.88, 0.65 + (lowerWick / totalRange) * 0.4);
      return { type: 'alta', confidence };
    }
  }
  
  // Pin Bar de Baixa (rejection de alta)
  if (upperWick > totalRange * 0.6 && lowerWick < totalRange * 0.2) {
    // Verificar se testou níveis altos em relação ao candle anterior
    if (currentCandle.high > prevCandle.high) {
      const confidence = Math.min(0.88, 0.65 + (upperWick / totalRange) * 0.4);
      return { type: 'baixa', confidence };
    }
  }
  
  return null;
};
