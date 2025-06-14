import { CandleData } from "../context/AnalyzerContext";

export interface AdvancedMarketConditions {
  operatingDifficulty: 'facil' | 'moderado' | 'dificil' | 'muito_dificil' | 'nao_operar';
  marketRegime: 'trending' | 'ranging' | 'transitioning' | 'chaotic' | 'manipulated';
  liquidityState: 'abundante' | 'normal' | 'escassa' | 'muito_escassa';
  institutionalActivity: 'ausente' | 'baixa' | 'normal' | 'alta' | 'muito_alta';
  manipulationRisk: 'baixo' | 'moderado' | 'alto' | 'muito_alto';
  newsImpactRisk: 'baixo' | 'moderado' | 'alto';
  volatilityRegime: 'baixa' | 'normal' | 'alta' | 'extrema' | 'anormal';
  timeDecay: 'favoravel' | 'neutro' | 'desfavoravel';
  marketMakerActivity: 'baixa' | 'normal' | 'alta' | 'muito_alta';
  spreadCondition: 'apertado' | 'normal' | 'largo' | 'muito_largo';
  recommendation: 'operar_normal' | 'operar_reduzido' | 'muito_cauteloso' | 'nao_operar';
  warnings: string[];
  reasoning: string[];
}

export interface EnhancedMarketContext {
  phase: string;
  strength: string;
  dominantTimeframe: string;
  sentiment: string;
  description: string;
  marketStructure: string;
  breakoutPotential: string;
  momentumSignature: string;
  advancedConditions: AdvancedMarketConditions;
  operatingScore: number;
  confidenceReduction: number;
  keyLevels?: any[];
}

// Analisar condições avançadas de mercado
export const analyzeAdvancedMarketConditions = (candles: CandleData[]): AdvancedMarketConditions => {
  if (candles.length < 30) {
    return {
      operatingDifficulty: 'muito_dificil',
      marketRegime: 'chaotic',
      liquidityState: 'escassa',
      institutionalActivity: 'ausente',
      manipulationRisk: 'alto',
      newsImpactRisk: 'moderado',
      volatilityRegime: 'anormal',
      timeDecay: 'desfavoravel',
      marketMakerActivity: 'baixa',
      spreadCondition: 'muito_largo',
      recommendation: 'nao_operar',
      warnings: ['Dados insuficientes para análise confiável'],
      reasoning: ['Menos de 30 candles disponíveis']
    };
  }

  const recent20 = candles.slice(-20);
  const recent10 = candles.slice(-10);
  const recent5 = candles.slice(-5);
  
  // Analisar regime de mercado
  const marketRegime = analyzeMarketRegime(recent20);
  
  // Analisar liquidez baseada em padrões de preço
  const liquidityState = analyzeLiquidityFromPrice(recent20);
  
  // Detectar atividade institucional
  const institutionalActivity = detectInstitutionalActivity(recent20);
  
  // Detectar risco de manipulação
  const manipulationRisk = detectManipulationRisk(recent20);
  
  // Analisar volatilidade
  const volatilityRegime = analyzeVolatilityRegime(recent20);
  
  // Detectar atividade de market makers
  const marketMakerActivity = detectMarketMakerActivity(recent10);
  
  // Analisar spread (simulado através de padrões)
  const spreadCondition = analyzeSpreadCondition(recent5);
  
  // Detectar impacto de notícias (baseado em volatilidade súbita)
  const newsImpactRisk = detectNewsImpactRisk(recent10);
  
  // Analisar decay temporal
  const timeDecay = analyzeTimeDecay();
  
  // Calcular dificuldade geral
  const operatingDifficulty = calculateOperatingDifficulty({
    marketRegime,
    liquidityState,
    manipulationRisk,
    volatilityRegime,
    marketMakerActivity,
    newsImpactRisk
  });
  
  // Gerar recomendação final
  const recommendation = generateTradingRecommendation(operatingDifficulty, {
    marketRegime,
    manipulationRisk,
    volatilityRegime,
    liquidityState
  });
  
  // Gerar warnings e reasoning
  const { warnings, reasoning } = generateWarningsAndReasoning({
    operatingDifficulty,
    marketRegime,
    manipulationRisk,
    volatilityRegime,
    liquidityState,
    marketMakerActivity,
    newsImpactRisk
  });

  return {
    operatingDifficulty,
    marketRegime,
    liquidityState,
    institutionalActivity,
    manipulationRisk,
    newsImpactRisk,
    volatilityRegime,
    timeDecay,
    marketMakerActivity,
    spreadCondition,
    recommendation,
    warnings,
    reasoning
  };
};

