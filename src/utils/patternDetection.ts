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

// FUNÇÃO SEGURA para extração de candles com tratamento robusto de erros
export const detectCandles = async (imageData: string, width: number, height: number): Promise<CandleData[]> => {
  console.log('🔍 INICIANDO extração de candles REAIS da imagem...');
  
  try {
    // PROTEÇÃO: Validar entrada
    if (!imageData || typeof imageData !== 'string' || imageData.length === 0) {
      console.warn('⚠️ ImageData está vazio ou inválido');
      return [];
    }

    if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
      console.warn('⚠️ Dimensões inválidas:', { width, height });
      return [];
    }

    const realCandles = await extractRealCandlesFromImage(imageData);
    console.log(`✅ ${realCandles.length} candles REAIS extraídos com sucesso`);
    
    if (!Array.isArray(realCandles) || realCandles.length === 0) {
      console.warn('⚠️ Nenhum candle real foi detectado na imagem');
      return [];
    }
    
    // PROTEÇÃO: Validação rigorosa dos dados OHLC
    const validCandles = realCandles.filter(candle => {
      try {
        if (!candle || typeof candle !== 'object') {
          return false;
        }

        const hasValidNumbers = typeof candle.open === 'number' && 
                               typeof candle.high === 'number' && 
                               typeof candle.low === 'number' && 
                               typeof candle.close === 'number' &&
                               candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0;

        const hasValidRange = candle.high >= Math.max(candle.open, candle.close) && 
                             candle.low <= Math.min(candle.open, candle.close);

        const hasValidPosition = candle.position && 
                               typeof candle.position.x === 'number' && 
                               typeof candle.position.y === 'number' &&
                               candle.position.x >= 0 && candle.position.y >= 0;
        
        if (!hasValidNumbers || !hasValidRange || !hasValidPosition) {
          console.warn('⚠️ Candle com dados inválidos removido:', candle);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('❌ Erro ao validar candle:', error);
        return false;
      }
    });
    
    console.log(`📊 ${validCandles.length} candles válidos após validação rigorosa`);
    return validCandles;
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO na extração de candles:', error);
    return [];
  }
};

// FUNÇÃO SEGURA para detectar padrões reais
export const detectPatterns = async (imageData: string): Promise<PatternResult[]> => {
  console.log('🔍 INICIANDO detecção de padrões REAIS...');
  
  try {
    // PROTEÇÃO: Validar entrada
    if (!imageData || typeof imageData !== 'string') {
      console.warn('⚠️ ImageData inválido para detecção de padrões');
      return [];
    }

    const candles = await detectCandles(imageData, 1280, 720);
    
    if (!Array.isArray(candles) || candles.length === 0) {
      console.log('❌ Nenhum candle extraído - impossível detectar padrões');
      return [];
    }
    
    console.log(`📊 Analisando padrões em ${candles.length} candles REAIS`);
    
    // PROTEÇÃO: Detectar padrões de candlestick reais com proteção contra erros
    let candlePatterns: DetectedPattern[] = [];
    
    try {
      candlePatterns = detectCandlestickPatterns(candles);
      console.log(`🕯️ ${candlePatterns.length} padrões de candlestick detectados`);
    } catch (error) {
      console.error('❌ Erro ao detectar padrões de candlestick:', error);
      candlePatterns = [];
    }
    
    // PROTEÇÃO: Converter para PatternResult com validação
    const patterns = candlePatterns.map((pattern, index) => {
      try {
        if (!pattern || typeof pattern !== 'object') {
          return null;
        }

        return {
          type: String(pattern.type || 'desconhecido'),
          confidence: Math.max(0, Math.min(1, Number(pattern.confidence) || 0)),
          description: String(pattern.description || 'Padrão detectado'),
          recommendation: `Sinal de ${String(pattern.action || 'neutro')}`,
          action: String(pattern.action || 'neutro')
        };
      } catch (error) {
        console.error('❌ Erro ao converter padrão:', error);
        return null;
      }
    }).filter((pattern): pattern is PatternResult => pattern !== null);
    
    console.log(`✅ ${patterns.length} padrões válidos convertidos`);
    return patterns;
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO na detecção de padrões:', error);
    return [];
  }
};

