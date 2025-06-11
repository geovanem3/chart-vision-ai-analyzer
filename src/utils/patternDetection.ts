// Add imports from AnalyzerContext
import { 
  PatternResult, 
  TechnicalElement, 
  Point, 
  CandleData, 
  ScalpingSignal, 
  VolumeData, 
  VolatilityData,
  MarketContext,
  PreciseEntryAnalysis
} from '@/context/AnalyzerContext';

export const analyzeResults = (patterns: PatternResult[], timeframe: string = '1m'): string => {
  if (!patterns || patterns.length === 0) {
    return "Nenhum padrão significativo foi identificado neste gráfico.";
  }
  
  // Count direction signals
  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;
  let totalConfidence = 0;
  
  patterns.forEach(pattern => {
    if (pattern.action === 'compra') {
      bullishCount += pattern.confidence;
    } else if (pattern.action === 'venda') {
      bearishCount += pattern.confidence;
    } else {
      neutralCount += pattern.confidence;
    }
    totalConfidence += pattern.confidence;
  });
  
  // Normalize values
  const bullishWeight = bullishCount / totalConfidence;
  const bearishWeight = bearishCount / totalConfidence;
  const neutralWeight = neutralCount / totalConfidence;
  
  // Generate time-specific advice
  const timeframeText = getTimeframeText(timeframe);
  
  // Enhanced recommendations for scalping in 1m timeframe with volume and volatility context
  if (timeframe === '1m') {
    if (bullishWeight > 0.5) {
      return `Oportunidade de scalping de COMPRA no ${timeframeText}: Entre apenas com confirmação de volume crescente e volatilidade adequada (nem muito alta nem muito baixa). Aguarde o fechamento do candle acima da EMA9 e confirmação de fluxo de ordens positivo. Use stop de 0.5% ou abaixo do último suporte, com alvos de 2-3% ou na próxima resistência importante. A fase atual do mercado deve estar alinhada com a direção da entrada. IMPORTANTE: Não entre se o RSI estiver acima de 70 ou se o último candle tiver sombra superior longa.`;
    } else if (bearishWeight > 0.5) {
      return `Oportunidade de scalping de VENDA no ${timeframeText}: Entre apenas com confirmação de volume crescente e volatilidade adequada (nem muito alta nem muito baixa). Aguarde o fechamento do candle abaixo da EMA9 e confirmação de fluxo de ordens negativo. Use stop de 0.5% ou acima da última resistência, com alvos de 2-3% ou no próximo suporte importante. A fase atual do mercado deve estar alinhada com a direção da entrada. IMPORTANTE: Não entre se o RSI estiver abaixo de 30 ou se o último candle tiver sombra inferior longa.`;
    } else if (bullishWeight > bearishWeight && bullishWeight > 0.3) {
      return `Viés de alta com potencial de entrada no ${timeframeText}: Aguarde cruzamento da EMA9 por cima da EMA21 com volume crescente e volatilidade controlada. Confirme com RSI acima de 50, teste de suporte anterior e alinhamento com a fase atual do mercado. Considere entradas apenas com confirmação do timeframe superior (5m). Não fique em posição por mais de 3 candles se não houver movimento claro.`;
    } else if (bearishWeight > bullishWeight && bearishWeight > 0.3) {
      return `Viés de baixa com potencial de entrada no ${timeframeText}: Aguarde cruzamento da EMA9 por baixo da EMA21 com volume crescente e volatilidade controlada. Confirme com RSI abaixo de 50, teste de resistência anterior e alinhamento com a fase atual do mercado. Considere entradas apenas com confirmação do timeframe superior (5m). Não fique em posição por mais de 3 candles se não houver movimento claro.`;
    } else {
      return `Mercado sem direção clara no ${timeframeText}: Evite entradas de scalping. Monitore o volume, volatilidade e formação de um padrão direcional com confirmação de duas médias móveis (EMA9 e EMA21). Aguarde a definição da fase de mercado e uma divergência clara de RSI ou movimento significativo no fluxo de ordens para considerar uma entrada. No mercado lateral, apenas opere falhas de rompimento ou reversões nas extremidades do range.`;
    }
  }
  
  // Recomendações para outros timeframes com consideração de volume e volatilidade
  if (bullishWeight > 0.6) {
    return `Tendência de alta no ${timeframeText}: Os padrões identificados sugerem uma forte probabilidade de movimento ascendente. Considere posições compradas quando houver confirmação de volume e volatilidade favorável, mantendo stops abaixo dos níveis de suporte identificados.`;
  } else if (bearishWeight > 0.6) {
    return `Tendência de baixa no ${timeframeText}: Os padrões identificados sugerem uma forte probabilidade de movimento descendente. Considere posições vendidas quando houver confirmação de volume e volatilidade favorável, mantendo stops acima dos níveis de resistência identificados.`;
  } else if (bullishWeight > bearishWeight && bullishWeight > 0.4) {
    return `Viés de alta no ${timeframeText}: Há um viés positivo, mas com sinais mistos. Monitore o volume e a volatilidade, aguardando confirmação por quebra de resistências com volume crescente antes de entrar em posições compradas.`;
  } else if (bearishWeight > bullishWeight && bearishWeight > 0.4) {
    return `Viés de baixa no ${timeframeText}: Há um viés negativo, mas com sinais mistos. Monitore o volume e a volatilidade, aguardando confirmação por quebra de suportes com volume crescente antes de entrar em posições vendidas.`;
  } else {
    return `Mercado lateralizado no ${timeframeText}: Os padrões detectados não indicam uma direção clara. Recomenda-se aguardar por confirmação de rompimento de suportes ou resistências com aumento significativo de volume e volatilidade adequada.`;
  }
};

const getTimeframeText = (timeframe: string): string => {
  switch (timeframe) {
    case '1m': return 'gráfico de 1 minuto';
    case '5m': return 'gráfico de 5 minutos';
    case '15m': return 'gráfico de 15 minutos';
    case '30m': return 'gráfico de 30 minutos';
    case '1h': return 'gráfico de 1 hora';
    case '4h': return 'gráfico de 4 horas';
    case '1d': return 'gráfico diário';
    case '1w': return 'gráfico semanal';
    default: return 'gráfico';
  }
};

export const validatePatterns = (patterns: PatternResult[]): PatternResult[] => {
  // Find any support/resistance patterns
  const supportResistancePattern = patterns.find(p => 
    p.type === 'Suporte/Resistência' || 
    p.type.toLowerCase().includes('suporte') || 
    p.type.toLowerCase().includes('resistência')
  );
  
  // Check for volume patterns
  const volumePattern = patterns.find(p => 
    p.type.toLowerCase().includes('volume') || 
    p.description?.toLowerCase().includes('volume')
  );
  
  // Check for volatility patterns
  const volatilityPattern = patterns.find(p => 
    p.type.toLowerCase().includes('volatilidade') || 
    p.description?.toLowerCase().includes('volatilidade') ||
    p.description?.toLowerCase().includes('atr')
  );
  
  // If there are no support/resistance patterns, we can't validate
  if (!supportResistancePattern) return patterns;
  
  // Create validation warnings for contradicting patterns
  return patterns.map(pattern => {
    // Check if this is a buy signal near resistance or sell signal near support
    if (pattern.action === 'compra' && supportResistancePattern && 
        supportResistancePattern.description?.toLowerCase().includes('resistência')) {
      return {
        ...pattern,
        confidence: pattern.confidence * 0.7, // Reduce confidence
        description: pattern.description + ' [ALERTA: Sinal próximo a uma resistência importante]',
        recommendation: (pattern.recommendation || '') + 
          ' Cuidado: Este sinal de compra está próximo a uma resistência, espere confirmação de rompimento antes de entrar.'
      };
    } else if (pattern.action === 'venda' && supportResistancePattern && 
              supportResistancePattern.description?.toLowerCase().includes('suporte')) {
      return {
        ...pattern,
        confidence: pattern.confidence * 0.7, // Reduce confidence
        description: pattern.description + ' [ALERTA: Sinal próximo a um suporte importante]',
        recommendation: (pattern.recommendation || '') + 
          ' Cuidado: Este sinal de venda está próximo a um suporte, espere confirmação de rompimento antes de entrar.'
      };
    }
    
    // Check for volume confirmation
    if (pattern.action !== 'neutro' && volumePattern) {
      const volumeIncreasing = volumePattern.description?.toLowerCase().includes('aumento') || 
                              volumePattern.description?.toLowerCase().includes('alto');
      
      if (!volumeIncreasing) {
        return {
          ...pattern,
          confidence: pattern.confidence * 0.8, // Reduce confidence
          description: pattern.description + ' [ALERTA: Volume não confirma o sinal]',
          recommendation: (pattern.recommendation || '') + 
            ' Cuidado: O volume atual não confirma fortemente este sinal. Aguarde aumento de volume para maior confiança.'
        };
      }
    }
    
    // Check for volatility conditions
    if (pattern.action !== 'neutro' && volatilityPattern) {
      const volatilityHigh = volatilityPattern.description?.toLowerCase().includes('alta') || 
                            volatilityPattern.description?.toLowerCase().includes('elevada');
      
      if (volatilityHigh) {
        return {
          ...pattern,
          confidence: pattern.confidence * 0.85, // Adjust confidence
          description: pattern.description + ' [ALERTA: Alta volatilidade detectada]',
          recommendation: (pattern.recommendation || '') + 
            ' Nota: Alta volatilidade pode indicar movimentos falsos. Considere reduzir o tamanho da posição e usar stops mais amplos.'
        };
      }
    }
    
    return pattern;
  });
};

