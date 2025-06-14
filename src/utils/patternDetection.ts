
import { PatternResult, AnalysisResult, VolumeData, VolatilityData, TechnicalIndicator, ScalpingSignal, CandleData } from "../context/AnalyzerContext";
import { analyzeVolume } from "./volumeAnalysis";
import { analyzeVolatility } from "./volatilityAnalysis";
import { analyzePriceAction, analyzeMarketContext } from "./priceActionAnalysis";
import { performConfluenceAnalysis } from "./confluenceAnalysis";
import { detectDivergences } from "./divergenceAnalysis";
import { detectChartPatterns } from "./chartPatternDetection";
import { detectCandlestickPatterns } from "./candlestickPatternDetection";
import { detectTechnicalIndicators } from "./technicalIndicatorAnalysis";
import { DetectedPattern } from "./types";
import { 
  analyzeAdvancedMarketConditions, 
  calculateOperatingScore, 
  calculateConfidenceReduction,
  EnhancedMarketContext
} from "./advancedMarketContext";
import { extractRealCandlesFromImage } from "./realCandleExtraction";

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

// REMOVIDO: Todas as funções de simulação e dados mock

// NOVA FUNÇÃO: Extração real de candles da imagem
export const detectCandles = async (imageData: string, width: number, height: number): Promise<CandleData[]> => {
  console.log('🔍 Extraindo candles REAIS da imagem capturada...');
  
  try {
    const realCandles = await extractRealCandlesFromImage(imageData);
    console.log(`✅ ${realCandles.length} candles reais extraídos da imagem`);
    return realCandles;
  } catch (error) {
    console.error('❌ Erro ao extrair candles reais:', error);
    return [];
  }
};

// NOVA FUNÇÃO: Detectar padrões reais baseados nos candles extraídos
export const detectPatterns = async (imageData: string): Promise<PatternResult[]> => {
  console.log('🔍 Detectando padrões REAIS dos candles extraídos...');
  
  const candles = await detectCandles(imageData, 1280, 720);
  
  if (candles.length === 0) {
    console.log('❌ Nenhum candle extraído - não é possível detectar padrões');
    return [];
  }
  
  // Detectar padrões de candlestick reais
  const candlePatterns = detectCandlestickPatterns(candles);
  
  // Converter para PatternResult
  return candlePatterns.map(pattern => ({
    type: pattern.type,
    confidence: pattern.confidence,
    description: pattern.description,
    recommendation: `Sinal de ${pattern.action}`,
    action: pattern.action
  }));
};

export const generateTechnicalMarkup = (patterns: PatternResult[], width: number, height: number) => {
  return patterns.map((pattern, index) => ({
    id: `pattern-${index}`,
    type: 'pattern' as const,
    patternType: pattern.type as any,
    points: [{ x: Math.random() * width * 0.8, y: Math.random() * height * 0.8 }],
    color: '#ff0000',
    pattern: pattern.type,
    confidence: pattern.confidence
  }));
};

