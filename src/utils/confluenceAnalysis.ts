
import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";

export const performConfluenceAnalysis = (candles: CandleData[], patterns: DetectedPattern[]) => {
  if (candles.length < 20) {
    return {
      confluenceScore: 0,
      supportResistance: [],
      criticalLevels: [],
      marketStructure: { structure: 'lateral' as const, strength: 0 },
      priceAction: { trend: 'lateral' as const, momentum: 'neutro' as const, strength: 0 }
    };
  }

  console.log('🔍 Iniciando análise COMPLETA de confluências...');
  
  const currentPrice = candles[candles.length - 1].close;
  let confluenceScore = 0;
  const confluenceFactors: string[] = [];
  
  // === 1. ANÁLISE DE SUPORTE E RESISTÊNCIA ===
  const supportResistanceAnalysis = analyzeSupportResistance(candles, currentPrice);
  confluenceScore += supportResistanceAnalysis.score;
  confluenceFactors.push(...supportResistanceAnalysis.factors);
  
  // === 2. ANÁLISE DE PADRÕES MÚLTIPLOS ===
  const patternAnalysis = analyzePatternConfluence(patterns);
  confluenceScore += patternAnalysis.score;
  confluenceFactors.push(...patternAnalysis.factors);
  
  // === 3. ANÁLISE DE ESTRUTURA DE MERCADO ===
  const marketStructureAnalysis = analyzeMarketStructure(candles);
  confluenceScore += marketStructureAnalysis.score;
  confluenceFactors.push(...marketStructureAnalysis.factors);
  
  // === 4. ANÁLISE DE PRICE ACTION ===
  const priceActionAnalysis = analyzePriceActionConfluence(candles);
  confluenceScore += priceActionAnalysis.score;
  confluenceFactors.push(...priceActionAnalysis.factors);
  
  // === 5. ANÁLISE DE ZONAS DE LIQUIDEZ ===
  const liquidityAnalysis = analyzeLiquidityZones(candles, currentPrice);
  confluenceScore += liquidityAnalysis.score;
  confluenceFactors.push(...liquidityAnalysis.factors);
  
  // === 6. ANÁLISE DE FIBONACCI ===
  const fibonacciAnalysis = analyzeFibonacciLevels(candles, currentPrice);
  confluenceScore += fibonacciAnalysis.score;
  confluenceFactors.push(...fibonacciAnalysis.factors);
  
  // === 7. ANÁLISE DE MOMENTUM ===
  const momentumAnalysis = analyzeMomentumConfluence(candles);
  confluenceScore += momentumAnalysis.score;
  confluenceFactors.push(...momentumAnalysis.factors);
  
  // === 8. ANÁLISE DE TEMPO/SESSÕES ===
  const timeAnalysis = analyzeTimeBasedConfluence();
  confluenceScore += timeAnalysis.score;
  confluenceFactors.push(...timeAnalysis.factors);
  
  // Normalizar score (máximo possível seria ~800)
  const finalScore = Math.min(100, confluenceScore / 8);
  
  console.log(`✅ Confluência calculada: ${finalScore.toFixed(1)}%`);
  console.log(`📋 Fatores encontrados: ${confluenceFactors.length}`);
  confluenceFactors.forEach(factor => console.log(`   • ${factor}`));
  
  return {
    confluenceScore: finalScore,
    supportResistance: supportResistanceAnalysis.levels,
    criticalLevels: [...supportResistanceAnalysis.levels, ...liquidityAnalysis.levels],
    marketStructure: marketStructureAnalysis.structure,
    priceAction: priceActionAnalysis.analysis,
    confluenceFactors // Adicionar para debugging
  };
};

