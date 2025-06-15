import { CandleData } from "../context/AnalyzerContext";

interface ChartPattern {
  pattern: string;
  confidence: number;
  description: string;
  recommendation: string;
  action: 'compra' | 'venda' | 'neutro';
}

export const detectChartPatterns = async (candles: CandleData[], patternType: string, options: any): Promise<ChartPattern[]> => {
  if (candles.length < 10) return [];
  
  const patterns: ChartPattern[] = [];
  
  // Detectar TODOS os padrões, não apenas o tipo solicitado
  const allPatterns = [
    // Padrões existentes
    detectTrianglePattern(candles),
    detectSupportResistancePattern(candles),
    detectChannelPattern(candles),
    detectBreakoutPattern(candles),
    
    // NOVOS padrões gráficos
    detectHeadAndShoulders(candles),
    detectInverseHeadAndShoulders(candles),
    detectDoubleTop(candles),
    detectDoubleBottom(candles),
    detectTripleTop(candles),
    detectTripleBottom(candles),
    detectWedgePattern(candles),
    detectFlagPennantPattern(candles),
    detectCupAndHandle(candles),
    detectRectanglePattern(candles),
    detectDiamondPattern(candles),
    
    // Padrões de continuação e reversão
    detectPullbackPattern(candles),
    detectFalseBreakoutPattern(candles),
    detectGapPattern(candles),
    detectVolumeClimaxPattern(candles),
    
    // Padrões de estrutura de mercado
    detectHigherHighsLowerLows(candles),
    detectMarketStructureBreak(candles),
    detectLiquidityGrabPattern(candles)
  ].filter(pattern => pattern !== null) as ChartPattern[];
  
  patterns.push(...allPatterns);
  
  return patterns.filter(p => p.confidence > 0.5).sort((a, b) => b.confidence - a.confidence);
};

// === PADRÕES EXISTENTES (mantendo) ===

const detectTrianglePattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 20) return null;
  
  const recent20 = candles.slice(-20);
  const highs = recent20.map(c => c.high);
  const lows = recent20.map(c => c.low);
  
  const maxHigh = Math.max(...highs.slice(0, 10));
  const recentMaxHigh = Math.max(...highs.slice(-10));
  const minLow = Math.min(...lows.slice(0, 10));
  const recentMinLow = Math.min(...lows.slice(-10));
  
  const highsDescending = recentMaxHigh < maxHigh * 0.998;
  const lowsAscending = recentMinLow > minLow * 1.002;
  
  if (highsDescending && lowsAscending) {
    const range = (maxHigh - minLow) / maxHigh * 100;
    const recentRange = (recentMaxHigh - recentMinLow) / recentMaxHigh * 100;
    
    if (recentRange < range * 0.7) {
      const confidence = Math.min(0.85, 0.6 + (range - recentRange) / range * 0.3);
      
      return {
        pattern: 'Triângulo Simétrico',
        confidence,
        description: 'Padrão triangular - Convergência de preços',
        recommendation: 'Aguardar rompimento para definir direção',
        action: 'neutro'
      };
    }
  }
  
  return null;
};

const detectSupportResistancePattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 10) return null;
  
  const recentCandles = candles.slice(-10);
  const currentPrice = recentCandles[recentCandles.length - 1].close;
  
  const levels = findSignificantLevels(recentCandles, currentPrice);
  
  if (levels.support || levels.resistance) {
    let action: 'compra' | 'venda' | 'neutro' = 'neutro';
    let confidence = 0.6;
    let description = 'Níveis de Suporte/Resistência detectados.';
    let recommendation = 'Aguardar reação do preço nos níveis.';
    
    if (levels.support) {
      const distanceToSupport = Math.abs(currentPrice - levels.support.price) / currentPrice;
      if (distanceToSupport < 0.002) {
        action = 'compra';
        confidence = Math.min(0.9, 0.65 + levels.support.touches * 0.1);
        description = `Preço testando suporte em ${levels.support.price.toFixed(5)} (${levels.support.touches} toques).`;
        recommendation = 'Considerar compra com confirmação de rejeição do suporte.';
      }
    }
    
    if (levels.resistance) {
      const distanceToResistance = Math.abs(currentPrice - levels.resistance.price) / currentPrice;
      if (distanceToResistance < 0.002) {
        if (action !== 'compra') {
          action = 'venda';
          confidence = Math.min(0.9, 0.65 + levels.resistance.touches * 0.1);
          description = `Preço testando resistência em ${levels.resistance.price.toFixed(5)} (${levels.resistance.touches} toques).`;
          recommendation = 'Considerar venda com confirmação de rejeição da resistência.';
        } else {
          action = 'neutro';
          description = `Preço em range apertado entre suporte ${levels.support?.price.toFixed(5)} e resistência ${levels.resistance.price.toFixed(5)}.`;
          recommendation = 'Aguardar rompimento claro.'
        }
      }
    }
    
    if (action !== 'neutro') {
      return {
        pattern: 'Suporte/Resistência',
        confidence,
        description,
        recommendation,
        action
      };
    }
  }
  
  return null;
};

const detectChannelPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 20) return null;
  
  const recent20 = candles.slice(-20);
  const highs = recent20.map(c => c.high);
  const lows = recent20.map(c => c.low);
  
  // Verificar se existe um canal (máximos e mínimos paralelos)
  const avgHigh = highs.reduce((a, b) => a + b) / highs.length;
  const avgLow = lows.reduce((a, b) => a + b) / lows.length;
  const channelHeight = avgHigh - avgLow;
  
  // Verificar consistência do canal
  const highVariance = highs.reduce((sum, h) => sum + Math.pow(h - avgHigh, 2), 0) / highs.length;
  const lowVariance = lows.reduce((sum, l) => sum + Math.pow(l - avgLow, 2), 0) / lows.length;
  
  const highStdDev = Math.sqrt(highVariance);
  const lowStdDev = Math.sqrt(lowVariance);
  
  // Canal válido se a variação é pequena
  if (highStdDev < channelHeight * 0.1 && lowStdDev < channelHeight * 0.1) {
    const currentPrice = recent20[recent20.length - 1].close;
    const channelPosition = (currentPrice - avgLow) / channelHeight;
    
    let action: 'compra' | 'venda' | 'neutro' = 'neutro';
    let confidence = 0.65;
    
    // Se próximo ao fundo do canal, compra
    if (channelPosition < 0.3) {
      action = 'compra';
      confidence += (0.3 - channelPosition) * 0.5;
    }
    // Se próximo ao topo do canal, venda
    else if (channelPosition > 0.7) {
      action = 'venda';
      confidence += (channelPosition - 0.7) * 0.5;
    }
    
    if (action !== 'neutro') {
      return {
        pattern: 'Canal',
        confidence: Math.min(0.9, confidence),
        description: 'Padrão de canal identificado',
        recommendation: `${action === 'compra' ? 'Comprar' : 'Vender'} próximo ${action === 'compra' ? 'ao suporte' : 'à resistência'} do canal`,
        action
      };
    }
  }
  
  return null;
};

const detectBreakoutPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 10) return null;
  
  const recent10 = candles.slice(-10);
  const lastCandle = recent10[recent10.length - 1];
  const prevCandles = recent10.slice(0, -1);
  
  const recentHigh = Math.max(...prevCandles.map(c => c.high));
  const recentLow = Math.min(...prevCandles.map(c => c.low));
  
  let action: 'compra' | 'venda' | 'neutro' = 'neutro';
  let confidence = 0;
  
  // Rompimento de alta
  if (lastCandle.close > recentHigh && lastCandle.high > recentHigh) {
    const breakoutStrength = (lastCandle.close - recentHigh) / recentHigh;
    if (breakoutStrength > 0.001) {
      action = 'compra';
      confidence = Math.min(0.85, 0.6 + breakoutStrength * 100);
    }
  }
  // Rompimento de baixa
  else if (lastCandle.close < recentLow && lastCandle.low < recentLow) {
    const breakoutStrength = (recentLow - lastCandle.close) / recentLow;
    if (breakoutStrength > 0.001) {
      action = 'venda';
      confidence = Math.min(0.85, 0.6 + breakoutStrength * 100);
    }
  }
  
  if (action !== 'neutro' && confidence > 0.6) {
    return {
      pattern: 'Rompimento',
      confidence,
      description: `Rompimento ${action === 'compra' ? 'de alta' : 'de baixa'} detectado`,
      recommendation: `Considerar ${action}`,
      action
    };
  }
  
  return null;
};

