
import { PatternResult, AnalysisResult, VolumeData, VolatilityData, TechnicalIndicator, ScalpingSignal, CandleData } from "../context/AnalyzerContext";
import { analyzeVolume } from "./volumeAnalysis";
import { analyzeVolatility } from "./volatilityAnalysis";
import { analyzePriceAction, analyzeMarketContext } from "./priceActionAnalysis";
import { performConfluenceAnalysis } from "./confluenceAnalysis";
import { detectDivergences } from "./divergenceAnalysis";
import { detectCandlestickPatterns } from "./candlestickPatternDetection";
import { detectTechnicalIndicators } from "./technicalIndicatorAnalysis";
import { DetectedPattern } from "./types";
import { 
  analyzeAdvancedMarketConditions, 
  calculateOperatingScore, 
  calculateConfidenceReduction,
  EnhancedMarketContext
} from "./advancedMarketContext";

interface AnalysisOptions {
  timeframe?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
  optimizeForScalping?: boolean;
  considerVolume?: boolean;
  considerVolatility?: boolean;
  enableCandleDetection?: boolean;
  scalpingStrategy?: string;
  marketContextEnabled?: boolean;
  marketAnalysisDepth?: string;
  isLiveAnalysis?: boolean;
  useConfluences?: boolean;
  enablePriceAction?: boolean;
  enableMarketContext?: boolean;
}

// Criar interface para padrões de gráfico simples
interface ChartPattern {
  pattern: string;
  confidence: number;
  description: string;
  recommendation: string;
  action: 'compra' | 'venda' | 'neutro';
}

// Função simplificada para detectar padrões gráficos
const detectChartPatterns = (candles: CandleData[]): ChartPattern[] => {
  if (candles.length < 5) return [];
  
  const patterns: ChartPattern[] = [];
  const recent = candles.slice(-10);
  
  // Detectar triângulo simples
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);
  const avgHigh = highs.reduce((a, b) => a + b, 0) / highs.length;
  const avgLow = lows.reduce((a, b) => a + b, 0) / lows.length;
  
  if (Math.abs(avgHigh - avgLow) < (avgHigh * 0.02)) {
    patterns.push({
      pattern: 'triangulo',
      confidence: 0.7,
      description: 'Padrão triangular detectado',
      recommendation: 'Aguardar breakout',
      action: 'neutro'
    });
  }
  
  return patterns;
};

export const detectPatterns = async (imageData: string): Promise<PatternResult[]> => {
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imageData;
  });
  
  const candles = await detectCandles(imageData, img.width, img.height);
  const detectedPatterns = detectCandlestickPatterns(candles);
  
  return detectedPatterns.map(pattern => ({
    type: pattern.type,
    confidence: pattern.confidence,
    description: pattern.description,
    recommendation: pattern.action === 'compra' ? 'Considerar compra' : 
                   pattern.action === 'venda' ? 'Considerar venda' : 'Aguardar confirmação',
    action: pattern.action
  }));
};

export const generateTechnicalMarkup = (patterns: PatternResult[], width: number, height: number) => {
  return patterns.map((pattern, index) => ({
    id: `pattern-${index}`,
    type: 'pattern' as const,
    patternType: 'triangulo' as const,
    points: [{ x: Math.random() * width * 0.8, y: Math.random() * height * 0.8 }],
    color: '#ff0000',
    pattern: pattern.type,
    confidence: pattern.confidence
  }));
};