// === 1. SUPORTE E RESISTÊNCIA AVANÇADA ===
const analyzeSupportResistance = (candles: CandleData[], currentPrice: number) => {
  const levels: any[] = [];
  const factors: string[] = [];
  let score = 0;
  
  const recent50 = candles.slice(-50);
  const tolerance = currentPrice * 0.002; // 0.2% tolerance
  
  // Encontrar níveis significativos por teste múltiplo
  const priceMap = new Map<number, number>();
  
  recent50.forEach(candle => {
    const prices = [candle.high, candle.low, candle.open, candle.close];
    
    prices.forEach(price => {
      const level = Math.round(price / tolerance) * tolerance;
      priceMap.set(level, (priceMap.get(level) || 0) + 1);
    });
  });
  
  // Filtrar níveis com múltiplos toques
  const significantLevels = Array.from(priceMap.entries())
    .filter(([level, touches]) => touches >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  significantLevels.forEach(([level, touches]) => {
    const isSupport = level < currentPrice;
    const distance = Math.abs(currentPrice - level) / currentPrice;
    const strength = touches >= 5 ? 'muito_forte' : touches >= 4 ? 'forte' : 'moderado';
    
    levels.push({
      type: isSupport ? 'support' : 'resistance',
      price: level,
      strength,
      confidence: Math.min(95, 60 + touches * 8),
      touches,
      distance
    });
    
    // Pontuação baseada na proximidade e força
    if (distance < 0.005) { // Muito próximo (0.5%)
      score += touches * 15;
      factors.push(`${isSupport ? 'Suporte' : 'Resistência'} forte próximo (${touches} toques)`);
    } else if (distance < 0.01) { // Próximo (1%)
      score += touches * 10;
      factors.push(`${isSupport ? 'Suporte' : 'Resistência'} moderado próximo`);
    }
  });
  
  return { score, factors, levels };
};

// === 2. CONFLUÊNCIA DE PADRÕES ===
const analyzePatternConfluence = (patterns: DetectedPattern[]) => {
  let score = 0;
  const factors: string[] = [];
  
  if (patterns.length === 0) return { score, factors };
  
  // Verificar consistência de sinais
  const buyPatterns = patterns.filter(p => p.action === 'compra');
  const sellPatterns = patterns.filter(p => p.action === 'venda');
  
  if (buyPatterns.length > sellPatterns.length && buyPatterns.length >= 2) {
    score += buyPatterns.length * 20;
    factors.push(`${buyPatterns.length} padrões de compra alinhados`);
  }
  
  if (sellPatterns.length > buyPatterns.length && sellPatterns.length >= 2) {
    score += sellPatterns.length * 20;
    factors.push(`${sellPatterns.length} padrões de venda alinhados`);
  }
  
  // Bonus para padrões de alta confiança
  const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
  if (highConfidencePatterns.length > 0) {
    score += highConfidencePatterns.length * 15;
    factors.push(`${highConfidencePatterns.length} padrões de alta confiança`);
  }
  
  return { score, factors };
};

// === 3. ESTRUTURA DE MERCADO ===
const analyzeMarketStructure = (candles: CandleData[]) => {
  let score = 0;
  const factors: string[] = [];
  
  const recent20 = candles.slice(-20);
  const highs = recent20.map(c => c.high);
  const lows = recent20.map(c => c.low);
  
  // Analisar padrão HH/HL ou LH/LL
  const peaks = findPeaksAndValleys(highs, true);
  const valleys = findPeaksAndValleys(lows, false);
  
  let structure: 'bullish' | 'bearish' | 'lateral' = 'lateral';
  let structureStrength = 0;
  
  if (peaks.length >= 2) {
    const isHH = highs[peaks[peaks.length - 1]] > highs[peaks[peaks.length - 2]];
    
    if (valleys.length >= 2) {
      const isHL = lows[valleys[valleys.length - 1]] > lows[valleys[valleys.length - 2]];
      
      if (isHH && isHL) {
        structure = 'bullish';
        structureStrength = 80;
        score += 40;
        factors.push('Estrutura HH/HL confirmada (bullish)');
      } else {
        const isLL = lows[valleys[valleys.length - 1]] < lows[valleys[valleys.length - 2]];
        const isLH = !isHH;
        
        if (isLL && isLH) {
          structure = 'bearish';
          structureStrength = 80;
          score += 40;
          factors.push('Estrutura LH/LL confirmada (bearish)');
        }
      }
    }
  }
  
  return {
    score,
    factors,
    structure: { structure, strength: structureStrength }
  };
};

// === 4. PRICE ACTION AVANÇADA ===
const analyzePriceActionConfluence = (candles: CandleData[]) => {
  let score = 0;
  const factors: string[] = [];
  
  const recent10 = candles.slice(-10);
  const lastCandle = recent10[recent10.length - 1];
  const prevCandle = recent10[recent10.length - 2];
  
  // Análise de momentum
  let trend: 'alta' | 'baixa' | 'lateral' = 'lateral';
  let momentum: 'forte' | 'moderado' | 'fraco' | 'neutro' = 'neutro';
  let strength = 0;
  
  // Calcular força do movimento recente
  const priceChange = (lastCandle.close - recent10[0].close) / recent10[0].close;
  
  if (Math.abs(priceChange) > 0.02) {
    trend = priceChange > 0 ? 'alta' : 'baixa';
    
    if (Math.abs(priceChange) > 0.05) {
      momentum = 'forte';
      strength = 85;
      score += 35;
      factors.push(`Movimento ${trend} muito forte (${(priceChange * 100).toFixed(1)}%)`);
    } else if (Math.abs(priceChange) > 0.03) {
      momentum = 'moderado';
      strength = 70;
      score += 25;
      factors.push(`Movimento ${trend} moderado`);
    } else {
      momentum = 'fraco';
      strength = 50;
      score += 15;
      factors.push(`Movimento ${trend} fraco`);
    }
  }
  
  // Verificar consistência de direção
  const greenCandles = recent10.filter(c => c.close > c.open).length;
  const redCandles = recent10.filter(c => c.close < c.open).length;
  
  if (greenCandles >= 7) {
    score += 20;
    factors.push('Domínio de candles verdes (7+/10)');
  } else if (redCandles >= 7) {
    score += 20;
    factors.push('Domínio de candles vermelhos (7+/10)');
  }
  
  // Análise de volume (inferido do range)
  const volumes = recent10.map(c => c.high - c.low + Math.abs(c.close - c.open));
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const lastVolume = volumes[volumes.length - 1];
  
  if (lastVolume > avgVolume * 1.5) {
    score += 15;
    factors.push('Volume elevado no último candle');
  }
  
  return {
    score,
    factors,
    analysis: { trend, momentum, strength }
  };
};

// === 5. ZONAS DE LIQUIDEZ ===
const analyzeLiquidityZones = (candles: CandleData[], currentPrice: number) => {
  let score = 0;
  const factors: string[] = [];
  const levels: any[] = [];
  
  const recent30 = candles.slice(-30);
  
  // Encontrar zonas de alta liquidez (onde há agrupamento de highs/lows)
  const highs = recent30.map(c => c.high).sort((a, b) => b - a);
  const lows = recent30.map(c => c.low).sort((a, b) => a - b);
  
  // Procurar por agrupamentos
  const liquidityZones = findLiquidityZones([...highs, ...lows], currentPrice);
  
  liquidityZones.forEach(zone => {
    const distance = Math.abs(currentPrice - zone.price) / currentPrice;
    
    if (distance < 0.008) { // Dentro de 0.8%
      score += zone.strength * 10;
      levels.push({
        type: 'liquidity_zone',
        price: zone.price,
        strength: zone.strength >= 5 ? 'alta' : 'media',
        confidence: Math.min(90, 50 + zone.strength * 8)
      });
      factors.push(`Zona de liquidez próxima (${zone.strength} agrupamentos)`);
    }
  });
  
  return { score, factors, levels };
};

// === 6. NÍVEIS DE FIBONACCI ===
const analyzeFibonacciLevels = (candles: CandleData[], currentPrice: number) => {
  let score = 0;
  const factors: string[] = [];
  
  const recent50 = candles.slice(-50);
  const high = Math.max(...recent50.map(c => c.high));
  const low = Math.min(...recent50.map(c => c.low));
  const range = high - low;
  
  // Níveis principais de Fibonacci
  const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
  
  fibLevels.forEach(level => {
    const fibPrice = low + (range * level);
    const distance = Math.abs(currentPrice - fibPrice) / currentPrice;
    
    if (distance < 0.003) { // Dentro de 0.3%
      score += 25;
      factors.push(`Próximo ao Fibonacci ${(level * 100).toFixed(1)}% (${fibPrice.toFixed(4)})`);
    }
  });
  
  return { score, factors };
};

// === 7. ANÁLISE DE MOMENTUM ===
const analyzeMomentumConfluence = (candles: CandleData[]) => {
  let score = 0;
  const factors: string[] = [];
  
  const recent15 = candles.slice(-15);
  
  // Calcular RSI simplificado
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < recent15.length; i++) {
    const change = recent15[i].close - recent15[i - 1].close;
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }
  
  const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / gains.length;
  const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / losses.length;
  
  if (avgLoss === 0) return { score, factors };
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  // RSI em zonas extremas
  if (rsi < 25) {
    score += 30;
    factors.push(`RSI oversold (${rsi.toFixed(1)}) - potencial alta`);
  } else if (rsi > 75) {
    score += 30;
    factors.push(`RSI overbought (${rsi.toFixed(1)}) - potencial baixa`);
  }
  
  return { score, factors };
};

