
import { toast } from "@/hooks/use-toast";
import { ChartArea, DetectedCandle } from "./types";

const analyzeCandleColumn = (
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  x: number, 
  chartArea: ChartArea, 
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
        
        // --- ROBUST COLOR DETECTION V2 ---
        const greenDominance = g - r;
        const redDominance = r - g;
        // Check if color is saturated enough (not gray) and bright enough
        const isSaturated = Math.abs(r - g) > 15 && (r > 50 || g > 50 || b < 200);

        if (isSaturated) {
            if (greenDominance > 10 && greenDominance > maxColorConfidence) {
                maxColorConfidence = greenDominance;
                bestColor = 'green';
            } else if (redDominance > 10 && redDominance > maxColorConfidence) {
                maxColorConfidence = redDominance;
                bestColor = 'red';
            }
        } else { // Fallback for black/white themes
            const isBlack = r < 80 && g < 80 && b < 80;
            const isWhite = r > 200 && g > 200 && b > 200;

            if (isBlack && (150 - r) > maxColorConfidence) { // Use lower confidence for black
                maxColorConfidence = 150 - r;
                bestColor = 'black';
            } else if (isWhite && r > maxColorConfidence) {
                maxColorConfidence = r;
                bestColor = 'white';
            }
        }
      }
      
      if (maxColorConfidence > 30) { // Increased confidence threshold
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
            (bestColor === 'green' && g > r) ||
            (bestColor === 'red' && r > g) ||
            (bestColor === 'black' && r < 100 && g < 100 && b < 100) ||
            (bestColor === 'white' && r > 180 && g > 180 && b > 180);
          
          if (matchesColor) bodyPixels++;
        }
        
        if (bodyPixels >= candleWidth * 0.5) { // Needs to be a solid body
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

export const detectIndividualCandles = (imageData: ImageData, width: number, height: number, chartArea: ChartArea): DetectedCandle[] => {
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
    toast({
      variant: "error",
      title: "Erro na Detecção de Candles",
      description: `Falha ao detectar os candles individuais: ${String(error)}`,
    });
    return [];
  }
};
