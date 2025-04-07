
// Add imports from AnalyzerContext
import { PatternResult, TechnicalElement, Point, CandleData, ScalpingSignal } from '@/context/AnalyzerContext';

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
  
  // Recomendações específicas para scalping em 1 minuto
  if (timeframe === '1m') {
    if (bullishWeight > 0.5) {  // Reduced threshold for 1m timeframe
      return `Oportunidade de scalping de COMPRA no ${timeframeText}: Aguarde confirmação de quebra de resistência com volume. Busque entrada precisa com stops ajustados de 0.5-1% e alvo de 2-3% ou na próxima resistência. Monitore constantemente.`;
    } else if (bearishWeight > 0.5) {  // Reduced threshold for 1m timeframe
      return `Oportunidade de scalping de VENDA no ${timeframeText}: Aguarde confirmação de quebra de suporte com volume. Busque entrada precisa com stops ajustados de 0.5-1% e alvo de 2-3% ou no próximo suporte. Monitore constantemente.`;
    } else if (bullishWeight > bearishWeight && bullishWeight > 0.3) {  // Reduced threshold for 1m timeframe
      return `Viés de alta com oportunidade potencial no ${timeframeText}: Prepare-se para possível entrada de compra, mas aguarde confirmação de candle de alta com volume aumentado. Sinais ainda mistos.`;
    } else if (bearishWeight > bullishWeight && bearishWeight > 0.3) {  // Reduced threshold for 1m timeframe
      return `Viés de baixa com oportunidade potencial no ${timeframeText}: Prepare-se para possível entrada de venda, mas aguarde confirmação de candle de baixa com volume aumentado. Sinais ainda mistos.`;
    } else {
      return `Mercado sem direção clara no ${timeframeText}: Evite entradas de scalping neste momento. Aguarde formação de um padrão direcional mais definido. Oportunidade potencial em consolidação.`;
    }
  }
  
  // Recomendações para outros timeframes (original)
  if (bullishWeight > 0.6) {
    return `Tendência de alta no ${timeframeText}: Os padrões identificados sugerem uma forte probabilidade de movimento ascendente. Considere posições compradas com stops abaixo dos níveis de suporte identificados.`;
  } else if (bearishWeight > 0.6) {
    return `Tendência de baixa no ${timeframeText}: Os padrões identificados sugerem uma forte probabilidade de movimento descendente. Considere posições vendidas com stops acima dos níveis de resistência identificados.`;
  } else if (bullishWeight > bearishWeight && bullishWeight > 0.4) {
    return `Viés de alta no ${timeframeText}: Há um viés positivo, mas com sinais mistos. Aguarde confirmação por quebra de resistências antes de entrar em posições compradas.`;
  } else if (bearishWeight > bullishWeight && bearishWeight > 0.4) {
    return `Viés de baixa no ${timeframeText}: Há um viés negativo, mas com sinais mistos. Aguarde confirmação por quebra de suportes antes de entrar em posições vendidas.`;
  } else {
    return `Mercado lateralizado no ${timeframeText}: Os padrões detectados não indicam uma direção clara. Recomenda-se aguardar por confirmação de rompimento de suportes ou resistências.`;
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
    
    return pattern;
  });
};

// New function to generate scalping signals specifically for 1m timeframe
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
  
  // Generate scalping signals based on pattern combinations
  if (highConfidencePatterns.length > 0) {
    const dominantPattern = highConfidencePatterns[0];
    const hasVolumeConfirmation = volumePatterns.length > 0;
    const hasSupportResistance = supportResistance.length > 0;
    
    // Only generate entry signal if we have enough confirmation
    if ((hasVolumeConfirmation || hasSupportResistance || momentumPatterns.length > 0)) {
      signals.push({
        type: 'entrada',
        action: dominantPattern.action as 'compra' | 'venda',
        price: dominantPattern.action === 'compra' 
          ? 'Rompimento acima da média móvel ou resistência' 
          : 'Rompimento abaixo da média móvel ou suporte',
        confidence: dominantPattern.confidence * (hasVolumeConfirmation ? 1.2 : 1),
        timeframe: '1m',
        description: `${dominantPattern.type}: ${dominantPattern.description}`,
        target: dominantPattern.action === 'compra'
          ? 'Próxima resistência ou +2-3% do preço atual'
          : 'Próximo suporte ou -2-3% do preço atual',
        stopLoss: dominantPattern.action === 'compra'
          ? '0.5-1% abaixo do ponto de entrada'
          : '0.5-1% acima do ponto de entrada'
      });
      
      // Add exit signal for risk management
      signals.push({
        type: 'saída',
        action: dominantPattern.action as 'compra' | 'venda',
        price: 'Take profit ou stop loss',
        confidence: dominantPattern.confidence * 0.9,
        timeframe: '1m',
        description: `Encerre a posição de scalping em ${dominantPattern.action === 'compra' ? 'compra' : 'venda'} no alcance do objetivo ou na ativação do stop loss. Não permaneça em posição por mais de 3-5 candles.`
      });
    }
  }
  
  // Add signals based on specific reversal patterns for scalping
  const reversalPatterns = patterns.filter(
    p => p.type.toLowerCase().includes('reversão') || 
    p.description?.toLowerCase().includes('doji') ||
    p.description?.toLowerCase().includes('martelo') ||
    p.description?.toLowerCase().includes('engolfo')
  );
  
  reversalPatterns.forEach(pattern => {
    if (pattern.confidence > 0.7) {
      signals.push({
        type: 'entrada',
        action: pattern.action as 'compra' | 'venda',
        price: 'Confirmação após padrão de reversão',
        confidence: pattern.confidence,
        timeframe: '1m',
        description: `Padrão de reversão: ${pattern.description}`,
        target: pattern.action === 'compra'
          ? 'Próxima resistência ou +1.5-2% do preço atual'
          : 'Próximo suporte ou -1.5-2% do preço atual',
        stopLoss: pattern.action === 'compra'
          ? '0.5% abaixo do ponto de entrada ou abaixo da mínima do candle'
          : '0.5% acima do ponto de entrada ou acima da máxima do candle'
      });
    }
  });
  
  return signals;
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
    }
  ];
  
  // Validate patterns against support/resistance
  return validatePatterns(patterns);
};

export const detectFalseSignals = (patterns: PatternResult[]): { 
  hasFalseSignals: boolean, 
  warnings: string[] 
} => {
  const warnings: string[] = [];
  
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
