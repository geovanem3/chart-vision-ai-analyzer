
import { CandleData } from '../context/AnalyzerContext';

export const detectPriceActionSignals = (candles: CandleData[], marketContext: any) => {
  if (candles.length < 5) {
    console.log('⚠️ Poucos candles para análise de price action');
    return { signals: [] };
  }
  
  console.log(`🎯 Analisando price action com ${candles.length} candles...`);
  
  const signals: any[] = [];
  const recent10 = candles.slice(-Math.min(10, candles.length));
  
  // === DETECTAR REJECTION EM NÍVEIS-CHAVE ===
  for (let i = 1; i < recent10.length; i++) {
    const current = recent10[i];
    const prev = recent10[i - 1];
    
    if (!isValidCandle(current) || !isValidCandle(prev)) continue;
    
    // Calcular componentes do candle
    const body = Math.abs(current.close - current.open);
    const upperWick = current.high - Math.max(current.open, current.close);
    const lowerWick = Math.min(current.open, current.close) - current.low;
    const totalRange = current.high - current.low;
    
    // === REJECTION EM ALTA (Pin bar bearish) ===
    if (upperWick > body * 2.5 && upperWick > totalRange * 0.6) {
      const rejectionStrength = upperWick / body;
      signals.push({
        type: 'rejection_alta',
        action: 'venda',
        confidence: Math.min(0.9, 0.6 + (rejectionStrength * 0.05)),
        price: current.high,
        description: `Rejection em topo: pavio ${rejectionStrength.toFixed(1)}x maior que corpo`,
        candle: i,
        rejectionLevel: current.high
      });
      console.log(`🔴 REJECTION EM ALTA detectada: ${current.high.toFixed(5)} (força: ${rejectionStrength.toFixed(1)})`);
    }
    
    // === REJECTION EM BAIXA (Pin bar bullish) ===
    if (lowerWick > body * 2.5 && lowerWick > totalRange * 0.6) {
      const rejectionStrength = lowerWick / body;
      signals.push({
        type: 'rejection_baixa',
        action: 'compra',
        confidence: Math.min(0.9, 0.6 + (rejectionStrength * 0.05)),
        price: current.low,
        description: `Rejection em fundo: pavio ${rejectionStrength.toFixed(1)}x maior que corpo`,
        candle: i,
        rejectionLevel: current.low
      });
      console.log(`🟢 REJECTION EM BAIXA detectada: ${current.low.toFixed(5)} (força: ${rejectionStrength.toFixed(1)})`);
    }
    
    // === BREAK OF STRUCTURE (BOS) ===
    const priceMovement = (current.close - prev.close) / prev.close;
    
    // BOS para cima
    if (current.close > prev.high && priceMovement > 0.008) { // > 0.8%
      signals.push({
        type: 'bos_alta',
        action: 'compra',
        confidence: Math.min(0.85, 0.7 + (priceMovement * 10)),
        price: current.close,
        description: `BOS para cima: rompeu ${prev.high.toFixed(5)} (movimento: +${(priceMovement * 100).toFixed(2)}%)`,
        candle: i,
        brokenLevel: prev.high
      });
      console.log(`⬆️ BREAK OF STRUCTURE ALTA: ${prev.high.toFixed(5)} -> ${current.close.toFixed(5)}`);
    }
    
    // BOS para baixo
    if (current.close < prev.low && priceMovement < -0.008) { // < -0.8%
      signals.push({
        type: 'bos_baixa',
        action: 'venda',
        confidence: Math.min(0.85, 0.7 + (Math.abs(priceMovement) * 10)),
        price: current.close,
        description: `BOS para baixo: rompeu ${prev.low.toFixed(5)} (movimento: ${(priceMovement * 100).toFixed(2)}%)`,
        candle: i,
        brokenLevel: prev.low
      });
      console.log(`⬇️ BREAK OF STRUCTURE BAIXA: ${prev.low.toFixed(5)} -> ${current.close.toFixed(5)}`);
    }
    
    // === MOMENTUM SHIFTS ===
    if (i >= 2) {
      const prev2 = recent10[i - 2];
      if (!isValidCandle(prev2)) continue;
      
      // Detectar mudança de momentum baseada em sequência de candles
      const trend1 = prev.close > prev2.close;
      const trend2 = current.close > prev.close;
      
      // Momentum shift de baixa para alta
      if (!trend1 && trend2 && (current.close - prev.close) > (prev.close - prev2.close) * 1.5) {
        signals.push({
          type: 'momentum_shift_alta',
          action: 'compra',
          confidence: 0.65,
          price: current.close,
          description: `Shift de momentum para alta: aceleração detectada`,
          candle: i
        });
        console.log(`🚀 MOMENTUM SHIFT PARA ALTA detectado em ${current.close.toFixed(5)}`);
      }
      
      // Momentum shift de alta para baixa
      if (trend1 && !trend2 && (prev.close - current.close) > (prev2.close - prev.close) * 1.5) {
        signals.push({
          type: 'momentum_shift_baixa',
          action: 'venda',
          confidence: 0.65,
          price: current.close,
          description: `Shift de momentum para baixa: desaceleração detectada`,
          candle: i
        });
        console.log(`📉 MOMENTUM SHIFT PARA BAIXA detectado em ${current.close.toFixed(5)}`);
      }
    }
  }
  
  // === FILTRAR SINAIS POR CONTEXTO DE MERCADO ===
  const filteredSignals = signals.filter(signal => {
    // Se mercado está em tendência de alta, priorizar sinais de compra
    if (marketContext.trend === 'alta' && signal.action === 'compra') {
      signal.confidence *= 1.2; // Bonus por estar alinhado com a tendência
      return true;
    }
    
    // Se mercado está em tendência de baixa, priorizar sinais de venda
    if (marketContext.trend === 'baixa' && signal.action === 'venda') {
      signal.confidence *= 1.2; // Bonus por estar alinhado com a tendência
      return true;
    }
    
    // Em mercado lateral, aceitar todos os sinais com confiança > 0.7
    if (marketContext.trend === 'lateral' && signal.confidence > 0.7) {
      return true;
    }
    
    // Rejeitar sinais contra-tendência com baixa confiança
    if (signal.confidence < 0.6) {
      return false;
    }
    
    return true;
  });
  
  console.log(`✅ ${filteredSignals.length} sinais de price action detectados e filtrados por contexto`);
  
  return { signals: filteredSignals };
};

// === FUNÇÃO AUXILIAR ===
const isValidCandle = (candle: CandleData): boolean => {
  return candle && 
         typeof candle.high === 'number' && 
         typeof candle.low === 'number' && 
         typeof candle.open === 'number' && 
         typeof candle.close === 'number' &&
         candle.high >= Math.max(candle.open, candle.close) &&
         candle.low <= Math.min(candle.open, candle.close) &&
         candle.high > candle.low;
};
