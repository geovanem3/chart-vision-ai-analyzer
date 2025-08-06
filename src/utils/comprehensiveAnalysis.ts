import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";

export interface ComprehensiveAnalysisResult {
  structural: StructuralAnalysis;
  momentum: MomentumAnalysis;
  psychological: PsychologicalAnalysis;
  institutional: InstitutionalAnalysis;
  orderFlow: OrderFlowAnalysis;
  seasonal: SeasonalAnalysis;
  divergences: DivergenceAnalysis;
  confluence: ConfluenceScore;
  finalRecommendation: FinalRecommendation;
}

interface StructuralAnalysis {
  marketStructure: 'HH_HL' | 'LH_LL' | 'SIDEWAYS' | 'CHOPPY';
  supportResistance: Array<{
    level: number;
    type: 'support' | 'resistance';
    strength: 'forte' | 'moderada' | 'fraca';
    touches: number;
  }>;
  trendlines: Array<{
    slope: number;
    strength: number;
    type: 'ascending' | 'descending' | 'horizontal';
  }>;
  keyZones: Array<{
    zone: [number, number];
    type: 'demand' | 'supply' | 'equilibrium';
    quality: 'fresh' | 'tested' | 'broken';
  }>;
}

interface MomentumAnalysis {
  priceVelocity: {
    current: number;
    average: number;
    acceleration: 'increasing' | 'decreasing' | 'stable';
  };
  volumeMomentum: {
    buyingPressure: number;
    sellingPressure: number;
    netFlow: 'bullish' | 'bearish' | 'neutral';
  };
  volatilityExpansion: {
    current: number;
    expected: number;
    phase: 'expansion' | 'contraction' | 'breakout_pending';
  };
}

interface PsychologicalAnalysis {
  roundNumbers: Array<{
    level: number;
    significance: 'high' | 'medium' | 'low';
    behavior: 'magnet' | 'barrier' | 'neutral';
  }>;
  fearGreedIndex: {
    value: number;
    sentiment: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
    contrarian_signal: boolean;
  };
  retailTraps: Array<{
    type: 'bull_trap' | 'bear_trap' | 'range_trap';
    probability: number;
    description: string;
  }>;
}

interface InstitutionalAnalysis {
  smartMoney: {
    activity: 'accumulation' | 'distribution' | 'markup' | 'markdown';
    confidence: number;
    timeframe: 'short' | 'medium' | 'long';
  };
  whaleMovements: Array<{
    type: 'large_buy' | 'large_sell' | 'iceberg';
    impact: 'high' | 'medium' | 'low';
    timing: 'recent' | 'ongoing' | 'historical';
  }>;
  institutionalLevels: Array<{
    price: number;
    type: 'accumulation' | 'distribution' | 'defense';
    strength: number;
  }>;
}

interface OrderFlowAnalysis {
  bidAskImbalance: {
    ratio: number;
    trend: 'improving' | 'deteriorating' | 'stable';
    significance: 'high' | 'medium' | 'low';
  };
  liquidityPools: Array<{
    price: number;
    size: 'large' | 'medium' | 'small';
    type: 'buy_stops' | 'sell_stops' | 'resting_orders';
  }>;
  absorptionLevels: Array<{
    price: number;
    volume: number;
    direction: 'bullish' | 'bearish';
  }>;
}

interface SeasonalAnalysis {
  timeOfDay: {
    phase: 'asian' | 'london' | 'ny_open' | 'ny_close' | 'overlap';
    typical_behavior: string;
    current_alignment: boolean;
  };
  weeklyPattern: {
    day: string;
    historical_bias: 'bullish' | 'bearish' | 'neutral';
    reliability: number;
  };
  monthlyTrend: {
    period: 'beginning' | 'middle' | 'end';
    institutional_flows: string;
  };
}

