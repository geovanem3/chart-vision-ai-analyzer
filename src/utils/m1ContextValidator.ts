
import { CandleData } from "../context/AnalyzerContext";

export interface M1ContextValidation {
  isValidForEntry: boolean;
  rejectionReasons: string[];
  contextScore: number;
  trendDirection: 'alta' | 'baixa' | 'lateral';
  pullbackDetected: boolean;
  strongCandleConfirmation: boolean;
  supportResistanceLevel: boolean;
  volumeConfirmation: boolean;
  spaceToRun: boolean;
  indecisionCandles: boolean;
  recommendation: 'enter' | 'wait' | 'skip';
}

// Sistema de validação M1 - trabalha junto com o tracking existente
export const validateM1Context = (
  candles: CandleData[],
  signal: 'compra' | 'venda' | 'neutro',
  priceActionSignals?: any[],
  volumeData?: any,
  confluences?: any
): M1ContextValidation => {
  
  if (candles.length < 10) { // Reduzido de 20 para 10
    return {
      isValidForEntry: false,
      rejectionReasons: ['Dados de candles insuficientes'],
      contextScore: 0,
      trendDirection: 'lateral',
      pullbackDetected: false,
      strongCandleConfirmation: false,
      supportResistanceLevel: false,
      volumeConfirmation: false,
      spaceToRun: false,
      indecisionCandles: true,
      recommendation: 'skip'
    };
  }

  // Se o sinal for neutro, não precisamos validar uma entrada.
  // Podemos retornar um estado padrão de "espera".
  if (signal === 'neutro') {
    return {
      isValidForEntry: false,
      rejectionReasons: ['Sinal de entrada não detectado.'],
      contextScore: 30, // Pontuação base
      trendDirection: detectTrend(candles.slice(-10)),
      pullbackDetected: false,
      strongCandleConfirmation: false,
      supportResistanceLevel: false,
      volumeConfirmation: false,
      spaceToRun: true,
      indecisionCandles: checkIndecisionCandles(candles.slice(-3)),
      recommendation: 'wait',
    };
  }

  const rejectionReasons: string[] = [];
  let contextScore = 50; // Começar com uma base mais alta
  
  // 1. Detectar tendência (últimos 10 candles)
  const trendDirection = detectTrend(candles.slice(-10));
  
  // MUDANÇA: Não veta mais em lateralização, apenas penaliza
  if (trendDirection === 'lateral') {
    rejectionReasons.push('Preço em possível lateralização');
    contextScore -= 25; 
  } else {
    contextScore += 10;
  }
  
  // 2. Detectar pullback válido
  const pullbackDetected = detectPullback(candles.slice(-5), trendDirection);
  if (pullbackDetected) {
    contextScore += 15;
  }
  
  // 3. Verificar candle de confirmação forte
  const strongCandleConfirmation = checkStrongCandleConfirmation(candles.slice(-3), signal);
  if (strongCandleConfirmation) {
    contextScore += 20;
  } else {
    rejectionReasons.push('Candle de confirmação um pouco fraco');
    contextScore -= 10; // Penalidade mais branda
  }
  
  // 4. Verificar candles de indecisão (pavios dos dois lados)
  const indecisionCandles = checkIndecisionCandles(candles.slice(-3));
  if (indecisionCandles) {
    rejectionReasons.push('Alguns candles de indecisão detectados');
    contextScore -= 15; // Penalidade mais branda
  }
  
  // 5. Verificar nível de suporte/resistência
  const supportResistanceLevel = checkSupportResistanceLevel(candles, signal, confluences);
  if (supportResistanceLevel) {
    contextScore += 15;
  }
  
  // 6. Confirmar volume
  const volumeConfirmation = checkVolumeConfirmation(volumeData, signal);
  if (volumeConfirmation) {
    contextScore += 10;
  }
  
  // 7. Verificar espaço para correr
  const spaceToRun = checkSpaceToRun(candles, signal, confluences);
  if (!spaceToRun) {
    rejectionReasons.push('Pouco espaço para o preço correr');
    contextScore -= 20;
  }
  
  // 8. Verificar se trend e signal estão alinhados
  const trendSignalAlignment = checkTrendSignalAlignment(trendDirection, signal);
  if (!trendSignalAlignment) {
    rejectionReasons.push('Sinal contra a tendência M1');
    contextScore -= 30; // Penalidade forte mantida
  } else {
    contextScore += 10;
  }
  
  // Determinar recomendação final com thresholds mais baixos
  let recommendation: 'enter' | 'wait' | 'skip' = 'skip';
  
  if (contextScore >= 65) { // Reduzido de 70
    recommendation = 'enter';
  } else if (contextScore >= 45) { // Reduzido de 50
    recommendation = 'wait';
  }
  
  // A validação final só é positiva se a recomendação for 'enter'
  const isValidForEntry = recommendation === 'enter';
  
  if (!isValidForEntry && rejectionReasons.length === 0) {
      rejectionReasons.push('Score de contexto M1 insuficiente');
  }
  
  return {
    isValidForEntry,
    rejectionReasons,
    contextScore: Math.max(0, Math.min(100, contextScore)),
    trendDirection,
    pullbackDetected,
    strongCandleConfirmation,
    supportResistanceLevel,
    volumeConfirmation,
    spaceToRun,
    indecisionCandles,
    recommendation
  };
};

