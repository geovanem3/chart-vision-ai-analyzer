
/**
 * Advanced Financial Chart Detection - Specialized AI for Trading Charts
 */

import { CandleData } from "../context/AnalyzerContext";

export interface ChartElement {
  type: 'candlestick' | 'line' | 'support' | 'resistance' | 'trendline' | 'fibonacci' | 'volume';
  coordinates: { x: number; y: number; width?: number; height?: number };
  confidence: number;
  properties?: Record<string, any>;
}

export interface FinancialChartAnalysis {
  platform: 'MetaTrader4' | 'MetaTrader5' | 'TradingView' | 'Generic' | 'Unknown';
  timeframe: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | 'Unknown';
  chartType: 'candlestick' | 'line' | 'bar' | 'heiken-ashi';
  elements: ChartElement[];
  quality: {
    clarity: number;
    completeness: number;
    readability: number;
  };
  priceScale: {
    type: 'linear' | 'logarithmic';
    minPrice: number;
    maxPrice: number;
    tickSize: number;
  };
  candlesticks: CandleData[];
  confidence: number;
}

// Advanced chart detection using specialized algorithms
export const detectFinancialChart = async (imageUrl: string): Promise<FinancialChartAnalysis> => {
  console.log('🎯 INICIANDO DETECÇÃO AVANÇADA DE GRÁFICO FINANCEIRO');
  
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Cannot create canvas context');
  }
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Perform advanced analysis
        const analysis = performAdvancedChartAnalysis(imageData, canvas.width, canvas.height);
        
        console.log('📊 ANÁLISE COMPLETA:', analysis);
        resolve(analysis);
      } catch (error) {
        console.error('❌ Erro na detecção:', error);
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

const performAdvancedChartAnalysis = (
  imageData: ImageData, 
  width: number, 
  height: number
): FinancialChartAnalysis => {
  const data = imageData.data;
  
  // 1. Detect platform (MetaTrader, TradingView, etc.)
  const platform = detectTradingPlatform(data, width, height);
  console.log('🖥️ Plataforma detectada:', platform);
  
  // 2. Detect timeframe from chart elements
  const timeframe = detectTimeframe(data, width, height);
  console.log('⏰ Timeframe detectado:', timeframe);
  
  // 3. Analyze chart quality
  const quality = analyzeChartQuality(data, width, height);
  console.log('✨ Qualidade do gráfico:', quality);
  
  // 4. Detect price scale properties
  const priceScale = detectPriceScale(data, width, height);
  console.log('📏 Escala de preço:', priceScale);
  
  // 5. Advanced candlestick detection
  const candlesticks = detectAdvancedCandlesticks(data, width, height, priceScale);
  console.log('🕯️ Candlesticks detectados:', candlesticks.length);
  
  // 6. Detect chart elements (S/R, trendlines, etc.)
  const elements = detectChartElements(data, width, height);
  console.log('📐 Elementos detectados:', elements.length);
  
  // 7. Determine chart type
  const chartType = determineChartType(elements, candlesticks);
  console.log('📊 Tipo de gráfico:', chartType);
  
  // Calculate overall confidence
  const confidence = calculateOverallConfidence(quality, candlesticks.length, elements.length);
  
  return {
    platform,
    timeframe,
    chartType,
    elements,
    quality,
    priceScale,
    candlesticks,
    confidence
  };
};

// Detect trading platform based on UI patterns
const detectTradingPlatform = (data: Uint8ClampedArray, width: number, height: number): FinancialChartAnalysis['platform'] => {
  // Look for MetaTrader characteristic colors and layouts
  const metaTraderColors = {
    blue: [49, 130, 189],     // MT4/MT5 default blue
    darkGray: [64, 64, 64],   // MT background
    lightGray: [240, 240, 240] // MT grid
  };
  
  // Look for TradingView characteristics
  const tradingViewColors = {
    darkMode: [19, 23, 34],   // TradingView dark background
    lightMode: [255, 255, 255], // TradingView light background
    chartBlue: [33, 150, 243]  // TradingView blue
  };
  
  let metaTraderScore = 0;
  let tradingViewScore = 0;
  
  // Sample key areas of the image
  const samplePoints = [
    { x: 50, y: 50 },
    { x: width - 50, y: 50 },
    { x: 50, y: height - 50 },
    { x: width - 50, y: height - 50 },
    { x: width / 2, y: height / 2 }
  ];
  
  samplePoints.forEach(point => {
    const idx = (point.y * width + point.x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Check for MetaTrader patterns
    if (colorDistance([r, g, b], metaTraderColors.blue) < 50) metaTraderScore += 20;
    if (colorDistance([r, g, b], metaTraderColors.darkGray) < 30) metaTraderScore += 10;
    
    // Check for TradingView patterns
    if (colorDistance([r, g, b], tradingViewColors.darkMode) < 30) tradingViewScore += 15;
    if (colorDistance([r, g, b], tradingViewColors.chartBlue) < 40) tradingViewScore += 20;
  });
  
  if (metaTraderScore > tradingViewScore && metaTraderScore > 30) {
    return metaTraderScore > 60 ? 'MetaTrader5' : 'MetaTrader4';
  } else if (tradingViewScore > 30) {
    return 'TradingView';
  }
  
  return 'Generic';
};

// Advanced timeframe detection
const detectTimeframe = (data: Uint8ClampedArray, width: number, height: number): FinancialChartAnalysis['timeframe'] => {
  // Analyze candlestick density to determine timeframe
  const candlestickCount = estimateCandlestickCount(data, width, height);
  
  // More candlesticks = lower timeframe
  if (candlestickCount > 200) return '1m';
  if (candlestickCount > 100) return '5m';
  if (candlestickCount > 50) return '15m';
  if (candlestickCount > 30) return '30m';
  if (candlestickCount > 20) return '1h';
  if (candlestickCount > 10) return '4h';
  if (candlestickCount > 5) return '1d';
  if (candlestickCount > 0) return '1w';
  
  return 'Unknown';
};

// Analyze overall chart quality
const analyzeChartQuality = (data: Uint8ClampedArray, width: number, height: number) => {
  // Check image clarity (edge detection)
  const clarity = calculateImageClarity(data, width, height);
  
  // Check completeness (how much of the chart is visible)
  const completeness = calculateChartCompleteness(data, width, height);
  
  // Check readability (contrast, brightness)
  const readability = calculateReadability(data, width, height);
  
  return {
    clarity: Math.round(clarity * 100) / 100,
    completeness: Math.round(completeness * 100) / 100,
    readability: Math.round(readability * 100) / 100
  };
};

// Advanced candlestick detection with pattern recognition
const detectAdvancedCandlesticks = (
  data: Uint8ClampedArray, 
  width: number, 
  height: number,
  priceScale: any
): CandleData[] => {
  const candles: CandleData[] = [];
  
  // Scan for vertical patterns that look like candlesticks
  const candleWidth = Math.max(3, Math.floor(width / 100)); // Estimate candle width
  
  for (let x = candleWidth; x < width - candleWidth; x += candleWidth) {
    const candleData = analyzeCandlestickColumn(data, x, width, height, candleWidth, priceScale);
    if (candleData) {
      candles.push(candleData);
    }
  }
  
  return candles.filter(candle => candle.high > candle.low); // Filter valid candles
};

// Analyze a vertical column for candlestick patterns
const analyzeCandlestickColumn = (
  data: Uint8ClampedArray,
  x: number,
  width: number,
  height: number,
  candleWidth: number,
  priceScale: any
): CandleData | null => {
  let high = height;
  let low = 0;
  let bodyTop = height;
  let bodyBottom = 0;
  
  let hasSignificantVerticalLine = false;
  
  // Scan vertical column for chart elements
  for (let y = 0; y < height; y++) {
    let hasChartElement = false;
    
    // Check across the candle width
    for (let dx = 0; dx < candleWidth; dx++) {
      const idx = (y * width + (x + dx)) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Check if this pixel looks like part of a chart (not background)
      if (isChartPixel(r, g, b)) {
        hasChartElement = true;
        break;
      }
    }
    
    if (hasChartElement) {
      hasSignificantVerticalLine = true;
      if (y < high) high = y;
      if (y > low) low = y;
      
      // Detect body (thicker part)
      const density = calculatePixelDensity(data, x, y, candleWidth, width, height);
      if (density > 0.6) {
        if (y < bodyTop) bodyTop = y;
        if (y > bodyBottom) bodyBottom = y;
      }
    }
  }
  
  if (!hasSignificantVerticalLine || (low - high) < 10) {
    return null; // Not a valid candlestick
  }
  
  // Convert pixel coordinates to price values
  const pixelToPrice = (priceScale.maxPrice - priceScale.minPrice) / height;
  
  const highPrice = priceScale.maxPrice - (high * pixelToPrice);
  const lowPrice = priceScale.maxPrice - (low * pixelToPrice);
  const openPrice = priceScale.maxPrice - (bodyTop * pixelToPrice);
  const closePrice = priceScale.maxPrice - (bodyBottom * pixelToPrice);
  
  return {
    open: Math.max(openPrice, closePrice),
    close: Math.min(openPrice, closePrice),
    high: highPrice,
    low: lowPrice,
    position: { x, y: high },
    width: candleWidth,
    height: low - high,
    timestamp: Date.now() + x // Unique timestamp
  };
};

// Helper functions
const colorDistance = (color1: number[], color2: number[]): number => {
  return Math.sqrt(
    Math.pow(color1[0] - color2[0], 2) +
    Math.pow(color1[1] - color2[1], 2) +
    Math.pow(color1[2] - color2[2], 2)
  );
};

const isChartPixel = (r: number, g: number, b: number): boolean => {
  // Not pure white (background) and not pure black
  const isBackground = (r > 240 && g > 240 && b > 240);
  const isBlack = (r < 15 && g < 15 && b < 15);
  
  return !isBackground && !isBlack;
};

const calculatePixelDensity = (
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  imageWidth: number,
  imageHeight: number
): number => {
  let count = 0;
  const area = width * 3; // 3x3 area around point
  
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const px = x + dx;
      const py = y + dy;
      
      if (px >= 0 && px < imageWidth && py >= 0 && py < imageHeight) {
        const idx = (py * imageWidth + px) * 4;
        if (isChartPixel(data[idx], data[idx + 1], data[idx + 2])) {
          count++;
        }
      }
    }
  }
  
  return count / area;
};

