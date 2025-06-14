
import { CandleData } from "../context/AnalyzerContext";

interface ChartPattern {
  pattern: string;
  confidence: number;
  description: string;
  recommendation: string;
  action: 'compra' | 'venda' | 'neutro';
}

export const detectChartPatterns = async (candles: CandleData[], patternType: string, options: any): Promise<ChartPattern[]> => {
  if (candles.length < 10) return [];
  
  const patterns: ChartPattern[] = [];
  
  // Analisar apenas se há dados suficientes para o padrão específico
  switch (patternType.toLowerCase()) {
    case 'triangulo':
      const trianglePattern = detectTrianglePattern(candles);
      if (trianglePattern) patterns.push(trianglePattern);
      break;
      
    case 'suporte_resistencia':
      const srPattern = detectSupportResistancePattern(candles);
      if (srPattern) patterns.push(srPattern);
      break;
      
    case 'canal':
      const channelPattern = detectChannelPattern(candles);
      if (channelPattern) patterns.push(channelPattern);
      break;
      
    case 'rompimento':
      const breakoutPattern = detectBreakoutPattern(candles);
      if (breakoutPattern) patterns.push(breakoutPattern);
      break;
      
    default:
      // Se não é um padrão específico conhecido, não retorna nada
      break;
  }
  
  return patterns.filter(p => p.confidence > 0.6);
};

// Detectar padrão triangular
const detectTrianglePattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 20) return null;
  
  const recent20 = candles.slice(-20);
  const highs = recent20.map(c => c.high);
  const lows = recent20.map(c => c.low);
  
  // Verificar se os máximos estão diminuindo e mínimos aumentando (triângulo simétrico)
  const maxHigh = Math.max(...highs.slice(0, 10));
  const recentMaxHigh = Math.max(...highs.slice(-10));
  const minLow = Math.min(...lows.slice(0, 10));
  const recentMinLow = Math.min(...lows.slice(-10));
  
  const highsDescending = recentMaxHigh < maxHigh * 0.998;
  const lowsAscending = recentMinLow > minLow * 1.002;
  
  if (highsDescending && lowsAscending) {
    const range = (maxHigh - minLow) / maxHigh * 100;
    const recentRange = (recentMaxHigh - recentMinLow) / recentMaxHigh * 100;
    
    if (recentRange < range * 0.7) { // Range diminuindo
      const confidence = Math.min(0.85, 0.6 + (range - recentRange) / range * 0.3);
      
      return {
        pattern: 'Triângulo Simétrico',
        confidence,
        description: 'Padrão triangular detectado - Convergência de preços',
        recommendation: 'Aguardar rompimento para definir direção',
        action: 'neutro'
      };
    }
  }
  
  return null;
};

// Detectar níveis de suporte/resistência
const detectSupportResistancePattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 15) return null;
  
  const recent15 = candles.slice(-15);
  const currentPrice = recent15[recent15.length - 1].close;
  
  // Procurar por níveis testados múltiplas vezes
  const prices = recent15.map(c => c.close);
  const levels = findSignificantLevels(prices, currentPrice);
  
  if (levels.support && levels.resistance) {
    const distanceToSupport = Math.abs(currentPrice - levels.support.price) / currentPrice;
    const distanceToResistance = Math.abs(currentPrice - levels.resistance.price) / currentPrice;
    
    let action: 'compra' | 'venda' | 'neutro' = 'neutro';
    let confidence = 0.6;
    
    // Se próximo ao suporte, sinal de compra
    if (distanceToSupport < 0.002 && levels.support.touches >= 2) {
      action = 'compra';
      confidence = Math.min(0.85, 0.6 + levels.support.touches * 0.1);
    }
    // Se próximo à resistência, sinal de venda
    else if (distanceToResistance < 0.002 && levels.resistance.touches >= 2) {
      action = 'venda';
      confidence = Math.min(0.85, 0.6 + levels.resistance.touches * 0.1);
    }
    
    if (action !== 'neutro') {
      return {
        pattern: 'Suporte/Resistência',
        confidence,
        description: `Nível de ${action === 'compra' ? 'suporte' : 'resistência'} identificado`,
        recommendation: `${action === 'compra' ? 'Considerar compra' : 'Considerar venda'} próximo ao nível`,
        action
      };
    }
  }
  
  return null;
};