// Analisar regime de mercado (trending vs ranging vs chaos)
const analyzeMarketRegime = (candles: CandleData[]): AdvancedMarketConditions['marketRegime'] => {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  
  // Calcular ADX simulado (Average Directional Index)
  const ranges = candles.map(c => c.high - c.low);
  const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
  
  // Detectar trending
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const overallMove = Math.abs(lastClose - firstClose) / firstClose;
  
  // Calcular choppiness (oscilações)
  let reversals = 0;
  for (let i = 1; i < closes.length - 1; i++) {
    const prev = closes[i - 1];
    const current = closes[i];
    const next = closes[i + 1];
    
    if ((current > prev && current > next) || (current < prev && current < next)) {
      reversals++;
    }
  }
  
  const choppiness = reversals / closes.length;
  
  // Detectar manipulação através de "fake moves"
  const fakeMoves = detectFakeMoves(candles);
  
  if (fakeMoves > 3) return 'manipulated';
  if (choppiness > 0.4) return 'chaotic';
  if (overallMove < 0.005 && choppiness > 0.25) return 'ranging';
  if (overallMove > 0.01 && choppiness < 0.2) return 'trending';
  
  return 'transitioning';
};

// Detectar "fake moves" que indicam manipulação
const detectFakeMoves = (candles: CandleData[]): number => {
  let fakeMoves = 0;
  
  for (let i = 2; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const current = candles[i];
    const next = candles[i + 1];
    
    // Fake breakout para cima seguido de reversão
    if (current.high > prev.high * 1.002 && 
        next.close < current.open && 
        next.close < prev.close) {
      fakeMoves++;
    }
    
    // Fake breakout para baixo seguido de reversão
    if (current.low < prev.low * 0.998 && 
        next.close > current.open && 
        next.close > prev.close) {
      fakeMoves++;
    }
    
    // Wick hunting (pavios muito grandes seguidos de reversão)
    const upperWick = current.high - Math.max(current.open, current.close);
    const lowerWick = Math.min(current.open, current.close) - current.low;
    const body = Math.abs(current.close - current.open);
    
    if (upperWick > body * 3 && next.close < current.close * 0.995) {
      fakeMoves++;
    }
    
    if (lowerWick > body * 3 && next.close > current.close * 1.005) {
      fakeMoves++;
    }
  }
  
  return fakeMoves;
};

// Analisar liquidez através de padrões de preço
const analyzeLiquidityFromPrice = (candles: CandleData[]): AdvancedMarketConditions['liquidityState'] => {
  // Analisar gaps e jumps súbitos
  let gaps = 0;
  let totalGapSize = 0;
  
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const current = candles[i];
    
    const gapUp = current.low > prev.high;
    const gapDown = current.high < prev.low;
    
    if (gapUp || gapDown) {
      gaps++;
      const gapSize = gapUp ? 
        (current.low - prev.high) / prev.close :
        (prev.low - current.high) / prev.close;
      totalGapSize += Math.abs(gapSize);
    }
  }
  
  const avgGapSize = gaps > 0 ? totalGapSize / gaps : 0;
  
  // Analisar spreads simulados (diferença entre high e low)
  const spreads = candles.map(c => (c.high - c.low) / c.close);
  const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
  
  if (avgGapSize > 0.002 || avgSpread > 0.015) return 'muito_escassa';
  if (avgGapSize > 0.001 || avgSpread > 0.01) return 'escassa';
  if (avgSpread < 0.003) return 'abundante';
  
  return 'normal';
};

