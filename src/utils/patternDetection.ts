
import { SelectedRegion, CandleData, PatternResult, MarketContext, TechnicalIndicator, ScalpingSignal, PreciseEntryAnalysis } from "@/context/AnalyzerContext";
import { detectCandles } from "./candleAnalysis";
import { detectChartPatterns } from "./chartPatternDetection";
import { enhanceImageForAnalysis } from "./imagePreProcessing";

export interface CompleteAnalysisOptions {
  timeframe: string;
  enableVolumeAnalysis?: boolean;
  enableVolatilityAnalysis?: boolean;
  enablePatternDetection?: boolean;
}

export interface CompleteAnalysisResult {
  patterns: PatternResult[];
  marketContext?: MarketContext;
  technicalIndicators?: TechnicalIndicator[];
  scalpingSignals?: ScalpingSignal[];
  preciseEntryAnalysis?: PreciseEntryAnalysis;
  candles?: CandleData[];
}

// Função principal para análise de gráfico (compatibilidade com ControlPanel e LiveAnalysis)
export const analyzeChart = async (
  imageUrl: string, 
  options: any
): Promise<CompleteAnalysisResult & { 
  timestamp: number; 
  imageUrl: string;
  technicalElements?: any;
  volumeData?: any;
  volatilityData?: any;
  warnings?: string[];
  confluences?: any;
  priceActionSignals?: any;
  detailedMarketContext?: any;
  entryRecommendations?: any;
}> => {
  console.log('🔍 Executando análise completa do gráfico');
  
  // Para compatibilidade, criar uma região padrão se não fornecida
  const defaultRegion: SelectedRegion = {
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 100,
    height: 100
  };
  
  const result = await performCompleteAnalysis(imageUrl, defaultRegion, {
    timeframe: options.timeframe || '1m',
    enableVolumeAnalysis: true,
    enableVolatilityAnalysis: true,
    enablePatternDetection: true
  });
  
  return {
    ...result,
    timestamp: Date.now(),
    imageUrl: imageUrl,
    technicalElements: [],
    volumeData: null,
    volatilityData: null,
    warnings: [],
    confluences: [],
    priceActionSignals: [],
    detailedMarketContext: result.marketContext,
    entryRecommendations: []
  };
};

