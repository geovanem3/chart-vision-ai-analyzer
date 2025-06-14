
import { CandleData, VolatilityData } from "../context/AnalyzerContext";

export const analyzeVolatility = (candles: CandleData[]): VolatilityData => {
  // Calculate simple volatility from price ranges
  const ranges = candles.slice(-20).map(candle => candle.high - candle.low);
  const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  const volatilityPercentage = (avgRange / candles[candles.length - 1].close) * 100;
  
  return {
    value: parseFloat(volatilityPercentage.toFixed(2)),
    trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
    atr: parseFloat((avgRange).toFixed(4)),
    percentageRange: parseFloat(volatilityPercentage.toFixed(2)),
    isHigh: volatilityPercentage > 2.0,
    historicalComparison: 'average',
    impliedVolatility: parseFloat((Math.random() * (30 - 15) + 15).toFixed(2))
  };
};
