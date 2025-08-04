import { CandleData } from "../context/AnalyzerContext";

export interface PatternResult {
  type: string;
  confidence: number;
  action: 'compra' | 'venda' | 'neutro';
  description: string;
}

export interface TechnicalLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number; // 0-100
  bounces: number;
  age: number; // em períodos
  valid: boolean;
}

export interface TrendLine {
  type: 'ascending' | 'descending';
  angle: number;
  startPrice: number;
  endPrice: number;
  touches: number;
  strength: number; // 0-100
  valid: boolean;
  broken: boolean;
}

export interface ChartPattern {
  type: 'triangle' | 'flag' | 'pennant' | 'rectangle' | 'wedge' | 'channel';
  completion: number; // 0-100
  target: number;
  probability: number; // 0-100
  direction: 'bullish' | 'bearish';
  breakoutLevel: number;
  valid: boolean;
}

export interface SignalVerification {
  confidence: number; // 0-100
  quality: 'excellent' | 'strong' | 'good' | 'weak' | 'invalid';
  supportingFactors: string[];
  warnings: string[];
  confluenceScore: number; // 0-100
  probability: number; // 0-100
  riskReward: number;
  invalidationLevel: number;
  targetLevels: number[];
}

export interface AnalyticalContext {
  supportResistanceLevels: TechnicalLevel[];
  trendLines: TrendLine[];
  chartPatterns: ChartPattern[];
  pricePosition: {
    nearSupport: boolean;
    nearResistance: boolean;
    inTrend: boolean;
    breakoutCandidate: boolean;
  };
  marketStructure: {
    higherHighs: boolean;
    higherLows: boolean;
    lowerHighs: boolean;
    lowerLows: boolean;
    consolidation: boolean;
  };
  volume: {
    confirmation: boolean;
    divergence: boolean;
    climax: boolean;
  };
}

// Analisar níveis de suporte e resistência
export const analyzeSupportResistance = (candles: CandleData[]): TechnicalLevel[] => {
  if (candles.length < 20) return [];
  
  const levels: TechnicalLevel[] = [];
  const prices = candles.map(c => [c.high, c.low, c.close]).flat();
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  
  // Criar grid de níveis para análise
  const levelStep = priceRange / 50;
  
  for (let price = minPrice; price <= maxPrice; price += levelStep) {
    const touches = candles.filter(c => 
      Math.abs(c.high - price) <= levelStep * 0.5 || 
      Math.abs(c.low - price) <= levelStep * 0.5
    ).length;
    
    if (touches >= 2) {
      // Determinar se é suporte ou resistência
      const recentCandles = candles.slice(-10);
      const avgPrice = recentCandles.reduce((sum, c) => sum + c.close, 0) / recentCandles.length;
      const type = price < avgPrice ? 'support' : 'resistance';
      
      // Calcular força baseada em toques e idade
      const strength = Math.min(100, touches * 20 + (candles.length - candles.findIndex(c => 
        Math.abs(c.high - price) <= levelStep * 0.5 || Math.abs(c.low - price) <= levelStep * 0.5
      )) * 2);
      
      levels.push({
        price,
        type,
        strength,
        bounces: touches,
        age: candles.length - candles.findIndex(c => 
          Math.abs(c.high - price) <= levelStep * 0.5 || Math.abs(c.low - price) <= levelStep * 0.5
        ),
        valid: strength > 40
      });
    }
  }
  
  // Filtrar e ordenar por força
  return levels
    .filter(l => l.valid)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8); // Top 8 níveis
};

