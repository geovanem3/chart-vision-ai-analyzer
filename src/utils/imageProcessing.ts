
/**
 * Image processing utilities for chart analysis
 */

import { SelectedRegion } from '@/context/AnalyzerContext';

// Process the captured image to enhance chart features
export const processImage = async (imageUrl: string): Promise<string> => {
  console.log('Processando imagem:', imageUrl);
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Desenhar a imagem original
        ctx.drawImage(img, 0, 0);
        
        // Aplicar melhorias para destacar elementos do gráfico
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Melhorar o contraste para destacar candles
        for (let i = 0; i < data.length; i += 4) {
          // Calcular luminosidade
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Aumentar contraste
          const threshold = 120;
          const factor = 1.2;
          
          if (luminance > threshold) {
            data[i] = Math.min(255, r * factor);
            data[i + 1] = Math.min(255, g * factor);
            data[i + 2] = Math.min(255, b * factor);
          } else {
            data[i] = r / factor;
            data[i + 1] = g / factor;
            data[i + 2] = b / factor;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } else {
        // Se não conseguir aplicar o processamento, retornar a imagem original
        resolve(imageUrl);
      }
    };
    img.src = imageUrl;
  });
};

// Extract chart region from the image if no region is manually selected
export const detectChartRegion = async (imageUrl: string): Promise<{ x: number; y: number; width: number; height: number } | null> => {
  console.log('Detectando região do gráfico em:', imageUrl);
  
  // Create an image element to get the dimensions
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Analisar a imagem para detectar automaticamente a área do gráfico
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Detectar bordas para encontrar a região do gráfico
        let left = canvas.width;
        let right = 0;
        let top = canvas.height;
        let bottom = 0;
        
        const threshold = 50; // Limiar para detectar mudanças significativas de cor
        
        // Varrer pixels para detectar limites do gráfico
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Detectar pixels que provavelmente fazem parte do gráfico
            // (Pixels não-brancos e não-pretos)
            if ((r + g + b) / 3 < 240 && (r + g + b) / 3 > 15) {
              if (x < left) left = x;
              if (x > right) right = x;
              if (y < top) top = y;
              if (y > bottom) bottom = y;
            }
          }
        }
        
        // Ajustar os limites para garantir que não percam parte importante do gráfico
        left = Math.max(0, left - 10);
        top = Math.max(0, top - 10);
        right = Math.min(canvas.width, right + 10);
        bottom = Math.min(canvas.height, bottom + 10);
        
        const width = right - left;
        const height = bottom - top;
        
        // Verificar se os limites detectados são razoáveis
        if (width > 50 && height > 50) {
          resolve({ x: left, y: top, width, height });
        } else {
          // Default para 80% da imagem centralizada
          const defaultWidth = img.width * 0.8;
          const defaultHeight = img.height * 0.8;
          const x = (img.width - defaultWidth) / 2;
          const y = (img.height - defaultHeight) / 2;
          
          resolve({ x, y, width: defaultWidth, height: defaultHeight });
        }
      } else {
        // Fallback para 80% da imagem
        const width = img.width * 0.8;
        const height = img.height * 0.8;
        const x = (img.width - width) / 2;
        const y = (img.height - height) / 2;
        
        resolve({ x, y, width, height });
      }
    };
    img.src = imageUrl;
  });
};

// Crop image to the selected region
export const cropToRegion = async (
  imageUrl: string, 
  region: SelectedRegion
): Promise<string> => {
  console.log('Recortando para região:', region);
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      if (region.type === 'rectangle') {
        canvas.width = region.width;
        canvas.height = region.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img, 
            region.x, region.y, region.width, region.height, 
            0, 0, region.width, region.height
          );
        }
      } else {
        // Para regiões circulares, o canvas deve acomodar o círculo
        const diameter = region.radius * 2;
        canvas.width = diameter;
        canvas.height = diameter;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Criar uma máscara circular
          ctx.beginPath();
          ctx.arc(region.radius, region.radius, region.radius, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          
          // Desenhar apenas a parte da imagem dentro do círculo
          ctx.drawImage(
            img,
            region.centerX - region.radius, region.centerY - region.radius,
            diameter, diameter,
            0, 0, diameter, diameter
          );
          
          // Adicionar uma borda fina para mostrar o limite da seleção
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(region.radius, region.radius, region.radius - 1, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };
    img.src = imageUrl;
  });
};

