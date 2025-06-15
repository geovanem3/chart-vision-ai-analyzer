
import { DetectedCandle, ChartArea, PriceAxis } from './types';
import { detectCandlestickPatterns } from '../candlestickPatternDetection';
import { performConfluenceAnalysis } from '../confluenceAnalysis';
import { CandleData } from '../../context/AnalyzerContext';

export interface ContextualPattern {
  pattern: string;
  confidence: number;
  location: 'support' | 'resistance' | 'pullback' | 'breakout' | 'neutral';
  regionStrength: number;
  action: 'compra' | 'venda' | 'neutro';
  reasoning: string[];
  contextMultiplier: number;
}

export interface IntelligentAnalysisResult {
  patterns: ContextualPattern[];
  overallSignal: 'compra' | 'venda' | 'neutro';
  confidence: number;
  keyLevels: {
    support: number[];
    resistance: number[];
    currentPrice: number;
  };
  marketContext: {
    trend: 'alta' | 'baixa' | 'lateral';
    phase: string;
    volatility: 'alta' | 'media' | 'baixa';
  };
  reasoning: string[];
}

export const analyzeIntelligentPatterns = (
  detectedCandles: DetectedCandle[],
  chartArea: ChartArea,
  priceAxis: PriceAxis
): IntelligentAnalysisResult => {
  console.log('🧠 Iniciando análise inteligente de padrões...');
  
  // Converter candles detectados para formato CandleData
  const candleData = convertToCandleData(detectedCandles, priceAxis);
  
  if (candleData.length < 5) {
    return {
      patterns: [],
      overallSignal: 'neutro',
      confidence: 0,
      keyLevels: { support: [], resistance: [], currentPrice: 0 },
      marketContext: { trend: 'lateral', phase: 'indefinida', volatility: 'media' },
      reasoning: ['Dados insuficientes para análise']
    };
  }

  // 1. Detectar padrões de candles tradicionais
  const candlestickPatterns = detectCandlestickPatterns(candleData);
  
  // 2. Análise de confluências e níveis
  const confluenceAnalysis = performConfluenceAnalysis(candleData, candlestickPatterns);
  
  // 3. Identificar contexto regional
  const regionalContext = analyzeRegionalContext(candleData, confluenceAnalysis);
  
  // 4. Combinar padrões com contexto
  const contextualPatterns = combinePatternWithContext(
    candlestickPatterns, 
    regionalContext, 
    candleData
  );
  
  // 5. Determinar sinal geral inteligente
  const intelligentDecision = makeIntelligentDecision(contextualPatterns, regionalContext);
  
  console.log(`✅ Análise inteligente concluída: ${intelligentDecision.overallSignal} (${intelligentDecision.confidence.toFixed(1)}%)`);
  
  return intelligentDecision;
};

const convertToCandleData = (detectedCandles: DetectedCandle[], priceAxis: PriceAxis): CandleData[] => {
  return detectedCandles.map((candle, index) => {
    // Converter posições Y para preços usando o eixo de preços
    const high = priceAxis.minPrice + ((chartArea.height - candle.wickTop) * (priceAxis.maxPrice - priceAxis.minPrice)) / chartArea.height;
    const low = priceAxis.minPrice + ((chartArea.height - candle.wickBottom) * (priceAxis.maxPrice - priceAxis.minPrice)) / chartArea.height;
    const open = priceAxis.minPrice + ((chartArea.height - candle.bodyTop) * (priceAxis.maxPrice - priceAxis.minPrice)) / chartArea.height;
    const close = priceAxis.minPrice + ((chartArea.height - candle.bodyBottom) * (priceAxis.maxPrice - priceAxis.minPrice)) / chartArea.height;
    
    return {
      time: new Date(Date.now() - (detectedCandles.length - index) * 60000).toISOString(),
      open: Math.min(open, close),
      high,
      low,
      close: Math.max(open, close),
      volume: 1000 // Volume inferido
    };
  });
};

