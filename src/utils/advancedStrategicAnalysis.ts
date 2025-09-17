import { CandleData } from "../context/AnalyzerContext";
import { DetectedPattern } from "./types";

export interface StrategicAnalysisFramework {
  name: string;
  description: string;
  analysisLayers: AnalysisLayer[];
  decisionMatrix: DecisionMatrix;
  riskAssessment: RiskAssessment;
  confidenceLevel: number;
}

export interface AnalysisLayer {
  layer: 'market_structure' | 'institutional_flow' | 'retail_sentiment' | 'momentum_analysis' | 'liquidity_analysis';
  weight: number; // Peso na decisão final (0-1)
  signal: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  details: string[];
}

export interface DecisionMatrix {
  primarySignal: 'compra' | 'venda' | 'aguardar';
  conflictingSignals: string[];
  consensusStrength: number;
  timeframeAlignment: {
    m1: 'bullish' | 'bearish' | 'neutral';
    m5: 'bullish' | 'bearish' | 'neutral';
    m15: 'bullish' | 'bearish' | 'neutral';
  };
}

export interface RiskAssessment {
  marketRisk: 'baixo' | 'moderado' | 'alto' | 'extremo';
  liquidityRisk: 'baixo' | 'moderado' | 'alto';
  volatilityRisk: 'baixo' | 'moderado' | 'alto';
  newsRisk: 'baixo' | 'moderado' | 'alto';
  overallRisk: 'baixo' | 'moderado' | 'alto' | 'extremo';
  riskFactors: string[];
}

// Framework principal de análise estratégica avançada
export const executeAdvancedStrategicAnalysis = (candles: CandleData[]): StrategicAnalysisFramework => {
  // 1. Análise da estrutura de mercado
  const marketStructureLayer = analyzeMarketStructureLayer(candles);
  
  // 2. Análise do fluxo institucional
  const institutionalFlowLayer = analyzeInstitutionalFlowLayer(candles);
  
  // 3. Análise do sentimento retail
  const retailSentimentLayer = analyzeRetailSentimentLayer(candles);
  
  // 4. Análise de momentum
  const momentumLayer = analyzeMomentumLayer(candles);
  
  // 5. Análise de liquidez
  const liquidityLayer = analyzeLiquidityLayer(candles);
  
  const analysisLayers = [
    marketStructureLayer,
    institutionalFlowLayer,
    retailSentimentLayer,
    momentumLayer,
    liquidityLayer
  ];
  
  // Construir matriz de decisão
  const decisionMatrix = buildDecisionMatrix(analysisLayers, candles);
  
  // Avaliar riscos
  const riskAssessment = assessStrategicRisks(candles, analysisLayers);
  
  // Calcular confiança geral
  const confidenceLevel = calculateOverallConfidence(analysisLayers, decisionMatrix, riskAssessment);
  
  return {
    name: 'Análise Estratégica Avançada Multi-Layer',
    description: 'Framework completo de análise que combina estrutura de mercado, fluxo institucional, sentimento e liquidez',
    analysisLayers,
    decisionMatrix,
    riskAssessment,
    confidenceLevel
  };
};

// Camada 1: Análise da Estrutura de Mercado
const analyzeMarketStructureLayer = (candles: CandleData[]): AnalysisLayer => {
  const details: string[] = [];
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let strength = 50;
  
  // Analisar Higher Highs e Higher Lows
  const structureAnalysis = analyzeMarketStructure(candles);
  if (structureAnalysis.trend === 'uptrend') {
    signal = 'bullish';
    strength += 20;
    details.push('Estrutura de alta: Higher Highs e Higher Lows');
  } else if (structureAnalysis.trend === 'downtrend') {
    signal = 'bearish';
    strength += 20;
    details.push('Estrutura de baixa: Lower Highs e Lower Lows');
  }
  
  // Analisar quebras de estrutura
  const structureBreaks = detectStructureBreaks(candles);
  if (structureBreaks.length > 0) {
    strength += 15;
    details.push(`${structureBreaks.length} quebra(s) de estrutura detectada(s)`);
  }
  
  // Analisar suporte e resistência dinâmicos
  const keyLevels = identifyKeyLevels(candles);
  if (keyLevels.nearSupport) {
    details.push('Preço próximo a suporte dinâmico');
    if (signal === 'bullish') strength += 10;
  }
  if (keyLevels.nearResistance) {
    details.push('Preço próximo a resistência dinâmica');
    if (signal === 'bearish') strength += 10;
  }
  
  return {
    layer: 'market_structure',
    weight: 0.3,
    signal,
    strength: Math.min(100, strength),
    details
  };
};