export const detectCandles = async (imageData: string, width: number, height: number): Promise<CandleData[]> => {
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      const candles: CandleData[] = [];
      let currentX = 0;
      const candleWidth = Math.floor(width / 50);
      
      while (currentX < width - candleWidth) {
        let high = height;
        let low = 0;
        let open = 0;
        let close = 0;
        
        for (let y = 0; y < height; y++) {
          const idx = (y * width + currentX) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          if (Math.abs(r - g) > 30 || Math.abs(r - b) > 30) {
            if (y < high) high = y;
            if (y > low) low = y;
            
            const density = countPixelDensity(data, currentX, y, candleWidth, width, height);
            if (density > 0.7) {
              if (open === 0) open = y;
              close = y;
            }
          }
        }
        
        if (high < low && open !== 0 && close !== 0) {
          const priceRange = 100;
          const pixelToPrice = priceRange / height;
          
          candles.push({
            open: (height - open) * pixelToPrice,
            close: (height - close) * pixelToPrice,
            high: (height - high) * pixelToPrice,
            low: (height - low) * pixelToPrice,
            position: {
              x: currentX,
              y: high
            },
            width: candleWidth,
            height: low - high,
            timestamp: Date.now() + currentX
          });
        }
        
        currentX += candleWidth + 1;
      }
      
      console.log(`🕯️ DETECTADOS ${candles.length} candles REAIS da imagem`);
      resolve(candles);
    };
    
    img.src = imageData;
  });
};

