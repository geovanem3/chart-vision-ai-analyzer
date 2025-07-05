
import { DetectedPattern, CandleData, AnalysisResult } from '@/context/AnalyzerContext';

export interface TradingDecision {
  action: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  confidence: number;
  reasoning: string[];
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward?: number;
  positionSize?: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  validUntil: number; // timestamp
  signals: {
    technical: string[];
    confluence: string[];
    priceAction: string[];
  };
}

export interface DecisionCriteria {
  minConfidence: number;
  requiredConfluences: number;
  riskRewardRatio: number;
  maxRiskPercent: number;
  timeframe: string;
}

export class TradingDecisionEngine {
  private criteria: DecisionCriteria;

  constructor(criteria: DecisionCriteria) {
    this.criteria = criteria;
  }

  // Método principal para tomar decisões baseadas na análise real
  makeDecision(analysisResult: AnalysisResult): TradingDecision {
    console.log('🤖 AI Decision Engine: Processando análise para tomada de decisão...');
    
    const patterns = analysisResult.patterns || [];
    const confluences = analysisResult.confluences;
    const priceActionSignals = analysisResult.priceActionSignals || [];
    const entryRecommendations = analysisResult.entryRecommendations || [];
    
    // Fase 1: Avaliar força dos sinais
    const signalStrength = this.evaluateSignalStrength(patterns, priceActionSignals);
    
    // Fase 2: Verificar confluências
    const confluenceScore = confluences?.confluenceScore || 0;
    const hasRequiredConfluences = confluenceScore >= (this.criteria.requiredConfluences * 10);
    
    // Fase 3: Determinar direção predominante
    const direction = this.determinePredominantDirection(patterns, priceActionSignals);
    
    // Fase 4: Calcular confiança total
    const totalConfidence = this.calculateTotalConfidence(
      signalStrength,
      confluenceScore,
      patterns,
      priceActionSignals
    );
    
    console.log('📊 Decision Analysis:', {
      signalStrength,
      confluenceScore,
      direction,
      totalConfidence,
      hasRequiredConfluences
    });
    
    // Fase 5: Tomar decisão baseada nos critérios
    return this.generateTradingDecision(
      direction,
      totalConfidence,
      hasRequiredConfluences,
      patterns,
      confluences,
      priceActionSignals,
      entryRecommendations
    );
  }

  private evaluateSignalStrength(patterns: DetectedPattern[], priceActionSignals: any[]): number {
    if (patterns.length === 0 && priceActionSignals.length === 0) return 0;
    
    // Avaliar força dos padrões
    const patternStrength = patterns.reduce((total, pattern) => {
      let strength = pattern.confidence;
      
      // Bonus para padrões de alta confiança
      if (pattern.confidence > 0.8) strength += 0.1;
      if (pattern.confidence > 0.9) strength += 0.1;
      
      // Bonus para padrões específicos conhecidos
      if (pattern.type.includes('Engolfo') || pattern.type.includes('Pin Bar')) {
        strength += 0.05;
      }
      
      return total + strength;
    }, 0) / Math.max(patterns.length, 1);
    
    // Avaliar força do price action
    const priceActionStrength = priceActionSignals.reduce((total, signal) => {
      let strength = signal.confidence || 0.5;
      
      // Bonus para sinais de alta qualidade
      if (signal.strength === 'forte') strength += 0.15;
      if (signal.riskReward && signal.riskReward > 2) strength += 0.1;
      
      return total + strength;
    }, 0) / Math.max(priceActionSignals.length, 1);
    
    // Combinar as forças com pesos
    return (patternStrength * 0.6) + (priceActionStrength * 0.4);
  }

  private determinePredominantDirection(patterns: DetectedPattern[], priceActionSignals: any[]): 'BUY' | 'SELL' | 'NEUTRAL' {
    let buyScore = 0;
    let sellScore = 0;
    
    // Avaliar padrões
    patterns.forEach(pattern => {
      const weight = pattern.confidence;
      if (pattern.action === 'compra') {
        buyScore += weight;
      } else if (pattern.action === 'venda') {
        sellScore += weight;
      }
    });
    
    // Avaliar price action
    priceActionSignals.forEach(signal => {
      const weight = signal.confidence || 0.5;
      if (signal.direction === 'alta') {
        buyScore += weight;
      } else if (signal.direction === 'baixa') {
        sellScore += weight;
      }
    });
    
    const diff = Math.abs(buyScore - sellScore);
    const threshold = 0.3; // Diferença mínima para tomar decisão
    
    if (diff < threshold) return 'NEUTRAL';
    return buyScore > sellScore ? 'BUY' : 'SELL';
  }

  private calculateTotalConfidence(
    signalStrength: number,
    confluenceScore: number,
    patterns: DetectedPattern[],
    priceActionSignals: any[]
  ): number {
    // Base: força do sinal (40%)
    let confidence = signalStrength * 0.4;
    
    // Confluências (30%)
    confidence += (confluenceScore / 100) * 0.3;
    
    // Consistência entre sinais (20%)
    const consistency = this.calculateSignalConsistency(patterns, priceActionSignals);
    confidence += consistency * 0.2;
    
    // Qualidade dos dados (10%)
    const dataQuality = this.assessDataQuality(patterns, priceActionSignals);
    confidence += dataQuality * 0.1;
    
    return Math.min(1, Math.max(0, confidence));
  }

