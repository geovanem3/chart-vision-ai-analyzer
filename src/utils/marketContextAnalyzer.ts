
import { CandleData } from '../context/AnalyzerContext';

export const assessMarketContext = (candles: CandleData[], confluenceData: any) => {
  if (candles.length < 10) {
    console.log('⚠️ Poucos candles para análise de contexto');
    return {
      trend: 'lateral',
      phase: 'indefinida',
      institutionalBias: 'neutro',
      volatility: 'media'
    };
  }
  
  console.log(`📊 Analisando contexto de mercado com ${candles.length} candles...`);
  
  const recent20 = candles.slice(-Math.min(20, candles.length));
  const currentPrice = recent20[recent20.length - 1].close;
  const startPrice = recent20[0].close;
  
  // === ANÁLISE DE TENDÊNCIA BASEADA EM DADOS REAIS ===
  const priceChange = (currentPrice - startPrice) / startPrice;
  let trend = 'lateral';
  
  if (priceChange > 0.01) { // Movimento > 1%
    trend = 'alta';
    console.log(`📈 Tendência de ALTA detectada: +${(priceChange * 100).toFixed(2)}%`);
  } else if (priceChange < -0.01) { // Movimento < -1%
    trend = 'baixa';
    console.log(`📉 Tendência de BAIXA detectada: ${(priceChange * 100).toFixed(2)}%`);
  } else {
    console.log(`↔️ Mercado LATERAL: mudança de apenas ${(priceChange * 100).toFixed(2)}%`);
  }
  
  // === ANÁLISE DE FASE DO MERCADO ===
  const highs = recent20.map(c => c.high);
  const lows = recent20.map(c => c.low);
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const range = maxHigh - minLow;
  const rangePercent = range / currentPrice;
  
  let phase = 'consolidacao';
  
  // Detectar se está próximo de extremos
  const distanceFromHigh = (maxHigh - currentPrice) / maxHigh;
  const distanceFromLow = (currentPrice - minLow) / currentPrice;
  
  if (distanceFromHigh < 0.005) { // Menos de 0.5% do topo
    phase = 'resistencia';
    console.log(`🚫 Próximo da RESISTÊNCIA: ${maxHigh.toFixed(5)} (distância: ${(distanceFromHigh * 100).toFixed(2)}%)`);
  } else if (distanceFromLow < 0.005) { // Menos de 0.5% do fundo
    phase = 'suporte';
    console.log(`🛡️ Próximo do SUPORTE: ${minLow.toFixed(5)} (distância: ${(distanceFromLow * 100).toFixed(2)}%)`);
  } else if (rangePercent > 0.02) { // Range > 2%
    phase = 'volatil';
    console.log(`⚡ Mercado VOLÁTIL: range de ${(rangePercent * 100).toFixed(2)}%`);
  } else {
    console.log(`📊 Mercado em CONSOLIDAÇÃO: range de ${(rangePercent * 100).toFixed(2)}%`);
  }
  
  // === BIAS INSTITUCIONAL BASEADO EM PRICE ACTION REAL ===
  let institutionalBias = 'neutro';
  
  // Analisar sequência de candles para detectar acumulação/distribuição
  const last5Candles = recent20.slice(-5);
  const greenCandles = last5Candles.filter(c => c.close > c.open).length;
  const redCandles = last5Candles.filter(c => c.close < c.open).length;
  
  // Calcular "volume" baseado no range dos candles
  const volumes = last5Candles.map(c => c.high - c.low);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const lastVolume = volumes[volumes.length - 1];
  
  if (greenCandles >= 4 && lastVolume > avgVolume * 1.2) {
    institutionalBias = 'compra';
    console.log(`🟢 BIAS INSTITUCIONAL: COMPRA (${greenCandles}/5 candles verdes + volume elevado)`);
  } else if (redCandles >= 4 && lastVolume > avgVolume * 1.2) {
    institutionalBias = 'venda';
    console.log(`🔴 BIAS INSTITUCIONAL: VENDA (${redCandles}/5 candles vermelhos + volume elevado)`);
  } else {
    console.log(`⚪ BIAS INSTITUCIONAL: NEUTRO (${greenCandles}/${redCandles} candles, volume normal)`);
  }
  
  // === ANÁLISE DE VOLATILIDADE ===
  const volatilityLevel = rangePercent > 0.025 ? 'alta' : rangePercent > 0.015 ? 'media' : 'baixa';
  console.log(`📈 VOLATILIDADE: ${volatilityLevel.toUpperCase()} (${(rangePercent * 100).toFixed(2)}%)`);
  
  const contextResult = {
    trend,
    phase,
    institutionalBias,
    volatility: volatilityLevel
  };
  
  console.log(`✅ Contexto de mercado analisado:`, contextResult);
  
  return contextResult;
};
