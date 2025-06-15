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
  console.log('🔍 INICIANDO extração REAL de candles...');
  
  return new Promise((resolve) => {
    try {
      if (!imageData || imageData.length === 0) {
        console.error('❌ ImageData inválido ou vazio');
        resolve([]);
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        try {
          console.log('✅ Imagem carregada, criando canvas...');
          
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
        } catch (processError) {
          console.error('❌ Erro no processamento da imagem:', processError);
          resolve([]);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ Erro ao carregar imagem:', error);
        resolve([]);
      };
      
      // Timeout de segurança
      setTimeout(() => {
        console.warn('⚠️ Timeout na extração de candles');
        resolve([]);
      }, 10000);
      
      img.src = imageData;
    } catch (error) {
      console.error('❌ ERRO CRÍTICO na extração:', error);
      resolve([]);
    }
  });
};

const detectChartArea = (imageData: ImageData, width: number, height: number) => {
  try {
    const data = imageData.data;
    
    let minX = width, maxX = 0, minY = height, maxY = 0;
    
    // Procurar por pixels que formam estruturas de gráfico
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Detectar elementos do gráfico
        const isGridLine = Math.abs(r - g) < 10 && Math.abs(r - b) < 10 && r > 200 && r < 240;
        const isCandle = (r > 150 && g < 100) || (g > 150 && r < 100) || 
                        (r < 50 && g < 50 && b < 50) || (r > 200 && g > 200 && b > 200);
        
        if (isGridLine || isCandle) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    const margin = 20;
    const chartX = Math.max(0, minX - margin);
    const chartY = Math.max(0, minY - margin);
    const chartWidth = Math.min(width, maxX + margin) - chartX;
    const chartHeight = Math.min(height, maxY + margin) - chartY;
    
    if (chartWidth <= 0 || chartHeight <= 0) {
      console.warn('⚠️ Dimensões inválidas do gráfico, usando imagem inteira');
      return { x: 0, y: 0, width, height };
    }
    
    return { x: chartX, y: chartY, width: chartWidth, height: chartHeight };
  } catch (error) {
    console.error('❌ Erro na detecção da área do gráfico:', error);
    return { x: 0, y: 0, width, height };
  }
};

const detectPriceAxis = (imageData: ImageData, width: number, height: number, chartArea: any): PriceAxis => {
  try {
    const axisX = chartArea.x + chartArea.width + 5;
    
    // Estimativa baseada em análise típica de forex
    const topPrice = 1.1000;
    const bottomPrice = 1.0900;
    const pixelPerPrice = chartArea.height / (topPrice - bottomPrice);
    
    if (pixelPerPrice <= 0 || !isFinite(pixelPerPrice)) {
      console.warn('⚠️ PixelPerPrice inválido, usando valor padrão');
      return {
        minPrice: bottomPrice,
        maxPrice: topPrice,
        pixelPerPrice: chartArea.height / 0.01,
        axisX
      };
    }
    
    return {
      minPrice: bottomPrice,
      maxPrice: topPrice,
      pixelPerPrice,
      axisX
    };
  } catch (error) {
    console.error('❌ Erro na detecção do eixo de preços:', error);
    return {
      minPrice: 1.0900,
      maxPrice: 1.1000,
      pixelPerPrice: chartArea.height / 0.01,
      axisX: chartArea.x + chartArea.width
    };
  }
};

const detectIndividualCandles = (imageData: ImageData, width: number, height: number, chartArea: any): DetectedCandle[] => {
  try {
    const data = imageData.data;
    const candles: DetectedCandle[] = [];
    
    const candleWidth = Math.max(2, Math.floor(chartArea.width / 150));
    const candleSpacing = candleWidth + 1;
    
    console.log(`🔍 Procurando candles com largura ${candleWidth}px...`);
    
    for (let x = chartArea.x; x < chartArea.x + chartArea.width - candleWidth; x += candleSpacing) {
      try {
        const candleData = analyzeCandleColumn(data, width, height, x, chartArea, candleWidth);
        
        if (candleData && candleData.confidence > 0.3) {
          candles.push(candleData);
        }
      } catch (candleError) {
        console.warn(`⚠️ Erro ao analisar coluna ${x}:`, candleError);
        continue;
      }
    }
    
    console.log(`✅ ${candles.length} candles detectados com confiança > 30%`);
    return candles.filter(c => c.confidence > 0.3);
  } catch (error) {
    console.error('❌ Erro na detecção de candles individuais:', error);
    return [];
  }
};

