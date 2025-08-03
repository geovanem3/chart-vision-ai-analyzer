
import { PatternResult, AnalysisResult, VolumeData, VolatilityData, TechnicalIndicator, ScalpingSignal, CandleData } from "../context/AnalyzerContext";
import { mockCandles as generateMockCandles } from "./mockData";
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

// Export missing functions that ControlPanel.tsx expects
export const detectPatterns = async (imageData: string): Promise<PatternResult[]> => {
  // Simple pattern detection simulation
  const patterns: PatternResult[] = [
    {
      type: 'Martelo',
      confidence: Math.random() * 0.4 + 0.6,
      description: 'Padrão de reversão bullish detectado',
      recommendation: 'Considerar compra',
      action: 'compra'
    },
    {
      type: 'Doji',
      confidence: Math.random() * 0.4 + 0.5,
      description: 'Indecisão do mercado',
      recommendation: 'Aguardar confirmação',
      action: 'neutro'
    }
  ];
  
  return patterns;
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
  // Generate mock candle data for the detected chart
  const candles = await generateMockCandles(20, '1m');
  
  // Add position data based on chart dimensions
  return candles.map((candle, index) => ({
    ...candle,
    position: {
      x: (index / 20) * width,
      y: Math.random() * height
    },
    width: width / 25,
    height: Math.abs(candle.high - candle.low) * (height / 100)
  }));
};

