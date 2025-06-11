
import { CandleData, Point } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";

export interface PriceActionSignal {
  type: 'rejection' | 'absorption' | 'breakout' | 'retest' | 'liquidity_sweep' | 'institutional_move';
  strength: 'forte' | 'moderada' | 'fraca';
  direction: 'alta' | 'baixa';
  confidence: number;
  description: string;
  entryZone?: {
    min: number;
    max: number;
    optimal: number;
  };
  riskReward?: number;
}

export interface MarketContextAnalysis {
  phase: 'acumulação' | 'distribuição' | 'tendência' | 'consolidação' | 'reversão';
  sentiment: 'muito_otimista' | 'otimista' | 'neutro' | 'pessimista' | 'muito_pessimista';
  volatilityState: 'baixa' | 'normal' | 'alta' | 'extrema';
  liquidityCondition: 'seca' | 'normal' | 'abundante';
  institutionalBias: 'compra' | 'venda' | 'neutro';
  timeOfDay: 'abertura' | 'meio_dia' | 'fechamento' | 'after_hours';
  marketStructure: {
    trend: 'alta' | 'baixa' | 'lateral';
    strength: number;
    breakouts: boolean;
    pullbacks: boolean;
  };
}

// Análise de Price Action para M1
export const analyzePriceAction = (candles: CandleData[]): PriceActionSignal[] => {
  if (candles.length < 10) return [];

  const signals: PriceActionSignal[] = [];
  const recentCandles = candles.slice(-10);
  
  // Detectar rejeições em níveis-chave
  const rejectionSignals = detectRejections(recentCandles);
  signals.push(...rejectionSignals);
  
  // Detectar absorção de volume
  const absorptionSignals = detectAbsorption(recentCandles);
  signals.push(...absorptionSignals);
  
  // Detectar breakouts com follow-through
  const breakoutSignals = detectBreakouts(recentCandles);
  signals.push(...breakoutSignals);
  
  // Detectar retests de níveis
  const retestSignals = detectRetests(recentCandles);
  signals.push(...retestSignals);
  
  // Detectar liquidity sweeps
  const liquiditySignals = detectLiquiditySweeps(recentCandles);
  signals.push(...liquiditySignals);

  return signals.sort((a, b) => b.confidence - a.confidence);
};

const detectRejections = (candles: CandleData[]): PriceActionSignal[] => {
  const signals: PriceActionSignal[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];
    
    // Rejeição de alta (pin bar bearish)
    const upperWick = current.high - Math.max(current.open, current.close);
    const lowerWick = Math.min(current.open, current.close) - current.low;
    const body = Math.abs(current.close - current.open);
    const totalRange = current.high - current.low;
    
    // Pin bar de rejeição de alta
    if (upperWick > body * 2 && upperWick > totalRange * 0.6 && current.close < current.open) {
      const strength = upperWick > body * 3 ? 'forte' : upperWick > body * 2.5 ? 'moderada' : 'fraca';
      const confidence = Math.min(0.9, (upperWick / body) * 0.2 + 0.4);
      
      signals.push({
        type: 'rejection',
        strength,
        direction: 'baixa',
        confidence,
        description: `Rejeição ${strength} no topo - Pin bar bearish com pavio de ${((upperWick / totalRange) * 100).toFixed(1)}%`,
        entryZone: {
          min: current.close - (body * 0.5),
          max: current.close,
          optimal: current.close - (body * 0.2)
        },
        riskReward: upperWick > body * 3 ? 3.5 : 2.8
      });
    }
    
    // Pin bar de rejeição de baixa
    if (lowerWick > body * 2 && lowerWick > totalRange * 0.6 && current.close > current.open) {
      const strength = lowerWick > body * 3 ? 'forte' : lowerWick > body * 2.5 ? 'moderada' : 'fraca';
      const confidence = Math.min(0.9, (lowerWick / body) * 0.2 + 0.4);
      
      signals.push({
        type: 'rejection',
        strength,
        direction: 'alta',
        confidence,
        description: `Rejeição ${strength} no fundo - Pin bar bullish com pavio de ${((lowerWick / totalRange) * 100).toFixed(1)}%`,
        entryZone: {
          min: current.close,
          max: current.close + (body * 0.5),
          optimal: current.close + (body * 0.2)
        },
        riskReward: lowerWick > body * 3 ? 3.5 : 2.8
      });
    }
  }
  
  return signals;
};

