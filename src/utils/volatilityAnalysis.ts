
import { CandleData, VolatilityData } from "../context/AnalyzerContext";

export const analyzeVolatility = (candles: CandleData[]): VolatilityData => {
  if (candles.length === 0) {
    return {
      value: 0,
      trend: 'neutral',
      atr: 0,
      percentageRange: 0,
      isHigh: false,
      historicalComparison: 'average',
      impliedVolatility: 0
    };
  }

  console.log('⚡ ANÁLISE AVANÇADA DE VOLATILIDADE DETECTADA');

  // Calculate REAL volatility from detected price ranges
  const ranges = candles.slice(-20).map(candle => {
    const range = candle.high - candle.low;
    
    // Ajustar range baseado na altura visual do candle
    const visualHeight = candle.height;
    const adjustmentFactor = visualHeight > 20 ? 1.2 : visualHeight < 10 ? 0.8 : 1.0;
    
    return range * adjustmentFactor;
  });
  
  const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  const lastCandle = candles[candles.length - 1];
  const volatilityPercentage = (avgRange / lastCandle.close) * 100;
  
  console.log(`📏 Range médio: ${avgRange.toFixed(4)}, Volatilidade: ${volatilityPercentage.toFixed(2)}%`);
  
  // Calculate REAL trend based on historical volatility evolution
  let trend: 'neutral' | 'increasing' | 'decreasing' = 'neutral';
  
  if (ranges.length >= 10) {
    const recentRanges = ranges.slice(-5);
    const olderRanges = ranges.slice(-10, -5);
    
    const recentAvg = recentRanges.reduce((sum, range) => sum + range, 0) / recentRanges.length;
    const olderAvg = olderRanges.reduce((sum, range) => sum + range, 0) / olderRanges.length;
    
    if (recentAvg > olderAvg * 1.15) {
      trend = 'increasing';
      console.log('📈 Volatilidade CRESCENTE detectada');
    } else if (recentAvg < olderAvg * 0.85) {
      trend = 'decreasing';
      console.log('📉 Volatilidade DECRESCENTE detectada');
    } else {
      console.log('➡️ Volatilidade ESTÁVEL');
    }
  }
  
  // Calculate REAL ATR (Average True Range) com dados detectados
  let atrSum = 0;
  const atrPeriod = Math.min(14, candles.length - 1);
  
  for (let i = 1; i <= atrPeriod; i++) {
    const current = candles[candles.length - i];
    const previous = candles[candles.length - i - 1];
    
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    
    const trueRange = Math.max(tr1, tr2, tr3);
    atrSum += trueRange;
  }
  
  const atr = atrSum / atrPeriod;
  console.log(`📊 ATR calculado: ${atr.toFixed(4)}`);
  
  // Calculate REAL implied volatility based on visual patterns
  const candleHeights = candles.map(c => c.height);
  const avgHeight = candleHeights.reduce((sum, h) => sum + h, 0) / candleHeights.length;
  const heightVariation = candleHeights.map(h => Math.abs(h - avgHeight));
  const visualVolatility = heightVariation.reduce((sum, v) => sum + v, 0) / heightVariation.length;
  
  // Combinar volatilidade de preço com volatilidade visual
  const combinedVolatility = (volatilityPercentage + (visualVolatility / avgHeight * 100)) / 2;
  
  // Determinar se volatilidade é alta baseado em múltiplos fatores
  const isHighVolatility = combinedVolatility > 2.5 || atr > avgRange * 1.3;
  console.log(`🔥 Alta volatilidade: ${isHighVolatility}, Combinada: ${combinedVolatility.toFixed(2)}%`);
  
  // Calculate historical comparison mais inteligente
  const historicalVolatility = ranges.map(range => (range / lastCandle.close) * 100);
  const impliedVol = historicalVolatility.reduce((sum, vol) => sum + vol, 0) / historicalVolatility.length;
  
  let historicalComparison: 'above_average' | 'below_average' | 'average' = 'average';
  
  if (combinedVolatility > impliedVol * 1.3) {
    historicalComparison = 'above_average';
    console.log('📊 Volatilidade ACIMA da média histórica');
  } else if (combinedVolatility < impliedVol * 0.7) {
    historicalComparison = 'below_average';
    console.log('📊 Volatilidade ABAIXO da média histórica');
  } else {
    console.log('📊 Volatilidade na MÉDIA histórica');
  }

  const result = {
    value: parseFloat(combinedVolatility.toFixed(2)),
    trend: trend,
    atr: parseFloat(atr.toFixed(4)),
    percentageRange: parseFloat(volatilityPercentage.toFixed(2)),
    isHigh: isHighVolatility,
    historicalComparison,
    impliedVolatility: parseFloat(impliedVol.toFixed(2))
  };
  
  console.log('✅ ANÁLISE DE VOLATILIDADE COMPLETA:', result);
  return result;
};

// Função auxiliar para análise de volatilidade em tempo real
export const analyzeVolatilityInRealTime = (
  currentCandles: CandleData[],
  previousAnalysis?: VolatilityData
): VolatilityData & { changeDetected: boolean; changeType?: string; alert?: string } => {
  
  const currentAnalysis = analyzeVolatility(currentCandles);
  
  if (!previousAnalysis) {
    return {
      ...currentAnalysis,
      changeDetected: false
    };
  }
  
  // Detectar mudanças significativas na volatilidade
  const volatilityChangeRatio = currentAnalysis.value / previousAnalysis.value;
  const trendChanged = currentAnalysis.trend !== previousAnalysis.trend;
  const volatilitySpike = volatilityChangeRatio > 1.5 && currentAnalysis.isHigh;
  const volatilityDrop = volatilityChangeRatio < 0.6 && !currentAnalysis.isHigh;
  
  let changeDetected = false;
  let changeType = '';
  let alert = '';
  
  // Volatility spike
  if (volatilitySpike) {
    changeDetected = true;
    changeType = 'spike';
    alert = `⚡ SPIKE de volatilidade: ${currentAnalysis.value.toFixed(2)}%`;
  }
  
  // Volatility drop
  if (volatilityDrop) {
    changeDetected = true;
    changeType = 'drop';
    alert = `😴 QUEDA na volatilidade: ${currentAnalysis.value.toFixed(2)}%`;
  }
  
  // Trend change
  if (trendChanged && currentAnalysis.trend !== 'neutral') {
    changeDetected = true;
    changeType = 'trend_change';
    alert = `🔄 Mudança na tendência de volatilidade: ${currentAnalysis.trend}`;
  }
  
  // Crossing average
  if (previousAnalysis.historicalComparison !== currentAnalysis.historicalComparison) {
    changeDetected = true;
    changeType = 'historical_shift';
    alert = `📊 Volatilidade agora ${currentAnalysis.historicalComparison.replace('_', ' ')}`;
  }
  
  return {
    ...currentAnalysis,
    changeDetected,
    changeType,
    alert
  };
};
