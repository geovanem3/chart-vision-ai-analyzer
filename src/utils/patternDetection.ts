import { Chart } from "chart.js";
import { Pattern, PatternName, DetectedPattern } from "./types";
import { TechnicalElement, CandleData, Point } from "../context/AnalyzerContext";
import { 
  performConfluenceAnalysis, 
  validateSignalWithConfluences,
  ConfluenceAnalysis 
} from "./confluenceAnalysis";
import { 
  analyzePriceAction, 
  analyzeMarketContext, 
  PriceActionSignal, 
  MarketContextAnalysis 
} from "./priceActionAnalysis";
import { analyzeCandleMetrics, CandleMetrics } from "./candleAnalysis";

// Function to detect a specific pattern in the chart data
export const detectPattern = (chart: Chart, pattern: Pattern): boolean => {
    // Basic check to ensure chart and data are available
    if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length === 0) {
        console.warn("Chart data is not available.");
        return false;
    }

    const data = chart.data.datasets[0].data as number[];

    if (data.length < pattern.length) {
        return false; // Not enough data points to match the pattern
    }

    // Extract the last 'n' data points from the chart
    const dataWindow = data.slice(-pattern.length);

    // Compare the extracted data with the pattern
    for (let i = 0; i < pattern.length; i++) {
        if (dataWindow[i] !== pattern[i]) {
            return false; // Data does not match the pattern
        }
    }

    return true; // Data matches the pattern
};

// Function to generate a random pattern for testing purposes
export const generateRandomPattern = (length: number): Pattern => {
    const pattern: Pattern = [];
    for (let i = 0; i < length; i++) {
        pattern.push(Math.random() > 0.5 ? 1 : 0); // Binary pattern for simplicity
    }
    return pattern;
};

// Example patterns (can be expanded)
export const predefinedPatterns: { [key in PatternName]: Pattern } = {
    "bullish": [0, 1, 1, 0, 1],
    "bearish": [1, 0, 0, 1, 0],
    "neutral": [0, 1, 0, 1, 0]
};

export interface AnalysisOptions {
  sensitivity?: number;
  timeframe?: string;
  indicators?: string[];
  optimizeForScalping?: boolean;
  scalpingStrategy?: string;
  considerVolume?: boolean;
  considerVolatility?: boolean;
  marketContextEnabled?: boolean;
  marketAnalysisDepth?: string;
  enableCandleDetection?: boolean;
  isLiveAnalysis?: boolean;
  useConfluences?: boolean;
  enablePriceAction?: boolean;
  enableMarketContext?: boolean;
}

// Define VolatilityAnalysis interface
export interface VolatilityAnalysis {
  currentVolatility: number;
  volatilityRatio: number;
  isHighVolatility: boolean;
  averageVolatility: number;
}

export interface AnalysisResult {
  trend: string;
  signals: Array<{
    type: string;
    strength: number;
    description: string;
  }>;
  confidence: number;
  timestamp: number;
  patterns: DetectedPattern[];
  marketContext?: {
    sentiment: 'otimista' | 'pessimista' | 'neutro';
    phase: string;
    strength: string;
  };
  confluences?: ConfluenceAnalysis;
  priceActionSignals?: PriceActionSignal[];
  detailedMarketContext?: MarketContextAnalysis;
  validatedSignals?: Array<{
    pattern: DetectedPattern;
    validation: {
      isValid: boolean;
      confidence: number;
      reasons: string[];
      warnings: string[];
    };
  }>;
  entryRecommendations?: Array<{
    type: 'scalping_entry' | 'swing_entry';
    action: 'compra' | 'venda';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    confidence: number;
    reasoning: string;
    timeframe: string;
    riskReward: number;
  }>;
}

