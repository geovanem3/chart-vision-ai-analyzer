/**
 * Image processing utilities for chart analysis
 */

import { SelectedRegion } from '@/context/AnalyzerContext';

// Process the captured image to enhance chart features
export const processImage = async (imageUrl: string): Promise<{success: boolean; data: string; error?: string}> => {
  console.log('Processando imagem:', imageUrl);
  
  return new Promise((resolve) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              success: false,
              data: imageUrl,
              error: 'Falha ao criar contexto de canvas para processamento de imagem.'
            });
            return;
          }
          
          // Verificar dimensões mínimas
          if (img.width < 200 || img.height < 200) {
            resolve({
              success: false,
              data: imageUrl,
              error: 'Imagem muito pequena para processamento preciso. Recomenda-se usar imagens maiores.'
            });
            return;
          }
          
          // Desenhar a imagem original
          ctx.drawImage(img, 0, 0);
          
          // Verificar se a imagem tem variação suficiente (não é uma imagem em branco ou muito plana)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Calcular variância de luminosidade para verificar se a imagem tem detalhes suficientes
          let totalLuminance = 0;
          let pixelCount = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            totalLuminance += luminance;
            pixelCount++;
          }
          
          const avgLuminance = totalLuminance / pixelCount;
          let variance = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            variance += Math.pow(luminance - avgLuminance, 2);
          }
          
          variance /= pixelCount;
          
          // Se a variância for muito baixa, a imagem pode não ter detalhes suficientes
          if (variance < 100) {
            resolve({
              success: false,
              data: imageUrl,
              error: 'Imagem com baixo contraste ou poucos detalhes. A análise pode ser imprecisa.'
            });
            return;
          }
          
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
          
          resolve({
            success: true,
            data: canvas.toDataURL('image/jpeg')
          });
        } catch (e) {
          console.error('Erro durante o processamento de imagem:', e);
          resolve({
            success: false,
            data: imageUrl,
            error: 'Erro ao processar a imagem. Tente uma imagem diferente ou ajuste manualmente.'
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          data: imageUrl,
          error: 'Falha ao carregar a imagem para processamento.'
        });
      };
      
      img.src = imageUrl;
    } catch (e) {
      console.error('Erro ao iniciar processamento de imagem:', e);
      resolve({
        success: false,
        data: imageUrl,
        error: 'Erro inesperado ao processar a imagem.'
      });
    }
  });
};

// Extract chart region from the image if no region is manually selected
export const detectChartRegion = async (imageUrl: string): Promise<{
  success: boolean;
  data: { x: number; y: number; width: number; height: number } | null;
  error?: string;
}> => {
  console.log('Detectando região do gráfico em:', imageUrl);
  
  // Create an image element to get the dimensions
  return new Promise((resolve) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Analisar a imagem para detectar automaticamente a área do gráfico
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              success: false,
              data: null,
              error: 'Falha ao criar contexto de canvas para detecção de região.'
            });
            return;
          }
          
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
            resolve({
              success: true,
              data: { x: left, y: top, width, height }
            });
          } else {
            // Default para 80% da imagem centralizada
            const defaultWidth = img.width * 0.8;
            const defaultHeight = img.height * 0.8;
            const x = (img.width - defaultWidth) / 2;
            const y = (img.height - defaultHeight) / 2;
            
            resolve({
              success: false,
              data: { x, y, width: defaultWidth, height: defaultHeight },
              error: 'Não foi possível detectar automaticamente a região do gráfico com precisão. Ajuste manualmente para melhor resultado.'
            });
          }
        } catch (e) {
          console.error('Erro durante detecção de região:', e);
          
          // Fallback para 80% da imagem
          const width = img.width * 0.8;
          const height = img.height * 0.8;
          const x = (img.width - width) / 2;
          const y = (img.height - height) / 2;
          
          resolve({
            success: false,
            data: { x, y, width, height },
            error: 'Erro ao detectar região do gráfico. Ajuste manualmente para melhor resultado.'
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          data: null,
          error: 'Falha ao carregar a imagem para detecção de região.'
        });
      };
      
      img.src = imageUrl;
    } catch (e) {
      console.error('Erro ao iniciar detecção de região:', e);
      resolve({
        success: false,
        data: null,
        error: 'Erro inesperado ao detectar região do gráfico.'
      });
    }
  });
};