// === NOVOS PADRÕES GRÁFICOS ===

// Ombro-Cabeça-Ombro
const detectHeadAndShoulders = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 30) return null;
  
  const recent30 = candles.slice(-30);
  const highs = recent30.map(c => c.high);
  
  // Procurar por 3 picos: ombro-cabeça-ombro
  const peaks = findPeaks(highs, 3);
  
  if (peaks.length >= 3) {
    const [shoulder1, head, shoulder2] = peaks.slice(-3);
    
    // Validar estrutura: cabeça mais alta que ombros
    if (highs[head] > highs[shoulder1] && highs[head] > highs[shoulder2] &&
        Math.abs(highs[shoulder1] - highs[shoulder2]) < highs[head] * 0.02) {
      
      // Verificar linha de pescoço
      const necklineLevel = (recent30[shoulder1].low + recent30[shoulder2].low) / 2;
      const currentPrice = recent30[recent30.length - 1].close;
      
      if (currentPrice < necklineLevel) {
        return {
          pattern: 'Ombro-Cabeça-Ombro',
          confidence: 0.85,
          description: 'Padrão Ombro-Cabeça-Ombro - Reversão de baixa',
          recommendation: 'Forte sinal de venda',
          action: 'venda'
        };
      }
    }
  }
  
  return null;
};

// Ombro-Cabeça-Ombro Invertido
const detectInverseHeadAndShoulders = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 30) return null;
  
  const recent30 = candles.slice(-30);
  const lows = recent30.map(c => c.low);
  
  // Procurar por 3 vales
  const valleys = findValleys(lows, 3);
  
  if (valleys.length >= 3) {
    const [shoulder1, head, shoulder2] = valleys.slice(-3);
    
    // Validar estrutura: cabeça mais baixa que ombros
    if (lows[head] < lows[shoulder1] && lows[head] < lows[shoulder2] &&
        Math.abs(lows[shoulder1] - lows[shoulder2]) < lows[head] * 0.02) {
      
      // Verificar linha de pescoço
      const necklineLevel = (recent30[shoulder1].high + recent30[shoulder2].high) / 2;
      const currentPrice = recent30[recent30.length - 1].close;
      
      if (currentPrice > necklineLevel) {
        return {
          pattern: 'Ombro-Cabeça-Ombro Invertido',
          confidence: 0.85,
          description: 'Padrão OCO Invertido - Reversão de alta',
          recommendation: 'Forte sinal de compra',
          action: 'compra'
        };
      }
    }
  }
  
  return null;
};

// Topo Duplo
const detectDoubleTop = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 25) return null;
  
  const recent25 = candles.slice(-25);
  const highs = recent25.map(c => c.high);
  const peaks = findPeaks(highs, 2);
  
  if (peaks.length >= 2) {
    const [peak1, peak2] = peaks.slice(-2);
    const tolerance = highs[peak1] * 0.015; // 1.5% tolerance
    
    if (Math.abs(highs[peak1] - highs[peak2]) < tolerance && peak2 - peak1 > 5) {
      // Verificar vale entre os picos
      const valleyBetween = Math.min(...highs.slice(peak1, peak2 + 1));
      const valleyDepth = (highs[peak1] - valleyBetween) / highs[peak1];
      
      if (valleyDepth > 0.03) { // Vale de pelo menos 3%
        return {
          pattern: 'Topo Duplo',
          confidence: 0.8,
          description: 'Padrão Topo Duplo - Reversão de baixa',
          recommendation: 'Considerar venda após quebra do vale',
          action: 'venda'
        };
      }
    }
  }
  
  return null;
};