// Detectar atividade institucional
const detectInstitutionalActivity = (candles: CandleData[]): AdvancedMarketConditions['institutionalActivity'] => {
  // Detectar "big candles" que indicam ordens institucionais
  const bodies = candles.map(c => Math.abs(c.close - c.open));
  const avgBody = bodies.reduce((a, b) => a + b, 0) / bodies.length;
  
  const bigCandles = bodies.filter(body => body > avgBody * 2).length;
  const veryBigCandles = bodies.filter(body => body > avgBody * 3).length;
  
  // Detectar padrões de absorção (candles que absorvem movimento anterior)
  let absorptions = 0;
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const current = candles[i];
    
    const currentBody = Math.abs(current.close - current.open);
    const prevBody = Math.abs(prev.close - prev.open);
    
    if (currentBody > prevBody * 2 && 
        ((current.close > current.open && prev.close < prev.open) ||
         (current.close < current.open && prev.close > prev.open))) {
      absorptions++;
    }
  }
  
  if (veryBigCandles >= 3 || absorptions >= 2) return 'muito_alta';
  if (bigCandles >= 4 || absorptions >= 1) return 'alta';
  if (bigCandles >= 2) return 'normal';
  if (bigCandles >= 1) return 'baixa';
  
  return 'ausente';
};

// Detectar risco de manipulação
const detectManipulationRisk = (candles: CandleData[]): AdvancedMarketConditions['manipulationRisk'] => {
  const fakeMoves = detectFakeMoves(candles);
  
  // Detectar stop hunting (movimento súbito seguido de reversão)
  let stopHunts = 0;
  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const current = candles[i];
    const next = candles[i + 1];
    
    const moveSize = Math.abs(current.close - prev.close) / prev.close;
    const reversalSize = Math.abs(next.close - current.close) / current.close;
    
    if (moveSize > 0.003 && reversalSize > moveSize * 0.8) {
      stopHunts++;
    }
  }
  
  // Detectar padrões de "painting the tape"
  let suspiciousPatterns = 0;
  for (let i = 2; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];
    
    // Padrão: close muito próximo do high/low anterior
    const closeToHigh = Math.abs(current.close - prev.high) / prev.close < 0.0005;
    const closeToLow = Math.abs(current.close - prev.low) / prev.close < 0.0005;
    
    if (closeToHigh || closeToLow) {
      suspiciousPatterns++;
    }
  }
  
  const totalManipulationSigns = fakeMoves + stopHunts + suspiciousPatterns;
  
  if (totalManipulationSigns >= 6) return 'muito_alto';
  if (totalManipulationSigns >= 4) return 'alto';
  if (totalManipulationSigns >= 2) return 'moderado';
  
  return 'baixo';
};

// Analisar regime de volatilidade
const analyzeVolatilityRegime = (candles: CandleData[]): AdvancedMarketConditions['volatilityRegime'] => {
  const ranges = candles.map(c => (c.high - c.low) / c.close);
  const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
  
  // Detectar volatilidade anormal (spikes súbitos)
  const recentRanges = ranges.slice(-5);
  const historicalRanges = ranges.slice(0, -5);
  const historicalAvg = historicalRanges.reduce((a, b) => a + b, 0) / historicalRanges.length;
  
  const volatilitySpikes = recentRanges.filter(range => range > historicalAvg * 2).length;
  
  if (volatilitySpikes >= 3) return 'anormal';
  if (avgRange > 0.02) return 'extrema';
  if (avgRange > 0.01) return 'alta';
  if (avgRange < 0.002) return 'baixa';
  
  return 'normal';
};

// Detectar atividade de market makers
const detectMarketMakerActivity = (candles: CandleData[]): AdvancedMarketConditions['marketMakerActivity'] => {
  // Detectar padrões de "layering" e "spoofing"
  let mmPatterns = 0;
  
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    
    // Detectar "doji" frequentes (indecisão artificial)
    const body = Math.abs(current.close - current.open);
    const range = current.high - current.low;
    
    if (body / range < 0.1 && range / current.close > 0.002) {
      mmPatterns++;
    }
    
    // Detectar reversões súbitas no final do candle
    const openDirection = current.open > prev.close ? 'up' : 'down';
    const closeDirection = current.close > current.open ? 'up' : 'down';
    
    if (openDirection !== closeDirection && Math.abs(current.close - current.open) > range * 0.3) {
      mmPatterns++;
    }
  }
  
  if (mmPatterns >= 6) return 'muito_alta';
  if (mmPatterns >= 4) return 'alta';
  if (mmPatterns >= 2) return 'normal';
  
  return 'baixa';
};

// Analisar condição de spread
const analyzeSpreadCondition = (candles: CandleData[]): AdvancedMarketConditions['spreadCondition'] => {
  const spreads = candles.map(c => (c.high - c.low) / c.close);
  const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
  
  if (avgSpread > 0.015) return 'muito_largo';
  if (avgSpread > 0.01) return 'largo';
  if (avgSpread < 0.003) return 'apertado';
  
  return 'normal';
};

