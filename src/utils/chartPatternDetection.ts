
import { CandleData } from "../context/AnalyzerContext";

interface ChartPattern {
  pattern: string;
  confidence: number;
  description: string;
  recommendation: string;
  action: 'compra' | 'venda' | 'neutro';
}

export const detectChartPatterns = async (candles: CandleData[], patternType: string, options: any): Promise<ChartPattern[]> => {
  console.log('🔍 Detectando padrões em', candles.length, 'candles reais');
  
  if (candles.length < 5) {
    console.warn('⚠️ Poucos candles para análise de padrões');
    return [];
  }
  
  const patterns: ChartPattern[] = [];
  
  // Análise dos últimos candles para detectar padrões reais
  const recent = candles.slice(-10);
  console.log('📊 Analisando', recent.length, 'candles recentes');
  
  // Extrair dados reais dos candles
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);
  const opens = recent.map(c => c.open);
  const closes = recent.map(c => c.close);
  
  console.log('📈 Dados extraídos - Highs:', highs, 'Lows:', lows);
  
  // 1. DETECTAR DOJI REAL
  const dojiPattern = detectDojiPattern(recent);
  if (dojiPattern) {
    patterns.push(dojiPattern);
    console.log('✅ Doji detectado:', dojiPattern);
  }
  
  // 2. DETECTAR HAMMER/SHOOTING STAR REAL  
  const hammerPattern = detectHammerPattern(recent);
  if (hammerPattern) {
    patterns.push(hammerPattern);
    console.log('✅ Hammer/Shooting Star detectado:', hammerPattern);
  }
  
  // 3. DETECTAR ENGOLFO REAL
  const engolfingPattern = detectEngolfingPattern(recent);
  if (engolfingPattern) {
    patterns.push(engolfingPattern);
    console.log('✅ Engolfo detectado:', engolfingPattern);
  }
  
  // 4. DETECTAR TENDÊNCIA REAL
  const trendPattern = detectTrendPattern(recent);
  if (trendPattern) {
    patterns.push(trendPattern);
    console.log('✅ Tendência detectada:', trendPattern);
  }
  
  console.log(`🎯 Total de ${patterns.length} padrões detectados nos dados reais`);
  return patterns;
};

// Detectar padrão Doji baseado em dados reais
const detectDojiPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 1) return null;
  
  const lastCandle = candles[candles.length - 1];
  const bodySize = Math.abs(lastCandle.close - lastCandle.open);
  const totalRange = lastCandle.high - lastCandle.low;
  
  // Doji real: corpo pequeno em relação ao range total
  if (totalRange > 0 && (bodySize / totalRange) < 0.1) {
    const confidence = 1 - (bodySize / totalRange); // Mais confiança com corpo menor
    
    return {
      pattern: 'Doji',
      confidence: Math.min(0.9, confidence),
      description: `Doji detectado - indecisão do mercado com corpo de ${((bodySize/totalRange)*100).toFixed(1)}% do range`,
      recommendation: 'Aguardar confirmação da direção',
      action: 'neutro'
    };
  }
  
  return null;
};

// Detectar Hammer/Shooting Star baseado em dados reais
const detectHammerPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 2) return null;
  
  const lastCandle = candles[candles.length - 1];
  const bodySize = Math.abs(lastCandle.close - lastCandle.open);
  const totalRange = lastCandle.high - lastCandle.low;
  const lowerShadow = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
  const upperShadow = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
  
  if (totalRange === 0) return null;
  
  // Hammer: sombra inferior longa, corpo pequeno, sombra superior pequena
  if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
    const confidence = Math.min(0.85, lowerShadow / totalRange);
    
    return {
      pattern: 'Hammer',
      confidence,
      description: `Hammer detectado - sombra inferior ${((lowerShadow/totalRange)*100).toFixed(1)}% do range`,
      recommendation: 'Possível reversão de alta',
      action: 'compra'
    };
  }
  
  // Shooting Star: sombra superior longa, corpo pequeno, sombra inferior pequena
  if (upperShadow > bodySize * 2 && lowerShadow < bodySize * 0.5) {
    const confidence = Math.min(0.85, upperShadow / totalRange);
    
    return {
      pattern: 'Shooting Star',
      confidence,
      description: `Shooting Star detectado - sombra superior ${((upperShadow/totalRange)*100).toFixed(1)}% do range`,
      recommendation: 'Possível reversão de baixa',
      action: 'venda'
    };
  }
  
  return null;
};

// Detectar padrão de Engolfo baseado em dados reais
const detectEngolfingPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 2) return null;
  
  const current = candles[candles.length - 1];
  const previous = candles[candles.length - 2];
  
  const currentBody = Math.abs(current.close - current.open);
  const previousBody = Math.abs(previous.close - previous.open);
  
  // Engolfo de Alta: candle anterior vermelho, atual verde e maior
  if (previous.close < previous.open && current.close > current.open) {
    if (current.open < previous.close && current.close > previous.open) {
      const confidence = Math.min(0.9, (currentBody / previousBody) * 0.7);
      
      return {
        pattern: 'Engolfo de Alta',
        confidence,
        description: `Engolfo de alta - candle atual ${((currentBody/previousBody)*100).toFixed(0)}% maior que anterior`,
        recommendation: 'Sinal de compra forte',
        action: 'compra'
      };
    }
  }
  
  // Engolfo de Baixa: candle anterior verde, atual vermelho e maior
  if (previous.close > previous.open && current.close < current.open) {
    if (current.open > previous.close && current.close < previous.open) {
      const confidence = Math.min(0.9, (currentBody / previousBody) * 0.7);
      
      return {
        pattern: 'Engolfo de Baixa',
        confidence,
        description: `Engolfo de baixa - candle atual ${((currentBody/previousBody)*100).toFixed(0)}% maior que anterior`,
        recommendation: 'Sinal de venda forte',
        action: 'venda'
      };
    }
  }
  
  return null;
};

// Detectar padrão de tendência baseado em dados reais
const detectTrendPattern = (candles: CandleData[]): ChartPattern | null => {
  if (candles.length < 5) return null;
  
  const closes = candles.map(c => c.close);
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const priceChange = ((lastClose - firstClose) / firstClose) * 100;
  
  // Análise de consistência da tendência
  let upMoves = 0;
  let downMoves = 0;
  
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i-1]) upMoves++;
    if (closes[i] < closes[i-1]) downMoves++;
  }
  
  const totalMoves = upMoves + downMoves;
  if (totalMoves === 0) return null;
  
  // Tendência de Alta consistente
  if (priceChange > 0.5 && upMoves > downMoves) {
    const confidence = Math.min(0.9, (upMoves / totalMoves) * (Math.abs(priceChange) / 5));
    
    return {
      pattern: 'Tendência de Alta',
      confidence,
      description: `Tendência de alta com ${priceChange.toFixed(2)}% de valorização e ${upMoves}/${totalMoves} movimentos positivos`,
      recommendation: 'Manter posições compradas',
      action: 'compra'
    };
  }
  
  // Tendência de Baixa consistente
  if (priceChange < -0.5 && downMoves > upMoves) {
    const confidence = Math.min(0.9, (downMoves / totalMoves) * (Math.abs(priceChange) / 5));
    
    return {
      pattern: 'Tendência de Baixa',
      confidence,
      description: `Tendência de baixa com ${priceChange.toFixed(2)}% de desvalorização e ${downMoves}/${totalMoves} movimentos negativos`,
      recommendation: 'Considerar posições vendidas',
      action: 'venda'
    };
  }
  
  return null;
};
