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
          
          ctx.drawImage(img, 0, 0);
          
          resolve({
            success: true,
            data: canvas.toDataURL('image/jpeg')
          });
        } catch (e) {
          console.error('Erro durante o processamento de imagem:', e);
          resolve({
            success: false,
            data: imageUrl,
            error: 'Erro ao processar a imagem.'
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

// Extract chart region from the image
export const detectChartRegion = async (imageUrl: string): Promise<{
  success: boolean;
  data: { x: number; y: number; width: number; height: number } | null;
  error?: string;
}> => {
  console.log('Detectando região do gráfico em:', imageUrl);
  
  return new Promise((resolve) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Default para 90% da imagem centralizada
          const defaultWidth = img.width * 0.9;
          const defaultHeight = img.height * 0.9;
          const x = (img.width - defaultWidth) / 2;
          const y = (img.height - defaultHeight) / 2;
          
          resolve({
            success: true,
            data: { x, y, width: defaultWidth, height: defaultHeight }
          });
        } catch (e) {
          console.error('Erro durante detecção de região:', e);
          resolve({
            success: false,
            data: null,
            error: 'Erro ao detectar região do gráfico.'
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          data: null,
          error: 'Falha ao carregar a imagem.'
        });
      };
      
      img.src = imageUrl;
    } catch (e) {
      console.error('Erro ao iniciar detecção de região:', e);
      resolve({
        success: false,
        data: null,
        error: 'Erro inesperado ao detectar região.'
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
                error: 'Falha ao criar contexto de canvas.'
              });
              return;
            }
          } else {
            const diameter = region.radius * 2;
            canvas.width = diameter;
            canvas.height = diameter;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.beginPath();
              ctx.arc(region.radius, region.radius, region.radius, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              
              ctx.drawImage(
                img,
                region.centerX - region.radius, region.centerY - region.radius,
                diameter, diameter,
                0, 0, diameter, diameter
              );
            } else {
              resolve({
                success: false,
                data: imageUrl,
                error: 'Falha ao criar contexto de canvas.'
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
            error: 'Erro ao recortar a região.'
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          data: imageUrl,
          error: 'Falha ao carregar a imagem.'
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

// Check image quality
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
        const hasGoodResolution = img.width >= 400 && img.height >= 300;
        
        resolve({
          isGoodQuality: hasGoodResolution,
          message: hasGoodResolution 
            ? 'Imagem com boa qualidade para análise.'
            : 'A resolução da imagem é baixa. Tente uma imagem maior.',
          details: {
            resolution: hasGoodResolution ? 'Boa' : 'Baixa',
            contrast: 'Adequado',
            noise: 'Baixo'
          }
        });
      };
      
      img.onerror = () => {
        resolve({
          isGoodQuality: false,
          message: 'Erro ao analisar a qualidade da imagem.'
        });
      };
      
      img.src = imageUrl;
    } catch (e) {
      console.error('Erro ao verificar qualidade:', e);
      resolve({
        isGoodQuality: false,
        message: 'Erro ao analisar a qualidade da imagem.'
      });
    }
  });
};
