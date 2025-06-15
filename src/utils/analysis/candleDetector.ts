
import { toast } from "@/hooks/use-toast";
import { ChartArea, DetectedCandle } from "./types";

export const detectIndividualCandles = (
  imageData: ImageData, 
  width: number, 
  height: number, 
  chartArea: ChartArea
): DetectedCandle[] => {
  try {
    console.log('🕯️ Iniciando detecção avançada de candles...');
    
    const data = imageData.data;
    const detectedCandles: DetectedCandle[] = [];
    
    // Parâmetros de detecção mais precisos
    const minCandleWidth = 2;
    const maxCandleWidth = 30;
    const minCandleHeight = 6;
    
    // Varrer área do gráfico com mais precisão
    for (let x = chartArea.x; x < chartArea.x + chartArea.width - minCandleWidth; x += 1) {
      const candleStructure = analyzeCandleColumn(data, width, height, x, chartArea, maxCandleWidth);
      
      if (candleStructure && candleStructure.isValid) {
        const candle: DetectedCandle = {
          x: candleStructure.x,
          y: candleStructure.topY,
          width: candleStructure.width,
          height: candleStructure.bottomY - candleStructure.topY,
          bodyTop: candleStructure.bodyTop,
          bodyBottom: candleStructure.bodyBottom,
          wickTop: candleStructure.wickTop,
          wickBottom: candleStructure.wickBottom,
          color: candleStructure.color,
          confidence: candleStructure.confidence
        };
        
        detectedCandles.push(candle);
        x += candleStructure.width; // Pular para próxima área
      }
    }
    
    // Filtrar e ordenar candles por posição X
    const validCandles = filterOverlappingCandles(detectedCandles)
      .sort((a, b) => a.x - b.x);
    
    console.log(`✅ Detectados ${validCandles.length} candles válidos com alta precisão`);
    
    return validCandles.slice(0, 60); // Limitar para performance
    
  } catch (error) {
    console.error('❌ Erro na detecção avançada de candles:', error);
    toast({
      variant: "destructive",
      title: "Erro de Detecção",
      description: `Falha ao detectar candles: ${String(error)}`,
    });
    return [];
  }
};

interface CandleStructure {
  x: number;
  width: number;
  topY: number;
  bottomY: number;
  bodyTop: number;
  bodyBottom: number;
  wickTop: number;
  wickBottom: number;
  color: 'green' | 'red' | 'black' | 'white';
  confidence: number;
  isValid: boolean;
}

const analyzeCandleColumn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  chartArea: ChartArea,
  maxWidth: number
): CandleStructure | null => {
  
  const candleData = {
    x: startX,
    width: 1,
    topY: chartArea.y + chartArea.height,
    bottomY: chartArea.y,
    bodyTop: chartArea.y + chartArea.height,
    bodyBottom: chartArea.y,
    wickTop: chartArea.y + chartArea.height,
    wickBottom: chartArea.y,
    color: 'black' as 'green' | 'red' | 'black' | 'white',
    confidence: 0,
    isValid: false,
    verticalPixels: 0,
    bodyPixels: 0,
    wickPixels: 0
  };
  
  // Analisar largura do candle
  for (let w = 1; w <= maxWidth && startX + w < chartArea.x + chartArea.width; w++) {
    const columnAnalysis = analyzeColumn(data, width, height, startX + w - 1, chartArea);
    
    if (columnAnalysis.hasVerticalStructure) {
      candleData.width = w;
      candleData.topY = Math.min(candleData.topY, columnAnalysis.topY);
      candleData.bottomY = Math.max(candleData.bottomY, columnAnalysis.bottomY);
      candleData.verticalPixels += columnAnalysis.verticalPixels;
      
      // Detectar corpo vs wick
      if (columnAnalysis.hasBody) {
        candleData.bodyTop = Math.min(candleData.bodyTop, columnAnalysis.bodyTop);
        candleData.bodyBottom = Math.max(candleData.bodyBottom, columnAnalysis.bodyBottom);
        candleData.bodyPixels += columnAnalysis.bodyPixels;
      }
      
      if (columnAnalysis.hasWick) {
        candleData.wickTop = Math.min(candleData.wickTop, columnAnalysis.wickTop);
        candleData.wickBottom = Math.max(candleData.wickBottom, columnAnalysis.wickBottom);
        candleData.wickPixels += columnAnalysis.wickPixels;
      }
    } else {
      break;
    }
  }
  
  // Validar estrutura do candle
  const candleHeight = candleData.bottomY - candleData.topY;
  const bodyHeight = candleData.bodyBottom - candleData.bodyTop;
  
  if (candleHeight >= 6 && candleData.verticalPixels >= 8 && bodyHeight > 0) {
    // Determinar cor baseada na análise do corpo
    candleData.color = determineCandleColor(
      data, width, height, candleData, chartArea
    );
    
    // Calcular confiança baseada na estrutura
    candleData.confidence = calculateCandleConfidence(candleData, candleHeight, bodyHeight);
    
    candleData.isValid = candleData.confidence > 0.5;
  }
  
  return candleData.isValid ? candleData : null;
};