// Detectar elementos do gráfico (candles, linhas) a partir da imagem
export const extractChartElements = async (
  processedImageUrl: string
): Promise<{
  candles: { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho' }[];
  lines: { startX: number, startY: number, endX: number, endY: number }[];
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ candles: [], lines: [] });
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Estruturas para armazenar elementos detectados
      const candles: { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho' }[] = [];
      const lines: { startX: number, startY: number, endX: number, endY: number }[] = [];
      
      // Detectar possíveis candles verdes e vermelhos
      // Utilizamos uma abordagem mais refinada
      
      // Define o tamanho mínimo aproximado de um candle com base no tamanho da imagem
      const minCandleWidth = Math.max(3, Math.floor(canvas.width * 0.01));
      const minCandleHeight = Math.max(5, Math.floor(canvas.height * 0.02));
      
      // Mapa para rastrear regiões de cores
      const colorMap: { [key: string]: { color: 'verde' | 'vermelho', count: number, sumX: number, sumY: number } } = {};
      
      // Analisar os pixels para identificar regiões de cores
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Verificar se o pixel é verde (componente G dominante)
          if (g > r * 1.3 && g > b * 1.3 && g > 100) {
            const key = `${Math.floor(x / minCandleWidth)}_${Math.floor(y / minCandleHeight)}`;
            
            if (!colorMap[key]) {
              colorMap[key] = { color: 'verde', count: 0, sumX: 0, sumY: 0 };
            }
            
            colorMap[key].count++;
            colorMap[key].sumX += x;
            colorMap[key].sumY += y;
          }
          // Verificar se o pixel é vermelho (componente R dominante)
          else if (r > g * 1.3 && r > b * 1.3 && r > 100) {
            const key = `${Math.floor(x / minCandleWidth)}_${Math.floor(y / minCandleHeight)}`;
            
            if (!colorMap[key]) {
              colorMap[key] = { color: 'vermelho', count: 0, sumX: 0, sumY: 0 };
            }
            
            colorMap[key].count++;
            colorMap[key].sumX += x;
            colorMap[key].sumY += y;
          }
        }
      }
      
      // Criar candles a partir das regiões de cores identificadas
      for (const key in colorMap) {
        const region = colorMap[key];
        
        if (region.count > minCandleWidth * minCandleHeight * 0.2) {
          const centerX = Math.floor(region.sumX / region.count);
          const centerY = Math.floor(region.sumY / region.count);
          
          candles.push({
            x: centerX - minCandleWidth / 2,
            y: centerY - minCandleHeight / 2,
            width: minCandleWidth,
            height: minCandleHeight,
            color: region.color
          });
        }
      }
      
      // Detectar linhas horizontais (suporte/resistência)
      // Utilizamos a transformada de Hough simplificada para detecção de linhas
      
      const horizontalDensity = new Array(canvas.height).fill(0);
      
      // Calcular densidade horizontal
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          // Pixels escuros (possíveis linhas)
          if (data[i] + data[i + 1] + data[i + 2] < 200 * 3) {
            horizontalDensity[y]++;
          }
        }
      }
      
      // Detectar picos locais na densidade horizontal (possíveis linhas)
      const peakThreshold = canvas.width * 0.3; // Linha deve cobrir pelo menos 30% da largura
      const minPeakDistance = Math.ceil(canvas.height * 0.05); // Distância mínima entre picos
      
      let peaks: number[] = [];
      
      // Encontrar todos os picos
      for (let y = 5; y < canvas.height - 5; y++) {
        if (horizontalDensity[y] > peakThreshold) {
          let isPeak = true;
          
          // Verificar se é máximo local
          for (let dy = -2; dy <= 2; dy++) {
            if (dy !== 0 && y + dy >= 0 && y + dy < canvas.height) {
              if (horizontalDensity[y + dy] > horizontalDensity[y]) {
                isPeak = false;
                break;
              }
            }
          }
          
          if (isPeak) {
            peaks.push(y);
          }
        }
      }
      
      // Filtrar picos muito próximos
      if (peaks.length > 0) {
        const filteredPeaks = [peaks[0]];
        
        for (let i = 1; i < peaks.length; i++) {
          const lastPeak = filteredPeaks[filteredPeaks.length - 1];
          
          if (peaks[i] - lastPeak >= minPeakDistance) {
            filteredPeaks.push(peaks[i]);
          }
        }
        
        // Criar linhas horizontais a partir dos picos
        filteredPeaks.forEach(y => {
          lines.push({
            startX: 0,
            startY: y,
            endX: canvas.width,
            endY: y
          });
        });
      }
      
      // Retornar candles e linhas detectados
      resolve({
        candles: candles.slice(0, 50), // Limitar a 50 candles para performance
        lines: lines.slice(0, 10) // Limitar a 10 linhas para não sobrecarregar
      });
    };
    img.src = processedImageUrl;
  });
};

// Processar uma região específica da imagem (para seleção manual)
export const processRegionForAnalysis = async (
  imageUrl: string, 
  region: SelectedRegion
): Promise<string> => {
  // Primeiro recorta a região
  const croppedImage = await cropToRegion(imageUrl, region);
  
  // Depois aplica processamento para realçar detalhes
  return processImage(croppedImage);
};

