
import { CandleData, VolumeData } from "../context/AnalyzerContext";

export const analyzeVolume = (candles: CandleData[]): VolumeData => {
  // Mock volume analysis since CandleData doesn't have volume property
  const mockVolume = Math.floor(Math.random() * 1000) + 500;
  
  return {
    value: mockVolume,
    trend: 'increasing',
    abnormal: Math.random() > 0.7,
    significance: 'medium',
    relativeToAverage: parseFloat((Math.random() * (2.5 - 0.5) + 0.5).toFixed(2)),
    distribution: 'neutral',
    divergence: Math.random() > 0.6
  };
};
