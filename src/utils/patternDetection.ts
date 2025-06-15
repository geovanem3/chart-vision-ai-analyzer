
import { extractCandlesFromChart } from './realCandleExtraction';
import { detectCommonPatterns } from './commonPatternDetection';
import { performConfluenceAnalysis } from './confluenceAnalysis';
import { assessMarketContext } from './marketContextAnalyzer';
import { detectPriceActionSignals } from './priceActionAnalyzer';
import { identifyEntryPoints } from './entryPointIdentifier';
import { CandleData } from '../context/AnalyzerContext';
import { AnalysisResult } from './analysis/types';

export const analyzeChart = async (imageUrl: string, options: any = {}): Promise<AnalysisResult> => {
  try {
    console.log('🔍 Iniciando análise completa do gráfico...');
    
    // Extrair candles reais da imagem usando o novo sistema
    const extractionResult = await extractCandlesFromChart(imageUrl, options);
    
    if (!extractionResult || extractionResult.candles.length === 0) {
      console.warn('⚠️ Nenhum candle extraído da imagem');
      return {
        patterns: [],
        candles: [],
        confluences: null,
        detailedMarketContext: null,
        priceActionSignals: [],
        entryRecommendations: [],
        intelligentAnalysis: null
      };
    }

    const candles = extractionResult.candles;
    console.log(`📊 ${candles.length} candles extraídos para análise`);

    // Detectar padrões de candlestick
    console.log('🔎 Detectando padrões de candlestick...');
    const detectedPatterns = detectCommonPatterns(candles);
    console.log(`✅ ${detectedPatterns.length} padrões detectados`);

    // Realizar análise de confluência
    console.log('🤝 Iniciando análise de confluência...');
    const confluenceData = performConfluenceAnalysis(candles, detectedPatterns);
    console.log('✅ Análise de confluência concluída');

    // Avaliar contexto de mercado
    console.log('🌍 Avaliando contexto de mercado...');
    const marketContext = assessMarketContext(candles, confluenceData);
    console.log('✅ Contexto de mercado avaliado');

    // Detectar sinais de price action
    console.log('💡 Detectando sinais de price action...');
    const priceActionData = detectPriceActionSignals(candles, marketContext);
    console.log(`✅ ${priceActionData?.signals?.length || 0} sinais de price action detectados`);

    // Identificar pontos de entrada
    console.log('🎯 Identificando pontos de entrada...');
    const entryPoints = identifyEntryPoints(
      candles,
      detectedPatterns,
      confluenceData,
      marketContext,
      priceActionData
    );
    console.log(`✅ ${entryPoints.length} pontos de entrada identificados`);

    return {
      patterns: detectedPatterns,
      candles,
      confluences: confluenceData,
      detailedMarketContext: marketContext,
      priceActionSignals: priceActionData?.signals || [],
      entryRecommendations: entryPoints,
      intelligentAnalysis: extractionResult.intelligentAnalysis || null
    };

  } catch (error) {
    console.error('❌ Erro na análise do gráfico:', error);
    return {
      patterns: [],
      candles: [],
      confluences: null,
      detailedMarketContext: null,
      priceActionSignals: [],
      entryRecommendations: [],
      intelligentAnalysis: null
    };
  }
};

// Função auxiliar para validar a análise
export const validateAnalysis = (analysisResult: AnalysisResult): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!analysisResult.candles || analysisResult.candles.length === 0) {
    issues.push('Nenhum candle detectado');
    recommendations.push('Verifique a qualidade da imagem e as configurações de detecção');
  }

  if (!analysisResult.patterns || analysisResult.patterns.length === 0) {
    issues.push('Nenhum padrão detectado');
    recommendations.push('Ajuste as configurações de sensibilidade para detecção de padrões');
  }

  if (!analysisResult.confluences) {
    issues.push('Análise de confluência não disponível');
    recommendations.push('Verifique as configurações de análise para habilitar a confluência');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
};

// Manter compatibilidade com componentes existentes - versões simplificadas
export const detectPatterns = async (imageUrl: string) => {
  const result = await analyzeChart(imageUrl);
  return result.patterns;
};

export const generateTechnicalMarkup = (patterns: any[], width?: number, height?: number) => {
  // Gerar elementos técnicos baseados nos padrões detectados
  const technicalElements: any[] = [];
  
  patterns.forEach((pattern, index) => {
    if (pattern.coordinates) {
      technicalElements.push({
        id: `pattern-${index}`,
        type: pattern.type,
        x: pattern.coordinates.x,
        y: pattern.coordinates.y,
        width: pattern.coordinates.width || 50,
        height: pattern.coordinates.height || 30,
        confidence: pattern.confidence,
        description: pattern.description
      });
    }
  });
  
  return technicalElements;
};

export const detectCandles = async (imageUrl: string, width?: number, height?: number) => {
  const result = await analyzeChart(imageUrl);
  return result.candles;
};