const countPixelDensity = (data: Uint8ClampedArray, x: number, y: number, width: number, imageWidth: number, imageHeight: number): number => {
  let count = 0;
  const area = width * 3;
  
  for (let i = 0; i < width; i++) {
    for (let j = -1; j <= 1; j++) {
      const py = y + j;
      const px = x + i;
      
      if (px >= 0 && px < imageWidth && py >= 0 && py < imageHeight) {
        const idx = (py * imageWidth + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        if (Math.abs(r - g) > 30 || Math.abs(r - b) > 30) {
          count++;
        }
      }
    }
  }
  
  return count / area;
};

export const analyzeChart = async (imageData: string, options: AnalysisOptions = {}): Promise<AnalysisResult> => {
  console.log('🚀 Iniciando ANÁLISE COMPLETA com TODO o poder de análise...');
  
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imageData;
  });
  
  const candles = await detectCandles(imageData, img.width, img.height);
  console.log(`📊 Detectados ${candles.length} candles REAIS para análise COMPLETA`);
  
  if (candles.length === 0) {
    console.log('⚠️ NENHUM candle detectado - retornando análise vazia');
    return {
      patterns: [],
      timestamp: Date.now(),
      imageUrl: imageData,
      technicalElements: [],
      candles: [],
      scalpingSignals: [],
      technicalIndicators: [],
      volumeData: {
        value: 0,
        trend: 'neutro',
        abnormal: false,
        significance: 'low',
        relativeToAverage: 1.0,
        distribution: 'neutral',
        divergence: false
      },
      volatilityData: {
        value: 0,
        trend: 'neutro',
        atr: 0,
        historicalComparison: 'average',
        isHigh: false
      },
      marketContext: {
        phase: 'lateral',
        strength: 'fraca',
        dominantTimeframe: options.timeframe || '1m',
        sentiment: 'neutro',
        description: 'Sem dados suficientes',
        marketStructure: 'indefinida',
        breakoutPotential: 'baixo',
        momentumSignature: 'estável'
      },
      warnings: ['Nenhum candle detectado na imagem'],
      preciseEntryAnalysis: {
        exactMinute: 'pendente',
        entryType: 'reversão',
        nextCandleExpectation: 'aguardando análise',
        priceAction: '',
        confirmationSignal: '',
        riskRewardRatio: 0,
        entryInstructions: 'Sem dados para análise'
      },
      confluences: {
        confluenceScore: 0,
        supportResistance: [],
        marketStructure: { structure: 'neutral' },
        priceAction: { trend: 'lateral', momentum: 'fraco', strength: 0 }
      },
      priceActionSignals: [],
      detailedMarketContext: {
        phase: 'lateral',
        sentiment: 'neutro',
        strength: 'fraca',
        description: 'Sem dados suficientes',
        marketStructure: 'indefinida',
        breakoutPotential: 'baixo',
        momentumSignature: 'estável',
        institutionalBias: 'neutro',
        volatilityState: 'normal',
        liquidityCondition: 'inadequada',
        timeOfDay: 'fora_horario',
        trend: 'lateral'
      },
      entryRecommendations: []
    };
  }
  
  console.log('🔥 ATIVANDO ANÁLISE COMPLETA - USANDO 100% DO PODER DO CÓDIGO');
  
  // === ANÁLISE COMPLETA MULTI-CAMADAS ===
  
  // 1. Análise Avançada de Condições de Mercado
  const advancedConditions = analyzeAdvancedMarketConditions(candles);
  const operatingScore = calculateOperatingScore(advancedConditions);
  const confidenceReduction = calculateConfidenceReduction(advancedConditions);
  
  console.log(`🎯 Score COMPLETO de operação: ${operatingScore}/100`);
  console.log(`⚠️ Redução de confiança: ${(confidenceReduction * 100).toFixed(0)}%`);
  
  // 2. Detecção COMPLETA de Padrões de Candlesticks
  let candlePatterns: DetectedPattern[] = [];
  if (options.enableCandleDetection !== false) {
    candlePatterns = detectCandlestickPatterns(candles);
    console.log(`🕯️ Padrões COMPLETOS detectados: ${candlePatterns.length}`);
    
    candlePatterns.forEach((pattern, index) => {
      console.log(`Pattern COMPLETO ${index + 1}:`, {
        type: pattern.type,
        action: pattern.action,
        confidence: pattern.confidence,
        description: pattern.description
      });
    });
  }
  
  // 3. Análise COMPLETA de Price Action
  const priceActionSignals = analyzePriceAction(candles);
  console.log(`📈 Sinais de Price Action: ${priceActionSignals.length}`);
  
  // 4. Análise COMPLETA de Volume
  const volumeData: VolumeData = analyzeVolume(candles);
  console.log(`📊 Volume Analysis: ${volumeData.significance} (${volumeData.trend})`);
  
  // 5. Análise COMPLETA de Volatilidade
  const volatilityAnalysis = analyzeVolatility(candles);
  console.log(`📊 Volatilidade: ${volatilityAnalysis.isHigh ? 'ALTA' : 'NORMAL'}`);
  
  // 6. Análise COMPLETA de Divergências
  const divergences = detectDivergences(candles);
  console.log(`🔄 Divergências detectadas: ${divergences.length}`);
  
  // 7. Análise COMPLETA de Indicadores Técnicos
  const technicalIndicators: TechnicalIndicator[] = detectTechnicalIndicators(candles);
  console.log(`📊 Indicadores Técnicos: ${technicalIndicators.length}`);
  
  // 8. Análise COMPLETA de Contexto de Mercado
  const marketContextAnalysis = analyzeMarketContext(candles);
  console.log(`🏛️ Contexto de Mercado: ${marketContextAnalysis.phase} - ${marketContextAnalysis.sentiment}`);
  
  // 9. Análise COMPLETA de Confluências
  const confluenceAnalysis = performConfluenceAnalysis(candles, candlePatterns);
  console.log(`🎯 Score de Confluência: ${confluenceAnalysis.confluenceScore}%`);
  
  // 10. Análise COMPLETA de Padrões Gráficos
  const chartPatterns = detectChartPatterns(candles);
  console.log(`📊 Padrões Gráficos: ${chartPatterns.length}`);
  
  // === DETERMINAÇÃO INTELIGENTE DO TIPO DE MERCADO ===
  
  const marketType = determineMarketType(candles, confluenceAnalysis, priceActionSignals);
  console.log(`🏛️ TIPO DE MERCADO IDENTIFICADO: ${marketType.type}`);
  
  // === APLICAÇÃO DE ESTRATÉGIAS ESPECÍFICAS POR TIPO DE MERCADO ===
  
  let finalPatterns: PatternResult[] = [];
  let finalSignals: ScalpingSignal[] = [];
  let finalConfidenceMultiplier = 1.0;
  
  if (marketType.type === 'TENDENCIA') {
    console.log('📈 APLICANDO ESTRATÉGIAS PARA MERCADO DE TENDÊNCIA');
    
    // Em tendência: priorizar padrões de continuação e breakouts
    finalPatterns = candlePatterns
      .filter(p => 
        p.type.includes('three_white_soldiers') ||
        p.type.includes('three_black_crows') ||
        p.type.includes('marubozu') ||
        p.type.includes('engolfo') ||
        p.action !== 'neutro'
      )
      .map(pattern => ({
        type: pattern.type,
        confidence: pattern.confidence * confidenceReduction * 1.2, // Bonus para tendência
        description: pattern.description + ' (Mercado em Tendência)',
        recommendation: pattern.action === 'compra' ? 'COMPRA FORTE - Tendência' : 
                       pattern.action === 'venda' ? 'VENDA FORTE - Tendência' : 'Aguardar',
        action: pattern.action
      }));
    
    finalConfidenceMultiplier = 1.2;
    
  } else if (marketType.type === 'LATERAL') {
    console.log('↔️ APLICANDO ESTRATÉGIAS PARA MERCADO LATERAL');
    
    // Em lateral: priorizar padrões de reversão em S/R
    finalPatterns = candlePatterns
      .filter(p => 
        p.type.includes('doji') ||
        p.type.includes('hammer') ||
        p.type.includes('pin_bar') ||
        p.type.includes('tweezer') ||
        p.type.includes('harami')
      )
      .map(pattern => ({
        type: pattern.type,
        confidence: pattern.confidence * confidenceReduction * 1.1, // Bonus para lateral
        description: pattern.description + ' (Mercado Lateral - S/R)',
        recommendation: pattern.action === 'compra' ? 'COMPRA em Suporte' : 
                       pattern.action === 'venda' ? 'VENDA em Resistência' : 'Aguardar',
        action: pattern.action
      }));
    
    finalConfidenceMultiplier = 1.1;
    
  } else {
    console.log('🔄 APLICANDO ESTRATÉGIAS PARA MERCADO CONSOLIDADO');
    
    // Mercado consolidado: aguardar breakout
    finalPatterns = candlePatterns
      .filter(p => p.confidence > 0.7)
      .map(pattern => ({
        type: pattern.type,
        confidence: pattern.confidence * confidenceReduction * 0.8, // Redução para consolidação
        description: pattern.description + ' (Mercado Consolidado)',
        recommendation: 'AGUARDAR BREAKOUT',
        action: 'neutro'
      }));
    
    finalConfidenceMultiplier = 0.8;
  }
  
  // === GERAÇÃO DE SINAIS DE SCALPING INTELIGENTES ===
  
  finalSignals = generateIntelligentScalpingSignals(
    finalPatterns,
    priceActionSignals,
    confluenceAnalysis,
    marketType,
    options
  );
  
  console.log(`⚡️ Sinais INTELIGENTES de Scalping: ${finalSignals.length}`);
  
  // === CONTEXTO DE MERCADO APRIMORADO ===
  
  const enhancedMarketContext: EnhancedMarketContext = {
    phase: marketType.phase,
    strength: marketType.strength,
    dominantTimeframe: options.timeframe || '1m',
    sentiment: marketType.sentiment,
    description: `ANÁLISE COMPLETA - Score: ${operatingScore}/100 - Tipo: ${marketType.type}`,
    marketStructure: marketType.structure,
    breakoutPotential: marketType.breakoutPotential,
    momentumSignature: marketType.momentum,
    advancedConditions,
    operatingScore,
    confidenceReduction: confidenceReduction * finalConfidenceMultiplier
  };
  
  // === ANÁLISE PRECISA DE ENTRADA ===
  
  const preciseEntryAnalysis = generatePreciseEntryAnalysis(
    finalPatterns,
    priceActionSignals,
    confluenceAnalysis,
    marketType
  );
  
  // === RECOMENDAÇÕES DE ENTRADA AVANÇADAS ===
  
  const entryRecommendations = generateAdvancedEntryRecommendations(
    finalPatterns,
    priceActionSignals,
    confluenceAnalysis,
    marketType,
    candles
  );
  
  console.log(`🎯 Recomendações de Entrada: ${entryRecommendations.length}`);
  
  const result: AnalysisResult = {
    patterns: finalPatterns,
    timestamp: Date.now(),
    imageUrl: imageData,
    technicalElements: [],
    candles: candles,
    scalpingSignals: finalSignals,
    technicalIndicators: technicalIndicators,
    volumeData: volumeData,
    volatilityData: volatilityAnalysis,
    marketContext: enhancedMarketContext,
    warnings: advancedConditions.warnings,
    preciseEntryAnalysis: preciseEntryAnalysis,
    confluences: confluenceAnalysis,
    priceActionSignals: priceActionSignals,
    detailedMarketContext: {
      phase: marketType.phase,
      sentiment: marketType.sentiment,
      strength: marketType.strength,
      description: `ANÁLISE COMPLETA - Score: ${operatingScore}/100`,
      marketStructure: marketType.structure,
      breakoutPotential: marketType.breakoutPotential,
      momentumSignature: marketType.momentum,
      institutionalBias: marketType.institutionalBias,
      volatilityState: volatilityAnalysis.isHigh ? 'alta' : 'normal',
      liquidityCondition: volumeData.significance === 'high' ? 'alta' : 'adequada',
      timeOfDay: 'horário_comercial',
      trend: marketType.trend
    },
    entryRecommendations: entryRecommendations
  };
  
  console.log('📋 RESULTADO FINAL DA ANÁLISE COMPLETA:', {
    patternsCount: result.patterns.length,
    patternTypes: result.patterns.map(p => p.type),
    operatingScore: operatingScore,
    marketType: marketType.type,
    candlesDetected: candles.length,
    confluenceScore: confluenceAnalysis.confluenceScore,
    priceActionSignals: priceActionSignals.length,
    entryRecommendations: entryRecommendations.length
  });
  
  return result;
};

