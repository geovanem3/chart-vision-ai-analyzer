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
      description: 'Forte nível de suporte identificado',
      action: 'compra'
    },
    {
      type: 'Tendência',
      confidence: 0.72,
      description: 'Tendência de alta com momentum positivo',
      action: 'compra'
    },
    {
      type: 'Volume',
      confidence: 0.68,
      description: 'Aumento de volume confirmando movimento',
      action: 'compra'
    },
    {
      type: 'Padrão Gráfico',
      confidence: 0.76,
      description: 'Triângulo ascendente formado',
      action: 'compra',
      recommendation: 'Aguardar confirmação da quebra da resistência'
    },
    {
      type: 'Divergência',
      confidence: 0.65,
      description: 'Divergência positiva no RSI',
      action: 'compra'
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