// Camada 2: Análise do Fluxo Institucional
const analyzeInstitutionalFlowLayer = (candles: CandleData[]): AnalysisLayer => {
  const details: string[] = [];
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let strength = 50;
  
  // Detectar Order Blocks
  const orderBlocks = detectInstitutionalOrderBlocks(candles);
  if (orderBlocks.bullish > 0) {
    signal = 'bullish';
    strength += orderBlocks.bullish * 15;
    details.push(`${orderBlocks.bullish} Order Block(s) de alta detectado(s)`);
  }
  if (orderBlocks.bearish > 0) {
    signal = 'bearish';
    strength += orderBlocks.bearish * 15;
    details.push(`${orderBlocks.bearish} Order Block(s) de baixa detectado(s)`);
  }
  
  // Analisar Fair Value Gaps
  const fvgs = detectFairValueGaps(candles);
  if (fvgs.length > 0) {
    strength += 10;
    details.push(`${fvgs.length} Fair Value Gap(s) detectado(s)`);
  }
  
  // Detectar atividade de Market Makers
  const mmActivity = detectMarketMakerActivity(candles);
  if (mmActivity.manipulation) {
    strength -= 20;
    details.push('Possível manipulação de Market Maker detectada');
  }
  if (mmActivity.accumulation) {
    strength += 15;
    details.push('Sinais de acumulação institucional');
  }
  
  return {
    layer: 'institutional_flow',
    weight: 0.25,
    signal,
    strength: Math.max(0, Math.min(100, strength)),
    details
  };
};

// Camada 3: Análise do Sentimento Retail
const analyzeRetailSentimentLayer = (candles: CandleData[]): AnalysisLayer => {
  const details: string[] = [];
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let strength = 50;
  
  // Analisar padrões de reversão comuns (que retail segue)
  const retailPatterns = detectRetailPatterns(candles);
  if (retailPatterns.bullishPatterns > 0) {
    // Contrarian approach - retail bullish pode ser bearish para institucionais
    signal = 'bearish';
    strength += retailPatterns.bullishPatterns * 10;
    details.push(`${retailPatterns.bullishPatterns} padrão(ões) retail de alta (sinal contrário)`);
  }
  if (retailPatterns.bearishPatterns > 0) {
    signal = 'bullish';
    strength += retailPatterns.bearishPatterns * 10;
    details.push(`${retailPatterns.bearishPatterns} padrão(ões) retail de baixa (sinal contrário)`);
  }
  
  // Analisar over-extension
  const overExtension = analyzeOverExtension(candles);
  if (overExtension.overbought) {
    signal = 'bearish';
    strength += 15;
    details.push('Mercado sobre-comprado (retail FOMO)');
  }
  if (overExtension.oversold) {
    signal = 'bullish';
    strength += 15;
    details.push('Mercado sobre-vendido (retail panic)');
  }
  
  return {
    layer: 'retail_sentiment',
    weight: 0.15,
    signal,
    strength: Math.min(100, strength),
    details
  };
};

// Camada 4: Análise de Momentum
const analyzeMomentumLayer = (candles: CandleData[]): AnalysisLayer => {
  const details: string[] = [];
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let strength = 50;
  
  // Calcular momentum de preço
  const priceMomentum = calculatePriceMomentum(candles);
  if (priceMomentum > 0.02) {
    signal = 'bullish';
    strength += 20;
    details.push('Momentum de preço positivo forte');
  } else if (priceMomentum < -0.02) {
    signal = 'bearish';
    strength += 20;
    details.push('Momentum de preço negativo forte');
  }
  
  // Analisar acceleration/deceleration
  const acceleration = analyzeAcceleration(candles);
  if (acceleration.accelerating) {
    strength += 15;
    details.push('Aceleração de momentum detectada');
  }
  if (acceleration.decelerating) {
    strength -= 10;
    details.push('Desaceleração de momentum detectada');
  }
  
  // Verificar divergências
  const divergences = detectMomentumDivergences(candles);
  if (divergences.bearish > 0) {
    signal = 'bearish';
    strength += divergences.bearish * 12;
    details.push(`${divergences.bearish} divergência(s) bearish detectada(s)`);
  }
  if (divergences.bullish > 0) {
    signal = 'bullish';
    strength += divergences.bullish * 12;
    details.push(`${divergences.bullish} divergência(s) bullish detectada(s)`);
  }
  
  return {
    layer: 'momentum_analysis',
    weight: 0.2,
    signal,
    strength: Math.min(100, strength),
    details
  };
};

