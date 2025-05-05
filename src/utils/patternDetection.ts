// Add imports from AnalyzerContext
import { 
  PatternResult, 
  TechnicalElement, 
  Point, 
  CandleData, 
  ScalpingSignal, 
  VolumeData, 
  VolatilityData,
  MarketContext
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
      return `Oportunidade de scalping de COMPRA no ${timeframeText}: Entre apenas com confirmação de volume crescente e volatilidade adequada (nem muito alta nem muito baixa). Aguarde o fechamento do candle acima da EMA9 e confirmação de fluxo de ordens positivo. Use stop de 0.5% ou abaixo do último suporte, com alvos de 2-3% ou na próxima resistência importante. A fase atual do mercado deve estar alinhada com a direção da entrada.`;
    } else if (bearishWeight > 0.5) {
      return `Oportunidade de scalping de VENDA no ${timeframeText}: Entre apenas com confirmação de volume crescente e volatilidade adequada (nem muito alta nem muito baixa). Aguarde o fechamento do candle abaixo da EMA9 e confirmação de fluxo de ordens negativo. Use stop de 0.5% ou acima da última resistência, com alvos de 2-3% ou no próximo suporte importante. A fase atual do mercado deve estar alinhada com a direção da entrada.`;
    } else if (bullishWeight > bearishWeight && bullishWeight > 0.3) {
      return `Viés de alta com potencial de entrada no ${timeframeText}: Aguarde cruzamento da EMA9 por cima da EMA21 com volume crescente e volatilidade controlada. Confirme com RSI acima de 50, teste de suporte anterior e alinhamento com a fase atual do mercado. Considere entradas apenas com confirmação do timeframe superior (5m).`;
    } else if (bearishWeight > bullishWeight && bearishWeight > 0.3) {
      return `Viés de baixa com potencial de entrada no ${timeframeText}: Aguarde cruzamento da EMA9 por baixo da EMA21 com volume crescente e volatilidade controlada. Confirme com RSI abaixo de 50, teste de resistência anterior e alinhamento com a fase atual do mercado. Considere entradas apenas com confirmação do timeframe superior (5m).`;
    } else {
      return `Mercado sem direção clara no ${timeframeText}: Evite entradas de scalping. Monitore o volume, volatilidade e formação de um padrão direcional com confirmação de duas médias móveis (EMA9 e EMA21). Aguarde a definição da fase de mercado e uma divergência clara de RSI ou movimento significativo no fluxo de ordens para considerar uma entrada.`;
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

// Enhanced function for scalping signals with volume, volatility and market context analysis
export const generateScalpingSignals = (patterns: PatternResult[]): ScalpingSignal[] => {
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
  
  // Moving average patterns for enhanced M1 strategy
  const maPatterns = patterns.filter(
    p => p.description?.toLowerCase().includes('média móvel') ||
    p.description?.toLowerCase().includes('ema') ||
    p.description?.toLowerCase().includes('sma') ||
    p.type.toLowerCase().includes('cruzamento')
  );
  
  // RSI patterns for enhanced M1 strategy
  const rsiPatterns = patterns.filter(
    p => p.description?.toLowerCase().includes('rsi') ||
    p.description?.toLowerCase().includes('índice de força relativa')
  );
  
  // Volatility patterns (new)
  const volatilityPatterns = patterns.filter(
    p => p.description?.toLowerCase().includes('volatilidade') ||
    p.description?.toLowerCase().includes('atr') ||
    p.type.toLowerCase().includes('volatilidade')
  );
  
  // Market context patterns (new)
  const marketContextPatterns = patterns.filter(
    p => p.description?.toLowerCase().includes('tendência') ||
    p.description?.toLowerCase().includes('distribuição') ||
    p.description?.toLowerCase().includes('acumulação') ||
    p.type.toLowerCase().includes('fase do mercado')
  );
  
  // Generate scalping signals based on pattern combinations with enhanced criteria
  if (highConfidencePatterns.length > 0) {
    const dominantPattern = highConfidencePatterns[0];
    const hasVolumeConfirmation = volumePatterns.length > 0;
    const hasSupportResistance = supportResistance.length > 0;
    const hasMASignal = maPatterns.length > 0;
    const hasRSISignal = rsiPatterns.length > 0;
    const hasVolatilitySignal = volatilityPatterns.length > 0;
    const hasMarketContextSignal = marketContextPatterns.length > 0;
    
    // Enhanced signal combination rules for more reliable M1 entries with volume and volatility
    const hasStrongVolume = hasVolumeConfirmation && volumePatterns[0].confidence > 0.7;
    const hasAcceptableVolatility = !hasVolatilitySignal || 
      (hasVolatilitySignal && !volatilityPatterns[0].description?.toLowerCase().includes('extrema'));
    
    // Check market phase alignment with the intended trade direction
    let marketPhaseAligned = true; // Default to true if no market context data
    if (hasMarketContextSignal) {
      const marketPhase = marketContextPatterns[0].description?.toLowerCase() || '';
      const isUptrend = marketPhase.includes('tendência de alta') || marketPhase.includes('acumulação');
      const isDowntrend = marketPhase.includes('tendência de baixa') || marketPhase.includes('distribuição');
      
      marketPhaseAligned = (dominantPattern.action === 'compra' && isUptrend) || 
                           (dominantPattern.action === 'venda' && isDowntrend) ||
                           marketPhase.includes('indefinida');
    }
    
    // Only create signals when volume, volatility, and market context conditions are favorable
    if (((hasStrongVolume || hasMASignal) && hasAcceptableVolatility && marketPhaseAligned) && 
        ((hasSupportResistance || hasMASignal || hasRSISignal) || 
         (momentumPatterns.length > 0 && hasVolumeConfirmation))) {
      
      // Create more specific entry conditions with volume and volatility context
      const entryCondition = dominantPattern.action === 'compra'
        ? `${hasMASignal ? 'Cruzamento da EMA9 acima da EMA21' : 'Rompimento de resistência'} com ${hasVolumeConfirmation ? 'aumento de volume' : 'teste de suporte'} ${hasAcceptableVolatility ? 'e volatilidade favorável' : ''}`
        : `${hasMASignal ? 'Cruzamento da EMA9 abaixo da EMA21' : 'Rompimento de suporte'} com ${hasVolumeConfirmation ? 'aumento de volume' : 'teste de resistência'} ${hasAcceptableVolatility ? 'e volatilidade favorável' : ''}`;
      
      // Additional confirmations based on available indicators
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

      // Calculate confidence based on all factors
      const volumeFactor = hasVolumeConfirmation ? (hasStrongVolume ? 1.25 : 1.1) : 0.9;
      const volatilityFactor = hasAcceptableVolatility ? 1.1 : 0.8;
      const marketContextFactor = marketPhaseAligned ? 1.15 : 0.75;
      const adjustedConfidence = dominantPattern.confidence * 
                                volumeFactor * 
                                (hasMASignal ? 1.1 : 1) * 
                                volatilityFactor * 
                                marketContextFactor;

      signals.push({
        type: 'entrada',
        action: dominantPattern.action as 'compra' | 'venda',
        price: entryCondition,
        confidence: adjustedConfidence,
        timeframe: '1m',
        description: `${dominantPattern.type}: ${dominantPattern.description} ${confirmations.length > 0 ? '| Confirmações: ' + confirmations.join(', ') : ''}`,
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
        marketPhaseAlignment: marketPhaseAligned
      });
      
      // Add exit signal with more specific risk management rules including volume and volatility
      signals.push({
        type: 'saída',
        action: dominantPattern.action as 'compra' | 'venda',
        price: 'Take profit ou stop loss',
        confidence: adjustedConfidence * 0.9,
        timeframe: '1m',
        description: `Encerre a posição quando: 1) O preço atingir o alvo de ${dominantPattern.action === 'compra' ? '+2-3%' : '-2-3%'}, 2) O stop loss for ativado, 3) Houver reversão de EMA9/EMA21 com confirmação de volume, ou 4) Após 3-5 candles sem progresso em direção ao alvo ${hasVolatilitySignal && volatilityPatterns[0].description?.toLowerCase().includes('alta') ? 'ou mudança abrupta na volatilidade' : ''}.`
      });
    }
  }
  
  // Add signals for volume spike analysis (new)
  const volumeSpikes = volumePatterns.filter(p => 
    (p.description?.toLowerCase().includes('surto') || p.description?.toLowerCase().includes('spike')) &&
    p.confidence > 0.75
  );
  
  if (volumeSpikes.length > 0) {
    const volumeSpike = volumeSpikes[0];
    const direction = volumeSpike.action === 'compra' ? 'alta' : 
                      volumeSpike.action === 'venda' ? 'baixa' : 'indefinida';
    
    if (direction !== 'indefinida') {
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
        volatilityCondition: 'Aumento esperado na volatilidade'
      });
    }
  }
  
  // Add signals for moving average crossovers with volume confirmation
  if (maPatterns.length > 0 && volumePatterns.length > 0) {
    const maPattern = maPatterns[0];
    const volumePattern = volumePatterns[0];
    
    if (maPattern.confidence > 0.6 && volumePattern.confidence > 0.6) {
      const volumeIncreasing = volumePattern.description?.toLowerCase().includes('aumento') || 
                              volumePattern.description?.toLowerCase().includes('alto');
      
      if (volumeIncreasing) {
        signals.push({
          type: 'entrada',
          action: maPattern.action as 'compra' | 'venda',
          price: maPattern.action === 'compra' 
            ? 'Após cruzamento da EMA9 por cima da EMA21 com volume crescente' 
            : 'Após cruzamento da EMA9 por baixo da EMA21 com volume crescente',
          confidence: maPattern.confidence * 1.2, // Increase confidence due to volume confirmation
          timeframe: '1m',
          description: `Cruzamento de Médias Móveis com Volume: ${maPattern.description}, ${volumePattern.description}`,
          target: maPattern.action === 'compra'
            ? 'Próxima resistência ou +1.5-2% do preço atual'
            : 'Próximo suporte ou -1.5-2% do preço atual',
          stopLoss: maPattern.action === 'compra'
            ? '0.5% abaixo do ponto de entrada ou abaixo da EMA21'
            : '0.5% acima do ponto de entrada ou acima da EMA21',
          volumeConfirmation: true
        });
      }
    }
  }
  
  // Add signals for RSI divergences with volume and volatility context
  if (rsiPatterns.length > 0 && volumePatterns.length > 0) {
    const rsiPattern = rsiPatterns[0];
    const volumePattern = volumePatterns[0];
    
    const hasAcceptableVolatility = volatilityPatterns.length === 0 || 
      !volatilityPatterns[0].description?.toLowerCase().includes('extrema');
    
    if (rsiPattern.confidence > 0.7 && volumePattern.confidence > 0.6 && hasAcceptableVolatility) {
      signals.push({
        type: 'entrada',
        action: rsiPattern.action as 'compra' | 'venda',
        price: rsiPattern.action === 'compra' 
          ? 'Após confirmação de divergência positiva no RSI com volume crescente' 
          : 'Após confirmação de divergência negativa no RSI com volume crescente',
        confidence: rsiPattern.confidence * 1.15,
        timeframe: '1m',
        description: `Divergência RSI com Volume: ${rsiPattern.description}, ${volumePattern.description}`,
        target: rsiPattern.action === 'compra'
          ? 'Próxima resistência ou +2% do preço atual'
          : 'Próximo suporte ou -2% do preço atual',
        stopLoss: rsiPattern.action === 'compra'
          ? '0.5% abaixo do ponto de entrada ou abaixo do último mínimo'
          : '0.5% acima do ponto de entrada ou acima do último máximo',
        volumeConfirmation: true,
        volatilityCondition: hasAcceptableVolatility ? 'Volatilidade favorável' : 'Monitorar volatilidade'
      });
    }
  }
  
  // New signals based on market context phase
  if (marketContextPatterns.length > 0 && marketContextPatterns[0].confidence > 0.7) {
    const contextPattern = marketContextPatterns[0];
    const marketPhase = contextPattern.description?.toLowerCase() || '';
    
    // Generate different signals based on market phase
    if (marketPhase.includes('acumulação') && volumePatterns.length > 0) {
      signals.push({
        type: 'entrada',
        action: 'compra',
        price: 'Compra em região de suporte com volume crescente',
        confidence: contextPattern.confidence * 1.1,
        timeframe: '1m',
        description: `Fase de Acumulação: Oportunidade de compra em região de valor com aumento de volume institucional`,
        target: 'Saída do range de acumulação ou +2-3% do preço de entrada',
        stopLoss: 'Abaixo da zona de acumulação ou 0.5% abaixo da entrada',
        volumeConfirmation: true,
        marketPhaseAlignment: true
      });
    } else if (marketPhase.includes('distribuição') && volumePatterns.length > 0) {
      signals.push({
        type: 'entrada',
        action: 'venda',
        price: 'Venda em região de resistência com volume crescente',
        confidence: contextPattern.confidence * 1.1,
        timeframe: '1m',
        description: `Fase de Distribuição: Oportunidade de venda em região de topo com aumento de volume institucional`,
        target: 'Saída do range de distribuição ou -2-3% do preço de entrada',
        stopLoss: 'Acima da zona de distribuição ou 0.5% acima da entrada',
        volumeConfirmation: true,
        marketPhaseAlignment: true
      });
    } else if (marketPhase.includes('tendência') && maPatterns.length > 0) {
      const direction = marketPhase.includes('alta') ? 'compra' : 'venda';
      signals.push({
        type: 'entrada',
        action: direction as 'compra' | 'venda',
        price: direction === 'compra' 
          ? 'Pullback para EMA9/21 em tendência de alta' 
          : 'Pullback para EMA9/21 em tendência de baixa',
        confidence: contextPattern.confidence * 1.2,
        timeframe: '1m',
        description: `Tendência Estabelecida: Entrada em pullback para médias móveis com alinhamento direcional do mercado`,
        target: direction === 'compra'
          ? 'Extensão da tendência ou +2.5% do preço de entrada'
          : 'Extensão da tendência ou -2.5% do preço de entrada',
        stopLoss: direction === 'compra'
          ? 'Abaixo da EMA21 ou 0.5% abaixo da entrada'
          : 'Acima da EMA21 ou 0.5% acima da entrada',
        marketPhaseAlignment: true
      });
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
    relativeToAverage: 1.5
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
    isHigh: false
  });
};