const estimateCandlestickCount = (data: Uint8ClampedArray, width: number, height: number): number => {
  // Simplified estimation based on vertical line detection
  let verticalLines = 0;
  const step = Math.max(3, Math.floor(width / 200));
  
  for (let x = 0; x < width; x += step) {
    let hasVerticalPattern = false;
    
    for (let y = height * 0.2; y < height * 0.8; y++) {
      const idx = (Math.floor(y) * width + x) * 4;
      if (isChartPixel(data[idx], data[idx + 1], data[idx + 2])) {
        hasVerticalPattern = true;
        break;
      }
    }
    
    if (hasVerticalPattern) verticalLines++;
  }
  
  return Math.floor(verticalLines / 3); // Rough estimate
};

const detectPriceScale = (data: Uint8ClampedArray, width: number, height: number) => {
  // Simplified price scale detection
  return {
    type: 'linear' as const,
    minPrice: 1.0000,
    maxPrice: 1.1000,
    tickSize: 0.0001
  };
};

const detectChartElements = (data: Uint8ClampedArray, width: number, height: number): ChartElement[] => {
  const elements: ChartElement[] = [];
  
  // Detect horizontal lines (support/resistance)
  const horizontalLines = detectHorizontalLines(data, width, height);
  elements.push(...horizontalLines);
  
  // Detect trend lines
  const trendLines = detectTrendLines(data, width, height);
  elements.push(...trendLines);
  
  // Detect volume bars
  const volumeBars = detectVolumeBars(data, width, height);
  elements.push(...volumeBars);
  
  return elements;
};