const analyzeRegionalContext = (candles: CandleData[], confluenceData: any) => {
  const currentPrice = candles[candles.length - 1].close;
  const recent20 = candles.slice(-20);
  
  // Identificar níveis de suporte e resistência mais próximos
  const supportLevels = confluenceData.supportResistance
    .filter((level: any) => level.type === 'support' && level.price < currentPrice)
    .sort((a: any, b: any) => Math.abs(currentPrice - b.price) - Math.abs(currentPrice - a.price));
    
  const resistanceLevels = confluenceData.supportResistance
    .filter((level: any) => level.type === 'resistance' && level.price > currentPrice)
    .sort((a: any, b: any) => Math.abs(currentPrice - a.price) - Math.abs(currentPrice - b.price));
  
  // Calcular distâncias aos níveis
  const nearestSupport = supportLevels[0];
  const nearestResistance = resistanceLevels[0];
  
  const supportDistance = nearestSupport ? Math.abs(currentPrice - nearestSupport.price) / currentPrice : 1;
  const resistanceDistance = nearestResistance ? Math.abs(currentPrice - nearestResistance.price) / currentPrice : 1;
  
  // Determinar contexto regional
  let regionType: 'support' | 'resistance' | 'pullback' | 'breakout' | 'neutral' = 'neutral';
  let regionStrength = 0;
  
  // Análise de proximidade aos níveis
  if (supportDistance < 0.003) { // Dentro de 0.3% do suporte
    regionType = 'support';
    regionStrength = nearestSupport.confidence;
  } else if (resistanceDistance < 0.003) { // Dentro de 0.3% da resistência
    regionType = 'resistance';
    regionStrength = nearestResistance.confidence;
  }
  
  // Detectar padrões de pullback
  const pullbackAnalysis = detectPullbackPattern(recent20);
  if (pullbackAnalysis.isPullback) {
    regionType = 'pullback';
    regionStrength = pullbackAnalysis.strength;
  }
  
  // Detectar rompimentos
  const breakoutAnalysis = detectBreakoutPattern(recent20, supportLevels, resistanceLevels);
  if (breakoutAnalysis.isBreakout) {
    regionType = 'breakout';
    regionStrength = breakoutAnalysis.strength;
  }
  
  // Análise de volatilidade
  const volatilityData = calculateVolatility(recent20);
  
  return {
    regionType,
    regionStrength,
    supportLevels: supportLevels.slice(0, 3),
    resistanceLevels: resistanceLevels.slice(0, 3),
    nearestSupport,
    nearestResistance,
    supportDistance,
    resistanceDistance,
    volatility: volatilityData,
    trend: confluenceData.marketStructure.structure,
    priceAction: confluenceData.priceAction
  };
};

const detectPullbackPattern = (candles: CandleData[]) => {
  if (candles.length < 10) return { isPullback: false, strength: 0 };
  
  const first7 = candles.slice(0, 7);
  const last3 = candles.slice(-3);
  
  // Determinar tendência principal
  const mainTrendDirection = first7[6].close > first7[0].close ? 'alta' : 'baixa';
  
  if (mainTrendDirection === 'alta') {
    // Procurar correção em tendência de alta
    const highestPrice = Math.max(...first7.map(c => c.high));
    const lowestInCorrection = Math.min(...last3.map(c => c.low));
    const correctionDepth = (highestPrice - lowestInCorrection) / highestPrice;
    
    if (correctionDepth > 0.015 && correctionDepth < 0.1) { // Correção de 1.5% a 10%
      return { 
        isPullback: true, 
        strength: Math.min(85, 60 + (correctionDepth * 100)),
        direction: 'alta'
      };
    }
  } else {
    // Procurar correção em tendência de baixa
    const lowestPrice = Math.min(...first7.map(c => c.low));
    const highestInCorrection = Math.max(...last3.map(c => c.high));
    const correctionDepth = (highestInCorrection - lowestPrice) / lowestPrice;
    
    if (correctionDepth > 0.015 && correctionDepth < 0.1) {
      return { 
        isPullback: true, 
        strength: Math.min(85, 60 + (correctionDepth * 100)),
        direction: 'baixa'
      };
    }
  }
  
  return { isPullback: false, strength: 0 };
};

const detectBreakoutPattern = (candles: CandleData[], supportLevels: any[], resistanceLevels: any[]) => {
  if (candles.length < 5) return { isBreakout: false, strength: 0 };
  
  const recent5 = candles.slice(-5);
  const currentPrice = recent5[recent5.length - 1].close;
  const volume = recent5.map(c => c.high - c.low).reduce((sum, vol) => sum + vol, 0);
  const avgVolume = volume / recent5.length;
  const lastVolume = recent5[recent5.length - 1].high - recent5[recent5.length - 1].low;
  
  // Verificar rompimento de resistência
  for (const resistance of resistanceLevels.slice(0, 2)) {
    if (currentPrice > resistance.price * 1.002) { // Rompimento de pelo menos 0.2%
      const breakoutStrength = ((currentPrice - resistance.price) / resistance.price) * 100;
      const volumeConfirmation = lastVolume > avgVolume * 1.3 ? 20 : 0;
      
      return {
        isBreakout: true,
        strength: Math.min(90, 65 + breakoutStrength * 5 + volumeConfirmation),
        direction: 'alta',
        level: resistance.price
      };
    }
  }
  
  // Verificar rompimento de suporte
  for (const support of supportLevels.slice(0, 2)) {
    if (currentPrice < support.price * 0.998) { // Rompimento de pelo menos 0.2%
      const breakoutStrength = ((support.price - currentPrice) / support.price) * 100;
      const volumeConfirmation = lastVolume > avgVolume * 1.3 ? 20 : 0;
      
      return {
        isBreakout: true,
        strength: Math.min(90, 65 + breakoutStrength * 5 + volumeConfirmation),
        direction: 'baixa',
        level: support.price
      };
    }
  }
  
  return { isBreakout: false, strength: 0 };
};

const calculateVolatility = (candles: CandleData[]) => {
  const ranges = candles.map(c => (c.high - c.low) / c.close);
  const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  
  if (avgRange > 0.015) return { level: 'alta', value: avgRange };
  if (avgRange > 0.008) return { level: 'media', value: avgRange };
  return { level: 'baixa', value: avgRange };
};