// New function to determine market context
export const analyzeMarketContext = (
  patterns: PatternResult[], 
  volumeData?: VolumeData, 
  volatilityData?: VolatilityData
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
  
  // Determine market phase
  let phase: 'acumulação' | 'tendência' | 'distribuição' | 'indefinida' = 'indefinida';
  let strength: 'forte' | 'moderada' | 'fraca' = 'moderada';
  let sentiment: 'otimista' | 'pessimista' | 'neutro' = 'neutro';
  let description = 'Fase de mercado indefinida';
  
  // Check for trend patterns
  if (trendPatterns.length > 0) {
    const dominantTrend = trendPatterns.sort((a, b) => b.confidence - a.confidence)[0];
    
    if (dominantTrend.type.toLowerCase().includes('alta') || 
        dominantTrend.description?.toLowerCase().includes('alta')) {
      phase = 'tendência';
      sentiment = 'otimista';
      strength = dominantTrend.confidence > 0.8 ? 'forte' : dominantTrend.confidence > 0.6 ? 'moderada' : 'fraca';
      description = `Tendência de alta ${strength}`;
    } else if (dominantTrend.type.toLowerCase().includes('baixa') || 
               dominantTrend.description?.toLowerCase().includes('baixa')) {
      phase = 'tendência';
      sentiment = 'pessimista';
      strength = dominantTrend.confidence > 0.8 ? 'forte' : dominantTrend.confidence > 0.6 ? 'moderada' : 'fraca';
      description = `Tendência de baixa ${strength}`;
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
      } else if (priceNearResistance && volumeIncreasing) {
        phase = 'distribuição';
        sentiment = 'pessimista';
        strength = rangePattern.confidence > 0.7 ? 'forte' : 'moderada';
        description = `Fase de distribuição próxima a resistência`;
      } else {
        phase = 'indefinida';
        description = `Mercado em range sem características claras de acumulação ou distribuição`;
      }
    } else {
      phase = 'indefinida';
      description = `Mercado em range, monitorar volume para confirmar fase`;
    }
  }
  
  // Add volatility context
  if (volatilityData) {
    if (volatilityData.isHigh) {
      description += ` com volatilidade elevada`;
    } else if (volatilityData.trend === 'increasing') {
      description += ` com volatilidade crescente`;
    } else if (volatilityData.trend === 'decreasing') {
      description += ` com volatilidade decrescente`;
    }
  }
  
  return {
    phase,
    strength,
    dominantTimeframe: '1m',
    sentiment,
    description
  };
};

