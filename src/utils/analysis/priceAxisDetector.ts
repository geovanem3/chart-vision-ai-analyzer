
import { toast } from "@/hooks/use-toast";
import { ChartArea, PriceAxis } from "./types";

export const detectPriceAxis = (chartArea: ChartArea): PriceAxis => {
  try {
    const axisX = chartArea.x + chartArea.width + 5;

    // --- HEURISTIC APPROACH V3: NORMALIZED PRICE SCALE ---
    // This approach removes all assumptions about specific assets or price ranges.
    // We create a normalized price scale from 0 to 1000 for readability.
    // This makes the analysis robust and independent of the chart's zoom or asset.
    const minPrice = 0;
    const maxPrice = 1000;
    
    const pixelPerPrice = chartArea.height > 0 ? chartArea.height / (maxPrice - minPrice) : 0;

    if (pixelPerPrice <= 0 || !isFinite(pixelPerPrice)) {
      console.warn('⚠️ PixelPerPrice inválido, usando valor padrão de emergência');
      return {
        minPrice: 0,
        maxPrice: 1000,
        pixelPerPrice: chartArea.height > 0 ? chartArea.height / 1000 : 1,
        axisX
      };
    }

    console.log(`Eixo de Preço Normalizado: Range 0-1000, Pixel/Preço=${pixelPerPrice.toFixed(2)}`);

    return {
      minPrice,
      maxPrice,
      pixelPerPrice,
      axisX
    };
  } catch (error) {
    console.error('❌ Erro na detecção do eixo de preços:', error);
    toast({
      variant: "error",
      title: "Erro de Detecção de Eixo",
      description: `Falha ao detectar o eixo de preços: ${String(error)}`,
    });
    // Return a safe default
    return {
      minPrice: 0,
      maxPrice: 1000,
      pixelPerPrice: chartArea.height > 0 ? chartArea.height / 1000 : 1,
      axisX: chartArea.x + chartArea.width
    };
  }
};