// Analisar linhas de tendência
export const analyzeTrendLines = (candles: CandleData[]): TrendLine[] => {
  if (candles.length < 10) return [];
  
  const trendLines: TrendLine[] = [];
  
  // Analisar tendência ascendente (conectando mínimos)
  const lows = candles.map((c, i) => ({ price: c.low, index: i }))
    .filter((point, i, arr) => {
      // Encontrar mínimos locais
      const prev = arr[i - 1];
      const next = arr[i + 1];
      return (!prev || point.price <= prev.price) && (!next || point.price <= next.price);
    });
  
  if (lows.length >= 2) {
    for (let i = 0; i < lows.length - 1; i++) {
      const start = lows[i];
      const end = lows[i + 1];
      
      if (end.price > start.price) { // Linha ascendente
        const angle = Math.atan2(end.price - start.price, end.index - start.index) * (180 / Math.PI);
        
        // Contar toques na linha
        let touches = 2; // Start e end
        for (let j = start.index + 1; j < end.index; j++) {
          const expectedPrice = start.price + ((end.price - start.price) * (j - start.index) / (end.index - start.index));
          if (Math.abs(candles[j].low - expectedPrice) < (end.price - start.price) * 0.02) {
            touches++;
          }
        }
        
        const strength = Math.min(100, touches * 25 + angle * 2);
        
        trendLines.push({
          type: 'ascending',
          angle,
          startPrice: start.price,
          endPrice: end.price,
          touches,
          strength,
          valid: strength > 50,
          broken: candles[candles.length - 1].close < end.price * 0.98
        });
      }
    }
  }
  
  // Analisar tendência descendente (conectando máximos)
  const highs = candles.map((c, i) => ({ price: c.high, index: i }))
    .filter((point, i, arr) => {
      const prev = arr[i - 1];
      const next = arr[i + 1];
      return (!prev || point.price >= prev.price) && (!next || point.price >= next.price);
    });
  
  if (highs.length >= 2) {
    for (let i = 0; i < highs.length - 1; i++) {
      const start = highs[i];
      const end = highs[i + 1];
      
      if (end.price < start.price) { // Linha descendente
        const angle = Math.abs(Math.atan2(start.price - end.price, end.index - start.index) * (180 / Math.PI));
        
        let touches = 2;
        for (let j = start.index + 1; j < end.index; j++) {
          const expectedPrice = start.price - ((start.price - end.price) * (j - start.index) / (end.index - start.index));
          if (Math.abs(candles[j].high - expectedPrice) < (start.price - end.price) * 0.02) {
            touches++;
          }
        }
        
        const strength = Math.min(100, touches * 25 + angle * 2);
        
        trendLines.push({
          type: 'descending',
          angle,
          startPrice: start.price,
          endPrice: end.price,
          touches,
          strength,
          valid: strength > 50,
          broken: candles[candles.length - 1].close > end.price * 1.02
        });
      }
    }
  }
  
  return trendLines.filter(tl => tl.valid).sort((a, b) => b.strength - a.strength);
};

// Detectar padrões gráficos
export const detectChartPatterns = (candles: CandleData[], supportResistance: TechnicalLevel[]): ChartPattern[] => {
  if (candles.length < 20) return [];
  
  const patterns: ChartPattern[] = [];
  const recentCandles = candles.slice(-20);
  
  // Detectar triângulos
  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);
  
  const highTrend = highs.slice(-5).every((h, i, arr) => i === 0 || h <= arr[i-1]);
  const lowTrend = lows.slice(-5).every((l, i, arr) => i === 0 || l >= arr[i-1]);
  
  if (highTrend && lowTrend) {
    const convergence = (Math.max(...highs) - Math.min(...lows)) / Math.max(...highs);
    
    patterns.push({
      type: 'triangle',
      completion: Math.min(100, convergence * 100),
      target: Math.max(...highs) + (Math.max(...highs) - Math.min(...lows)) * 0.618,
      probability: 75,
      direction: recentCandles[recentCandles.length - 1].close > (Math.max(...highs) + Math.min(...lows)) / 2 ? 'bullish' : 'bearish',
      breakoutLevel: Math.max(...highs),
      valid: convergence > 0.3
    });
  }
  
  // Detectar retângulos/ranges
  const priceRange = Math.max(...highs) - Math.min(...lows);
  const avgPrice = recentCandles.reduce((sum, c) => sum + c.close, 0) / recentCandles.length;
  const rangeStability = recentCandles.filter(c => 
    Math.abs(c.close - avgPrice) < priceRange * 0.3
  ).length / recentCandles.length;
  
  if (rangeStability > 0.7) {
    patterns.push({
      type: 'rectangle',
      completion: rangeStability * 100,
      target: avgPrice + priceRange * 0.8,
      probability: 65,
      direction: 'bullish',
      breakoutLevel: Math.max(...highs),
      valid: true
    });
  }
  
  return patterns.filter(p => p.valid);
};