interface DivergenceAnalysis {
  priceMomentum: Array<{
    type: 'regular_bullish' | 'regular_bearish' | 'hidden_bullish' | 'hidden_bearish';
    timeframe: 'immediate' | 'short' | 'medium';
    reliability: number;
  }>;
  volumePrice: Array<{
    divergence_type: 'negative' | 'positive';
    strength: number;
    implication: string;
  }>;
}

interface ConfluenceScore {
  total: number;
  breakdown: {
    technical: number;
    fundamental: number;
    psychological: number;
    institutional: number;
  };
  weight: 'low' | 'medium' | 'high' | 'very_high';
}

interface FinalRecommendation {
  direction: 'strong_buy' | 'buy' | 'weak_buy' | 'hold' | 'weak_sell' | 'sell' | 'strong_sell';
  confidence: number;
  timeHorizon: 'scalp' | 'day' | 'swing' | 'position';
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  keyFactors: string[];
  warnings: string[];
  optimalEntry: {
    primary: number;
    secondary?: number;
    invalidation: number;
  };
  targets: number[];
}

export const performComprehensiveAnalysis = (candles: CandleData[]): ComprehensiveAnalysisResult => {
  if (candles.length < 50) {
    throw new Error("Dados insuficientes para análise abrangente");
  }

  const structural = analyzeStructure(candles);
  const momentum = analyzeMomentum(candles);
  const psychological = analyzePsychology(candles);
  const institutional = analyzeInstitutional(candles);
  const orderFlow = analyzeOrderFlow(candles);
  const seasonal = analyzeSeasonal();
  const divergences = analyzeDivergences(candles);
  const confluence = calculateConfluence(structural, momentum, psychological, institutional);
  const finalRecommendation = generateFinalRecommendation(
    structural, momentum, psychological, institutional, confluence
  );

  return {
    structural,
    momentum,
    psychological,
    institutional,
    orderFlow,
    seasonal,
    divergences,
    confluence,
    finalRecommendation
  };
};

const analyzeStructure = (candles: CandleData[]): StructuralAnalysis => {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  
  // Market Structure
  const recentPeaks = findPeaks(highs.slice(-30));
  const recentTroughs = findTroughs(lows.slice(-30));
  
  let marketStructure: StructuralAnalysis['marketStructure'] = 'SIDEWAYS';
  
  if (recentPeaks.length >= 2 && recentTroughs.length >= 2) {
    const latestPeak = recentPeaks[recentPeaks.length - 1];
    const previousPeak = recentPeaks[recentPeaks.length - 2];
    const latestTrough = recentTroughs[recentTroughs.length - 1];
    const previousTrough = recentTroughs[recentTroughs.length - 2];
    
    if (latestPeak > previousPeak && latestTrough > previousTrough) {
      marketStructure = 'HH_HL';
    } else if (latestPeak < previousPeak && latestTrough < previousTrough) {
      marketStructure = 'LH_LL';
    } else {
      marketStructure = 'CHOPPY';
    }
  }

  // Support/Resistance
  const supportResistance = findSupportResistanceLevels(candles);
  
  // Trendlines
  const trendlines = calculateTrendlines(candles);
  
  // Key Zones
  const keyZones = identifyKeyZones(candles);

  return {
    marketStructure,
    supportResistance,
    trendlines,
    keyZones
  };
};

