
import { CandleData, TechnicalIndicator } from "../context/AnalyzerContext";

export const detectTechnicalIndicators = (candles: CandleData[]): TechnicalIndicator[] => {
  return [{
    type: 'rsi',
    value: '65',
    signal: 'neutro',
    strength: 'moderada',
    description: 'RSI em nível neutro'
  }];
};
