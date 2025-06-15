
import { CandleData } from "../../context/AnalyzerContext";
import { toast } from "@/hooks/use-toast";
import { ChartArea, DetectedCandle, PriceAxis } from "./types";

export const convertToOHLCData = (
  detectedCandles: DetectedCandle[], 
  priceAxis: PriceAxis, 
  chartArea: ChartArea
): CandleData[] => {
  
  try {
    const candles = detectedCandles.map((candle, index) => {
      try {
        if (!candle || !priceAxis || !chartArea || !priceAxis.pixelPerPrice || priceAxis.pixelPerPrice <= 0 || !isFinite(priceAxis.pixelPerPrice)) {
          throw new Error('Dados de entrada inválidos para conversão de candle');
        }
        
        const highPrice = priceAxis.maxPrice - (candle.wickTop - chartArea.y) / priceAxis.pixelPerPrice;
        const lowPrice = priceAxis.maxPrice - (candle.wickBottom - chartArea.y) / priceAxis.pixelPerPrice;
        const bodyTopPrice = priceAxis.maxPrice - (candle.bodyTop - chartArea.y) / priceAxis.pixelPerPrice;
        const bodyBottomPrice = priceAxis.maxPrice - (candle.bodyBottom - chartArea.y) / priceAxis.pixelPerPrice;
        
        if (!isFinite(highPrice) || !isFinite(lowPrice) || !isFinite(bodyTopPrice) || !isFinite(bodyBottomPrice)) {
          throw new Error('Preços calculados são inválidos (não finitos)');
        }
        
        let openPrice: number, closePrice: number;
        
        if (candle.color === 'green' || candle.color === 'white') {
          openPrice = Math.min(bodyTopPrice, bodyBottomPrice);
          closePrice = Math.max(bodyTopPrice, bodyBottomPrice);
        } else {
          openPrice = Math.max(bodyTopPrice, bodyBottomPrice);
          closePrice = Math.min(bodyTopPrice, bodyBottomPrice);
        }
        
        const finalHigh = Math.max(openPrice, closePrice, highPrice);
        const finalLow = Math.min(openPrice, closePrice, lowPrice);
        
        if (finalLow < 0 || finalHigh <= finalLow || openPrice < 0 || closePrice < 0) {
          throw new Error('Valores OHLC inválidos calculados');
        }
        
        const candleColor: 'verde' | 'vermelho' = (candle.color === 'green' || candle.color === 'white') ? 'verde' : 'vermelho';
        
        return {
          open: parseFloat(openPrice.toFixed(2)),
          high: parseFloat(finalHigh.toFixed(2)),
          low: parseFloat(finalLow.toFixed(2)),
          close: parseFloat(closePrice.toFixed(2)),
          timestamp: Date.now() - (detectedCandles.length - index) * 60000,
          position: {
            x: candle.x,
            y: candle.y + candle.height / 2
          },
          color: candleColor
        };
      } catch (candleConversionError) {
        console.warn(`⚠️ Erro ao converter candle individual ${index}, pulando:`, candleConversionError);
        return null;
      }
    }).filter((candle): candle is NonNullable<typeof candle> => {
        if (candle === null) return false;
        // Validação mais estrita dos dados do candle
        return candle.open >= 0 && candle.high >= 0 && candle.low >= 0 && candle.close >= 0 &&
             candle.high >= Math.max(candle.open, candle.close) &&
             candle.low <= Math.min(candle.open, candle.close);
    });

    if (candles.length > 0) {
        console.log(`✅ Conversão para OHLC finalizada. Retornando ${candles.length} candles válidos.`);
    }
    return candles;

  } catch (error) {
    console.error('❌ Erro na conversão para OHLC:', error);
    toast({
      variant: "error",
      title: "Erro de Conversão OHLC",
      description: `Falha ao converter os dados para OHLC: ${String(error)}`,
    });
    return [];
  }
};