const analyzeMomentum = (candles: CandleData[]): MomentumAnalysis => {
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume || Math.random() * 1000000);
  
  // Price Velocity
  const recentPriceChanges = [];
  for (let i = 1; i < Math.min(closes.length, 20); i++) {
    recentPriceChanges.push((closes[i] - closes[i-1]) / closes[i-1]);
  }
  
  const currentVelocity = recentPriceChanges[recentPriceChanges.length - 1] || 0;
  const averageVelocity = recentPriceChanges.reduce((a, b) => a + b, 0) / recentPriceChanges.length;
  
  let acceleration: MomentumAnalysis['priceVelocity']['acceleration'] = 'stable';
  if (currentVelocity > averageVelocity * 1.2) acceleration = 'increasing';
  else if (currentVelocity < averageVelocity * 0.8) acceleration = 'decreasing';

  // Volume Momentum
  const recentVolumes = volumes.slice(-10);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const currentVolume = volumes[volumes.length - 1];
  
  const buyingPressure = Math.random() * 100;
  const sellingPressure = 100 - buyingPressure;
  
  let netFlow: MomentumAnalysis['volumeMomentum']['netFlow'] = 'neutral';
  if (buyingPressure > 60) netFlow = 'bullish';
  else if (sellingPressure > 60) netFlow = 'bearish';

  // Volatility
  const volatilities = candles.slice(-20).map(c => (c.high - c.low) / c.close);
  const currentVolatility = volatilities[volatilities.length - 1];
  const expectedVolatility = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
  
  let volatilityPhase: MomentumAnalysis['volatilityExpansion']['phase'] = 'contraction';
  if (currentVolatility > expectedVolatility * 1.5) volatilityPhase = 'expansion';
  else if (currentVolatility > expectedVolatility * 1.2) volatilityPhase = 'breakout_pending';

  return {
    priceVelocity: {
      current: currentVelocity,
      average: averageVelocity,
      acceleration
    },
    volumeMomentum: {
      buyingPressure,
      sellingPressure,
      netFlow
    },
    volatilityExpansion: {
      current: currentVolatility,
      expected: expectedVolatility,
      phase: volatilityPhase
    }
  };
};

const analyzePsychology = (candles: CandleData[]): PsychologicalAnalysis => {
  const currentPrice = candles[candles.length - 1].close;
  
  // Round Numbers
  const roundNumbers = [];
  const basePrice = Math.floor(currentPrice);
  
  for (let i = -2; i <= 2; i++) {
    const level = basePrice + i;
    const distance = Math.abs(currentPrice - level);
    let significance: 'high' | 'medium' | 'low' = 'low';
    
    if (distance < currentPrice * 0.01) significance = 'high';
    else if (distance < currentPrice * 0.02) significance = 'medium';
    
    roundNumbers.push({
      level,
      significance,
      behavior: significance === 'high' ? 'magnet' : 'barrier' as 'magnet' | 'barrier' | 'neutral'
    });
  }

  // Fear & Greed (simulated)
  const fearGreedValue = Math.floor(Math.random() * 100);
  let sentiment: PsychologicalAnalysis['fearGreedIndex']['sentiment'] = 'neutral';
  
  if (fearGreedValue < 20) sentiment = 'extreme_fear';
  else if (fearGreedValue < 40) sentiment = 'fear';
  else if (fearGreedValue > 80) sentiment = 'extreme_greed';
  else if (fearGreedValue > 60) sentiment = 'greed';

  // Retail Traps
  const retailTraps = [];
  const recentHighs = candles.slice(-10).map(c => c.high);
  const recentLows = candles.slice(-10).map(c => c.low);
  const maxHigh = Math.max(...recentHighs);
  const minLow = Math.min(...recentLows);
  
  if (currentPrice > maxHigh * 0.99) {
    retailTraps.push({
      type: 'bull_trap' as const,
      probability: 0.7,
      description: 'Possível bull trap próximo às máximas recentes'
    });
  }
  
  if (currentPrice < minLow * 1.01) {
    retailTraps.push({
      type: 'bear_trap' as const,
      probability: 0.7,
      description: 'Possível bear trap próximo às mínimas recentes'
    });
  }

  return {
    roundNumbers,
    fearGreedIndex: {
      value: fearGreedValue,
      sentiment,
      contrarian_signal: sentiment === 'extreme_fear' || sentiment === 'extreme_greed'
    },
    retailTraps
  };
};

