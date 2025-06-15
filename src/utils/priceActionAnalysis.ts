import { CandleData, Point } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";
import { analyzeCandleMetrics } from "./candleAnalysis";

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

// Análise de Price Action para M1 com dados reais
export const analyzePriceAction = (candles: CandleData[]): PriceActionSignal[] => {
  if (candles.length < 10) return [];

  const signals: PriceActionSignal[] = [];
  const recentCandles = candles.slice(-20); // Analisar últimos 20 candles
  
  // Detectar rejeições em níveis-chave
  const rejectionSignals = detectRealRejections(recentCandles);
  signals.push(...rejectionSignals);
  
  // Detectar absorção de volume/pressão
  const absorptionSignals = detectRealAbsorption(recentCandles);
  signals.push(...absorptionSignals);
  
  // Detectar breakouts com follow-through
  const breakoutSignals = detectRealBreakouts(recentCandles);
  signals.push(...breakoutSignals);
  
  // Detectar retests de níveis importantes
  const retestSignals = detectRealRetests(recentCandles);
  signals.push(...retestSignals);
  
  // Detectar liquidity sweeps reais
  const liquiditySignals = detectRealLiquiditySweeps(recentCandles);
  signals.push(...liquiditySignals);

  // Detectar movimentos institucionais
  const institutionalSignals = detectInstitutionalMoves(recentCandles);
  signals.push(...institutionalSignals);

  return signals
    .filter(signal => signal.confidence > 0.5) // Apenas sinais com confiança > 50%
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8); // Top 8 sinais mais confiáveis
};

const detectRealRejections = (candles: CandleData[]): PriceActionSignal[] => {
  const signals: PriceActionSignal[] = [];
  
  for (let i = 2; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];
    const beforePrevious = candles[i - 2];
    
    const metrics = analyzeCandleMetrics(current);
    const prevMetrics = analyzeCandleMetrics(previous);
    
    // Rejeição de alta com pin bar bearish
    if (metrics.upperWickPercent > 60 && 
        metrics.bodyPercent < 35 &&
        current.high > previous.high && 
        current.high > beforePrevious.high) {
      
      const strength = metrics.upperWickPercent > 75 ? 'forte' : 
                      metrics.upperWickPercent > 65 ? 'moderada' : 'fraca';
      
      const confidence = Math.min(0.95, 
        (metrics.upperWickPercent / 100) * 0.7 + 
        (current.high > Math.max(previous.high, beforePrevious.high) ? 0.2 : 0) +
        0.1
      );
      
      signals.push({
        type: 'rejection',
        strength,
        direction: 'baixa',
        confidence,
        description: `Rejeição ${strength} em máxima - Pin bar com pavio ${metrics.upperWickPercent.toFixed(1)}%`,
        entryZone: {
          min: current.close - (metrics.bodySize * 0.5),
          max: current.close + (metrics.bodySize * 0.2),
          optimal: current.close - (metrics.bodySize * 0.1)
        },
        riskReward: strength === 'forte' ? 3.5 : strength === 'moderada' ? 2.8 : 2.2
      });
    }
    
    // Rejeição de baixa com pin bar bullish
    if (metrics.lowerWickPercent > 60 && 
        metrics.bodyPercent < 35 &&
        current.low < previous.low && 
        current.low < beforePrevious.low) {
      
      const strength = metrics.lowerWickPercent > 75 ? 'forte' : 
                      metrics.lowerWickPercent > 65 ? 'moderada' : 'fraca';
      
      const confidence = Math.min(0.95, 
        (metrics.lowerWickPercent / 100) * 0.7 + 
        (current.low < Math.min(previous.low, beforePrevious.low) ? 0.2 : 0) +
        0.1
      );
      
      signals.push({
        type: 'rejection',
        strength,
        direction: 'alta',
        confidence,
        description: `Rejeição ${strength} em mínima - Pin bar com pavio ${metrics.lowerWickPercent.toFixed(1)}%`,
        entryZone: {
          min: current.close - (metrics.bodySize * 0.2),
          max: current.close + (metrics.bodySize * 0.5),
          optimal: current.close + (metrics.bodySize * 0.1)
        },
        riskReward: strength === 'forte' ? 3.5 : strength === 'moderada' ? 2.8 : 2.2
      });
    }
  }
  
  return signals;
};