export const detectPatterns = async (imageUrl: string): Promise<PatternResult[]> => {
  // In a real implementation, this would use computer vision or ML to detect patterns
  // For now, we'll return a broader set of mock patterns to demonstrate all strategies
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Get initial patterns with explicitly typed actions
  const patterns: PatternResult[] = [
    {
      type: 'Tendência de Alta',
      confidence: 0.82,
      description: 'Identificada uma tendência de alta com sucessivos topos e fundos ascendentes.',
      recommendation: 'Considere posições compradas com stop abaixo do último fundo relevante.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Rompimento de resistência',
      stopLoss: '0.5% abaixo do ponto de entrada',
      takeProfit: '+2% do preço de entrada'
    },
    {
      type: 'Suporte/Resistência',
      confidence: 0.90,
      description: 'Níveis de suporte e resistência bem definidos no gráfico. Preço próximo à resistência importante.',
      recommendation: 'Observe possíveis reversões nos níveis de suporte/resistência identificados.',
      action: 'neutro' as const
    },
    {
      type: 'Triângulo',
      confidence: 0.75,
      description: 'Formação de triângulo ascendente, indicando possível continuação da tendência de alta.',
      recommendation: 'Aguarde confirmação de rompimento da linha superior do triângulo para entrar comprado.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Quebra da linha superior',
      stopLoss: 'Abaixo da linha inferior do triângulo',
      takeProfit: 'Projeção do triângulo (altura da formação)'
    },
    {
      type: 'Padrão de Velas',
      confidence: 0.85,
      description: 'Identificado padrão de velas Doji seguido por candle de alta com fechamento forte.',
      recommendation: 'Sinal de reversão de baixa para alta. Considere entrada após confirmação no próximo candle.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Acima do máximo do candle de confirmação',
      stopLoss: 'Abaixo do mínimo do padrão Doji',
      takeProfit: '2:1 (risco/retorno)'
    },
    {
      type: 'Retração de Fibonacci',
      confidence: 0.78,
      description: 'Preço encontrando suporte no nível de 61.8% de Fibonacci da última pernada de alta.',
      recommendation: 'Possível área de reversão. Acompanhe a reação do preço neste nível.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Confirmação de suporte em 61.8%',
      stopLoss: 'Abaixo do nível 78.6%',
      takeProfit: 'Próximo nível de retração (38.2%)'
    },
    {
      type: 'Divergência',
      confidence: 0.72,
      description: 'Divergência positiva entre preço e indicador de momento, sugerindo possível esgotamento da tendência de baixa.',
      recommendation: 'Sinal de alerta para possível reversão. Aguarde confirmação por quebra de resistência.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Após candle de confirmação com volume',
      stopLoss: 'Abaixo do último mínimo',
      takeProfit: 'Projeção baseada no movimento anterior'
    },
    {
      type: 'OCO',
      confidence: 0.68,
      description: 'Formação OCO (Ombro-Cabeça-Ombro) em desenvolvimento, sugerindo possível reversão de tendência.',
      recommendation: 'Observe a quebra da linha de pescoço como confirmação do padrão para entrada.',
      action: 'venda' as const,
      isScalpingSignal: false
    },
    {
      type: 'Falso Rompimento',
      confidence: 0.65,
      description: 'Identificado possível falso rompimento de resistência com recuo imediato do preço.',
      recommendation: 'Cuidado com entradas baseadas neste rompimento. Aguarde nova confirmação.',
      action: 'neutro' as const
    },
    {
      type: 'Sobrecompra/Sobrevenda',
      confidence: 0.80,
      description: 'Indicadores sugerem condição de sobrecompra no gráfico atual.',
      recommendation: 'Considere cautela em novas posições compradas. Possível correção técnica à frente.',
      action: 'neutro' as const
    },
    // Novos padrões específicos para scalping em M1
    {
      type: 'Momentum de Scalping',
      confidence: 0.85,
      description: 'Forte movimento de momentum com aumento de volume nos últimos candles.',
      recommendation: 'Oportunidade de scalping na direção do momentum. Entre após pequena retração.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Após retração de 38.2% do movimento recente',
      stopLoss: '0.5% abaixo do ponto de entrada',
      takeProfit: 'Próxima resistência ou 2% de ganho'
    },
    {
      type: 'Padrão de Velas M1',
      confidence: 0.79,
      description: 'Sequência de três candles de alta consecutivos com aumento de volume.',
      recommendation: 'Forte sinal de continuação. Entre no pullback ou na quebra do máximo.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Pullback ou quebra de máxima',
      stopLoss: 'Abaixo do mínimo do último candle',
      takeProfit: '2:1 ou 3:1 (risco/retorno)'
    },
    {
      type: 'Microrupturas',
      confidence: 0.72,
      description: 'Micro-rupturas de níveis de resistência de curto prazo com volume crescente.',
      recommendation: 'Ideal para operações rápidas de scalping. Entre na confirmação com stop ajustado.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Confirmação de fechamento acima da resistência',
      stopLoss: '0.3-0.5% abaixo do ponto de entrada',
      takeProfit: '1-1.5% acima do ponto de entrada'
    },
    {
      type: 'Cruzamento de Médias Móveis',
      confidence: 0.88,
      description: 'Cruzamento da EMA9 por cima da EMA21 com aumento gradual de volume.',
      recommendation: 'Sinal de alta confiabilidade para scalping. Entre após confirmação com volume.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Após fechamento de candle acima da EMA9',
      stopLoss: 'Abaixo da EMA21 ou 0.5% do preço de entrada',
      takeProfit: 'Próxima resistência ou +2% do preço de entrada'
    },
    {
      type: 'Cruzamento de Médias Móveis',
      confidence: 0.84,
      description: 'Cruzamento da EMA9 por baixo da EMA21 com aumento de volume e candle de alta impressão.',
      recommendation: 'Sinal de baixa confiabilidade para scalping. Entre após confirmação com candle fechando abaixo da EMA9.',
      action: 'venda' as const,
      isScalpingSignal: true,
      entryPrice: 'Após fechamento de candle abaixo da EMA9',
      stopLoss: 'Acima da EMA21 ou 0.5% do preço de entrada',
      takeProfit: 'Próximo suporte ou -2% do preço de entrada'
    },
    {
      type: 'RSI',
      confidence: 0.80,
      description: 'RSI saindo da zona de sobrevenda (abaixo de 30) com divergência positiva em relação ao preço.',
      recommendation: 'Excelente sinal para reversão de baixa para alta. Entre após confirmação de candle de alta.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Quando RSI cruzar acima de 30 com candle de alta',
      stopLoss: '0.5% abaixo do ponto de entrada ou mínima recente',
      takeProfit: '+2.5% do preço de entrada'
    },
    {
      type: 'RSI',
      confidence: 0.78,
      description: 'RSI saindo da zona de sobrecompra (acima de 70) com divergência negativa em relação ao preço.',
      recommendation: 'Bom sinal para reversão de alta para baixa. Entre após confirmação de candle de baixa.',
      action: 'venda' as const,
      isScalpingSignal: true,
      entryPrice: 'Quando RSI cruzar abaixo de 70 com candle de baixa',
      stopLoss: '0.5% acima do ponto de entrada ou máxima recente',
      takeProfit: '-2.5% do preço de entrada'
    },
    {
      type: 'Volume Profile',
      confidence: 0.85,
      description: 'Surto de volume em nível de suporte com velas de alta (compradores entrando).',
      recommendation: 'Forte sinal para reversão de baixa. Entre após confirmação de volume e preço.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Após candle de confirmação com fechamento forte',
      stopLoss: 'Abaixo do suporte ou 0.5% do preço de entrada',
      takeProfit: '+2% do preço de entrada'
    },
    {
      type: 'Price Action M1',
      confidence: 0.82,
      description: 'Formação de pinça (pin bar) após movimento forte de baixa, indicando possível reversão.',
      recommendation: 'Sinal de reversão de baixa para alta com boa confiabilidade em M1.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Acima do máximo da vela pinça',
      stopLoss: 'Abaixo do mínimo da vela pinça',
      takeProfit: 'Próxima resistência ou +2% do preço de entrada'
    },
    {
      type: 'Combinação Técnica M1',
      confidence: 0.92,
      description: 'Alinhamento de múltiplos fatores: cruzamento de médias móveis, suporte importante, divergência positiva de RSI e aumento de volume.',
      recommendation: 'Setup de alta confiabilidade para scalping. Entre imediatamente após confirmação de candle de alta.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Após fechamento do candle de confirmação',
      stopLoss: '0.5% abaixo do ponto de entrada',
      takeProfit: 'Objetivos escalonados: +1%, +2% e +3%'
    },
    // Add new patterns for volume analysis
    {
      type: 'Volume Crescente',
      confidence: 0.88,
      description: 'Volume crescente nas últimas barras com pressão compradora evidente.',
      recommendation: 'Confirme padrões de reversão ou continuação com este aumento de volume.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Após confirmação de fechamento forte',
      stopLoss: '0.5% abaixo da entrada',
      takeProfit: '+2% do preço de entrada'
    },
    {
      type: 'Surto de Volume',
      confidence: 0.92,
      description: 'Surto significativo de volume com candle de alta após teste de suporte.',
      recommendation: 'Excelente confirmação de reversão de baixa para alta. Entre imediatamente.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Atual ou próximo candle',
      stopLoss: 'Abaixo do mínimo do candle de volume',
      takeProfit: '+2.5-3% do preço de entrada'
    },
    {
      type: 'Divergência Volume-Preço',
      confidence: 0.79,
      description: 'Volume decrescente em movimento de alta, indicando possível esgotamento.',
      recommendation: 'Alerta de possível topo. Prepare-se para reversão ou correção técnica.',
      action: 'venda' as const,
      isScalpingSignal: true,
      entryPrice: 'Após confirmação de reversão',
      stopLoss: 'Acima do último topo',
      takeProfit: '-2% do preço de entrada'
    },
    
    // Add new patterns for volatility analysis
    {
      type: 'Alta Volatilidade',
      confidence: 0.82,
      description: 'ATR em níveis elevados comparado à média recente, indicando possível exaustão.',
      recommendation: 'Aumenta probabilidade de reversão. Maior cautela nas entradas e stops mais amplos.',
      action: 'neutro' as const,
      isScalpingSignal: false
    },
    {
      type: 'Contração de Volatilidade',
      confidence: 0.75,
      description: 'Estreitamento de range e redução significativa de volatilidade antes de movimento importante.',
      recommendation: 'Prepare-se para possível movimento direcional forte após esta contração.',
      action: 'neutro' as const,
      isScalpingSignal: true,
      entryPrice: 'Após quebra do range de contração',
      stopLoss: 'Dentro do range de contração',
      takeProfit: 'Projeção baseada na amplitude do range'
    },
    
    // Add new patterns for market context understanding
    {
      type: 'Fase de Acumulação',
      confidence: 0.85,
      description: 'Mercado em fase de acumulação com teste repetido de suporte e aumento de volume nos fundos.',
      recommendation: 'Momento ideal para entradas de compra em região de suporte com stops justos.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Na região de suporte com confirmação de volume',
      stopLoss: '0.5% abaixo do suporte',
      takeProfit: 'Saída da fase de acumulação'
    },
    {
      type: 'Fase de Distribuição',
      confidence: 0.82,
      description: 'Mercado em fase de distribuição com teste repetido de resistência e aumento de volume nos topos.',
      recommendation: 'Momento ideal para entradas de venda em região de resistência com stops justos.',
      action: 'venda' as const,
      isScalpingSignal: true,
      entryPrice: 'Na região de resistência com confirmação de volume',
      stopLoss: '0.5% acima da resistência',
      takeProfit: 'Saída da fase de distribuição'
    },
    {
      type: 'Tendência Estabelecida',
      confidence: 0.90,
      description: 'Tendência de alta bem estabelecida com fundos e topos ascendentes e EMA9 acima da EMA21.',
      recommendation: 'Procure entradas durante pullbacks para as médias móveis, mantendo-se alinhado com a tendência.',
      action: 'compra' as const,
      isScalpingSignal: true,
      entryPrice: 'Pullback para a EMA9/21',
      stopLoss: 'Abaixo da EMA21 ou 0.5% da entrada',
      takeProfit: 'Extensão da tendência ou +2.5%'
    },
  ];
  
  // Validate patterns against support/resistance and other factors
  return validatePatterns(patterns);
};

