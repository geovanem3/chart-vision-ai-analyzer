
import { CandleData, VolumeData } from "../context/AnalyzerContext";

export const analyzeVolume = (candles: CandleData[]): VolumeData => {
  if (candles.length === 0) {
    return {
      trend: 'estável',
      significance: 'baixa',
      abnormal: false,
      averageVolume: 0,
      recentVolume: 0,
      volumeRatio: 1
    };
  }

  const volumes = candles.map(c => c.volume);
  const averageVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const volumeRatio = recentVolume / averageVolume;

  let trend: 'crescente' | 'decrescente' | 'estável' = 'estável';
  if (volumeRatio > 1.2) trend = 'crescente';
  else if (volumeRatio < 0.8) trend = 'decrescente';

  let significance: 'alta' | 'média' | 'baixa' = 'baixa';
  if (volumeRatio > 1.5) significance = 'alta';
  else if (volumeRatio > 1.1) significance = 'média';

  const abnormal = volumeRatio > 2.0 || volumeRatio < 0.5;

  return {
    trend,
    significance,
    abnormal,
    averageVolume,
    recentVolume,
    volumeRatio
  };
};
