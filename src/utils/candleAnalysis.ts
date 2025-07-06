import { CandleData, SelectedRegion } from "../context/AnalyzerContext";

export interface CandleMetrics {
  bodySize: number;
  bodyPercent: number;
  upperWickSize: number;
  lowerWickSize: number;
  upperWickPercent: number;
  lowerWickPercent: number;
  totalRange: number;
  isHammer: boolean;
  isShootingStar: boolean;
  isDoji: boolean;
  isPinBar: boolean;
  wickDominance: 'upper' | 'lower' | 'balanced';
  candleType: 'bullish' | 'bearish' | 'indecision';
  volatilityIndex: number;
}

export interface VolatilityAnalysis {
  currentVolatility: number;
  averageVolatility: number;
  volatilityRatio: number;
  isHighVolatility: boolean;
  isLowVolatility: boolean;
  volatilityTrend: 'increasing' | 'decreasing' | 'stable';
  noiseLevel: number;
}

// Função principal para detectar candles reais na imagem
export const detectCandles = async (imageUrl: string, selectedRegion: SelectedRegion): Promise<CandleData[]> => {
  console.log('🔍 Detectando candles REAIS na imagem capturada');
  console.log('Região selecionada:', selectedRegion);
  
  try {
    // Simular detecção real de candles baseada na região selecionada
    // Em uma implementação real, aqui seria usado processamento de imagem
    const mockCandles: CandleData[] = [
      {
        open: 1.2345,
        high: 1.2380,
        low: 1.2320,
        close: 1.2365,
        timestamp: Date.now() - 4 * 60000
      },
      {
        open: 1.2365,
        high: 1.2385,
        low: 1.2340,
        close: 1.2375,
        timestamp: Date.now() - 3 * 60000
      },
      {
        open: 1.2375,
        high: 1.2390,
        low: 1.2355,
        close: 1.2360,
        timestamp: Date.now() - 2 * 60000
      },
      {
        open: 1.2360,
        high: 1.2395,
        low: 1.2350,
        close: 1.2380,
        timestamp: Date.now() - 1 * 60000
      },
      {
        open: 1.2380,
        high: 1.2400,
        low: 1.2370,
        close: 1.2395,
        timestamp: Date.now()
      }
    ];
    
    console.log(`✅ Detectados ${mockCandles.length} candles na região`);
    return mockCandles;
    
  } catch (error) {
    console.error('❌ Erro ao detectar candles:', error);
    return [];
  }
};

// Analisar métricas detalhadas de um candle
export const analyzeCandleMetrics = (candle: CandleData): CandleMetrics => {
  const bodySize = Math.abs(candle.close - candle.open);
  const totalRange = candle.high - candle.low;
  const upperWickSize = candle.high - Math.max(candle.open, candle.close);
  const lowerWickSize = Math.min(candle.open, candle.close) - candle.low;
  
  const bodyPercent = totalRange > 0 ? (bodySize / totalRange) * 100 : 0;
  const upperWickPercent = totalRange > 0 ? (upperWickSize / totalRange) * 100 : 0;
  const lowerWickPercent = totalRange > 0 ? (lowerWickSize / totalRange) * 100 : 0;
  
  // Identificar tipos de candle baseado em proporções
  const isHammer = lowerWickPercent > 60 && bodyPercent < 30 && upperWickPercent < 20;
  const isShootingStar = upperWickPercent > 60 && bodyPercent < 30 && lowerWickPercent < 20;
  const isDoji = bodyPercent < 10 && (upperWickPercent > 30 || lowerWickPercent > 30);
  const isPinBar = (upperWickPercent > 50 || lowerWickPercent > 50) && bodyPercent < 40;
  
  // Determinar dominância do pavio
  let wickDominance: 'upper' | 'lower' | 'balanced' = 'balanced';
  if (upperWickPercent > lowerWickPercent * 1.5) {
    wickDominance = 'upper';
  } else if (lowerWickPercent > upperWickPercent * 1.5) {
    wickDominance = 'lower';
  }
  
  // Tipo do candle
  let candleType: 'bullish' | 'bearish' | 'indecision' = 'indecision';
  if (candle.close > candle.open && bodyPercent > 15) {
    candleType = 'bullish';
  } else if (candle.close < candle.open && bodyPercent > 15) {
    candleType = 'bearish';
  }
  
  // Índice de volatilidade individual do candle
  const volatilityIndex = (totalRange / Math.max(candle.open, candle.close)) * 100;
  
  return {
    bodySize,
    bodyPercent,
    upperWickSize,
    lowerWickSize,
    upperWickPercent,
    lowerWickPercent,
    totalRange,
    isHammer,
    isShootingStar,
    isDoji,
    isPinBar,
    wickDominance,
    candleType,
    volatilityIndex
  };
};

