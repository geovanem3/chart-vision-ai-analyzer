
/**
 * Enhanced Pattern Detection with Financial Chart AI
 */

import { CandleData, AnalysisResult } from "../context/AnalyzerContext";
import { detectFinancialChart, FinancialChartAnalysis } from "./financialChartDetection";
import { enhanceFinancialChart, EnhancementResult } from "./advancedImageEnhancement";
import { detectCandlestickPatterns } from "./candlestickPatternDetection";
import { analyzeChart } from "./patternDetection";

export interface EnhancedAnalysisResult extends AnalysisResult {
  financialChartAnalysis: FinancialChartAnalysis;
  imageEnhancement: EnhancementResult;
  aiConfidence: {
    overall: number;
    chartDetection: number;
    patternRecognition: number;
    imageQuality: number;
    tradingPlatform: number;
  };
  professionalInsights: {
    marketPhase: string;
    tradingOpportunity: string;
    riskAssessment: string;
    confidenceLevel: 'Alta' | 'Média' | 'Baixa';
    recommendedTimeframe: string;
  };
}

export const analyzeChartWithAI = async (
  imageUrl: string,
  options: any = {}
): Promise<EnhancedAnalysisResult> => {
  console.log('🤖 INICIANDO ANÁLISE COM IA ESPECIALIZADA EM GRÁFICOS FINANCEIROS');
  const startTime = Date.now();
  
  try {
    // Step 1: Enhanced image preprocessing
    console.log('🎨 Etapa 1: Enhancement avançado da imagem...');
    const imageEnhancement = await enhanceFinancialChart(imageUrl);
    console.log(`✅ Enhancement concluído: ${imageEnhancement.confidence * 100}% confiança`);
    
    // Step 2: Advanced financial chart detection
    console.log('🎯 Etapa 2: Detecção especializada do gráfico financeiro...');
    const financialChartAnalysis = await detectFinancialChart(imageEnhancement.enhancedImageUrl);
    console.log(`✅ Gráfico detectado: ${financialChartAnalysis.platform} - ${financialChartAnalysis.timeframe}`);
    
    // Step 3: Traditional pattern analysis with enhanced image
    console.log('📊 Etapa 3: Análise tradicional de padrões...');
    const traditionalAnalysis = await analyzeChart(imageEnhancement.enhancedImageUrl, {
      ...options,
      enableCandleDetection: true,
      optimizeForScalping: financialChartAnalysis.timeframe === '1m' || financialChartAnalysis.timeframe === '5m'
    });
    console.log(`✅ Análise tradicional concluída: ${traditionalAnalysis.patterns.length} padrões`);
    
    // Step 4: Advanced candlestick pattern detection
    console.log('🕯️ Etapa 4: Detecção avançada de padrões de candlestick...');
    const advancedCandlePatterns = detectCandlestickPatterns(financialChartAnalysis.candlesticks);
    console.log(`✅ Padrões avançados detectados: ${advancedCandlePatterns.length}`);
    
    // Step 5: AI confidence calculation
    const aiConfidence = calculateAIConfidence(
      financialChartAnalysis,
      imageEnhancement,
      traditionalAnalysis,
      advancedCandlePatterns
    );
    console.log(`🎯 Confiança da IA: ${Math.round(aiConfidence.overall * 100)}%`);
    
    // Step 6: Professional insights generation
    const professionalInsights = generateProfessionalInsights(
      financialChartAnalysis,
      traditionalAnalysis,
      advancedCandlePatterns,
      aiConfidence
    );
    console.log(`💼 Insights profissionais gerados: ${professionalInsights.confidenceLevel}`);
    
    // Step 7: Merge and enhance results
    const enhancedResult: EnhancedAnalysisResult = {
      ...traditionalAnalysis,
      patterns: [...traditionalAnalysis.patterns, ...advancedCandlePatterns.map(p => ({
        type: p.type,
        confidence: p.confidence,
        description: p.description,
        recommendation: p.action === 'compra' ? 'Considerar compra' : 
                      p.action === 'venda' ? 'Considerar venda' : 'Aguardar confirmação',
        action: p.action
      }))],
      candles: financialChartAnalysis.candlesticks.length > 0 ? 
               financialChartAnalysis.candlesticks : 
               traditionalAnalysis.candles,
      financialChartAnalysis,
      imageEnhancement,
      aiConfidence,
      professionalInsights,
      marketContext: {
        ...traditionalAnalysis.marketContext,
        description: `IA ESPECIALIZADA: ${financialChartAnalysis.platform} ${financialChartAnalysis.timeframe} - ${professionalInsights.marketPhase}`
      }
    };
    
    const totalTime = Date.now() - startTime;
    console.log(`🚀 ANÁLISE COMPLETA COM IA FINALIZADA em ${totalTime}ms`);
    console.log(`📈 Resultado final:`, {
      platform: financialChartAnalysis.platform,
      timeframe: financialChartAnalysis.timeframe,
      chartQuality: Math.round(financialChartAnalysis.quality.clarity * 100),
      patternsDetected: enhancedResult.patterns.length,
      candlesDetected: enhancedResult.candles.length,
      aiConfidence: Math.round(aiConfidence.overall * 100),
      tradingOpportunity: professionalInsights.tradingOpportunity
    });
    
    return enhancedResult;
    
  } catch (error) {
    console.error('❌ Erro na análise com IA:', error);
    
    // Fallback to traditional analysis
    console.log('🔄 Executando análise tradicional como fallback...');
    const fallbackAnalysis = await analyzeChart(imageUrl, options);
    
    return {
      ...fallbackAnalysis,
      financialChartAnalysis: {
        platform: 'Unknown',
        timeframe: 'Unknown',
        chartType: 'candlestick',
        elements: [],
        quality: { clarity: 0.5, completeness: 0.5, readability: 0.5 },
        priceScale: { type: 'linear', minPrice: 0, maxPrice: 100, tickSize: 0.01 },
        candlesticks: [],
        confidence: 0.3
      },
      imageEnhancement: {
        enhancedImageUrl: imageUrl,
        enhancements: { contrastImprovement: 0, noiseReduction: 0, edgeEnhancement: 0, colorNormalization: 0 },
        processingTime: 0,
        confidence: 0.3
      },
      aiConfidence: {
        overall: 0.3,
        chartDetection: 0.3,
        patternRecognition: 0.5,
        imageQuality: 0.3,
        tradingPlatform: 0.2
      },
      professionalInsights: {
        marketPhase: 'Análise limitada',
        tradingOpportunity: 'Aguardar melhor imagem',
        riskAssessment: 'Alto risco - baixa qualidade de dados',
        confidenceLevel: 'Baixa',
        recommendedTimeframe: 'N/A'
      }
    } as EnhancedAnalysisResult;
  }
};