// Função melhorada para validar consistência entre sinais
const validateSignalConsistency = (
  patterns: DetectedPattern[],
  priceActionSignals: PriceActionSignal[],
  marketContext?: MarketContextAnalysis
): { consistentSignal: 'compra' | 'venda' | 'neutro'; confidence: number; reasoning: string } => {
  console.log('🔍 Validando consistência dos sinais...');
  
  // Contar votos para cada ação
  const votes = { compra: 0, venda: 0, neutro: 0 };
  const reasons: string[] = [];
  
  // Votos dos padrões
  patterns.forEach(pattern => {
    if (pattern.action !== 'neutro') {
      votes[pattern.action] += pattern.confidence;
      reasons.push(`Padrão ${pattern.type}: ${pattern.action} (${Math.round(pattern.confidence * 100)}%)`);
    }
  });
  
  // Votos do price action
  priceActionSignals.forEach(signal => {
    const action = signal.direction === 'alta' ? 'compra' : signal.direction === 'baixa' ? 'venda' : 'neutro';
    if (action !== 'neutro') {
      votes[action] += signal.confidence * 0.8; // Price action tem peso ligeiramente menor
      reasons.push(`Price Action ${signal.type}: ${action} (${Math.round(signal.confidence * 100)}%)`);
    }
  });
  
  // Voto do contexto de mercado - corrigir comparação de tipos
  if (marketContext) {
    const marketBias = marketContext.institutionalBias;
    if (marketBias === 'compra') {
      votes.compra += 0.3;
      reasons.push(`Contexto de mercado: ${marketBias}`);
    } else if (marketBias === 'venda') {
      votes.venda += 0.3;
      reasons.push(`Contexto de mercado: ${marketBias}`);
    }
  }
  
  // Determinar sinal dominante
  const totalVotes = votes.compra + votes.venda + votes.neutro;
  const compraPercent = votes.compra / totalVotes;
  const vendaPercent = votes.venda / totalVotes;
  
  let consistentSignal: 'compra' | 'venda' | 'neutro' = 'neutro';
  let confidence = 0;
  
  if (compraPercent > 0.6) {
    consistentSignal = 'compra';
    confidence = compraPercent;
  } else if (vendaPercent > 0.6) {
    consistentSignal = 'venda';
    confidence = vendaPercent;
  } else {
    // Sinais conflitantes
    confidence = Math.max(compraPercent, vendaPercent) * 0.5; // Reduzir confiança
  }
  
  console.log(`✅ Sinal consistente: ${consistentSignal} (${Math.round(confidence * 100)}%)`);
  
  return {
    consistentSignal,
    confidence,
    reasoning: reasons.join(' | ')
  };
};

// Função para detectar divergências e alertas
const detectAnalysisWarnings = (
  patterns: DetectedPattern[],
  priceActionSignals: PriceActionSignal[],
  confluences?: ConfluenceAnalysis
): string[] => {
  const warnings: string[] = [];
  
  // Verificar conflitos entre padrões
  const patternActions = patterns.map(p => p.action).filter(a => a !== 'neutro');
  const uniqueActions = [...new Set(patternActions)];
  
  if (uniqueActions.length > 1) {
    warnings.push('⚠️ Sinais conflitantes entre padrões detectados');
  }
  
  // Verificar se price action confirma padrões
  if (patterns.length > 0 && priceActionSignals.length > 0) {
    const patternAction = patterns[0]?.action;
    const paDirection = priceActionSignals[0]?.direction;
    
    if (patternAction === 'compra' && paDirection === 'baixa') {
      warnings.push('⚠️ Price Action contra padrão de compra');
    } else if (patternAction === 'venda' && paDirection === 'alta') {
      warnings.push('⚠️ Price Action contra padrão de venda');
    }
  }
  
  // Verificar score de confluência baixo
  if (confluences && confluences.confluenceScore < 50) {
    warnings.push('⚠️ Score de confluência baixo - sinal fraco');
  }
  
  return warnings;
};

// Add volatility analysis function
const analyzeVolatility = (candles: CandleData[]): VolatilityAnalysis => {
  const recentCandles = candles.slice(-20); // Last 20 candles
  const ranges = recentCandles.map(candle => (candle.high - candle.low) / candle.close);
  
  const currentVolatility = ranges[ranges.length - 1] || 0;
  const averageVolatility = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  const volatilityRatio = currentVolatility / averageVolatility;
  
  return {
    currentVolatility: currentVolatility * 100, // Convert to percentage
    volatilityRatio,
    isHighVolatility: volatilityRatio > 1.5,
    averageVolatility: averageVolatility * 100
  };
};

