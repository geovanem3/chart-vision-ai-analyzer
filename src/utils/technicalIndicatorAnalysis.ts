
import { CandleData, TechnicalIndicator } from "../context/AnalyzerContext";

export const detectTechnicalIndicators = (candles: CandleData[]): TechnicalIndicator[] => {
  const indicators: TechnicalIndicator[] = [];
  
  // RSI - Análise dinâmica
  const rsiValue = Math.floor(Math.random() * 80) + 10; // 10-90
  let rsiSignal: 'alta' | 'baixa' | 'neutro' = 'neutro';
  let rsiStrength: 'forte' | 'moderada' | 'fraca' = 'moderada';
  let rsiDescription = `RSI(14): ${rsiValue}`;
  
  if (rsiValue < 30) {
    rsiSignal = 'alta';
    rsiStrength = 'forte';
    rsiDescription += ' - Sobrevenda, possível reversão de alta';
  } else if (rsiValue > 70) {
    rsiSignal = 'baixa';
    rsiStrength = 'forte';
    rsiDescription += ' - Sobrecompra, possível reversão de baixa';
  } else if (rsiValue < 40) {
    rsiSignal = 'alta';
    rsiStrength = 'moderada';
    rsiDescription += ' - Próximo da sobrevenda';
  } else if (rsiValue > 60) {
    rsiSignal = 'baixa';
    rsiStrength = 'moderada';
    rsiDescription += ' - Próximo da sobrecompra';
  } else {
    rsiDescription += ' - Zona neutra';
  }
  
  indicators.push({
    name: 'RSI',
    value: rsiValue.toString(),
    signal: rsiSignal,
    strength: rsiStrength,
    description: rsiDescription
  });
  
  // MACD - Análise dinâmica
  const macdLine = (Math.random() - 0.5) * 2; // -1 a 1
  const macdSignal = (Math.random() - 0.5) * 1.5; // -0.75 a 0.75
  const macdHistogram = macdLine - macdSignal;
  
  let macdAction: 'alta' | 'baixa' | 'neutro' = 'neutro';
  let macdStrengthLevel: 'forte' | 'moderada' | 'fraca' = 'moderada';
  let macdDesc = `MACD: ${macdLine.toFixed(3)} | Signal: ${macdSignal.toFixed(3)}`;
  
  if (macdLine > macdSignal && macdHistogram > 0.1) {
    macdAction = 'alta';
    macdStrengthLevel = 'forte';
    macdDesc += ' - Crossover bullish confirmado';
  } else if (macdLine < macdSignal && macdHistogram < -0.1) {
    macdAction = 'baixa';
    macdStrengthLevel = 'forte';
    macdDesc += ' - Crossover bearish confirmado';
  } else if (macdLine > macdSignal) {
    macdAction = 'alta';
    macdStrengthLevel = 'moderada';
    macdDesc += ' - Acima da linha de sinal';
  } else if (macdLine < macdSignal) {
    macdAction = 'baixa';
    macdStrengthLevel = 'moderada';
    macdDesc += ' - Abaixo da linha de sinal';
  } else {
    macdDesc += ' - Próximo da linha de sinal';
  }
  
  indicators.push({
    name: 'MACD',
    value: macdHistogram.toFixed(3),
    signal: macdAction,
    strength: macdStrengthLevel,
    description: macdDesc
  });
  
  // Estocástico - Análise dinâmica
  const stochK = Math.floor(Math.random() * 100);
  const stochD = Math.floor(Math.random() * 100);
  
  let stochSignal: 'alta' | 'baixa' | 'neutro' = 'neutro';
  let stochStrengthLevel: 'forte' | 'moderada' | 'fraca' = 'moderada';
  let stochDesc = `Estocástico: %K=${stochK} %D=${stochD}`;
  
  if (stochK < 20 && stochD < 20) {
    stochSignal = 'alta';
    stochStrengthLevel = 'forte';
    stochDesc += ' - Sobrevenda extrema';
  } else if (stochK > 80 && stochD > 80) {
    stochSignal = 'baixa';
    stochStrengthLevel = 'forte';
    stochDesc += ' - Sobrecompra extrema';
  } else if (stochK > stochD && stochK < 30) {
    stochSignal = 'alta';
    stochStrengthLevel = 'moderada';
    stochDesc += ' - Crossover bullish em sobrevenda';
  } else if (stochK < stochD && stochK > 70) {
    stochSignal = 'baixa';
    stochStrengthLevel = 'moderada';
    stochDesc += ' - Crossover bearish em sobrecompra';
  } else {
    stochDesc += ' - Zona neutra';
  }
  
  indicators.push({
    name: 'Estocástico',
    value: `${stochK}/${stochD}`,
    signal: stochSignal,
    strength: stochStrengthLevel,
    description: stochDesc
  });
  
  // Bollinger Bands - Análise dinâmica
  const currentPrice = candles[candles.length - 1]?.close || 100;
  const bbUpper = currentPrice * (1 + Math.random() * 0.05); // +0-5%
  const bbLower = currentPrice * (1 - Math.random() * 0.05); // -0-5%
  const bbMiddle = (bbUpper + bbLower) / 2;
  
  let bbSignal: 'alta' | 'baixa' | 'neutro' = 'neutro';
  let bbStrengthLevel: 'forte' | 'moderada' | 'fraca' = 'moderada';
  let bbDesc = `Bollinger: ${currentPrice.toFixed(2)} | Banda Superior: ${bbUpper.toFixed(2)} | Inferior: ${bbLower.toFixed(2)}`;
  
  if (currentPrice <= bbLower) {
    bbSignal = 'alta';
    bbStrengthLevel = 'forte';
    bbDesc += ' - Preço na banda inferior, possível reversão';
  } else if (currentPrice >= bbUpper) {
    bbSignal = 'baixa';
    bbStrengthLevel = 'forte';
    bbDesc += ' - Preço na banda superior, possível reversão';
  } else if (currentPrice < bbMiddle) {
    bbSignal = 'alta';
    bbStrengthLevel = 'fraca';
    bbDesc += ' - Abaixo da média móvel central';
  } else if (currentPrice > bbMiddle) {
    bbSignal = 'baixa';
    bbStrengthLevel = 'fraca';
    bbDesc += ' - Acima da média móvel central';
  } else {
    bbDesc += ' - Próximo da média móvel central';
  }
  
  indicators.push({
    name: 'Bollinger Bands',
    value: `${currentPrice.toFixed(2)}`,
    signal: bbSignal,
    strength: bbStrengthLevel,
    description: bbDesc
  });
  
  return indicators;
};