const detectRealAbsorption = (candles: CandleData[]): PriceActionSignal[] => {
  const signals: PriceActionSignal[] = [];
  
  for (let i = 3; i < candles.length; i++) {
    const current = candles[i];
    const prev1 = candles[i - 1];
    const prev2 = candles[i - 2];
    const prev3 = candles[i - 3];
    
    const currentMetrics = analyzeCandleMetrics(current);
    const avgPrevRange = (
      (prev1.high - prev1.low) + 
      (prev2.high - prev2.low) + 
      (prev3.high - prev3.low)
    ) / 3;
    
    // Absorção bullish - candle grande que absorve pressão de venda
    if (currentMetrics.candleType === 'bullish' &&
        current.open <= Math.min(prev1.low, prev2.low) &&
        current.close >= Math.max(prev1.high, prev2.high) &&
        (current.high - current.low) > avgPrevRange * 1.8) {
      
      const volumeRatio = (current.high - current.low) / avgPrevRange;
      const confidence = Math.min(0.9, 0.4 + (volumeRatio - 1.8) * 0.2);
      
      signals.push({
        type: 'absorption',
        strength: volumeRatio > 2.5 ? 'forte' : 'moderada',
        direction: 'alta',
        confidence,
        description: `Absorção bullish - Candle ${volumeRatio.toFixed(1)}x maior absorvendo vendas`,
        entryZone: {
          min: current.close - (currentMetrics.bodySize * 0.3),
          max: current.close,
          optimal: current.close - (currentMetrics.bodySize * 0.1)
        },
        riskReward: 3.2
      });
    }
    
    // Absorção bearish - candle grande que absorve pressão de compra
    if (currentMetrics.candleType === 'bearish' &&
        current.open >= Math.max(prev1.high, prev2.high) &&
        current.close <= Math.min(prev1.low, prev2.low) &&
        (current.high - current.low) > avgPrevRange * 1.8) {
      
      const volumeRatio = (current.high - current.low) / avgPrevRange;
      const confidence = Math.min(0.9, 0.4 + (volumeRatio - 1.8) * 0.2);
      
      signals.push({
        type: 'absorption',
        strength: volumeRatio > 2.5 ? 'forte' : 'moderada',
        direction: 'baixa',
        confidence,
        description: `Absorção bearish - Candle ${volumeRatio.toFixed(1)}x maior absorvendo compras`,
        entryZone: {
          min: current.close,
          max: current.close + (currentMetrics.bodySize * 0.3),
          optimal: current.close + (currentMetrics.bodySize * 0.1)
        },
        riskReward: 3.2
      });
    }
  }
  
  return signals;
};

const detectRealBreakouts = (candles: CandleData[]): PriceActionSignal[] => {
  const signals: PriceActionSignal[] = [];
  
  if (candles.length < 8) return signals;
  
  for (let i = 7; i < candles.length; i++) {
    const current = candles[i];
    const consolidation = candles.slice(i - 7, i);
    
    const highs = consolidation.map(c => c.high);
    const lows = consolidation.map(c => c.low);
    const resistance = Math.max(...highs);
    const support = Math.min(...lows);
    const range = resistance - support;
    const avgPrice = (resistance + support) / 2;
    const rangePercent = (range / avgPrice) * 100;
    
    // Só considera breakout se houve consolidação (range < 0.3%)
    if (rangePercent > 0.05 && rangePercent < 0.3) {
      const currentMetrics = analyzeCandleMetrics(current);
      
      // Breakout de alta
      if (current.close > resistance && 
          currentMetrics.candleType === 'bullish' &&
          currentMetrics.bodyPercent > 40) {
        
        const breakoutStrength = ((current.close - resistance) / range) * 100;
        const confidence = Math.min(0.85, 0.5 + (breakoutStrength / 100) * 0.3);
        
        signals.push({
          type: 'breakout',
          strength: breakoutStrength > 50 ? 'forte' : 'moderada',
          direction: 'alta',
          confidence,
          description: `Breakout de alta - Rompimento de ${resistance.toFixed(4)} com força ${breakoutStrength.toFixed(1)}%`,
          entryZone: {
            min: resistance,
            max: current.close + (range * 0.2),
            optimal: resistance + (range * 0.1)
          },
          riskReward: 2.5
        });
      }
      
      // Breakout de baixa
      if (current.close < support && 
          currentMetrics.candleType === 'bearish' &&
          currentMetrics.bodyPercent > 40) {
        
        const breakoutStrength = ((support - current.close) / range) * 100;
        const confidence = Math.min(0.85, 0.5 + (breakoutStrength / 100) * 0.3);
        
        signals.push({
          type: 'breakout',
          strength: breakoutStrength > 50 ? 'forte' : 'moderada',
          direction: 'baixa',
          confidence,
          description: `Breakout de baixa - Rompimento de ${support.toFixed(4)} com força ${breakoutStrength.toFixed(1)}%`,
          entryZone: {
            min: current.close - (range * 0.2),
            max: support,
            optimal: support - (range * 0.1)
          },
          riskReward: 2.5
        });
      }
    }
  }
  
  return signals;
};

const detectRealRetests = (candles: CandleData[]): PriceActionSignal[] => {
  const signals: PriceActionSignal[] = [];
  
  // Implementar detecção real de retests
  for (let i = 5; i < candles.length; i++) {
    const current = candles[i];
    const recent = candles.slice(i - 5, i);
    
    // Buscar níveis importantes nos últimos 5 candles
    const importantLevels = findImportantLevels(recent);
    
    for (const level of importantLevels) {
      const distance = Math.abs(current.close - level.price);
      const pricePercent = (distance / current.close) * 100;
      
      // Se está próximo de um nível importante (dentro de 0.05%)
      if (pricePercent < 0.05) {
        const metrics = analyzeCandleMetrics(current);
        
        if (level.type === 'resistance' && metrics.wickDominance === 'upper') {
          signals.push({
            type: 'retest',
            strength: 'moderada',
            direction: 'baixa',
            confidence: 0.7,
            description: `Retest de resistência em ${level.price.toFixed(4)} - Rejeição detectada`,
            riskReward: 2.8
          });
        } else if (level.type === 'support' && metrics.wickDominance === 'lower') {
          signals.push({
            type: 'retest',
            strength: 'moderada',
            direction: 'alta',
            confidence: 0.7,
            description: `Retest de suporte em ${level.price.toFixed(4)} - Sustentação detectada`,
            riskReward: 2.8
          });
        }
      }
    }
  }
  
  return signals;
};

