
// Add imports from AnalyzerContext
import { PatternResult, TechnicalElement, Point, CandleData } from '@/context/AnalyzerContext';

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

// Adjusted to include scale parameter for proportional display
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
  
  // For each pattern type, generate appropriate technical elements
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

export const detectPatterns = async (imageUrl: string): Promise<PatternResult[]> => {
  // In a real implementation, this would use computer vision or ML to detect patterns
  // For now, we'll return mock data
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock patterns
  return [
    {
      type: 'Tendência de Alta',
      confidence: 0.85,
      description: 'Identificada uma tendência de alta com sucessivos topos e fundos ascendentes.',
      recommendation: 'Considere posições compradas com stop abaixo do último fundo relevante.',
      action: 'compra'
    },
    {
      type: 'Suporte/Resistência',
      confidence: 0.92,
      description: 'Níveis de suporte e resistência bem definidos no gráfico.',
      recommendation: 'Observe possíveis reversões nos níveis de suporte/resistência identificados.',
      action: 'neutro'
    },
    {
      type: 'Triângulo',
      confidence: 0.78,
      description: 'Formação de triângulo ascendente, indicando possível continuação da tendência de alta.',
      recommendation: 'Aguarde confirmação de rompimento da linha superior do triângulo para entrar comprado.',
      action: 'compra'
    }
  ];
};

export const detectCandles = async (
  imageUrl: string, 
  chartWidth: number, 
  chartHeight: number
): Promise<CandleData[]> => {
  // In a real implementation, this would use computer vision to detect candles
  // For now, we'll return mock data
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return example candles for demonstration
  return [];
};