// Detectar risco de impacto de notícias
const detectNewsImpactRisk = (candles: CandleData[]): AdvancedMarketConditions['newsImpactRisk'] => {
  // Detectar volatilidade súbita que pode indicar notícias
  const ranges = candles.map(c => (c.high - c.low) / c.close);
  const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
  
  const suddenSpikes = ranges.filter(range => range > avgRange * 3).length;
  
  if (suddenSpikes >= 2) return 'alto';
  if (suddenSpikes >= 1) return 'moderado';
  
  return 'baixo';
};

// Analisar decay temporal
const analyzeTimeDecay = (): AdvancedMarketConditions['timeDecay'] => {
  const hour = new Date().getHours();
  
  // Horários com baixa liquidez
  if (hour >= 0 && hour <= 6) return 'desfavoravel'; // Madrugada
  if (hour >= 12 && hour <= 14) return 'desfavoravel'; // Almoço
  if (hour >= 9 && hour <= 11) return 'favoravel'; // Abertura
  if (hour >= 15 && hour <= 17) return 'favoravel'; // Final do dia
  
  return 'neutro';
};

// Calcular dificuldade de operação
const calculateOperatingDifficulty = (conditions: {
  marketRegime: AdvancedMarketConditions['marketRegime'];
  liquidityState: AdvancedMarketConditions['liquidityState'];
  manipulationRisk: AdvancedMarketConditions['manipulationRisk'];
  volatilityRegime: AdvancedMarketConditions['volatilityRegime'];
  marketMakerActivity: AdvancedMarketConditions['marketMakerActivity'];
  newsImpactRisk: AdvancedMarketConditions['newsImpactRisk'];
}): AdvancedMarketConditions['operatingDifficulty'] => {
  let difficultyScore = 0;
  
  // Market regime impact
  if (conditions.marketRegime === 'chaotic') difficultyScore += 4;
  else if (conditions.marketRegime === 'manipulated') difficultyScore += 5;
  else if (conditions.marketRegime === 'ranging') difficultyScore += 2;
  else if (conditions.marketRegime === 'transitioning') difficultyScore += 1;
  
  // Liquidity impact
  if (conditions.liquidityState === 'muito_escassa') difficultyScore += 3;
  else if (conditions.liquidityState === 'escassa') difficultyScore += 2;
  
  // Manipulation risk impact
  if (conditions.manipulationRisk === 'muito_alto') difficultyScore += 4;
  else if (conditions.manipulationRisk === 'alto') difficultyScore += 3;
  else if (conditions.manipulationRisk === 'moderado') difficultyScore += 1;
  
  // Volatility impact
  if (conditions.volatilityRegime === 'anormal') difficultyScore += 3;
  else if (conditions.volatilityRegime === 'extrema') difficultyScore += 2;
  else if (conditions.volatilityRegime === 'baixa') difficultyScore += 1;
  
  // Market maker activity impact
  if (conditions.marketMakerActivity === 'muito_alta') difficultyScore += 2;
  else if (conditions.marketMakerActivity === 'alta') difficultyScore += 1;
  
  // News impact
  if (conditions.newsImpactRisk === 'alto') difficultyScore += 2;
  else if (conditions.newsImpactRisk === 'moderado') difficultyScore += 1;
  
  if (difficultyScore >= 8) return 'nao_operar';
  if (difficultyScore >= 6) return 'muito_dificil';
  if (difficultyScore >= 4) return 'dificil';
  if (difficultyScore >= 2) return 'moderado';
  
  return 'facil';
};

// Gerar recomendação de trading
const generateTradingRecommendation = (
  difficulty: AdvancedMarketConditions['operatingDifficulty'],
  conditions: {
    marketRegime: AdvancedMarketConditions['marketRegime'];
    manipulationRisk: AdvancedMarketConditions['manipulationRisk'];
    volatilityRegime: AdvancedMarketConditions['volatilityRegime'];
    liquidityState: AdvancedMarketConditions['liquidityState'];
  }
): AdvancedMarketConditions['recommendation'] => {
  if (difficulty === 'nao_operar') return 'nao_operar';
  if (difficulty === 'muito_dificil') return 'nao_operar';
  
  if (conditions.manipulationRisk === 'muito_alto' || 
      conditions.marketRegime === 'manipulated') {
    return 'nao_operar';
  }
  
  if (difficulty === 'dificil') return 'muito_cauteloso';
  if (difficulty === 'moderado') return 'operar_reduzido';
  
  return 'operar_normal';
};