export const detectFalseSignals = (patterns: PatternResult[]): { 
  hasFalseSignals: boolean, 
  warnings: string[] 
} => {
  const warnings: string[] = [];
  
  // Check for volume confirmation issues
  const volumePatterns = patterns.filter(p => 
    p.description?.toLowerCase().includes('volume') ||
    p.type.toLowerCase().includes('volume')
  );
  
  const actionablePatterns = patterns.filter(p => p.action !== 'neutro');
  
  if (volumePatterns.length > 0 && actionablePatterns.length > 0) {
    const volumeDecreasing = volumePatterns.some(p => 
      p.description?.toLowerCase().includes('decrescente') ||
      p.description?.toLowerCase().includes('baixo')
    );
    
    if (volumeDecreasing) {
      warnings.push('⚠️ Alerta: Sinais de direção com volume decrescente. Volume insuficiente pode resultar em movimentos falsos ou falhas de continuidade.');
    }
  }
  
  // Check for volatility issues
  const volatilityPatterns = patterns.filter(p => 
    p.description?.toLowerCase().includes('volatilidade') ||
    p.description?.toLowerCase().includes('atr') ||
    p.type.toLowerCase().includes('volatilidade')
  );
  
  if (volatilityPatterns.length > 0) {
    const extremeVolatility = volatilityPatterns.some(p => 
      p.description?.toLowerCase().includes('extrema') ||
      p.description?.toLowerCase().includes('muito alta')
    );
    
    if (extremeVolatility) {
      warnings.push('⚠️ Alerta: Volatilidade extrema detectada. Maior probabilidade de movimentos falsos e whipsaws. Considere aumentar stops e reduzir tamanho de posições.');
    }
  }
  
  // Check for market context misalignment
  const marketPhasePatterns = patterns.filter(p => 
    p.type.includes('Fase de') ||
    p.description?.toLowerCase().includes('fase de') ||
    p.description?.toLowerCase().includes('tendência estabelecida')
  );
  
  if (marketPhasePatterns.length > 0 && actionablePatterns.length > 0) {
    const marketDesc = marketPhasePatterns[0].description?.toLowerCase() || '';
    const isDistribution = marketDesc.includes('distribuição');
    const isAccumulation = marketDesc.includes('acumulação');
    const isUptrend = marketDesc.includes('tendência de alta');
    const isDowntrend = marketDesc.includes('tendência de baixa');
    
    const hasBuySignals = actionablePatterns.some(p => p.action === 'compra');
    const hasSellSignals = actionablePatterns.some(p => p.action === 'venda');
    
    if ((isDistribution || isDowntrend) && hasBuySignals) {
      warnings.push('⚠️ Alerta de Contexto: Sinais de compra durante fase de distribuição ou tendência de baixa. Considere esperar confirmação adicional ou evitar entradas de compra.');
    }
    
    if ((isAccumulation || isUptrend) && hasSellSignals) {
      warnings.push('⚠️ Alerta de Contexto: Sinais de venda durante fase de acumulação ou tendência de alta. Considere esperar confirmação adicional ou evitar entradas de venda.');
    }
  }
  
  // Check for buy signals near resistance
  const resistancePatterns = patterns.filter(p => 
    p.description?.toLowerCase().includes('resistência') || 
    p.type === 'Suporte/Resistência'
  );
  
  const buySignals = patterns.filter(p => p.action === 'compra');
  
  if (resistancePatterns.length > 0 && buySignals.length > 0) {
    if (resistancePatterns[0].confidence > 0.7) {
      warnings.push('⚠️ Alerta: Sinal de compra próximo a uma resistência importante. Aguarde confirmação de rompimento.');
    }
  }
  
  // Check for sell signals near support
  const supportPatterns = patterns.filter(p => 
    p.description?.toLowerCase().includes('suporte') ||
    p.type === 'Suporte/Resistência'
  );
  
  const sellSignals = patterns.filter(p => p.action === 'venda');
  
  if (supportPatterns.length > 0 && sellSignals.length > 0) {
    if (supportPatterns[0].confidence > 0.7) {
      warnings.push('⚠️ Alerta: Sinal de venda próximo a um suporte importante. Aguarde confirmação de rompimento.');
    }
  }
  
  // Check for contradicting patterns
  const trendDirections = patterns
    .filter(p => p.action !== 'neutro' && p.confidence > 0.7)
    .map(p => p.action);
  
  if (trendDirections.includes('compra') && trendDirections.includes('venda')) {
    warnings.push('⚠️ Alerta: Sinais contraditórios detectados. Aguarde confirmação antes de entrar em uma posição.');
  }
  
  // Check for patterns indicating market indecision
  const indecisionPatterns = patterns.filter(p => 
    p.description?.toLowerCase().includes('doji') || 
    p.description?.toLowerCase().includes('indecisão')
  );
  
  if (indecisionPatterns.length > 0) {
    warnings.push('⚠️ Alerta: Padrões de indecisão detectados. O mercado pode estar sem direção clara.');
  }
  
  // Adicionar alertas específicos para scalping (timeframe de 1 minuto)
  const scalpingPatterns = patterns.filter(p => 
    p.type.toLowerCase().includes('vela') || 
    p.type.toLowerCase().includes('candle') ||
    p.type.toLowerCase().includes('doji')
  );
  
  if (scalpingPatterns.length > 0) {
    const hasConfirmation = patterns.some(p => 
      p.description?.toLowerCase().includes('volume') || 
      p.description?.toLowerCase().includes('momentum')
    );
    
    if (!hasConfirmation) {
      warnings.push('⚠️ Alerta para Scalping: Padrões de velas detectados sem confirmação clara de volume ou momentum. Recomenda-se cautela adicional.');
    }
  }
  
  // Verificar divergência preço-momentum (importante para scalping)
  const divergencePatterns = patterns.filter(p => 
    p.type.toLowerCase().includes('divergência') || 
    p.description?.toLowerCase().includes('divergência')
  );
  
  if (divergencePatterns.length > 0) {
    const divergenceType = divergencePatterns[0].action === 'compra' ? 'positiva' : 'negativa';
    warnings.push(`🔔 Divergência ${divergenceType} detectada. Este é um sinal importante para possível reversão em scalping.`);
  }
  
  return {
    hasFalseSignals: warnings.length > 0,
    warnings
  };
};