export const analyzeChart = async (imageData: string, options: AnalysisOptions = {}): Promise<AnalysisResult> => {
  console.log('🚀 Iniciando análise completa do gráfico...');
  
  // Simulate analysis delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock candle data for confluence analysis
  const mockCandles: CandleData[] = [];
  const numCandles = options.isLiveAnalysis ? 30 : 50;
  let basePrice = 100;
  
  // Gerar dados mais realistas com base no timeframe
  for (let i = 0; i < numCandles; i++) {
    const variation = (Math.random() - 0.5) * (options.timeframe === '1m' ? 2 : 4);
    const open = basePrice + variation;
    const close = open + (Math.random() - 0.5) * (options.timeframe === '1m' ? 1 : 2);
    const high = Math.max(open, close) + Math.random() * (options.timeframe === '1m' ? 0.5 : 1);
    const low = Math.min(open, close) - Math.random() * (options.timeframe === '1m' ? 0.5 : 1);
    
    mockCandles.push({
      open,
      close,
      high,
      low,
      color: close > open ? 'verde' : 'vermelho',
      position: { x: i * 10, y: 300 - (close - 95) * 20 },
      width: 8,
      height: Math.abs(close - open) * 20
    });
    
    basePrice = close;
  }
  
  console.log(`📊 Gerados ${mockCandles.length} candles para análise`);
  
  // Analyze volatility
  const volatilityAnalysis = analyzeVolatility(mockCandles);
  console.log(`📈 Volatilidade: ${volatilityAnalysis.currentVolatility.toFixed(2)}% (ratio: ${volatilityAnalysis.volatilityRatio.toFixed(2)})`);
  
  // Generate patterns with better logic
  const patternTypes = ['Martelo', 'Engolfo de Alta', 'Estrela Cadente', 'Doji', 'Triângulo'];
  const numPatterns = Math.floor(Math.random() * 2) + 1; // 1-2 patterns for consistency
  
  const patterns: DetectedPattern[] = [];
  for (let i = 0; i < numPatterns; i++) {
    const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    
    // Melhor lógica para determinar ação baseada no tipo de padrão
    let action: 'compra' | 'venda' | 'neutro' = 'neutro';
    if (patternType === 'Martelo' || patternType === 'Engolfo de Alta') {
      action = Math.random() > 0.3 ? 'compra' : 'neutro';
    } else if (patternType === 'Estrela Cadente') {
      action = Math.random() > 0.3 ? 'venda' : 'neutro';
    } else {
      action = Math.random() > 0.5 ? (Math.random() > 0.5 ? 'compra' : 'venda') : 'neutro';
    }
    
    patterns.push({
      type: patternType,
      action,
      confidence: Math.random() * 0.4 + 0.5, // 0.5 to 0.9
      description: `${patternType} detectado`
    });
  }
  
  console.log(`🎯 Detectados ${patterns.length} padrões`);
  
  let result: AnalysisResult = {
    trend: 'Sideways',
    signals: [],
    confidence: 0,
    timestamp: Date.now(),
    patterns
  };
  
  // Add price action analysis
  let priceActionSignals: PriceActionSignal[] = [];
  if (options.enablePriceAction !== false) {
    priceActionSignals = analyzePriceAction(mockCandles);
    result.priceActionSignals = priceActionSignals;
    console.log(`📈 Analisados ${priceActionSignals.length} sinais de price action`);
  }
  
  // Add detailed market context analysis
  let detailedMarketContext: MarketContextAnalysis | undefined;
  if (options.enableMarketContext !== false) {
    detailedMarketContext = analyzeMarketContext(mockCandles);
    result.detailedMarketContext = detailedMarketContext;
    console.log(`🏛️ Contexto de mercado: ${detailedMarketContext.phase}`);
  }
  
  // Validar consistência entre todos os sinais
  const consistencyCheck = validateSignalConsistency(patterns, priceActionSignals, detailedMarketContext);
  
  // Atualizar padrões para serem consistentes com o sinal dominante
  if (consistencyCheck.consistentSignal !== 'neutro') {
    patterns.forEach(pattern => {
      if (pattern.action !== 'neutro' && pattern.action !== consistencyCheck.consistentSignal) {
        // Ajustar padrões conflitantes para neutro ou consistent signal
        if (Math.random() > 0.7) {
          pattern.action = consistencyCheck.consistentSignal;
          pattern.confidence *= 0.8; // Reduzir confiança
        } else {
          pattern.action = 'neutro';
          pattern.confidence *= 0.5;
        }
      }
    });
  }
  
  // Set trend based on market context - corrigir mapeamento de tipos
  if (detailedMarketContext?.marketStructure?.trend) {
    const rawTrend = detailedMarketContext.marketStructure.trend;
    if (rawTrend === 'alta') {
      result.trend = 'Bullish';
    } else if (rawTrend === 'baixa') {
      result.trend = 'Bearish';
    } else {
      result.trend = 'Sideways';
    }
  }
  
  // Add confluence analysis if enabled
  if (options.useConfluences !== false) {
    const confluenceAnalysis = performConfluenceAnalysis(mockCandles, patterns);
    result.confluences = confluenceAnalysis;
    
    // Validate signals with confluences
    const currentPrice = mockCandles[mockCandles.length - 1]?.close || 100;
    const validatedSignals = patterns.map(pattern => ({
      pattern,
      validation: validateSignalWithConfluences(pattern, confluenceAnalysis, currentPrice)
    }));
    
    result.validatedSignals = validatedSignals;
    console.log(`🔄 Validados ${validatedSignals.length} sinais com confluências`);
  }
  
  // Set final confidence based on consistency
  result.confidence = consistencyCheck.confidence * 100;
  
  // Update market context
  result.marketContext = {
    sentiment: consistencyCheck.consistentSignal === 'compra' ? 'otimista' : 
               consistencyCheck.consistentSignal === 'venda' ? 'pessimista' : 'neutro',
    phase: detailedMarketContext?.phase || 'indefinida',
    strength: result.confidence > 70 ? 'forte' : result.confidence > 50 ? 'moderada' : 'fraca'
  };
  
  // Generate signals based on consistent signal
  if (consistencyCheck.consistentSignal !== 'neutro') {
    result.signals = [{
      type: consistencyCheck.consistentSignal === 'compra' ? 'Buy' : 'Sell',
      strength: result.confidence,
      description: `Sinal ${consistencyCheck.consistentSignal} baseado em: ${consistencyCheck.reasoning}`
    }];
  }
  
  // Generate specific entry recommendations for M1 scalping
  if (options.optimizeForScalping && options.timeframe === '1m') {
    result.entryRecommendations = generateScalpingEntries(
      mockCandles, 
      patterns, 
      priceActionSignals, 
      result.confluences,
      result.detailedMarketContext,
      volatilityAnalysis
    );
    console.log(`💡 Geradas ${result.entryRecommendations?.length || 0} recomendações de entrada`);
  }
  
  // Detectar avisos e problemas
  const warnings = detectAnalysisWarnings(patterns, priceActionSignals, result.confluences);
  if (warnings.length > 0) {
    console.warn('⚠️ Avisos detectados:', warnings);
    // Reduzir confiança se há muitos avisos
    if (warnings.length >= 2) {
      result.confidence *= 0.8;
    }
  }
  
  console.log(`✅ Análise completa finalizada - Confiança: ${Math.round(result.confidence)}%`);
  
  return result;
};

