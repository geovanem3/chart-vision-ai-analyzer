
import { CandleData } from '../context/AnalyzerContext';
import { DetectedPattern } from './types';

export const identifyEntryPoints = (
  candles: CandleData[],
  patterns: DetectedPattern[],
  confluenceData: any,
  marketContext: any,
  priceActionData: any
) => {
  if (candles.length < 5) return [];
  
  const entryPoints: any[] = [];
  const currentPrice = candles[candles.length - 1].close;
  
  // Identificar entradas baseadas em confluência de fatores reais
  patterns.forEach(pattern => {
    if (pattern.confidence > 0.7) {
      // Verificar se está próximo a suporte/resistência
      const nearKeyLevel = confluenceData.supportResistance?.some((level: any) => {
        const distance = Math.abs(currentPrice - level.price) / currentPrice;
        return distance < 0.005; // Dentro de 0.5%
      });
      
      if (nearKeyLevel) {
        entryPoints.push({
          type: 'confluencia_nivel',
          action: pattern.action,
          confidence: Math.min(0.95, pattern.confidence + 0.1),
          entry: currentPrice,
          reasoning: `${pattern.description} próximo a nível-chave`,
          riskReward: calculateRiskReward(currentPrice, pattern.action, confluenceData)
        });
      }
    }
  });
  
  // Adicionar entradas baseadas em price action
  if (priceActionData?.signals) {
    priceActionData.signals.forEach((signal: any) => {
      if (signal.confidence > 0.7) {
        entryPoints.push({
          type: 'price_action',
          action: signal.action,
          confidence: signal.confidence,
          entry: signal.price,
          reasoning: signal.description,
          riskReward: calculateRiskReward(signal.price, signal.action, confluenceData)
        });
      }
    });
  }
  
  return entryPoints.slice(0, 3); // Máximo 3 entradas
};

const calculateRiskReward = (entryPrice: number, action: string, confluenceData: any): number => {
  const supportResistance = confluenceData.supportResistance || [];
  
  if (action === 'compra') {
    const nearestSupport = supportResistance
      .filter((level: any) => level.type === 'support' && level.price < entryPrice)
      .sort((a: any, b: any) => Math.abs(entryPrice - b.price) - Math.abs(entryPrice - a.price))[0];
    
    const nearestResistance = supportResistance
      .filter((level: any) => level.type === 'resistance' && level.price > entryPrice)
      .sort((a: any, b: any) => Math.abs(entryPrice - a.price) - Math.abs(entryPrice - b.price))[0];
    
    if (nearestSupport && nearestResistance) {
      const risk = entryPrice - nearestSupport.price;
      const reward = nearestResistance.price - entryPrice;
      return risk > 0 ? reward / risk : 2.0;
    }
  } else if (action === 'venda') {
    const nearestResistance = supportResistance
      .filter((level: any) => level.type === 'resistance' && level.price > entryPrice)
      .sort((a: any, b: any) => Math.abs(entryPrice - a.price) - Math.abs(entryPrice - b.price))[0];
    
    const nearestSupport = supportResistance
      .filter((level: any) => level.type === 'support' && level.price < entryPrice)
      .sort((a: any, b: any) => Math.abs(entryPrice - a.price) - Math.abs(entryPrice - b.price))[0];
    
    if (nearestResistance && nearestSupport) {
      const risk = nearestResistance.price - entryPrice;
      const reward = entryPrice - nearestSupport.price;
      return risk > 0 ? reward / risk : 2.0;
    }
  }
  
  return 2.0; // Default R:R
};
