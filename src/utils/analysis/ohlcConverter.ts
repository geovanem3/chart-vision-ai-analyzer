
import { DetectedCandle, ChartArea, PriceAxis } from './types';
import { CandleData } from '../../context/AnalyzerContext';

export const convertCandlesToOHLC = (
  detectedCandles: DetectedCandle[],
  chartArea: ChartArea,
  priceAxis: PriceAxis
): CandleData[] => {
  try {
    console.log('📋 Convertendo candles detectados para formato OHLC...');
    
    if (!detectedCandles || detectedCandles.length === 0) {
      console.warn('⚠️ Nenhum candle detectado para conversão');
      return [];
    }

    return detectedCandles.map((candle, index) => {
      // Converter posições Y para preços usando o eixo de preços
      const pixelHeight = chartArea.height;
      const priceRange = priceAxis.maxPrice - priceAxis.minPrice;
      
      // Calcular preços baseados na posição vertical do candle
      const high = priceAxis.minPrice + ((pixelHeight - candle.wickTop + chartArea.y) / pixelHeight) * priceRange;
      const low = priceAxis.minPrice + ((pixelHeight - candle.wickBottom + chartArea.y) / pixelHeight) * priceRange;
      const bodyTopPrice = priceAxis.minPrice + ((pixelHeight - candle.bodyTop + chartArea.y) / pixelHeight) * priceRange;
      const bodyBottomPrice = priceAxis.minPrice + ((pixelHeight - candle.bodyBottom + chartArea.y) / pixelHeight) * priceRange;
      
      // Determinar open e close baseado na cor do candle
      const isGreen = candle.color === 'green';
      const open = isGreen ? Math.min(bodyTopPrice, bodyBottomPrice) : Math.max(bodyTopPrice, bodyBottomPrice);
      const close = isGreen ? Math.max(bodyTopPrice, bodyBottomPrice) : Math.min(bodyTopPrice, bodyBottomPrice);
      
      return {
        time: new Date(Date.now() - (detectedCandles.length - index) * 60000).toISOString(),
        timestamp: Date.now() - (detectedCandles.length - index) * 60000,
        open: Math.max(0, open),
        high: Math.max(0, high),
        low: Math.max(0, low),
        close: Math.max(0, close),
        volume: 1000, // Volume inferido
        position: {
          x: candle.x,
          y: candle.y
        }
      };
    });
  } catch (error) {
    console.error('❌ Erro na conversão OHLC:', error);
    return [];
  }
};