// === FUNÇÕES AUXILIARES PARA ANÁLISE COMPLETA ===

const determineMarketType = (candles: CandleData[], confluences: any, priceActionSignals: any[]) => {
  const recent10 = candles.slice(-10);
  const highs = recent10.map(c => c.high);
  const lows = recent10.map(c => c.low);
  const closes = recent10.map(c => c.close);
  
  const priceRange = Math.max(...highs) - Math.min(...lows);
  const avgPrice = (Math.max(...highs) + Math.min(...lows)) / 2;
  const rangePercent = (priceRange / avgPrice) * 100;
  
  // Determinar tendência
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const trendPercent = ((lastClose - firstClose) / firstClose) * 100;
  
  let marketType = 'CONSOLIDADO';
  let phase: 'lateral' | 'tendência_alta' | 'tendência_baixa' | 'acumulação' = 'lateral';
  let trend: 'lateral' = 'lateral';
  
  if (Math.abs(trendPercent) > 0.3 && rangePercent > 0.4) {
    marketType = 'TENDENCIA';
    if (trendPercent > 0.3) {
      phase = 'tendência_alta';
    } else {
      phase = 'tendência_baixa';
    }
  } else if (rangePercent < 0.2) {
    marketType = 'CONSOLIDADO';
    phase = 'acumulação';
  } else {
    marketType = 'LATERAL';
    phase = 'lateral';
  }
  
  // Determinar força
  let strength: 'forte' | 'moderada' | 'fraca' = 'fraca';
  if (confluences.confluenceScore > 70) strength = 'forte';
  else if (confluences.confluenceScore > 50) strength = 'moderada';
  
  // Determinar sentimento
  let sentiment: 'otimista' | 'pessimista' | 'neutro' = 'neutro';
  if (trendPercent > 0.2) sentiment = 'otimista';
  else if (trendPercent < -0.2) sentiment = 'pessimista';
  
  return {
    type: marketType,
    phase,
    trend,
    strength,
    sentiment,
    structure: confluences.marketStructure?.structure || 'indefinida',
    breakoutPotential: confluences.priceAction?.breakoutPotential || 'baixo',
    momentum: priceActionSignals.length > 2 ? 'acelerando' : 'estável',
    institutionalBias: sentiment
  };
};

