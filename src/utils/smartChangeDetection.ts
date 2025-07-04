
/**
 * Smart Change Detection - Intelligent Real-time Analysis
 */

export interface ChangeDetectionResult {
  significantChange: boolean;
  changeType: 'breakout' | 'reversal' | 'continuation' | 'consolidation' | 'momentum_shift';
  changeStrength: number;
  confidence: number;
  timeframe: string;
  previousSignal?: string;
  currentSignal: string;
  marketImpact: 'high' | 'medium' | 'low';
  tradingRecommendation: string;
}

export interface AnalysisSnapshot {
  timestamp: number;
  signal: string;
  confidence: number;
  patterns: string[];
  confluence: number;
  priceAction: any[];
  marketPhase: string;
  trend: string;
  volume?: number;
  volatility?: number;
}

// Cache para armazenar snapshots históricos
const analysisHistory: AnalysisSnapshot[] = [];
const MAX_HISTORY = 10;

export const detectSmartChanges = (
  currentAnalysis: AnalysisSnapshot,
  options: {
    sensitivity: 'high' | 'medium' | 'low';
    timeframeContext?: string;
    considerVolume?: boolean;
    considerVolatility?: boolean;
  } = { sensitivity: 'medium' }
): ChangeDetectionResult => {
  
  console.log('🔍 INICIANDO DETECÇÃO INTELIGENTE DE MUDANÇAS');
  
  // Adicionar análise atual ao histórico
  analysisHistory.push(currentAnalysis);
  if (analysisHistory.length > MAX_HISTORY) {
    analysisHistory.shift();
  }
  
  if (analysisHistory.length < 2) {
    return {
      significantChange: false,
      changeType: 'consolidation',
      changeStrength: 0,
      confidence: 0.3,
      timeframe: options.timeframeContext || '1m',
      currentSignal: currentAnalysis.signal,
      marketImpact: 'low',
      tradingRecommendation: 'Aguardar mais dados'
    };
  }
  
  const previous = analysisHistory[analysisHistory.length - 2];
  const current = currentAnalysis;
  
  // 1. Detectar mudança de sinal
  const signalChange = analyzeSignalChange(previous, current);
  console.log('📊 Mudança de sinal:', signalChange);
  
  // 2. Analisar força da mudança
  const strengthAnalysis = analyzeChangeStrength(previous, current, options);
  console.log('💪 Força da mudança:', strengthAnalysis);
  
  // 3. Determinar tipo de mudança
  const changeType = determineChangeType(previous, current, analysisHistory);
  console.log('🎯 Tipo de mudança:', changeType);
  
  // 4. Calcular confiança na detecção
  const confidence = calculateDetectionConfidence(
    signalChange, 
    strengthAnalysis, 
    changeType, 
    analysisHistory
  );
  console.log('🎲 Confiança da detecção:', confidence);
  
  // 5. Avaliar impacto no mercado
  const marketImpact = assessMarketImpact(current, changeType, strengthAnalysis.totalStrength);
  console.log('📈 Impacto no mercado:', marketImpact);
  
  // 6. Gerar recomendação de trading
  const tradingRecommendation = generateTradingRecommendation(
    changeType, 
    current, 
    confidence, 
    marketImpact
  );
  console.log('💡 Recomendação:', tradingRecommendation);
  
  const result: ChangeDetectionResult = {
    significantChange: strengthAnalysis.totalStrength > 0.5 && confidence > 0.6,
    changeType,
    changeStrength: strengthAnalysis.totalStrength,
    confidence,
    timeframe: options.timeframeContext || '1m',
    previousSignal: previous.signal,
    currentSignal: current.signal,
    marketImpact,
    tradingRecommendation
  };
  
  console.log('✅ DETECÇÃO COMPLETA:', result);
  return result;
};

const analyzeSignalChange = (previous: AnalysisSnapshot, current: AnalysisSnapshot) => {
  const signalChanged = previous.signal !== current.signal;
  const confidenceChange = Math.abs(current.confidence - previous.confidence);
  const directionChanged = previous.trend !== current.trend;
  
  return {
    signalChanged,
    confidenceChange,
    directionChanged,
    strengthScore: signalChanged ? 0.6 : (confidenceChange > 0.2 ? 0.4 : 0.1)
  };
};

const analyzeChangeStrength = (
  previous: AnalysisSnapshot, 
  current: AnalysisSnapshot,
  options: any
) => {
  let totalStrength = 0;
  
  // 1. Mudança de sinal (peso: 40%)
  if (previous.signal !== current.signal) {
    totalStrength += 0.4;
  }
  
  // 2. Mudança de confiança (peso: 25%)
  const confidenceChange = Math.abs(current.confidence - previous.confidence);
  totalStrength += Math.min(0.25, confidenceChange * 0.5);
  
  // 3. Mudança de confluência (peso: 20%)
  const confluenceChange = Math.abs(current.confluence - previous.confluence);
  totalStrength += Math.min(0.2, confluenceChange / 100 * 0.4);
  
  // 4. Novos padrões detectados (peso: 15%)
  const newPatterns = current.patterns.filter(p => !previous.patterns.includes(p));
  totalStrength += Math.min(0.15, newPatterns.length * 0.05);
  
  // Ajustar baseado na sensibilidade
  const sensitivityMultiplier = {
    'high': 1.2,
    'medium': 1.0,
    'low': 0.8
  };
  
  totalStrength *= sensitivityMultiplier[options.sensitivity];
  
  return {
    totalStrength: Math.min(1, totalStrength),
    components: {
      signalChange: previous.signal !== current.signal,
      confidenceChange,
      confluenceChange,
      newPatternsCount: newPatterns.length
    }
  };
};

