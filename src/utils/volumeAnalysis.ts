
import { CandleData, VolumeData } from "../context/AnalyzerContext";

export const analyzeVolume = (candles: CandleData[]): VolumeData => {
  if (candles.length === 0) {
    return {
      value: 0,
      trend: 'neutral',
      abnormal: false,
      significance: 'low',
      relativeToAverage: 1.0,
      distribution: 'neutral',
      divergence: false
    };
  }

  // Calcular volume REAL baseado na altura e largura dos candles detectados
  let totalVolume = 0;
  let volumeTrend = 'neutral';
  let previousVolumes: number[] = [];
  
  candles.forEach(candle => {
    // Volume REAL estimado pela área do candle (altura * largura)
    const volume = candle.height * candle.width;
    totalVolume += volume;
    previousVolumes.push(volume);
  });
  
  // Calcular tendência do volume baseada nos dados REAIS
  if (previousVolumes.length >= 3) {
    const recentAvg = previousVolumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const earlierCandles = previousVolumes.slice(0, -3);
    
    if (earlierCandles.length > 0) {
      const oldAvg = earlierCandles.reduce((a, b) => a + b, 0) / earlierCandles.length;
      
      if (recentAvg > oldAvg * 1.15) volumeTrend = 'increasing';
      else if (recentAvg < oldAvg * 0.85) volumeTrend = 'decreasing';
    }
  }
  
  // Detectar volume anormal baseado nos dados REAIS
  const avgVolume = totalVolume / candles.length;
  const lastVolume = previousVolumes[previousVolumes.length - 1] || 0;
  const isAbnormal = lastVolume > avgVolume * 1.5;
  
  // Determinar significância baseada nos dados REAIS
  let significance: 'low' | 'medium' | 'high' = 'low';
  if (lastVolume > avgVolume * 2.5) significance = 'high';
  else if (lastVolume > avgVolume * 1.8) significance = 'medium';
  
  // Calcular proporção REAL em relação à média
  const relativeToAverage = avgVolume > 0 ? lastVolume / avgVolume : 1.0;
  
  // Detectar divergência baseada na variação REAL dos volumes
  const volumeVariation = previousVolumes.length > 1 ? 
    Math.abs(lastVolume - previousVolumes[previousVolumes.length - 2]) / avgVolume : 0;
  const divergence = volumeVariation > 0.3;
  
  return {
    value: Math.round(lastVolume),
    trend: volumeTrend,
    abnormal: isAbnormal,
    significance,
    relativeToAverage: parseFloat(relativeToAverage.toFixed(2)),
    distribution: isAbnormal ? 'concentrated' : 'neutral',
    divergence
  };
};
