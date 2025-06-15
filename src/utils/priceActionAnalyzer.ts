
import { CandleData } from '../context/AnalyzerContext';

export const detectPriceActionSignals = (candles: CandleData[], marketContext: any) => {
  if (candles.length < 10) {
    return { signals: [] };
  }
  
  const signals: any[] = [];
  const recent10 = candles.slice(-10);
  
  // Detectar rejection em níveis-chave usando dados reais
  for (let i = 1; i < recent10.length; i++) {
    const current = recent10[i];
    const prev = recent10[i - 1];
    
    // Rejection em alta (shooting star, pin bar)
    const upperShadow = current.high - Math.max(current.open, current.close);
    const body = Math.abs(current.close - current.open);
    
    if (upperShadow > body * 2 && current.close < current.open) {
      signals.push({
        type: 'rejection_alta',
        action: 'venda',
        confidence: 0.7,
        price: current.high,
        description: 'Rejection em topo'
      });
    }
    
    // Rejection em baixa (hammer, pin bar)
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    
    if (lowerShadow > body * 2 && current.close > current.open) {
      signals.push({
        type: 'rejection_baixa',
        action: 'compra',
        confidence: 0.7,
        price: current.low,
        description: 'Rejection em fundo'
      });
    }
    
    // Break of structure
    if (current.close > prev.high && marketContext.trend === 'alta') {
      signals.push({
        type: 'bos_alta',
        action: 'compra',
        confidence: 0.8,
        price: current.close,
        description: 'Break of Structure para cima'
      });
    }
    
    if (current.close < prev.low && marketContext.trend === 'baixa') {
      signals.push({
        type: 'bos_baixa',
        action: 'venda',
        confidence: 0.8,
        price: current.close,
        description: 'Break of Structure para baixo'
      });
    }
  }
  
  return { signals };
};
