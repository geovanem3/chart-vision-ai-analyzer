
/**
 * Análise rigorosa de pixels do gráfico para opções binárias
 */

export interface ChartPixelAnalysis {
  hasValidChart: boolean;
  chartQuality: 'excelente' | 'boa' | 'regular' | 'ruim' | 'nao_detectado';
  confidence: number;
  candleDetection: {
    detected: boolean;
    count: number;
    quality: 'alta' | 'media' | 'baixa';
  };
  gridDetection: {
    detected: boolean;
    horizontalLines: number;
    verticalLines: number;
  };
  priceAxisDetection: {
    detected: boolean;
    position: 'left' | 'right' | 'both' | 'none';
  };
  timeAxisDetection: {
    detected: boolean;
    position: 'top' | 'bottom' | 'both' | 'none';
  };
  colorAnalysis: {
    hasGreenCandles: boolean;
    hasRedCandles: boolean;
    backgroundType: 'dark' | 'light' | 'mixed';
  };
  recommendations: string[];
}

export const analyzeChartPixels = (canvas: HTMLCanvasElement): ChartPixelAnalysis => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      hasValidChart: false,
      chartQuality: 'nao_detectado',
      confidence: 0,
      candleDetection: { detected: false, count: 0, quality: 'baixa' },
      gridDetection: { detected: false, horizontalLines: 0, verticalLines: 0 },
      priceAxisDetection: { detected: false, position: 'none' },
      timeAxisDetection: { detected: false, position: 'none' },
      colorAnalysis: { hasGreenCandles: false, hasRedCandles: false, backgroundType: 'mixed' },
      recommendations: ['Falha ao acessar contexto do canvas']
    };
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  console.log(`[PIXEL ANALYSIS] Analisando ${width}x${height} pixels`);

  // 1. Análise de fundo para determinar o tipo de gráfico
  const backgroundAnalysis = analyzeBackground(data, width, height);
  
  // 2. Detecção rigorosa de candles
  const candleAnalysis = detectCandles(data, width, height, backgroundAnalysis.backgroundType);
  
  // 3. Detecção de grid/grades
  const gridAnalysis = detectGrid(data, width, height, backgroundAnalysis.backgroundType);
  
  // 4. Detecção de eixos de preço e tempo
  const priceAxisAnalysis = detectPriceAxis(data, width, height);
  const timeAxisAnalysis = detectTimeAxis(data, width, height);
  
  // 5. Análise de cores específicas de candles
  const colorAnalysis = analyzeColors(data, width, height);
  
  // 6. Calcular confiança geral
  const confidence = calculateConfidence({
    candleAnalysis,
    gridAnalysis,
    priceAxisAnalysis,
    timeAxisAnalysis,
    colorAnalysis,
    backgroundAnalysis
  });
  
  // 7. Determinar qualidade do gráfico
  const chartQuality = determineChartQuality(confidence, candleAnalysis, gridAnalysis);
  
  // 8. Verificar se é um gráfico válido
  const hasValidChart = confidence > 60 && candleAnalysis.detected && gridAnalysis.detected;
  
  // 9. Gerar recomendações
  const recommendations = generateRecommendations({
    hasValidChart,
    confidence,
    candleAnalysis,
    gridAnalysis,
    colorAnalysis
  });

  console.log(`[PIXEL ANALYSIS] Confiança: ${confidence}% | Candles: ${candleAnalysis.count} | Grid: ${gridAnalysis.horizontalLines}H/${gridAnalysis.verticalLines}V`);

  return {
    hasValidChart,
    chartQuality,
    confidence,
    candleDetection: candleAnalysis,
    gridDetection: gridAnalysis,
    priceAxisDetection: priceAxisAnalysis,
    timeAxisDetection: timeAxisAnalysis,
    colorAnalysis,
    recommendations
  };
};

const analyzeBackground = (data: Uint8ClampedArray, width: number, height: number) => {
  let darkPixels = 0;
  let lightPixels = 0;
  let totalPixels = 0;
  
  // Amostragem para melhor performance
  for (let y = 0; y < height; y += 5) {
    for (let x = 0; x < width; x += 5) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = (r + g + b) / 3;
      
      if (luminance < 80) darkPixels++;
      else if (luminance > 200) lightPixels++;
      totalPixels++;
    }
  }
  
  const darkRatio = darkPixels / totalPixels;
  const lightRatio = lightPixels / totalPixels;
  
  let backgroundType: 'dark' | 'light' | 'mixed' = 'mixed';
  if (darkRatio > 0.6) backgroundType = 'dark';
  else if (lightRatio > 0.6) backgroundType = 'light';
  
  return { backgroundType, darkRatio, lightRatio };
};