  private calculateSignalConsistency(patterns: DetectedPattern[], priceActionSignals: any[]): number {
    const actions = patterns.map(p => p.action).filter(a => a !== 'neutro');
    const directions = priceActionSignals.map(s => s.direction).filter(d => d && d !== 'lateral');
    
    if (actions.length === 0 && directions.length === 0) return 0;
    
    // Verificar consistência nos padrões
    const uniqueActions = [...new Set(actions)];
    const actionConsistency = uniqueActions.length <= 1 ? 1 : 0.5;
    
    // Verificar consistência no price action
    const uniqueDirections = [...new Set(directions)];
    const directionConsistency = uniqueDirections.length <= 1 ? 1 : 0.5;
    
    return (actionConsistency + directionConsistency) / 2;
  }

  private assessDataQuality(patterns: DetectedPattern[], priceActionSignals: any[]): number {
    let quality = 0.5; // Base quality
    
    // Qualidade baseada na quantidade de dados
    if (patterns.length >= 2) quality += 0.2;
    if (priceActionSignals.length >= 1) quality += 0.2;
    
    // Qualidade baseada na confiança média
    const avgPatternConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / Math.max(patterns.length, 1);
    if (avgPatternConfidence > 0.7) quality += 0.1;
    
    return Math.min(1, quality);
  }

  private generateTradingDecision(
    direction: 'BUY' | 'SELL' | 'NEUTRAL',
    confidence: number,
    hasRequiredConfluences: boolean,
    patterns: DetectedPattern[],
    confluences: any,
    priceActionSignals: any[],
    entryRecommendations: any[]
  ): TradingDecision {
    
    const reasoning: string[] = [];
    const signals = {
      technical: patterns.map(p => p.type),
      confluence: [],
      priceAction: priceActionSignals.map(s => s.type)
    };
    
    // Determinar ação baseada nos critérios
    let action: TradingDecision['action'] = 'WAIT';
    let urgency: TradingDecision['urgency'] = 'LOW';
    
    if (confidence >= this.criteria.minConfidence && hasRequiredConfluences) {
      if (direction === 'BUY' || direction === 'SELL') {
        action = direction;
        urgency = confidence > 0.8 ? 'HIGH' : confidence > 0.6 ? 'MEDIUM' : 'LOW';
        
        reasoning.push(`Sinal ${direction} com confiança ${Math.round(confidence * 100)}%`);
        reasoning.push(`${patterns.length} padrões técnicos confirmam a direção`);
        
        if (confluences?.confluenceScore) {
          reasoning.push(`Score de confluência: ${Math.round(confluences.confluenceScore)}%`);
          signals.confluence.push(`Confluência ${Math.round(confluences.confluenceScore)}%`);
        }
      } else {
        action = 'HOLD';
        reasoning.push('Sinais conflitantes - aguardando confirmação');
      }
    } else {
      reasoning.push(`Confiança ${Math.round(confidence * 100)}% abaixo do mínimo ${Math.round(this.criteria.minConfidence * 100)}%`);
      if (!hasRequiredConfluences) {
        reasoning.push('Confluências insuficientes para confirmar entrada');
      }
    }
    
    // Calcular níveis de entrada se há recomendações
    let entryPrice, stopLoss, takeProfit, riskReward;
    
    if (entryRecommendations.length > 0 && (action === 'BUY' || action === 'SELL')) {
      const bestEntry = entryRecommendations.find(e => 
        e.action === (action === 'BUY' ? 'compra' : 'venda')
      ) || entryRecommendations[0];
      
      if (bestEntry) {
        entryPrice = bestEntry.entryPrice;
        stopLoss = bestEntry.stopLoss;
        takeProfit = bestEntry.takeProfit;
        riskReward = bestEntry.riskReward || this.criteria.riskRewardRatio;
        
        reasoning.push(`Entrada: ${entryPrice?.toFixed(4)} | SL: ${stopLoss?.toFixed(4)} | TP: ${takeProfit?.toFixed(4)}`);
      }
    }
    
    console.log(`🎯 DECISÃO FINAL: ${action} | Confiança: ${Math.round(confidence * 100)}% | Urgência: ${urgency}`);
    
    return {
      action,
      confidence,
      reasoning,
      entryPrice,
      stopLoss,
      takeProfit,
      riskReward,
      positionSize: this.calculatePositionSize(confidence),
      urgency,
      validUntil: Date.now() + (5 * 60 * 1000), // Válido por 5 minutos
      signals
    };
  }

  private calculatePositionSize(confidence: number): number {
    // Tamanho da posição baseado na confiança (1-5% do capital)
    const baseSize = 0.01; // 1%
    const maxSize = 0.05; // 5%
    
    return Math.min(maxSize, baseSize + (confidence * 0.04));
  }
}

// Factory para criar engine com configurações padrão
export const createDecisionEngine = (timeframe: string = '1m'): TradingDecisionEngine => {
  const criteria: DecisionCriteria = {
    minConfidence: timeframe === '1m' ? 0.65 : 0.70, // M1 pode ser mais agressivo
    requiredConfluences: timeframe === '1m' ? 6 : 7, // Score mínimo de confluência
    riskRewardRatio: 2.0,
    maxRiskPercent: 0.02, // 2% máximo de risco
    timeframe
  };
  
  return new TradingDecisionEngine(criteria);
};