const detectRealLiquiditySweeps = (candles: CandleData[]): PriceActionSignal[] => {
  const signals: PriceActionSignal[] = [];
  
  for (let i = 5; i < candles.length - 1; i++) {
    const current = candles[i];
    const next = candles[i + 1];
    const previous5 = candles.slice(i - 5, i);
    
    const recentHigh = Math.max(...previous5.map(c => c.high));
    const recentLow = Math.min(...previous5.map(c => c.low));
    
    // Liquidity Sweep Bullish (fake breakout down seguido de reversão)
    if (current.low < recentLow && 
        next.close > current.open &&
        next.close > recentLow) {
      
      const sweepDistance = recentLow - current.low;
      const recoveryStrength = next.close - current.low;
      const ratio = recoveryStrength / sweepDistance;
      
      if (ratio > 2) { // Recuperação forte
        signals.push({
          type: 'liquidity_sweep',
          strength: ratio > 4 ? 'forte' : 'moderada',
          direction: 'alta',
          confidence: Math.min(0.9, 0.6 + (ratio - 2) * 0.1),
          description: `Liquidity Sweep bullish - Falso rompimento em ${recentLow.toFixed(4)} seguido de reversão`,
          entryZone: {
            min: recentLow,
            max: next.close,
            optimal: recentLow + ((next.close - recentLow) * 0.3)
          },
          riskReward: 4.0
        });
      }
    }
    
    // Liquidity Sweep Bearish (fake breakout up seguido de reversão)
    if (current.high > recentHigh && 
        next.close < current.open &&
        next.close < recentHigh) {
      
      const sweepDistance = current.high - recentHigh;
      const recoveryStrength = current.high - next.close;
      const ratio = recoveryStrength / sweepDistance;
      
      if (ratio > 2) { // Recuperação forte
        signals.push({
          type: 'liquidity_sweep',
          strength: ratio > 4 ? 'forte' : 'moderada',
          direction: 'baixa',
          confidence: Math.min(0.9, 0.6 + (ratio - 2) * 0.1),
          description: `Liquidity Sweep bearish - Falso rompimento em ${recentHigh.toFixed(4)} seguido de reversão`,
          entryZone: {
            min: next.close,
            max: recentHigh,
            optimal: recentHigh - ((recentHigh - next.close) * 0.3)
          },
          riskReward: 4.0
        });
      }
    }
  }
  
  return signals;
};

const detectInstitutionalMoves = (candles: CandleData[]): PriceActionSignal[] => {
  const signals: PriceActionSignal[] = [];
  
  for (let i = 3; i < candles.length; i++) {
    const current = candles[i];
    const prev3 = candles.slice(i - 3, i);
    
    const currentMetrics = analyzeCandleMetrics(current);
    const avgVolume = prev3.reduce((sum, c) => sum + (c.high - c.low), 0) / 3;
    const currentVolume = current.high - current.low;
    
    // Movimento institucional: candle grande com corpo dominante
    if (currentVolume > avgVolume * 2.5 && 
        currentMetrics.bodyPercent > 70 &&
        currentMetrics.totalRange > avgVolume * 2) {
      
      const strength = currentVolume > avgVolume * 4 ? 'forte' : 'moderada';
      const direction = currentMetrics.candleType === 'bullish' ? 'alta' : 'baixa';
      
      signals.push({
        type: 'institutional_move',
        strength,
        direction,
        confidence: 0.8,
        description: `Movimento institucional ${direction} - Candle ${(currentVolume / avgVolume).toFixed(1)}x maior que média`,
        riskReward: 3.5
      });
    }
  }
  
  return signals;
};

// Funções auxiliares
const findImportantLevels = (candles: CandleData[]): Array<{type: 'support' | 'resistance', price: number}> => {
  const levels: Array<{type: 'support' | 'resistance', price: number}> = [];
  
  for (let i = 1; i < candles.length - 1; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const next = candles[i + 1];
    
    // Swing high (resistência)
    if (current.high > prev.high && current.high > next.high) {
      levels.push({ type: 'resistance', price: current.high });
    }
    
    // Swing low (suporte)
    if (current.low < prev.low && current.low < next.low) {
      levels.push({ type: 'support', price: current.low });
    }
  }
  
  return levels;
};

// Análise de contexto de mercado em tempo real
export const analyzeMarketContext = (candles: CandleData[]): MarketContextAnalysis => {
  if (candles.length < 20) {
    return {
      phase: 'consolidação',
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
