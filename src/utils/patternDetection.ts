
import { Chart } from "chart.js";
import { Pattern, PatternName, TechnicalElement, CandleData, DetectedPattern } from "./types";

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
  optimizeForScalping?: boolean;
  scalpingStrategy?: string;
  considerVolume?: boolean;
  considerVolatility?: boolean;
  marketContextEnabled?: boolean;
  marketAnalysisDepth?: string;
  enableCandleDetection?: boolean;
  isLiveAnalysis?: boolean;
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
  patterns: DetectedPattern[];
  marketContext?: {
    sentiment: 'otimista' | 'pessimista' | 'neutro';
    phase: string;
    strength: string;
  };
}

export const analyzeChart = async (imageData: string, options: AnalysisOptions = {}): Promise<AnalysisResult> => {
  // Simulate analysis delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock analysis result for live analysis
  const trends = ['Bullish', 'Bearish', 'Sideways'];
  const signalTypes = ['Buy', 'Sell', 'Hold'];
  const patternTypes = ['Martelo', 'Engolfo de Alta', 'Estrela Cadente', 'Doji', 'Triângulo'];
  const actions: ('compra' | 'venda' | 'neutro')[] = ['compra', 'venda', 'neutro'];
  
  const trend = trends[Math.floor(Math.random() * trends.length)];
  const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)];
  const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  
  const patterns: DetectedPattern[] = [{
    type: patternType,
    action: action,
    confidence: Math.random(),
    description: `${patternType} detectado com tendência ${trend.toLowerCase()}`
  }];
  
  return {
    trend,
    signals: [{
      type: signalType,
      strength: Math.random() * 100,
      description: `${signalType} signal detected with ${trend.toLowerCase()} trend`
    }],
    confidence: Math.random() * 100,
    timestamp: Date.now(),
    patterns,
    marketContext: {
      sentiment: action === 'compra' ? 'otimista' : action === 'venda' ? 'pessimista' : 'neutro',
      phase: 'análise',
      strength: 'moderada'
    }
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

// Function to detect multiple patterns in an image
export const detectPatterns = async (imageData: string): Promise<DetectedPattern[]> => {
  // Simulate pattern detection
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const patternTypes = ['Martelo', 'Engolfo de Alta', 'Estrela Cadente', 'Doji', 'Triângulo', 'Cunha'];
  const actions: ('compra' | 'venda' | 'neutro')[] = ['compra', 'venda', 'neutro'];
  
  const numPatterns = Math.floor(Math.random() * 3) + 1; // 1-3 patterns
  const patterns: DetectedPattern[] = [];
  
  for (let i = 0; i < numPatterns; i++) {
    const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    patterns.push({
      type: patternType,
      action: action,
      confidence: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
      description: `${patternType} detectado com ação recomendada: ${action}`,
      coordinates: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        width: Math.random() * 200 + 50,
        height: Math.random() * 200 + 50
      }
    });
  }
  
  return patterns;
};

// Function to generate technical markup elements
export const generateTechnicalMarkup = (patterns: DetectedPattern[], width: number, height: number): TechnicalElement[] => {
  const elements: TechnicalElement[] = [];
  
  patterns.forEach((pattern, index) => {
    if (pattern.coordinates) {
      elements.push({
        type: 'pattern',
        x: pattern.coordinates.x,
        y: pattern.coordinates.y,
        width: pattern.coordinates.width,
        height: pattern.coordinates.height,
        color: pattern.action === 'compra' ? '#22c55e' : pattern.action === 'venda' ? '#ef4444' : '#6b7280',
        confidence: pattern.confidence
      });
    }
  });
  
  // Add some trend lines
  elements.push({
    type: 'trendline',
    x: 0,
    y: height * 0.3,
    width: width,
    height: 2,
    color: '#3b82f6',
    confidence: 0.8
  });
  
  return elements;
};

// Function to detect candles in an image
export const detectCandles = async (imageData: string, width: number, height: number): Promise<CandleData[]> => {
  // Simulate candle detection
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const numCandles = Math.floor(Math.random() * 20) + 10; // 10-30 candles
  const candles: CandleData[] = [];
  
  for (let i = 0; i < numCandles; i++) {
    const open = Math.random() * 100 + 50;
    const close = open + (Math.random() - 0.5) * 20;
    const high = Math.max(open, close) + Math.random() * 10;
    const low = Math.min(open, close) - Math.random() * 10;
    
    candles.push({
      x: (i / numCandles) * width,
      y: (1 - (high - 40) / 120) * height, // Normalize to image coordinates
      open,
      close,
      high,
      low,
      type: close > open ? 'bullish' : close < open ? 'bearish' : 'doji'
    });
  }
  
  return candles;
};