// Fundo Duplo
const detectDoubleBottom = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 25) return null;
  
  const recent25 = candles.slice(-25);
  const lows = recent25.map(c => c.low);
  const valleys = findValleys(lows, 2);
  
  if (valleys.length >= 2) {
    const [valley1, valley2] = valleys.slice(-2);
    const tolerance = lows[valley1] * 0.015;
    
    if (Math.abs(lows[valley1] - lows[valley2]) < tolerance && valley2 - valley1 > 5) {
      // Verificar pico entre os vales
      const peakBetween = Math.max(...lows.slice(valley1, valley2 + 1));
      const peakHeight = (peakBetween - lows[valley1]) / lows[valley1];
      
      if (peakHeight > 0.03) {
        return {
          pattern: 'Fundo Duplo',
          confidence: 0.8,
          description: 'Padrão Fundo Duplo - Reversão de alta',
          recommendation: 'Considerar compra após quebra do pico',
          action: 'compra'
        };
      }
    }
  }
  
  return null;
};

// Topo Triplo
const detectTripleTop = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 35) return null;
  
  const recent35 = candles.slice(-35);
  const highs = recent35.map(c => c.high);
  const peaks = findPeaks(highs, 3);
  
  if (peaks.length >= 3) {
    const [peak1, peak2, peak3] = peaks.slice(-3);
    const avgPeak = (highs[peak1] + highs[peak2] + highs[peak3]) / 3;
    const tolerance = avgPeak * 0.02;
    
    if (Math.abs(highs[peak1] - avgPeak) < tolerance &&
        Math.abs(highs[peak2] - avgPeak) < tolerance &&
        Math.abs(highs[peak3] - avgPeak) < tolerance) {
      
      return {
        pattern: 'Topo Triplo',
        confidence: 0.88,
        description: 'Padrão Topo Triplo - Forte reversão de baixa',
        recommendation: 'Sinal muito forte de venda',
        action: 'venda'
      };
    }
  }
  
  return null;
};

// Fundo Triplo
const detectTripleBottom = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 35) return null;
  
  const recent35 = candles.slice(-35);
  const lows = recent35.map(c => c.low);
  const valleys = findValleys(lows, 3);
  
  if (valleys.length >= 3) {
    const [valley1, valley2, valley3] = valleys.slice(-3);
    const avgValley = (lows[valley1] + lows[valley2] + lows[valley3]) / 3;
    const tolerance = avgValley * 0.02;
    
    if (Math.abs(lows[valley1] - avgValley) < tolerance &&
        Math.abs(lows[valley2] - avgValley) < tolerance &&
        Math.abs(lows[valley3] - avgValley) < tolerance) {
      
      return {
        pattern: 'Fundo Triplo',
        confidence: 0.88,
        description: 'Padrão Fundo Triplo - Forte reversão de alta',
        recommendation: 'Sinal muito forte de compra',
        action: 'compra'
      };
    }
  }
  
  return null;
};

// Wedge (Cunha)
const detectWedgePattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 20) return null;
  
  const recent20 = candles.slice(-20);
  const highs = recent20.map(c => c.high);
  const lows = recent20.map(c => c.low);
  
  // Calcular tendências das linhas de suporte e resistência
  const highTrend = calculateTrend(highs);
  const lowTrend = calculateTrend(lows);
  
  // Rising Wedge (bearish)
  if (highTrend > 0 && lowTrend > 0 && lowTrend > highTrend) {
    return {
      pattern: 'Cunha Ascendente',
      confidence: 0.78,
      description: 'Cunha Ascendente - Divergência bearish',
      recommendation: 'Possível reversão de baixa',
      action: 'venda'
    };
  }
  
  // Falling Wedge (bullish)
  if (highTrend < 0 && lowTrend < 0 && Math.abs(lowTrend) > Math.abs(highTrend)) {
    return {
      pattern: 'Cunha Descendente',
      confidence: 0.78,
      description: 'Cunha Descendente - Divergência bullish',
      recommendation: 'Possível reversão de alta',
      action: 'compra'
    };
  }
  
  return null;
};