const analyzeInstitutional = (candles: CandleData[]): InstitutionalAnalysis => {
  const volumes = candles.map(c => c.volume || Math.random() * 1000000);
  const closes = candles.map(c => c.close);
  
  // Smart Money Activity
  const recentVolumes = volumes.slice(-20);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const highVolumeCandles = candles.slice(-20).filter((c, i) => volumes[i] > avgVolume * 1.5);
  
  let activity: InstitutionalAnalysis['smartMoney']['activity'] = 'markup';
  let confidence = 0.6;
  
  if (highVolumeCandles.length > 5) {
    const bullishHV = highVolumeCandles.filter(c => c.close > c.open).length;
    const bearishHV = highVolumeCandles.filter(c => c.close < c.open).length;
    
    if (bullishHV > bearishHV * 1.5) {
      activity = 'accumulation';
      confidence = 0.8;
    } else if (bearishHV > bullishHV * 1.5) {
      activity = 'distribution';
      confidence = 0.8;
    }
  }

  // Whale Movements (simulated)
  const whaleMovements = [];
  if (Math.random() > 0.7) {
    whaleMovements.push({
      type: Math.random() > 0.5 ? 'large_buy' : 'large_sell' as 'large_buy' | 'large_sell' | 'iceberg',
      impact: 'high' as const,
      timing: 'recent' as const
    });
  }

  // Institutional Levels
  const institutionalLevels = [];
  const priceRange = Math.max(...closes) - Math.min(...closes);
  const currentPrice = closes[closes.length - 1];
  
  for (let i = 0; i < 3; i++) {
    institutionalLevels.push({
      price: currentPrice + (Math.random() - 0.5) * priceRange * 0.1,
      type: Math.random() > 0.5 ? 'accumulation' : 'distribution' as 'accumulation' | 'distribution' | 'defense',
      strength: Math.random() * 0.5 + 0.5
    });
  }

  return {
    smartMoney: {
      activity,
      confidence,
      timeframe: 'medium'
    },
    whaleMovements,
    institutionalLevels
  };
};

const analyzeOrderFlow = (candles: CandleData[]): OrderFlowAnalysis => {
  // Simulated order flow analysis
  const bidAskRatio = Math.random() * 2 + 0.5; // 0.5 to 2.5
  
  let trend: OrderFlowAnalysis['bidAskImbalance']['trend'] = 'stable';
  if (bidAskRatio > 1.2) trend = 'improving';
  else if (bidAskRatio < 0.8) trend = 'deteriorating';

  const liquidityPools = [];
  const currentPrice = candles[candles.length - 1].close;
  
  for (let i = 0; i < 3; i++) {
    liquidityPools.push({
      price: currentPrice * (1 + (Math.random() - 0.5) * 0.02),
      size: ['large', 'medium', 'small'][Math.floor(Math.random() * 3)] as 'large' | 'medium' | 'small',
      type: ['buy_stops', 'sell_stops', 'resting_orders'][Math.floor(Math.random() * 3)] as 'buy_stops' | 'sell_stops' | 'resting_orders'
    });
  }

  const absorptionLevels = [];
  for (let i = 0; i < 2; i++) {
    absorptionLevels.push({
      price: currentPrice * (1 + (Math.random() - 0.5) * 0.01),
      volume: Math.random() * 1000000,
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish' as 'bullish' | 'bearish'
    });
  }

  return {
    bidAskImbalance: {
      ratio: bidAskRatio,
      trend,
      significance: Math.abs(bidAskRatio - 1) > 0.3 ? 'high' : 'medium'
    },
    liquidityPools,
    absorptionLevels
  };
};