const determineChangeType = (
  previous: AnalysisSnapshot, 
  current: AnalysisSnapshot, 
  history: AnalysisSnapshot[]
): ChangeDetectionResult['changeType'] => {
  
  const signalChanged = previous.signal !== current.signal;
  const trendChanged = previous.trend !== current.trend;
  
  // Breakout: sinal neutro -> compra/venda
  if (previous.signal === 'neutro' && current.signal !== 'neutro') {
    return 'breakout';
  }
  
  // Reversal: compra -> venda ou venda -> compra
  if (signalChanged && previous.signal !== 'neutro' && current.signal !== 'neutro') {
    return 'reversal';
  }
  
  // Momentum shift: mesma direção mas mudança significativa na força
  if (!signalChanged && current.signal !== 'neutro') {
    const confidenceChange = Math.abs(current.confidence - previous.confidence);
    if (confidenceChange > 0.3) {
      return 'momentum_shift';
    }
    return 'continuation';
  }
  
  return 'consolidation';
};

const calculateDetectionConfidence = (
  signalChange: any,
  strengthAnalysis: any,
  changeType: string,
  history: AnalysisSnapshot[]
) => {
  let confidence = 0.5; // Base
  
  // Boost se há mudança de sinal clara
  if (signalChange.signalChanged) {
    confidence += 0.3;
  }
  
  // Boost se há força significativa
  if (strengthAnalysis.totalStrength > 0.7) {
    confidence += 0.2;
  }
  
  // Boost para padrões consistentes no histórico
  if (history.length >= 3) {
    const recentTrend = history.slice(-3).map(h => h.signal);
    const consistency = recentTrend.filter(s => s === history[history.length - 1].signal).length;
    confidence += (consistency / 3) * 0.15;
  }
  
  // Penalizar mudanças muito frequentes (ruído)
  if (history.length >= 5) {
    const recentChanges = history.slice(-5).reduce((changes, curr, idx, arr) => {
      if (idx > 0 && curr.signal !== arr[idx - 1].signal) changes++;
      return changes;
    }, 0);
    
    if (recentChanges > 3) {
      confidence *= 0.7; // Penalizar volatilidade excessiva
    }
  }
  
  return Math.max(0.1, Math.min(1, confidence));
};

const assessMarketImpact = (
  current: AnalysisSnapshot,
  changeType: string,
  strength: number
): ChangeDetectionResult['marketImpact'] => {
  
  // Breakouts e reversals têm maior impacto
  if ((changeType === 'breakout' || changeType === 'reversal') && strength > 0.7) {
    return 'high';
  }
  
  // Momentum shifts com alta confiança
  if (changeType === 'momentum_shift' && current.confidence > 0.8) {
    return 'high';
  }
  
  // Mudanças moderadas
  if (strength > 0.5 && current.confidence > 0.6) {
    return 'medium';
  }
  
  return 'low';
};

const generateTradingRecommendation = (
  changeType: string,
  current: AnalysisSnapshot,
  confidence: number,
  marketImpact: ChangeDetectionResult['marketImpact']
): string => {
  
  if (confidence < 0.5) {
    return 'Aguardar confirmação - baixa confiança';
  }
  
  switch (changeType) {
    case 'breakout':
      if (marketImpact === 'high') {
        return `ENTRADA FORTE - ${current.signal.toUpperCase()} com confirmação`;
      }
      return `Considerar ${current.signal} - breakout detectado`;
      
    case 'reversal':
      if (marketImpact === 'high') {
        return `REVERSÃO CONFIRMADA - Ajustar posição para ${current.signal.toUpperCase()}`;
      }
      return `Cautela - possível reversão para ${current.signal}`;
      
    case 'momentum_shift':
      return `Momentum ${current.confidence > 0.8 ? 'forte' : 'moderado'} - ${current.signal}`;
      
    case 'continuation':
      return `Manter direção ${current.signal} - continuação confirmada`;
      
    default:
      return 'Monitorar - mercado em consolidação';
  }
};

// Função para limpar histórico quando necessário
export const clearAnalysisHistory = () => {
  analysisHistory.length = 0;
  console.log('🗑️ Histórico de análises limpo');
};

// Função para obter estatísticas do histórico
export const getHistoryStats = () => {
  if (analysisHistory.length === 0) return null;
  
  const signals = analysisHistory.map(h => h.signal);
  const avgConfidence = analysisHistory.reduce((sum, h) => sum + h.confidence, 0) / analysisHistory.length;
  const changes = analysisHistory.reduce((count, curr, idx, arr) => {
    if (idx > 0 && curr.signal !== arr[idx - 1].signal) count++;
    return count;
  }, 0);
  
  return {
    totalAnalyses: analysisHistory.length,
    averageConfidence: Math.round(avgConfidence * 100),
    signalChanges: changes,
    changeFrequency: changes / Math.max(1, analysisHistory.length - 1),
    currentTrend: analysisHistory[analysisHistory.length - 1]?.trend || 'unknown'
  };
};