// Flag/Pennant
const detectFlagPennantPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 15) return null;
  
  const recent15 = candles.slice(-15);
  const first5 = recent15.slice(0, 5);
  const last10 = recent15.slice(-10);
  
  // Detectar movimento forte inicial (flagpole)
  const initialMove = Math.abs(first5[4].close - first5[0].close) / first5[0].close;
  
  if (initialMove > 0.02) { // Movimento de pelo menos 2%
    // Verificar consolidação após o movimento
    const consolidationRange = Math.max(...last10.map(c => c.high)) - Math.min(...last10.map(c => c.low));
    const consolidationRatio = consolidationRange / first5[0].close;
    
    if (consolidationRatio < initialMove * 0.5) { // Consolidação menor que metade do movimento
      const isUptrend = first5[4].close > first5[0].close;
      
      return {
        pattern: isUptrend ? 'Bandeira de Alta' : 'Bandeira de Baixa',
        confidence: 0.75,
        description: `Padrão Bandeira - Continuação ${isUptrend ? 'de alta' : 'de baixa'}`,
        recommendation: `Aguardar rompimento para ${isUptrend ? 'compra' : 'venda'}`,
        action: isUptrend ? 'compra' : 'venda'
      };
    }
  }
  
  return null;
};

// Cup and Handle
const detectCupAndHandle = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 40) return null;
  
  const recent40 = candles.slice(-40);
  const lows = recent40.map(c => c.low);
  
  // Procurar pela base da "xícara" (ponto mais baixo)
  const cupBottom = Math.min(...lows);
  const cupBottomIndex = lows.indexOf(cupBottom);
  
  if (cupBottomIndex > 10 && cupBottomIndex < 30) {
    const leftSide = recent40.slice(0, cupBottomIndex);
    const rightSide = recent40.slice(cupBottomIndex);
    
    // Verificar se ambos os lados sobem
    const leftHigh = Math.max(...leftSide.map(c => c.high));
    const rightHigh = Math.max(...rightSide.map(c => c.high));
    
    if (Math.abs(leftHigh - rightHigh) < leftHigh * 0.05) { // Níveis similares
      // Procurar pelo "handle" (pequena correção no final)
      const handleStart = rightSide.length - 8;
      if (handleStart > 0) {
        const handle = rightSide.slice(handleStart);
        const handleDepth = (rightHigh - Math.min(...handle.map(c => c.low))) / rightHigh;
        
        if (handleDepth > 0.01 && handleDepth < 0.15) { // Handle de 1-15%
          return {
            pattern: 'Xícara com Alça',
            confidence: 0.82,
            description: 'Padrão Xícara com Alça - Continuação de alta',
            recommendation: 'Forte sinal de compra',
            action: 'compra'
          };
        }
      }
    }
  }
  
  return null;
};

// Rectangle/Range
const detectRectanglePattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 20) return null;
  
  const recent20 = candles.slice(-20);
  const highs = recent20.map(c => c.high);
  const lows = recent20.map(c => c.low);
  
  const resistance = Math.max(...highs);
  const support = Math.min(...lows);
  const range = resistance - support;
  const tolerance = range * 0.1;
  
  // Contar toques nos níveis
  let resistanceTouches = 0;
  let supportTouches = 0;
  
  highs.forEach(high => {
    if (Math.abs(high - resistance) < tolerance) resistanceTouches++;
  });
  
  lows.forEach(low => {
    if (Math.abs(low - support) < tolerance) supportTouches++;
  });
  
  if (resistanceTouches >= 2 && supportTouches >= 2) {
    return {
      pattern: 'Retângulo',
      confidence: 0.7,
      description: 'Padrão Retângulo - Consolidação lateral',
      recommendation: 'Aguardar rompimento para definir direção',
      action: 'neutro'
    };
  }
  
  return null;
};

