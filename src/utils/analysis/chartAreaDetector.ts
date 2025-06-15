
import { toast } from "@/hooks/use-toast";
import { ChartArea } from "./types";

export const detectChartArea = (imageData: ImageData, width: number, height: number): ChartArea => {
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
    toast({
      variant: "error",
      title: "Erro de Detecção de Área",
      description: `Falha ao detectar a área do gráfico: ${String(error)}`,
    });
    return { x: 0, y: 0, width, height };
  }
};