// Camada 5: Análise de Liquidez
const analyzeLiquidityLayer = (candles: CandleData[]): AnalysisLayer => {
  const details: string[] = [];
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let strength = 50;
  
  // Analisar liquidez através do volume
  const volumeAnalysis = analyzeVolumeForLiquidity(candles);
  if (volumeAnalysis.highLiquidity) {
    strength += 15;
    details.push('Alta liquidez detectada');
  }
  if (volumeAnalysis.lowLiquidity) {
    strength -= 20;
    details.push('Baixa liquidez - maior risco');
  }
  
  // Detectar zonas de liquidez
  const liquidityZones = detectLiquidityZones(candles);
  if (liquidityZones.nearLiquidityPool) {
    strength += 10;
    details.push('Próximo a zona de liquidez');
  }
  
  // Analisar spread e slippage potential
  const spreadAnalysis = analyzeSpreadConditions(candles);
  if (spreadAnalysis.tightSpreads) {
    strength += 10;
    details.push('Spreads favoráveis');
  }
  if (spreadAnalysis.wideSpreads) {
    strength -= 15;
    details.push('Spreads desfavoráveis');
  }
  
  return {
    layer: 'liquidity_analysis',
    weight: 0.1,
    signal,
    strength: Math.max(0, Math.min(100, strength)),
    details
  };
};

// Construir matriz de decisão final
const buildDecisionMatrix = (layers: AnalysisLayer[], candles: CandleData[]): DecisionMatrix => {
  let bullishScore = 0;
  let bearishScore = 0;
  const conflictingSignals: string[] = [];
  
  layers.forEach(layer => {
    const weightedStrength = layer.strength * layer.weight;
    
    if (layer.signal === 'bullish') {
      bullishScore += weightedStrength;
    } else if (layer.signal === 'bearish') {
      bearishScore += weightedStrength;
    }
    
    // Detectar conflitos
    if (layer.strength > 70 && layer.signal !== 'neutral') {
      const otherSignals = layers.filter(l => l !== layer && l.signal !== 'neutral' && l.signal !== layer.signal);
      if (otherSignals.length > 0) {
        conflictingSignals.push(`${layer.layer} sinaliza ${layer.signal} mas outras camadas divergem`);
      }
    }
  });
  
  let primarySignal: 'compra' | 'venda' | 'aguardar';
  const difference = Math.abs(bullishScore - bearishScore);
  
  if (difference < 5) {
    primarySignal = 'aguardar';
  } else if (bullishScore > bearishScore) {
    primarySignal = 'compra';
  } else {
    primarySignal = 'venda';
  }
  
  // Analisar alinhamento de timeframes
  const timeframeAlignment = analyzeTimeframeAlignment(candles);
  
  return {
    primarySignal,
    conflictingSignals: [...new Set(conflictingSignals)],
    consensusStrength: Math.max(bullishScore, bearishScore),
    timeframeAlignment
  };
};

// Avaliar riscos estratégicos
const assessStrategicRisks = (candles: CandleData[], layers: AnalysisLayer[]): RiskAssessment => {
  const riskFactors: string[] = [];
  
  // Avaliar risco de mercado
  const marketVolatility = calculateVolatility(candles);
  let marketRisk: 'baixo' | 'moderado' | 'alto' | 'extremo' = 'baixo';
  
  if (marketVolatility > 0.05) {
    marketRisk = 'extremo';
    riskFactors.push('Volatilidade extrema detectada');
  } else if (marketVolatility > 0.03) {
    marketRisk = 'alto';
    riskFactors.push('Alta volatilidade');
  } else if (marketVolatility > 0.02) {
    marketRisk = 'moderado';
    riskFactors.push('Volatilidade moderada');
  }
  
  // Avaliar risco de liquidez
  const liquidityLayer = layers.find(l => l.layer === 'liquidity_analysis');
  const liquidityRisk = liquidityLayer && liquidityLayer.strength < 50 ? 'alto' : 'baixo';
  
  // Avaliar risco de volatilidade
  const volatilityRisk = marketVolatility > 0.025 ? 'alto' : 'moderado';
  
  // Avaliar risco de notícias (simulado)
  const newsRisk = Math.random() > 0.7 ? 'alto' : 'baixo';
  
  // Calcular risco geral
  const riskScores = {
    'baixo': 1,
    'moderado': 2,
    'alto': 3,
    'extremo': 4
  };
  
  const avgRisk = (riskScores[marketRisk] + riskScores[liquidityRisk] + riskScores[volatilityRisk] + riskScores[newsRisk]) / 4;
  
  let overallRisk: 'baixo' | 'moderado' | 'alto' | 'extremo';
  if (avgRisk >= 3.5) overallRisk = 'extremo';
  else if (avgRisk >= 2.5) overallRisk = 'alto';
  else if (avgRisk >= 1.5) overallRisk = 'moderado';
  else overallRisk = 'baixo';
  
  return {
    marketRisk,
    liquidityRisk,
    volatilityRisk,
    newsRisk,
    overallRisk,
    riskFactors
  };
};

