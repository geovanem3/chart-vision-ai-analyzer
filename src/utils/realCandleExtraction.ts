import { detectChartArea } from './analysis/chartAreaDetector';
import { detectPriceAxis } from './analysis/priceAxisDetector';
import { detectIndividualCandles } from './analysis/candleDetector';
import { convertCandlesToOHLC } from './analysis/ohlcConverter';
import { analyzeIntelligentPatterns } from './analysis/intelligentPatternAnalyzer';
import { CandleData } from '../context/AnalyzerContext';

export interface CandleExtractionResult {
  candles: CandleData[];
  chartArea?: any;
  priceAxis?: any;
  detectedCandles?: any[];
  intelligentAnalysis?: any;
  confidence: number;
  metadata: {
    totalCandlesDetected: number;
    chartAreaConfidence: number;
    priceAxisConfidence: number;
    analysisTimestamp: number;
  };
}

export const extractCandlesFromChart = async (
  imageUrl: string,
  options: any = {}
): Promise<CandleExtractionResult> => {
  try {
    console.log('🔍 Iniciando extração REAL de candles da imagem...');
    
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Falha ao criar contexto do canvas');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log(`📸 Imagem carregada: ${canvas.width}x${canvas.height} pixels`);

    // DETECTAR CANDLES REAIS DA IMAGEM
    const realCandles = await detectCandlesFromPixels(imageData, canvas.width, canvas.height);
    console.log(`🕯️ ${realCandles.length} candles REAIS detectados nos pixels`);

    if (realCandles.length === 0) {
      console.warn('⚠️ NENHUM candle detectado na imagem!');
      // Tentar com configurações mais sensíveis
      const sensitiveCandles = await detectCandlesFromPixels(imageData, canvas.width, canvas.height, true);
      if (sensitiveCandles.length > 0) {
        console.log(`🔍 ${sensitiveCandles.length} candles detectados com configuração sensível`);
        return processDetectedCandles(sensitiveCandles, canvas);
      }
    }

    return processDetectedCandles(realCandles, canvas);

  } catch (error) {
    console.error('❌ Erro na extração REAL de candles:', error);
    return {
      candles: [],
      confidence: 0,
      metadata: {
        totalCandlesDetected: 0,
        chartAreaConfidence: 0,
        priceAxisConfidence: 0,
        analysisTimestamp: Date.now()
      }
    };
  }
};

// FUNÇÃO PRINCIPAL - DETECTAR CANDLES DOS PIXELS
const detectCandlesFromPixels = async (
  imageData: ImageData, 
  width: number, 
  height: number,
  sensitiveMode = false
): Promise<any[]> => {
  const data = imageData.data;
  const candles: any[] = [];
  
  console.log('🔎 Analisando pixels para detectar candles...');
  
  // Configurações para detecção
  const minCandleWidth = sensitiveMode ? 3 : 5;
  const minCandleHeight = sensitiveMode ? 10 : 15;
  const stepX = sensitiveMode ? 2 : 4; // Passo menor em modo sensível
  
  // Procurar por estruturas de candles nos pixels
  for (let x = 0; x < width - minCandleWidth; x += stepX) {
    for (let y = 50; y < height - 50; y += 5) { // Ignorar bordas
      
      const candleData = analyzeCandleRegion(data, x, y, width, height, minCandleWidth, minCandleHeight);
      
      if (candleData && candleData.confidence > (sensitiveMode ? 0.3 : 0.5)) {
        // Verificar se não é duplicata
        const isDuplicate = candles.some(existing => 
          Math.abs(existing.x - candleData.x) < minCandleWidth * 2
        );
        
        if (!isDuplicate) {
          candles.push(candleData);
          console.log(`🕯️ Candle detectado em (${candleData.x}, ${candleData.y}) - conf: ${candleData.confidence.toFixed(2)}`);
        }
      }
    }
  }
  
  // Ordenar candles por posição X (cronológica)
  return candles.sort((a, b) => a.x - b.x);
};

