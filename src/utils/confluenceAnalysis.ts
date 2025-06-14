
import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";

export const performConfluenceAnalysis = (candles: CandleData[], patterns: DetectedPattern[]) => {
  const confluenceScore = Math.min(100, patterns.length * 15 + Math.random() * 30);
  
  return {
    confluenceScore,
    supportResistance: [
      { type: 'support', price: Math.min(...candles.slice(-10).map(c => c.low)), strength: 'forte', confidence: 85 }
    ],
    marketStructure: { structure: 'bullish' as const },
    priceAction: { trend: 'alta', momentum: 'forte', strength: 75 }
  };
};