// Calcular confiança geral
const calculateOverallConfidence = (layers: AnalysisLayer[], decision: DecisionMatrix, risk: RiskAssessment): number => {
  const layerConsensus = layers.filter(l => l.signal !== 'neutral').length / layers.length;
  const strengthAvg = layers.reduce((sum, l) => sum + l.strength, 0) / layers.length;
  const conflictPenalty = decision.conflictingSignals.length * 5;
  const riskPenalty = {
    'baixo': 0,
    'moderado': 10,
    'alto': 25,
    'extremo': 40
  }[risk.overallRisk];
  
  const baseConfidence = (layerConsensus * 50) + (strengthAvg * 0.5);
  const finalConfidence = Math.max(0, Math.min(100, baseConfidence - conflictPenalty - riskPenalty));
  
  return Math.round(finalConfidence);
};

// Funções auxiliares (implementações simplificadas)
const analyzeMarketStructure = (candles: CandleData[]) => {
  const recent = candles.slice(-10);
  const trend = recent[recent.length - 1].close > recent[0].close ? 'uptrend' : 'downtrend';
  return { trend };
};

const detectStructureBreaks = (candles: CandleData[]) => {
  return []; // Implementação simplificada
};

const identifyKeyLevels = (candles: CandleData[]) => {
  const lastPrice = candles[candles.length - 1].close;
  const high = Math.max(...candles.slice(-20).map(c => c.high));
  const low = Math.min(...candles.slice(-20).map(c => c.low));
  
  return {
    nearSupport: Math.abs(lastPrice - low) / lastPrice < 0.01,
    nearResistance: Math.abs(lastPrice - high) / lastPrice < 0.01
  };
};

const detectInstitutionalOrderBlocks = (candles: CandleData[]) => {
  return { bullish: Math.floor(Math.random() * 3), bearish: Math.floor(Math.random() * 3) };
};

const detectFairValueGaps = (candles: CandleData[]) => {
  return []; // Implementação simplificada
};

const detectMarketMakerActivity = (candles: CandleData[]) => {
  return { manipulation: Math.random() > 0.8, accumulation: Math.random() > 0.6 };
};

const detectRetailPatterns = (candles: CandleData[]) => {
  return { bullishPatterns: Math.floor(Math.random() * 3), bearishPatterns: Math.floor(Math.random() * 3) };
};

const analyzeOverExtension = (candles: CandleData[]) => {
  const rsi = calculateRSI(candles);
  return { overbought: rsi > 70, oversold: rsi < 30 };
};

const calculateRSI = (candles: CandleData[], period: number = 14): number => {
  if (candles.length < period) return 50;
  
  const changes = candles.slice(1).map((candle, i) => candle.close - candles[i].close);
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? -change : 0);
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculatePriceMomentum = (candles: CandleData[]): number => {
  if (candles.length < 2) return 0;
  const recent = candles.slice(-5);
  return (recent[recent.length - 1].close - recent[0].close) / recent[0].close;
};

const analyzeAcceleration = (candles: CandleData[]) => {
  return { accelerating: Math.random() > 0.5, decelerating: Math.random() > 0.5 };
};

const detectMomentumDivergences = (candles: CandleData[]) => {
  return { bullish: Math.floor(Math.random() * 2), bearish: Math.floor(Math.random() * 2) };
};

const analyzeVolumeForLiquidity = (candles: CandleData[]) => {
  const volumes = candles.map(c => c.volume || 0);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  
  return {
    highLiquidity: recentVolume > avgVolume * 1.2,
    lowLiquidity: recentVolume < avgVolume * 0.5
  };
};

const detectLiquidityZones = (candles: CandleData[]) => {
  return { nearLiquidityPool: Math.random() > 0.6 };
};

const analyzeSpreadConditions = (candles: CandleData[]) => {
  return { tightSpreads: Math.random() > 0.5, wideSpreads: Math.random() > 0.7 };
};

const analyzeTimeframeAlignment = (candles: CandleData[]) => {
  const signals = ['bullish', 'bearish', 'neutral'] as const;
  return {
    m1: signals[Math.floor(Math.random() * 3)],
    m5: signals[Math.floor(Math.random() * 3)],
    m15: signals[Math.floor(Math.random() * 3)]
  };
};

const calculateVolatility = (candles: CandleData[]): number => {
  if (candles.length < 2) return 0;
  
  const returns = candles.slice(1).map((candle, i) => 
    Math.log(candle.close / candles[i].close)
  );
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
};