// FUNÇÃO PRINCIPAL: Análise REAL com dados extraídos da imagem
export const analyzeChart = async (imageData: string, options: AnalysisOptions = {}): Promise<AnalysisResult> => {
  console.log('🚀 Iniciando análise REAL do gráfico capturado...');
  
  // Extrair candles REAIS da imagem capturada
  const candles = await extractRealCandlesFromImage(imageData);
  
  if (candles.length === 0) {
    console.log('❌ ERRO: Nenhum candle extraído da imagem. Verifique se a imagem contém um gráfico de candles válido.');
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
        trend: 'neutral',
        abnormal: false,
        significance: 'low',
        relativeToAverage: 1,
        distribution: 'neutral',
        divergence: false
      },
      volatilityData: {
        value: 0,
        trend: 'neutral',
        atr: 0,
        percentageRange: 0,
        isHigh: false,
        historicalComparison: 'average',
        impliedVolatility: 0
      },
      marketContext: {
        phase: 'indefinida',
        strength: 'fraca',
        dominantTimeframe: '1m',
        sentiment: 'neutro',
        description: 'Nenhum candle detectado na imagem',
        marketStructure: 'indefinida',
        breakoutPotential: 'baixo',
        momentumSignature: 'estável',
        advancedConditions: {
          recommendation: 'nao_operar',
          warnings: ['Dados insuficientes - imagem não contém candles detectáveis'],
          timeBasedFactors: {},
          marketPhaseAnalysis: {},
          volatilityProfile: {},
          liquidityConditions: {},
          institutionalActivity: {}
        },
        operatingScore: 0,
        confidenceReduction: 1
      },
      warnings: ['Nenhum candle detectado na imagem capturada'],
      preciseEntryAnalysis: {
        exactMinute: 'reversao',
        entryType: 'reversao',
        nextCandleExpectation: 'reversao',
        priceAction: 'reversao',
        confirmationSignal: 'reversao',
        riskRewardRatio: 0,
        entryInstructions: 'Dados insuficientes - aponte a câmera para um gráfico de candles válido'
      },
      confluences: {
        confluenceScore: 0,
        supportResistance: [],
        criticalLevels: [],
        marketStructure: {
          structure: 'lateral',
          strength: 0
        },
        priceAction: {
          trend: 'lateral',
          momentum: 'neutro',
          strength: 0
        }
      },
      priceActionSignals: [],
      detailedMarketContext: {
        phase: 'indefinida',
        sentiment: 'neutro',
        strength: 'fraca',
        description: 'Sem dados válidos',
        marketStructure: 'indefinida',
        breakoutPotential: 'baixo',
        momentumSignature: 'estável',
        institutionalBias: 'neutro',
        volatilityState: 'indefinida',
        liquidityCondition: 'indefinida',
        timeOfDay: 'indefinido',
        trend: 'lateral'
      },
      entryRecommendations: []
    };
  }

  console.log(`📊 Analisando ${candles.length} candles REAIS extraídos da imagem`);
  
  // Análise avançada de condições de mercado (COM DADOS REAIS)
  const advancedConditions = analyzeAdvancedMarketConditions(candles);
  const operatingScore = calculateOperatingScore(advancedConditions);
  const confidenceReduction = calculateConfidenceReduction(advancedConditions);
  
  console.log(`🎯 Score de operação: ${operatingScore}/100`);
  console.log(`⚠️ Redução de confiança: ${(confidenceReduction * 100).toFixed(0)}%`);
  console.log(`📋 Recomendação: ${advancedConditions.recommendation}`);
  
  if (advancedConditions.warnings.length > 0) {
    console.log('🚨 Warnings:', advancedConditions.warnings);
  }
  
  // Análise de volatilidade (COM DADOS REAIS)
  const volatilityAnalysis = analyzeVolatility(candles);
  console.log(`📈 Volatilidade: ${volatilityAnalysis.value.toFixed(2)}% (trend: ${volatilityAnalysis.trend})`);
  
  // Detectar padrões reais dos candles extraídos
  const patterns: PatternResult[] = [];
  
  // Padrões de candlestick (COM DADOS REAIS)
  let candlePatterns: DetectedPattern[] = [];
  if (options.enableCandleDetection !== false && candles.length > 0) {
    candlePatterns = detectCandlestickPatterns(candles);
    console.log(`🕯️ Padrões de candlestick detectados: ${candlePatterns.length}`);
    
    // Converter padrões de candle para PatternResult
    candlePatterns.forEach(pattern => {
      patterns.push({
        type: pattern.type,
        confidence: pattern.confidence * confidenceReduction,
        description: pattern.description,
        recommendation: `Considerar ${pattern.action}`,
        action: pattern.action
      });
    });
  }
  
  // Padrões gráficos (COM DADOS REAIS)
  if (candles.length > 0) {
    const chartPatternTypes = ['triangulo', 'suporte_resistencia', 'canal', 'rompimento'];
    
    for (const patternType of chartPatternTypes) {
      const detectedPatterns = await detectChartPatterns(candles, patternType, options);
      
      detectedPatterns.forEach(pattern => {
        patterns.push({
          type: pattern.pattern,
          confidence: pattern.confidence * confidenceReduction,
          description: pattern.description,
          recommendation: pattern.recommendation,
          action: pattern.action,
        });
      });
    }
  }
  
  // Aplicar warnings se as condições são ruins
  patterns.forEach(pattern => {
    if (operatingScore < 30) {
      pattern.description += ` ⚠️ CUIDADO: Condições adversas de mercado (Score: ${operatingScore}/100)`;
    }
  });
  
  // Price action analysis (COM DADOS REAIS)
  const priceActionSignals = candles.length > 0 ? analyzePriceAction(candles) : [];
  console.log(`⚡️ Price Action Signals: ${priceActionSignals.length} signals detected`);
  
  // Volume analysis (COM DADOS REAIS)
  const volumeData: VolumeData = candles.length > 0 ? analyzeVolume(candles) : {
    value: 0,
    trend: 'neutral',
    abnormal: false,
    significance: 'low',
    relativeToAverage: 1,
    distribution: 'neutral',
    divergence: false
  };
  console.log(`📊 Volume Analysis: Trend - ${volumeData.trend}, Significance - ${volumeData.significance}`);
  
  // Divergence analysis (COM DADOS REAIS)
  const divergences = candles.length > 0 ? detectDivergences(candles) : [];
  console.log(`🔍 Divergências encontradas: ${divergences.length}`);
  
  // Technical indicators (COM DADOS REAIS)
  const technicalIndicators: TechnicalIndicator[] = candles.length > 0 ? detectTechnicalIndicators(candles) : [];
  console.log(`⚙️ Indicadores técnicos detectados: ${technicalIndicators.length}`);
  
  // Scalping signals (COM DADOS REAIS)
  const scalpingSignals: ScalpingSignal[] = candlePatterns.map(signal => ({
    type: 'entrada',
    action: signal.action === 'compra' ? 'compra' : 'venda',
    price: candles.length > 0 ? candles[candles.length - 1].close.toFixed(5) : '0.00000',
    confidence: signal.confidence,
    timeframe: options.timeframe || '1m',
    description: signal.description,
  }));
  console.log(`⚡️ Scalping Signals: ${scalpingSignals.length} signals detected`);
  
  // Market context (COM DADOS REAIS)
  const marketContextAnalysis = candles.length > 0 ? analyzeMarketContext(candles) : {
    phase: 'consolidacao' as const,
    sentiment: 'neutro' as const,
    volatilityState: 'normal' as const,
    liquidityCondition: 'normal' as const,
    institutionalBias: 'neutro' as const,
    timeOfDay: 'meio_dia' as const,
    marketStructure: {
      trend: 'lateral' as const,
      strength: 50,
      breakouts: false,
      pullbacks: false
    }
  };
  console.log(`🌎 Market Context: Phase - ${marketContextAnalysis.phase}, Sentiment - ${marketContextAnalysis.sentiment}`);
  
  // Confluence analysis (COM DADOS REAIS)
  const confluenceAnalysis = candles.length > 0 ? performConfluenceAnalysis(candles, candlePatterns) : {
    confluenceScore: 0,
    supportResistance: [],
    criticalLevels: [],
    marketStructure: { structure: 'lateral', strength: 0 },
    priceAction: { trend: 'lateral', momentum: 'neutro', strength: 0 }
  };
  console.log(`🤝 Confluence Score: ${confluenceAnalysis.confluenceScore}`);
  
  // Contexto de mercado aprimorado (COM DADOS REAIS)
  const enhancedMarketContext: EnhancedMarketContext = {
    phase: 'indefinida',
    strength: 'fraca',
    dominantTimeframe: options.timeframe || '1m',
    sentiment: 'neutro',
    description: `Score: ${operatingScore}/100 - ${candles.length} candles analisados`,
    marketStructure: 'indefinida',
    breakoutPotential: 'baixo',
    momentumSignature: 'estável',
    advancedConditions,
    operatingScore,
    confidenceReduction
  };
  
  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
  
  return {
    patterns,
    timestamp: Date.now(),
    imageUrl: imageData,
    technicalElements: [],
    candles: candles,
    scalpingSignals: scalpingSignals,
    technicalIndicators: technicalIndicators,
    volumeData: volumeData,
    volatilityData: volatilityAnalysis,
    marketContext: enhancedMarketContext,
    warnings: advancedConditions.warnings,
    preciseEntryAnalysis: {
      exactMinute: patterns.length > 0 ? 'confirmacao' : 'aguardar',
      entryType: patterns.length > 0 ? 'breakout' : 'reversao',
      nextCandleExpectation: patterns.length > 0 ? 'continuacao' : 'reversao',
      priceAction: priceActionSignals.length > 0 ? 'forte' : 'fraco',
      confirmationSignal: patterns.length > 0 ? 'confirmado' : 'pendente',
      riskRewardRatio: patterns.length > 0 ? 2.5 : 0,
      entryInstructions: patterns.length > 0 ? 
        `Entry próximo de ${currentPrice.toFixed(5)}` : 
        'Aguardar melhor setup'
    },
    confluences: confluenceAnalysis,
    priceActionSignals: priceActionSignals,
    detailedMarketContext: {
      phase: marketContextAnalysis.phase,
      sentiment: marketContextAnalysis.sentiment,
      strength: patterns.length > 0 ? 'forte' : 'fraca',
      description: `${patterns.length} padrões detectados em ${candles.length} candles reais`,
      marketStructure: 'definida',
      breakoutPotential: patterns.length > 0 ? 'alto' : 'baixo',
      momentumSignature: volatilityAnalysis.isHigh ? 'volatil' : 'estavel',
      institutionalBias: marketContextAnalysis.institutionalBias,
      volatilityState: marketContextAnalysis.volatilityState,
      liquidityCondition: marketContextAnalysis.liquidityCondition,
      timeOfDay: marketContextAnalysis.timeOfDay,
      trend: marketContextAnalysis.marketStructure.trend
    },
    entryRecommendations: patterns.slice(0, 3).map(p => ({
      type: p.action,
      confidence: p.confidence,
      description: p.description,
      price: currentPrice.toFixed(5)
    }))
  };
};