// Gerar warnings e reasoning
const generateWarningsAndReasoning = (conditions: {
  operatingDifficulty: AdvancedMarketConditions['operatingDifficulty'];
  marketRegime: AdvancedMarketConditions['marketRegime'];
  manipulationRisk: AdvancedMarketConditions['manipulationRisk'];
  volatilityRegime: AdvancedMarketConditions['volatilityRegime'];
  liquidityState: AdvancedMarketConditions['liquidityState'];
  marketMakerActivity: AdvancedMarketConditions['marketMakerActivity'];
  newsImpactRisk: AdvancedMarketConditions['newsImpactRisk'];
}): { warnings: string[]; reasoning: string[] } => {
  const warnings: string[] = [];
  const reasoning: string[] = [];
  
  // Generate warnings based on conditions
  if (conditions.operatingDifficulty === 'nao_operar') {
    warnings.push('🚨 CONDIÇÕES EXTREMAMENTE ADVERSAS - NÃO OPERAR');
  }
  
  if (conditions.manipulationRisk === 'muito_alto') {
    warnings.push('⚠️ Alto risco de manipulação detectado');
  }
  
  if (conditions.marketRegime === 'chaotic') {
    warnings.push('📊 Mercado em regime caótico - padrões não confiáveis');
  }
  
  if (conditions.volatilityRegime === 'anormal') {
    warnings.push('📈 Volatilidade anormal - possível impacto de notícias');
  }
  
  if (conditions.liquidityState === 'muito_escassa') {
    warnings.push('💧 Liquidez muito baixa - spreads alargados');
  }
  
  // Generate reasoning
  reasoning.push(`Regime: ${conditions.marketRegime}`);
  reasoning.push(`Dificuldade: ${conditions.operatingDifficulty}`);
  reasoning.push(`Manipulação: ${conditions.manipulationRisk}`);
  reasoning.push(`Volatilidade: ${conditions.volatilityRegime}`);
  reasoning.push(`Liquidez: ${conditions.liquidityState}`);
  
  return { warnings, reasoning };
};

// Calcular score de operação (0-100)
export const calculateOperatingScore = (conditions: AdvancedMarketConditions): number => {
  let score = 100;
  
  // Penalidades baseadas nas condições
  if (conditions.operatingDifficulty === 'nao_operar') score = 0;
  else if (conditions.operatingDifficulty === 'muito_dificil') score = 15;
  else if (conditions.operatingDifficulty === 'dificil') score = 35;
  else if (conditions.operatingDifficulty === 'moderado') score = 65;
  
  // Ajustes baseados em outros fatores
  if (conditions.manipulationRisk === 'muito_alto') score *= 0.3;
  else if (conditions.manipulationRisk === 'alto') score *= 0.5;
  else if (conditions.manipulationRisk === 'moderado') score *= 0.8;
  
  if (conditions.volatilityRegime === 'anormal') score *= 0.4;
  else if (conditions.volatilityRegime === 'extrema') score *= 0.7;
  
  if (conditions.liquidityState === 'muito_escassa') score *= 0.6;
  else if (conditions.liquidityState === 'escassa') score *= 0.8;
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Calcular fator de redução de confiança
export const calculateConfidenceReduction = (conditions: AdvancedMarketConditions): number => {
  let reduction = 1.0; // Sem redução inicialmente
  
  if (conditions.operatingDifficulty === 'nao_operar') reduction = 0.1;
  else if (conditions.operatingDifficulty === 'muito_dificil') reduction = 0.3;
  else if (conditions.operatingDifficulty === 'dificil') reduction = 0.5;
  else if (conditions.operatingDifficulty === 'moderado') reduction = 0.7;
  
  if (conditions.manipulationRisk === 'muito_alto') reduction *= 0.4;
  else if (conditions.manipulationRisk === 'alto') reduction *= 0.6;
  
  if (conditions.marketRegime === 'chaotic') reduction *= 0.5;
  else if (conditions.marketRegime === 'manipulated') reduction *= 0.3;
  
  return Math.max(0.1, reduction);
};
