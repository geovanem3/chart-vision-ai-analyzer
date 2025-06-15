
import { CandleData } from "../context/AnalyzerContext";
import { toast } from "@/hooks/use-toast";
import { detectChartArea } from "./analysis/chartAreaDetector";
import { detectPriceAxis } from "./analysis/priceAxisDetector";
import { detectIndividualCandles } from "./analysis/candleDetector";
import { convertToOHLCData } from "./analysis/ohlcConverter";

export const extractRealCandlesFromImage = async (imageData: string): Promise<CandleData[]> => {
  console.log('🔍 INICIANDO extração REAL de candles...');
  
  return new Promise((resolve) => {
    try {
      if (!imageData || imageData.length === 0) {
        console.error('❌ ImageData inválido ou vazio');
        toast({
          variant: "error",
          title: "Erro de Imagem",
          description: "A imagem de entrada está vazia ou inválida.",
        });
        resolve([]);
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        try {
          console.log('✅ Imagem carregada, criando canvas...');
          
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('❌ Falha ao criar contexto canvas');
            toast({
              variant: "error",
              title: "Erro de Contexto Canvas",
              description: "Não foi possível criar o contexto de desenho do canvas.",
            });
            resolve([]);
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          const imagePixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          console.log(`📊 Analisando imagem ${canvas.width}x${canvas.height}px`);
          
          // 1. Detectar área do gráfico
          const chartArea = detectChartArea(imagePixelData, canvas.width, canvas.height);
          console.log('📈 Área do gráfico detectada:', chartArea);
          
          // 2. Detectar eixo Y de preços (com heurística melhorada)
          const priceAxis = detectPriceAxis(chartArea);
          console.log('💰 Eixo de preços (estimado) detectado:', priceAxis);
          
          // 3. Detectar candles individuais (com detecção de cor melhorada)
          const detectedCandles = detectIndividualCandles(imagePixelData, canvas.width, canvas.height, chartArea);
          console.log(`🕯️ ${detectedCandles.length} candles detectados`);
          
          // 4. Converter para dados OHLC reais
          const candleData = convertToOHLCData(detectedCandles, priceAxis, chartArea);
          console.log(`✅ ${candleData.length} candles com dados OHLC extraídos`);
          
          resolve(candleData);
        } catch (processError) {
          console.error('❌ Erro no processamento da imagem:', processError);
          toast({
            variant: "error",
            title: "Erro de Processamento",
            description: `Falha ao processar a imagem do gráfico: ${String(processError)}`,
          });
          resolve([]);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ Erro ao carregar imagem:', error);
        toast({
          variant: "error",
          title: "Erro de Imagem",
          description: `Não foi possível carregar a imagem para análise: ${String(error)}`,
        });
        resolve([]);
      };
      
      // Timeout de segurança
      setTimeout(() => {
        console.warn('⚠️ Timeout na extração de candles');
        toast({
          variant: "warning",
          title: "Timeout na Análise",
          description: "A extração de candles demorou demais e foi interrompida.",
        });
        resolve([]);
      }, 10000);
      
      img.src = imageData;
    } catch (error) {
      console.error('❌ ERRO CRÍTICO na extração:', error);
      toast({
        variant: "error",
        title: "Erro Crítico na Extração",
        description: `Ocorreu um erro inesperado: ${String(error)}`,
      });
      resolve([]);
    }
  });
};
