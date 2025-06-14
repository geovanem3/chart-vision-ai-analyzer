
import { CandleData } from "../context/AnalyzerContext";

export const mockCandles = async (numCandles: number, timeframe: string): Promise<CandleData[]> => {
  const candles: CandleData[] = [];
  let basePrice = 1.2500;
  
  for (let i = 0; i < numCandles; i++) {
    const variation = (Math.random() - 0.5) * 0.01;
    const open = basePrice + variation;
    const close = open + (Math.random() - 0.5) * 0.005;
    const high = Math.max(open, close) + Math.random() * 0.002;
    const low = Math.min(open, close) - Math.random() * 0.002;
    
    candles.push({
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000 + 500,
      timestamp: Date.now() - (numCandles - i) * 60000
    });
    
    basePrice = close;
  }
  
  return candles;
};