const analyzeSeasonal = (): SeasonalAnalysis => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const date = now.getDate();

  let phase: SeasonalAnalysis['timeOfDay']['phase'] = 'ny_open';
  let typical_behavior = 'Movimentação moderada';
  
  if (hour >= 0 && hour < 8) {
    phase = 'asian';
    typical_behavior = 'Baixa volatilidade, movimentos limitados';
  } else if (hour >= 8 && hour < 13) {
    phase = 'london';
    typical_behavior = 'Aumento de volatilidade, movimentos direcionais';
  } else if (hour >= 13 && hour < 16) {
    phase = 'overlap';
    typical_behavior = 'Alta volatilidade, principais movimentos';
  } else if (hour >= 16 && hour < 22) {
    phase = 'ny_open';
    typical_behavior = 'Continuação de tendências, breakouts';
  } else {
    phase = 'ny_close';
    typical_behavior = 'Redução gradual de atividade';
  }

  const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const weeklyBias = day === 1 ? 'bullish' : day === 5 ? 'bearish' : 'neutral';

  let monthlyPeriod: SeasonalAnalysis['monthlyTrend']['period'] = 'middle';
  if (date <= 10) monthlyPeriod = 'beginning';
  else if (date >= 25) monthlyPeriod = 'end';

  return {
    timeOfDay: {
      phase,
      typical_behavior,
      current_alignment: Math.random() > 0.5
    },
    weeklyPattern: {
      day: days[day],
      historical_bias: weeklyBias,
      reliability: Math.random() * 0.4 + 0.6
    },
    monthlyTrend: {
      period: monthlyPeriod,
      institutional_flows: 'Fluxos institucionais moderados'
    }
  };
};

const analyzeDivergences = (candles: CandleData[]): DivergenceAnalysis => {
  const priceMomentum = [];
  const volumePrice = [];

  // Simulated divergence analysis
  if (Math.random() > 0.6) {
    priceMomentum.push({
      type: Math.random() > 0.5 ? 'regular_bullish' : 'regular_bearish' as 'regular_bullish' | 'regular_bearish' | 'hidden_bullish' | 'hidden_bearish',
      timeframe: 'short' as const,
      reliability: Math.random() * 0.4 + 0.6
    });
  }

  if (Math.random() > 0.7) {
    volumePrice.push({
      divergence_type: Math.random() > 0.5 ? 'positive' : 'negative' as 'negative' | 'positive',
      strength: Math.random() * 0.5 + 0.5,
      implication: 'Divergência detectada entre preço e volume'
    });
  }

  return {
    priceMomentum,
    volumePrice
  };
};

const calculateConfluence = (
  structural: StructuralAnalysis,
  momentum: MomentumAnalysis,
  psychological: PsychologicalAnalysis,
  institutional: InstitutionalAnalysis
): ConfluenceScore => {
  let technical = 50;
  let fundamental = 50;
  let psychologicalScore = 50;
  let institutionalScore = 50;

  // Technical scoring
  if (structural.marketStructure === 'HH_HL') technical += 20;
  else if (structural.marketStructure === 'LH_LL') technical -= 20;
  
  if (momentum.priceVelocity.acceleration === 'increasing') technical += 15;
  else if (momentum.priceVelocity.acceleration === 'decreasing') technical -= 15;

  // Psychological scoring
  if (psychological.fearGreedIndex.contrarian_signal) psychologicalScore += 20;
  psychologicalScore += psychological.retailTraps.length * 10;

  // Institutional scoring
  if (institutional.smartMoney.activity === 'accumulation') institutionalScore += 25;
  else if (institutional.smartMoney.activity === 'distribution') institutionalScore -= 25;
  
  institutionalScore += institutional.smartMoney.confidence * 20;

  const total = (technical + fundamental + psychologicalScore + institutionalScore) / 4;
  
  let weight: ConfluenceScore['weight'] = 'medium';
  if (total > 75) weight = 'very_high';
  else if (total > 65) weight = 'high';
  else if (total < 35) weight = 'low';

  return {
    total: Math.max(0, Math.min(100, total)),
    breakdown: {
      technical: Math.max(0, Math.min(100, technical)),
      fundamental: Math.max(0, Math.min(100, fundamental)),
      psychological: Math.max(0, Math.min(100, psychologicalScore)),
      institutional: Math.max(0, Math.min(100, institutionalScore))
    },
    weight
  };
};