const detectAbsorption = (candles: CandleData[]): PriceActionSignal[] => {
  const signals: PriceActionSignal[] = [];
  
  for (let i = 2; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];
    const beforePrevious = candles[i - 2];
    
    // Absorção bullish - candle grande que engole movimento de baixa
    if (current.close > current.open && 
        current.open <= previous.low && 
        current.close >= beforePrevious.high &&
        (current.high - current.low) > (previous.high - previous.low) * 1.5) {
      
      signals.push({
        type: 'absorption',
        strength: 'forte',
        direction: 'alta',
        confidence: 0.75,
        description: 'Absorção bullish - Candle grande absorvendo pressão de venda',
        entryZone: {
          min: current.close - ((current.close - current.open) * 0.3),
          max: current.close,
          optimal: current.close - ((current.close - current.open) * 0.1)
        },
        riskReward: 3.2
      });
    }
    
    // Absorção bearish - candle grande que engole movimento de alta
    if (current.close < current.open && 
        current.open >= previous.high && 
        current.close <= beforePrevious.low &&
        (current.high - current.low) > (previous.high - previous.low) * 1.5) {
      
      signals.push({
        type: 'absorption',
        strength: 'forte',
        direction: 'baixa',
        confidence: 0.75,
        description: 'Absorção bearish - Candle grande absorvendo pressão de compra',
        entryZone: {
          min: current.close,
          max: current.close + ((current.open - current.close) * 0.3),
          optimal: current.close + ((current.open - current.close) * 0.1)
        },
        riskReward: 3.2
      });
    }
  }
  
  return signals;
};

const detectBreakouts = (candles: CandleData[]): PriceActionSignal[] => {
  const signals: PriceActionSignal[] = [];
  
  if (candles.length < 5) return signals;
  
  const recent = candles.slice(-5);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);
  const maxHigh = Math.max(...highs.slice(0, -1));
  const minLow = Math.min(...lows.slice(0, -1));
  
  const current = candles[candles.length - 1];
  
  // Breakout de alta
  if (current.close > maxHigh && current.close > current.open) {
    const strength = current.close > maxHigh * 1.005 ? 'forte' : 'moderada';
    
    signals.push({
      type: 'breakout',
      strength,
      direction: 'alta',
      confidence: 0.7,
      description: `Breakout ${strength} de alta - Rompimento de máxima em ${maxHigh.toFixed(4)}`,
      entryZone: {
        min: maxHigh,
        max: current.close + ((current.close - current.open) * 0.2),
        optimal: maxHigh + ((current.close - maxHigh) * 0.3)
      },
      riskReward: 2.8
    });
  }
  
  // Breakout de baixa
  if (current.close < minLow && current.close < current.open) {
    const strength = current.close < minLow * 0.995 ? 'forte' : 'moderada';
    
    signals.push({
      type: 'breakout',
      strength,
      direction: 'baixa',
      confidence: 0.7,
      description: `Breakout ${strength} de baixa - Rompimento de mínima em ${minLow.toFixed(4)}`,
      entryZone: {
        min: current.close - ((current.open - current.close) * 0.2),
        max: minLow,
        optimal: minLow - ((minLow - current.close) * 0.3)
      },
      riskReward: 2.8
    });
  }
  
  return signals;
};

const detectRetests = (candles: CandleData[]): PriceActionSignal[] => {
  const signals: PriceActionSignal[] = [];
  
  // Lógica para detectar retests de níveis importantes
  // Implementação simplificada para o exemplo
  
  return signals;
};

const detectLiquiditySweeps = (candles: CandleData[]): PriceActionSignal[] => {
  const signals: PriceActionSignal[] = [];
  
  if (candles.length < 7) return signals;
  
  for (let i = 3; i < candles.length - 1; i++) {
    const current = candles[i];
    const next = candles[i + 1];
    const previous3 = candles.slice(i - 3, i);
    
    // Sweep de liquidez de baixa (fake breakout down)
    const recentLow = Math.min(...previous3.map(c => c.low));
    if (current.low < recentLow && next.close > current.open && next.close > recentLow) {
      signals.push({
        type: 'liquidity_sweep',
        strength: 'forte',
        direction: 'alta',
        confidence: 0.8,
        description: 'Liquidity Sweep bullish - Falso rompimento seguido de reversão',
        entryZone: {
          min: recentLow,
          max: next.close,
          optimal: recentLow + ((next.close - recentLow) * 0.3)
        },
        riskReward: 4.0
      });
    }
    
    // Sweep de liquidez de alta (fake breakout up)
    const recentHigh = Math.max(...previous3.map(c => c.high));
    if (current.high > recentHigh && next.close < current.open && next.close < recentHigh) {
      signals.push({
        type: 'liquidity_sweep',
        strength: 'forte',
        direction: 'baixa',
        confidence: 0.8,
        description: 'Liquidity Sweep bearish - Falso rompimento seguido de reversão',
        entryZone: {
          min: next.close,
          max: recentHigh,
          optimal: recentHigh - ((recentHigh - next.close) * 0.3)
        },
        riskReward: 4.0
      });
    }
  }
  
  return signals;
};