// Diamond
const detectDiamondPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 25) return null;
  
  const recent25 = candles.slice(-25);
  const mid = Math.floor(recent25.length / 2);
  
  const firstHalf = recent25.slice(0, mid);
  const secondHalf = recent25.slice(mid);
  
  // Primeira metade: range expandindo
  const firstRange = Math.max(...firstHalf.map(c => c.high)) - Math.min(...firstHalf.map(c => c.low));
  
  // Segunda metade: range contraindo
  const secondRange = Math.max(...secondHalf.map(c => c.high)) - Math.min(...secondHalf.map(c => c.low));
  
  if (firstRange > secondRange * 1.5) {
    return {
      pattern: 'Diamante',
      confidence: 0.72,
      description: 'Padrão Diamante - Reversão',
      recommendation: 'Aguardar rompimento para confirmar direção',
      action: 'neutro'
    };
  }
  
  return null;
};

// Pullback
const detectPullbackPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 15) return null;
  
  const recent15 = candles.slice(-15);
  const first10 = recent15.slice(0, 10);
  const last5 = recent15.slice(-5);
  
  // Determinar tendência principal
  const mainTrend = first10[9].close > first10[0].close ? 'alta' : 'baixa';
  
  // Verificar correção na tendência
  if (mainTrend === 'alta') {
    const maxHigh = Math.max(...first10.map(c => c.high));
    const pullbackLow = Math.min(...last5.map(c => c.low));
    const correction = (maxHigh - pullbackLow) / maxHigh;
    
    if (correction > 0.02 && correction < 0.15) { // Correção de 2-15%
      return {
        pattern: 'Pullback de Alta',
        confidence: 0.75,
        description: 'Pullback em tendência de alta',
        recommendation: 'Oportunidade de compra na correção',
        action: 'compra'
      };
    }
  } else {
    const minLow = Math.min(...first10.map(c => c.low));
    const pullbackHigh = Math.max(...last5.map(c => c.high));
    const correction = (pullbackHigh - minLow) / minLow;
    
    if (correction > 0.02 && correction < 0.15) {
      return {
        pattern: 'Pullback de Baixa',
        confidence: 0.75,
        description: 'Pullback em tendência de baixa',
        recommendation: 'Oportunidade de venda na correção',
        action: 'venda'
      };
    }
  }
  
  return null;
};

// Falso Rompimento
const detectFalseBreakoutPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 12) return null;
  
  const recent12 = candles.slice(-12);
  const first8 = recent12.slice(0, 8);
  const last4 = recent12.slice(-4);
  
  const resistance = Math.max(...first8.map(c => c.high));
  const support = Math.min(...first8.map(c => c.low));
  
  // Verificar rompimento seguido de retorno
  const breakoutHigh = Math.max(...last4.map(c => c.high));
  const breakoutLow = Math.min(...last4.map(c => c.low));
  const currentClose = recent12[recent12.length - 1].close;
  
  // Falso rompimento de resistência
  if (breakoutHigh > resistance * 1.005 && currentClose < resistance) {
    return {
      pattern: 'Falso Rompimento Superior',
      confidence: 0.8,
      description: 'Falso rompimento de resistência',
      recommendation: 'Sinal de venda - rejeição do nível',
      action: 'venda'
    };
  }
  
  // Falso rompimento de suporte
  if (breakoutLow < support * 0.995 && currentClose > support) {
    return {
      pattern: 'Falso Rompimento Inferior',
      confidence: 0.8,
      description: 'Falso rompimento de suporte',
      recommendation: 'Sinal de compra - recuperação do nível',
      action: 'compra'
    };
  }
  
  return null;
};