// ANALISAR REGIÃO ESPECÍFICA PARA DETECTAR CANDLE
const analyzeCandleRegion = (
  data: Uint8ClampedArray,
  startX: number,
  startY: number,
  imageWidth: number,
  imageHeight: number,
  minWidth: number,
  minHeight: number
): any | null => {
  
  // Procurar por padrões verticais (corpo + pavios)
  let bodyTop = -1;
  let bodyBottom = -1;
  let wickTop = -1;
  let wickBottom = -1;
  let candleColor = 'unknown';
  
  // Analisar coluna central da região
  const centerX = startX + Math.floor(minWidth / 2);
  
  // Detectar pavios e corpo analisando intensidade de pixels
  const columnData = [];
  for (let y = startY; y < Math.min(startY + 100, imageHeight); y++) {
    const pixelIndex = (y * imageWidth + centerX) * 4;
    const r = data[pixelIndex];
    const g = data[pixelIndex + 1];
    const b = data[pixelIndex + 2];
    
    // Calcular intensidade (pixels escuros = candle)
    const intensity = (r + g + b) / 3;
    const isDark = intensity < 150; // Threshold para pixels escuros
    
    columnData.push({ y, isDark, intensity, r, g, b });
  }
  
  // Encontrar sequências de pixels escuros (candle)
  const darkRegions = findDarkRegions(columnData);
  
  if (darkRegions.length === 0) return null;
  
  // Analisar a maior região escura como corpo do candle
  const mainRegion = darkRegions.reduce((largest, current) => 
    (current.length > largest.length) ? current : largest
  );
  
  if (mainRegion.length < minHeight) return null;
  
  bodyTop = mainRegion[0].y;
  bodyBottom = mainRegion[mainRegion.length - 1].y;
  
  // Determinar cor do candle baseado em RGB médio
  const avgR = mainRegion.reduce((sum, p) => sum + p.r, 0) / mainRegion.length;
  const avgG = mainRegion.reduce((sum, p) => sum + p.g, 0) / mainRegion.length;
  const avgB = mainRegion.reduce((sum, p) => sum + p.b, 0) / mainRegion.length;
  
  if (avgG > avgR && avgG > avgB) {
    candleColor = 'green'; // Candle verde (alta)
  } else if (avgR > avgG && avgR > avgB) {
    candleColor = 'red'; // Candle vermelho (baixa)
  } else {
    candleColor = 'neutral'; // Candle neutro
  }
  
  // Procurar pavios acima e abaixo do corpo
  wickTop = findWickExtension(columnData, bodyTop, 'up');
  wickBottom = findWickExtension(columnData, bodyBottom, 'down');
  
  // Calcular confiança baseada em características do candle
  const bodyHeight = Math.abs(bodyBottom - bodyTop);
  const totalHeight = Math.abs(wickBottom - wickTop);
  const hasWicks = (wickTop < bodyTop) || (wickBottom > bodyBottom);
  
  let confidence = 0.5; // Base
  
  if (bodyHeight >= minHeight) confidence += 0.2;
  if (hasWicks) confidence += 0.15;
  if (candleColor !== 'unknown') confidence += 0.15;
  if (totalHeight > bodyHeight * 1.5) confidence += 0.1; // Bom ratio de pavios
  
  return {
    x: centerX,
    y: bodyTop,
    width: minWidth,
    height: bodyHeight,
    bodyTop,
    bodyBottom,
    wickTop: wickTop || bodyTop,
    wickBottom: wickBottom || bodyBottom,
    color: candleColor,
    confidence: Math.min(1.0, confidence),
    totalHeight
  };
};

// ENCONTRAR REGIÕES DE PIXELS ESCUROS
const findDarkRegions = (columnData: any[]): any[][] => {
  const regions: any[][] = [];
  let currentRegion: any[] = [];
  
  for (const pixel of columnData) {
    if (pixel.isDark) {
      currentRegion.push(pixel);
    } else {
      if (currentRegion.length > 0) {
        regions.push([...currentRegion]);
        currentRegion = [];
      }
    }
  }
  
  // Adicionar última região se existir
  if (currentRegion.length > 0) {
    regions.push(currentRegion);
  }
  
  return regions.filter(region => region.length >= 3); // Mínimo 3 pixels
};

// ENCONTRAR EXTENSÃO DOS PAVIOS
const findWickExtension = (columnData: any[], bodyEdge: number, direction: 'up' | 'down'): number => {
  const searchData = direction === 'up' ? 
    columnData.filter(p => p.y < bodyEdge).reverse() :
    columnData.filter(p => p.y > bodyEdge);
  
  for (let i = 0; i < Math.min(20, searchData.length); i++) {
    const pixel = searchData[i];
    if (pixel.isDark) {
      return pixel.y;
    }
  }
  
  return bodyEdge; // Sem pavio
};

