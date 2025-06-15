
import { CandleData } from '../context/AnalyzerContext';

export const assessMarketContext = (candles: CandleData[], confluenceData: any) => {
  if (candles.length < 20) {
    return {
      trend: 'lateral',
      phase: 'indefinida',
      institutionalBias: 'neutro',
      volatility: 'media'
    };
  }
  
  const recent20 = candles.slice(-20);
  const currentPrice = recent20[recent20.length - 1].close;
  const startPrice = recent20[0].close;
  
  // Análise de tendência baseada em dados reais
  const priceChange = (currentPrice - startPrice) / startPrice;
  let trend = 'lateral';
  
  if (priceChange > 0.015) trend = 'alta';
  else if (priceChange < -0.015) trend = 'baixa';
  
  // Análise de fase do mercado
  let phase = 'consolidacao';
  const highs = recent20.map(c => c.high);
  const lows = recent20.map(c => c.low);
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const range = maxHigh - minLow;
  
  if (currentPrice > maxHigh * 0.98) phase = 'resistencia';
  else if (currentPrice < minLow * 1.02) phase = 'suporte';
  else if (range / currentPrice > 0.03) phase = 'volatil';
  
  // Bias institucional baseado em price action real
  let institutionalBias = 'neutro';
  const volume = recent20.map(c => c.high - c.low).reduce((sum, vol) => sum + vol, 0);
  const avgVolume = volume / recent20.length;
  const lastVolume = recent20[recent20.length - 1].high - recent20[recent20.length - 1].low;
  
  if (lastVolume > avgVolume * 1.5 && trend === 'alta') {
    institutionalBias = 'compra';
  } else if (lastVolume > avgVolume * 1.5 && trend === 'baixa') {
    institutionalBias = 'venda';
  }
  
  return {
    trend,
    phase,
    institutionalBias,
    volatility: range / currentPrice > 0.02 ? 'alta' : 'media'
  };
};