// Gap Pattern
const detectGapPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 5) return null;
  
  const recent5 = candles.slice(-5);
  
  for (let i = 1; i < recent5.length; i++) {
    const prevCandle = recent5[i - 1];
    const currentCandle = recent5[i];
    
    // Gap de alta
    if (currentCandle.low > prevCandle.high) {
      const gapSize = (currentCandle.low - prevCandle.high) / prevCandle.high;
      
      if (gapSize > 0.005) { // Gap maior que 0.5%
        return {
          pattern: 'Gap de Alta',
          confidence: 0.7,
          description: 'Gap de alta detectado',
          recommendation: 'Possível continuação da alta',
          action: 'compra'
        };
      }
    }
    
    // Gap de baixa
    if (currentCandle.high < prevCandle.low) {
      const gapSize = (prevCandle.low - currentCandle.high) / prevCandle.low;
      
      if (gapSize > 0.005) {
        return {
          pattern: 'Gap de Baixa',
          confidence: 0.7,
          description: 'Gap de baixa detectado',
          recommendation: 'Possível continuação da baixa',
          action: 'venda'
        };
      }
    }
  }
  
  return null;
};

// Volume Climax
const detectVolumeClimaxPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 10) return null;
  
  const recent10 = candles.slice(-10);
  
  // Simular volume baseado no range dos candles
  const volumes = recent10.map(candle => {
    const range = candle.high - candle.low;
    const body = Math.abs(candle.close - candle.open);
    return range + (body * 2);
  });
  
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const lastVolume = volumes[volumes.length - 1];
  
  if (lastVolume > avgVolume * 2) { // Volume 2x maior que a média
    const lastCandle = recent10[recent10.length - 1];
    const isGreen = lastCandle.close > lastCandle.open;
    
    return {
      pattern: 'Clímax de Volume',
      confidence: 0.75,
      description: `Clímax de volume ${isGreen ? 'de alta' : 'de baixa'}`,
      recommendation: 'Possível exaustão - aguardar reversão',
      action: isGreen ? 'venda' : 'compra'
    };
  }
  
  return null;
};

// Higher Highs / Lower Lows
const detectHigherHighsLowerLows = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 15) return null;
  
  const recent15 = candles.slice(-15);
  const highs = recent15.map(c => c.high);
  const lows = recent15.map(c => c.low);
  
  const peaks = findPeaks(highs, 2);
  const valleys = findValleys(lows, 2);
  
  if (peaks.length >= 2 && valleys.length >= 2) {
    const isHH = highs[peaks[peaks.length - 1]] > highs[peaks[peaks.length - 2]];
    const isHL = lows[valleys[valleys.length - 1]] > lows[valleys[valleys.length - 2]];
    
    if (isHH && isHL) {
      return {
        pattern: 'HH/HL - Tendência de Alta',
        confidence: 0.8,
        description: 'Máximos e mínimos ascendentes',
        recommendation: 'Tendência de alta confirmada',
        action: 'compra'
      };
    }
    
    const isLL = lows[valleys[valleys.length - 1]] < lows[valleys[valleys.length - 2]];
    const isLH = highs[peaks[peaks.length - 1]] < highs[peaks[peaks.length - 2]];
    
    if (isLL && isLH) {
      return {
        pattern: 'LH/LL - Tendência de Baixa',
        confidence: 0.8,
        description: 'Máximos e mínimos descendentes',
        recommendation: 'Tendência de baixa confirmada',
        action: 'venda'
      };
    }
  }
  
  return null;
};

// Market Structure Break
const detectMarketStructureBreak = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 10) return null;
  
  const recent10 = candles.slice(-10);
  const first5 = recent10.slice(0, 5);
  const last5 = recent10.slice(-5);
  
  const firstTrendHigh = Math.max(...first5.map(c => c.high));
  const firstTrendLow = Math.min(...first5.map(c => c.low));
  
  const lastHigh = Math.max(...last5.map(c => c.high));
  const lastLow = Math.min(...last5.map(c => c.low));
  
  // Break of Structure para cima
  if (lastHigh > firstTrendHigh * 1.01) {
    return {
      pattern: 'Quebra de Estrutura - Alta',
      confidence: 0.78,
      description: 'Quebra de estrutura para cima',
      recommendation: 'Mudança para tendência de alta',
      action: 'compra'
    };
  }
  
  // Break of Structure para baixo
  if (lastLow < firstTrendLow * 0.99) {
    return {
      pattern: 'Quebra de Estrutura - Baixa',
      confidence: 0.78,
      description: 'Quebra de estrutura para baixo',
      recommendation: 'Mudança para tendência de baixa',
      action: 'venda'
    };
  }
  
  return null;
};

