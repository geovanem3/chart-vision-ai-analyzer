
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

  // Calculate REAL volatility from price ranges
  const ranges = candles.slice(-20).map(candle => candle.high - candle.low);
  const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  const volatilityPercentage = (avgRange / candles[candles.length - 1].close) * 100;
  
  // Calculate REAL trend based on historical volatility evolution
  let trend: 'neutral' | 'increasing' | 'decreasing' = 'neutral';
  if (ranges.length >= 10) {
    const recentRanges = ranges.slice(-5);
    const olderRanges = ranges.slice(-10, -5);
    
    const recentAvg = recentRanges.reduce((sum, range) => sum + range, 0) / recentRanges.length;
    const olderAvg = olderRanges.reduce((sum, range) => sum + range, 0) / olderRanges.length;
    
    if (recentAvg > olderAvg * 1.1) {
      trend = 'increasing';
    } else if (recentAvg < olderAvg * 0.9) {
      trend = 'decreasing';
    }
  }
  
  // Calculate REAL implied volatility based on historical data
  const historicalVolatility = ranges.map(range => (range / candles[candles.length - 1].close) * 100);
  const impliedVol = historicalVolatility.reduce((sum, vol) => sum + vol, 0) / historicalVolatility.length;

  return {
    value: parseFloat(volatilityPercentage.toFixed(2)),
    trend: trend,
    atr: parseFloat((avgRange).toFixed(4)),
    percentageRange: parseFloat(volatilityPercentage.toFixed(2)),
    isHigh: volatilityPercentage > 2.0,
    historicalComparison: volatilityPercentage > impliedVol * 1.2 ? 'above_average' : 
                         volatilityPercentage < impliedVol * 0.8 ? 'below_average' : 'average',
    impliedVolatility: parseFloat(impliedVol.toFixed(2))
  };
};