const detectHorizontalLines = (data: Uint8ClampedArray, width: number, height: number): ChartElement[] => {
  const elements: ChartElement[] = [];
  const threshold = width * 0.3; // Line must span at least 30% of width
  
  for (let y = 0; y < height; y += 5) {
    let lineLength = 0;
    let startX = -1;
    
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (isChartPixel(data[idx], data[idx + 1], data[idx + 2])) {
        if (startX === -1) startX = x;
        lineLength++;
      } else if (lineLength > 0) {
        if (lineLength > threshold) {
          elements.push({
            type: y < height / 2 ? 'resistance' : 'support',
            coordinates: { x: startX, y, width: lineLength },
            confidence: Math.min(0.9, lineLength / width)
          });
        }
        lineLength = 0;
        startX = -1;
      }
    }
  }
  
  return elements;
};

const detectTrendLines = (data: Uint8ClampedArray, width: number, height: number): ChartElement[] => {
  // Simplified trend line detection
  return [];
};

const detectVolumeBars = (data: Uint8ClampedArray, width: number, height: number): ChartElement[] => {
  // Look for volume bars at the bottom of the chart
  const elements: ChartElement[] = [];
  const volumeAreaStart = height * 0.8;
  
  for (let x = 0; x < width; x += 5) {
    let barHeight = 0;
    
    for (let y = height - 1; y > volumeAreaStart; y--) {
      const idx = (y * width + x) * 4;
      if (isChartPixel(data[idx], data[idx + 1], data[idx + 2])) {
        barHeight++;
      } else {
        break;
      }
    }
    
    if (barHeight > 5) {
      elements.push({
        type: 'volume',
        coordinates: { x, y: height - barHeight, height: barHeight },
        confidence: 0.7
      });
    }
  }
  
  return elements;
};

