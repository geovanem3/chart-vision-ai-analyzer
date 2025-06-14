
import { CandleData, VolumeData } from "../context/AnalyzerContext";

export const analyzeVolume = (candles: CandleData[]): VolumeData => {
  if (candles.length === 0) {
    return {
      value: 0,
      trend: 'neutral',
      abnormal: false,
      significance: 'low',
      relativeToAverage: 1,
      distribution: 'neutral',
      divergence: false
    };
  }

  // ANÁLISE REAL: Calcular volume baseado no movimento de preços
  // Como não temos dados reais de volume, inferimos baseado na volatilidade e movimento
  const recentCandles = candles.slice(-20);
  
  // Calcular "volume inferido" baseado no range dos candles
  const volumes = recentCandles.map(candle => {
    const range = candle.high - candle.low;
    const body = Math.abs(candle.close - candle.open);
    // Volume inferido: quanto maior o movimento, maior o "volume"
    return range + (body * 2); // Corpo tem peso maior
  });
  
  const currentVolume = volumes[volumes.length - 1];
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const relativeToAverage = currentVolume / avgVolume;
  
  // Determinar tendência (últimos 5 vs anteriores)
  const recent5 = volumes.slice(-5);
  const previous5 = volumes.slice(-10, -5);
  const recentAvg = recent5.reduce((sum, vol) => sum + vol, 0) / recent5.length;
  const previousAvg = previous5.reduce((sum, vol) => sum + vol, 0) / previous5.length;
  
  let trend: 'increasing' | 'decreasing' | 'neutral' = 'neutral';
  if (recentAvg > previousAvg * 1.1) {
    trend = 'increasing';
  } else if (recentAvg < previousAvg * 0.9) {
    trend = 'decreasing';
  }
  
  // Volume anormal se for 50% maior que a média
  const abnormal = relativeToAverage > 1.5;
  
  // Determinar significância
  let significance: 'low' | 'medium' | 'high' = 'low';
  if (relativeToAverage > 2.0) {
    significance = 'high';
  } else if (relativeToAverage > 1.3) {
    significance = 'medium';
  }
  
  // Distribuição baseada na consistência do volume
  const volumeVariance = volumes.reduce((sum, vol) => {
    return sum + Math.pow(vol - avgVolume, 2);
  }, 0) / volumes.length;
  const volumeStdDev = Math.sqrt(volumeVariance);
  const coefficientOfVariation = volumeStdDev / avgVolume;
  
  let distribution: 'accumulation' | 'distribution' | 'neutral' = 'neutral';
  if (trend === 'increasing' && coefficientOfVariation < 0.3) {
    distribution = 'accumulation';
  } else if (trend === 'decreasing' && coefficientOfVariation > 0.5) {
    distribution = 'distribution';
  }
  
  // Detectar divergência: preço subindo com volume caindo ou vice-versa
  const priceChange = (candles[candles.length - 1].close - candles[0].close) / candles[0].close;
  const volumeChange = (recentAvg - previousAvg) / previousAvg;
  const divergence = (priceChange > 0 && volumeChange < -0.1) || (priceChange < 0 && volumeChange > 0.1);
  
  console.log(`📊 Volume Real Analysis: Atual=${currentVolume.toFixed(2)}, Média=${avgVolume.toFixed(2)}, Relativo=${relativeToAverage.toFixed(2)}`);
  
  return {
    value: Math.round(currentVolume * 100), // Normalizar para display
    trend,
    abnormal,
    significance,
    relativeToAverage: parseFloat(relativeToAverage.toFixed(2)),
    distribution,
    divergence
  };
};
