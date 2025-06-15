
import { CandleData, VolatilityData } from "../context/AnalyzerContext";

export const analyzeVolatility = (candles: CandleData[]): VolatilityData => {
  const recentCandles = candles.slice(-20);
  if (recentCandles.length < 10) {
    return {
      value: 0,
      trend: 'decreasing', // Default to decreasing for safety
      atr: 0,
      percentageRange: 0,
      isHigh: false,
      historicalComparison: 'low',
      impliedVolatility: 0
    };
  }

  const ranges = recentCandles.map(candle => candle.high - candle.low);
  const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  const atr = parseFloat(avgRange.toFixed(5));
  const lastClose = recentCandles[recentCandles.length - 1].close;
  
  // Avoid division by zero
  const volatilityPercentage = lastClose > 0 ? (avgRange / lastClose) * 100 : 0;

  // --- REAL VOLATILITY TREND CALCULATION ---
  const firstHalfRanges = ranges.slice(0, Math.floor(ranges.length / 2));
  const secondHalfRanges = ranges.slice(Math.floor(ranges.length / 2));
  
  const firstHalfAvg = firstHalfRanges.reduce((sum, r) => sum + r, 0) / firstHalfRanges.length;
  const secondHalfAvg = secondHalfRanges.reduce((sum, r) => sum + r, 0) / secondHalfRanges.length;
  
  const trend: 'increasing' | 'decreasing' = secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing';

  // A simple proxy for implied volatility, no longer random.
  const impliedVolatility = volatilityPercentage * 1.2;

  return {
    value: parseFloat(volatilityPercentage.toFixed(2)),
    trend: trend,
    atr: atr,
    percentageRange: parseFloat(volatilityPercentage.toFixed(2)),
    isHigh: volatilityPercentage > 0.15, // Adjusted threshold for M1 charts
    historicalComparison: 'average', // This remains a heuristic without longer-term data
    impliedVolatility: parseFloat(impliedVolatility.toFixed(2))
  };
};