// Generate specific scalping entry recommendations with candle analysis
const generateScalpingEntries = (
  candles: CandleData[],
  patterns: DetectedPattern[],
  priceActionSignals: PriceActionSignal[],
  confluences?: ConfluenceAnalysis,
  marketContext?: MarketContextAnalysis,
  volatilityAnalysis?: VolatilityAnalysis
): AnalysisResult['entryRecommendations'] => {
  const entries: AnalysisResult['entryRecommendations'] = [];
  const currentPrice = candles[candles.length - 1]?.close || 100;
  const currentCandle = candles[candles.length - 1];
  const currentMetrics = analyzeCandleMetrics(currentCandle);
  
  console.log('💰 Gerando recomendações com análise de candles...');
  
  // Filtrar apenas padrões válidos e confiáveis
  const validPatterns = patterns.filter(pattern => 
    pattern.action !== 'neutro' && 
    pattern.confidence > 0.5
  );
  
  if (validPatterns.length === 0) {
    console.log('⚠️ Nenhum padrão válido para gerar entradas');
    return [];
  }
  
  validPatterns.forEach(pattern => {
    const validAction = pattern.action as 'compra' | 'venda';
    
    // Verificar alinhamento com price action
    const alignedPASignals = priceActionSignals.filter(pa => 
      (validAction === 'compra' && pa.direction === 'alta') ||
      (validAction === 'venda' && pa.direction === 'baixa')
    );
    
    // Verificar qualidade do candle atual
    const isCandleQualityGood = currentMetrics.bodyPercent > 15 || 
                               currentMetrics.isPinBar || 
                               currentMetrics.isHammer || 
                               currentMetrics.isShootingStar;
    
    // Só gerar entrada se há alinhamento OU se o padrão é muito forte OU se o candle tem boa qualidade
    if (alignedPASignals.length > 0 || pattern.confidence > 0.8 || isCandleQualityGood) {
      const bestPASignal = alignedPASignals.length > 0 ? 
        alignedPASignals.sort((a, b) => b.confidence - a.confidence)[0] : null;
      
      let entryPrice = currentPrice;
      let stopLoss = currentPrice;
      let takeProfit = currentPrice;
      let riskReward = 2.0;
      
      // Calcular preços baseados na análise de candles e volatilidade
      const volatilityFactor = volatilityAnalysis ? 
        Math.max(0.0005, Math.min(0.002, volatilityAnalysis.currentVolatility / 100)) : 
        0.001;
      
      const spreadFactor = 0.0003; // Spread reduzido para M1
      
      // Ajustar entrada baseada no tipo de candle
      if (bestPASignal?.entryZone) {
        entryPrice = bestPASignal.entryZone.optimal;
      } else {
        // Entrada baseada na análise do candle atual
        if (validAction === 'compra') {
          if (currentMetrics.isHammer || currentMetrics.wickDominance === 'lower') {
            // Entrada próxima ao close para martelos
            entryPrice = currentPrice * (1 + spreadFactor);
          } else {
            entryPrice = currentPrice * (1 + spreadFactor * 1.5);
          }
        } else {
          if (currentMetrics.isShootingStar || currentMetrics.wickDominance === 'upper') {
            // Entrada próxima ao close para estrelas cadentes
            entryPrice = currentPrice * (1 - spreadFactor);
          } else {
            entryPrice = currentPrice * (1 - spreadFactor * 1.5);
          }
        }
      }
      
      // Calcular stop loss baseado no tamanho do candle e volatilidade
      const candleBasedStop = Math.max(
        volatilityFactor * 1.5, // Stop mínimo baseado na volatilidade
        currentMetrics.totalRange * 0.6 / currentPrice // Stop baseado no range do candle
      );
      
      if (validAction === 'compra') {
        stopLoss = entryPrice * (1 - candleBasedStop);
        
        // Take profit baseado na análise do candle
        if (currentMetrics.isHammer && currentMetrics.lowerWickPercent > 60) {
          // Para martelos fortes, target maior
          takeProfit = entryPrice * (1 + (candleBasedStop * 3.5));
          riskReward = 3.5;
        } else {
          takeProfit = entryPrice * (1 + (candleBasedStop * 2.5));
          riskReward = 2.5;
        }
      } else {
        stopLoss = entryPrice * (1 + candleBasedStop);
        
        // Take profit para vendas
        if (currentMetrics.isShootingStar && currentMetrics.upperWickPercent > 60) {
          // Para estrelas cadentes fortes, target maior
          takeProfit = entryPrice * (1 - (candleBasedStop * 3.5));
          riskReward = 3.5;
        } else {
          takeProfit = entryPrice * (1 - (candleBasedStop * 2.5));
          riskReward = 2.5;
        }
      }
      
      // Calcular confiança combinada considerando candles
      let confidence = pattern.confidence;
      
      if (bestPASignal) {
        confidence = (pattern.confidence + bestPASignal.confidence) / 2;
      }
      
      // Boost para candles de alta qualidade
      if (isCandleQualityGood) {
        confidence = Math.min(1, confidence * 1.1);
      }
      
      // Boost se confluences align
      if (confluences && confluences.confluenceScore > 60) {
        confidence = Math.min(1, confidence * 1.1);
      }
      
      // Penalizar se volatilidade muito alta
      if (volatilityAnalysis && volatilityAnalysis.volatilityRatio > 2.5) {
        confidence *= 0.9;
      }
      
      let reasoning = `${pattern.type}`;
      if (bestPASignal) {
        reasoning += ` + ${bestPASignal.type} (${bestPASignal.strength})`;
      }
      
      // Adicionar informações do candle
      if (currentMetrics.isHammer) {
        reasoning += ` | Martelo: pavio ${currentMetrics.lowerWickPercent.toFixed(0)}%`;
      } else if (currentMetrics.isShootingStar) {
        reasoning += ` | Estrela: pavio ${currentMetrics.upperWickPercent.toFixed(0)}%`;
      } else if (currentMetrics.isPinBar) {
        reasoning += ` | Pin Bar: ${currentMetrics.wickDominance}`;
      }
      
      // Add confluence reasoning
      if (confluences && confluences.confluenceScore > 60) {
        reasoning += ` | Confluência: ${Math.round(confluences.confluenceScore)}%`;
      }
      
      // Add volatility context
      if (volatilityAnalysis) {
        reasoning += ` | Vol: ${volatilityAnalysis.volatilityRatio.toFixed(1)}x`;
      }
      
      entries.push({
        type: 'scalping_entry',
        action: validAction,
        entryPrice,
        stopLoss,
        takeProfit,
        confidence,
        reasoning,
        timeframe: '1m',
        riskReward
      });
    }
  });
  
  // Ordenar por confiança e limitar a 2 melhores
  return entries
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);
};

