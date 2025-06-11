
import { CandleData, Point } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";

export interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: 'forte' | 'moderada' | 'fraca';
  touches: number;
  lastTouch: number;
  confidence: number;
}

export interface VolumeProfile {
  price: number;
  volume: number;
  isPOC: boolean; // Point of Control (maior volume)
  isVAH: boolean; // Value Area High
  isVAL: boolean; // Value Area Low
}

export interface ConfluenceAnalysis {
  supportResistance: SupportResistanceLevel[];
  volumeProfile: VolumeProfile[];
  priceAction: {
    trend: 'alta' | 'baixa' | 'lateral';
    strength: number;
    momentum: 'acelerando' | 'desacelerando' | 'neutro';
  };
  marketStructure: {
    higherHighs: boolean;
    higherLows: boolean;
    lowerHighs: boolean;
    lowerLows: boolean;
    structure: 'bullish' | 'bearish' | 'range';
  };
  confluenceScore: number;
  criticalLevels: number[];
}

// Detectar níveis de suporte e resistência históricos
export const detectSupportResistanceLevels = (candles: CandleData[], lookback: number = 50): SupportResistanceLevel[] => {
  if (candles.length < 10) return [];

  const levels: SupportResistanceLevel[] = [];
  const recentCandles = candles.slice(-lookback);
  
  // Encontrar pivôs (máximos e mínimos locais)
  const pivots: { price: number; type: 'high' | 'low'; index: number }[] = [];
  
  for (let i = 2; i < recentCandles.length - 2; i++) {
    const current = recentCandles[i];
    const prev2 = recentCandles[i - 2];
    const prev1 = recentCandles[i - 1];
    const next1 = recentCandles[i + 1];
    const next2 = recentCandles[i + 2];
    
    // Máximo local
    if (current.high > prev2.high && current.high > prev1.high && 
        current.high > next1.high && current.high > next2.high) {
      pivots.push({ price: current.high, type: 'high', index: i });
    }
    
    // Mínimo local
    if (current.low < prev2.low && current.low < prev1.low && 
        current.low < next1.low && current.low < next2.low) {
      pivots.push({ price: current.low, type: 'low', index: i });
    }
  }
  
  // Agrupar pivôs próximos para formar níveis
  const tolerance = 0.002; // 0.2% de tolerância
  const groupedLevels: { price: number; type: 'support' | 'resistance'; touches: number[]; }[] = [];
  
  for (const pivot of pivots) {
    let foundGroup = false;
    
    for (const group of groupedLevels) {
      if (Math.abs(group.price - pivot.price) / group.price < tolerance) {
        group.touches.push(pivot.index);
        group.price = (group.price * (group.touches.length - 1) + pivot.price) / group.touches.length;
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      groupedLevels.push({
        price: pivot.price,
        type: pivot.type === 'high' ? 'resistance' : 'support',
        touches: [pivot.index]
      });
    }
  }
  
  // Converter em níveis com força e confiança
  for (const group of groupedLevels) {
    if (group.touches.length >= 2) { // Pelo menos 2 toques para ser válido
      const strength = group.touches.length >= 4 ? 'forte' : 
                      group.touches.length >= 3 ? 'moderada' : 'fraca';
      
      const lastTouch = Math.max(...group.touches);
      const timeSinceLastTouch = recentCandles.length - 1 - lastTouch;
      
      // Confiança baseada no número de toques e recência
      const confidence = Math.min(95, 
        (group.touches.length * 20) + 
        (40 - Math.min(40, timeSinceLastTouch * 2))
      );
      
      levels.push({
        price: group.price,
        type: group.type,
        strength,
        touches: group.touches.length,
        lastTouch: Date.now() - (timeSinceLastTouch * 60000), // Aproximar timestamp
        confidence
      });
    }
  }
  
  return levels.sort((a, b) => b.confidence - a.confidence);
};

// Analisar perfil de volume
export const analyzeVolumeProfile = (candles: CandleData[]): VolumeProfile[] => {
  if (candles.length < 20) return [];
  
  const priceVolumeBins: { [key: string]: number } = {};
  const binSize = 0.001; // 0.1% bins
  
  // Simular volume baseado no tamanho dos candles e volatilidade
  for (const candle of candles) {
    const volume = Math.abs(candle.close - candle.open) * 1000 + 
                   (candle.high - candle.low) * 500 + 
                   Math.random() * 2000;
    
    const priceRange = candle.high - candle.low;
    const steps = Math.max(1, Math.floor(priceRange / (candle.close * binSize)));
    
    for (let i = 0; i <= steps; i++) {
      const price = candle.low + (priceRange * i / steps);
      const priceKey = (Math.floor(price / (price * binSize)) * price * binSize).toFixed(6);
      priceVolumeBins[priceKey] = (priceVolumeBins[priceKey] || 0) + volume / (steps + 1);
    }
  }
  
  const volumeProfile: VolumeProfile[] = Object.entries(priceVolumeBins)
    .map(([priceStr, volume]) => ({
      price: parseFloat(priceStr),
      volume,
      isPOC: false,
      isVAH: false,
      isVAL: false
    }))
    .sort((a, b) => b.volume - a.volume);
  
  if (volumeProfile.length > 0) {
    // Point of Control (maior volume)
    volumeProfile[0].isPOC = true;
    
    // Value Area (70% do volume)
    const totalVolume = volumeProfile.reduce((sum, profile) => sum + profile.volume, 0);
    const valueAreaVolume = totalVolume * 0.7;
    let accumulatedVolume = 0;
    
    volumeProfile.sort((a, b) => a.price - b.price);
    
    for (let i = 0; i < volumeProfile.length && accumulatedVolume < valueAreaVolume; i++) {
      accumulatedVolume += volumeProfile[i].volume;
      if (i === 0) volumeProfile[i].isVAL = true;
      if (accumulatedVolume >= valueAreaVolume) volumeProfile[i].isVAH = true;
    }
  }
  
  return volumeProfile;
};

// Analisar estrutura de mercado
export const analyzeMarketStructure = (candles: CandleData[]): ConfluenceAnalysis['marketStructure'] => {
  if (candles.length < 10) {
    return {
      higherHighs: false,
      higherLows: false,
      lowerHighs: false,
      lowerLows: false,
      structure: 'range'
    };
  }
  
  const recentCandles = candles.slice(-20);
  let higherHighs = 0;
  let higherLows = 0;
  let lowerHighs = 0;
  let lowerLows = 0;
  
  for (let i = 1; i < recentCandles.length; i++) {
    const current = recentCandles[i];
    const previous = recentCandles[i - 1];
    
    if (current.high > previous.high) higherHighs++;
    if (current.high < previous.high) lowerHighs++;
    if (current.low > previous.low) higherLows++;
    if (current.low < previous.low) lowerLows++;
  }
  
  const totalComparisons = recentCandles.length - 1;
  const hhPercent = higherHighs / totalComparisons;
  const hlPercent = higherLows / totalComparisons;
  const lhPercent = lowerHighs / totalComparisons;
  const llPercent = lowerLows / totalComparisons;
  
  let structure: 'bullish' | 'bearish' | 'range' = 'range';
  
  if (hhPercent > 0.6 && hlPercent > 0.6) {
    structure = 'bullish';
  } else if (lhPercent > 0.6 && llPercent > 0.6) {
    structure = 'bearish';
  }
  
  return {
    higherHighs: hhPercent > 0.5,
    higherLows: hlPercent > 0.5,
    lowerHighs: lhPercent > 0.5,
    lowerLows: llPercent > 0.5,
    structure
  };
};

// Análise completa de confluências
export const performConfluenceAnalysis = (
  candles: CandleData[], 
  patterns: DetectedPattern[]
): ConfluenceAnalysis => {
  const supportResistance = detectSupportResistanceLevels(candles);
  const volumeProfile = analyzeVolumeProfile(candles);
  const marketStructure = analyzeMarketStructure(candles);
  
  // Análise de price action
  const recentCandles = candles.slice(-10);
  const firstPrice = recentCandles[0]?.close || 0;
  const lastPrice = recentCandles[recentCandles.length - 1]?.close || 0;
  const priceChange = lastPrice - firstPrice;
  const percentChange = Math.abs(priceChange / firstPrice) * 100;
  
  const trend: 'alta' | 'baixa' | 'lateral' = 
    priceChange > firstPrice * 0.002 ? 'alta' :
    priceChange < -firstPrice * 0.002 ? 'baixa' : 'lateral';
  
  const strength = Math.min(100, percentChange * 20);
  
  // Momentum baseado na aceleração do preço
  const midPrice = recentCandles[Math.floor(recentCandles.length / 2)]?.close || 0;
  const firstHalfChange = midPrice - firstPrice;
  const secondHalfChange = lastPrice - midPrice;
  
  const momentum: 'acelerando' | 'desacelerando' | 'neutro' = 
    Math.abs(secondHalfChange) > Math.abs(firstHalfChange) * 1.2 ? 'acelerando' :
    Math.abs(secondHalfChange) < Math.abs(firstHalfChange) * 0.8 ? 'desacelerando' : 'neutro';
  
  // Níveis críticos baseados em confluências
  const criticalLevels: number[] = [];
  
  // Adicionar suportes e resistências fortes
  for (const level of supportResistance) {
    if (level.strength === 'forte' && level.confidence > 70) {
      criticalLevels.push(level.price);
    }
  }
  
  // Adicionar POC e Value Area
  for (const profile of volumeProfile) {
    if (profile.isPOC || profile.isVAH || profile.isVAL) {
      criticalLevels.push(profile.price);
    }
  }
  
  // Calcular score de confluência
  let confluenceScore = 0;
  
  // Pontos por padrões detectados
  confluenceScore += patterns.length * 15;
  
  // Pontos por suportes/resistências
  confluenceScore += supportResistance.filter(l => l.confidence > 70).length * 20;
  
  // Pontos por estrutura de mercado clara
  if (marketStructure.structure !== 'range') {
    confluenceScore += 25;
  }
  
  // Pontos por momentum
  if (momentum === 'acelerando') {
    confluenceScore += 15;
  }
  
  // Pontos por força da tendência
  confluenceScore += strength * 0.3;
  
  // Normalizar score (máximo 100)
  confluenceScore = Math.min(100, confluenceScore);
  
  return {
    supportResistance,
    volumeProfile: volumeProfile.slice(0, 10), // Top 10 por volume
    priceAction: {
      trend,
      strength,
      momentum
    },
    marketStructure,
    confluenceScore,
    criticalLevels: criticalLevels.slice(0, 5) // Top 5 níveis mais importantes
  };
};

// Validar sinal com confluências
export const validateSignalWithConfluences = (
  signal: DetectedPattern,
  confluence: ConfluenceAnalysis,
  currentPrice: number
): {
  isValid: boolean;
  confidence: number;
  reasons: string[];
  warnings: string[];
} => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let confidence = signal.confidence;
  
  // Verificar proximidade com suporte/resistência
  for (const level of confluence.supportResistance) {
    const distance = Math.abs(level.price - currentPrice) / currentPrice;
    
    if (distance < 0.005) { // Dentro de 0.5%
      if (
        (signal.action === 'compra' && level.type === 'support') ||
        (signal.action === 'venda' && level.type === 'resistance')
      ) {
        confidence += 0.15;
        reasons.push(`Confluência com ${level.type} ${level.strength} em ${level.price.toFixed(4)}`);
      } else {
        confidence -= 0.1;
        warnings.push(`Sinal contra ${level.type} ${level.strength} em ${level.price.toFixed(4)}`);
      }
    }
  }
  
  // Verificar alinhamento com estrutura de mercado
  if (
    (signal.action === 'compra' && confluence.marketStructure.structure === 'bullish') ||
    (signal.action === 'venda' && confluence.marketStructure.structure === 'bearish')
  ) {
    confidence += 0.1;
    reasons.push(`Alinhado com estrutura ${confluence.marketStructure.structure}`);
  } else if (confluence.marketStructure.structure !== 'range') {
    confidence -= 0.05;
    warnings.push(`Contra a estrutura ${confluence.marketStructure.structure}`);
  }
  
  // Verificar alinhamento com tendência
  if (
    (signal.action === 'compra' && confluence.priceAction.trend === 'alta') ||
    (signal.action === 'venda' && confluence.priceAction.trend === 'baixa')
  ) {
    confidence += 0.1;
    reasons.push(`Alinhado com tendência de ${confluence.priceAction.trend}`);
  } else if (confluence.priceAction.trend !== 'lateral') {
    warnings.push(`Contra a tendência de ${confluence.priceAction.trend}`);
  }
  
  // Verificar momentum
  if (
    (signal.action === 'compra' && confluence.priceAction.momentum === 'acelerando') ||
    (signal.action === 'venda' && confluence.priceAction.momentum === 'acelerando')
  ) {
    confidence += 0.05;
    reasons.push('Momentum acelerando a favor');
  }
  
  // Verificar confluência com volume profile
  for (const profile of confluence.volumeProfile.slice(0, 3)) {
    const distance = Math.abs(profile.price - currentPrice) / currentPrice;
    
    if (distance < 0.003 && profile.isPOC) {
      confidence += 0.08;
      reasons.push(`Próximo ao POC (Point of Control) em ${profile.price.toFixed(4)}`);
    }
  }
  
  // Limitar confidence entre 0 e 1
  confidence = Math.max(0, Math.min(1, confidence));
  
  const isValid = confidence > 0.5 && confluence.confluenceScore > 40;
  
  return {
    isValid,
    confidence,
    reasons,
    warnings
  };
};
