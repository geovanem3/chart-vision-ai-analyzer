
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
    
    const timestamp = Date.now() - (numCandles - i) * 60000;
    
    candles.push({
      time: new Date(timestamp).toISOString(),
      open,
      high,
      low,
      close,
      timestamp
    });
    
    basePrice = close;
  }
  
  return candles;
};