// Detectar tendência nos últimos candles
const detectTrend = (candles: CandleData[]): 'alta' | 'baixa' | 'lateral' => {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const priceChange = ((lastClose - firstClose) / firstClose) * 100;
  
  // Verificar se há movimento lateral (variação pequena)
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const range = ((maxHigh - minLow) / lastClose) * 100;
  
  // Se range muito pequeno, é lateral
  if (range < 0.1 || Math.abs(priceChange) < 0.05) {
    return 'lateral';
  }
  
  return priceChange > 0.05 ? 'alta' : 'baixa';
};

// Detectar pullback válido
const detectPullback = (candles: CandleData[], trendDirection: 'alta' | 'baixa' | 'lateral'): boolean => {
  if (candles.length < 3 || trendDirection === 'lateral') return false;
  
  const recent3 = candles.slice(-3);
  
  if (trendDirection === 'alta') {
    // Em tendência de alta, procurar correção de baixa seguida de retomada
    const hasCorrection = recent3[0].close > recent3[1].close;
    const hasResumption = recent3[2].close > recent3[1].close;
    return hasCorrection && hasResumption;
  } else {
    // Em tendência de baixa, procurar correção de alta seguida de retomada
    const hasCorrection = recent3[0].close < recent3[1].close;
    const hasResumption = recent3[2].close < recent3[1].close;
    return hasCorrection && hasResumption;
  }
};

// Verificar candle de confirmação forte - MAIS FLEXÍVEL
const checkStrongCandleConfirmation = (candles: CandleData[], signal: 'compra' | 'venda'): boolean => {
  if (candles.length === 0) return false;
  
  const lastCandle = candles[candles.length - 1];
  const body = Math.abs(lastCandle.close - lastCandle.open);
  const totalRange = lastCandle.high - lastCandle.low;
  
  if (totalRange === 0) return false; // Evitar divisão por zero
  
  const bodyRatio = body / totalRange;
  
  // Candle forte: corpo representa pelo menos 50% do range total (reduzido de 60%)
  const isStrongCandle = bodyRatio >= 0.5;
  
  // Verificar se direção do candle alinha com o sinal
  const candleDirection = lastCandle.close > lastCandle.open ? 'compra' : 'venda';
  const directionAlignment = candleDirection === signal;
  
  return isStrongCandle && directionAlignment;
};

// Verificar candles de indecisão (pavios dos dois lados) - MENOS PUNITIVO
const checkIndecisionCandles = (candles: CandleData[]): boolean => {
  if (candles.length === 0) return false;
  
  let indecisionCount = 0;
  
  for (const candle of candles) {
    const body = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;

    if (totalRange === 0) continue;

    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    
    // Candle de indecisão: corpo pequeno e pavios para ambos os lados
    const smallBody = body < totalRange * 0.3; // Corpo menor que 30%
    const hasBothWicks = upperWick > totalRange * 0.2 && lowerWick > totalRange * 0.2;
    
    if (smallBody && hasBothWicks) {
      indecisionCount++;
    }
  }
  
  // Se 2 ou mais candles de indecisão nos últimos 3, é um sinal de alerta
  return indecisionCount >= 2;
};