const combinePatternWithContext = (
  patterns: any[], 
  context: any, 
  candles: CandleData[]
): ContextualPattern[] => {
  return patterns.map(pattern => {
    let contextMultiplier = 1.0;
    const reasoning: string[] = [];
    
    // Aplicar multiplicadores baseados no contexto regional
    switch (context.regionType) {
      case 'support':
        if (pattern.action === 'compra') {
          contextMultiplier = 1.5;
          reasoning.push(`Padrão de compra próximo ao suporte em ${context.nearestSupport.price.toFixed(5)}`);
        }
        break;
        
      case 'resistance':
        if (pattern.action === 'venda') {
          contextMultiplier = 1.5;
          reasoning.push(`Padrão de venda próximo à resistência em ${context.nearestResistance.price.toFixed(5)}`);
        }
        break;
        
      case 'pullback':
        if ((context.trend === 'bullish' && pattern.action === 'compra') ||
            (context.trend === 'bearish' && pattern.action === 'venda')) {
          contextMultiplier = 1.3;
          reasoning.push('Padrão alinhado com pullback na tendência principal');
        }
        break;
        
      case 'breakout':
        if (pattern.action !== 'neutro') {
          contextMultiplier = 1.4;
          reasoning.push('Padrão confirmando rompimento');
        }
        break;
    }
    
    // Ajustar baseado na volatilidade
    if (context.volatility.level === 'alta' && pattern.confidence > 0.7) {
      contextMultiplier *= 1.1;
      reasoning.push('Alta volatilidade favorece padrões fortes');
    }
    
    // Ajustar baseado na força do nível
    if (context.regionStrength > 80) {
      contextMultiplier *= 1.2;
      reasoning.push('Nível muito forte aumenta confiabilidade');
    }
    
    const finalConfidence = Math.min(0.95, pattern.confidence * contextMultiplier);
    
    return {
      pattern: pattern.type,
      confidence: finalConfidence,
      location: context.regionType,
      regionStrength: context.regionStrength,
      action: pattern.action,
      reasoning,
      contextMultiplier
    };
  });
};

const makeIntelligentDecision = (patterns: ContextualPattern[], context: any): IntelligentAnalysisResult => {
  const buyPatterns = patterns.filter(p => p.action === 'compra' && p.confidence > 0.6);
  const sellPatterns = patterns.filter(p => p.action === 'venda' && p.confidence > 0.6);
  
  let overallSignal: 'compra' | 'venda' | 'neutro' = 'neutro';
  let confidence = 0;
  const reasoning: string[] = [];
  
  // Calcular scores ponderados
  const buyScore = buyPatterns.reduce((sum, p) => sum + (p.confidence * p.contextMultiplier), 0);
  const sellScore = sellPatterns.reduce((sum, p) => sum + (p.confidence * p.contextMultiplier), 0);
  
  // Determinar sinal com base nos scores
  if (buyScore > sellScore && buyScore > 1.2) {
    overallSignal = 'compra';
    confidence = Math.min(95, (buyScore / Math.max(1, sellScore)) * 50);
    reasoning.push(`${buyPatterns.length} padrões de compra detectados (score: ${buyScore.toFixed(2)})`);
  } else if (sellScore > buyScore && sellScore > 1.2) {
    overallSignal = 'venda';
    confidence = Math.min(95, (sellScore / Math.max(1, buyScore)) * 50);
    reasoning.push(`${sellPatterns.length} padrões de venda detectados (score: ${sellScore.toFixed(2)})`);
  }
  
  // Adicionar contexto ao reasoning
  if (context.regionType !== 'neutral') {
    reasoning.push(`Contexto regional: ${context.regionType} (força: ${context.regionStrength}%)`);
  }
  
  if (context.trend !== 'lateral') {
    reasoning.push(`Tendência: ${context.trend}`);
  }
  
  // Ajustes finais baseados no contexto geral
  if (overallSignal !== 'neutro') {
    // Reduzir confiança se contra a tendência principal
    if ((overallSignal === 'compra' && context.trend === 'bearish') ||
        (overallSignal === 'venda' && context.trend === 'bullish')) {
      confidence *= 0.8;
      reasoning.push('Sinal contra tendência principal - confiança reduzida');
    }
    
    // Aumentar confiança se múltiplas confluências
    if (patterns.filter(p => p.action === overallSignal).length >= 3) {
      confidence *= 1.1;
      reasoning.push('Múltiplos padrões convergentes');
    }
  }
  
  return {
    patterns,
    overallSignal,
    confidence: Math.round(confidence),
    keyLevels: {
      support: context.supportLevels.map((s: any) => s.price),
      resistance: context.resistanceLevels.map((r: any) => r.price),
      currentPrice: context.nearestSupport ? 
        (context.nearestSupport.price + context.nearestResistance?.price || context.nearestSupport.price) / 2 : 0
    },
    marketContext: {
      trend: context.trend === 'bullish' ? 'alta' : context.trend === 'bearish' ? 'baixa' : 'lateral',
      phase: context.regionType,
      volatility: context.volatility.level
    },
    reasoning
  };
};
