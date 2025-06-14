
import { CandleData, VolatilityData } from "../context/AnalyzerContext";

export const analyzeVolatility = (candles: CandleData[]): VolatilityData => {
  if (candles.length === 0) {
    return {
      currentVolatility: 0,
      averageVolatility: 0,
      volatilityRatio: 1,
      isHigh: false,
      historicalComparison: 'normal'
    };
  }

  const ranges = candles.map(c => (c.high - c.low) / c.close);
  const currentVolatility = ranges.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const averageVolatility = ranges.reduce((a, b) => a + b, 0) / ranges.length;
  const volatilityRatio = currentVolatility / averageVolatility;

  const isHigh = volatilityRatio > 1.5;
  
  let historicalComparison: 'baixa' | 'normal' | 'alta' | 'extrema' = 'normal';
  if (volatilityRatio > 2.0) historicalComparison = 'extrema';
  else if (volatilityRatio > 1.5) historicalComparison = 'alta';
  else if (volatilityRatio < 0.7) historicalComparison = 'baixa';

  return {
    currentVolatility,
    averageVolatility,
    volatilityRatio,
    isHigh,
    historicalComparison
  };
};
