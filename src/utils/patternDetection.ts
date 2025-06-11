import { Chart } from "chart.js";
import { Pattern, PatternName } from "./types";

// Function to detect a specific pattern in the chart data
export const detectPattern = (chart: Chart, pattern: Pattern): boolean => {
    // Basic check to ensure chart and data are available
    if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length === 0) {
        console.warn("Chart data is not available.");
        return false;
    }

    const data = chart.data.datasets[0].data as number[];

    if (data.length < pattern.length) {
        return false; // Not enough data points to match the pattern
    }

    // Extract the last 'n' data points from the chart
    const dataWindow = data.slice(-pattern.length);

    // Compare the extracted data with the pattern
    for (let i = 0; i < pattern.length; i++) {
        if (dataWindow[i] !== pattern[i]) {
            return false; // Data does not match the pattern
        }
    }

    return true; // Data matches the pattern
};

// Function to generate a random pattern for testing purposes
export const generateRandomPattern = (length: number): Pattern => {
    const pattern: Pattern = [];
    for (let i = 0; i < length; i++) {
        pattern.push(Math.random() > 0.5 ? 1 : 0); // Binary pattern for simplicity
    }
    return pattern;
};

// Example patterns (can be expanded)
export const predefinedPatterns: { [key in PatternName]: Pattern } = {
    "bullish": [0, 1, 1, 0, 1],
    "bearish": [1, 0, 0, 1, 0],
    "neutral": [0, 1, 0, 1, 0]
};

export interface AnalysisOptions {
  sensitivity?: number;
  timeframe?: string;
  indicators?: string[];
}

export interface AnalysisResult {
  trend: string;
  signals: Array<{
    type: string;
    strength: number;
    description: string;
  }>;
  confidence: number;
  timestamp: number;
}

export const analyzeChart = async (imageData: string, options: AnalysisOptions = {}): Promise<AnalysisResult> => {
  // Simulate analysis delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock analysis result for live analysis
  const trends = ['Bullish', 'Bearish', 'Sideways'];
  const signalTypes = ['Buy', 'Sell', 'Hold'];
  
  const trend = trends[Math.floor(Math.random() * trends.length)];
  const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)];
  
  return {
    trend,
    signals: [{
      type: signalType,
      strength: Math.random() * 100,
      description: `${signalType} signal detected with ${trend.toLowerCase()} trend`
    }],
    confidence: Math.random() * 100,
    timestamp: Date.now()
  };
};

// Function to interpret the detected pattern
export const interpretPattern = (patternName: PatternName): string => {
    switch (patternName) {
        case "bullish":
            return "Bullish pattern detected: potential upward trend.";
        case "bearish":
            return "Bearish pattern detected: potential downward trend.";
        case "neutral":
            return "Neutral pattern detected: no clear trend.";
        default:
            return "Unknown pattern detected.";
    }
};