// Verificar sinal com base em todos os fatores analíticos
export const verifySignal = (
  signal: 'compra' | 'venda' | 'neutro',
  patterns: PatternResult[],
  analyticalContext: AnalyticalContext,
  currentPrice: number
): SignalVerification => {
  if (signal === 'neutro') {
    return {
      confidence: 0,
      quality: 'invalid',
      supportingFactors: [],
      warnings: ['Nenhum sinal detectado'],
      confluenceScore: 0,
      probability: 0,
      riskReward: 0,
      invalidationLevel: currentPrice,
      targetLevels: []
    };
  }
  
  const supportingFactors: string[] = [];
  const warnings: string[] = [];
  let confluenceScore = 0;
  let confidence = 0;
  
  // 1. Verificar alinhamento com suporte/resistência
  const nearSupport = analyticalContext.supportResistanceLevels
    .filter(l => l.type === 'support')
    .some(l => Math.abs(currentPrice - l.price) / currentPrice < 0.01);
  
  const nearResistance = analyticalContext.supportResistanceLevels
    .filter(l => l.type === 'resistance')
    .some(l => Math.abs(currentPrice - l.price) / currentPrice < 0.01);
  
  if (signal === 'compra' && nearSupport) {
    supportingFactors.push('Próximo a suporte forte');
    confluenceScore += 25;
  } else if (signal === 'venda' && nearResistance) {
    supportingFactors.push('Próximo a resistência forte');
    confluenceScore += 25;
  } else if (signal === 'compra' && nearResistance) {
    warnings.push('Sinal de compra próximo à resistência');
    confluenceScore -= 15;
  } else if (signal === 'venda' && nearSupport) {
    warnings.push('Sinal de venda próximo ao suporte');
    confluenceScore -= 15;
  }
  
  // 2. Verificar alinhamento com linhas de tendência
  const validTrendLines = analyticalContext.trendLines.filter(tl => tl.valid && !tl.broken);
  const ascendingTrends = validTrendLines.filter(tl => tl.type === 'ascending');
  const descendingTrends = validTrendLines.filter(tl => tl.type === 'descending');
  
  if (signal === 'compra' && ascendingTrends.length > 0) {
    supportingFactors.push(`${ascendingTrends.length} linha(s) de tendência ascendente`);
    confluenceScore += ascendingTrends.length * 15;
  } else if (signal === 'venda' && descendingTrends.length > 0) {
    supportingFactors.push(`${descendingTrends.length} linha(s) de tendência descendente`);
    confluenceScore += descendingTrends.length * 15;
  }
  
  // 3. Verificar padrões gráficos
  const validPatterns = analyticalContext.chartPatterns.filter(p => p.valid);
  const alignedPatterns = validPatterns.filter(p => 
    (signal === 'compra' && p.direction === 'bullish') ||
    (signal === 'venda' && p.direction === 'bearish')
  );
  
  if (alignedPatterns.length > 0) {
    supportingFactors.push(`${alignedPatterns.length} padrão(ões) gráfico(s) alinhado(s)`);
    confluenceScore += alignedPatterns.length * 20;
  }
  
  // 4. Verificar estrutura de mercado
  if (signal === 'compra' && (analyticalContext.marketStructure.higherHighs && analyticalContext.marketStructure.higherLows)) {
    supportingFactors.push('Estrutura de mercado bullish');
    confluenceScore += 20;
  } else if (signal === 'venda' && (analyticalContext.marketStructure.lowerHighs && analyticalContext.marketStructure.lowerLows)) {
    supportingFactors.push('Estrutura de mercado bearish');
    confluenceScore += 20;
  }
  
  // 5. Verificar confirmação de volume
  if (analyticalContext.volume.confirmation) {
    supportingFactors.push('Volume confirma movimento');
    confluenceScore += 15;
  } else if (analyticalContext.volume.divergence) {
    warnings.push('Divergência de volume detectada');
    confluenceScore -= 10;
  }
  
  // 6. Avaliar qualidade dos padrões detectados
  const patternConfidence = patterns.length > 0 ? 
    patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0;
  
  confidence = Math.min(100, patternConfidence * 0.4 + confluenceScore * 0.6);
  
  // Determinar qualidade
  let quality: 'excellent' | 'strong' | 'good' | 'weak' | 'invalid' = 'invalid';
  if (confidence >= 85 && confluenceScore >= 70) quality = 'excellent';
  else if (confidence >= 75 && confluenceScore >= 60) quality = 'strong';
  else if (confidence >= 65 && confluenceScore >= 50) quality = 'good';
  else if (confidence >= 50 && confluenceScore >= 30) quality = 'weak';
  
  // Calcular níveis de invalidação e alvos
  const strongestSupport = analyticalContext.supportResistanceLevels
    .filter(l => l.type === 'support')
    .sort((a, b) => b.strength - a.strength)[0];
  
  const strongestResistance = analyticalContext.supportResistanceLevels
    .filter(l => l.type === 'resistance')
    .sort((a, b) => b.strength - a.strength)[0];
  
  let invalidationLevel = currentPrice;
  let targetLevels: number[] = [];
  let riskReward = 1;
  
  if (signal === 'compra' && strongestSupport) {
    invalidationLevel = strongestSupport.price * 0.995;
    if (strongestResistance) {
      targetLevels = [strongestResistance.price];
      riskReward = (strongestResistance.price - currentPrice) / (currentPrice - invalidationLevel);
    }
  } else if (signal === 'venda' && strongestResistance) {
    invalidationLevel = strongestResistance.price * 1.005;
    if (strongestSupport) {
      targetLevels = [strongestSupport.price];
      riskReward = (currentPrice - strongestSupport.price) / (invalidationLevel - currentPrice);
    }
  }
  
  // Calcular probabilidade baseada em confluência e padrões históricos
  const probability = Math.min(95, Math.max(5, confluenceScore * 0.8 + validPatterns.length * 5));
  
  return {
    confidence,
    quality,
    supportingFactors,
    warnings,
    confluenceScore: Math.max(0, confluenceScore),
    probability,
    riskReward: Math.max(0.5, riskReward),
    invalidationLevel,
    targetLevels
  };
};