const detectCandles = (data: Uint8ClampedArray, width: number, height: number, backgroundType: string) => {
  const candleRegions: { x: number, y: number, width: number, height: number, color: 'green' | 'red' }[] = [];
  
  // Varrer a imagem procurando por retângulos verticais (candles)
  const minCandleWidth = Math.max(2, Math.floor(width * 0.005)); // Mínimo 2px ou 0.5% da largura
  const maxCandleWidth = Math.max(20, Math.floor(width * 0.02)); // Máximo 20px ou 2% da largura
  const minCandleHeight = Math.max(10, Math.floor(height * 0.02)); // Mínimo 10px ou 2% da altura
  
  console.log(`[CANDLE DETECTION] Buscando candles: ${minCandleWidth}-${maxCandleWidth}px largura, min ${minCandleHeight}px altura`);
  
  for (let x = 0; x < width - maxCandleWidth; x += 3) {
    for (let y = 0; y < height - minCandleHeight; y += 3) {
      const candleRegion = analyzePotentialCandle(data, width, height, x, y, minCandleWidth, maxCandleWidth, minCandleHeight, backgroundType);
      if (candleRegion) {
        candleRegions.push(candleRegion);
      }
    }
  }
  
  // Filtrar candles sobrepostos
  const filteredCandles = filterOverlappingCandles(candleRegions);
  
  const quality = filteredCandles.length > 20 ? 'alta' : filteredCandles.length > 10 ? 'media' : 'baixa';
  
  return {
    detected: filteredCandles.length > 5,
    count: filteredCandles.length,
    quality,
    regions: filteredCandles
  };
};

const analyzePotentialCandle = (
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  startX: number, 
  startY: number,
  minWidth: number,
  maxWidth: number,
  minHeight: number,
  backgroundType: string
) => {
  for (let candleWidth = minWidth; candleWidth <= maxWidth; candleWidth++) {
    for (let candleHeight = minHeight; candleHeight <= Math.min(height - startY, height * 0.2); candleHeight++) {
      if (startX + candleWidth >= width || startY + candleHeight >= height) continue;
      
      const region = analyzeRegion(data, width, startX, startY, candleWidth, candleHeight);
      
      // Verificar se tem características de candle
      if (region.isCandle) {
        return {
          x: startX,
          y: startY,
          width: candleWidth,
          height: candleHeight,
          color: region.dominantColor
        };
      }
    }
  }
  return null;
};

const analyzeRegion = (data: Uint8ClampedArray, width: number, x: number, y: number, w: number, h: number) => {
  let redPixels = 0;
  let greenPixels = 0;
  let totalColorPixels = 0;
  let uniformityScore = 0;
  
  const centerR = data[((y + Math.floor(h/2)) * width + (x + Math.floor(w/2))) * 4];
  const centerG = data[((y + Math.floor(h/2)) * width + (x + Math.floor(w/2))) * 4 + 1];
  const centerB = data[((y + Math.floor(h/2)) * width + (x + Math.floor(w/2))) * 4 + 2];
  
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const i = ((y + dy) * width + (x + dx)) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Detectar cores de candles
      if (g > r * 1.3 && g > b * 1.3 && g > 80) {
        greenPixels++;
        totalColorPixels++;
      } else if (r > g * 1.3 && r > b * 1.3 && r > 80) {
        redPixels++;
        totalColorPixels++;
      }
      
      // Verificar uniformidade (candles têm cor consistente)
      const colorDiff = Math.abs(r - centerR) + Math.abs(g - centerG) + Math.abs(b - centerB);
      if (colorDiff < 50) uniformityScore++;
    }
  }
  
  const colorRatio = totalColorPixels / (w * h);
  const uniformityRatio = uniformityScore / (w * h);
  
  // Um candle deve ter pelo menos 30% de pixels coloridos e 50% de uniformidade
  const isCandle = colorRatio > 0.3 && uniformityRatio > 0.5 && totalColorPixels > 5;
  const dominantColor = greenPixels > redPixels ? 'green' : 'red';
  
  return { isCandle, dominantColor, colorRatio, uniformityRatio };
};