export const generateTechnicalMarkup = (
  patterns: PatternResult[], 
  width: number, 
  height: number,
  scale: number = 1
): TechnicalElement[] => {
  if (!patterns || patterns.length === 0 || !width || !height) {
    return [];
  }
  
  const elements: TechnicalElement[] = [];
  
  // Adjust pattern generation based on the scale factor
  
  // Process all pattern types in the received patterns array
  patterns.forEach(pattern => {
    switch (pattern.type) {
      case 'Tendência de Alta':
        // Add trend lines with better proportions
        elements.push({
          type: 'arrow',
          start: { x: width * 0.2, y: height * 0.7 },
          end: { x: width * 0.8, y: height * 0.3 },
          color: 'rgba(76, 175, 80, 0.8)',
          thickness: 3 * scale
        });
        elements.push({
          type: 'label',
          position: { x: width * 0.2, y: height * 0.65 },
          text: 'Tendência de Alta',
          color: 'rgba(76, 175, 80, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Tendência de Baixa':
        elements.push({
          type: 'arrow',
          start: { x: width * 0.2, y: height * 0.3 },
          end: { x: width * 0.8, y: height * 0.7 },
          color: 'rgba(244, 67, 54, 0.8)',
          thickness: 3 * scale
        });
        elements.push({
          type: 'label',
          position: { x: width * 0.2, y: height * 0.25 },
          text: 'Tendência de Baixa',
          color: 'rgba(244, 67, 54, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Suporte/Resistência':
        // Add support and resistance lines
        const supportY = height * 0.7;
        const resistanceY = height * 0.3;
        
        elements.push({
          type: 'line',
          points: [
            { x: width * 0.1, y: supportY },
            { x: width * 0.9, y: supportY }
          ],
          color: 'rgba(76, 175, 80, 0.8)',
          thickness: 2 * scale,
          dashArray: [5, 3]
        });
        elements.push({
          type: 'label',
          position: { x: width * 0.1, y: supportY + 5 },
          text: 'Suporte',
          color: 'rgba(76, 175, 80, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        
        elements.push({
          type: 'line',
          points: [
            { x: width * 0.1, y: resistanceY },
            { x: width * 0.9, y: resistanceY }
          ],
          color: 'rgba(244, 67, 54, 0.8)',
          thickness: 2 * scale,
          dashArray: [5, 3]
        });
        elements.push({
          type: 'label',
          position: { x: width * 0.1, y: resistanceY - 20 },
          text: 'Resistência',
          color: 'rgba(244, 67, 54, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Triângulo':
        // Draw a triangle pattern with better proportions
        const trianglePoints = [
          { x: width * 0.2, y: height * 0.6 },
          { x: width * 0.5, y: height * 0.3 },
          { x: width * 0.8, y: height * 0.6 },
          { x: width * 0.2, y: height * 0.6 }
        ];
        
        elements.push({
          type: 'pattern',
          patternType: 'triangulo',
          points: trianglePoints,
          color: 'rgba(33, 150, 243, 0.8)',
          thickness: 2.5 * scale
        });
        elements.push({
          type: 'label',
          position: { x: width * 0.45, y: height * 0.25 },
          text: 'Triângulo',
          color: 'rgba(33, 150, 243, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'OCO':
        // Head and shoulders pattern with better proportions
        const shoulderHeight = height * 0.5;
        const headHeight = height * 0.3;
        const ocoPoints = [
          { x: width * 0.1, y: height * 0.6 },
          { x: width * 0.25, y: shoulderHeight },
          { x: width * 0.4, y: height * 0.6 },
          { x: width * 0.5, y: headHeight },
          { x: width * 0.6, y: height * 0.6 },
          { x: width * 0.75, y: shoulderHeight },
          { x: width * 0.9, y: height * 0.6 }
        ];
        
        elements.push({
          type: 'pattern',
          patternType: 'OCO',
          points: ocoPoints,
          color: 'rgba(156, 39, 176, 0.8)',
          thickness: 2.5 * scale,
          label: 'OCO'
        });
        break;
        
      case 'Cunha':
        // Wedge pattern with better proportions
        const cunhaPoints1 = [
          { x: width * 0.2, y: height * 0.7 },
          { x: width * 0.8, y: height * 0.4 }
        ];
        const cunhaPoints2 = [
          { x: width * 0.2, y: height * 0.5 },
          { x: width * 0.8, y: height * 0.35 }
        ];
        
        elements.push({
          type: 'line',
          points: cunhaPoints1,
          color: 'rgba(255, 152, 0, 0.8)',
          thickness: 2.5 * scale
        });
        elements.push({
          type: 'line',
          points: cunhaPoints2,
          color: 'rgba(255, 152, 0, 0.8)',
          thickness: 2.5 * scale
        });
        elements.push({
          type: 'label',
          position: { x: width * 0.45, y: height * 0.3 },
          text: 'Cunha',
          color: 'rgba(255, 152, 0, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Bandeira':
        // Flag pattern
        const flagPoleStart = { x: width * 0.2, y: height * 0.7 };
        const flagPoleEnd = { x: width * 0.2, y: height * 0.3 };
        const flagPoints1 = [
          { x: width * 0.2, y: height * 0.3 },
          { x: width * 0.6, y: height * 0.4 }
        ];
        const flagPoints2 = [
          { x: width * 0.2, y: height * 0.5 },
          { x: width * 0.6, y: height * 0.6 }
        ];
        
        elements.push({
          type: 'line',
          points: [flagPoleStart, flagPoleEnd],
          color: 'rgba(0, 188, 212, 0.8)',
          thickness: 3 * scale
        });
        elements.push({
          type: 'line',
          points: flagPoints1,
          color: 'rgba(0, 188, 212, 0.8)',
          thickness: 2 * scale
        });
        elements.push({
          type: 'line',
          points: flagPoints2,
          color: 'rgba(0, 188, 212, 0.8)',
          thickness: 2 * scale
        });
        elements.push({
          type: 'label',
          position: { x: width * 0.25, y: height * 0.25 },
          text: 'Bandeira',
          color: 'rgba(0, 188, 212, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Topo Duplo':
        // Double top pattern
        const topHeight = height * 0.3;
        const topPoints = [
          { x: width * 0.2, y: height * 0.6 },
          { x: width * 0.35, y: topHeight },
          { x: width * 0.5, y: height * 0.5 },
          { x: width * 0.65, y: topHeight },
          { x: width * 0.8, y: height * 0.6 }
        ];
        
        elements.push({
          type: 'line',
          points: topPoints,
          color: 'rgba(233, 30, 99, 0.8)',
          thickness: 2.5 * scale
        });
        elements.push({
          type: 'label',
          position: { x: width * 0.4, y: height * 0.25 },
          text: 'Topo Duplo',
          color: 'rgba(233, 30, 99, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Fundo Duplo':
        // Double bottom pattern
        const bottomHeight = height * 0.7;
        const bottomPoints = [
          { x: width * 0.2, y: height * 0.4 },
          { x: width * 0.35, y: bottomHeight },
          { x: width * 0.5, y: height * 0.5 },
          { x: width * 0.65, y: bottomHeight },
          { x: width * 0.8, y: height * 0.4 }
        ];
        
        elements.push({
          type: 'line',
          points: bottomPoints,
          color: 'rgba(76, 175, 80, 0.8)',
          thickness: 2.5 * scale
        });
        elements.push({
          type: 'label',
          position: { x: width * 0.4, y: height * 0.75 },
          text: 'Fundo Duplo',
          color: 'rgba(76, 175, 80, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Ondas de Elliott':
        // Elliott Wave pattern
        const wavePoints = [
          { x: width * 0.1, y: height * 0.6 },
          { x: width * 0.2, y: height * 0.4 },
          { x: width * 0.3, y: height * 0.7 },
          { x: width * 0.4, y: height * 0.3 },
          { x: width * 0.5, y: height * 0.6 },
          { x: width * 0.6, y: height * 0.5 },
          { x: width * 0.7, y: height * 0.6 },
          { x: width * 0.8, y: height * 0.4 },
          { x: width * 0.9, y: height * 0.5 }
        ];
        
        elements.push({
          type: 'pattern',
          patternType: 'eliotwave',
          points: wavePoints,
          color: 'rgba(121, 85, 72, 0.8)',
          thickness: 2.5 * scale
        });
        
        // Add wave numbers
        ['1', '2', '3', '4', '5', 'a', 'b', 'c'].forEach((label, i) => {
          if (i < wavePoints.length - 1) {
            const x = (wavePoints[i].x + wavePoints[i+1].x) / 2;
            const y = (wavePoints[i].y + wavePoints[i+1].y) / 2 - 15;
            
            elements.push({
              type: 'label',
              position: { x, y },
              text: label,
              color: 'rgba(121, 85, 72, 1)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)'
            });
          }
        });
        
        elements.push({
          type: 'label',
          position: { x: width * 0.1, y: height * 0.25 },
          text: 'Ondas de Elliott',
          color: 'rgba(121, 85, 72, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Teoria de Dow':
        // Dow Theory pattern - higher highs and higher lows
        const dowPoints = [
          { x: width * 0.1, y: height * 0.7 },
          { x: width * 0.25, y: height * 0.5 },
          { x: width * 0.4, y: height * 0.6 },
          { x: width * 0.55, y: height * 0.4 },
          { x: width * 0.7, y: height * 0.5 },
          { x: width * 0.85, y: height * 0.3 }
        ];
        
        elements.push({
          type: 'pattern',
          patternType: 'dowtheory',
          points: dowPoints,
          color: 'rgba(63, 81, 181, 0.8)',
          thickness: 2.5 * scale
        });
        
        // Add trend lines connecting highs and lows
        const highPoints = [
          { x: width * 0.25, y: height * 0.5 },
          { x: width * 0.55, y: height * 0.4 },
          { x: width * 0.85, y: height * 0.3 }
        ];
        
        const lowPoints = [
          { x: width * 0.1, y: height * 0.7 },
          { x: width * 0.4, y: height * 0.6 },
          { x: width * 0.7, y: height * 0.5 }
        ];
        
        elements.push({
          type: 'line',
          points: highPoints,
          color: 'rgba(63, 81, 181, 0.8)',
          thickness: 1.5 * scale,
          dashArray: [5, 3]
        });
        
        elements.push({
          type: 'line',
          points: lowPoints,
          color: 'rgba(63, 81, 181, 0.8)',
          thickness: 1.5 * scale,
          dashArray: [5, 3]
        });
        
        elements.push({
          type: 'label',
          position: { x: width * 0.25, y: height * 0.25 },
          text: 'Teoria de Dow',
          color: 'rgba(63, 81, 181, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Linha de Tendência':
        // Trend line
        const trendPoints = [
          { x: width * 0.1, y: height * 0.6 },
          { x: width * 0.9, y: height * 0.4 }
        ];
        
        elements.push({
          type: 'pattern',
          patternType: 'trendline',
          points: trendPoints,
          color: 'rgba(33, 150, 243, 0.8)',
          thickness: 2.5 * scale
        });
        
        elements.push({
          type: 'label',
          position: { x: width * 0.4, y: height * 0.35 },
          text: 'Linha de Tendência',
          color: 'rgba(33, 150, 243, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Retração de Fibonacci':
        // Fibonacci retracement levels (new pattern)
        const fibStart = { x: width * 0.1, y: height * 0.7 };
        const fibEnd = { x: width * 0.9, y: height * 0.3 };
        
        // Fibonacci levels: 0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%
        const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const fibColors = [
          'rgba(33, 150, 243, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(233, 30, 99, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(0, 188, 212, 0.8)',
          'rgba(33, 150, 243, 0.8)'
        ];
        
        // Draw the main trend line
        elements.push({
          type: 'line',
          points: [fibStart, fibEnd],
          color: 'rgba(33, 150, 243, 0.6)',
          thickness: 2 * scale
        });
        
        // Draw retracement levels
        fibLevels.forEach((level, i) => {
          const y = fibStart.y - (fibStart.y - fibEnd.y) * level;
          
          elements.push({
            type: 'line',
            points: [
              { x: width * 0.1, y },
              { x: width * 0.9, y }
            ],
            color: fibColors[i],
            thickness: 1.5 * scale,
            dashArray: level === 0 || level === 1 ? undefined : [5, 3]
          });
          
          // Add label for each level
          elements.push({
            type: 'label',
            position: { x: width * 0.92, y: y - 10 },
            text: `${(level * 100).toFixed(1)}%`,
            color: fibColors[i],
            backgroundColor: 'rgba(255, 255, 255, 0.7)'
          });
        });
        
        elements.push({
          type: 'label',
          position: { x: width * 0.5, y: height * 0.15 },
          text: 'Retração de Fibonacci',
          color: 'rgba(33, 150, 243, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
      
      case 'Padrão de Velas':
        // Candlestick patterns (new pattern)
        const candleX = width * 0.5;
        const candleY = height * 0.5;
        const candleWidth = width * 0.05;
        const candleHeight = height * 0.15;
        
        // Draw example candlestick pattern
        if (pattern.description?.includes('Doji')) {
          // Doji pattern
          elements.push({
            type: 'line',
            points: [
              { x: candleX, y: candleY - candleHeight/2 },
              { x: candleX, y: candleY + candleHeight/2 }
            ],
            color: 'rgba(33, 150, 243, 0.8)',
            thickness: 2 * scale
          });
          elements.push({
            type: 'line',
            points: [
              { x: candleX - candleWidth/4, y: candleY },
              { x: candleX + candleWidth/4, y: candleY }
            ],
            color: 'rgba(33, 150, 243, 0.8)',
            thickness: 2 * scale
          });
        } else if (pattern.description?.includes('martelo') || pattern.description?.includes('Martelo')) {
          // Hammer
          elements.push({
            type: 'line',
            points: [
              { x: candleX, y: candleY - candleHeight/6 },
              { x: candleX, y: candleY + candleHeight/2 }
            ],
            color: 'rgba(76, 175, 80, 0.8)',
            thickness: 2 * scale
          });
          elements.push({
            type: 'rectangle',
            position: { x: candleX - candleWidth/2, y: candleY - candleHeight/6 },
            width: candleWidth,
            height: candleHeight/6,
            color: 'rgba(76, 175, 80, 0.8)'
          });
        } else if (pattern.description?.includes('engolfo') || pattern.description?.includes('Engolfo')) {
          // Engulfing pattern
          elements.push({
            type: 'rectangle',
            position: { x: candleX - candleWidth, y: candleY - candleHeight/4 },
            width: candleWidth/2,
            height: candleHeight/2,
            color: 'rgba(244, 67, 54, 0.8)'
          });
          elements.push({
            type: 'rectangle',
            position: { x: candleX - candleWidth/2, y: candleY - candleHeight/3 },
            width: candleWidth,
            height: candleHeight/1.5,
            color: 'rgba(76, 175, 80, 0.8)'
          });
        } else {
          // Generic candle pattern
          elements.push({
            type: 'rectangle',
            position: { x: candleX - candleWidth/2, y: candleY - candleHeight/3 },
            width: candleWidth,
            height: candleHeight/1.5,
            color: pattern.action === 'compra' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'
          });
        }
        
        elements.push({
          type: 'label',
          position: { x: candleX, y: candleY - candleHeight/2 - 20 },
          text: 'Padrão de Velas',
          color: 'rgba(0, 0, 0, 0.8)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
         
      case 'Divergência':
        // Divergence pattern (new pattern)
        const pricePoints = [
          { x: width * 0.1, y: height * 0.5 },
          { x: width * 0.3, y: height * 0.4 },
          { x: width * 0.5, y: height * 0.3 },
          { x: width * 0.7, y: height * 0.4 },
          { x: width * 0.9, y: height * 0.2 }
        ];
        
        const indicatorPoints = [
          { x: width * 0.1, y: height * 0.6 },
          { x: width * 0.3, y: height * 0.5 },
          { x: width * 0.5, y: height * 0.7 },
          { x: width * 0.7, y: height * 0.6 },
          { x: width * 0.9, y: height * 0.8 }
        ];
        
        // Draw price line
        elements.push({
          type: 'line',
          points: pricePoints,
          color: 'rgba(33, 150, 243, 0.8)',
          thickness: 2 * scale
        });
        
        // Draw indicator line
        elements.push({
          type: 'line',
          points: indicatorPoints,
          color: 'rgba(156, 39, 176, 0.8)',
          thickness: 2 * scale,
          dashArray: [5, 3]
        });
        
        // Draw connection lines between significant points
        elements.push({
          type: 'line',
          points: [pricePoints[2], pricePoints[4]],
          color: 'rgba(233, 30, 99, 0.8)',
          thickness: 1.5 * scale
        });
        
        elements.push({
          type: 'line',
          points: [indicatorPoints[2], indicatorPoints[4]],
          color: 'rgba(233, 30, 99, 0.8)',
          thickness: 1.5 * scale
        });
        
        elements.push({
          type: 'label',
          position: { x: width * 0.5, y: height * 0.15 },
          text: 'Divergência',
          color: 'rgba(233, 30, 99, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
      
      case 'Triângulo Simétrico':
        // Symmetric triangle (new pattern)
        const trianglePoints1 = [
          { x: width * 0.1, y: height * 0.3 },
          { x: width * 0.9, y: height * 0.45 }
        ];
        
        const trianglePoints2 = [
          { x: width * 0.1, y: height * 0.7 },
          { x: width * 0.9, y: height * 0.45 }
        ];
        
        elements.push({
          type: 'line',
          points: trianglePoints1,
          color: 'rgba(33, 150, 243, 0.8)',
          thickness: 2 * scale
        });
        
        elements.push({
          type: 'line',
          points: trianglePoints2,
          color: 'rgba(33, 150, 243, 0.8)',
          thickness: 2 * scale
        });
        
        elements.push({
          type: 'label',
          position: { x: width * 0.5, y: height * 0.2 },
          text: 'Triângulo Simétrico',
          color: 'rgba(33, 150, 243, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      // New patterns for volume analysis
      case 'Volume Crescente':
      case 'Surto de Volume':
      case 'Divergência Volume-Preço':
        // Volume visualization
        const volumeBarWidth = width * 0.6;
        const volumeBarHeight = height * 0.15;
        const volumeX = width * 0.2;
        const volumeY = height * 0.8;
        
        // Draw volume bars
        for (let i = 0; i < 5; i++) {
          const barHeight = volumeBarHeight * (0.4 + (i * 0.15));
          const barColor = i >= 3 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(158, 158, 158, 0.8)';
          
          elements.push({
            type: 'rectangle',
            position: { 
              x: volumeX + (i * volumeBarWidth / 5), 
              y: volumeY - barHeight 
            },
            width: volumeBarWidth / 6,
            height: barHeight,
            color: barColor
          });
        }
        
        elements.push({
          type: 'label',
          position: { x: volumeX, y: volumeY - volumeBarHeight - 20 },
          text: pattern.type,
          color: 'rgba(0, 0, 0, 0.8)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      // New patterns for volatility analysis
      case 'Alta Volatilidade':
      case 'Contração de Volatilidade':
        // Volatility visualization
        const volatilityX = width * 0.5;
        const volatilityY = height * 0.5;
        const volatilityRadius = width * 0.15;
        
        if (pattern.type === 'Alta Volatilidade') {
          // Draw high volatility indicator
          elements.push({
            type: 'circle',
            center: { x: volatilityX, y: volatilityY },
            radius: volatilityRadius,
            color: 'rgba(244, 67, 54, 0.3)',
            thickness: 2 * scale
          });
          
          // Draw volatility spikes
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI / 4);
            const innerX = volatilityX + Math.cos(angle) * volatilityRadius * 0.7;
            const innerY = volatilityY + Math.sin(angle) * volatilityRadius * 0.7;
            const outerX = volatilityX + Math.cos(angle) * volatilityRadius * 1.3;
            const outerY = volatilityY + Math.sin(angle) * volatilityRadius * 1.3;
            
            elements.push({
              type: 'line',
              points: [
                { x: innerX, y: innerY },
                { x: outerX, y: outerY }
              ],
              color: 'rgba(244, 67, 54, 0.8)',
              thickness: 1.5 * scale
            });
          }
        } else {
          // Draw contracting volatility indicator
          elements.push({
            type: 'circle',
            center: { x: volatilityX, y: volatilityY },
            radius: volatilityRadius * 0.7,
            color: 'rgba(33, 150, 243, 0.3)',
            thickness: 2 * scale
          });
          
          elements.push({
            type: 'circle',
            center: { x: volatilityX, y: volatilityY },
            radius: volatilityRadius,
            color: 'rgba(158, 158, 158, 0.3)',
            thickness: 1 * scale,
            dashArray: [5, 3]
          });
        }
        
        elements.push({
          type: 'label',
          position: { x: volatilityX, y: volatilityY - volatilityRadius - 20 },
          text: pattern.type,
          color: 'rgba(0, 0, 0, 0.8)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      // New patterns for market context
      case 'Fase de Acumulação':
        // Accumulation phase visualization
        const accX = width * 0.5;
        const accY = height * 0.6;
        const accWidth = width * 0.7;
        const accHeight = height * 0.3;
        
        // Draw accumulation range
        elements.push({
          type: 'line',
          points: [
            { x: width * 0.15, y: accY - accHeight * 0.3 },
            { x: width * 0.85, y: accY - accHeight * 0.3 }
          ],
          color: 'rgba(244, 67, 54, 0.8)',
          thickness: 2 * scale,
          dashArray: [5, 3]
        });
        
        elements.push({
          type: 'line',
          points: [
            { x: width * 0.15, y: accY + accHeight * 0.3 },
            { x: width * 0.85, y: accY + accHeight * 0.3 }
          ],
          color: 'rgba(76, 175, 80, 0.8)',
          thickness: 2 * scale,
          dashArray: [5, 3]
        });
        
        // Draw price action in accumulation
        const accPoints = [
          { x: width * 0.15, y: accY },
          { x: width * 0.25, y: accY - accHeight * 0.2 },
          { x: width * 0.35, y: accY + accHeight * 0.25 },
          { x: width * 0.45, y: accY - accHeight * 0.1 },
          { x: width * 0.55, y: accY + accHeight * 0.28 },
          { x: width * 0.65, y: accY - accHeight * 0.15 },
          { x: width * 0.75, y: accY + accHeight * 0.2 },
          { x: width * 0.85, y: accY - accHeight * 0.25 }
        ];
        
        elements.push({
          type: 'line',
          points: accPoints,
          color: 'rgba(33, 150, 243, 0.8)',
          thickness: 2 * scale
        });
        
        elements.push({
          type: 'label',
          position: { x: width * 0.5, y: accY - accHeight * 0.5 },
          text: 'Fase de Acumulação',
          color: 'rgba(76, 175, 80, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Fase de Distribuição':
        // Distribution phase visualization
        const distX = width * 0.5;
        const distY = height * 0.4;
        const distWidth = width * 0.7;
        const distHeight = height * 0.3;
        
        // Draw distribution range
        elements.push({
          type: 'line',
          points: [
            { x: width * 0.15, y: distY - distHeight * 0.3 },
            { x: width * 0.85, y: distY - distHeight * 0.3 }
          ],
          color: 'rgba(244, 67, 54, 0.8)',
          thickness: 2 * scale,
          dashArray: [5, 3]
        });
        
        elements.push({
          type: 'line',
          points: [
            { x: width * 0.15, y: distY + distHeight * 0.3 },
            { x: width * 0.85, y: distY + distHeight * 0.3 }
          ],
          color: 'rgba(76, 175, 80, 0.8)',
          thickness: 2 * scale,
          dashArray: [5, 3]
        });
        
        // Draw price action in distribution
        const distPoints = [
          { x: width * 0.15, y: distY },
          { x: width * 0.25, y: distY - distHeight * 0.25 },
          { x: width * 0.35, y: distY + distHeight * 0.2 },
          { x: width * 0.45, y: distY - distHeight * 0.28 },
          { x: width * 0.55, y: distY + distHeight * 0.1 },
          { x: width * 0.65, y: distY - distHeight * 0.2 },
          { x: width * 0.75, y: distY + distHeight * 0.15 },
          { x: width * 0.85, y: distY + distHeight * 0.25 }
        ];
        
        elements.push({
          type: 'line',
          points: distPoints,
          color: 'rgba(33, 150, 243, 0.8)',
          thickness: 2 * scale
        });
        
        elements.push({
          type: 'label',
          position: { x: width * 0.5, y: distY - distHeight * 0.5 },
          text: 'Fase de Distribuição',
          color: 'rgba(244, 67, 54, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      case 'Tendência Estabelecida':
        // Established trend visualization
        const trendX = width * 0.1;
        const trendY = height * 0.7;
        const trendWidth = width * 0.8;
        const trendHeight = height * 0.4;
        
        // Draw trend channel
        const upperTrendPoints = [
          { x: trendX, y: trendY - trendHeight * 0.5 },
          { x: trendX + trendWidth, y: trendY - trendHeight * 0.9 }
        ];
        
        const lowerTrendPoints = [
          { x: trendX, y: trendY },
          { x: trendX + trendWidth, y: trendY - trendHeight * 0.4 }
        ];
        
        elements.push({
          type: 'line',
          points: upperTrendPoints,
          color: 'rgba(244, 67, 54, 0.8)',
          thickness: 2 * scale,
          dashArray: [5, 3]
        });
        
        elements.push({
          type: 'line',
          points: lowerTrendPoints,
          color: 'rgba(76, 175, 80, 0.8)',
          thickness: 2 * scale,
          dashArray: [5, 3]
        });
        
        // Draw price action in trend
        const trendActionPoints = [
          { x: trendX, y: trendY - trendHeight * 0.1 },
          { x: trendX + trendWidth * 0.2, y: trendY - trendHeight * 0.25 },
          { x: trendX + trendWidth * 0.3, y: trendY - trendHeight * 0.2 },
          { x: trendX + trendWidth * 0.4, y: trendY - trendHeight * 0.4 },
          { x: trendX + trendWidth * 0.5, y: trendY - trendHeight * 0.35 },
          { x: trendX + trendWidth * 0.6, y: trendY - trendHeight * 0.55 },
          { x: trendX + trendWidth * 0.7, y: trendY - trendHeight * 0.5 },
          { x: trendX + trendWidth * 0.8, y: trendY - trendHeight * 0.7 }
        ];
        
        elements.push({
          type: 'line',
          points: trendActionPoints,
          color: 'rgba(33, 150, 243, 0.8)',
          thickness: 2 * scale
        });
        
        // Draw EMA lines
        const ema9Points = trendActionPoints.map((p, i) => ({
          x: p.x,
          y: p.y + Math.sin(i) * 5 + 10
        }));
        
        const ema21Points = trendActionPoints.map((p, i) => ({
          x: p.x,
          y: p.y + Math.sin(i) * 8 + 20
        }));
        
        elements.push({
          type: 'line',
          points: ema9Points,
          color: 'rgba(255, 152, 0, 0.8)',
          thickness: 1.5 * scale
        });
        
        elements.push({
          type: 'line',
          points: ema21Points,
          color: 'rgba(156, 39, 176, 0.8)',
          thickness: 1.5 * scale
        });
        
        elements.push({
          type: 'label',
          position: { x: width * 0.5, y: height * 0.2 },
          text: 'Tendência Estabelecida',
          color: 'rgba(33, 150, 243, 1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
        
      default:
        // For unrecognized patterns, add a simple label
        elements.push({
          type: 'label',
          position: { x: width * 0.5 - 50, y: height * 0.5 },
          text: pattern.type,
          color: 'rgba(0, 0, 0, 0.8)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        });
        break;
    }
  });
  
  return elements;
};

export const detectCandles = async (
  imageUrl: string, 
  chartWidth: number, 
  chartHeight: number
): Promise<CandleData[]> => {
  // In a real implementation, this would use computer vision to detect candles
  // For now, we'll return mock data with improved detail
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create a realistic array of candle data based on chart dimensions
  const candles: CandleData[] = [];
  const candleWidth = chartWidth * 0.02;
  const candleSpacing = chartWidth * 0.03;
  const candleCount = Math.floor(chartWidth / candleSpacing) - 1;
  
  // Base Y position and range for realistic candle display
  const baseY = chartHeight * 0.6;
  const priceRange = chartHeight * 0.4;
  
  // Generate mock candles
  for (let i = 0; i < candleCount; i++) {
    const x = candleSpacing * (i + 1);
    
    // Create some realistic price patterns
    let open, high, low, close;
    const trend = Math.sin(i * 0.3) + Math.random() * 0.5;
    
    if (trend > 0) {
      // Bullish candle
      open = baseY + Math.random() * priceRange * 0.5;
      close = open - Math.random() * priceRange * 0.3;
      high = close - Math.random() * priceRange * 0.2;
      low = open + Math.random() * priceRange * 0.2;
    } else {
      // Bearish candle
      open = baseY + Math.random() * priceRange * 0.5;
      close = open + Math.random() * priceRange * 0.3;
      high = open - Math.random() * priceRange * 0.2;
      low = close + Math.random() * priceRange * 0.2;
    }
    
    candles.push({
      open,
      high,
      low,
      close,
      color: close < open ? 'verde' : 'vermelho',
      position: { x, y: (open + close) / 2 },
      width: candleWidth,
      height: Math.abs(close - open)
    });
  }
  
  return candles;
};