interface ColumnAnalysis {
  hasVerticalStructure: boolean;
  topY: number;
  bottomY: number;
  bodyTop: number;
  bodyBottom: number;
  wickTop: number;
  wickBottom: number;
  hasBody: boolean;
  hasWick: boolean;
  verticalPixels: number;
  bodyPixels: number;
  wickPixels: number;
}

const analyzeColumn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  chartArea: ChartArea
): ColumnAnalysis => {
  
  const analysis: ColumnAnalysis = {
    hasVerticalStructure: false,
    topY: chartArea.y + chartArea.height,
    bottomY: chartArea.y,
    bodyTop: chartArea.y + chartArea.height,
    bodyBottom: chartArea.y,
    wickTop: chartArea.y + chartArea.height,
    wickBottom: chartArea.y,
    hasBody: false,
    hasWick: false,
    verticalPixels: 0,
    bodyPixels: 0,
    wickPixels: 0
  };
  
  for (let y = chartArea.y; y < chartArea.y + chartArea.height; y++) {
    if (x >= width || y >= height) continue;
    
    const i = (y * width + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const pixelAnalysis = analyzePixel(r, g, b);
    
    if (pixelAnalysis.isVerticalElement) {
      analysis.hasVerticalStructure = true;
      analysis.verticalPixels++;
      analysis.topY = Math.min(analysis.topY, y);
      analysis.bottomY = Math.max(analysis.bottomY, y);
      
      if (pixelAnalysis.elementType === 'body') {
        analysis.hasBody = true;
        analysis.bodyPixels++;
        analysis.bodyTop = Math.min(analysis.bodyTop, y);
        analysis.bodyBottom = Math.max(analysis.bodyBottom, y);
      } else if (pixelAnalysis.elementType === 'wick') {
        analysis.hasWick = true;
        analysis.wickPixels++;
        analysis.wickTop = Math.min(analysis.wickTop, y);
        analysis.wickBottom = Math.max(analysis.wickBottom, y);
      }
    }
  }
  
  return analysis;
};

interface PixelAnalysis {
  isVerticalElement: boolean;
  elementType: 'body' | 'wick' | 'none';
  color: 'green' | 'red' | 'black' | 'white' | 'gray';
}

const analyzePixel = (r: number, g: number, b: number): PixelAnalysis => {
  const analysis: PixelAnalysis = {
    isVerticalElement: false,
    elementType: 'none',
    color: 'black'
  };
  
  // Detectar elementos verticais (candles)
  const isGreenCandle = g > r + 15 && g > b + 10;
  const isRedCandle = r > g + 15 && r > b + 10;
  const isBlackCandle = r < 80 && g < 80 && b < 80;
  const isWhiteCandle = r > 180 && g > 180 && b > 180;
  const isGrayLine = Math.abs(r - g) < 20 && Math.abs(r - b) < 20 && r > 80 && r < 180;
  
  if (isGreenCandle) {
    analysis.isVerticalElement = true;
    analysis.elementType = 'body';
    analysis.color = 'green';
  } else if (isRedCandle) {
    analysis.isVerticalElement = true;
    analysis.elementType = 'body';
    analysis.color = 'red';
  } else if (isBlackCandle) {
    analysis.isVerticalElement = true;
    analysis.elementType = 'body';
    analysis.color = 'black';
  } else if (isWhiteCandle) {
    analysis.isVerticalElement = true;
    analysis.elementType = 'body';
    analysis.color = 'white';
  } else if (isGrayLine) {
    analysis.isVerticalElement = true;
    analysis.elementType = 'wick';
    analysis.color = 'gray';
  }
  
  return analysis;
};

const determineCandleColor = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  candle: any,
  chartArea: ChartArea
): 'green' | 'red' | 'black' | 'white' => {
  
  // Amostrar múltiplos pontos do corpo do candle
  const samples: { r: number, g: number, b: number }[] = [];
  
  const bodyMidY = Math.floor((candle.bodyTop + candle.bodyBottom) / 2);
  const bodyStartX = candle.x;
  const bodyEndX = Math.min(candle.x + candle.width, chartArea.x + chartArea.width);
  
  for (let x = bodyStartX; x < bodyEndX; x += Math.max(1, Math.floor(candle.width / 3))) {
    for (let y = candle.bodyTop; y <= candle.bodyBottom; y += Math.max(1, Math.floor((candle.bodyBottom - candle.bodyTop) / 3))) {
      if (x < width && y < height) {
        const i = (y * width + x) * 4;
        samples.push({
          r: data[i],
          g: data[i + 1],
          b: data[i + 2]
        });
      }
    }
  }
  
  if (samples.length === 0) return 'black';
  
  // Calcular cor predominante
  let greenVotes = 0;
  let redVotes = 0;
  let blackVotes = 0;
  let whiteVotes = 0;
  
  samples.forEach(sample => {
    if (sample.g > sample.r + 15 && sample.g > sample.b + 10) {
      greenVotes++;
    } else if (sample.r > sample.g + 15 && sample.r > sample.b + 10) {
      redVotes++;
    } else if (sample.r < 80 && sample.g < 80 && sample.b < 80) {
      blackVotes++;
    } else if (sample.r > 180 && sample.g > 180 && sample.b > 180) {
      whiteVotes++;
    }
  });
  
  const maxVotes = Math.max(greenVotes, redVotes, blackVotes, whiteVotes);
  
  if (maxVotes === greenVotes) return 'green';
  if (maxVotes === redVotes) return 'red';
  if (maxVotes === whiteVotes) return 'white';
  return 'black';
};