// Function to interpret the detected pattern
export const interpretPattern = (patternName: PatternName): string => {
    switch (patternName) {
        case "bullish":
            return "Bullish pattern detected: potential upward trend.";
        case "bearish":
            return "Bearish pattern detected: potential downward trend.";
        case "neutral":
            return "Neutral pattern detected: no clear trend.";
        default:
            return "Unknown pattern detected.";
    }
};

// Function to detect multiple patterns in an image
export const detectPatterns = async (imageData: string): Promise<DetectedPattern[]> => {
  // Simulate pattern detection
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const patternTypes = ['Martelo', 'Engolfo de Alta', 'Estrela Cadente', 'Doji', 'Triângulo', 'Cunha'];
  const actions: ('compra' | 'venda' | 'neutro')[] = ['compra', 'venda', 'neutro'];
  
  const numPatterns = Math.floor(Math.random() * 3) + 1; // 1-3 patterns
  const patterns: DetectedPattern[] = [];
  
  for (let i = 0; i < numPatterns; i++) {
    const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    patterns.push({
      type: patternType,
      action: action,
      confidence: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
      description: `${patternType} detectado com ação recomendada: ${action}`,
      coordinates: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        width: Math.random() * 200 + 50,
        height: Math.random() * 200 + 50
      }
    });
  }
  
  return patterns;
};