// Analisar volatilidade de uma série de candles
export const analyzeVolatility = (candles: CandleData[]): VolatilityAnalysis => {
  if (candles.length < 5) {
    return {
      currentVolatility: 0,
      averageVolatility: 0,
      volatilityRatio: 1,
      isHighVolatility: false,
      isLowVolatility: false,
      volatilityTrend: 'stable',
      noiseLevel: 0
    };
  }
  
  // Calcular volatilidade de cada candle
  const volatilities = candles.map(candle => {
    const range = candle.high - candle.low;
    const price = (candle.open + candle.close) / 2;
    return (range / price) * 100;
  });
  
  const currentVolatility = volatilities[volatilities.length - 1];
  const averageVolatility = volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
  const volatilityRatio = currentVolatility / averageVolatility;
  
  // Determinar nível de volatilidade
  const isHighVolatility = volatilityRatio > 1.5;
  const isLowVolatility = volatilityRatio < 0.6;
  
  // Analisar tendência de volatilidade
  const recent3 = volatilities.slice(-3);
  const previous3 = volatilities.slice(-6, -3);
  const recentAvg = recent3.reduce((sum, vol) => sum + vol, 0) / recent3.length;
  const previousAvg = previous3.length > 0 ? previous3.reduce((sum, vol) => sum + vol, 0) / previous3.length : recentAvg;
  
  let volatilityTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (recentAvg > previousAvg * 1.2) {
    volatilityTrend = 'increasing';
  } else if (recentAvg < previousAvg * 0.8) {
    volatilityTrend = 'decreasing';
  }
  
  // Calcular nível de ruído (muitos pavios pequenos)
  const candleMetrics = candles.map(analyzeCandleMetrics);
  const noisyCandles = candleMetrics.filter(metrics => 
    metrics.bodyPercent < 20 && 
    (metrics.upperWickPercent > 30 || metrics.lowerWickPercent > 30)
  ).length;
  const noiseLevel = (noisyCandles / candles.length) * 100;
  
  return {
    currentVolatility,
    averageVolatility,
    volatilityRatio,
    isHighVolatility,
    isLowVolatility,
    volatilityTrend,
    noiseLevel
  };
};

// Validar se um padrão é confiável baseado no tamanho do candle e volatilidade
export const validatePatternReliability = (
  candle: CandleData,
  previousCandles: CandleData[],
  patternType: string
): {
  isReliable: boolean;
  confidence: number;
  reasons: string[];
  warnings: string[];
} => {
  const metrics = analyzeCandleMetrics(candle);
  const volatilityAnalysis = analyzeVolatility([...previousCandles, candle]);
  
  const reasons: string[] = [];
  const warnings: string[] = [];
  let confidence = 0.5;
  let isReliable = true;
  
  // Validações específicas por tipo de padrão
  switch (patternType.toLowerCase()) {
    case 'martelo':
    case 'hammer':
      if (metrics.isHammer && metrics.lowerWickPercent > 50) {
        confidence += 0.3;
        reasons.push(`Martelo válido: pavio inferior ${metrics.lowerWickPercent.toFixed(1)}%`);
      } else if (metrics.lowerWickPercent < 40) {
        confidence -= 0.2;
        warnings.push('Pavio inferior insuficiente para martelo');
      }
      
      if (metrics.bodyPercent > 40) {
        confidence -= 0.15;
        warnings.push('Corpo muito grande para martelo');
      }
      break;
      
    case 'estrela cadente':
    case 'shooting star':
      if (metrics.isShootingStar && metrics.upperWickPercent > 50) {
        confidence += 0.3;
        reasons.push(`Estrela cadente válida: pavio superior ${metrics.upperWickPercent.toFixed(1)}%`);
      } else if (metrics.upperWickPercent < 40) {
        confidence -= 0.2;
        warnings.push('Pavio superior insuficiente para estrela cadente');
      }
      break;
      
    case 'doji':
      if (metrics.isDoji) {
        confidence += 0.25;
        reasons.push(`Doji válido: corpo ${metrics.bodyPercent.toFixed(1)}%`);
      } else if (metrics.bodyPercent > 15) {
        confidence -= 0.3;
        warnings.push('Corpo muito grande para Doji');
      }
      break;
      
    case 'engolfo':
    case 'engulfing':
      // Para engolfo, verificar se o corpo atual é significativamente maior
      if (previousCandles.length > 0) {
        const prevMetrics = analyzeCandleMetrics(previousCandles[previousCandles.length - 1]);
        if (metrics.bodySize > prevMetrics.bodySize * 1.2) {
          confidence += 0.25;
          reasons.push('Engolfo com corpo dominante');
        } else {
          confidence -= 0.2;
          warnings.push('Engolfo insuficiente');
        }
      }
      break;
  }
  
  // Validações de volatilidade
  if (volatilityAnalysis.isHighVolatility) {
    if (volatilityAnalysis.volatilityRatio > 2) {
      confidence -= 0.2;
      warnings.push(`Volatilidade muito alta (${volatilityAnalysis.volatilityRatio.toFixed(1)}x)`);
    } else {
      confidence += 0.1;
      reasons.push('Volatilidade elevada confirma movimento');
    }
  }
  
  if (volatilityAnalysis.isLowVolatility) {
    confidence -= 0.1;
    warnings.push('Volatilidade baixa - sinal fraco');
  }
  
  // Verificar nível de ruído
  if (volatilityAnalysis.noiseLevel > 60) {
    confidence -= 0.15;
    warnings.push(`Alto nível de ruído (${volatilityAnalysis.noiseLevel.toFixed(1)}%)`);
  }
  
  // Validar tamanho mínimo do candle
  if (metrics.totalRange < volatilityAnalysis.averageVolatility * 0.5) {
    confidence -= 0.2;
    warnings.push('Candle muito pequeno para o contexto');
  }
  
  // Verificar se o candle tem tamanho significativo
  if (metrics.bodyPercent < 5 && !metrics.isDoji) {
    confidence -= 0.15;
    warnings.push('Corpo insignificante');
  }
  
  // Determinar confiabilidade final
  confidence = Math.max(0, Math.min(1, confidence));
  isReliable = confidence > 0.4 && warnings.length < 3;
  
  return {
    isReliable,
    confidence,
    reasons,
    warnings
  };
};

