
import { CandleData } from '../context/AnalyzerContext';
import { DetectedPattern } from './types';

export const identifyEntryPoints = (
  candles: CandleData[],
  patterns: DetectedPattern[],
  confluenceData: any,
  marketContext: any,
  priceActionData: any
) => {
  if (candles.length < 3) {
    console.log('⚠️ Poucos candles para identificar pontos de entrada');
    return [];
  }
  
  console.log(`🎯 Identificando pontos de entrada com ${patterns.length} padrões e ${priceActionData?.signals?.length || 0} sinais...`);
  
  const entryPoints: any[] = [];
  const currentPrice = candles[candles.length - 1].close;
  const currentCandle = candles[candles.length - 1];
  
  // === ENTRADAS BASEADAS EM CONFLUÊNCIA DE PADRÕES ===
  const strongPatterns = patterns.filter(p => p.confidence > 0.7 && p.action !== 'neutro');
  
  strongPatterns.forEach(pattern => {
    // Verificar se está próximo a nível de suporte/resistência
    const nearKeyLevel = confluenceData?.supportResistance?.some((level: any) => {
      const distance = Math.abs(currentPrice - level.price) / currentPrice;
      return distance < 0.01; // Dentro de 1%
    });
    
    if (nearKeyLevel || pattern.confidence > 0.8) {
      const entryConfidence = nearKeyLevel ? 
        Math.min(0.95, pattern.confidence + 0.15) : // Bonus por confluência
        pattern.confidence;
      
      const riskReward = calculateRiskReward(currentPrice, pattern.action, confluenceData);
      
      // Só adicionar se R:R for favorável
      if (riskReward >= 1.5) {
        entryPoints.push({
          type: 'pattern_confluence',
          pattern: pattern.type,
          action: pattern.action,
          confidence: entryConfidence,
          entry: currentPrice,
          reasoning: `${pattern.description}${nearKeyLevel ? ' + confluência com nível-chave' : ''}`,
          riskReward,
          stop: calculateStopLoss(currentPrice, pattern.action, candles),
          target: calculateTarget(currentPrice, pattern.action, riskReward),
          timeframe: 'M1',
          priority: nearKeyLevel ? 'alta' : 'media'
        });
        
        console.log(`✅ ENTRADA por padrão: ${pattern.type} - ${pattern.action} (conf: ${entryConfidence.toFixed(2)}, R:R: ${riskReward.toFixed(1)})`);
      }
    }
  });
  
  // === ENTRADAS BASEADAS EM PRICE ACTION ===
  if (priceActionData?.signals) {
    priceActionData.signals.forEach((signal: any) => {
      if (signal.confidence > 0.7) {
        const riskReward = calculateRiskReward(signal.price, signal.action, confluenceData);
        
        // Verificar alinhamento com contexto de mercado
        const isAligned = (signal.action === 'compra' && marketContext.trend === 'alta') ||
                         (signal.action === 'venda' && marketContext.trend === 'baixa') ||
                         marketContext.trend === 'lateral';
        
        if (riskReward >= 1.5 && isAligned) {
          const finalConfidence = isAligned ? 
            Math.min(0.95, signal.confidence + 0.1) : 
            signal.confidence;
          
          entryPoints.push({
            type: 'price_action',
            signal: signal.type,
            action: signal.action,
            confidence: finalConfidence,
            entry: signal.price,
            reasoning: `${signal.description}${isAligned ? ' + alinhado com tendência' : ''}`,
            riskReward,
            stop: calculateStopLoss(signal.price, signal.action, candles),
            target: calculateTarget(signal.price, signal.action, riskReward),
            timeframe: 'M1',
            priority: signal.type.includes('rejection') ? 'alta' : 'media',
            rejectionLevel: signal.rejectionLevel,
            brokenLevel: signal.brokenLevel
          });
          
          console.log(`✅ ENTRADA por price action: ${signal.type} - ${signal.action} (conf: ${finalConfidence.toFixed(2)}, R:R: ${riskReward.toFixed(1)})`);
        }
      }
    });
  }
  
  // === ENTRADAS BASEADAS EM CONTEXTO INSTITUCIONAL ===
  if (marketContext.institutionalBias !== 'neutro' && marketContext.volatility !== 'baixa') {
    // Verificar se o último candle confirma o bias
    const lastCandleDirection = currentCandle.close > currentCandle.open ? 'compra' : 'venda';
    
    if (lastCandleDirection === marketContext.institutionalBias) {
      const riskReward = calculateRiskReward(currentPrice, marketContext.institutionalBias, confluenceData);
      
      if (riskReward >= 2.0) { // Exigir R:R maior para entries por bias
        entryPoints.push({
          type: 'institutional_bias',
          action: marketContext.institutionalBias,
          confidence: 0.75,
          entry: currentPrice,
          reasoning: `Alinhamento com bias institucional ${marketContext.institutionalBias} + confirmação do último candle`,
          riskReward,
          stop: calculateStopLoss(currentPrice, marketContext.institutionalBias, candles),
          target: calculateTarget(currentPrice, marketContext.institutionalBias, riskReward),
          timeframe: 'M1',
          priority: 'media',
          bias: marketContext.institutionalBias
        });
        
        console.log(`✅ ENTRADA por bias institucional: ${marketContext.institutionalBias} (R:R: ${riskReward.toFixed(1)})`);
      }
    }
  }
  
  // === ORDENAR POR PRIORIDADE E CONFIANÇA ===
  const sortedEntries = entryPoints
    .sort((a, b) => {
      // Primeiro por prioridade
      const priorityOrder = { alta: 3, media: 2, baixa: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Depois por confiança
      return b.confidence - a.confidence;
    })
    .slice(0, 3); // Máximo 3 entradas
  
  console.log(`🎯 ${sortedEntries.length} pontos de entrada identificados e rankeados`);
  
  return sortedEntries;
};

// === FUNÇÕES AUXILIARES ===

const calculateRiskReward = (entryPrice: number, action: string, confluenceData: any): number => {
  const supportResistance = confluenceData?.supportResistance || [];
  
  if (action === 'compra') {
    // Para compra: stop no suporte mais próximo abaixo, target na resistência mais próxima acima
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
    // Para venda: stop na resistência mais próxima acima, target no suporte mais próximo abaixo
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
  
  return 2.0; // Default R:R conservador
};

const calculateStopLoss = (entryPrice: number, action: string, candles: CandleData[]): number => {
  const recent5 = candles.slice(-5);
  
  if (action === 'compra') {
    // Stop abaixo do menor low dos últimos 5 candles
    const lowestLow = Math.min(...recent5.map(c => c.low));
    return lowestLow - (entryPrice * 0.001); // 0.1% de buffer
  } else {
    // Stop acima do maior high dos últimos 5 candles
    const highestHigh = Math.max(...recent5.map(c => c.high));
    return highestHigh + (entryPrice * 0.001); // 0.1% de buffer
  }
};

const calculateTarget = (entryPrice: number, action: string, riskReward: number): number => {
  const stopPrice = calculateStopLoss(entryPrice, action, []);
  const risk = Math.abs(entryPrice - stopPrice);
  
  if (action === 'compra') {
    return entryPrice + (risk * riskReward);
  } else {
    return entryPrice - (risk * riskReward);
  }
};
