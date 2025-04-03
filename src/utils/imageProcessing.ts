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
      // Utilizamos uma abordagem simplificada para demonstração
      // Em uma implementação real, usaríamos algoritmos de visão computacional
      
      // Este é um algoritmo simplificado
      let columnData: { sum: number, count: number }[] = new Array(canvas.width).fill(null).map(() => ({ sum: 0, count: 0 }));
      
      // Acumular densidade vertical de pixels não-brancos em cada coluna
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Verificar se o pixel provavelmente pertence a um elemento do gráfico
          if ((r + g + b) / 3 < 240) {
            columnData[x].sum += 1;
            columnData[x].count += 1;
            
            // Verificar se o pixel é predominantemente verde ou vermelho
            if (g > r * 1.2 && g > b * 1.2) {
              // Provavelmente verde
              const candleWidth = 5; // Largura estimada do candle
              let found = false;
              
              // Verificar se já existe um candle verde nesta região
              for (const candle of candles) {
                if (candle.color === 'verde' && Math.abs(candle.x - x) < candleWidth) {
                  found = true;
                  break;
                }
              }
              
              if (!found) {
                candles.push({
                  x,
                  y: y - 10, // Estimativa da posição y
                  width: candleWidth,
                  height: 20, // Altura estimada
                  color: 'verde'
                });
              }
            } else if (r > g * 1.2 && r > b * 1.2) {
              // Provavelmente vermelho
              const candleWidth = 5; // Largura estimada do candle
              let found = false;
              
              // Verificar se já existe um candle vermelho nesta região
              for (const candle of candles) {
                if (candle.color === 'vermelho' && Math.abs(candle.x - x) < candleWidth) {
                  found = true;
                  break;
                }
              }
              
              if (!found) {
                candles.push({
                  x,
                  y: y - 10, // Estimativa da posição y
                  width: candleWidth,
                  height: 20, // Altura estimada
                  color: 'vermelho'
                });
              }
            }
          }
        }
      }
      
      // Filtrar candles para remover detecções em excesso
      // Esta é uma simplificação - em um sistema real usaríamos algoritmos mais sofisticados
      const filteredCandles = candles.filter((candle, index) => {
        // Remover candles muito próximos
        for (let i = 0; i < index; i++) {
          if (Math.abs(candles[i].x - candle.x) < 10) {
            return false;
          }
        }
        return true;
      });
      
      // Detectar linhas horizontais (suporte/resistência)
      // Este é um algoritmo simplificado para demonstração
      const horizontalDensity: number[] = new Array(canvas.height).fill(0);
      
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          // Calcular um limiar para os pixels que podem ser linhas
          if ((data[i] + data[i + 1] + data[i + 2]) / 3 < 200) {
            horizontalDensity[y]++;
          }
        }
      }
      
      // Identificar picos de densidade como possíveis linhas horizontais
      for (let y = 10; y < canvas.height - 10; y++) {
        if (horizontalDensity[y] > canvas.width * 0.5 && 
            horizontalDensity[y] > horizontalDensity[y-1] && 
            horizontalDensity[y] > horizontalDensity[y+1]) {
          lines.push({
            startX: 0,
            startY: y,
            endX: canvas.width,
            endY: y
          });
        }
      }
      
      resolve({
        candles: filteredCandles,
        lines
      });
    };
    img.src = processedImageUrl;
  });
};
