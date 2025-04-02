
import { PatternResult, TechnicalElement, Point, CandleData } from '../context/AnalyzerContext';

/**
 * Detect chart patterns in the processed image
 * In a real implementation, this would use computer vision algorithms or ML models
 */
export const detectPatterns = async (imageUrl: string): Promise<PatternResult[]> => {
  console.log('Detectando padrões na imagem:', imageUrl);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For demonstration, return a mix of patterns with different confidence levels
  // In a real app, these would be actual detected patterns
  return [
    {
      type: 'Tendência',
      confidence: 0.87,
      description: 'Tendência de alta detectada',
      recommendation: 'Considere posições de compra com gerenciamento de risco adequado',
      action: 'compra'
    },
    {
      type: 'Médias Móveis',
      confidence: 0.92,
      description: 'Preço acima das médias móveis de 50 e 200 dias',
      recommendation: 'Cruzamento de médias indica momentum de alta',
      action: 'compra'
    },
    {
      type: 'Suporte/Resistência',
      confidence: 0.78,
      description: 'Múltiplos níveis de resistência identificados em preços mais altos',
      recommendation: 'Observe uma ruptura acima da resistência',
      action: 'neutro'
    },
    {
      type: 'Padrão de Candle',
      confidence: 0.65,
      description: 'Potencial padrão de engolfo de alta',
      recommendation: 'Confirme com volume e aguarde confirmação adicional',
      action: 'compra'
    },
    {
      type: 'RSI',
      confidence: 0.81,
      description: 'Valor de RSI (Índice de Força Relativa) aproximadamente 58',
      recommendation: 'Não está sobrecomprado, ainda há espaço para movimento ascendente',
      action: 'compra'
    },
    {
      type: 'Ondas de Elliott',
      confidence: 0.72,
      description: 'Possivelmente na onda 3 da estrutura de 5 ondas de Elliott',
      recommendation: 'Potencial para movimento ascendente contínuo antes da correção',
      action: 'compra'
    },
    {
      type: 'Retração de Fibonacci',
      confidence: 0.79,
      description: 'Preço testando nível de retração de Fibonacci de 0.618',
      recommendation: 'Nível de suporte chave, observe para ver se há salto ou quebra',
      action: 'neutro'
    },
    {
      type: 'Teoria de Dow',
      confidence: 0.68,
      description: 'A tendência primária parece de alta com máximas e mínimas mais altas',
      recommendation: 'Alinhe posições com a direção da tendência primária',
      action: 'compra'
    },
    {
      type: 'Ombro-Cabeça-Ombro',
      confidence: 0.55,
      description: 'Possível formação de Ombro-Cabeça-Ombro invertido em desenvolvimento',
      recommendation: 'Aguarde a quebra da linha do pescoço para confirmar reversão de baixa para alta',
      action: 'neutro'
    },
    {
      type: 'Triângulo',
      confidence: 0.62,
      description: 'Formação de triângulo ascendente detectada',
      recommendation: 'Padrão de continuação de alta, acompanhe potencial breakout',
      action: 'compra'
    },
    {
      type: 'Cunha',
      confidence: 0.58,
      description: 'Cunha de baixa formando-se no topo da tendência',
      recommendation: 'Possível reversão da atual tendência de alta',
      action: 'neutro'
    },
    {
      type: 'Bandeira',
      confidence: 0.75,
      description: 'Bandeira de alta identificada após movimento ascendente forte',
      recommendation: 'Padrão de continuação, espere movimento na direção da tendência principal',
      action: 'compra'
    },
    {
      type: 'Topo/Fundo Duplo',
      confidence: 0.67,
      description: 'Fundo duplo se formando após tendência de baixa',
      recommendation: 'Sinal de reversão se confirmado com volume e quebra de resistência',
      action: 'compra'
    }
  ];
};

/**
 * Analyze the results to provide a summary recommendation
 */