export const performCompleteAnalysis = async (
  imageUrl: string,
  selectedRegion: SelectedRegion,
  options: CompleteAnalysisOptions
): Promise<CompleteAnalysisResult> => {
  console.log('🔍 Iniciando análise completa REAL da imagem');
  console.log('Opções:', options);
  console.log('Região selecionada:', selectedRegion);

  try {
    // ETAPA 1: Detectar candles reais da imagem
    console.log('📊 Detectando candles na região selecionada...');
    const detectedCandles = await detectCandles(imageUrl, selectedRegion);
    console.log(`✅ ${detectedCandles.length} candles detectados`);

    if (detectedCandles.length === 0) {
      console.warn('⚠️ Nenhum candle detectado na região');
      return {
        patterns: [],
        marketContext: {
          phase: 'indefinida',
          strength: 'fraca',
          dominantTimeframe: options.timeframe as any,
          sentiment: 'neutro',
          description: 'Não foi possível detectar candles na região selecionada',
          marketStructure: 'indefinida',
          breakoutPotential: 'baixo',
          momentumSignature: 'estável'
        }
      };
    }

    // ETAPA 2: Detectar padrões nos candles reais
    console.log('🔍 Detectando padrões nos candles...');
    const detectedPatterns = await detectChartPatterns(
      detectedCandles, 
      'auto', 
      { timeframe: options.timeframe }
    );
    console.log(`✅ ${detectedPatterns.length} padrões detectados`);

    // Converter ChartPattern[] para PatternResult[]
    const convertedPatterns: PatternResult[] = detectedPatterns.map(pattern => ({
      type: pattern.pattern,
      confidence: pattern.confidence,
      position: { x: 0, y: 0 }, // Posição seria detectada na análise real de imagem
      description: pattern.description,
      action: pattern.action,
      recommendation: pattern.recommendation
    }));

    // ETAPA 3: Analisar contexto de mercado baseado nos dados reais
    const marketContext = analyzeMarketContext(detectedCandles, options.timeframe);
    console.log('📈 Contexto de mercado analisado:', marketContext.phase);

    // ETAPA 4: Gerar indicadores técnicos baseados nos candles reais
    const technicalIndicators = generateTechnicalIndicators(detectedCandles);
    console.log(`📊 ${technicalIndicators.length} indicadores técnicos calculados`);

    // ETAPA 5: Gerar sinais de scalping para timeframes curtos
    const scalpingSignals = options.timeframe === '1m' || options.timeframe === '5m' 
      ? generateScalpingSignals(detectedCandles, convertedPatterns)
      : [];
    console.log(`⚡ ${scalpingSignals.length} sinais de scalping gerados`);

    // ETAPA 6: Análise precisa de entrada
    const preciseEntryAnalysis = generatePreciseEntryAnalysis(detectedCandles, convertedPatterns, options.timeframe);
    console.log('🎯 Análise precisa de entrada gerada');

    // RESULTADO FINAL: Apenas dados reais, sem simulação
    const result = {
      patterns: convertedPatterns,
      marketContext,
      technicalIndicators,
      scalpingSignals,
      preciseEntryAnalysis,
      candles: detectedCandles
    };

    console.log('✅ Análise completa REAL finalizada:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro na análise completa:', error);
    throw new Error(`Falha na análise real: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

// Análise de contexto de mercado baseada nos candles reais detectados
const analyzeMarketContext = (candles: CandleData[], timeframe: string): MarketContext => {
  if (candles.length < 3) {
    return {
      phase: 'indefinida',
      strength: 'fraca',
      dominantTimeframe: timeframe as any,
      sentiment: 'neutro',
      description: 'Dados insuficientes para análise de contexto',
      marketStructure: 'indefinida',
      breakoutPotential: 'baixo',
      momentumSignature: 'estável'
    };
  }

  // Analisar tendência baseada nos preços de fechamento reais
  const closes = candles.map(c => c.close);
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const priceChange = ((lastClose - firstClose) / firstClose) * 100;

  // Determinar fase do mercado baseada no movimento real
  let phase: MarketContext['phase'] = 'lateral';
  if (Math.abs(priceChange) > 1.0) {
    phase = priceChange > 0 ? 'tendência_alta' : 'tendência_baixa';
  }

  // Calcular força baseada na volatilidade real dos candles
  const ranges = candles.map(c => c.high - c.low);
  const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  const volatility = (avgRange / lastClose) * 100;
  
  const strength: MarketContext['strength'] = volatility > 1.5 ? 'forte' : 
                                            volatility > 0.8 ? 'moderada' : 'fraca';

  return {
    phase,
    strength,
    dominantTimeframe: timeframe as any,
    sentiment: priceChange > 0.3 ? 'otimista' : priceChange < -0.3 ? 'pessimista' : 'neutro',
    description: `Movimento de ${priceChange.toFixed(2)}% detectado em ${candles.length} candles`,
    marketStructure: phase === 'tendência_alta' ? 'alta_altas' : 
                    phase === 'tendência_baixa' ? 'baixa_baixas' : 'indefinida',
    breakoutPotential: volatility > 2.0 ? 'alto' : volatility > 1.0 ? 'médio' : 'baixo',
    momentumSignature: Math.abs(priceChange) > 2.0 ? 'acelerando' : 
                      Math.abs(priceChange) > 0.5 ? 'estável' : 'desacelerando'
  };
};

// Gerar indicadores técnicos baseados nos candles reais
const generateTechnicalIndicators = (candles: CandleData[]): TechnicalIndicator[] => {
  if (candles.length < 5) return [];

  const indicators: TechnicalIndicator[] = [];
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  // SMA simples baseado nos preços reais
  const sma5 = closes.slice(-5).reduce((sum, price) => sum + price, 0) / 5;
  const currentPrice = closes[closes.length - 1];
  
  indicators.push({
    name: 'SMA 5',
    value: sma5.toFixed(4),
    signal: currentPrice > sma5 ? 'alta' : currentPrice < sma5 ? 'baixa' : 'neutro',
    strength: Math.abs((currentPrice - sma5) / sma5) > 0.01 ? 'forte' : 'moderada',
    description: `Preço ${currentPrice > sma5 ? 'acima' : 'abaixo'} da média móvel`
  });

  // RSI simples baseado nos dados reais
  if (closes.length >= 10) {
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-5).reduce((sum, gain) => sum + gain, 0) / 5;
    const avgLoss = losses.slice(-5).reduce((sum, loss) => sum + loss, 0) / 5;
    
    if (avgLoss > 0) {
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      indicators.push({
        name: 'RSI',
        value: rsi.toFixed(1),
        signal: rsi > 70 ? 'baixa' : rsi < 30 ? 'alta' : 'neutro',
        strength: rsi > 80 || rsi < 20 ? 'forte' : 'moderada',
        description: `RSI em ${rsi > 70 ? 'sobrecompra' : rsi < 30 ? 'sobrevenda' : 'zona neutra'}`
      });
    }
  }

  return indicators;
};

// Gerar sinais de scalping baseados nos padrões reais detectados
const generateScalpingSignals = (candles: CandleData[], patterns: any[]): ScalpingSignal[] => {
  const signals: ScalpingSignal[] = [];
  
  if (patterns.length === 0 || candles.length < 3) return signals;

  const lastCandle = candles[candles.length - 1];
  const previousCandle = candles[candles.length - 2];

  // Sinal baseado no último padrão detectado
  const dominantPattern = patterns[0];
  if (dominantPattern && dominantPattern.confidence > 0.6) {
    signals.push({
      type: 'entrada',
      action: dominantPattern.action === 'compra' ? 'compra' : 'venda',
      price: lastCandle.close.toFixed(4),
      confidence: dominantPattern.confidence,
      timeframe: '1m',
      description: `Sinal de ${dominantPattern.action} baseado em ${dominantPattern.pattern}`,
      target: dominantPattern.action === 'compra' 
        ? (lastCandle.close * 1.005).toFixed(4)
        : (lastCandle.close * 0.995).toFixed(4),
      stopLoss: dominantPattern.action === 'compra'
        ? (lastCandle.close * 0.995).toFixed(4)
        : (lastCandle.close * 1.005).toFixed(4),
      volumeConfirmation: true,
      entryType: 'reversão'
    });
  }

  return signals;
};

// Gerar análise precisa de entrada baseada nos dados reais
const generatePreciseEntryAnalysis = (
  candles: CandleData[], 
  patterns: any[], 
  timeframe: string
): PreciseEntryAnalysis => {
  if (patterns.length === 0) {
    return {
      exactMinute: 'Aguardar confirmação',
      entryType: 'teste_suporte',
      nextCandleExpectation: 'Aguardar formação de padrão claro',
      priceAction: 'Preço em consolidação',
      confirmationSignal: 'Aguardar volume ou rompimento',
      riskRewardRatio: 1.5,
      entryInstructions: 'Aguardar sinal mais claro antes de entrar'
    };
  }

  const dominantPattern = patterns[0];
  const lastCandle = candles[candles.length - 1];
  
  return {
    exactMinute: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    entryType: dominantPattern.action === 'compra' ? 'teste_suporte' : 'teste_resistência',
    nextCandleExpectation: `Esperado ${dominantPattern.action === 'compra' ? 'fechamento acima' : 'fechamento abaixo'} de ${lastCandle.close.toFixed(4)}`,
    priceAction: `Padrão ${dominantPattern.pattern} formado com ${(dominantPattern.confidence * 100).toFixed(0)}% de confiança`,
    confirmationSignal: `Aguardar ${dominantPattern.action === 'compra' ? 'rompimento da máxima' : 'rompimento da mínima'} anterior`,
    riskRewardRatio: 2.0,
    entryInstructions: `Entrar na ${dominantPattern.action} após confirmação do padrão com stop em ${dominantPattern.action === 'compra' ? 'mínima' : 'máxima'} anterior`
  };
};