// Liquidity Grab
const detectLiquidityGrabPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 8) return null;
  
  const recent8 = candles.slice(-8);
  const lastCandle = recent8[recent8.length - 1];
  const previousCandles = recent8.slice(0, -1);
  
  const recentHigh = Math.max(...previousCandles.map(c => c.high));
  const recentLow = Math.min(...previousCandles.map(c => c.low));
  
  // Liquidity Grab acima (fake breakout seguido de reversão)
  if (lastCandle.high > recentHigh && lastCandle.close < recentHigh * 0.995) {
    return {
      pattern: 'Liquidity Grab Superior',
      confidence: 0.75,
      description: 'Grab de liquidez acima - Reversão bearish',
      recommendation: 'Sinal de venda após fake breakout',
      action: 'venda'
    };
  }
  
  // Liquidity Grab abaixo
  if (lastCandle.low < recentLow && lastCandle.close > recentLow * 1.005) {
    return {
      pattern: 'Liquidity Grab Inferior',
      confidence: 0.75,
      description: 'Grab de liquidez abaixo - Reversão bullish',
      recommendation: 'Sinal de compra após fake breakdown',
      action: 'compra'
    };
  }
  
  return null;
};

// === FUNÇÕES AUXILIARES ===

const findPeaks = (data: number[], minPeaks: number): number[] => {
  const peaks: number[] = [];
  
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
      peaks.push(i);
    }
  }
  
  return peaks.slice(-minPeaks);
};

const findValleys = (data: number[], minValleys: number): number[] => {
  const valleys: number[] = [];
  
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] < data[i - 1] && data[i] < data[i + 1]) {
      valleys.push(i);
    }
  }
  
  return valleys.slice(-minValleys);
};

const calculateTrend = (data: number[]): number => {
  const n = data.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = data.reduce((sum, val) => sum + val, 0);
  const sumXY = data.reduce((sum, val, index) => sum + (index * val), 0);
  const sumX2 = data.reduce((sum, _, index) => sum + (index * index), 0);
  
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
};

const findSignificantLevels = (candles: CandleData[], currentPrice: number) => {
  const tolerance = currentPrice * 0.0015; // Tolerância de 0.15%

  const highLevels: { [key: string]: { price: number, touches: number } } = {};
  candles.forEach(c => {
    const levelKey = Math.round(c.high / tolerance) * tolerance;
    if (!highLevels[levelKey]) highLevels[levelKey] = { price: levelKey, touches: 0 };
    highLevels[levelKey].touches++;
  });

  const lowLevels: { [key: string]: { price: number, touches: number } } = {};
  candles.forEach(c => {
    const levelKey = Math.round(c.low / tolerance) * tolerance;
    if (!lowLevels[levelKey]) lowLevels[levelKey] = { price: levelKey, touches: 0 };
    lowLevels[levelKey].touches++;
  });

  // Encontra a resistência mais significativa ACIMA do preço atual
  const significantResistances = Object.values(highLevels)
    .filter(level => level.touches >= 2 && level.price > currentPrice)
    .sort((a, b) => b.touches - a.touches); // Ordena pelo número de toques

  // Encontra o suporte mais significativo ABAIXO do preço atual
  const significantSupports = Object.values(lowLevels)
    .filter(level => level.touches >= 2 && level.price < currentPrice)
    .sort((a, b) => b.touches - a.touches); // Ordena pelo número de toques

  return { resistance: significantResistances[0], support: significantSupports[0] };
};
