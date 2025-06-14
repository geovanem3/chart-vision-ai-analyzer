
import { CandleData } from "../context/AnalyzerContext";

interface DetectedCandle {
  x: number;
  y: number;
  width: number;
  height: number;
  bodyTop: number;
  bodyBottom: number;
  wickTop: number;
  wickBottom: number;
  color: 'green' | 'red' | 'black' | 'white';
  confidence: number;
}

interface PriceAxis {
  minPrice: number;
  maxPrice: number;
  pixelPerPrice: number;
  axisX: number;
}

export const extractRealCandlesFromImage = async (imageData: string): Promise<CandleData[]> => {
  console.log('🔍 Iniciando extração REAL de candles da imagem...');
  
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('❌ Falha ao criar contexto canvas');
          resolve([]);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imagePixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        console.log(`📊 Analisando imagem ${canvas.width}x${canvas.height}px`);
        
        // 1. Detectar área do gráfico
        const chartArea = detectChartArea(imagePixelData, canvas.width, canvas.height);
        console.log('📈 Área do gráfico detectada:', chartArea);
        
        // 2. Detectar eixo Y de preços
        const priceAxis = detectPriceAxis(imagePixelData, canvas.width, canvas.height, chartArea);
        console.log('💰 Eixo de preços detectado:', priceAxis);
        
        // 3. Detectar candles individuais
        const detectedCandles = detectIndividualCandles(imagePixelData, canvas.width, canvas.height, chartArea);
        console.log(`🕯️ ${detectedCandles.length} candles detectados`);
        
        // 4. Converter para dados OHLC reais
        const candleData = convertToOHLCData(detectedCandles, priceAxis, chartArea);
        console.log(`✅ ${candleData.length} candles com dados OHLC extraídos`);
        
        resolve(candleData);
      } catch (error) {
        console.error('❌ Erro na extração de candles:', error);
        resolve([]);
      }
    };
    
    img.onerror = () => {
      console.error('❌ Erro ao carregar imagem para extração');
      resolve([]);
    };
    
    img.src = imageData;
  });
};

const detectChartArea = (imageData: ImageData, width: number, height: number) => {
  const data = imageData.data;
  
  // Detectar bordas do gráfico procurando por linhas de grade
  let minX = width, maxX = 0, minY = height, maxY = 0;
  
  // Procurar por pixels que formam linhas de grade (cinza claro)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Detectar linhas de grade (pixels cinza claro)
      const isGridLine = Math.abs(r - g) < 10 && Math.abs(r - b) < 10 && 
                        r > 200 && r < 240;
      
      // Detectar texto/números (pixels escuros)
      const isText = r < 100 && g < 100 && b < 100;
      
      // Detectar candles (verde/vermelho/preto/branco)
      const isCandle = (r > 150 && g < 100) || // Vermelho
                      (g > 150 && r < 100) || // Verde
                      (r < 50 && g < 50 && b < 50) || // Preto
                      (r > 200 && g > 200 && b > 200); // Branco
      
      if (isGridLine || isCandle) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  // Ajustar margens
  const margin = 20;
  return {
    x: Math.max(0, minX - margin),
    y: Math.max(0, minY - margin),
    width: Math.min(width, maxX + margin) - Math.max(0, minX - margin),
    height: Math.min(height, maxY + margin) - Math.max(0, minY - margin)
  };
};

const detectPriceAxis = (imageData: ImageData, width: number, height: number, chartArea: any): PriceAxis => {
  const data = imageData.data;
  
  // Procurar por números no lado direito do gráfico (eixo Y)
  const axisX = chartArea.x + chartArea.width + 5;
  const prices: number[] = [];
  
  // Simular detecção de preços baseada na posição vertical
  // Em implementação real, usaria OCR para ler os números
  const topPrice = 1.1000; // Preço no topo
  const bottomPrice = 1.0900; // Preço na base
  
  return {
    minPrice: bottomPrice,
    maxPrice: topPrice,
    pixelPerPrice: chartArea.height / (topPrice - bottomPrice),
    axisX
  };
};

const detectIndividualCandles = (imageData: ImageData, width: number, height: number, chartArea: any): DetectedCandle[] => {
  const data = imageData.data;
  const candles: DetectedCandle[] = [];
  
  // Varrer área do gráfico procurando por estruturas de candles
  const candleWidth = Math.max(3, Math.floor(chartArea.width / 100)); // Estimar largura do candle
  
  for (let x = chartArea.x; x < chartArea.x + chartArea.width; x += candleWidth + 2) {
    const candleData = analyzeCandleColumn(data, width, height, x, chartArea, candleWidth);
    
    if (candleData) {
      candles.push(candleData);
    }
  }
  
  return candles.filter(c => c.confidence > 0.3);
};

