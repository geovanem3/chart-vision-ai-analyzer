
import { detectChartArea } from './analysis/chartAreaDetector';
import { detectPriceAxis } from './analysis/priceAxisDetector';
import { detectIndividualCandles } from './analysis/candleDetector';
import { convertCandlesToOHLC } from './analysis/ohlcConverter';
import { analyzeIntelligentPatterns } from './analysis/intelligentPatternAnalyzer';
import { CandleData } from '../context/AnalyzerContext';

export interface CandleExtractionResult {
  candles: CandleData[];
  chartArea?: any;
  priceAxis?: any;
  detectedCandles?: any[];
  intelligentAnalysis?: any;
  confidence: number;
  metadata: {
    totalCandlesDetected: number;
    chartAreaConfidence: number;
    priceAxisConfidence: number;
    analysisTimestamp: number;
  };
}

export const extractCandlesFromChart = async (
  imageUrl: string,
  options: any = {}
): Promise<CandleExtractionResult> => {
  try {
    console.log('🔍 Iniciando extração inteligente de candles...');
    
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Falha ao criar contexto do canvas');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 1. Detectar área do gráfico
    console.log('📊 Detectando área do gráfico...');
    const chartArea = detectChartArea(imageData, canvas.width, canvas.height);
    
    if (!chartArea) {
      throw new Error('Não foi possível detectar a área do gráfico');
    }
    
    console.log(`✅ Área do gráfico detectada: ${chartArea.width}x${chartArea.height}`);

    // 2. Detectar eixo de preços
    console.log('💰 Detectando eixo de preços...');
    const priceAxis = detectPriceAxis(imageData, canvas.width, canvas.height, chartArea);
    
    console.log(`📈 Eixo de preços: ${priceAxis.minPrice.toFixed(5)} - ${priceAxis.maxPrice.toFixed(5)}`);

    // 3. Detectar candles individuais
    console.log('🕯️ Detectando candles individuais...');
    const detectedCandles = detectIndividualCandles(
      imageData, 
      canvas.width, 
      canvas.height, 
      chartArea
    );
    
    console.log(`🎯 ${detectedCandles.length} candles detectados`);

    // 4. Converter para formato OHLC
    console.log('📋 Convertendo para formato OHLC...');
    const candleData = convertCandlesToOHLC(detectedCandles, chartArea, priceAxis);
    
    console.log(`📊 ${candleData.length} candles convertidos para OHLC`);

    // 5. ANÁLISE INTELIGENTE - Combinar padrões com contexto
    console.log('🧠 Executando análise inteligente...');
    const intelligentAnalysis = analyzeIntelligentPatterns(
      detectedCandles,
      chartArea,
      priceAxis
    );
    
    console.log(`🎯 Análise inteligente concluída: ${intelligentAnalysis.overallSignal} (${intelligentAnalysis.confidence}%)`);

    // Calcular confiança geral
    const overallConfidence = Math.min(100, 
      (chartArea.confidence || 0) * 0.2 + 
      (priceAxis.confidence || 0) * 0.2 + 
      (detectedCandles.filter(c => c.confidence > 0.7).length / Math.max(1, detectedCandles.length) * 100 * 0.3) +
      (intelligentAnalysis.confidence * 0.3)
    );

    const result: CandleExtractionResult = {
      candles: candleData,
      chartArea,
      priceAxis,
      detectedCandles,
      intelligentAnalysis,
      confidence: overallConfidence,
      metadata: {
        totalCandlesDetected: detectedCandles.length,
        chartAreaConfidence: chartArea.confidence || 0,
        priceAxisConfidence: priceAxis.confidence || 0,
        analysisTimestamp: Date.now()
      }
    };

    console.log(`✅ Extração completa - Confiança geral: ${overallConfidence.toFixed(1)}%`);
    return result;

  } catch (error) {
    console.error('❌ Erro na extração de candles:', error);
    
    return {
      candles: [],
      confidence: 0,
      metadata: {
        totalCandlesDetected: 0,
        chartAreaConfidence: 0,
        priceAxisConfidence: 0,
        analysisTimestamp: Date.now()
      }
    };
  }
};

// Função para usar no patternDetection.ts
export const extractRealCandlesFromImage = async (imageUrl: string): Promise<CandleData[]> => {
  try {
    const result = await extractCandlesFromChart(imageUrl);
    return result.candles;
  } catch (error) {
    console.error('❌ Erro na extração de candles da imagem:', error);
    return [];
  }
};

// Função auxiliar para validar qualidade dos dados extraídos
export const validateExtractionQuality = (result: CandleExtractionResult): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (result.confidence < 50) {
    issues.push('Confiança geral baixa na extração');
    recommendations.push('Verificar qualidade da imagem do gráfico');
  }
  
  if (result.candles.length < 5) {
    issues.push('Poucos candles detectados');
    recommendations.push('Usar imagem com mais dados históricos visíveis');
  }
  
  if (result.metadata.chartAreaConfidence < 60) {
    issues.push('Área do gráfico não detectada com precisão');
    recommendations.push('Garantir que o gráfico esteja bem visível e sem sobreposições');
  }
  
  const validCandles = result.candles.filter(c => 
    c.high > c.low && 
    c.high >= Math.max(c.open, c.close) && 
    c.low <= Math.min(c.open, c.close)
  );
  
  if (validCandles.length < result.candles.length * 0.8) {
    issues.push('Dados OHLC inconsistentes detectados');
    recommendations.push('Verificar se o gráfico tem candles claramente visíveis');
  }
  
  return {
    isValid: issues.length === 0 && result.confidence > 60,
    issues,
    recommendations
  };
};
