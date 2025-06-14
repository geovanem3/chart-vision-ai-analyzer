
import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";

export const detectCandlestickPatterns = (candles: CandleData[]): DetectedPattern[] => {
  return [{
    type: 'doji',
    confidence: 0.75,
    description: 'Padrão Doji detectado',
    action: 'compra',
    candle: candles[candles.length - 1],
    significance: 'alta'
  }];
};