// Função principal para análise completa
export const performAnalyticalVerification = (
  signal: 'compra' | 'venda' | 'neutro',
  patterns: PatternResult[],
  candles: CandleData[]
): { verification: SignalVerification; context: AnalyticalContext } => {
  if (candles.length < 10) {
    return {
      verification: {
        confidence: 0,
        quality: 'invalid',
        supportingFactors: [],
        warnings: ['Dados insuficientes para análise'],
        confluenceScore: 0,
        probability: 0,
        riskReward: 0,
        invalidationLevel: candles[candles.length - 1]?.close || 0,
        targetLevels: []
      },
      context: {
        supportResistanceLevels: [],
        trendLines: [],
        chartPatterns: [],
        pricePosition: {
          nearSupport: false,
          nearResistance: false,
          inTrend: false,
          breakoutCandidate: false
        },
        marketStructure: {
          higherHighs: false,
          higherLows: false,
          lowerHighs: false,
          lowerLows: false,
          consolidation: false
        },
        volume: {
          confirmation: false,
          divergence: false,
          climax: false
        }
      }
    };
  }
  
  const currentPrice = candles[candles.length - 1].close;
  
  // Análise técnica completa
  const supportResistanceLevels = analyzeSupportResistance(candles);
  const trendLines = analyzeTrendLines(candles);
  const chartPatterns = detectChartPatterns(candles, supportResistanceLevels);
  
  // Analisar posição do preço
  const nearSupport = supportResistanceLevels
    .filter(l => l.type === 'support')
    .some(l => Math.abs(currentPrice - l.price) / currentPrice < 0.015);
  
  const nearResistance = supportResistanceLevels
    .filter(l => l.type === 'resistance')
    .some(l => Math.abs(currentPrice - l.price) / currentPrice < 0.015);
  
  const inTrend = trendLines.some(tl => tl.valid && !tl.broken);
  const breakoutCandidate = chartPatterns.some(p => p.completion > 80);
  
  // Analisar estrutura de mercado
  const recentCandles = candles.slice(-10);
  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);
  
  const higherHighs = highs.slice(-3).every((h, i, arr) => i === 0 || h >= arr[i-1]);
  const higherLows = lows.slice(-3).every((l, i, arr) => i === 0 || l >= arr[i-1]);
  const lowerHighs = highs.slice(-3).every((h, i, arr) => i === 0 || h <= arr[i-1]);
  const lowerLows = lows.slice(-3).every((l, i, arr) => i === 0 || l <= arr[i-1]);
  const consolidation = !higherHighs && !lowerHighs && !higherLows && !lowerLows;
  
  // Analisar volume (simulado baseado em volatilidade)
  const avgVolatility = candles.slice(-20).reduce((sum, c) => sum + Math.abs(c.high - c.low), 0) / 20;
  const currentVolatility = Math.abs(candles[candles.length - 1].high - candles[candles.length - 1].low);
  const volumeProxy = currentVolatility / avgVolatility; // Usar volatilidade como proxy para volume
  const confirmation = volumeProxy > 1.2;
  const divergence = volumeProxy < 0.8;
  const climax = volumeProxy > 2;
  
  const analyticalContext: AnalyticalContext = {
    supportResistanceLevels,
    trendLines,
    chartPatterns,
    pricePosition: {
      nearSupport,
      nearResistance,
      inTrend,
      breakoutCandidate
    },
    marketStructure: {
      higherHighs,
      higherLows,
      lowerHighs,
      lowerLows,
      consolidation
    },
    volume: {
      confirmation,
      divergence,
      climax
    }
  };
  
  const verification = verifySignal(signal, patterns, analyticalContext, currentPrice);
  
  return { verification, context: analyticalContext };
};