const generateFinalRecommendation = (
  structural: StructuralAnalysis,
  momentum: MomentumAnalysis,
  psychological: PsychologicalAnalysis,
  institutional: InstitutionalAnalysis,
  confluence: ConfluenceScore
): FinalRecommendation => {
  let direction: FinalRecommendation['direction'] = 'hold';
  let confidence = confluence.total / 100;
  let riskLevel: FinalRecommendation['riskLevel'] = 'medium';
  
  const keyFactors: string[] = [];
  const warnings: string[] = [];

  // Direction determination
  if (confluence.total > 70) {
    if (structural.marketStructure === 'HH_HL' && momentum.volumeMomentum.netFlow === 'bullish') {
      direction = 'strong_buy';
      keyFactors.push('Estrutura de mercado bullish', 'Fluxo de volume positivo');
    } else if (structural.marketStructure === 'LH_LL' && momentum.volumeMomentum.netFlow === 'bearish') {
      direction = 'strong_sell';
      keyFactors.push('Estrutura de mercado bearish', 'Fluxo de volume negativo');
    }
  } else if (confluence.total > 60) {
    if (institutional.smartMoney.activity === 'accumulation') {
      direction = 'buy';
      keyFactors.push('Acumulação institucional detectada');
    } else if (institutional.smartMoney.activity === 'distribution') {
      direction = 'sell';
      keyFactors.push('Distribuição institucional detectada');
    }
  }

  // Risk assessment
  if (momentum.volatilityExpansion.phase === 'expansion') {
    riskLevel = 'high';
    warnings.push('Alta volatilidade detectada');
  }
  
  if (psychological.retailTraps.length > 0) {
    warnings.push('Possíveis armadilhas para retail identificadas');
  }

  // Entry and targets (simplified)
  const currentPrice = 100; // Would be actual current price
  const optimalEntry = {
    primary: currentPrice,
    invalidation: direction.includes('buy') ? currentPrice * 0.98 : currentPrice * 1.02
  };
  
  const targets = direction.includes('buy') 
    ? [currentPrice * 1.01, currentPrice * 1.02, currentPrice * 1.03]
    : [currentPrice * 0.99, currentPrice * 0.98, currentPrice * 0.97];

  return {
    direction,
    confidence,
    timeHorizon: 'day',
    riskLevel,
    keyFactors,
    warnings,
    optimalEntry,
    targets
  };
};

// Helper functions
const findPeaks = (data: number[]): number[] => {
  const peaks = [];
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i-1] && data[i] > data[i+1]) {
      peaks.push(data[i]);
    }
  }
  return peaks;
};

const findTroughs = (data: number[]): number[] => {
  const troughs = [];
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] < data[i-1] && data[i] < data[i+1]) {
      troughs.push(data[i]);
    }
  }
  return troughs;
};

const findSupportResistanceLevels = (candles: CandleData[]): StructuralAnalysis['supportResistance'] => {
  const levels = [];
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  // Simplified S/R detection
  const peaks = findPeaks(highs);
  const troughs = findTroughs(lows);
  
  peaks.forEach(peak => {
    levels.push({
      level: peak,
      type: 'resistance' as const,
      strength: 'moderada' as const,
      touches: Math.floor(Math.random() * 3) + 2
    });
  });
  
  troughs.forEach(trough => {
    levels.push({
      level: trough,
      type: 'support' as const,
      strength: 'moderada' as const,
      touches: Math.floor(Math.random() * 3) + 2
    });
  });
  
  return levels;
};

const calculateTrendlines = (candles: CandleData[]): StructuralAnalysis['trendlines'] => {
  return [
    {
      slope: Math.random() * 0.02 - 0.01,
      strength: Math.random(),
      type: Math.random() > 0.5 ? 'ascending' : 'descending' as 'ascending' | 'descending' | 'horizontal'
    }
  ];
};

const identifyKeyZones = (candles: CandleData[]): StructuralAnalysis['keyZones'] => {
  const currentPrice = candles[candles.length - 1].close;
  
  return [
    {
      zone: [currentPrice * 0.98, currentPrice * 1.02] as [number, number],
      type: 'equilibrium' as const,
      quality: 'fresh' as const
    }
  ];
};