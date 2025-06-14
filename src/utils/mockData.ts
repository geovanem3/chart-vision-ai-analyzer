
import { CandleData } from "../context/AnalyzerContext";

// ATENÇÃO: Esta função é apenas para fallback quando não há dados reais
// TODO: Remover completamente quando extração real de candles estiver implementada
export const mockCandles = async (numCandles: number, timeframe: string): Promise<CandleData[]> => {
  console.log('⚠️ AVISO: Usando dados simulados - DEVE SER SUBSTITUÍDO por extração real');
  console.log('⚠️ Esta função só deve ser usada como fallback temporário');
  
  const candles: CandleData[] = [];
  let basePrice = 1.2500;
  
  for (let i = 0; i < numCandles; i++) {
    const variation = (Math.random() - 0.5) * 0.01;
    const open = basePrice + variation;
    const close = open + (Math.random() - 0.5) * 0.005;
    const high = Math.max(open, close) + Math.random() * 0.002;
    const low = Math.min(open, close) - Math.random() * 0.002;
    
    candles.push({
      open,
      high,
      low,
      close,
      timestamp: Date.now() - (numCandles - i) * 60000
    });
    
    basePrice = close;
  }
  
  console.log('⚠️ DADOS SIMULADOS GERADOS - Implementar extração real urgentemente');
  return candles;
};