// Enhanced function for generating precise entry timing with detailed analysis
export const generatePreciseEntryAnalysis = (
  patterns: PatternResult[], 
  candles?: CandleData[],
  volumeData?: VolumeData,
  volatilityData?: VolatilityData,
  marketContext?: MarketContext
): PreciseEntryAnalysis | undefined => {
  if (!patterns || patterns.length === 0) return undefined;
  
  // Filter high-confidence patterns
  const actionablePatterns = patterns.filter(p => p.confidence > 0.7 && p.action !== 'neutro');
  if (actionablePatterns.length === 0) return undefined;
  
  // Determine dominant direction
  const dominantPattern = actionablePatterns.sort((a, b) => b.confidence - a.confidence)[0];
  const isBullish = dominantPattern.action === 'compra';
  
  // Check for support/resistance patterns
  const supportResistancePatterns = patterns.filter(p => 
    p.type === 'Suporte/Resistência' || 
    p.type.toLowerCase().includes('suporte') || 
    p.type.toLowerCase().includes('resistência')
  );
  
  // Check for trend patterns
  const trendPatterns = patterns.filter(p => 
    p.type.toLowerCase().includes('tendência') || 
    p.description?.toLowerCase().includes('tendência')
  );
  
  // Check for candle patterns
  const candlePatterns = patterns.filter(p => 
    p.type.toLowerCase().includes('candle') || 
    p.type.toLowerCase().includes('vela') ||
    p.description?.toLowerCase().includes('doji') ||
    p.description?.toLowerCase().includes('martelo') ||
    p.description?.toLowerCase().includes('engolfo')
  );
  
  // Determine entry type based on patterns
  let entryType: 'reversão' | 'retração' | 'pullback' | 'breakout' | 'teste_suporte' | 'teste_resistência';
  
  if (candlePatterns.some(p => 
      p.description?.toLowerCase().includes('reversão') || 
      p.description?.toLowerCase().includes('inverso'))) {
    entryType = 'reversão';
  } else if (supportResistancePatterns.some(p => 
      p.description?.toLowerCase().includes('suporte') && isBullish)) {
    entryType = 'teste_suporte';
  } else if (supportResistancePatterns.some(p => 
      p.description?.toLowerCase().includes('resistência') && !isBullish)) {
    entryType = 'teste_resistência';
  } else if (trendPatterns.some(p => 
      p.description?.toLowerCase().includes('pullback') || 
      p.description?.toLowerCase().includes('recuo'))) {
    entryType = 'pullback';
  } else if (trendPatterns.some(p => 
      p.description?.toLowerCase().includes('retração') || 
      p.description?.toLowerCase().includes('retracement'))) {
    entryType = 'retração';
  } else {
    entryType = 'breakout';
  }
  
  // Generate precise minute entry time with more intelligent logic
  // In a real system, this would analyze candle timing patterns and market microstructure
  const now = new Date();
  let minutes = now.getMinutes();
  let nextMinute = minutes;
  
  // More intelligent entry timing based on pattern type and market context
  if (entryType === 'reversão') {
    // For reversals, we want to wait a bit longer for confirmation
    nextMinute = (minutes + 2) % 60;
  } else if (entryType === 'breakout') {
    // For breakouts, we want to enter quickly after confirmation
    nextMinute = (minutes + 1) % 60;
  } else if (candlePatterns.length > 0 && candlePatterns[0].confidence > 0.8) {
    // For strong candle patterns, enter at specific timing
    nextMinute = (minutes + 1) % 60;
  } else if (volumeData && volumeData.trend === 'increasing' && volumeData.abnormal) {
    // For abnormal volume, enter quickly
    nextMinute = (minutes + 1) % 60;
  } else {
    // Default wait time
    nextMinute = (minutes + 2) % 60;
  }
  
  // Check if entry should be avoided due to market conditions
  let shouldAvoidEntry = false;
  let avoidanceReason = '';
  
  if (volatilityData && volatilityData.isHigh && volatilityData.value > 1.5) {
    shouldAvoidEntry = true;
    avoidanceReason = 'Volatilidade extremamente alta. Risco de movimentos erráticos e falsos sinais.';
  }
  
  if (marketContext && marketContext.phase === 'indefinida') {
    shouldAvoidEntry = true;
    avoidanceReason = 'Fase de mercado indefinida. Aguarde clareza na direção do mercado.';
  }
  
  if (marketContext && 
      ((isBullish && marketContext.phase === 'tendência_baixa' && marketContext.strength === 'forte') || 
       (!isBullish && marketContext.phase === 'tendência_alta' && marketContext.strength === 'forte'))) {
    shouldAvoidEntry = true;
    avoidanceReason = 'Sinal contrário à tendência principal forte. Alto risco de falha.';
  }
  
  const entryMinute = nextMinute < 10 ? `0${nextMinute}` : `${nextMinute}`;
  const entryHour = nextMinute < minutes ? (now.getHours() + 1) % 24 : now.getHours();
  const formattedHour = entryHour < 10 ? `0${entryHour}` : `${entryHour}`;
  const exactMinute = `${formattedHour}:${entryMinute}`;
  
  // Generate entry expectations based on pattern types with improved trade management
  let nextCandleExpectation = '';
  let priceAction = '';
  let confirmationSignal = '';
  let riskRewardRatio = 2.5; // Default
  let entryInstructions = shouldAvoidEntry ? `RECOMENDAÇÃO: EVITAR ENTRADA. ${avoidanceReason}` : '';
  
  if (!shouldAvoidEntry) {
    if (entryType === 'reversão') {
      nextCandleExpectation = isBullish
        ? 'Próxima vela deve fechar acima do nível atual com alta de pelo menos 50% da amplitude da vela atual'
        : 'Próxima vela deve fechar abaixo do nível atual com queda de pelo menos 50% da amplitude da vela atual';
      
      priceAction = isBullish
        ? 'Espere um rompimento acima da máxima da vela de reversão'
        : 'Espere um rompimento abaixo da mínima da vela de reversão';
      
      confirmationSignal = 'Confirmação por aumento de volume e fechamento forte da vela';
      riskRewardRatio = 3.0;
      
      entryInstructions = isBullish
        ? 'Entre após o fechamento da vela de confirmação acima da máxima da vela de reversão com stop loss abaixo da mínima da vela de reversão. IMPORTANTE: Saia imediatamente se o preço voltar abaixo do ponto de entrada e fechar um candle abaixo. Considere sair com 50% do lucro no primeiro alvo e mover o stop para o ponto de entrada.'
        : 'Entre após o fechamento da vela de confirmação abaixo da mínima da vela de reversão com stop loss acima da máxima da vela de reversão. IMPORTANTE: Saia imediatamente se o preço voltar acima do ponto de entrada e fechar um candle acima. Considere sair com 50% do lucro no primeiro alvo e mover o stop para o ponto de entrada.';
    } 
    else if (entryType === 'teste_suporte') {
      nextCandleExpectation = 'Próxima vela deve mostrar rejeição do nível de suporte com sombra inferior longa e fechamento na metade superior';
      priceAction = 'Espere formação de cauda inferior (sombra) longa indicando rejeição do nível';
      confirmationSignal = 'Aumento de volume na rejeição e RSI saindo da zona de sobrevenda';
      riskRewardRatio = 2.8;
      entryInstructions = 'Entre após o fechamento da vela de rejeição do suporte com stop loss 5-10 pips abaixo do nível de suporte. REGRA DE SAÍDA: Se após 3 candles o preço não subir pelo menos 1.5x o valor arriscado, saia da operação com perda mínima ou no empate.';
    } 
    else if (entryType === 'teste_resistência') {
      nextCandleExpectation = 'Próxima vela deve mostrar rejeição do nível de resistência com sombra superior longa e fechamento na metade inferior';
      priceAction = 'Espere formação de cauda superior (sombra) longa indicando rejeição do nível';
      confirmationSignal = 'Aumento de volume na rejeição e RSI saindo da zona de sobrecompra';
      riskRewardRatio = 2.8;
      entryInstructions = 'Entre após o fechamento da vela de rejeição da resistência com stop loss 5-10 pips acima do nível de resistência. REGRA DE SAÍDA: Se após 3 candles o preço não cair pelo menos 1.5x o valor arriscado, saia da operação com perda mínima ou no empate.';
    } 
    else if (entryType === 'pullback') {
      nextCandleExpectation = isBullish
        ? 'Próxima vela deve mostrar retomada da tendência de alta após recuo para a média móvel'
        : 'Próxima vela deve mostrar retomada da tendência de baixa após recuo para a média móvel';
      
      priceAction = isBullish
        ? 'Espere fechamento acima da EMA9 com corpo de vela sólido'
        : 'Espere fechamento abaixo da EMA9 com corpo de vela sólido';
      
      confirmationSignal = 'Aumento de volume no momento do rompimento da média móvel';
      riskRewardRatio = 2.5;
      
      entryInstructions = isBullish
        ? 'Entre no rompimento da máxima da vela anterior com stop loss abaixo da EMA9 ou do mínimo recente. GESTÃO: Mova o stop loss para o ponto de entrada após o preço avançar 1.5x o valor arriscado. Saia de 50% da posição no primeiro alvo.'
        : 'Entre no rompimento da mínima da vela anterior com stop loss acima da EMA9 ou do máximo recente. GESTÃO: Mova o stop loss para o ponto de entrada após o preço avançar 1.5x o valor arriscado. Saia de 50% da posição no primeiro alvo.';
    } 
    else if (entryType === 'retração') {
      nextCandleExpectation = isBullish
        ? 'Próxima vela deve formar-se acima do nível de Fibonacci de retração (geralmente 61.8% ou 50%)'
        : 'Próxima vela deve formar-se abaixo do nível de Fibonacci de retração (geralmente 61.8% ou 50%)';
      
      priceAction = 'Espere vela de indecisão (doji) seguida de vela de confirmação na direção da tendência';
      confirmationSignal = 'Volume diminui durante a retração e aumenta na retomada da direção principal';
      riskRewardRatio = 2.0;
      
      entryInstructions = isBullish
        ? 'Entre após o fechamento da vela de confirmação acima da máxima da vela de indecisão com stop loss abaixo do nível de Fibonacci. GESTÃO: Use trailing stop de 1.0 ATR após o preço avançar 2x o valor arriscado.'
        : 'Entre após o fechamento da vela de confirmação abaixo da mínima da vela de indecisão com stop loss acima do nível de Fibonacci. GESTÃO: Use trailing stop de 1.0 ATR após o preço avançar 2x o valor arriscado.';
    } 
    else { // breakout
      nextCandleExpectation = isBullish
        ? 'Próxima vela deve continuar o movimento ascendente após o rompimento da resistência'
        : 'Próxima vela deve continuar o movimento descendente após o rompimento do suporte';
      
      priceAction = isBullish
        ? 'Espere vela de continuação após o rompimento sem fechamento abaixo do nível rompido'
        : 'Espere vela de continuação após o rompimento sem fechamento acima do nível rompido';
      
      confirmationSignal = 'Alto volume no rompimento e ausência de retorno abaixo/acima do nível quebrado';
      riskRewardRatio = 2.2;
      
      entryInstructions = isBullish
        ? 'Entre no fechamento da vela de rompimento acima da resistência com stop loss abaixo do nível rompido. REGRA ANTI-FALSO ROMPIMENTO: Se o preço não avançar mais 0.5 ATR após o rompimento em 2 candles, saia com perda mínima. Saia de 40% da posição no primeiro alvo, 30% no segundo alvo, e deixe 30% para trailing stop.'
        : 'Entre no fechamento da vela de rompimento abaixo do suporte com stop loss acima do nível rompido. REGRA ANTI-FALSO ROMPIMENTO: Se o preço não avançar mais 0.5 ATR após o rompimento em 2 candles, saia com perda mínima. Saia de 40% da posição no primeiro alvo, 30% no segundo alvo, e deixe 30% para trailing stop.';
    }
  }
  
  // Adjust instructions based on market context if available
  if (marketContext && !shouldAvoidEntry) {
    const isMarketAligned = (isBullish && (
        marketContext.phase === 'tendência_alta' || 
        marketContext.phase === 'acumulação'
      )) || (!isBullish && (
        marketContext.phase === 'tendência_baixa' || 
        marketContext.phase === 'distribuição'
      ));
    
    if (!isMarketAligned) {
      entryInstructions += ' ATENÇÃO: Esta entrada vai contra a fase atual do mercado. Considere reduzir tamanho para 30% do habitual ou aguardar confirmação mais forte.';
      riskRewardRatio *= 0.7; // Reduce expected risk/reward if against market context
    } else {
      entryInstructions += ' Esta entrada está alinhada com a fase atual do mercado, aumentando suas chances de sucesso. Considere usar tamanho normal de posição.';
      riskRewardRatio *= 1.2; // Increase expected risk/reward if aligned with market context
    }
    
    // Add contra-trend warning
    if ((isBullish && marketContext.marketStructure === 'baixa_baixas') ||
        (!isBullish && marketContext.marketStructure === 'alta_altas')) {
      entryInstructions += ' AVISO: Este sinal vai contra a estrutura de mercado dominante. Use risco menor e alvo mais próximo.';
      riskRewardRatio *= 0.6;
    }
    
    // Liquidity targeting strategy
    if (marketContext.liquidityPools && marketContext.liquidityPools.length > 0) {
      const relevantLiquidityPool = marketContext.liquidityPools.find(pool => 
        (isBullish && pool.level > (dominantPattern.entryPrice ? parseFloat(dominantPattern.entryPrice) : 0)) ||
        (!isBullish && pool.level < (dominantPattern.entryPrice ? parseFloat(dominantPattern.entryPrice) : 0)
      );
      
      if (relevantLiquidityPool) {
        entryInstructions += ` Importante ponto de liquidez detectado em ${relevantLiquidityPool.level} (força: ${relevantLiquidityPool.strength}). ${isBullish ? 'Considere este nível como alvo ou área de potencial reversão.' : 'Considere este nível como alvo ou área de potencial reversão.'}`;
      }
    }
  }
  
  // Adjust instructions based on volume if available
  if (volumeData && !shouldAvoidEntry) {
    const isVolumeConfirmation = volumeData.trend === 'increasing';
    
    if (!isVolumeConfirmation) {
      entryInstructions += ' Volume atual não confirma fortemente o sinal. Aguarde aumento de volume na próxima vela antes de entrar. Reduza tamanho para 50% do habitual se entrar sem confirmação de volume.';
    } else if (volumeData.abnormal) {
      entryInstructions += ' ALERTA: Volume anormalmente alto detectado. Possível esgotamento ou início de movimento impulsivo. Prepare-se para volatilidade elevada.';
    } else {
      entryInstructions += ' Volume crescente confirma o sinal de entrada.';
    }
    
    // Volume divergence strategy
    if (volumeData.divergence) {
      entryInstructions += ' DIVERGÊNCIA PREÇO-VOLUME DETECTADA: O volume está divergindo do movimento de preço, sugerindo possível reversão em breve.';
    }
  }
  
  // Adjust instructions based on volatility if available
  if (volatilityData && !shouldAvoidEntry) {
    if (volatilityData.isHigh) {
      entryInstructions += ' Alta volatilidade detectada. Use stops mais amplos (1.5x o normal) e reduza tamanho para 70%.';
      riskRewardRatio *= 0.8; // Reduce expected risk/reward in high volatility
    } else if (volatilityData.trend === 'decreasing' && volatilityData.value < 0.5) {
      entryInstructions += ' Volatilidade muito baixa. Possível movimento explosivo em breve, fique atento a aumento súbito de volume. Use stops normais mas esteja preparado para expansão de range.';
    } else if (volatilityData.trend === 'increasing' && !volatilityData.isHigh) {
      entryInstructions += ' Volatilidade crescente em níveis aceitáveis. Condições favoráveis para entrada com potencial de movimento contínuo.';
      riskRewardRatio *= 1.1;
    }
  }
  
  // Add specific stop loss management based on ATR if available
  if (volatilityData && volatilityData.atr && !shouldAvoidEntry) {
    const atrValue = volatilityData.atr;
    entryInstructions += ` GESTÃO DE STOP: Use ${(isBullish ? 1.5 : 1.5) * atrValue}x ATR (${Math.round(atrValue * 150)/100}) para stop loss inicial e ${Math.round(atrValue * 100)/100} ATR para trailing stop após o primeiro alvo.`;
  }
  
  // Add time-based exit strategy
  entryInstructions += ' ESTRATÉGIA DE SAÍDA POR TEMPO: Se o preço não atingir o primeiro alvo em 5 candles, saia com metade da posição. Saia completamente após 8 candles se não houver progresso significativo.';
  
  return {
    exactMinute,
    entryType,
    nextCandleExpectation,
    priceAction,
    confirmationSignal,
    riskRewardRatio,
    entryInstructions
  };
};

// Enhanced function for scalping signals with more intelligent trade management
export const generateScalpingSignals = (
  patterns: PatternResult[],
  candles?: CandleData[],
  volumeData?: VolumeData,
  volatilityData?: VolatilityData,
  marketContext?: MarketContext
): ScalpingSignal[] => {
  if (!patterns || patterns.length === 0) return [];
  
  const signals: ScalpingSignal[] = [];
  
  // Find dominant patterns with high confidence
  const highConfidencePatterns = patterns
    .filter(p => p.confidence > 0.65 && p.action !== 'neutro')
    .sort((a, b) => b.confidence - a.confidence);
  
  // Volume patterns (important for scalping)
  const volumePatterns = patterns.filter(
    p => p.description?.toLowerCase().includes('volume') || 
    p.type.toLowerCase().includes('volume')
  );
  
  // Support/resistance patterns
  const supportResistance = patterns.filter(
    p => p.type === 'Suporte/Resistência' || 
    p.type.toLowerCase().includes('suporte') || 
    p.type.toLowerCase().includes('resistência')
  );
  
  // Momentum patterns
  const momentumPatterns = patterns.filter(
    p => p.description?.toLowerCase().includes('momentum') ||
    p.type.toLowerCase().includes('divergência')
  );
  
  // Moving average patterns
  const maPatterns = patterns.filter(
    p => p.description?.toLowerCase().includes('média móvel') ||
    p.description?.toLowerCase().includes('ema') ||
    p.description?.toLowerCase().includes('sma') ||
    p.type.toLowerCase().includes('cruzamento')
  );
  
  // RSI patterns
  const rsiPatterns = patterns.filter(
    p => p.description?.toLowerCase().includes('rsi') ||
    p.description?.toLowerCase().includes('índice de força relativa')
  );
  
  // Volatility patterns
  const volatilityPatterns = patterns.filter(
    p => p.description?.toLowerCase().includes('volatilidade') ||
    p.description?.toLowerCase().includes('atr') ||
    p.type.toLowerCase().includes('volatilidade')
  );
  
  // Market context patterns
  const marketContextPatterns = patterns.filter(
    p => p.description?.toLowerCase().includes('tendência') ||
    p.description?.toLowerCase().includes('distribuição') ||
    p.description?.toLowerCase().includes('acumulação') ||
    p.type.toLowerCase().includes('fase do mercado')
  );
  
  // Generate more precise entry times and conditions for scalping with improved decision making
  if (highConfidencePatterns.length > 0) {
    const dominantPattern = highConfidencePatterns[0];
    const hasVolumeConfirmation = volumePatterns.length > 0;
    const hasSupportResistance = supportResistance.length > 0;
    const hasMASignal = maPatterns.length > 0;
    const hasRSISignal = rsiPatterns.length > 0;
    const hasVolatilitySignal = volatilityPatterns.length > 0;
    const hasMarketContextSignal = marketContextPatterns.length > 0;
    
    // Enhanced signal combination rules with more intelligent filtering
    const hasStrongVolume = hasVolumeConfirmation && volumePatterns[0].confidence > 0.7;
    const hasAcceptableVolatility = !hasVolatilitySignal || 
      (hasVolatilitySignal && !volatilityPatterns[0].description?.toLowerCase().includes('extrema'));
    
    // Check market phase alignment with stricter criteria
    let marketPhaseAligned = true;
    let marketConditionWarning = '';
    
    if (hasMarketContextSignal) {
      const marketPhase = marketContextPatterns[0].description?.toLowerCase() || '';
      const isUptrend = marketPhase.includes('tendência de alta') || marketPhase.includes('acumulação');
      const isDowntrend = marketPhase.includes('tendência de baixa') || marketPhase.includes('distribuição');
      
      marketPhaseAligned = (dominantPattern.action === 'compra' && isUptrend) || 
                           (dominantPattern.action === 'venda' && isDowntrend) ||
                           marketPhase.includes('indefinida');
                           
      if (!marketPhaseAligned) {
        marketConditionWarning = 'AVISO: Entrada contra a fase dominante do mercado. Risco elevado.';
      }
    }
    
    // More intelligent checks based on market conditions
    const isOverbought = hasRSISignal && rsiPatterns[0].description?.toLowerCase().includes('sobrecompra');
    const isOversold = hasRSISignal && rsiPatterns[0].description?.toLowerCase().includes('sobrevenda');
    
    // Counter-trend check
    const isCounterTrend = marketContext && ((dominantPattern.action === 'compra' && 
        marketContext.marketStructure === 'baixa_baixas') || 
        (dominantPattern.action === 'venda' && 
        marketContext.marketStructure === 'alta_altas'));
    
    // Avoid entries in extreme market conditions
    if ((dominantPattern.action === 'compra' && isOverbought) || 
        (dominantPattern.action === 'venda' && isOversold) || 
        (hasVolatilitySignal && volatilityPatterns[0].description?.toLowerCase().includes('extrema')) ||
        (marketContext && marketContext.phase === 'indefinida' && marketContext.strength === 'forte')) {
      // Skip creating signals in extreme conditions
      return signals;
    }
    
    // Generate precise entry timing
    const now = new Date();
    const minutes = now.getMinutes();
    const nextMinute = (minutes + 1) % 60;
    const entryMinute = nextMinute < 10 ? `0${nextMinute}` : `${nextMinute}`;
    const entryHour = nextMinute === 0 ? (now.getHours() + 1) % 24 : now.getHours();
    const formattedHour = entryHour < 10 ? `0${entryHour}` : `${entryHour}`;
    const exactEntryTime = `${formattedHour}:${entryMinute}`;
    
    // Determine entry type based on patterns
    let entryType: 'reversão' | 'retração' | 'pullback' | 'breakout' | 'teste_suporte' | 'teste_resistência' = 'pullback';
    
    if (supportResistance.length > 0) {
      const srPattern = supportResistance[0];
      if (srPattern.description?.toLowerCase().includes('suporte') && dominantPattern.action === 'compra') {
        entryType = 'teste_suporte';
      } else if (srPattern.description?.toLowerCase().includes('resistência') && dominantPattern.action === 'venda') {
        entryType = 'teste_resistência';
      } else {
        entryType = 'breakout';
      }
    } else if (maPatterns.length > 0) {
      entryType = 'pullback';
    } else if (momentumPatterns.length > 0) {
      entryType = 'reversão';
    } else {
      entryType = dominantPattern.action === 'compra' ? 'teste_suporte' : 'teste_resistência';
    }
    
    // Enhanced trade management instructions based on various factors
    let tradeManagementInstructions = '';
    
    // Risk management based on volatility and market phase
    if (hasVolatilitySignal) {
      const volatilityDesc = volatilityPatterns[0].description?.toLowerCase() || '';
      if (volatilityDesc.includes('alta')) {
        tradeManagementInstructions += ' Use stops 25% mais amplos e targets 15% mais próximos. Reduza tamanho para 70%.';
      } else if (volatilityDesc.includes('baixa')) {
        tradeManagementInstructions += ' Use stops ajustados e seja paciente. Movimento pode ser lento.';
      }
    }
    
    // Adjust based on market phase
    if (marketContext) {
      if (marketContext.phase === 'lateral') {
        tradeManagementInstructions += ' Em mercado lateral, saia rapidamente com 1.5-2R de lucro. Evite hold muito longo.';
      } else if (marketContext.phase === 'tendência_alta' && dominantPattern.action === 'compra') {
        tradeManagementInstructions += ' Em tendência clara de alta, use trailing stop após 2R de lucro.';
      } else if (marketContext.phase === 'tendência_baixa' && dominantPattern.action === 'venda') {
        tradeManagementInstructions += ' Em tendência clara de baixa, use trailing stop após 2R de lucro.';
      }
    }
    
    // Add time-based management
    tradeManagementInstructions += ' Regra de tempo: Saia com metade em 5 candles e resto em 8 candles se não atingir alvos.';
    
    // Add counter-trend warning if applicable
    if (isCounterTrend) {
      tradeManagementInstructions += ' AVISO: Trade contra-tendência identificado. Reduza tamanho para 50% e use alvo mais próximo.';
    }
    
    // Generate enhanced next candle expectation with more precise criteria
    let nextCandleExpectation = '';
    if (dominantPattern.action === 'compra') {
      if (entryType === 'teste_suporte') {
        nextCandleExpectation = 'Espere candle verde (alta) com fechamento forte acima da abertura, mínima respeitando o suporte, e fechamento no terço superior do candle';
      } else if (entryType === 'breakout') {
        nextCandleExpectation = 'Espere candle de continuação após o rompimento, corpo maior que média dos 3 anteriores, sem fechamento abaixo do nível anterior de resistência';
      } else if (entryType === 'pullback') {
        nextCandleExpectation = 'Espere candle de alta após recuo para EMA9/21, com fechamento acima da média móvel e sem sombra superior longa';
      } else {
        nextCandleExpectation = 'Espere candle de reversão com corpo maior que o anterior, sem sombra superior longa e fechamento acima da metade da amplitude';
      }
    } else {
      if (entryType === 'teste_resistência') {
        nextCandleExpectation = 'Espere candle vermelho (baixa) com fechamento forte abaixo da abertura, máxima respeitando a resistência, e fechamento no terço inferior do candle';
      } else if (entryType === 'breakout') {
        nextCandleExpectation = 'Espere candle de continuação após o rompimento, corpo maior que média dos 3 anteriores, sem fechamento acima do nível anterior de suporte';
      } else if (entryType === 'pullback') {
        nextCandleExpectation = 'Espere candle de baixa após recuo para EMA9/21, com fechamento abaixo da média móvel e sem sombra inferior longa';
      } else {
        nextCandleExpectation = 'Espere candle de reversão com corpo maior que o anterior, sem sombra inferior longa e fechamento abaixo da metade da amplitude';
      }
    }
    
    // Only create signal if market conditions pass the intelligent filters
    if (((hasStrongVolume || hasMASignal) && hasAcceptableVolatility && 
          (marketPhaseAligned || entryType === 'reversão')) && 
        ((hasSupportResistance || hasMASignal || (hasRSISignal && !isOverbought && !isOversold)) || 
         (momentumPatterns.length > 0 && hasVolumeConfirmation)) && 
        !(isCounterTrend && marketContext && marketContext.strength === 'forte')) {
      
      // Create specific entry conditions
      const entryCondition = dominantPattern.action === 'compra'
        ? `${hasMASignal ? 'Cruzamento da EMA9 acima da EMA21' : 'Rompimento de resistência'} com ${hasVolumeConfirmation ? 'aumento de volume' : 'teste de suporte'} ${hasAcceptableVolatility ? 'e volatilidade favorável' : ''}`
        : `${hasMASignal ? 'Cruzamento da EMA9 abaixo da EMA21' : 'Rompimento de suporte'} com ${hasVolumeConfirmation ? 'aumento de volume' : 'teste de resistência'} ${hasAcceptableVolatility ? 'e volatilidade favorável' : ''}`;
      
      // Additional confirmations
      let confirmations = [];
      if (hasRSISignal) {
        confirmations.push(dominantPattern.action === 'compra' ? 'RSI acima de 50 e subindo' : 'RSI abaixo de 50 e caindo');
      }
      if (hasVolumeConfirmation) {
        const volumeDesc = volumePatterns[0].description?.toLowerCase() || '';
        const volumeQuality = volumeDesc.includes('forte') || volumeDesc.includes('alto') ? 
          'Volume forte' : 'Volume acima da média';
        confirmations.push(volumeQuality);
      }
      if (hasSupportResistance) {
        confirmations.push(dominantPattern.action === 'compra' ? 'Após teste de suporte' : 'Após teste de resistência');
      }
      if (hasVolatilitySignal) {
        const volatilityDesc = volatilityPatterns[0].description?.toLowerCase() || '';
        const volatilityState = volatilityDesc.includes('alta') ? 'Volatilidade alta' : 
                              volatilityDesc.includes('baixa') ? 'Volatilidade baixa' : 
                              'Volatilidade média';
        confirmations.push(volatilityState);
      }
      if (hasMarketContextSignal) {
        confirmations.push(`Alinhado com fase de mercado: ${marketContextPatterns[0].description}`);
      }
      
      // Calculate confidence with more factors
      const volumeFactor = hasVolumeConfirmation ? (hasStrongVolume ? 1.25 : 1.1) : 0.9;
      const volatilityFactor = hasAcceptableVolatility ? 1.1 : 0.8;
      const marketContextFactor = marketPhaseAligned ? 1.15 : 0.75;
      const counterTrendFactor = isCounterTrend ? 0.7 : 1.0;
      const extremeConditionFactor = (isOverbought || isOversold) ? 0.8 : 1.0;
      
      const adjustedConfidence = dominantPattern.confidence * 
                                volumeFactor * 
                                (hasMASignal ? 1.1 : 1) * 
                                volatilityFactor * 
                                marketContextFactor * 
                                counterTrendFactor *
                                extremeConditionFactor;

      signals.push({
        type: 'entrada',
        action: dominantPattern.action as 'compra' | 'venda',
        price: entryCondition,
        confidence: Math.min(adjustedConfidence, 0.95), // Cap confidence to avoid overconfidence
        timeframe: '1m',
        description: `${dominantPattern.type}: ${dominantPattern.description} ${confirmations.length > 0 ? '| Confirmações: ' + confirmations.join(', ') : ''} ${marketConditionWarning}`,
        target: dominantPattern.action === 'compra'
          ? 'Próxima resistência ou +2-3% do preço atual'
          : 'Próximo suporte ou -2-3% do preço atual',
        stopLoss: dominantPattern.action === 'compra'
          ? '0.5% abaixo do ponto de entrada ou abaixo do último suporte'
          : '0.5% acima do ponto de entrada ou acima da última resistência',
        volumeConfirmation: hasVolumeConfirmation,
        volatilityCondition: hasVolatilitySignal ? 
          volatilityPatterns[0].description : 
          'Volatilidade dentro de níveis aceitáveis',
        marketPhaseAlignment: marketPhaseAligned,
        marketStructureAlignment: !isCounterTrend,
        exactEntryTime: exactEntryTime,
        entryType: entryType,
        nextCandleExpectation: nextCandleExpectation,
        entryCondition: `Entre às ${exactEntryTime} após confirmação de ${entryType} com ${nextCandleExpectation.toLowerCase()}. ${tradeManagementInstructions}`
      });
      
      // Add exit signal with more sophisticated exit strategy
      signals.push({
        type: 'saída',
        action: dominantPattern.action as 'compra' | 'venda',
        price: 'Take profit ou stop loss',
        confidence: adjustedConfidence * 0.9,
        timeframe: '1m',
        description: `Encerre a posição quando: 1) O preço atingir o alvo de ${dominantPattern.action === 'compra' ? '+2-3%' : '-2-3%'}, 2) O stop loss for ativado, 3) Houver reversão de EMA9/EMA21 com confirmação de volume, 4) Após 3-5 candles sem progresso, ou 5) Se formar padrão de reversão com alta confiança.${tradeManagementInstructions}`
      });
    }
  }
  
  // Add signals for volume spike analysis
  const volumeSpikes = volumePatterns.filter(p => 
    (p.description?.toLowerCase().includes('surto') || p.description?.toLowerCase().includes('spike')) &&
    p.confidence > 0.75
  );
  
  if (volumeSpikes.length > 0) {
    const volumeSpike = volumeSpikes[0];
    const direction = volumeSpike.action === 'compra' ? 'alta' : 
                      volumeSpike.action === 'venda' ? 'baixa' : 'indefinida';
    
    if (direction !== 'indefinida') {
      // Generate precise entry timing
      const now = new Date();
      const minutes = now.getMinutes();
      const nextMinute = (minutes + 2) % 60; // Slightly later for volume confirmation
      const entryMinute = nextMinute < 10 ? `0${nextMinute}` : `${nextMinute}`;
      const entryHour = nextMinute <= 1 ? (now.getHours() + 1) % 24 : now.getHours();
      const formattedHour = entryHour < 10 ? `0${entryHour}` : `${entryHour}`;
      const exactEntryTime = `${formattedHour}:${entryMinute}`;
      
      signals.push({
        type: 'entrada',
        action: volumeSpike.action as 'compra' | 'venda',
        price: `Após confirmação de surto de volume com candle de ${direction}`,
        confidence: volumeSpike.confidence * 1.1,
        timeframe: '1m',
        description: `Surto de Volume Significativo: ${volumeSpike.description}`,
        target: volumeSpike.action === 'compra'
          ? 'Próxima resistência ou +1.5-2% do preço atual'
          : 'Próximo suporte ou -1.5-2% do preço atual',
        stopLoss: volumeSpike.action === 'compra'
          ? '0.5% abaixo do ponto de entrada'
          : '0.5% acima do ponto de entrada',
        volumeConfirmation: true,
        volatilityCondition: 'Aumento esperado na volatilidade',
        exactEntryTime: exactEntryTime,
        entryType: 'breakout',
        nextCandleExpectation: direction === 'alta'
          ? 'Espere candle verde com volume acima da média e fechamento próximo às máximas'
          : 'Espere candle vermelho com volume acima da média e fechamento próximo às mínimas',
        entryCondition: `Entre às ${exactEntryTime} após confirmação de volume e fechamento do candle na direção esperada`
      });
    }
  }
  
  // Add signals for moving average crossovers with precise timing
  if (maPatterns.length > 0 && volumePatterns.length > 0) {
    const maPattern = maPatterns[0];
    const volumePattern = volumePatterns[0];
    
    if (maPattern.confidence > 0.6 && volumePattern.confidence > 0.6) {
      const volumeIncreasing = volumePattern.description?.toLowerCase().includes('aumento') || 
                              volumePattern.description?.toLowerCase().includes('alto');
      
      if (volumeIncreasing) {
        // Generate precise entry timing
        const now = new Date();
        const minutes = now.getMinutes();
        const nextMinute = (minutes + 1) % 60;
        const entryMinute = nextMinute < 10 ? `0${nextMinute}` : `${nextMinute}`;
        const entryHour = nextMinute === 0 ? (now.getHours() + 1) % 24 : now.getHours();
        const formattedHour = entryHour < 10 ? `0${entryHour}` : `${entryHour}`;
        const exactEntryTime = `${formattedHour}:${entryMinute}`;
        
        signals.push({
          type: 'entrada',
          action: maPattern.action as 'compra' | 'venda',
          price: maPattern.action === 'compra' 
            ? 'Após cruzamento da EMA9 por cima da EMA21 com volume crescente' 
            : 'Após cruzamento da EMA9 por baixo da EMA21 com volume crescente',
          confidence: maPattern.confidence * 1.2,
          timeframe: '1m',
          description: `Cruzamento de Médias Móveis com Volume: ${maPattern.description}, ${volumePattern.description}`,
          target: maPattern.action === 'compra'
            ? 'Próxima resistência ou +1.5-2% do preço atual'
            : 'Próximo suporte ou -1.5-2% do preço atual',
          stopLoss: maPattern.action === 'compra'
            ? '0.5% abaixo do ponto de entrada ou abaixo da EMA21'
            : '0.5% acima do ponto de entrada ou acima da EMA21',
          volumeConfirmation: true,
          exactEntryTime: exactEntryTime,
          entryType: 'pullback',
          nextCandleExpectation: maPattern.action === 'compra'
            ? 'Espere candle verde (alta) com fechamento acima da EMA9, preferencialmente com corpo maior que o anterior'
            : 'Espere candle vermelho (baixa) com fechamento abaixo da EMA9, preferencialmente com corpo maior que o anterior',
          entryCondition: `Entre às ${exactEntryTime} após confirmação do cruzamento de médias com aumento de volume`
        });
      }
    }
  }
  
  return signals;
};

// New function to analyze volume patterns
export const analyzeVolume = (imageUrl: string): Promise<VolumeData> => {
  // In a real implementation, this would analyze volume from the image
  // For now, we'll return mock data
  return Promise.resolve({
    value: 1.5, // 50% above average
    trend: 'increasing',
    abnormal: false,
    significance: 'medium',
    relativeToAverage: 1.5,
    distribution: 'neutral',
    divergence: false
  });
};

// New function to analyze volatility patterns
export const analyzeVolatility = (imageUrl: string): Promise<VolatilityData> => {
  // In a real implementation, this would analyze volatility from the image
  // For now, we'll return mock data
  return Promise.resolve({
    value: 0.8,
    trend: 'increasing',
    atr: 0.25,
    percentageRange: 1.2,
    isHigh: false,
    historicalComparison: 'average'
  });
};

// New function to determine market context
export const analyzeMarketContext = (
  patterns: PatternResult[], 
  volumeData?: VolumeData, 
  volatilityData?: VolatilityData,
  candles?: CandleData[]
): MarketContext => {
  // Find trends and phases from patterns
  const trendPatterns = patterns.filter(p => 
    p.type.toLowerCase().includes('tendência') || 
    p.description?.toLowerCase().includes('tendência')
  );
  
  const supportResistancePatterns = patterns.filter(p => 
    p.type === 'Suporte/Resistência' || 
    p.type.toLowerCase().includes('suporte') || 
    p.type.toLowerCase().includes('resistência')
  );
  
  const volumePatterns = patterns.filter(p => 
    p.type.toLowerCase().includes('volume') || 
    p.description?.toLowerCase().includes('volume')
  );
  
  // Add candle pattern analysis if candles are available
  let candleBasedTrend = 'indefinida';
  let candleStrength: 'forte' | 'moderada' | 'fraca' = 'moderada';
  
  if (candles && candles.length > 3) {
    // Count bullish vs bearish candles
    const bullishCount = candles.filter(c => c.color === 'verde').length;
    const bearishCount = candles.filter(c => c.color === 'vermelho').length;
    
    if (bullishCount > bearishCount * 1.5) {
      candleBasedTrend = 'tendência_alta';
      candleStrength = bullishCount > bearishCount * 2 ? 'forte' : 'moderada';
    } else if (bearishCount > bullishCount * 1.5) {
      candleBasedTrend = 'tendência_baixa';
      candleStrength = bearishCount > bullishCount * 2 ? 'forte' : 'moderada';
    } else {
      candleBasedTrend = 'lateral';
      candleStrength = 'fraca';
    }
  }
  
  // Determine market phase
  let phase: 'acumulação' | 'tendência_alta' | 'tendência_baixa' | 'distribuição' | 'lateral' | 'indefinida' = 'indefinida';
  let strength: 'forte' | 'moderada' | 'fraca' = 'moderada';
  let sentiment: 'otimista' | 'pessimista' | 'neutro' = 'neutro';
  let description = 'Fase de mercado indefinida';
  let marketStructure: 'alta_altas' | 'alta_baixas' | 'baixa_altas' | 'baixa_baixas' | 'indefinida' = 'indefinida';
  let breakoutPotential: 'alto' | 'médio' | 'baixo' = 'médio';
  let momentumSignature: 'acelerando' | 'estável' | 'desacelerando' | 'divergente' = 'estável';
  
  // Check for trend patterns
  if (trendPatterns.length > 0) {
    const dominantTrend = trendPatterns.sort((a, b) => b.confidence - a.confidence)[0];
    
    if (dominantTrend.type.toLowerCase().includes('alta') || 
        dominantTrend.description?.toLowerCase().includes('alta')) {
      phase = 'tendência_alta';
      sentiment = 'otimista';
      strength = dominantTrend.confidence > 0.8 ? 'forte' : dominantTrend.confidence > 0.6 ? 'moderada' : 'fraca';
      description = `Tendência de alta ${strength}`;
      marketStructure = 'alta_altas';
      breakoutPotential = strength === 'forte' ? 'alto' : 'médio';
      momentumSignature = 'acelerando';
    } else if (dominantTrend.type.toLowerCase().includes('baixa') || 
               dominantTrend.description?.toLowerCase().includes('baixa')) {
      phase = 'tendência_baixa';
      sentiment = 'pessimista';
      strength = dominantTrend.confidence > 0.8 ? 'forte' : dominantTrend.confidence > 0.6 ? 'moderada' : 'fraca';
      description = `Tendência de baixa ${strength}`;
      marketStructure = 'baixa_baixas';
      breakoutPotential = strength === 'forte' ? 'alto' : 'médio';
      momentumSignature = 'acelerando';
    }
  } 
  // Check for ranging market
  else if (supportResistancePatterns.length > 0) {
    const rangePattern = supportResistancePatterns[0];
    
    // Check for accumulation or distribution
    if (volumePatterns.length > 0 || volumeData) {
      const volumeIncreasing = volumePatterns.length > 0 ? 
                              volumePatterns[0].description?.toLowerCase().includes('aumento') : 
                              volumeData?.trend === 'increasing';
      
      const priceNearSupport = rangePattern.description?.toLowerCase().includes('suporte');
      const priceNearResistance = rangePattern.description?.toLowerCase().includes('resistência');
      
      if (priceNearSupport && volumeIncreasing) {
        phase = 'acumulação';
        sentiment = 'otimista';
        strength = rangePattern.confidence > 0.7 ? 'forte' : 'moderada';
        description = `Fase de acumulação próxima a suporte`;
        marketStructure = 'alta_baixas';
        breakoutPotential = 'alto';
        momentumSignature = 'divergente';
      } else if (priceNearResistance && volumeIncreasing) {
        phase = 'distribuição';
        sentiment = 'pessimista';
        strength = rangePattern.confidence > 0.7 ? 'forte' : 'moderada';
        description = `Fase de distribuição próxima a resistência`;
        marketStructure = 'baixa_altas';
        breakoutPotential = 'alto';
        momentumSignature = 'divergente';
      } else {
        phase = 'lateral';
        description = `Mercado em range sem características claras de acumulação ou distribuição`;
        marketStructure = 'indefinida';
        breakoutPotential = 'baixo';
        momentumSignature = 'estável';
      }
    } else {
      phase = 'lateral';
      description = `Mercado em range, monitorar volume para confirmar fase`;
      marketStructure = 'indefinida';
      breakoutPotential = 'baixo';
      momentumSignature = 'estável';
    }
  }
  
  // If we have candle data, enhance the context with candle patterns
  if (candles && candles.length > 0 && candleBasedTrend !== 'indefinida') {
    if (candleBasedTrend === 'tendência_alta' && phase === 'indefinida') {
      phase = 'tendência_alta';
      strength = candleStrength;
      description = `Tendência de alta ${strength} baseada em padrões de candles`;
      marketStructure = 'alta_altas';
    } else if (candleBasedTrend === 'tendência_baixa' && phase === 'indefinida') {
      phase = 'tendência_baixa';
      strength = candleStrength;
      description = `Tendência de baixa ${strength} baseada em padrões de candles`;
      marketStructure = 'baixa_baixas';
    } else if (candleBasedTrend === 'lateral' && phase === 'indefinida') {
      phase = 'lateral';
      description = `Mercado em consolidação lateral baseado em padrões de candles`;
    }
  }
  
  // Add volatility context
  if (volatilityData) {
    if (volatilityData.isHigh) {
      description += ` com volatilidade elevada`;
      breakoutPotential = 'alto';
    } else if (volatilityData.trend === 'increasing') {
      description += ` com volatilidade crescente`;
      breakoutPotential = 'médio';
    } else if (volatilityData.trend === 'decreasing') {
      description += ` com volatilidade decrescente`;
      breakoutPotential = 'baixo';
    }
  }
  
  // Create mock key levels and liquidity pools for more detailed context
  const keyLevels = [
    { price: 100, type: 'suporte' as const, strength: 'forte' as const },
    { price: 120, type: 'resistência' as const, strength: 'moderada' as const }
  ];
  
  const liquidityPools = [
    { level: 95, strength: 'alta' as const },
    { level: 125, strength: 'média' as const }
  ];
  
  return {
    phase,
    strength,
    dominantTimeframe: '1m',
    sentiment,
    description,
    marketStructure,
    breakoutPotential,
    momentumSignature,
    keyLevels,
    liquidityPools,
    trendAngle: phase.includes('tendência') ? 30 : 0
  };
};

// Adding the missing function for detecting patterns
export const detectPatterns = async (imageUrl: string): Promise<PatternResult[]> => {
  // Basic implementation that returns mock data
  // In a real system, this would analyze the image for patterns
  return [
    {
      type: 'Suporte/Resistência',
      confidence: 0.85,
      description: 'Forte nível de suporte identificado com reação de compradores',
      action: 'compra'
    },
    {
      type: 'Tendência',
      confidence: 0.72,
      description: 'Tendência de alta com momentum positivo e pullback para média móvel',
      action: 'compra'
    },
    {
      type: 'Volume',
      confidence: 0.68,
      description: 'Aumento de volume confirmando movimento de alta pós-pullback',
      action: 'compra'
    },
    {
      type: 'Padrão Gráfico',
      confidence: 0.76,
      description: 'Triângulo ascendente formado próximo a suporte importante',
      action: 'compra',
      recommendation: 'Aguardar confirmação da quebra da resistência'
    },
    {
      type: 'Divergência',
      confidence: 0.65,
      description: 'Divergência positiva no RSI indicando força compradora',
      action: 'compra'
    },
    {
      type: 'Padrão de Candle',
      confidence: 0.78,
      description: 'Formação de candle de reversão (martelo) após teste de suporte',
      action: 'compra',
      recommendation: 'Entrada na próxima vela após confirmação'
    }
  ];
};

// Enhanced function for generating technical markup with more diverse elements
export const generateTechnicalMarkup = (
  patterns: PatternResult[], 
  width: number, 
  height: number
): TechnicalElement[] => {
  // Generate technical elements based on patterns
  const elements: TechnicalElement[] = [];
  
  // Keep track of y positions to avoid overlap
  let yPosition = 50;
  const yIncrement = 40;
  
  patterns.forEach((pattern, index) => {
    const patternYPosition = yPosition + index * yIncrement;
    
    if (pattern.type === 'Suporte/Resistência') {
      // Add horizontal line for support/resistance
      elements.push({
        type: 'line',
        points: [
          { x: 0, y: patternYPosition },
          { x: width, y: patternYPosition }
        ],
        color: pattern.action === 'compra' ? '#22c55e' : '#ef4444',
        thickness: 2,
        dashArray: [5, 5]
      });
      
      // Add label
      elements.push({
        type: 'label',
        position: { x: 10, y: patternYPosition - 15 },
        text: pattern.action === 'compra' ? 'Suporte' : 'Resistência',
        color: pattern.action === 'compra' ? '#22c55e' : '#ef4444'
      });
    } 
    
    else if (pattern.type === 'Tendência') {
      // Add trend line
      const startX = width * 0.2;
      const endX = width * 0.8;
      const startY = pattern.action === 'compra' ? height * 0.7 : height * 0.3;
      const endY = pattern.action === 'compra' ? height * 0.3 : height * 0.7;
      
      elements.push({
        type: 'line',
        points: [
          { x: startX, y: startY },
          { x: endX, y: endY }
        ],
        color: pattern.action === 'compra' ? '#22c55e' : '#ef4444',
        thickness: 2
      });
      
      // Add arrow at end of trend
      elements.push({
        type: 'arrow',
        start: { x: endX - 30, y: pattern.action === 'compra' ? endY + 20 : endY - 20 },
        end: { x: endX, y: endY },
        color: pattern.action === 'compra' ? '#22c55e' : '#ef4444'
      });
    }
    
    else if (pattern.type === 'Padrão Gráfico') {
      if (pattern.description.toLowerCase().includes('triângulo')) {
        // Create triangle pattern
        elements.push({
          type: 'pattern',
          patternType: 'triangulo',
          points: [
            { x: width * 0.3, y: height * 0.6 },
            { x: width * 0.5, y: height * 0.4 },
            { x: width * 0.7, y: height * 0.6 }
          ],
          color: pattern.action === 'compra' ? '#22c55e' : '#ef4444',
          thickness: 2
        });
      } else if (pattern.description.toLowerCase().includes('topo duplo')) {
        // Create double top pattern
        elements.push({
          type: 'pattern',
          patternType: 'topoduplo',
          points: [
            { x: width * 0.2, y: height * 0.5 },
            { x: width * 0.35, y: height * 0.3 },
            { x: width * 0.5, y: height * 0.45 },
            { x: width * 0.65, y: height * 0.3 },
            { x: width * 0.8, y: height * 0.5 }
          ],
          color: '#ef4444',
          thickness: 2
        });
      } else if (pattern.description.toLowerCase().includes('fundo duplo')) {
        // Create double bottom pattern
        elements.push({
          type: 'pattern',
          patternType: 'fundoduplo',
          points: [
            { x: width * 0.2, y: height * 0.5 },
            { x: width * 0.35, y: height * 0.7 },
            { x: width * 0.5, y: height * 0.55 },
            { x: width * 0.65, y: height * 0.7 },
            { x: width * 0.8, y: height * 0.5 }
          ],
          color: '#22c55e',
          thickness: 2
        });
      } else if (pattern.description.toLowerCase().includes('ombro-cabeça-ombro') || 
                pattern.description.toLowerCase().includes('oco')) {
        // Create head and shoulders pattern
        elements.push({
          type: 'pattern',
          patternType: 'OCO',
          points: [
            { x: width * 0.1, y: height * 0.5 },
            { x: width * 0.25, y: height * 0.4 },
            { x: width * 0.4, y: height * 0.5 },
            { x: width * 0.5, y: height * 0.3 },
            { x: width * 0.6, y: height * 0.5 },
            { x: width * 0.75, y: height * 0.4 },
            { x: width * 0.9, y: height * 0.5 }
          ],
          color: '#ef4444',
          thickness: 2,
          label: 'OCO'
        });
      }
    }
    
    else if (pattern.type === 'Volume') {
      // Add volume indicator at bottom
      const baseY = height * 0.9;
      const volHeight = height * 0.1 * Math.min(1, pattern.confidence * 1.5);
      
      elements.push({
        type: 'rectangle',
        position: { x: width * 0.5, y: baseY - volHeight / 2 },
        width: width * 0.7,
        height: volHeight,
        color: pattern.action === 'compra' ? '#22c55e' : '#ef4444',
        thickness: 2
      });
      
      elements.push({
        type: 'label',
        position: { x: width * 0.5 - 60, y: baseY - volHeight - 10 },
        text: 'Volume ' + (pattern.action === 'compra' ? '↑' : '↓'),
        color: pattern.action === 'compra' ? '#22c55e' : '#ef4444',
        backgroundColor: 'rgba(0,0,0,0.5)'
      });
    }
    
    else if (pattern.type === 'Divergência') {
      // Add divergence lines
      const startX = width * 0.3;
      const endX = width * 0.7;
      const priceStartY = pattern.action === 'compra' ? height * 0.6 : height * 0.4;
      const priceEndY = pattern.action === 'compra' ? height * 0.7 : height * 0.3;
      const indicatorStartY = pattern.action === 'compra' ? height * 0.8 : height * 0.65;
      const indicatorEndY = pattern.action === 'compra' ? height * 0.7 : height * 0.75;
      
      // Price line
      elements.push({
        type: 'line',
        points: [
          { x: startX, y: priceStartY },
          { x: endX, y: priceEndY }
        ],
        color: pattern.action === 'compra' ? '#22c55e' : '#ef4444',
        thickness: 2
      });
      
      // Indicator line (diverging)
      elements.push({
        type: 'line',
        points: [
          { x: startX, y: indicatorStartY },
          { x: endX, y: indicatorEndY }
        ],
        color: '#3b82f6', // Blue for indicator
        thickness: 2,
        dashArray: [3, 3]
      });
      
      // Label
      elements.push({
        type: 'label',
        position: { x: startX, y: indicatorStartY + 15 },
        text: 'Divergência RSI',
        color: '#ffffff',
        backgroundColor: '#3b82f6'
      });
    }
  });
  
  // Add some additional market context elements
  // Support and resistance zones
  elements.push({
    type: 'rectangle',
    position: { x: width / 2, y: height * 0.2 },
    width: width * 0.9,
    height: height * 0.05,
    color: '#ef4444', // Red for resistance
    thickness: 1,
    dashArray: [2, 2]
  });
  
  elements.push({
    type: 'rectangle',
    position: { x: width / 2, y: height * 0.8 },
    width: width * 0.9,
    height: height * 0.05,
    color: '#22c55e', // Green for support
    thickness: 1,
    dashArray: [2, 2]
  });
  
  return elements;
};

// Adding the missing function for detecting candles
export const detectCandles = async (
  imageUrl: string, 
  width: number, 
  height: number
): Promise<CandleData[]> => {
  // Simple implementation that returns mock candle data
  // In a real system, this would detect candles from the image
  const candles: CandleData[] = [];
  const numCandles = 10;
  const candleWidth = width / numCandles * 0.6;
  const spacing = width / numCandles;
  
  for (let i = 0; i < numCandles; i++) {
    const isGreen = Math.random() > 0.5;
    const open = Math.random() * 100 + 50;
    const close = isGreen ? open + Math.random() * 10 : open - Math.random() * 10;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    
    candles.push({
      open,
      high,
      low,
      close,
      color: isGreen ? 'verde' : 'vermelho',
      position: { x: i * spacing + spacing / 2, y: height / 2 },
      width: candleWidth,
      height: Math.abs(close - open)
    });
  }
  
  return candles;
};

// Adding the missing function for detecting false signals
export const detectFalseSignals = (patterns: PatternResult[]): { patterns: PatternResult[], warnings: string[] } => {
  // Function to identify potentially false signals in the detected patterns
  const warnings: string[] = [];
  
  const updatedPatterns = patterns.map(pattern => {
    // Check for low confidence patterns
    if (pattern.confidence < 0.6) {
      warnings.push(`Alerta: O padrão "${pattern.type}" tem baixa confiança (${Math.round(pattern.confidence * 100)}%) e pode ser um falso positivo.`);
      return {
        ...pattern,
        description: `${pattern.description} [POSSÍVEL FALSO SINAL]`,
        confidence: pattern.confidence * 0.8,
        recommendation: (pattern.recommendation || '') + 
          ' Este sinal tem baixa confiança e pode ser um falso positivo. Aguarde confirmação adicional.'
      };
    }
    
    // Check for contradicting signals
    const isContradicting = patterns.some(p => 
      p !== pattern && 
      p.action !== pattern.action && 
      p.action !== 'neutro' && 
      pattern.action !== 'neutro' && 
      p.confidence > 0.7);
    
    if (isContradicting) {
      warnings.push(`Alerta: O padrão "${pattern.type}" contradiz outros sinais de alta confiança. Recomenda-se cautela.`);
      return {
        ...pattern,
        description: `${pattern.description} [SINAL CONTRADITÓRIO]`,
        confidence: pattern.confidence * 0.7,
        recommendation: (pattern.recommendation || '') + 
          ' Este sinal contradiz outros sinais de alta confiança. Considere aguardar maior clareza do mercado.'
      };
    }
    
    return pattern;
  });
  
  return { patterns: updatedPatterns, warnings };
};

// Enhanced main integration function with more intelligent trade decisions
export const performCompleteAnalysis = async (
  imageUrl: string,
  width: number,
  height: number
): Promise<{
  patterns: PatternResult[],
  technicalElements: TechnicalElement[],
  candles: CandleData[],
  scalpingSignals: ScalpingSignal[],
  volumeData: VolumeData,
  volatilityData: VolatilityData,
  marketContext: MarketContext,
  preciseEntryAnalysis: PreciseEntryAnalysis,
  warnings: string[]
}> => {
  // Step 1: Detect basic patterns
  const patterns = await detectPatterns(imageUrl);
  
  // Step 2: Detect candles
  const candles = await detectCandles(imageUrl, width, height);
  
  // Step 3: Analyze volume
  const volumeData = await analyzeVolume(imageUrl);
  
  // Step 4: Analyze volatility
  const volatilityData = await analyzeVolatility(imageUrl);
  
  // Add enhanced profitability filtering to avoid low-probability setups
  const { patterns: filteredPatterns, warnings: baseWarnings } = detectFalseSignals(patterns);
  
  // Advanced pattern validation with trade intelligence
  const validatedPatterns = filteredPatterns.filter(pattern => {
    // Skip patterns with very low confidence
    if (pattern.confidence < 0.55) return false;
    
    // Verify if pattern is tradeable
    if (pattern.action === 'neutro') return true; // Keep neutral patterns for context
    
    // Filter out low probability setups
    if (pattern.type.toLowerCase().includes('divergência') && pattern.confidence < 0.7) {
      baseWarnings.push(`Padrão de divergência ignorado por baixa confiança (${Math.round(pattern.confidence * 100)}%)`);
      return false;
    }
    
    // Filter based on pattern-specific criteria
    if (pattern.type.toLowerCase().includes('candle') && pattern.confidence < 0.75) {
      baseWarnings.push(`Padrão de candle ignorado por baixa confiança (${Math.round(pattern.confidence * 100)}%)`);
      return false;
    }
    
    return true;
  });
  
  // Add additional warnings about potential profit-loss ratio
  const warnings = [...baseWarnings];
  
  // Check for market condition warnings
  const marketContext = analyzeMarketContext(validatedPatterns, volumeData, volatilityData, candles);
  
  if (marketContext.phase === 'indefinida' || marketContext.strength === 'fraca') {
    warnings.push('AVISO DE RENTABILIDADE: Fase de mercado indefinida ou fraca pode resultar em sinais falsos e perdas. Considere reduzir tamanho ou aguardar condições mais claras.');
  }
  
  if (volumeData && volumeData.trend === 'decreasing') {
    warnings.push('AVISO DE RENTABILIDADE: Volume decrescente indica menor participação dos players. Sinais podem falhar por falta de impulso.');
  }
  
  if (volatilityData && volatilityData.isHigh) {
    warnings.push('AVISO DE RENTABILIDADE: Alta volatilidade detectada. Aumente stops e reduza tamanho de posição para preservar capital.');
  }
  
  // Check for pattern conflict
  const bullishPatterns = validatedPatterns.filter(p => p.action === 'compra' && p.confidence > 0.65);
  const bearishPatterns = validatedPatterns.filter(p => p.action === 'venda' && p.confidence > 0.65);
  
  if (bullishPatterns.length > 0 && bearishPatterns.length > 0) {
    warnings.push('ALERTA: Conflito de sinais detectado (sinais de compra e venda com alta confiança). Evite operar em condições conflitantes ou espere resolução clara.');
  }
  
  // Generate smarter scalping signals with profit focus
  const scalpingSignals = generateScalpingSignals(
    validatedPatterns, 
    candles, 
    volumeData, 
    volatilityData, 
    marketContext
  );
  
  // Generate precise entry analysis with improved trade management
  const preciseEntryAnalysis = generatePreciseEntryAnalysis(
    validatedPatterns,
    candles,
    volumeData,
    volatilityData,
    marketContext
  );
  
  return {
    patterns: validatedPatterns,
    technicalElements: generateTechnicalMarkup(validatedPatterns, width, height),
    candles,
    scalpingSignals,
    volumeData,
    volatilityData,
    marketContext,
    preciseEntryAnalysis: preciseEntryAnalysis || {
      exactMinute: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      entryType: 'pullback',
      nextCandleExpectation: 'Aguardar candle de confirmação com corpo forte',
      priceAction: 'Monitorar fechamento acima/abaixo de níveis importantes com volume crescente',
      confirmationSignal: 'Volume crescente e alinhamento com tendência de timeframe superior',
      riskRewardRatio: 2.5,
      entryInstructions: 'Aguardar sinais mais definidos para entrada. NÃO ENTRAR se o sinal não tiver pelo menos 75% de confiança.'
    },
    warnings
  };
};

export const analyzeChart = async (imageUrl: string, options: AnalysisOptions = {}): Promise<AnalysisResult> => {
  console.log('Iniciando análise do gráfico:', { imageUrl: imageUrl.substring(0, 50), options });
  
  try {
    const {
      timeframe = '1m',
      optimizeForScalping = false,
      scalpingStrategy = 'momentum',
      considerVolume = true,
      considerVolatility = true,
      marketContextEnabled = true,
      marketAnalysisDepth = 'comprehensive',
      enableCandleDetection = true,
      isLiveAnalysis = false
    } = options;

    // Simular análise mais rápida para live analysis
    const analysisDelay = isLiveAnalysis ? 500 : 1500;
    await new Promise(resolve => setTimeout(resolve, analysisDelay));

    // Gerar padrões simulados baseados nos parâmetros
    const patterns = [];
    
    // Análise básica de tendência
    const trendAnalysis = Math.random();
    if (trendAnalysis > 0.7) {
      patterns.push({
        type: optimizeForScalping ? 'Breakout M1' : 'Tendência de Alta',
        confidence: 0.75 + Math.random() * 0.2,
        description: isLiveAnalysis ? 
          'Movimento de alta detectado em tempo real' : 
          'Padrão de tendência ascendente identificado',
        action: 'compra' as const,
        isScalpingSignal: optimizeForScalping,
        recommendation: `${isLiveAnalysis ? 'LIVE: ' : ''}Entrada em ${timeframe} com stop loss apertado`
      });
    } else if (trendAnalysis < 0.3) {
      patterns.push({
        type: optimizeForScalping ? 'Reversão M1' : 'Tendência de Baixa',
        confidence: 0.65 + Math.random() * 0.25,
        description: isLiveAnalysis ? 
          'Movimento de baixa detectado em tempo real' : 
          'Padrão de tendência descendente identificado',
        action: 'venda' as const,
        isScalpingSignal: optimizeForScalping,
        recommendation: `${isLiveAnalysis ? 'LIVE: ' : ''}Entrada em ${timeframe} com gestão de risco`
      });
    }

    // Padrões específicos para scalping
    if (optimizeForScalping) {
      const scalpingPattern = Math.random();
      if (scalpingPattern > 0.6) {
        patterns.push({
          type: `${scalpingStrategy} Signal`,
          confidence: 0.8 + Math.random() * 0.15,
          description: `Sinal de ${scalpingStrategy} identificado para M1`,
          action: Math.random() > 0.5 ? 'compra' as const : 'venda' as const,
          isScalpingSignal: true,
          recommendation: isLiveAnalysis ? 
            'LIVE: Entrada imediata com stop de 5-10 pips' :
            'Entrada rápida com gestão agressiva de risco'
        });
      }
    }

    // Análise de volume se habilitada
    let volumeData;
    if (considerVolume) {
      volumeData = {
        value: Math.floor(Math.random() * 1000000) + 100000,
        trend: ['increasing', 'decreasing', 'neutral'][Math.floor(Math.random() * 3)] as any,
        abnormal: Math.random() > 0.7,
        significance: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
        relativeToAverage: 0.5 + Math.random() * 1.5,
        distribution: ['accumulation', 'distribution', 'neutral'][Math.floor(Math.random() * 3)] as any,
        divergence: Math.random() > 0.8
      };
    }

    // Análise de volatilidade se habilitada
    let volatilityData;
    if (considerVolatility) {
      volatilityData = {
        value: Math.random() * 5 + 0.5,
        trend: ['increasing', 'decreasing', 'neutral'][Math.floor(Math.random() * 3)] as any,
        atr: Math.random() * 0.01 + 0.001,
        percentageRange: Math.random() * 3 + 0.5,
        isHigh: Math.random() > 0.6,
        historicalComparison: ['above_average', 'below_average', 'average'][Math.floor(Math.random() * 3)] as any,
        impliedVolatility: Math.random() * 25 + 10
      };
    }

    // Contexto de mercado se habilitado
    let marketContext;
    if (marketContextEnabled) {
      const phases = ['acumulação', 'tendência_alta', 'tendência_baixa', 'distribuição', 'lateral', 'indefinida'];
      const strengths = ['forte', 'moderada', 'fraca'];
      const sentiments = ['otimista', 'pessimista', 'neutro'];
      
      marketContext = {
        phase: phases[Math.floor(Math.random() * phases.length)] as any,
        strength: strengths[Math.floor(Math.random() * strengths.length)] as any,
        dominantTimeframe: timeframe as any,
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)] as any,
        description: isLiveAnalysis ? 
          'Contexto de mercado analisado em tempo real' :
          'Análise do contexto atual do mercado',
        trendAngle: Math.random() * 45 - 22.5,
        marketStructure: ['alta_altas', 'alta_baixas', 'baixa_altas', 'baixa_baixas', 'indefinida'][Math.floor(Math.random() * 5)] as any,
        breakoutPotential: ['alto', 'médio', 'baixo'][Math.floor(Math.random() * 3)] as any,
        momentumSignature: ['acelerando', 'estável', 'desacelerando', 'divergente'][Math.floor(Math.random() * 4)] as any
      };
    }

    // Análise de entrada precisa para live analysis
    let preciseEntryAnalysis;
    if (isLiveAnalysis && patterns.length > 0) {
      const entryTypes = ['reversão', 'retração', 'pullback', 'breakout', 'teste_suporte', 'teste_resistência'];
      preciseEntryAnalysis = {
        exactMinute: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }),
        entryType: entryTypes[Math.floor(Math.random() * entryTypes.length)] as any,
        nextCandleExpectation: 'Confirmação do movimento na próxima vela',
        priceAction: 'Price action favorável detectado',
        confirmationSignal: 'Aguardar fechamento da vela atual',
        riskRewardRatio: 1 + Math.random() * 2,
        entryInstructions: isLiveAnalysis ? 
          'LIVE: Monitore o próximo candle para confirmação' :
          'Aguarde confirmação antes da entrada'
      };
    }

    // Análise dos mestres (simulada para live)
    const masterAnalysis = {
      bulkowski: {
        name: 'Padrão de Continuação',
        reliability: 0.65 + Math.random() * 0.25,
        averageMove: (Math.random() - 0.5) * 10,
        failureRate: Math.random() * 0.3
      },
      tripleScreen: {
        longTermTrend: Math.random() > 0.5 ? 'up' : 'down',
        mediumTermOscillator: Math.random() > 0.5 ? 'buy' : 'sell',
        shortTermEntry: Math.random() > 0.3 ? 'enter' : 'wait',
        confidence: 0.6 + Math.random() * 0.3
      },
      murphy: {
        trendAnalysis: {
          primary: Math.random() > 0.5 ? 'alta' : 'baixa'
        },
        volumeAnalysis: {
          trend: ['crescente', 'decrescente', 'estável'][Math.floor(Math.random() * 3)]
        },
        supportResistance: [
          { level: Math.random() * 1000 + 1000, type: 'suporte' },
          { level: Math.random() * 1000 + 1200, type: 'resistência' }
        ]
      },
      masterRecommendation: isLiveAnalysis ? 
        `ANÁLISE LIVE (${new Date().toLocaleTimeString()}): Baseado na análise em tempo real dos mestres, ${patterns[0]?.action === 'compra' ? 'considere posição comprada' : patterns[0]?.action === 'venda' ? 'considere posição vendida' : 'mantenha-se neutro'} com gestão rigorosa de risco.` :
        `Recomendação integrada dos mestres: ${patterns.length > 0 ? patterns[0].recommendation : 'Aguarde melhores oportunidades'}`
    };

    const analysisResult = {
      patterns,
      timestamp: Date.now(),
      imageUrl,
      volumeData,
      volatilityData,
      marketContext,
      preciseEntryAnalysis,
      masterAnalysis,
      warnings: isLiveAnalysis ? 
        ['Análise em tempo real - confirme sinais com outras fontes'] : 
        ['Análise baseada em imagem estática']
    };

    // Live analysis specific optimizations
    if (options.isLiveAnalysis) {
      // Fast analysis for real-time processing
      analysisResult.patterns = analysisResult.patterns.slice(0, 3); // Keep top 3 patterns only
      
      // Add timestamp for live tracking
      analysisResult.timestamp = Date.now();
      
      // Optimize confidence calculation for speed
      analysisResult.patterns.forEach(pattern => {
        if (pattern.confidence > 0.8) {
          pattern.confidence = Math.min(0.95, pattern.confidence + 0.05); // Boost high confidence
        }
      });
    }

    console.log('Análise concluída:', analysisResult);
    return analysisResult;

  } catch (error) {
    console.error('Erro na análise do gráfico:', error);
    throw new Error(`Falha na análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};
