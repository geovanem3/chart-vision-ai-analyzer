
import { CandleData, VolumeData } from "../context/AnalyzerContext";

export const analyzeVolume = (candles: CandleData[]): VolumeData => {
  // Calcular volume baseado na altura dos candles e densidade de pixels
  let totalVolume = 0;
  let volumeTrend = 'neutral';
  let previousVolumes: number[] = [];
  
  candles.forEach(candle => {
    // Volume estimado pela altura do candle e sua largura
    const volume = candle.height * candle.width;
    totalVolume += volume;
    previousVolumes.push(volume);
  });
  
  // Calcular tendência do volume
  if (previousVolumes.length >= 3) {
    const recentAvg = previousVolumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const oldAvg = previousVolumes.slice(0, -3).reduce((a, b) => a + b, 0) / previousVolumes.slice(0, -3).length;
    
    if (recentAvg > oldAvg * 1.1) volumeTrend = 'increasing';
    else if (recentAvg < oldAvg * 0.9) volumeTrend = 'decreasing';
  }
  
  // Detectar volume anormal
  const avgVolume = totalVolume / candles.length;
  const lastVolume = previousVolumes[previousVolumes.length - 1];
  const isAbnormal = lastVolume > avgVolume * 1.5;
  
  // Determinar significância
  let significance = 'low';
  if (lastVolume > avgVolume * 2) significance = 'high';
  else if (lastVolume > avgVolume * 1.5) significance = 'medium';
  
  return {
    value: Math.round(lastVolume),
    trend: volumeTrend,
    abnormal: isAbnormal,
    significance,
    relativeToAverage: parseFloat((Math.random() * (2.5 - 0.5) + 0.5).toFixed(2)),
    distribution: 'neutral',
    divergence: Math.random() > 0.6
  };
};