const calculateCandleConfidence = (candle: any, candleHeight: number, bodyHeight: number): number => {
  let confidence = 0.5;
  
  // Bonus por ter estrutura de corpo definida
  if (bodyHeight > 2) {
    confidence += 0.2;
  }
  
  // Bonus por proporção adequada de pixels verticais
  const expectedPixels = candleHeight * candle.width;
  const actualRatio = candle.verticalPixels / expectedPixels;
  if (actualRatio > 0.3) {
    confidence += Math.min(0.2, actualRatio);
  }
  
  // Bonus por ter pavios (estrutura completa)
  if (candle.wickPixels > 0) {
    confidence += 0.1;
  }
  
  // Bonus por largura adequada
  if (candle.width >= 3 && candle.width <= 15) {
    confidence += 0.1;
  }
  
  // Penalty por ser muito pequeno
  if (candleHeight < 8) {
    confidence -= 0.1;
  }
  
  return Math.min(0.95, Math.max(0.1, confidence));
};

const filterOverlappingCandles = (candles: DetectedCandle[]): DetectedCandle[] => {
  const filtered: DetectedCandle[] = [];
  
  candles.forEach(candle => {
    const isOverlapping = filtered.some(existing => 
      Math.abs(candle.x - existing.x) < Math.min(candle.width, existing.width) * 0.7
    );
    
    if (!isOverlapping) {
      filtered.push(candle);
    } else {
      // Substituir se a confiança for maior
      const existingIndex = filtered.findIndex(existing => 
        Math.abs(candle.x - existing.x) < Math.min(candle.width, existing.width) * 0.7
      );
      
      if (existingIndex !== -1 && candle.confidence > filtered[existingIndex].confidence) {
        filtered[existingIndex] = candle;
      }
    }
  });
  
  return filtered;
};
