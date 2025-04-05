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
          
          // Aplicar processamento avançado para destacar os candles
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Aplicar método de detecção de bordas para realçar a estrutura dos candles
          const enhancedData = enhanceEdges(data, canvas.width, canvas.height);
          
          // Aplicar filtro de cor para destacar candles verdes e vermelhos
          highlightCandleColors(enhancedData, canvas.width, canvas.height);
          
          // Atualizar dados da imagem
          for (let i = 0; i < data.length; i++) {
            data[i] = enhancedData[i];
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
  candles: { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho', confidence: number }[];
  lines: { startX: number, startY: number, endX: number, endY: number, confidence: number }[];
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
      const candles: { 
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        color: 'verde' | 'vermelho',
        confidence: number
      }[] = [];
      
      const lines: { 
        startX: number, 
        startY: number, 
        endX: number, 
        endY: number,
        confidence: number
      }[] = [];
      
      // Implementar algoritmo avançado de detecção de candles usando segmentação
      const candleSegments = segmentCandlePatterns(data, canvas.width, canvas.height);
      
      // Processar os segmentos detectados para identificar candles
      for (const segment of candleSegments) {
        // Analisar características do segmento para determinar se é um candle
        const candleData = analyzeCandleSegment(segment, data, canvas.width, canvas.height);
        
        if (candleData) {
          candles.push(candleData);
        }
      }
      
      // Detectar linhas de suporte/resistência usando análise de histograma aprimorada
      const detectedLines = detectSupportResistanceLines(data, canvas.width, canvas.height);
      lines.push(...detectedLines);
      
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

// Função para melhorar a detecção de bordas nos candles
const enhanceEdges = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
  const output = new Uint8ClampedArray(data.length);
  
  // Copiar dados originais
  for (let i = 0; i < data.length; i++) {
    output[i] = data[i];
  }
  
  // Aplicar filtro Sobel para detecção de bordas
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      // Pixels vizinhos para o operador Sobel
      const topLeft = ((y - 1) * width + (x - 1)) * 4;
      const top = ((y - 1) * width + x) * 4;
      const topRight = ((y - 1) * width + (x + 1)) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;
      const bottomLeft = ((y + 1) * width + (x - 1)) * 4;
      const bottom = ((y + 1) * width + x) * 4;
      const bottomRight = ((y + 1) * width + (x + 1)) * 4;
      
      // Calcular gradientes usando operador Sobel
      const gx = (
        data[topRight] - data[topLeft] +
        2 * data[right] - 2 * data[left] +
        data[bottomRight] - data[bottomLeft]
      ) / 4;
      
      const gy = (
        data[bottomLeft] - data[topLeft] +
        2 * data[bottom] - 2 * data[top] +
        data[bottomRight] - data[topRight]
      ) / 4;
      
      // Magnitude do gradiente
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      // Aplicar limiar para destacar apenas bordas significativas
      if (magnitude > 25) {
        output[pixelIndex] = 255;       // R
        output[pixelIndex + 1] = 255;   // G
        output[pixelIndex + 2] = 255;   // B
        output[pixelIndex + 3] = 255;   // A
      }
    }
  }
  
  return output;
};

// Função para destacar cores específicas de candles (verde/vermelho)
const highlightCandleColors = (data: Uint8ClampedArray, width: number, height: number): void => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Detectar e realçar pixels verdes (candles de alta)
    if (g > 1.5 * r && g > 1.5 * b && g > 50) {
      data[i] = 0;                // R
      data[i + 1] = Math.min(255, g * 1.5);  // G (aumentar intensidade)
      data[i + 2] = 0;            // B
    }
    // Detectar e realçar pixels vermelhos (candles de baixa)
    else if (r > 1.5 * g && r > 1.5 * b && r > 50) {
      data[i] = Math.min(255, r * 1.5);      // R (aumentar intensidade)
      data[i + 1] = 0;            // G
      data[i + 2] = 0;            // B
    }
  }
};

// Usar segmentação para identificar padrões de candles
const segmentCandlePatterns = (
  data: Uint8ClampedArray, 
  width: number, 
  height: number
): {x1: number, y1: number, x2: number, y2: number, area: number}[] => {
  // Criar um mapa de cores para identificar possíveis candles
  const colorMap = new Array(width * height).fill(0);
  
  // Identificar pixels que podem ser parte de candles (verde ou vermelho)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Marcar pixels verdes
      if (g > 1.3 * r && g > 1.3 * b && g > 80) {
        colorMap[y * width + x] = 1; // 1 = verde
      }
      // Marcar pixels vermelhos
      else if (r > 1.3 * g && r > 1.3 * b && r > 80) {
        colorMap[y * width + x] = 2; // 2 = vermelho
      }
    }
  }
  
  // Usar um algoritmo de agrupamento para identificar regiões contíguas de mesma cor
  const segments: {x1: number, y1: number, x2: number, y2: number, area: number}[] = [];
  const visited = new Set<number>();
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Pular pixels que não são candles ou já foram visitados
      if (colorMap[idx] === 0 || visited.has(idx)) {
        continue;
      }
      
      // Iniciar busca em profundidade para encontrar região contígua
      const color = colorMap[idx];
      let minX = x, maxX = x, minY = y, maxY = y;
      let area = 0;
      
      const queue: [number, number][] = [[x, y]];
      visited.add(idx);
      
      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        area++;
        
        // Atualizar limites do segmento
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        
        // Verificar pixels vizinhos (4-conectividade)
        const neighbors = [
          [cx-1, cy], [cx+1, cy], [cx, cy-1], [cx, cy+1]
        ];
        
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = ny * width + nx;
            
            if (colorMap[nidx] === color && !visited.has(nidx)) {
              queue.push([nx, ny]);
              visited.add(nidx);
            }
          }
        }
      }
      
      // Filtrar segmentos muito pequenos (ruído)
      if (area >= 5 && (maxX - minX) > 0 && (maxY - minY) > 0) {
        segments.push({
          x1: minX,
          y1: minY,
          x2: maxX,
          y2: maxY,
          area
        });
      }
    }
  }
  
  return segments;
};