// Detectar padrão de canal
const detectChannelPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 20) return null;
  
  const recent20 = candles.slice(-20);
  const highs = recent20.map(c => c.high);
  const lows = recent20.map(c => c.low);
  
  // Verificar se existe um canal (máximos e mínimos paralelos)
  const avgHigh = highs.reduce((a, b) => a + b) / highs.length;
  const avgLow = lows.reduce((a, b) => a + b) / lows.length;
  const channelHeight = avgHigh - avgLow;
  
  // Verificar consistência do canal
  const highVariance = highs.reduce((sum, h) => sum + Math.pow(h - avgHigh, 2), 0) / highs.length;
  const lowVariance = lows.reduce((sum, l) => sum + Math.pow(l - avgLow, 2), 0) / lows.length;
  
  const highStdDev = Math.sqrt(highVariance);
  const lowStdDev = Math.sqrt(lowVariance);
  
  // Canal válido se a variação é pequena
  if (highStdDev < channelHeight * 0.1 && lowStdDev < channelHeight * 0.1) {
    const currentPrice = recent20[recent20.length - 1].close;
    const channelPosition = (currentPrice - avgLow) / channelHeight;
    
    let action: 'compra' | 'venda' | 'neutro' = 'neutro';
    let confidence = 0.65;
    
    // Se próximo ao fundo do canal, compra
    if (channelPosition < 0.3) {
      action = 'compra';
      confidence += (0.3 - channelPosition) * 0.5;
    }
    // Se próximo ao topo do canal, venda
    else if (channelPosition > 0.7) {
      action = 'venda';
      confidence += (channelPosition - 0.7) * 0.5;
    }
    
    if (action !== 'neutro') {
      return {
        pattern: 'Canal',
        confidence: Math.min(0.9, confidence),
        description: 'Padrão de canal identificado',
        recommendation: `${action === 'compra' ? 'Comprar' : 'Vender'} próximo ${action === 'compra' ? 'ao suporte' : 'à resistência'} do canal`,
        action
      };
    }
  }
  
  return null;
};

// Detectar rompimento
const detectBreakoutPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 10) return null;
  
  const recent10 = candles.slice(-10);
  const lastCandle = recent10[recent10.length - 1];
  const prevCandles = recent10.slice(0, -1);
  
  const recentHigh = Math.max(...prevCandles.map(c => c.high));
  const recentLow = Math.min(...prevCandles.map(c => c.low));
  
  let action: 'compra' | 'venda' | 'neutro' = 'neutro';
  let confidence = 0;
  
  // Rompimento de alta
  if (lastCandle.close > recentHigh && lastCandle.high > recentHigh) {
    const breakoutStrength = (lastCandle.close - recentHigh) / recentHigh;
    if (breakoutStrength > 0.001) { // Rompimento de pelo menos 0.1%
      action = 'compra';
      confidence = Math.min(0.85, 0.6 + breakoutStrength * 100);
    }
  }
  // Rompimento de baixa
  else if (lastCandle.close < recentLow && lastCandle.low < recentLow) {
    const breakoutStrength = (recentLow - lastCandle.close) / recentLow;
    if (breakoutStrength > 0.001) {
      action = 'venda';
      confidence = Math.min(0.85, 0.6 + breakoutStrength * 100);
    }
  }
  
  if (action !== 'neutro' && confidence > 0.6) {
    return {
      pattern: 'Rompimento',
      confidence,
      description: `Rompimento ${action === 'compra' ? 'de alta' : 'de baixa'} detectado`,
      recommendation: `Considerar ${action}`,
      action
    };
  }
  
  return null;
};

// Função auxiliar para encontrar níveis significativos
const findSignificantLevels = (prices: number[], currentPrice: number) => {
  const tolerance = currentPrice * 0.002; // 0.2% de tolerância
  const levels: { [key: string]: { price: number, touches: number } } = {};
  
  // Agrupar preços próximos
  prices.forEach(price => {
    const levelKey = Math.round(price / tolerance) * tolerance;
    if (!levels[levelKey]) {
      levels[levelKey] = { price: levelKey, touches: 0 };
    }
    levels[levelKey].touches++;
  });
  
  // Encontrar níveis mais significativos
  const significantLevels = Object.values(levels)
    .filter(level => level.touches >= 2)
    .sort((a, b) => b.touches - a.touches);
  
  const support = significantLevels.find(level => level.price < currentPrice);
  const resistance = significantLevels.find(level => level.price > currentPrice);
  
  return { support, resistance };
};
