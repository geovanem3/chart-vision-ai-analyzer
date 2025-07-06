
import { CandleData, SelectedRegion } from "../context/AnalyzerContext";
import { detectCandles } from "./candleAnalysis";
import { detectChartPatterns } from "./chartPatternDetection";
import { analyzePriceAction } from "./priceActionAnalysis";

export interface RealAnalysisResult {
  candles: CandleData[];
  patterns: any[];
  priceActionSignals: any[];
  marketContext: any;
  confidence: number;
  analysisQuality: 'excellent' | 'good' | 'moderate' | 'poor';
}

// Função principal para análise completa de imagem real
export const performRealImageAnalysis = async (
  imageUrl: string,
  selectedRegion: SelectedRegion,
  timeframe: string
): Promise<RealAnalysisResult> => {
  console.log('🔍 Iniciando análise REAL completa da imagem');
  console.log('Parâmetros:', { imageUrl: imageUrl.substring(0, 50) + '...', selectedRegion, timeframe });

  try {
    // ETAPA 1: Detectar candles reais da imagem na região selecionada
    console.log('📊 Detectando candles na região selecionada...');
    const detectedCandles = await detectCandles(imageUrl, selectedRegion);
    
    if (detectedCandles.length === 0) {
      console.warn('⚠️ Nenhum candle detectado na região');
      return {
        candles: [],
        patterns: [],
        priceActionSignals: [],
        marketContext: {
          phase: 'indefinida',
          sentiment: 'neutro',
          description: 'Não foi possível detectar candles na região selecionada'
        },
        confidence: 0.1,
        analysisQuality: 'poor'
      };
    }

    console.log(`✅ ${detectedCandles.length} candles detectados com sucesso`);

    // ETAPA 2: Detectar padrões de candles
    console.log('🔍 Analisando padrões nos candles detectados...');
    const chartPatterns = await detectChartPatterns(detectedCandles, 'auto', { timeframe });
    console.log(`✅ ${chartPatterns.length} padrões detectados`);

    // ETAPA 3: Análise de Price Action
    console.log('📈 Executando análise de Price Action...');
    const priceActionSignals = analyzePriceAction(detectedCandles);
    console.log(`✅ ${priceActionSignals.length} sinais de price action gerados`);

    // ETAPA 4: Análise de contexto de mercado
    const marketContext = analyzeRealMarketContext(detectedCandles, timeframe);
    console.log('📊 Contexto de mercado analisado:', marketContext.phase);

    // ETAPA 5: Calcular qualidade da análise
    const analysisQuality = calculateAnalysisQuality(detectedCandles, chartPatterns, priceActionSignals);
    const confidence = calculateOverallConfidence(chartPatterns, priceActionSignals);

    const result: RealAnalysisResult = {
      candles: detectedCandles,
      patterns: chartPatterns,
      priceActionSignals,
      marketContext,
      confidence,
      analysisQuality
    };

    console.log('✅ Análise REAL completa finalizada:', {
      candles: result.candles.length,
      patterns: result.patterns.length,
      signals: result.priceActionSignals.length,
      confidence: result.confidence,
      quality: result.analysisQuality
    });

    return result;

  } catch (error) {
    console.error('❌ Erro na análise real da imagem:', error);
    throw new Error(`Falha na análise real: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

// Análise de contexto baseada nos candles detectados
const analyzeRealMarketContext = (candles: CandleData[], timeframe: string) => {
  if (candles.length < 3) {
    return {
      phase: 'indefinida',
      sentiment: 'neutro',
      strength: 'fraca',
      description: 'Dados insuficientes para análise de contexto',
      timeframe: timeframe
    };
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const priceChange = ((lastClose - firstClose) / firstClose) * 100;
  
  // Determinar fase do mercado
  let phase = 'lateral';
  if (Math.abs(priceChange) > 0.1) {
    phase = priceChange > 0 ? 'tendência_alta' : 'tendência_baixa';
  }
  
  // Determinar sentimento
  const bullishCandles = candles.filter(c => c.close > c.open).length;
  const bearishCandles = candles.filter(c => c.close < c.open).length;
  let sentiment = 'neutro';
  if (bullishCandles > bearishCandles * 1.5) sentiment = 'otimista';
  else if (bearishCandles > bullishCandles * 1.5) sentiment = 'pessimista';
  
  // Calcular força baseada na volatilidade
  const ranges = candles.map(c => c.high - c.low);
  const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  const volatility = (avgRange / lastClose) * 100;
  const strength = volatility > 0.15 ? 'forte' : volatility > 0.08 ? 'moderada' : 'fraca';

  return {
    phase,
    sentiment,
    strength,
    description: `${phase} com movimento de ${priceChange.toFixed(2)}% em ${candles.length} candles`,
    volatility: volatility.toFixed(3),
    timeframe: timeframe,
    candleBalance: `${bullishCandles}/${bearishCandles} (alta/baixa)`
  };
};

// Calcular qualidade da análise
const calculateAnalysisQuality = (
  candles: CandleData[], 
  patterns: any[], 
  signals: any[]
): 'excellent' | 'good' | 'moderate' | 'poor' => {
  if (candles.length >= 10 && patterns.length >= 2 && signals.length >= 3) {
    return 'excellent';
  } else if (candles.length >= 7 && (patterns.length >= 1 || signals.length >= 2)) {
    return 'good';
  } else if (candles.length >= 5) {
    return 'moderate';
  } else {
    return 'poor';
  }
};

// Calcular confiança geral
const calculateOverallConfidence = (patterns: any[], signals: any[]): number => {
  if (patterns.length === 0 && signals.length === 0) return 0.1;
  
  const patternConfidence = patterns.length > 0 
    ? patterns.reduce((sum: number, p: any) => sum + (p.confidence || 0.5), 0) / patterns.length 
    : 0.5;
    
  const signalConfidence = signals.length > 0 
    ? signals.reduce((sum: number, s: any) => sum + (s.confidence || 0.5), 0) / signals.length 
    : 0.5;
  
  return Math.min(0.95, Math.max(0.1, (patternConfidence + signalConfidence) / 2));
};

// Função para integração com outros módulos
export const getTradeSignalsFromAnalysis = (analysis: RealAnalysisResult) => {
  const signals = [];
  
  // Combinar padrões e sinais de price action
  for (const pattern of analysis.patterns) {
    if (pattern.confidence > 0.6) {
      signals.push({
        type: 'pattern',
        action: pattern.action || 'observar',
        confidence: pattern.confidence,
        description: `Padrão ${pattern.pattern} detectado`,
        entry: pattern.entryPrice || 'A definir',
        stop: pattern.stopLoss || 'A definir',
        target: pattern.target || 'A definir'
      });
    }
  }
  
  for (const signal of analysis.priceActionSignals) {
    if (signal.confidence > 0.6) {
      signals.push({
        type: 'price_action',
        action: signal.direction === 'alta' ? 'compra' : 'venda',
        confidence: signal.confidence,
        description: signal.description,
        entry: signal.entryZone?.optimal || 'A definir',
        stop: 'Baseado no risco',
        target: `R/R ${signal.riskReward || 2.0}`
      });
    }
  }
  
  return signals.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
};

