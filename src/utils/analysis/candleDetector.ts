
import { toast } from "@/hooks/use-toast";
import { ChartArea, DetectedCandle } from "./types";

export const detectIndividualCandles = (
  imageData: ImageData, 
  width: number, 
  height: number, 
  chartArea: ChartArea
): DetectedCandle[] => {
  try {
    console.log('🕯️ Iniciando detecção de candles individuais...');
    
    const data = imageData.data;
    const detectedCandles: DetectedCandle[] = [];
    
    // Parâmetros de detecção mais flexíveis
    const minCandleWidth = 3;
    const maxCandleWidth = 25;
    const minCandleHeight = 8;
    
    // Procurar por estruturas verticais que parecem candles
    for (let x = chartArea.x; x < chartArea.x + chartArea.width - minCandleWidth; x += 2) {
      let verticalStructure = 0;
      let topY = chartArea.y + chartArea.height;
      let bottomY = chartArea.y;
      let wickTop = chartArea.y + chartArea.height;
      let wickBottom = chartArea.y;
      let bodyTop = chartArea.y + chartArea.height;
      let bodyBottom = chartArea.y;
      let hasColorVariation = false;
      
      // Verificar coluna por estruturas verticais
      for (let y = chartArea.y; y < chartArea.y + chartArea.height; y++) {
        if (x >= width || y >= height) continue;
        
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Detectar elementos do candle (linhas verticais e corpos)
        const isVerticalElement = 
          // Linha fina (wick)
          (Math.abs(r - g) < 15 && Math.abs(r - b) < 15 && r > 100) ||
          // Corpo verde
          (g > r + 20 && g > b + 20) ||
          // Corpo vermelho
          (r > g + 20 && r > b + 20) ||
          // Corpo preto/branco
          (r < 60 && g < 60 && b < 60) ||
          (r > 200 && g > 200 && b > 200);
        
        if (isVerticalElement) {
          verticalStructure++;
          topY = Math.min(topY, y);
          bottomY = Math.max(bottomY, y);
          
          // Detectar se é wick (linha fina) ou corpo
          const isWick = Math.abs(r - g) < 15 && Math.abs(r - b) < 15;
          const isBody = (g > r + 20) || (r > g + 20) || (r < 60 && g < 60 && b < 60) || (r > 200 && g > 200 && b > 200);
          
          if (isWick) {
            wickTop = Math.min(wickTop, y);
            wickBottom = Math.max(wickBottom, y);
          }
          
          if (isBody) {
            bodyTop = Math.min(bodyTop, y);
            bodyBottom = Math.max(bodyBottom, y);
            hasColorVariation = true;
          }
        }
      }
      
      // Validar se encontrou uma estrutura de candle válida
      const candleHeight = bottomY - topY;
      const bodyHeight = bodyBottom - bodyTop;
      
      if (verticalStructure >= minCandleHeight && 
          candleHeight >= minCandleHeight && 
          hasColorVariation &&
          bodyHeight > 0) {
        
        // Determinar largura do candle
        let candleWidth = minCandleWidth;
        for (let w = 1; w <= maxCandleWidth && x + w < chartArea.x + chartArea.width; w++) {
          let hasStructure = false;
          for (let y = topY; y <= bottomY && y < height; y++) {
            if (x + w >= width) break;
            const i = (y * width + (x + w)) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if ((g > r + 15) || (r > g + 15) || (r < 80 && g < 80) || (r > 180 && g > 180)) {
              hasStructure = true;
              break;
            }
          }
          if (hasStructure) {
            candleWidth = w;
          } else {
            break;
          }
        }
        
        // Determinar cor do candle
        let color: 'green' | 'red' | 'black' | 'white' = 'black';
        
        // Amostrar cor do corpo do candle
        const midBodyY = Math.floor((bodyTop + bodyBottom) / 2);
        const midBodyX = Math.floor(x + candleWidth / 2);
        
        if (midBodyX < width && midBodyY < height) {
          const i = (midBodyY * width + midBodyX) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (g > r + 20 && g > b + 10) {
            color = 'green';
          } else if (r > g + 20 && r > b + 10) {
            color = 'red';
          } else if (r > 200 && g > 200 && b > 200) {
            color = 'white';
          } else {
            color = 'black';
          }
        }
        
        // Calcular confiança baseada na estrutura
        const confidence = Math.min(0.95, 
          (verticalStructure / candleHeight) * 
          (hasColorVariation ? 1.2 : 0.8) * 
          (bodyHeight / candleHeight > 0.3 ? 1.1 : 0.9)
        );
        
        const candle: DetectedCandle = {
          x: x,
          y: topY,
          width: candleWidth,
          height: candleHeight,
          bodyTop: bodyTop || topY,
          bodyBottom: bodyBottom || bottomY,
          wickTop: wickTop || topY,
          wickBottom: wickBottom || bottomY,
          color,
          confidence
        };
        
        detectedCandles.push(candle);
        
        // Pular para a próxima área para evitar detectar o mesmo candle
        x += candleWidth + 1;
      }
    }
    
    // Filtrar candles sobrepostos
    const filteredCandles = detectedCandles.filter((candle, index) => {
      return !detectedCandles.some((other, otherIndex) => 
        otherIndex !== index &&
        Math.abs(candle.x - other.x) < 5 &&
        other.confidence > candle.confidence
      );
    });
    
    console.log(`✅ Detectados ${filteredCandles.length} candles válidos`);
    
    return filteredCandles.slice(0, 50); // Limitar a 50 candles para performance
    
  } catch (error) {
    console.error('❌ Erro na detecção de candles:', error);
    toast({
      variant: "error",
      title: "Erro de Detecção de Candles",
      description: `Falha ao detectar candles: ${String(error)}`,
    });
    return [];
  }
};