const calculateAIConfidence = (
  chartAnalysis: FinancialChartAnalysis,
  enhancement: EnhancementResult,
  traditionalAnalysis: AnalysisResult,
  candlePatterns: any[]
): EnhancedAnalysisResult['aiConfidence'] => {
  
  // Chart detection confidence
  const chartDetection = chartAnalysis.confidence;
  
  // Pattern recognition confidence
  const patternRecognition = Math.min(1, 
    (traditionalAnalysis.patterns.length * 0.1) + 
    (candlePatterns.length * 0.15) +
    (traditionalAnalysis.confluences.confluenceScore / 100 * 0.5)
  );
  
  // Image quality confidence
  const imageQuality = (
    chartAnalysis.quality.clarity +
    chartAnalysis.quality.completeness +
    chartAnalysis.quality.readability +
    enhancement.confidence
  ) / 4;
  
  // Trading platform detection confidence
  const tradingPlatform = chartAnalysis.platform !== 'Unknown' ? 0.8 : 0.2;
  
  // Overall confidence (weighted average)
  const overall = (
    chartDetection * 0.3 +
    patternRecognition * 0.3 +
    imageQuality * 0.25 +
    tradingPlatform * 0.15
  );
  
  return {
    overall: Math.round(overall * 100) / 100,
    chartDetection: Math.round(chartDetection * 100) / 100,
    patternRecognition: Math.round(patternRecognition * 100) / 100,
    imageQuality: Math.round(imageQuality * 100) / 100,
    tradingPlatform: Math.round(tradingPlatform * 100) / 100
  };
};

const generateProfessionalInsights = (
  chartAnalysis: FinancialChartAnalysis,
  traditionalAnalysis: AnalysisResult,
  candlePatterns: any[],
  aiConfidence: any
): EnhancedAnalysisResult['professionalInsights'] => {
  
  const strongPatterns = [...traditionalAnalysis.patterns, ...candlePatterns]
    .filter(p => p.confidence > 0.7);
  
  const buySignals = strongPatterns.filter(p => p.action === 'compra').length;
  const sellSignals = strongPatterns.filter(p => p.action === 'venda').length;
  
  // Determine market phase
  let marketPhase = 'Consolidação';
  if (traditionalAnalysis.marketContext.phase === 'tendência_alta') {
    marketPhase = 'Tendência de Alta';
  } else if (traditionalAnalysis.marketContext.phase === 'tendência_baixa') {
    marketPhase = 'Tendência de Baixa';
  } else if (traditionalAnalysis.confluences.confluenceScore > 70) {
    marketPhase = 'Zona de Confluência';
  }
  
  // Determine trading opportunity
  let tradingOpportunity = 'Aguardar confirmação';
  if (buySignals > sellSignals && buySignals >= 2) {
    tradingOpportunity = `Oportunidade de COMPRA (${buySignals} sinais)`;
  } else if (sellSignals > buySignals && sellSignals >= 2) {
    tradingOpportunity = `Oportunidade de VENDA (${sellSignals} sinais)`;
  } else if (strongPatterns.length > 0) {
    tradingOpportunity = 'Sinais mistos - Cautela';
  }
  
  // Risk assessment
  let riskAssessment = 'Risco médio';
  if (aiConfidence.overall > 0.8 && chartAnalysis.quality.clarity > 0.8) {
    riskAssessment = 'Risco baixo - Alta confiança';
  } else if (aiConfidence.overall < 0.5 || chartAnalysis.quality.clarity < 0.5) {
    riskAssessment = 'Risco alto - Baixa confiança';
  }
  
  // Confidence level
  let confidenceLevel: 'Alta' | 'Média' | 'Baixa' = 'Baixa';
  if (aiConfidence.overall > 0.75) confidenceLevel = 'Alta';
  else if (aiConfidence.overall > 0.5) confidenceLevel = 'Média';
  
  // Recommended timeframe
  let recommendedTimeframe = chartAnalysis.timeframe;
  if (chartAnalysis.timeframe === 'Unknown') {
    recommendedTimeframe = traditionalAnalysis.scalpingSignals.length > 0 ? '1m-5m' : '15m-1h';
  }
  
  return {
    marketPhase,
    tradingOpportunity,
    riskAssessment,
    confidenceLevel,
    recommendedTimeframe
  };
};