const generateIntelligentScalpingSignals = (
  patterns: PatternResult[],
  priceActionSignals: any[],
  confluences: any,
  marketType: any,
  options: AnalysisOptions
): ScalpingSignal[] => {
  const signals: ScalpingSignal[] = [];
  
  patterns.forEach(pattern => {
    if (pattern.action !== 'neutro' && pattern.confidence > 0.6) {
      // Encontrar price action que confirma o padrão
      const confirmingPA = priceActionSignals.find(pa => 
        (pattern.action === 'compra' && pa.direction === 'alta') ||
        (pattern.action === 'venda' && pa.direction === 'baixa')
      );
      
      let finalConfidence = pattern.confidence;
      if (confirmingPA) {
        finalConfidence = (finalConfidence + confirmingPA.confidence) / 2;
      }
      
      // Bonus para confluências
      if (confluences.confluenceScore > 60) {
        finalConfidence *= 1.1;
      }
      
      signals.push({
        type: 'entrada',
        action: pattern.action === 'compra' ? 'compra' : 'venda',
        price: '...',
        confidence: finalConfidence,
        timeframe: options.timeframe || '1m',
        description: `${pattern.type} + ${confirmingPA ? confirmingPA.type : 'sem PA'} (${marketType.type})`,
      });
    }
  });
  
  return signals;
};