// === 8. ANÁLISE TEMPORAL ===
const analyzeTimeBasedConfluence = () => {
  let score = 0;
  const factors: string[] = [];
  
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Horários de maior liquidez (aproximados para Forex)
  if ((hour >= 8 && hour <= 12) || (hour >= 13 && hour <= 17)) {
    score += 10;
    factors.push('Horário de alta liquidez (sessão européia/americana)');
  }
  
  // Evitar períodos de baixa liquidez
  if (hour >= 22 || hour <= 2) {
    score -= 10;
    factors.push('Horário de baixa liquidez (Asian quiet)');
  }
  
  // Início de nova hora (confluência temporal)
  if (minute <= 5 || minute >= 55) {
    score += 5;
    factors.push('Próximo ao início de nova hora');
  }
  
  return { score, factors };
};

// === FUNÇÕES AUXILIARES ===

const findPeaksAndValleys = (data: number[], findPeaks: boolean): number[] => {
  const result: number[] = [];
  
  for (let i = 1; i < data.length - 1; i++) {
    if (findPeaks) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        result.push(i);
      }
    } else {
      if (data[i] < data[i - 1] && data[i] < data[i + 1]) {
        result.push(i);
      }
    }
  }
  
  return result;
};

const findLiquidityZones = (prices: number[], currentPrice: number) => {
  const tolerance = currentPrice * 0.002; // 0.2%
  const zones: { price: number, strength: number }[] = [];
  
  // Agrupar preços próximos
  const priceGroups = new Map<number, number>();
  
  prices.forEach(price => {
    const zone = Math.round(price / tolerance) * tolerance;
    priceGroups.set(zone, (priceGroups.get(zone) || 0) + 1);
  });
  
  // Filtrar zonas com múltiplos agrupamentos
  priceGroups.forEach((count, price) => {
    if (count >= 3) {
      zones.push({ price, strength: count });
    }
  });
  
  return zones.sort((a, b) => b.strength - a.strength);
};