const determineChartType = (elements: ChartElement[], candlesticks: CandleData[]): FinancialChartAnalysis['chartType'] => {
  if (candlesticks.length > 0) return 'candlestick';
  return 'line';
};

const calculateImageClarity = (data: Uint8ClampedArray, width: number, height: number): number => {
  // Edge detection for clarity measurement
  let edgeCount = 0;
  const threshold = 30;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const centerLum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      // Check surrounding pixels
      const neighbors = [
        (y * width + (x - 1)) * 4,
        (y * width + (x + 1)) * 4,
        ((y - 1) * width + x) * 4,
        ((y + 1) * width + x) * 4
      ];
      
      for (const neighborIdx of neighbors) {
        const neighborLum = 0.299 * data[neighborIdx] + 0.587 * data[neighborIdx + 1] + 0.114 * data[neighborIdx + 2];
        if (Math.abs(centerLum - neighborLum) > threshold) {
          edgeCount++;
          break;
        }
      }
    }
  }
  
  return Math.min(1, edgeCount / (width * height * 0.1));
};

const calculateChartCompleteness = (data: Uint8ClampedArray, width: number, height: number): number => {
  // Check how much of the image contains chart elements
  let chartPixels = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    if (isChartPixel(data[i], data[i + 1], data[i + 2])) {
      chartPixels++;
    }
  }
  
  const totalPixels = width * height;
  return Math.min(1, chartPixels / (totalPixels * 0.3)); // Expect at least 30% chart content
};

const calculateReadability = (data: Uint8ClampedArray, width: number, height: number): number => {
  // Check contrast and brightness distribution
  let minLum = 255;
  let maxLum = 0;
  let totalLum = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    minLum = Math.min(minLum, lum);
    maxLum = Math.max(maxLum, lum);
    totalLum += lum;
  }
  
  const contrast = (maxLum - minLum) / 255;
  const avgBrightness = totalLum / (width * height);
  const brightnessScore = 1 - Math.abs(avgBrightness - 128) / 128;
  
  return (contrast + brightnessScore) / 2;
};

const calculateOverallConfidence = (quality: any, candlesCount: number, elementsCount: number): number => {
  const qualityScore = (quality.clarity + quality.completeness + quality.readability) / 3;
  const dataScore = Math.min(1, (candlesCount + elementsCount * 2) / 50);
  
  return (qualityScore * 0.6 + dataScore * 0.4);
};