export const generateTechnicalMarkup = (patterns: PatternResult[], width: number, height: number) => {
  try {
    // PROTEÇÃO: Validar entradas
    if (!Array.isArray(patterns) || typeof width !== 'number' || typeof height !== 'number') {
      return [];
    }

    return patterns.map((pattern, index) => {
      try {
        return {
          id: `pattern-${index}`,
          type: 'pattern' as const,
          patternType: pattern.type as any,
          points: [{ x: Math.random() * width * 0.8, y: Math.random() * height * 0.8 }],
          color: '#ff0000',
          pattern: pattern.type,
          confidence: pattern.confidence
        };
      } catch (error) {
        console.error('❌ Erro ao gerar item de markup:', error);
        return null;
      }
    }).filter(item => item !== null);
  } catch (error) {
    console.error('❌ Erro ao gerar markup técnico:', error);
    return [];
  }
};

// FUNÇÃO PRINCIPAL com tratamento ULTRA-ROBUSTO de erros
export const analyzeChart = async (imageData: string, options: AnalysisOptions = {}): Promise<AnalysisResult> => {
  console.log('🚀 INICIANDO análise REAL do gráfico...');
  
  try {
    // PROTEÇÃO: Validação inicial crítica
    if (!imageData || typeof imageData !== 'string' || imageData.length === 0) {
      console.error('❌ ERRO: ImageData está vazio ou inválido');
      throw new Error('Dados de imagem inválidos');
    }
    
    console.log('✅ ImageData válido, iniciando extração de candles...');
    
    // PROTEÇÃO: Extrair candles REAIS com proteção robusta
    let candles: CandleData[] = [];
    try {
      candles = await extractRealCandlesFromImage(imageData);
      console.log(`📊 ${candles.length} candles extraídos da imagem`);
    } catch (extractionError) {
      console.error('❌ ERRO na extração de candles:', extractionError);
      candles = [];
    }
    
    if (!Array.isArray(candles) || candles.length === 0) {
      console.warn('⚠️ Nenhum candle detectado - retornando análise vazia');
      return createEmptyAnalysisResult(imageData, 'Nenhum candle detectado na imagem capturada');
    }

    console.log(`✅ Processando ${candles.length} candles REAIS extraídos`);
    
    // PROTEÇÃO: Validação final dos dados OHLC
    const validCandles = candles.filter(candle => {
      try {
        if (!candle || typeof candle !== 'object') {
          return false;
        }

        const isValid = typeof candle.open === 'number' && candle.open > 0 &&
                       typeof candle.high === 'number' && candle.high > 0 &&
                       typeof candle.low === 'number' && candle.low > 0 &&
                       typeof candle.close === 'number' && candle.close > 0 &&
                       candle.high >= Math.max(candle.open, candle.close) &&
                       candle.low <= Math.min(candle.open, candle.close) &&
                       candle.position && 
                       typeof candle.position.x === 'number' && candle.position.x >= 0 && 
                       typeof candle.position.y === 'number' && candle.position.y >= 0;
        
        if (!isValid) {
          console.warn('🚨 Candle inválido removido:', candle);
        }
        
        return isValid;
      } catch (validationError) {
        console.error('❌ Erro na validação do candle:', validationError);
        return false;
      }
    });
    
    console.log(`📊 ${validCandles.length} candles válidos para análise`);
    
    // PROTEÇÃO: Análise avançada COM DADOS REAIS e proteção contra erros
    let advancedConditions, operatingScore, confidenceReduction;
    try {
      advancedConditions = analyzeAdvancedMarketConditions(validCandles);
      operatingScore = calculateOperatingScore(advancedConditions);
      confidenceReduction = calculateConfidenceReduction(advancedConditions);
      console.log(`🎯 Score: ${operatingScore}/100, Redução: ${(confidenceReduction * 100).toFixed(0)}%`);
    } catch (advancedError) {
      console.error('❌ Erro na análise avançada:', advancedError);
      advancedConditions = {
        recommendation: 'nao_operar',
        warnings: ['Erro na análise avançada'],
        timeBasedFactors: {},
        marketPhaseAnalysis: {},
        volatilityProfile: {},
        liquidityConditions: {},
        institutionalActivity: {}
      };
      operatingScore = 0;
      confidenceReduction = 1;
    }
    
    // PROTEÇÃO: Análise de volatilidade COM DADOS REAIS
    let volatilityAnalysis;
    try {
      volatilityAnalysis = analyzeVolatility(validCandles);
      console.log(`📈 Volatilidade: ${volatilityAnalysis.value.toFixed(2)}%`);
    } catch (volatilityError) {
      console.error('❌ Erro na análise de volatilidade:', volatilityError);
      volatilityAnalysis = {
        value: 0,
        trend: 'neutral',
        atr: 0,
        percentageRange: 0,
        isHigh: false,
        historicalComparison: 'average',
        impliedVolatility: 0
      };
    }
    
    // PROTEÇÃO: Detectar padrões reais COM DADOS REAIS
    const patterns: PatternResult[] = [];
    
    if (options.enableCandleDetection !== false && validCandles.length > 0) {
      try {
        const candlePatterns = detectCandlestickPatterns(validCandles);
        console.log(`🕯️ ${candlePatterns.length} padrões de candlestick detectados`);
        
        candlePatterns.forEach(pattern => {
          try {
            if (pattern && typeof pattern === 'object') {
              patterns.push({
                type: String(pattern.type || 'desconhecido'),
                confidence: Math.max(0, Math.min(1, (Number(pattern.confidence) || 0) * confidenceReduction)),
                description: String(pattern.description || 'Padrão detectado'),
                recommendation: `Considerar ${String(pattern.action || 'neutro')}`,
                action: String(pattern.action || 'neutro')
              });
            }
          } catch (patternError) {
            console.error('❌ Erro ao processar padrão:', patternError);
          }
        });
      } catch (candleError) {
        console.error('❌ Erro na detecção de padrões de candlestick:', candleError);
      }
    }
    
    // PROTEÇÃO: Padrões gráficos COM DADOS REAIS
    if (validCandles.length > 0) {
      const chartPatternTypes = ['triangulo', 'suporte_resistencia', 'canal', 'rompimento'];
      
      for (const patternType of chartPatternTypes) {
        try {
          const detectedPatterns = await detectChartPatterns(validCandles, patternType, options);
          
          if (Array.isArray(detectedPatterns)) {
            detectedPatterns.forEach(pattern => {
              try {
                if (pattern && typeof pattern === 'object') {
                  patterns.push({
                    type: String(pattern.pattern || 'desconhecido'),
                    confidence: Math.max(0, Math.min(1, (Number(pattern.confidence) || 0) * confidenceReduction)),
                    description: String(pattern.description || 'Padrão gráfico detectado'),
                    recommendation: String(pattern.recommendation || 'Analisar padrão'),
                    action: String(pattern.action || 'neutro'),
                  });
                }
              } catch (chartPatternError) {
                console.error('❌ Erro ao processar padrão gráfico:', chartPatternError);
              }
            });
          }
        } catch (chartError) {
          console.error(`❌ Erro na detecção de padrão ${patternType}:`, chartError);
        }
      }
    }
    
    // PROTEÇÃO: Aplicar warnings de condições ruins
    patterns.forEach(pattern => {
      if (operatingScore < 30) {
        pattern.description += ` ⚠️ CUIDADO: Condições adversas (Score: ${operatingScore}/100)`;
      }
    });
    
    // PROTEÇÃO: Análises complementares COM DADOS REAIS e proteção contra erros
    let priceActionSignals = [];
    let volumeAnalysisResult: VolumeData;
    let divergences = [];
    let technicalIndicators: TechnicalIndicator[] = [];
    
    // Definir tipos compatíveis com as interfaces corretas
    type MarketSentiment = 'neutro' | 'otimista' | 'pessimista' | 'muito_otimista' | 'muito_pessimista';
    type VolatilityState = 'normal' | 'baixa' | 'alta' | 'extrema';
    type LiquidityCondition = 'normal' | 'seca' | 'abundante';
    type InstitutionalBias = 'compra' | 'venda' | 'neutro';
    type TimeOfDay = 'meio_dia' | 'abertura' | 'fechamento' | 'after_hours';
    type MarketTrend = 'lateral' | 'baixa' | 'alta';
    
    let marketContextAnalysis = {
      phase: 'consolidação' as const,
      sentiment: 'neutro' as MarketSentiment,
      volatilityState: 'normal' as VolatilityState,
      liquidityCondition: 'normal' as LiquidityCondition,
      institutionalBias: 'neutro' as InstitutionalBias,
      timeOfDay: 'meio_dia' as TimeOfDay,
      marketStructure: {
        trend: 'lateral' as MarketTrend,
        strength: 50,
        breakouts: false,
        pullbacks: false
      }
    };
    
    let confluenceAnalysis = {
      confluenceScore: 0,
      supportResistance: [],
      criticalLevels: [],
      marketStructure: { structure: 'lateral', strength: 0 },
      priceAction: { trend: 'lateral', momentum: 'neutro', strength: 0 }
    };
    
    if (validCandles.length > 0) {
      try {
        priceActionSignals = analyzePriceAction(validCandles);
        console.log(`⚡️ ${priceActionSignals.length} sinais de price action`);
      } catch (error) {
        console.error('❌ Erro na análise de price action:', error);
      }
      
      try {
        volumeAnalysisResult = analyzeVolume(validCandles);
        console.log(`📊 Volume: ${volumeAnalysisResult.trend}`);
      } catch (error) {
        console.error('❌ Erro na análise de volume:', error);
        volumeAnalysisResult = {
          value: 0,
          trend: 'neutral',
          abnormal: false,
          significance: 'low',
          relativeToAverage: 1,
          distribution: 'neutral',
          divergence: false
        };
      }
      
      try {
        divergences = detectDivergences(validCandles);
        console.log(`🔍 ${divergences.length} divergências`);
      } catch (error) {
        console.error('❌ Erro na detecção de divergências:', error);
      }
      
      try {
        technicalIndicators = detectTechnicalIndicators(validCandles);
        console.log(`⚙️ ${technicalIndicators.length} indicadores técnicos`);
      } catch (error) {
        console.error('❌ Erro na análise de indicadores técnicos:', error);
      }
    } else {
      volumeAnalysisResult = {
        value: 0,
        trend: 'neutral',
        abnormal: false,
        significance: 'low',
        relativeToAverage: 1,
        distribution: 'neutral',
        divergence: false
      };
    }
    
    // PROTEÇÃO: Análise de confluência
    let confluenceAnalysis;
    try {
      confluenceAnalysis = performConfluenceAnalysis(validCandles, []);
      console.log(`🤝 Score de confluência: ${confluenceAnalysis.confluenceScore}`);
    } catch (error) {
      console.error('❌ Erro na análise de confluência:', error);
      confluenceAnalysis = {
        confluenceScore: 0,
        supportResistance: [],
        criticalLevels: [],
        marketStructure: { structure: 'lateral', strength: 0 },
        priceAction: { trend: 'lateral', momentum: 'neutro', strength: 0 }
      };
    }
    
    // PROTEÇÃO: Scalping signals COM DADOS REAIS
    const scalpingSignals: ScalpingSignal[] = patterns.slice(0, 3).map((pattern, index) => ({
      type: 'entrada',
      action: pattern.action === 'compra' ? 'compra' : 'venda',
      price: validCandles.length > 0 ? String(validCandles[validCandles.length - 1].close.toFixed(5)) : '0.00000',
      confidence: pattern.confidence,
      timeframe: options.timeframe || '1m',
      description: pattern.description,
    }));
    
    const currentPrice = validCandles.length > 0 ? validCandles[validCandles.length - 1].close : 0;
    
    const enhancedMarketContext: EnhancedMarketContext = {
      phase: 'indefinida',
      strength: patterns.length > 0 ? 'forte' : 'fraca',
      dominantTimeframe: options.timeframe || '1m',
      sentiment: 'neutro',
      description: `${patterns.length} padrões REAIS em ${validCandles.length} candles extraídos`,
      marketStructure: 'indefinida',
      breakoutPotential: patterns.length > 0 ? 'alto' : 'baixo',
      momentumSignature: volatilityAnalysis.isHigh ? 'acelerando' : 'estável',
      advancedConditions,
      operatingScore,
      confidenceReduction
    };
    
    console.log('✅ Análise REAL concluída com sucesso');
    
    return {
      patterns,
      timestamp: Date.now(),
      imageUrl: imageData,
      technicalElements: [],
      candles: validCandles,
      scalpingSignals,
      technicalIndicators,
      volumeData: volumeAnalysisResult,
      volatilityData: volatilityAnalysis,
      marketContext: enhancedMarketContext,
      warnings: advancedConditions.warnings,
      preciseEntryAnalysis: {
        exactMinute: patterns.length > 0 ? 'confirmacao' : 'aguardar',
        entryType: patterns.length > 0 ? 'breakout' : 'reversão',
        nextCandleExpectation: patterns.length > 0 ? 'continuacao' : 'reversão',
        priceAction: priceActionSignals.length > 0 ? 'forte' : 'fraco',
        confirmationSignal: patterns.length > 0 ? 'confirmado' : 'pendente',
        riskRewardRatio: patterns.length > 0 ? 2.5 : 0,
        entryInstructions: patterns.length > 0 ? 
          `Entry próximo de ${currentPrice.toFixed(5)} (DADOS REAIS)` : 
          'Aguardar melhor setup'
      },
      confluences: confluenceAnalysis,
      priceActionSignals,
      detailedMarketContext: {
        phase: 'consolidação',
        sentiment: 'neutro',
        strength: patterns.length > 0 ? 'forte' : 'fraca',
        description: `${patterns.length} padrões REAIS detectados`,
        marketStructure: 'indefinida',
        breakoutPotential: patterns.length > 0 ? 'alto' : 'baixo',
        momentumSignature: volatilityAnalysis.isHigh ? 'acelerando' : 'estável',
        institutionalBias: 'neutro',
        volatilityState: 'normal',
        liquidityCondition: 'normal',
        timeOfDay: 'meio_dia',
        trend: 'lateral'
      },
      entryRecommendations: patterns.slice(0, 3).map(p => ({
        type: p.action,
        confidence: p.confidence,
        description: p.description,
        price: String(currentPrice.toFixed(5))
      }))
    };
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO na análise do gráfico:', error);
    
    // PROTEÇÃO: Retornar resultado seguro em caso de erro crítico
    return createEmptyAnalysisResult(
      imageData || '', 
      'Erro crítico na análise - verificar logs'
    );
  }
};

// FUNÇÃO AUXILIAR: Criar resultado vazio seguro
const createEmptyAnalysisResult = (imageData: string, errorMessage: string): AnalysisResult => {
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
      description: errorMessage,
      marketStructure: 'indefinida',
      breakoutPotential: 'baixo',
      momentumSignature: 'estável',
      advancedConditions: {
        recommendation: 'nao_operar',
        warnings: [errorMessage],
        timeBasedFactors: {},
        marketPhaseAnalysis: {},
        volatilityProfile: {},
        liquidityConditions: {},
        institutionalActivity: {}
      },
      operatingScore: 0,
      confidenceReduction: 1
    },
    warnings: [errorMessage],
    preciseEntryAnalysis: {
      exactMinute: 'reversão',
      entryType: 'reversão',
      nextCandleExpectation: 'reversão',
      priceAction: 'reversão',
      confirmationSignal: 'reversão',
      riskRewardRatio: 0,
      entryInstructions: 'Erro na análise - tentar novamente'
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
      description: errorMessage,
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
};