// Analisar um segmento para determinar se é um candle e suas características
const analyzeCandleSegment = (
  segment: {x1: number, y1: number, x2: number, y2: number, area: number},
  data: Uint8ClampedArray,
  width: number,
  height: number
): { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho', confidence: number } | null => {
  const { x1, y1, x2, y2, area } = segment;
  const segWidth = x2 - x1 + 1;
  const segHeight = y2 - y1 + 1;
  
  // Verificar se o segmento tem proporções típicas de um candle
  // (geralmente mais alto que largo)
  if (segHeight < segWidth) {
    return null; // Provavelmente não é um candle
  }
  
  // Analisar cores dentro do segmento
  let redCount = 0, greenCount = 0;
  
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (g > 1.3 * r && g > 1.3 * b && g > 80) {
        greenCount++;
      }
      else if (r > 1.3 * g && r > 1.3 * b && r > 80) {
        redCount++;
      }
    }
  }
  
  // Determinar a cor predominante
  const totalColorPixels = redCount + greenCount;
  if (totalColorPixels < 5) {
    return null; // Não há pixels coloridos suficientes
  }
  
  const color: 'verde' | 'vermelho' = greenCount > redCount ? 'verde' : 'vermelho';
  
  // Calcular confiança baseada na densidade de pixels da cor correta
  const colorRatio = (color === 'verde' ? greenCount : redCount) / totalColorPixels;
  const densityRatio = totalColorPixels / (segWidth * segHeight);
  const confidence = Math.min(100, Math.round(colorRatio * densityRatio * 100));
  
  // Filtrar candles com baixa confiança
  if (confidence < 25) {
    return null;
  }
  
  return {
    x: x1,
    y: y1,
    width: segWidth,
    height: segHeight,
    color,
    confidence
  };
};

// Detecção aprimorada de linhas de suporte e resistência
const detectSupportResistanceLines = (
  data: Uint8ClampedArray,
  width: number,
  height: number
): { startX: number, startY: number, endX: number, endY: number, confidence: number }[] => {
  // Calcular histograma horizontal de pixels escuros
  const horizontalDensity = new Array(height).fill(0);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Detectar pixels escuros (possíveis linhas)
      if (data[i] + data[i + 1] + data[i + 2] < 150 * 3) {
        horizontalDensity[y]++;
      }
    }
  }
  
  // Suavizar o histograma para reduzir ruído
  const smoothedDensity = new Array(height).fill(0);
  const kernelSize = 5;
  const halfKernel = Math.floor(kernelSize / 2);
  
  for (let y = 0; y < height; y++) {
    let sum = 0, count = 0;
    
    for (let k = -halfKernel; k <= halfKernel; k++) {
      const idx = y + k;
      if (idx >= 0 && idx < height) {
        sum += horizontalDensity[idx];
        count++;
      }
    }
    
    smoothedDensity[y] = sum / count;
  }
  
  // Detectar picos no histograma suavizado (possíveis linhas)
  const peakThreshold = width * 0.2; // Linha deve cobrir pelo menos 20% da largura
  const minPeakDistance = Math.ceil(height * 0.03); // Distância mínima entre picos
  
  const peaks: number[] = [];
  
  for (let y = 2; y < height - 2; y++) {
    if (smoothedDensity[y] > peakThreshold) {
      // Verificar se é um máximo local
      if (
        smoothedDensity[y] > smoothedDensity[y - 1] &&
        smoothedDensity[y] > smoothedDensity[y - 2] &&
        smoothedDensity[y] > smoothedDensity[y + 1] &&
        smoothedDensity[y] > smoothedDensity[y + 2]
      ) {
        // Verificar se está distante o suficiente de outros picos
        let isFarEnough = true;
        
        for (const existingPeak of peaks) {
          if (Math.abs(existingPeak - y) < minPeakDistance) {
            isFarEnough = false;
            break;
          }
        }
        
        if (isFarEnough) {
          peaks.push(y);
        }
      }
    }
  }
  
  // Converter picos em linhas horizontais
  const lines: { startX: number, startY: number, endX: number, endY: number, confidence: number }[] = [];
  
  for (const y of peaks) {
    // Calcular confiança baseada na densidade de pixels
    const confidence = Math.min(100, Math.round((smoothedDensity[y] / width) * 100));
    
    lines.push({
      startX: 0,
      startY: y,
      endX: width - 1,
      endY: y,
      confidence
    });
  }
  
  return lines;
};