const filterOverlappingCandles = (candles: any[]) => {
  const filtered = [];
  
  for (const candle of candles) {
    let isOverlapping = false;
    
    for (const existing of filtered) {
      if (Math.abs(candle.x - existing.x) < candle.width && 
          Math.abs(candle.y - existing.y) < candle.height) {
        isOverlapping = true;
        break;
      }
    }
    
    if (!isOverlapping) {
      filtered.push(candle);
    }
  }
  
  return filtered;
};

const detectGrid = (data: Uint8ClampedArray, width: number, height: number, backgroundType: string) => {
  let horizontalLines = 0;
  let verticalLines = 0;
  
  // Detectar linhas horizontais
  for (let y = Math.floor(height * 0.1); y < height * 0.9; y += Math.floor(height * 0.05)) {
    let linePixels = 0;
    
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = (r + g + b) / 3;
      
      // Linhas de grid são geralmente cinzas ou com baixo contraste
      if ((backgroundType === 'dark' && luminance > 60 && luminance < 120) ||
          (backgroundType === 'light' && luminance > 100 && luminance < 180)) {
        linePixels++;
      }
    }
    
    if (linePixels > width * 0.4) { // Linha deve cobrir pelo menos 40% da largura
      horizontalLines++;
    }
  }
  
  // Detectar linhas verticais
  for (let x = Math.floor(width * 0.1); x < width * 0.9; x += Math.floor(width * 0.05)) {
    let linePixels = 0;
    
    for (let y = 0; y < height; y += 3) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = (r + g + b) / 3;
      
      if ((backgroundType === 'dark' && luminance > 60 && luminance < 120) ||
          (backgroundType === 'light' && luminance > 100 && luminance < 180)) {
        linePixels++;
      }
    }
    
    if (linePixels > height * 0.4) { // Linha deve cobrir pelo menos 40% da altura
      verticalLines++;
    }
  }
  
  return {
    detected: horizontalLines >= 3 && verticalLines >= 3,
    horizontalLines,
    verticalLines
  };
};

const detectPriceAxis = (data: Uint8ClampedArray, width: number, height: number) => {
  // Verificar eixo de preço nas bordas laterais
  let leftAxisScore = 0;
  let rightAxisScore = 0;
  
  // Verificar lado esquerdo (primeiros 5% da largura)
  for (let x = 0; x < Math.floor(width * 0.05); x++) {
    for (let y = 0; y < height; y += 5) {
      const i = (y * width + x) * 4;
      const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (luminance < 100) leftAxisScore++; // Texto escuro
    }
  }
  
  // Verificar lado direito (últimos 5% da largura)
  for (let x = Math.floor(width * 0.95); x < width; x++) {
    for (let y = 0; y < height; y += 5) {
      const i = (y * width + x) * 4;
      const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (luminance < 100) rightAxisScore++; // Texto escuro
    }
  }
  
  const leftDetected = leftAxisScore > (height * 0.05) * 0.1;
  const rightDetected = rightAxisScore > (height * 0.05) * 0.1;
  
  let position: 'left' | 'right' | 'both' | 'none' = 'none';
  if (leftDetected && rightDetected) position = 'both';
  else if (leftDetected) position = 'left';
  else if (rightDetected) position = 'right';
  
  return {
    detected: leftDetected || rightDetected,
    position
  };
};

const detectTimeAxis = (data: Uint8ClampedArray, width: number, height: number) => {
  // Verificar eixo de tempo nas bordas superior e inferior
  let topAxisScore = 0;
  let bottomAxisScore = 0;
  
  // Verificar parte superior (primeiros 5% da altura)
  for (let y = 0; y < Math.floor(height * 0.05); y++) {
    for (let x = 0; x < width; x += 5) {
      const i = (y * width + x) * 4;
      const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (luminance < 100) topAxisScore++; // Texto escuro
    }
  }
  
  // Verificar parte inferior (últimos 5% da altura)
  for (let y = Math.floor(height * 0.95); y < height; y++) {
    for (let x = 0; x < width; x += 5) {
      const i = (y * width + x) * 4;
      const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (luminance < 100) bottomAxisScore++; // Texto escuro
    }
  }
  
  const topDetected = topAxisScore > (width * 0.05) * 0.1;
  const bottomDetected = bottomAxisScore > (width * 0.05) * 0.1;
  
  let position: 'top' | 'bottom' | 'both' | 'none' = 'none';
  if (topDetected && bottomDetected) position = 'both';
  else if (topDetected) position = 'top';
  else if (bottomDetected) position = 'bottom';
  
  return {
    detected: topDetected || bottomDetected,
    position
  };
};