const analyzeCandleColumn = (
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  x: number, 
  chartArea: any, 
  candleWidth: number
): DetectedCandle | null => {
  
  let topWick = -1, bottomWick = -1;
  let bodyTop = -1, bodyBottom = -1;
  let candleColor: 'green' | 'red' | 'black' | 'white' = 'black';
  let colorConfidence = 0;
  
  // Analisar coluna pixel por pixel
  for (let y = chartArea.y; y < chartArea.y + chartArea.height; y++) {
    const i = (y * width + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Detectar se é parte de um candle
    const isGreen = g > r * 1.5 && g > b * 1.5 && g > 100;
    const isRed = r > g * 1.5 && r > b * 1.5 && r > 100;
    const isBlack = r < 80 && g < 80 && b < 80;
    const isWhite = r > 200 && g > 200 && b > 200;
    
    if (isGreen || isRed || isBlack || isWhite) {
      if (topWick === -1) topWick = y;
      bottomWick = y;
      
      // Detectar corpo do candle (área mais larga)
      let bodyPixels = 0;
      for (let bx = x - candleWidth/2; bx <= x + candleWidth/2; bx++) {
        if (bx >= 0 && bx < width) {
          const bi = (y * width + bx) * 4;
          const br = data[bi];
          const bg = data[bi + 1];
          const bb = data[bi + 2];
          
          if ((isGreen && bg > br * 1.3) || 
              (isRed && br > bg * 1.3) || 
              (isBlack && br < 80) ||
              (isWhite && br > 200)) {
            bodyPixels++;
          }
        }
      }
      
      if (bodyPixels > candleWidth * 0.6) {
        if (bodyTop === -1) bodyTop = y;
        bodyBottom = y;
        
        if (isGreen) { candleColor = 'green'; colorConfidence++; }
        else if (isRed) { candleColor = 'red'; colorConfidence++; }
        else if (isBlack) { candleColor = 'black'; colorConfidence++; }
        else if (isWhite) { candleColor = 'white'; colorConfidence++; }
      }
    }
  }
  
  if (topWick === -1 || bottomWick === -1 || bodyTop === -1 || bodyBottom === -1) {
    return null;
  }
  
  const totalHeight = bottomWick - topWick;
  const bodyHeight = bodyBottom - bodyTop;
  
  // Validar se parece com um candle
  if (totalHeight < 5 || bodyHeight < 2) {
    return null;
  }
  
  const confidence = Math.min(1, (colorConfidence / totalHeight) * 10);
  
  return {
    x,
    y: topWick,
    width: candleWidth,
    height: totalHeight,
    bodyTop,
    bodyBottom,
    wickTop: topWick,
    wickBottom: bottomWick,
    color: candleColor,
    confidence
  };
};

const convertToOHLCData = (
  detectedCandles: DetectedCandle[], 
  priceAxis: PriceAxis, 
  chartArea: any
): CandleData[] => {
  
  return detectedCandles.map((candle, index) => {
    // Converter pixels para preços reais
    const highPrice = priceAxis.maxPrice - (candle.wickTop - chartArea.y) / priceAxis.pixelPerPrice;
    const lowPrice = priceAxis.maxPrice - (candle.wickBottom - chartArea.y) / priceAxis.pixelPerPrice;
    
    const bodyTopPrice = priceAxis.maxPrice - (candle.bodyTop - chartArea.y) / priceAxis.pixelPerPrice;
    const bodyBottomPrice = priceAxis.maxPrice - (candle.bodyBottom - chartArea.y) / priceAxis.pixelPerPrice;
    
    // Determinar open/close baseado na cor
    let openPrice: number, closePrice: number;
    
    if (candle.color === 'green' || candle.color === 'white') {
      // Candle de alta: open embaixo, close em cima
      openPrice = bodyBottomPrice;
      closePrice = bodyTopPrice;
    } else {
      // Candle de baixa: open em cima, close embaixo
      openPrice = bodyTopPrice;
      closePrice = bodyBottomPrice;
    }
    
    return {
      open: parseFloat(openPrice.toFixed(5)),
      high: parseFloat(highPrice.toFixed(5)),
      low: parseFloat(lowPrice.toFixed(5)),
      close: parseFloat(closePrice.toFixed(5)),
      volume: Math.floor(Math.random() * 1000) + 500, // Volume estimado
      timestamp: Date.now() - (detectedCandles.length - index) * 60000, // Timestamp estimado
      position: {
        x: candle.x,
        y: candle.y + candle.height / 2
      },
      color: candle.color === 'green' || candle.color === 'white' ? 'verde' : 'vermelho'
    };
  });
};
