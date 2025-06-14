
import { CandleData } from "../context/AnalyzerContext";

export interface MarketContext {
  phase: string;
  sentiment: string;
  strength: string;
  description: string;
}

export interface AdvancedMarketConditions {
  liquidityState: 'high' | 'medium' | 'low';
  institutionalBias: 'bullish' | 'bearish' | 'neutral';
  volatilityRegime: 'low' | 'normal' | 'high' | 'extreme';
  marketStructure: 'trending' | 'ranging' | 'transitional';
  timeOfDay: 'asia' | 'london' | 'ny' | 'overlap' | 'quiet';
  economicCalendar: 'high_impact' | 'medium_impact' | 'low_impact' | 'none';
  seasonalEffect: 'positive' | 'negative' | 'neutral';
  riskSentiment: 'risk_on' | 'risk_off' | 'mixed';
  recommendation: 'operar' | 'cautela' | 'nao_operar';
  warnings: string[];
}

export interface EnhancedMarketContext extends MarketContext {
  advancedConditions: AdvancedMarketConditions;
  operatingScore: number;
  confidenceReduction: number;
}

export const analyzeAdvancedMarketConditions = (candles: CandleData[]): AdvancedMarketConditions => {
  const warnings: string[] = [];
  
  // Simular análise de condições avançadas
  const volatilityRegime: 'low' | 'normal' | 'high' | 'extreme' = 'normal';
  const liquidityState: 'high' | 'medium' | 'low' = 'medium';
  const institutionalBias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  const marketStructure: 'trending' | 'ranging' | 'transitional' = 'ranging';
  
  // Determinar horário do dia (simulado)
  const hour = new Date().getHours();
  let timeOfDay: 'asia' | 'london' | 'ny' | 'overlap' | 'quiet';
  if (hour >= 0 && hour < 8) timeOfDay = 'asia';
  else if (hour >= 8 && hour < 13) timeOfDay = 'london';
  else if (hour >= 13 && hour < 22) timeOfDay = 'ny';
  else timeOfDay = 'quiet';
  
  // Simular outros fatores
  const economicCalendar: 'high_impact' | 'medium_impact' | 'low_impact' | 'none' = 'low_impact';
  const seasonalEffect: 'positive' | 'negative' | 'neutral' = 'neutral';
  const riskSentiment: 'risk_on' | 'risk_off' | 'mixed' = 'mixed';
  
  // Determinar recomendação
  let recommendation: 'operar' | 'cautela' | 'nao_operar' = 'operar';
  
  if (volatilityRegime === 'extreme') {
    warnings.push('Volatilidade extrema detectada');
    recommendation = 'nao_operar';
  }
  
  if (liquidityState === 'low') {
    warnings.push('Baixa liquidez no mercado');
    if (recommendation === 'operar') recommendation = 'cautela';
  }
  
  return {
    liquidityState,
    institutionalBias,
    volatilityRegime,
    marketStructure,
    timeOfDay,
    economicCalendar,
    seasonalEffect,
    riskSentiment,
    recommendation,
    warnings
  };
};

export const calculateOperatingScore = (conditions: AdvancedMarketConditions): number => {
  let score = 100;
  
  // Penalizar por volatilidade
  if (conditions.volatilityRegime === 'extreme') score -= 50;
  else if (conditions.volatilityRegime === 'high') score -= 25;
  
  // Penalizar por baixa liquidez
  if (conditions.liquidityState === 'low') score -= 30;
  else if (conditions.liquidityState === 'medium') score -= 10;
  
  // Penalizar por horário ruim
  if (conditions.timeOfDay === 'quiet') score -= 20;
  
  return Math.max(0, score);
};

export const calculateConfidenceReduction = (conditions: AdvancedMarketConditions): number => {
  let reduction = 1.0;
  
  if (conditions.volatilityRegime === 'extreme') reduction *= 0.5;
  else if (conditions.volatilityRegime === 'high') reduction *= 0.7;
  
  if (conditions.liquidityState === 'low') reduction *= 0.8;
  
  return reduction;
};