const analyzeColors = (data: Uint8ClampedArray, width: number, height: number) => {
  let greenCandlePixels = 0;
  let redCandlePixels = 0;
  let darkPixels = 0;
  let lightPixels = 0;
  
  for (let i = 0; i < data.length; i += 16) { // Amostragem para performance
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = (r + g + b) / 3;
    
    // Detectar candles verdes
    if (g > r * 1.4 && g > b * 1.4 && g > 100) {
      greenCandlePixels++;
    }
    // Detectar candles vermelhos
    else if (r > g * 1.4 && r > b * 1.4 && r > 100) {
      redCandlePixels++;
    }
    
    // Analisar luminosidade geral
    if (luminance < 80) darkPixels++;
    else if (luminance > 200) lightPixels++;
  }
  
  const totalSamples = data.length / 16;
  const backgroundType = darkPixels > lightPixels ? 'dark' : lightPixels > darkPixels ? 'light' : 'mixed';
  
  return {
    hasGreenCandles: greenCandlePixels > totalSamples * 0.001, // Pelo menos 0.1% dos pixels
    hasRedCandles: redCandlePixels > totalSamples * 0.001,
    backgroundType
  };
};

const calculateConfidence = (analysis: any) => {
  let score = 0;
  
  // Pontuação por detecção de candles (40 pontos máximo)
  if (analysis.candleAnalysis.detected) {
    score += 30;
    if (analysis.candleAnalysis.quality === 'alta') score += 10;
    else if (analysis.candleAnalysis.quality === 'media') score += 5;
  }
  
  // Pontuação por grid (25 pontos máximo)
  if (analysis.gridAnalysis.detected) {
    score += 20;
    if (analysis.gridAnalysis.horizontalLines >= 5) score += 3;
    if (analysis.gridAnalysis.verticalLines >= 5) score += 2;
  }
  
  // Pontuação por eixos (20 pontos máximo)
  if (analysis.priceAxisAnalysis.detected) score += 10;
  if (analysis.timeAxisAnalysis.detected) score += 10;
  
  // Pontuação por cores (15 pontos máximo)
  if (analysis.colorAnalysis.hasGreenCandles && analysis.colorAnalysis.hasRedCandles) {
    score += 15;
  } else if (analysis.colorAnalysis.hasGreenCandles || analysis.colorAnalysis.hasRedCandles) {
    score += 8;
  }
  
  return Math.min(100, score);
};

const determineChartQuality = (confidence: number, candleAnalysis: any, gridAnalysis: any): 'excelente' | 'boa' | 'regular' | 'ruim' | 'nao_detectado' => {
  if (confidence >= 85 && candleAnalysis.quality === 'alta' && gridAnalysis.detected) {
    return 'excelente';
  } else if (confidence >= 70 && candleAnalysis.detected && gridAnalysis.detected) {
    return 'boa';
  } else if (confidence >= 50 && candleAnalysis.detected) {
    return 'regular';
  } else if (confidence >= 30) {
    return 'ruim';
  } else {
    return 'nao_detectado';
  }
};

const generateRecommendations = (analysis: any): string[] => {
  const recommendations: string[] = [];
  
  if (!analysis.hasValidChart) {
    recommendations.push('❌ Gráfico não detectado com qualidade suficiente');
  }
  
  if (analysis.confidence < 60) {
    recommendations.push('⚠️ Baixa confiança na detecção do gráfico');
  }
  
  if (!analysis.candleAnalysis.detected) {
    recommendations.push('🕯️ Candles não detectados - verifique se o gráfico está visível');
  } else if (analysis.candleAnalysis.quality === 'baixa') {
    recommendations.push('📊 Qualidade dos candles baixa - melhore o enquadramento');
  }
  
  if (!analysis.gridAnalysis.detected) {
    recommendations.push('📋 Grid não detectado - ative as linhas de grade no gráfico');
  }
  
  if (!analysis.colorAnalysis.hasGreenCandles || !analysis.colorAnalysis.hasRedCandles) {
    recommendations.push('🎨 Cores de candles não detectadas claramente');
  }
  
  if (analysis.hasValidChart && analysis.confidence > 80) {
    recommendations.push('✅ Gráfico detectado com excelente qualidade');
  }
  
  return recommendations;
};