const generatePreciseEntryAnalysis = (
  patterns: PatternResult[],
  priceActionSignals: any[],
  confluences: any,
  marketType: any
) => {
  const bestPattern = patterns.length > 0 ? patterns[0] : null;
  const bestPA = priceActionSignals.length > 0 ? priceActionSignals[0] : null;
  
  return {
    exactMinute: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    entryType: marketType.type === 'TENDENCIA' ? 'breakout' : 'reversão',
    nextCandleExpectation: bestPattern ? 
      `Confirmação ${bestPattern.action} - ${bestPattern.type}` : 
      'Aguardando formação',
    priceAction: bestPA ? bestPA.type : 'sem sinal',
    confirmationSignal: bestPattern && bestPA ? 'DUPLA CONFIRMAÇÃO' : 'confirmação simples',
    riskRewardRatio: confluences.confluenceScore > 70 ? 3.0 : 2.0,
    entryInstructions: bestPattern ? 
      `ENTRADA ${bestPattern.action.toUpperCase()}: ${bestPattern.description}` : 
      'Aguardando sinal'
  };
};

const generateAdvancedEntryRecommendations = (
  patterns: PatternResult[],
  priceActionSignals: any[],
  confluences: any,
  marketType: any,
  candles: CandleData[]
) => {
  const recommendations: any[] = [];
  
  patterns.forEach(pattern => {
    if (pattern.action !== 'neutro' && pattern.confidence > 0.65) {
      const lastCandle = candles[candles.length - 1];
      const entryPrice = pattern.action === 'compra' ? lastCandle.high : lastCandle.low;
      const stopDistance = (lastCandle.high - lastCandle.low) * 1.5;
      
      recommendations.push({
        action: pattern.action,
        entryPrice: entryPrice,
        stopLoss: pattern.action === 'compra' ? 
          entryPrice - stopDistance : 
          entryPrice + stopDistance,
        takeProfit: pattern.action === 'compra' ? 
          entryPrice + (stopDistance * 2) : 
          entryPrice - (stopDistance * 2),
        confidence: pattern.confidence,
        riskReward: 2.0,
        timeframe: '1m',
        reasoning: `${pattern.type} em mercado ${marketType.type} - Confluência: ${confluences.confluenceScore}%`
      });
    }
  });
  
  return recommendations.slice(0, 3); // Top 3 recomendações
};