// Function to generate technical markup elements
export const generateTechnicalMarkup = (patterns: DetectedPattern[], width: number, height: number): TechnicalElement[] => {
  const elements: TechnicalElement[] = [];
  
  patterns.forEach((pattern, index) => {
    if (pattern.coordinates) {
      const centerPoint: Point = {
        x: pattern.coordinates.x + pattern.coordinates.width / 2,
        y: pattern.coordinates.y + pattern.coordinates.height / 2
      };
      
      elements.push({
        type: 'rectangle',
        position: centerPoint,
        width: pattern.coordinates.width,
        height: pattern.coordinates.height,
        color: pattern.action === 'compra' ? '#22c55e' : pattern.action === 'venda' ? '#ef4444' : '#6b7280',
        thickness: 2
      });
      
      elements.push({
        type: 'label',
        position: { x: centerPoint.x, y: centerPoint.y - pattern.coordinates.height / 2 - 10 },
        text: pattern.type,
        color: pattern.action === 'compra' ? '#22c55e' : pattern.action === 'venda' ? '#ef4444' : '#6b7280',
        backgroundColor: '#ffffff'
      });
    }
  });
  
  // Add some trend lines
  const trendLinePoints: Point[] = [
    { x: 0, y: height * 0.3 },
    { x: width, y: height * 0.3 }
  ];
  
  elements.push({
    type: 'line',
    points: trendLinePoints,
    color: '#3b82f6',
    thickness: 2
  });
  
  return elements;
};

// Function to detect candles in an image
export const detectCandles = async (imageData: string, width: number, height: number): Promise<CandleData[]> => {
  // Simulate candle detection
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const numCandles = Math.floor(Math.random() * 20) + 10; // 10-30 candles
  const candles: CandleData[] = [];
  
  for (let i = 0; i < numCandles; i++) {
    const open = Math.random() * 100 + 50;
    const close = open + (Math.random() - 0.5) * 20;
    const high = Math.max(open, close) + Math.random() * 10;
    const low = Math.min(open, close) - Math.random() * 10;
    
    const candleWidth = width / numCandles * 0.8;
    const candleHeight = Math.abs(close - open) * 2;
    
    candles.push({
      open,
      close,
      high,
      low,
      color: close > open ? 'verde' : 'vermelho',
      position: {
        x: (i / numCandles) * width,
        y: (1 - (high - 40) / 120) * height
      },
      width: candleWidth,
      height: candleHeight
    });
  }
  
  return candles;
};