// Crop image to the selected region
export const cropToRegion = async (
  imageUrl: string, 
  region: SelectedRegion
): Promise<{success: boolean; data: string; error?: string}> => {
  console.log('Recortando para região:', region);
  
  return new Promise((resolve) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        try {
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
            } else {
              resolve({
                success: false,
                data: imageUrl,
                error: 'Falha ao criar contexto de canvas para recorte da região.'
              });
              return;
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
            } else {
              resolve({
                success: false,
                data: imageUrl,
                error: 'Falha ao criar contexto de canvas para recorte da região.'
              });
              return;
            }
          }
          
          resolve({
            success: true,
            data: canvas.toDataURL('image/jpeg', 1.0)
          });
        } catch (e) {
          console.error('Erro durante recorte da região:', e);
          resolve({
            success: false,
            data: imageUrl,
            error: 'Erro ao recortar a região selecionada.'
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          data: imageUrl,
          error: 'Falha ao carregar a imagem para recorte da região.'
        });
      };
      
      img.src = imageUrl;
    } catch (e) {
      console.error('Erro ao iniciar recorte da região:', e);
      resolve({
        success: false,
        data: imageUrl,
        error: 'Erro inesperado ao recortar a região.'
      });
    }
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
): Promise<{success: boolean; data: string; error?: string}> => {
  // Primeiro recorta a região
  const croppedResult = await cropToRegion(imageUrl, region);
  
  if (!croppedResult.success) {
    return croppedResult;
  }
  
  // Depois aplica processamento para realçar detalhes
  return processImage(croppedResult.data);
};

// Verificar se a imagem tem qualidade suficiente para análise
export const checkImageQuality = async (imageUrl: string): Promise<{
  isGoodQuality: boolean;
  message: string;
  details?: {
    resolution: string;
    contrast: string;
    noise: string;
  }
}> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Verificar resolução
          const hasGoodResolution = img.width >= 400 && img.height >= 300;
          
          // Criar canvas para análise de pixels
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              isGoodQuality: false,
              message: 'Não foi possível analisar a qualidade da imagem.'
            });
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Verificar contraste
          let minLuminance = 255;
          let maxLuminance = 0;
          let totalLuminance = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            minLuminance = Math.min(minLuminance, luminance);
            maxLuminance = Math.max(maxLuminance, luminance);
            totalLuminance += luminance;
          }
          
          const contrast = maxLuminance - minLuminance;
          const hasGoodContrast = contrast > 50;
          
          // Verificar ruído (simplificado)
          const avgLuminance = totalLuminance / (data.length / 4);
          let noiseEstimate = 0;
          
          for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
              const i = (y * canvas.width + x) * 4;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
              
              // Comparar com pixels vizinhos
              const iTop = ((y - 1) * canvas.width + x) * 4;
              const iBottom = ((y + 1) * canvas.width + x) * 4;
              const iLeft = (y * canvas.width + (x - 1)) * 4;
              const iRight = (y * canvas.width + (x + 1)) * 4;
              
              const luminanceTop = 0.299 * data[iTop] + 0.587 * data[iTop + 1] + 0.114 * data[iTop + 2];
              const luminanceBottom = 0.299 * data[iBottom] + 0.587 * data[iBottom + 1] + 0.114 * data[iBottom + 2];
              const luminanceLeft = 0.299 * data[iLeft] + 0.587 * data[iLeft + 1] + 0.114 * data[iLeft + 2];
              const luminanceRight = 0.299 * data[iRight] + 0.587 * data[iRight + 1] + 0.114 * data[iRight + 2];
              
              const diff = Math.abs(luminance - luminanceTop) + 
                          Math.abs(luminance - luminanceBottom) +
                          Math.abs(luminance - luminanceLeft) +
                          Math.abs(luminance - luminanceRight);
                          
              noiseEstimate += diff;
            }
          }
          
          // Normalizar a estimativa de ruído
          noiseEstimate /= (canvas.width - 2) * (canvas.height - 2);
          const hasLowNoise = noiseEstimate < 30;
          
          // Determinar qualidade global
          const isGoodQuality = hasGoodResolution && hasGoodContrast && hasLowNoise;
          
          // Preparar mensagem
          let message = isGoodQuality 
            ? 'Imagem com boa qualidade para análise.'
            : 'A qualidade da imagem pode afetar a precisão da análise.';
            
          if (!hasGoodResolution) {
            message += ' Resolução baixa.';
          }
          
          if (!hasGoodContrast) {
            message += ' Contraste insuficiente.';
          }
          
          if (!hasLowNoise) {
            message += ' Presença de ruído detectada.';
          }
          
          resolve({
            isGoodQuality,
            message,
            details: {
              resolution: hasGoodResolution ? 'Boa' : 'Baixa',
              contrast: hasGoodContrast ? 'Adequado' : 'Insuficiente',
              noise: hasLowNoise ? 'Baixo' : 'Alto'
            }
          });
        } catch (e) {
          console.error('Erro durante análise de qualidade:', e);
          resolve({
            isGoodQuality: false,
            message: 'Erro ao analisar a qualidade da imagem.'
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          isGoodQuality: false,
          message: 'Falha ao carregar a imagem para análise de qualidade.'
        });
      };
      
      img.src = imageUrl;
    } catch (e) {
      console.error('Erro ao iniciar análise de qualidade:', e);
      resolve({
        isGoodQuality: false,
        message: 'Erro inesperado ao analisar a qualidade da imagem.'
      });
    }
  });
};