export const analyzeResults = (patterns: PatternResult[]): string => {
  // Calculate average confidence
  const avgConfidence = patterns.reduce((sum, pattern) => sum + pattern.confidence, 0) / patterns.length;
  
  // Count bullish vs bearish patterns
  const bullishPatterns = patterns.filter(p => p.action === 'compra').length;
  const bearishPatterns = patterns.filter(p => p.action === 'venda').length;
  
  // Generate simple recommendation
  if (avgConfidence < 0.7) {
    return 'A confiança da análise é baixa. Considere reunir mais informações.';
  } else if (bullishPatterns > bearishPatterns) {
    return 'Padrões geralmente de alta detectados. Considere potenciais oportunidades de compra.';
  } else if (bearishPatterns > bullishPatterns) {
    return 'Padrões geralmente de baixa detectados. Tenha cuidado com riscos de queda.';
  } else {
    return 'Sinais mistos detectados. O mercado pode continuar lateralizado.';
  }
};

/**
 * Generate technical markup elements for visualization
 */
export const generateTechnicalMarkup = (patterns: PatternResult[], imageWidth: number, imageHeight: number): TechnicalElement[] => {
  const elements: TechnicalElement[] = [];
  
  // Helper to generate random positions within the image bounds
  const randomPosition = () => {
    return {
      x: Math.floor(imageWidth * 0.1 + Math.random() * imageWidth * 0.8),
      y: Math.floor(imageHeight * 0.1 + Math.random() * imageHeight * 0.8)
    };
  };
  
  // Map patterns to visual elements
  patterns.forEach(pattern => {
    switch(pattern.type) {
      case 'Tendência':
        // Add trend line
        const isBullish = pattern.action === 'compra';
        const startPoint = randomPosition();
        const endPoint = {
          x: startPoint.x + imageWidth * 0.3,
          y: isBullish ? startPoint.y - imageHeight * 0.2 : startPoint.y + imageHeight * 0.2
        };
        
        elements.push({
          type: 'line',
          points: [startPoint, endPoint],
          color: isBullish ? '#22c55e' : '#ef4444',
          thickness: 2,
          label: isBullish ? 'Tendência Alta' : 'Tendência Baixa'
        });
        break;
        
      case 'Suporte/Resistência':
        // Add horizontal support/resistance lines
        const isResistance = pattern.description.toLowerCase().includes('resistência');
        const yPosition = isResistance ? imageHeight * 0.35 : imageHeight * 0.65;
        
        elements.push({
          type: 'line',
          points: [
            { x: imageWidth * 0.1, y: yPosition },
            { x: imageWidth * 0.9, y: yPosition }
          ],
          color: isResistance ? '#ef4444' : '#22c55e',
          thickness: 2,
          dashArray: [5, 5],
          label: isResistance ? 'Resistência' : 'Suporte'
        });
        break;
        
      case 'Retração de Fibonacci':
        // Add Fibonacci lines
        const fibStart = { x: imageWidth * 0.1, y: imageHeight * 0.3 };
        const fibEnd = { x: imageWidth * 0.1, y: imageHeight * 0.7 };
        
        const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        fibLevels.forEach(level => {
          const yPos = fibStart.y + (fibEnd.y - fibStart.y) * level;
          elements.push({
            type: 'line',
            points: [
              { x: imageWidth * 0.1, y: yPos },
              { x: imageWidth * 0.9, y: yPos }
            ],
            color: '#0ea5e9',
            thickness: level === 0.618 ? 2 : 1,
            dashArray: level === 0.5 ? [5, 5] : undefined,
            label: level === 0.618 ? `Fib ${level}` : undefined
          });
        });
        break;
        
      case 'Ondas de Elliott':
        // Add Elliott wave numbers
        const wavePoints = [
          { x: imageWidth * 0.2, y: imageHeight * 0.6 },
          { x: imageWidth * 0.3, y: imageHeight * 0.4 },
          { x: imageWidth * 0.5, y: imageHeight * 0.7 },
          { x: imageWidth * 0.6, y: imageHeight * 0.5 },
          { x: imageWidth * 0.8, y: imageHeight * 0.3 }
        ];
        
        // Add wave lines
        for (let i = 0; i < wavePoints.length - 1; i++) {
          elements.push({
            type: 'line',
            points: [wavePoints[i], wavePoints[i+1]],
            color: '#0ea5e9',
            thickness: 2
          });
        }
        
        // Add wave labels
        wavePoints.forEach((point, index) => {
          elements.push({
            type: 'label',
            position: point,
            text: `${index + 1}`,
            color: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.2)'
          });
        });
        break;
        
      case 'Padrão de Candle':
        // Mark candlestick pattern
        const candlePos = randomPosition();
        elements.push({
          type: 'rectangle',
          position: candlePos,
          width: imageWidth * 0.15,
          height: imageHeight * 0.15,
          color: '#f59e0b',
          thickness: 2,
          dashArray: [5, 5],
          label: 'Padrão de Alta'
        });
        break;
        
      case 'Teoria de Dow':
        // Show primary trend direction
        const dowStart = { x: imageWidth * 0.2, y: imageHeight * 0.6 };
        elements.push({
          type: 'arrow',
          start: dowStart,
          end: { x: dowStart.x + imageWidth * 0.6, y: dowStart.y - imageHeight * 0.3 },
          color: '#22c55e',
          thickness: 3,
          label: 'Tendência Primária'
        });
        break;
        
      case 'Ombro-Cabeça-Ombro':
        // Draw head and shoulders pattern
        const ocoY = imageHeight * 0.5;
        const ocoPoints = [
          { x: imageWidth * 0.2, y: ocoY - imageHeight * 0.1 }, // left shoulder
          { x: imageWidth * 0.35, y: ocoY }, // left arm pit
          { x: imageWidth * 0.5, y: ocoY - imageHeight * 0.2 }, // head
          { x: imageWidth * 0.65, y: ocoY }, // right arm pit
          { x: imageWidth * 0.8, y: ocoY - imageHeight * 0.1 } // right shoulder
        ];
        
        elements.push({
          type: 'line',
          points: ocoPoints,
          color: '#f43f5e',
          thickness: 2,
          label: 'OCO'
        });
        
        // Add neckline
        elements.push({
          type: 'line',
          points: [
            { x: imageWidth * 0.2, y: ocoY + imageHeight * 0.05 },
            { x: imageWidth * 0.8, y: ocoY + imageHeight * 0.05 }
          ],
          color: '#f43f5e',
          thickness: 2,
          dashArray: [5, 5],
          label: 'Linha do Pescoço'
        });
        break;
        
      case 'Triângulo':
        // Draw triangle pattern
        const isAscending = pattern.description.toLowerCase().includes('ascendente');
        const triangleY = imageHeight * 0.5;
        
        if (isAscending) {
          elements.push({
            type: 'line',
            points: [
              { x: imageWidth * 0.2, y: triangleY + imageHeight * 0.1 },
              { x: imageWidth * 0.8, y: triangleY + imageHeight * 0.1 }
            ],
            color: '#22c55e',
            thickness: 2,
            label: 'Suporte'
          });
          
          elements.push({
            type: 'line',
            points: [
              { x: imageWidth * 0.2, y: triangleY + imageHeight * 0.2 },
              { x: imageWidth * 0.8, y: triangleY }
            ],
            color: '#22c55e',
            thickness: 2,
            label: 'Resistência Descendente'
          });
        } else {
          elements.push({
            type: 'line',
            points: [
              { x: imageWidth * 0.2, y: triangleY },
              { x: imageWidth * 0.8, y: triangleY + imageHeight * 0.2 }
            ],
            color: '#ef4444',
            thickness: 2,
            label: 'Suporte Descendente'
          });
          
          elements.push({
            type: 'line',
            points: [
              { x: imageWidth * 0.2, y: triangleY - imageHeight * 0.2 },
              { x: imageWidth * 0.8, y: triangleY - imageHeight * 0.2 }
            ],
            color: '#ef4444',
            thickness: 2,
            label: 'Resistência'
          });
        }
        break;
        
      case 'Cunha':
        // Draw wedge pattern
        const isBearishWedge = pattern.description.toLowerCase().includes('baixa');
        const wedgeStartY = imageHeight * 0.5;
        
        if (isBearishWedge) {
          elements.push({
            type: 'line',
            points: [
              { x: imageWidth * 0.2, y: wedgeStartY - imageHeight * 0.2 },
              { x: imageWidth * 0.8, y: wedgeStartY - imageHeight * 0.05 }
            ],
            color: '#ef4444',
            thickness: 2
          });
          
          elements.push({
            type: 'line',
            points: [
              { x: imageWidth * 0.2, y: wedgeStartY },
              { x: imageWidth * 0.8, y: wedgeStartY - imageHeight * 0.05 }
            ],
            color: '#ef4444',
            thickness: 2,
            label: 'Cunha de Baixa'
          });
        } else {
          elements.push({
            type: 'line',
            points: [
              { x: imageWidth * 0.2, y: wedgeStartY },
              { x: imageWidth * 0.8, y: wedgeStartY - imageHeight * 0.15 }
            ],
            color: '#22c55e',
            thickness: 2
          });
          
          elements.push({
            type: 'line',
            points: [
              { x: imageWidth * 0.2, y: wedgeStartY + imageHeight * 0.2 },
              { x: imageWidth * 0.8, y: wedgeStartY - imageHeight * 0.15 }
            ],
            color: '#22c55e',
            thickness: 2,
            label: 'Cunha de Alta'
          });
        }
        break;
        
      case 'Bandeira':
        // Draw flag pattern
        const flagY = imageHeight * 0.4;
        
        // Draw pole
        elements.push({
          type: 'line',
          points: [
            { x: imageWidth * 0.2, y: flagY + imageHeight * 0.3 },
            { x: imageWidth * 0.2, y: flagY }
          ],
          color: '#22c55e',
          thickness: 3
        });
        
        // Draw flag
        elements.push({
          type: 'line',
          points: [
            { x: imageWidth * 0.2, y: flagY },
            { x: imageWidth * 0.4, y: flagY + imageHeight * 0.05 },
            { x: imageWidth * 0.2, y: flagY + imageHeight * 0.1 },
            { x: imageWidth * 0.4, y: flagY + imageHeight * 0.15 }
          ],
          color: '#22c55e',
          thickness: 2,
          label: 'Bandeira'
        });
        break;
        
      case 'Topo/Fundo Duplo':
        // Draw double bottom pattern
        const isBottom = pattern.description.toLowerCase().includes('fundo');
        const doubleY = isBottom ? imageHeight * 0.7 : imageHeight * 0.3;
        
        elements.push({
          type: 'line',
          points: [
            { x: imageWidth * 0.2, y: doubleY },
            { x: imageWidth * 0.35, y: doubleY - imageHeight * (isBottom ? -0.15 : 0.15) },
            { x: imageWidth * 0.5, y: doubleY },
            { x: imageWidth * 0.65, y: doubleY - imageHeight * (isBottom ? -0.15 : 0.15) },
            { x: imageWidth * 0.8, y: doubleY }
          ],
          color: isBottom ? '#22c55e' : '#ef4444',
          thickness: 2,
          label: isBottom ? 'Fundo Duplo' : 'Topo Duplo'
        });
        
        // Draw resistance/support line
        elements.push({
          type: 'line',
          points: [
            { x: imageWidth * 0.2, y: doubleY - imageHeight * (isBottom ? -0.15 : 0.15) },
            { x: imageWidth * 0.8, y: doubleY - imageHeight * (isBottom ? -0.15 : 0.15) }
          ],
          color: isBottom ? '#22c55e' : '#ef4444',
          thickness: 2,
          dashArray: [5, 5],
          label: isBottom ? 'Resistência' : 'Suporte'
        });
        break;
    }
  });
  
  return elements;
};

/**
 * Detect candles in the image - in a real application this would use
 * computer vision to identify actual candles in the chart
 */
export const detectCandles = (imageWidth: number, imageHeight: number): CandleData[] => {
  const candles: CandleData[] = [];
  const totalCandles = 20;
  const candleWidth = (imageWidth * 0.8) / totalCandles;
  
  for (let i = 0; i < totalCandles; i++) {
    const x = imageWidth * 0.1 + i * candleWidth;
    const isBullish = Math.random() > 0.5;
    
    // Generate random candle data
    const open = 100 + Math.random() * 20;
    const close = isBullish ? 
      open + Math.random() * 10 : 
      open - Math.random() * 10;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    
    // Convert price to y-position
    const baseY = imageHeight * 0.8;
    const scale = imageHeight * 0.6 / 50; // 50 price units in chart height
    
    const position = {
      x: x,
      y: isBullish ? baseY - close * scale : baseY - open * scale
    };
    
    const height = Math.abs(close - open) * scale;
    
    candles.push({
      open,
      high,
      low,
      close,
      color: isBullish ? 'verde' : 'vermelho',
      position,
      width: candleWidth * 0.8,
      height: Math.max(height, 1) // Ensure minimum height
    });
  }
  
  return candles;
};