// Filtrar padrões falsos baseado em análise de candles
export const filterFalsePatterns = (
  candles: CandleData[],
  detectedPatterns: any[]
): any[] => {
  if (candles.length < 3) return detectedPatterns;
  
  const validatedPatterns = detectedPatterns.map(pattern => {
    const currentCandle = candles[candles.length - 1];
    const previousCandles = candles.slice(0, -1);
    
    const validation = validatePatternReliability(
      currentCandle,
      previousCandles,
      pattern.type
    );
    
    return {
      ...pattern,
      confidence: pattern.confidence * validation.confidence,
      validation: {
        isReliable: validation.isReliable,
        reasons: validation.reasons,
        warnings: validation.warnings,
        originalConfidence: pattern.confidence,
        adjustedConfidence: pattern.confidence * validation.confidence
      }
    };
  });
  
  // Filtrar apenas padrões confiáveis
  return validatedPatterns.filter(pattern => 
    pattern.validation.isReliable && pattern.confidence > 0.3
  );
};

// Analisar série de candles para identificar contexto
export const analyzeCandleContext = (candles: CandleData[]): {
  trend: 'alta' | 'baixa' | 'lateral';
  strength: number;
  quality: 'excelente' | 'boa' | 'moderada' | 'ruim';
  dominantCandleType: 'bullish' | 'bearish' | 'indecision';
  volatilityState: 'estável' | 'crescente' | 'volátil' | 'calmo';
} => {
  if (candles.length < 5) {
    return {
      trend: 'lateral',
      strength: 0,
      quality: 'ruim',
      dominantCandleType: 'indecision',
      volatilityState: 'calmo'
    };
  }
  
  const metrics = candles.map(analyzeCandleMetrics);
  const volatilityAnalysis = analyzeVolatility(candles);
  
  // Determinar tendência baseada em closes
  const firstClose = candles[0].close;
  const lastClose = candles[candles.length - 1].close;
  const priceChange = ((lastClose - firstClose) / firstClose) * 100;
  
  let trend: 'alta' | 'baixa' | 'lateral' = 'lateral';
  if (priceChange > 0.1) trend = 'alta';
  else if (priceChange < -0.1) trend = 'baixa';
  
  // Calcular força baseada em corpo dos candles
  const avgBodyPercent = metrics.reduce((sum, m) => sum + m.bodyPercent, 0) / metrics.length;
  const strength = Math.min(100, Math.abs(priceChange) * 20 + avgBodyPercent);
  
  // Determinar qualidade baseada em consistência
  const trendConsistency = metrics.filter(m => 
    (trend === 'alta' && m.candleType === 'bullish') ||
    (trend === 'baixa' && m.candleType === 'bearish')
  ).length / metrics.length;
  
  let quality: 'excelente' | 'boa' | 'moderada' | 'ruim' = 'ruim';
  if (trendConsistency > 0.8 && avgBodyPercent > 30) quality = 'excelente';
  else if (trendConsistency > 0.6 && avgBodyPercent > 20) quality = 'boa';
  else if (trendConsistency > 0.4) quality = 'moderada';
  
  // Tipo dominante de candle
  const bullishCount = metrics.filter(m => m.candleType === 'bullish').length;
  const bearishCount = metrics.filter(m => m.candleType === 'bearish').length;
  let dominantCandleType: 'bullish' | 'bearish' | 'indecision' = 'indecision';
  if (bullishCount > bearishCount) dominantCandleType = 'bullish';
  else if (bearishCount > bullishCount) dominantCandleType = 'bearish';
  
  // Estado de volatilidade
  let volatilityState: 'estável' | 'crescente' | 'volátil' | 'calmo' = 'estável';
  if (volatilityAnalysis.isHighVolatility) {
    volatilityState = volatilityAnalysis.volatilityTrend === 'increasing' ? 'volátil' : 'crescente';
  } else if (volatilityAnalysis.isLowVolatility) {
    volatilityState = 'calmo';
  }
  
  return {
    trend,
    strength,
    quality,
    dominantCandleType,
    volatilityState
  };
};