// Análise de contexto de mercado em tempo real
export const analyzeMarketContext = (candles: CandleData[]): MarketContextAnalysis => {
  if (candles.length < 20) {
    return {
      phase: 'indefinida',
      sentiment: 'neutro',
      volatilityState: 'normal',
      liquidityCondition: 'normal',
      institutionalBias: 'neutro',
      timeOfDay: 'meio_dia',
      marketStructure: {
        trend: 'lateral',
        strength: 50,
        breakouts: false,
        pullbacks: false
      }
    };
  }

  const recent = candles.slice(-20);
  const veryRecent = candles.slice(-5);
  
  // Determinar fase do mercado
  const phase = determineMarketPhase(recent);
  
  // Analisar sentimento
  const sentiment = analyzeSentiment(recent);
  
  // Analisar volatilidade
  const volatilityState = analyzeVolatility(recent);
  
  // Analisar liquidez
  const liquidityCondition = analyzeLiquidity(recent);
  
  // Determinar bias institucional
  const institutionalBias = determineInstitutionalBias(recent);
  
  // Analisar horário (simulado)
  const timeOfDay = determineTimeOfDay();
  
  // Estrutura de mercado
  const marketStructure = analyzeMarketStructure(recent);

  return {
    phase,
    sentiment,
    volatilityState,
    liquidityCondition,
    institutionalBias,
    timeOfDay,
    marketStructure
  };
};

const determineMarketPhase = (candles: CandleData[]): MarketContextAnalysis['phase'] => {
  const prices = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
  const secondHalf = prices.slice(Math.floor(prices.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (Math.abs(changePercent) < 0.1) {
    return 'consolidação';
  } else if (changePercent > 0.2) {
    return 'tendência';
  } else if (changePercent < -0.2) {
    return 'tendência';
  } else if (changePercent > 0) {
    return 'acumulação';
  } else {
    return 'distribuição';
  }
};

const analyzeSentiment = (candles: CandleData[]): MarketContextAnalysis['sentiment'] => {
  const bullishCandles = candles.filter(c => c.close > c.open).length;
  const totalCandles = candles.length;
  const bullishPercent = (bullishCandles / totalCandles) * 100;
  
  if (bullishPercent >= 80) return 'muito_otimista';
  if (bullishPercent >= 65) return 'otimista';
  if (bullishPercent <= 20) return 'muito_pessimista';
  if (bullishPercent <= 35) return 'pessimista';
  return 'neutro';
};

const analyzeVolatility = (candles: CandleData[]): MarketContextAnalysis['volatilityState'] => {
  const ranges = candles.map(c => ((c.high - c.low) / c.close) * 100);
  const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
  
  if (avgRange < 0.05) return 'baixa';
  if (avgRange > 0.2) return 'extrema';
  if (avgRange > 0.1) return 'alta';
  return 'normal';
};

const analyzeLiquidity = (candles: CandleData[]): MarketContextAnalysis['liquidityCondition'] => {
  // Simular análise de liquidez baseada em padrões de preço
  const bodies = candles.map(c => Math.abs(c.close - c.open));
  const avgBody = bodies.reduce((a, b) => a + b, 0) / bodies.length;
  const recentBody = bodies[bodies.length - 1];
  
  if (recentBody < avgBody * 0.5) return 'seca';
  if (recentBody > avgBody * 1.5) return 'abundante';
  return 'normal';
};

const determineInstitutionalBias = (candles: CandleData[]): MarketContextAnalysis['institutionalBias'] => {
  const recent5 = candles.slice(-5);
  const longCandles = recent5.filter(c => Math.abs(c.close - c.open) > (c.high - c.low) * 0.7);
  
  if (longCandles.length >= 3) {
    const bullish = longCandles.filter(c => c.close > c.open).length;
    const bearish = longCandles.filter(c => c.close < c.open).length;
    
    if (bullish > bearish) return 'compra';
    if (bearish > bullish) return 'venda';
  }
  
  return 'neutro';
};

const determineTimeOfDay = (): MarketContextAnalysis['timeOfDay'] => {
  const hour = new Date().getHours();
  
  if (hour >= 9 && hour <= 11) return 'abertura';
  if (hour >= 15 && hour <= 17) return 'fechamento';
  if (hour < 9 || hour > 17) return 'after_hours';
  return 'meio_dia';
};

const analyzeMarketStructure = (candles: CandleData[]): MarketContextAnalysis['marketStructure'] => {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const change = ((lastClose - firstClose) / firstClose) * 100;
  
  let trend: 'alta' | 'baixa' | 'lateral' = 'lateral';
  if (change > 0.1) trend = 'alta';
  if (change < -0.1) trend = 'baixa';
  
  const strength = Math.min(100, Math.abs(change) * 50);
  
  // Detectar breakouts e pullbacks simples
  const maxHigh = Math.max(...highs.slice(0, -2));
  const minLow = Math.min(...lows.slice(0, -2));
  const currentHigh = highs[highs.length - 1];
  const currentLow = lows[lows.length - 1];
  
  const breakouts = currentHigh > maxHigh || currentLow < minLow;
  const pullbacks = trend !== 'lateral' && !breakouts;
  
  return {
    trend,
    strength,
    breakouts,
    pullbacks
  };
};