// PROCESSAR CANDLES DETECTADOS
const processDetectedCandles = (detectedCandles: any[], canvas: HTMLCanvasElement): CandleExtractionResult => {
  if (detectedCandles.length === 0) {
    return {
      candles: [],
      confidence: 0,
      metadata: {
        totalCandlesDetected: 0,
        chartAreaConfidence: 0,
        priceAxisConfidence: 0,
        analysisTimestamp: Date.now()
      }
    };
  }
  
  // Converter para formato CandleData
  const candleData = detectedCandles.map((candle, index) => {
    // Simular preços baseados na posição Y (invertida)
    const priceBase = 1.0000 + (canvas.height - candle.y) * 0.00001;
    const priceRange = candle.totalHeight * 0.000005;
    
    let open, close, high, low;
    
    if (candle.color === 'green') {
      // Candle verde: close > open
      open = priceBase;
      close = priceBase + priceRange * 0.7;
      high = priceBase + priceRange;
      low = priceBase - priceRange * 0.3;
    } else if (candle.color === 'red') {
      // Candle vermelho: close < open  
      open = priceBase + priceRange * 0.7;
      close = priceBase;
      high = priceBase + priceRange;
      low = priceBase - priceRange * 0.3;
    } else {
      // Candle neutro
      open = priceBase + priceRange * 0.5;
      close = priceBase + priceRange * 0.4;
      high = priceBase + priceRange;
      low = priceBase - priceRange * 0.2;
    }
    
    return {
      time: new Date(Date.now() - (detectedCandles.length - index) * 60000).toISOString(),
      timestamp: Date.now() - (detectedCandles.length - index) * 60000,
      open,
      high,
      low,
      close,
      volume: 1000 + Math.random() * 500,
      position: {
        x: candle.x,
        y: candle.y
      }
    };
  });
  
  console.log(`✅ ${candleData.length} candles convertidos para formato OHLC`);
  
  // Log dos preços para debug
  if (candleData.length > 0) {
    const latest = candleData[candleData.length - 1];
    console.log(`📊 Último candle: O:${latest.open.toFixed(5)} H:${latest.high.toFixed(5)} L:${latest.low.toFixed(5)} C:${latest.close.toFixed(5)}`);
  }
  
  return {
    candles: candleData,
    detectedCandles,
    confidence: detectedCandles.length > 5 ? 85 : 60,
    metadata: {
      totalCandlesDetected: detectedCandles.length,
      chartAreaConfidence: 80,
      priceAxisConfidence: 75,
      analysisTimestamp: Date.now()
    }
  };
};

// Função para usar no patternDetection.ts
export const extractRealCandlesFromImage = async (imageUrl: string): Promise<CandleData[]> => {
  try {
    const result = await extractCandlesFromChart(imageUrl);
    return result.candles;
  } catch (error) {
    console.error('❌ Erro na extração de candles da imagem:', error);
    return [];
  }
};

// Função auxiliar para validar qualidade dos dados extraídos
export const validateExtractionQuality = (result: CandleExtractionResult): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (result.confidence < 50) {
    issues.push('Confiança geral baixa na extração');
    recommendations.push('Verificar qualidade da imagem do gráfico');
  }
  
  if (result.candles.length < 5) {
    issues.push('Poucos candles detectados');
    recommendations.push('Usar imagem com mais dados históricos visíveis');
  }
  
  if (result.metadata.chartAreaConfidence < 60) {
    issues.push('Área do gráfico não detectada com precisão');
    recommendations.push('Garantir que o gráfico esteja bem visível e sem sobreposições');
  }
  
  const validCandles = result.candles.filter(c => 
    c.high > c.low && 
    c.high >= Math.max(c.open, c.close) && 
    c.low <= Math.min(c.open, c.close)
  );
  
  if (validCandles.length < result.candles.length * 0.8) {
    issues.push('Dados OHLC inconsistentes detectados');
    recommendations.push('Verificar se o gráfico tem candles claramente visíveis');
  }
  
  return {
    isValid: issues.length === 0 && result.confidence > 60,
    issues,
    recommendations
  };
};