export const analyzeChart = async (imageData: string, options: AnalysisOptions = {}): Promise<AnalysisResult> => {
  console.log('🚀 Iniciando análise completa do gráfico com técnicas dos mestres...');
  
  const numCandles = options.optimizeForScalping ? 60 : 120;
  const timeframe = options.timeframe || '1m';
  
  const candles = await generateMockCandles(numCandles, timeframe);
  
  console.log(`📊 Gerados ${candles.length} candles para análise`);
  
  // ANÁLISE DOS MESTRES - Importar e aplicar as técnicas
  const { getMasterAnalysis } = await import('./masterTechniques');
  
  // Selecionar padrão aleatório para análise dos mestres
  const availablePatterns = ['Pin Bar', 'Engolfo de Alta', 'Engolfo de Baixa', 'Triângulo Ascendente'];
  const selectedPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
  
  const masterAnalysis = getMasterAnalysis(timeframe, selectedPattern);
  
  console.log(`🎯 Análise dos Mestres aplicada para padrão: ${selectedPattern}`);
  console.log(`📊 Bulkowski: ${masterAnalysis.bulkowski?.name} (${(masterAnalysis.bulkowski?.reliability * 100).toFixed(0)}%)`);
  console.log(`⚡ Elder: ${masterAnalysis.tripleScreen?.shortTermEntry} (${(masterAnalysis.tripleScreen?.confidence * 100).toFixed(0)}%)`);
  console.log(`📈 Murphy: Tendência ${masterAnalysis.murphy?.trendAnalysis.primary}`);
  
  // Análise avançada de condições de mercado
  const advancedConditions = analyzeAdvancedMarketConditions(candles);
  const operatingScore = calculateOperatingScore(advancedConditions);
  const confidenceReduction = calculateConfidenceReduction(advancedConditions);
  
  console.log(`🎯 Score de operação: ${operatingScore}/100`);
  console.log(`⚠️ Redução de confiança: ${(confidenceReduction * 100).toFixed(0)}%`);
  console.log(`📋 Recomendação: ${advancedConditions.recommendation}`);
  
  if (advancedConditions.warnings.length > 0) {
    console.log('🚨 Warnings:', advancedConditions.warnings);
  }
  
  // Analyze volatility
  const volatilityAnalysis = analyzeVolatility(candles);
  console.log(`📈 Volatilidade: ${volatilityAnalysis.value.toFixed(2)}% (trend: ${volatilityAnalysis.trend})`);
  
  // NOVO: Geração de padrões baseada nos mestres
  const patterns: PatternResult[] = [];
  
  // Adicionar padrão principal da análise dos mestres
  if (masterAnalysis.bulkowski) {
    const bulkowskiPattern = masterAnalysis.bulkowski;
    patterns.push({
      type: bulkowskiPattern.name,
      confidence: bulkowskiPattern.reliability * confidenceReduction,
      description: `${bulkowskiPattern.name} detectado - Volume ${bulkowskiPattern.volumeImportance}. ${masterAnalysis.masterRecommendation?.substring(0, 100)}...`,
      recommendation: masterAnalysis.tripleScreen?.shortTermEntry === 'long' ? 'Considerar compra' : 
                     masterAnalysis.tripleScreen?.shortTermEntry === 'short' ? 'Considerar venda' : 'Aguardar melhor setup',
      action: masterAnalysis.tripleScreen?.shortTermEntry === 'long' ? 'compra' : 
              masterAnalysis.tripleScreen?.shortTermEntry === 'short' ? 'venda' : 'neutro'
    });
  }
  
  // Gerar padrões adicionais baseados na análise
  const additionalPatterns = ['Doji', 'Hammer', 'Shooting Star', 'Dark Cloud Cover'];
  const numAdditionalPatterns = Math.floor(Math.random() * 3) + 1; // 1-3 padrões adicionais
  
  for (let i = 0; i < numAdditionalPatterns; i++) {
    const patternType = additionalPatterns[Math.floor(Math.random() * additionalPatterns.length)];
    const baseConfidence = 0.5 + Math.random() * 0.3; // 50-80% base
    const finalConfidence = baseConfidence * confidenceReduction;
    
    // Gerar descrição dinâmica baseada no contexto
    let description = `Padrão ${patternType} identificado`;
    let recommendation = 'Monitorar evolução';
    let action = 'neutro' as 'compra' | 'venda' | 'neutro';
    
    if (masterAnalysis.murphy?.trendAnalysis.primary === 'bullish' && finalConfidence > 0.6) {
      description += ' em contexto bullish. Confluência com tendência primária';
      recommendation = 'Considerar posição de compra';
      action = 'compra';
    } else if (masterAnalysis.murphy?.trendAnalysis.primary === 'bearish' && finalConfidence > 0.6) {
      description += ' em contexto bearish. Confluência com tendência primária';
      recommendation = 'Considerar posição de venda';
      action = 'venda';
    } else {
      description += '. Aguardar confirmação adicional';
    }
    
    if (operatingScore < 30) {
      description += ` ⚠️ Condições adversas (Score: ${operatingScore}/100)`;
    }
    
    patterns.push({
      type: patternType,
      confidence: finalConfidence,
      description,
      recommendation,
      action
    });
  }
  
  // Price action analysis
  const priceActionSignals = analyzePriceAction(candles);
  console.log(`⚡️ Price Action Signals: ${priceActionSignals.length} signals detected`);
  
  // Volume analysis
  const volumeData: VolumeData = analyzeVolume(candles);
  console.log(`📊 Volume Analysis: Trend - ${volumeData.trend}, Significance - ${volumeData.significance}`);
  
  // Divergence analysis
  const divergences = detectDivergences(candles);
  console.log(`🔍 Divergências encontradas: ${divergences.length}`);
  
  // Candlestick patterns
  let candlePatterns: DetectedPattern[] = [];
  if (options.enableCandleDetection !== false) {
    candlePatterns = detectCandlestickPatterns(candles);
    console.log(`🕯️ Padrões de candlestick detectados: ${candlePatterns.length}`);
  }
  
  // Technical indicators
  const technicalIndicators: TechnicalIndicator[] = detectTechnicalIndicators(candles);
  console.log(`⚙️ Indicadores técnicos detectados: ${technicalIndicators.length}`);
  
  // Scalping signals
  const scalpingSignals: ScalpingSignal[] = candlePatterns.map(signal => ({
    type: 'entrada',
    action: signal.action === 'compra' ? 'compra' : 'venda',
    price: '...',
    confidence: signal.confidence,
    timeframe: options.timeframe || '1m',
    description: signal.description,
  }));
  console.log(`⚡️ Scalping Signals: ${scalpingSignals.length} signals detected`);
  
  // Market context
  const marketContextAnalysis = analyzeMarketContext(candles);
  console.log(`🌎 Market Context: Phase - ${marketContextAnalysis.phase}, Sentiment - ${marketContextAnalysis.sentiment}`);
  
  // Confluence analysis
  const confluenceAnalysis = performConfluenceAnalysis(candles, candlePatterns);
  console.log(`🤝 Confluence Score: ${confluenceAnalysis.confluenceScore}`);
  
  // NOVO: Criar contexto de mercado aprimorado
  const enhancedMarketContext: EnhancedMarketContext = {
    phase: 'lateral',
    strength: 'moderada',
    dominantTimeframe: options.timeframe || '1m',
    sentiment: 'neutro',
    description: `Score: ${operatingScore}/100`,
    marketStructure: 'indefinida',
    breakoutPotential: 'baixo',
    momentumSignature: 'estável',
    advancedConditions,
    operatingScore,
    confidenceReduction
  };
  
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
    masterAnalysis: masterAnalysis, // NOVO: Incluir análise dos mestres
    preciseEntryAnalysis: {
      exactMinute: 'agora',
      entryType: masterAnalysis.tripleScreen?.shortTermEntry === 'long' ? 'breakout' : 
                 masterAnalysis.tripleScreen?.shortTermEntry === 'short' ? 'pullback' : 'reversão',
      nextCandleExpectation: 'confirmação',
      priceAction: masterAnalysis.murphy?.trendAnalysis.primary === 'bullish' ? 'bullish' : 
                   masterAnalysis.murphy?.trendAnalysis.primary === 'bearish' ? 'bearish' : 'neutro',
      confirmationSignal: masterAnalysis.tripleScreen?.confidence && masterAnalysis.tripleScreen.confidence > 0.7 ? 'confirmado' : 'aguardando',
      riskRewardRatio: masterAnalysis.bulkowski?.averageMove ? Math.abs(masterAnalysis.bulkowski.averageMove / 5) : 2.5,
      entryInstructions: masterAnalysis.masterRecommendation || 'Aguardar confirmação no próximo candle'
    },
    confluences: confluenceAnalysis,
    priceActionSignals: priceActionSignals,
    detailedMarketContext: {
      phase: masterAnalysis.murphy?.trendAnalysis.primary === 'bullish' ? 'markup' : 
             masterAnalysis.murphy?.trendAnalysis.primary === 'bearish' ? 'markdown' : 'lateral',
      sentiment: masterAnalysis.tripleScreen?.longTermTrend === 'up' ? 'bullish' :
                 masterAnalysis.tripleScreen?.longTermTrend === 'down' ? 'bearish' : 'neutro',
      strength: masterAnalysis.tripleScreen?.confidence ? 
                (masterAnalysis.tripleScreen.confidence > 0.7 ? 'forte' : 
                 masterAnalysis.tripleScreen.confidence > 0.5 ? 'moderada' : 'fraca') : 'moderada',
      description: `Score: ${operatingScore}/100 | Mestres: ${masterAnalysis.masterRecommendation?.substring(0, 50)}...`,
      marketStructure: masterAnalysis.murphy?.trendAnalysis.primary || 'indefinida',
      breakoutPotential: masterAnalysis.bulkowski?.breakoutDirection === 'up' ? 'alto_bullish' : 
                         masterAnalysis.bulkowski?.breakoutDirection === 'down' ? 'alto_bearish' : 'baixo',
      momentumSignature: masterAnalysis.tripleScreen?.mediumTermOscillator === 'buy' ? 'crescente' :
                         masterAnalysis.tripleScreen?.mediumTermOscillator === 'sell' ? 'decrescente' : 'estável',
      institutionalBias: masterAnalysis.murphy?.volumeAnalysis?.trend === 'confirming' ? 'alinhado' : 'neutro',
      volatilityState: volatilityAnalysis.trend === 'increasing' ? 'alta' : 'normal',
      liquidityCondition: 'adequada',
      timeOfDay: 'horário_comercial',
      trend: masterAnalysis.murphy?.trendAnalysis.primary || 'lateral'
    },
    entryRecommendations: []
  };
};