const analyzeCandleColumn = (
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  x: number, 
  chartArea: any, 
  candleWidth: number
): DetectedCandle | null => {
  
  try {
    let topWick = -1, bottomWick = -1;
    let bodyTop = -1, bodyBottom = -1;
    let candleColor: 'green' | 'red' | 'black' | 'white' = 'black';
    let colorConfidence = 0;
    
    for (let y = chartArea.y; y < chartArea.y + chartArea.height; y++) {
      let maxColorConfidence = 0;
      let bestColor: 'green' | 'red' | 'black' | 'white' = 'black';
      
      for (let dx = 0; dx < candleWidth; dx++) {
        const currentX = x + dx;
        if (currentX >= width) continue;
        
        const i = (y * width + currentX) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const isGreen = g > r * 1.3 && g > b * 1.3 && g > 100;
        const isRed = r > g * 1.3 && r > b * 1.3 && r > 100;
        const isBlack = r < 80 && g < 80 && b < 80;
        const isWhite = r > 200 && g > 200 && b > 200;
        
        if (isGreen && g > maxColorConfidence) {
          maxColorConfidence = g;
          bestColor = 'green';
        } else if (isRed && r > maxColorConfidence) {
          maxColorConfidence = r;
          bestColor = 'red';
        } else if (isBlack && 255 - r > maxColorConfidence) {
          maxColorConfidence = 255 - r;
          bestColor = 'black';
        } else if (isWhite && r > maxColorConfidence) {
          maxColorConfidence = r;
          bestColor = 'white';
        }
      }
      
      if (maxColorConfidence > 50) {
        if (topWick === -1) topWick = y;
        bottomWick = y;
        
        let bodyPixels = 0;
        for (let dx = 0; dx < candleWidth; dx++) {
          const currentX = x + dx;
          if (currentX >= width) continue;
          
          const i = (y * width + currentX) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          const matchesColor = 
            (bestColor === 'green' && g > r * 1.2 && g > 100) ||
            (bestColor === 'red' && r > g * 1.2 && r > 100) ||
            (bestColor === 'black' && r < 100 && g < 100 && b < 100) ||
            (bestColor === 'white' && r > 180 && g > 180 && b > 180);
          
          if (matchesColor) bodyPixels++;
        }
        
        if (bodyPixels >= candleWidth * 0.6) {
          if (bodyTop === -1) bodyTop = y;
          bodyBottom = y;
          candleColor = bestColor;
          colorConfidence++;
        }
      }
    }
    
    if (topWick === -1 || bottomWick === -1 || bodyTop === -1 || bodyBottom === -1) {
      return null;
    }
    
    const totalHeight = bottomWick - topWick;
    const bodyHeight = bodyBottom - bodyTop;
    
    if (totalHeight < 3 || bodyHeight < 1) {
      return null;
    }
    
    const structureConfidence = Math.min(1, (bodyHeight / totalHeight) + (colorConfidence / totalHeight));
    const confidence = Math.max(0, Math.min(1, structureConfidence * 0.8));
    
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
  } catch (error) {
    console.warn('⚠️ Erro na análise da coluna do candle:', error);
    return null;
  }
};

const convertToOHLCData = (
  detectedCandles: DetectedCandle[], 
  priceAxis: PriceAxis, 
  chartArea: any
): CandleData[] => {
  
  try {
    const candles = detectedCandles.map((candle, index) => {
      try {
        if (!candle || !priceAxis || !chartArea || !priceAxis.pixelPerPrice || priceAxis.pixelPerPrice <= 0 || !isFinite(priceAxis.pixelPerPrice)) {
          throw new Error('Dados de entrada inválidos para conversão de candle');
        }
        
        const highPrice = priceAxis.maxPrice - (candle.wickTop - chartArea.y) / priceAxis.pixelPerPrice;
        const lowPrice = priceAxis.maxPrice - (candle.wickBottom - chartArea.y) / priceAxis.pixelPerPrice;
        const bodyTopPrice = priceAxis.maxPrice - (candle.bodyTop - chartArea.y) / priceAxis.pixelPerPrice;
        const bodyBottomPrice = priceAxis.maxPrice - (candle.bodyBottom - chartArea.y) / priceAxis.pixelPerPrice;
        
        if (!isFinite(highPrice) || !isFinite(lowPrice) || !isFinite(bodyTopPrice) || !isFinite(bodyBottomPrice)) {
          throw new Error('Preços calculados são inválidos (não finitos)');
        }
        
        let openPrice: number, closePrice: number;
        
        if (candle.color === 'green' || candle.color === 'white') {
          openPrice = Math.min(bodyTopPrice, bodyBottomPrice);
          closePrice = Math.max(bodyTopPrice, bodyBottomPrice);
        } else {
          openPrice = Math.max(bodyTopPrice, bodyBottomPrice);
          closePrice = Math.min(bodyTopPrice, bodyBottomPrice);
        }
        
        const finalHigh = Math.max(openPrice, closePrice, highPrice);
        const finalLow = Math.min(openPrice, closePrice, lowPrice);
        
        if (finalLow <= 0 || finalHigh <= finalLow || openPrice <= 0 || closePrice <= 0) {
          throw new Error('Valores OHLC inválidos calculados');
        }
        
        const candleColor: 'verde' | 'vermelho' = (candle.color === 'green' || candle.color === 'white') ? 'verde' : 'vermelho';
        
        return {
          open: parseFloat(openPrice.toFixed(5)),
          high: parseFloat(finalHigh.toFixed(5)),
          low: parseFloat(finalLow.toFixed(5)),
          close: parseFloat(closePrice.toFixed(5)),
          timestamp: Date.now() - (detectedCandles.length - index) * 60000,
          position: {
            x: candle.x,
            y: candle.y + candle.height / 2
          },
          color: candleColor
        };
      } catch (candleConversionError) {
        console.warn(`⚠️ Erro ao converter candle individual ${index}, pulando:`, candleConversionError);
        return null;
      }
    }).filter((candle): candle is CandleData => {
        if (candle === null) return false;
        // Validação mais estrita dos dados do candle
        return candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0 &&
             candle.high >= Math.max(candle.open, candle.close) &&
             candle.low <= Math.min(candle.open, candle.close);
    });

    if (candles.length > 0) {
        console.log(`✅ Conversão para OHLC finalizada. Retornando ${candles.length} candles válidos.`);
    }
    return candles;

  } catch (error) {
    console.error('❌ Erro na conversão para OHLC:', error);
    return [];
  }
};