// Verificar nível de suporte/resistência
const checkSupportResistanceLevel = (candles: CandleData[], signal: 'compra' | 'venda', confluences?: any): boolean => {
  if (!confluences || !confluences.supportResistance) return false;
  
  const currentPrice = candles[candles.length - 1].close;
  
  // Procurar níveis próximos (dentro de 0.1% do preço atual)
  const nearbyLevels = confluences.supportResistance.filter((level: any) => {
    const distance = Math.abs((level.price - currentPrice) / currentPrice) * 100;
    return distance <= 0.1; // Dentro de 0.1%
  });
  
  if (nearbyLevels.length === 0) return false;
  
  // Verificar se há nível apropriado para o sinal
  for (const level of nearbyLevels) {
    if (signal === 'compra' && level.type === 'support' && level.strength === 'forte') {
      return true;
    }
    if (signal === 'venda' && level.type === 'resistance' && level.strength === 'forte') {
      return true;
    }
  }
  
  return false;
};

// Verificar confirmação de volume
const checkVolumeConfirmation = (volumeData?: any, signal?: 'compra' | 'venda'): boolean => {
  if (!volumeData) return false;
  
  // Volume anormal e crescente é positivo
  return volumeData.abnormal && volumeData.trend === 'increasing';
};

// Verificar espaço para o preço correr
const checkSpaceToRun = (candles: CandleData[], signal: 'compra' | 'venda', confluences?: any): boolean => {
  const currentPrice = candles[candles.length - 1].close;
  
  if (!confluences || !confluences.supportResistance) return true; // Se não há níveis, assume que há espaço
  
  const relevantLevels = confluences.supportResistance.filter((level: any) => {
    if (signal === 'compra') {
      return level.type === 'resistance' && level.price > currentPrice;
    } else {
      return level.type === 'support' && level.price < currentPrice;
    }
  });
  
  if (relevantLevels.length === 0) return true; // Sem obstáculos próximos
  
  // Encontrar nível mais próximo
  const nearestLevel = relevantLevels.reduce((nearest: any, current: any) => {
    const nearestDistance = Math.abs(nearest.price - currentPrice);
    const currentDistance = Math.abs(current.price - currentPrice);
    return currentDistance < nearestDistance ? current : nearest;
  });
  
  // Verificar se há espaço suficiente (pelo menos 0.15% de distância)
  const distance = Math.abs((nearestLevel.price - currentPrice) / currentPrice) * 100;
  return distance >= 0.15;
};

// Verificar alinhamento entre tendência e sinal
const checkTrendSignalAlignment = (trendDirection: 'alta' | 'baixa' | 'lateral', signal: 'compra' | 'venda'): boolean => {
  if (trendDirection === 'lateral') return false;
  
  return (trendDirection === 'alta' && signal === 'compra') || 
         (trendDirection === 'baixa' && signal === 'venda');
};

// Função de log para debugging
export const logM1ContextValidation = (validation: M1ContextValidation, signal: string) => {
  console.log('🎯 VALIDAÇÃO M1 CONTEXT:');
  console.log(`   Sinal: ${signal} | Válido: ${validation.isValidForEntry ? '✅' : '❌'}`);
  console.log(`   Score: ${validation.contextScore}% | Recomendação: ${validation.recommendation.toUpperCase()}`);
  console.log(`   Tendência: ${validation.trendDirection} | Pullback: ${validation.pullbackDetected ? 'SIM' : 'NÃO'}`);
  console.log(`   Candle Forte: ${validation.strongCandleConfirmation ? 'SIM' : 'NÃO'} | Indecisão: ${validation.indecisionCandles ? 'SIM' : 'NÃO'}`);
  console.log(`   S/R Nível: ${validation.supportResistanceLevel ? 'SIM' : 'NÃO'} | Volume: ${validation.volumeConfirmation ? 'SIM' : 'NÃO'}`);
  console.log(`   Espaço: ${validation.spaceToRun ? 'SIM' : 'NÃO'}`);
  
  if (validation.rejectionReasons.length > 0) {
    console.log('🚫 Motivos de Rejeição M1:');
    validation.rejectionReasons.forEach(reason => console.log(`   • ${reason}`));
  }
};
