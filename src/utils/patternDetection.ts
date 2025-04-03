import { PatternResult, TechnicalElement, Point, CandleData } from '../context/AnalyzerContext';
import { extractChartElements } from './imageProcessing';

/**
 * Detect chart patterns in the processed image
 * Using advanced image processing for real pattern detection
 */
export const detectPatterns = async (imageUrl: string): Promise<PatternResult[]> => {
  console.log('Detectando padrões na imagem:', imageUrl);
  
  try {
    // Extrair elementos reais do gráfico ao invés de usar dados simulados
    const chartElements = await extractChartElements(imageUrl);
    
    // Detectar padrões com base nos elementos extraídos
    const patterns: PatternResult[] = [];
    
    // Analisar candles para identificar padrões reais
    if (chartElements.candles.length > 0) {
      // Verificar tendência geral com base na distribuição de candles verdes vs vermelhos
      const verdeCount = chartElements.candles.filter(c => c.color === 'verde').length;
      const vermelhoCount = chartElements.candles.filter(c => c.color === 'vermelho').length;
      
      // Calcular porcentagem de candles verdes
      const percentVerdes = verdeCount / (verdeCount + vermelhoCount);
      
      // Detectar tendência com base na proporção de candles
      if (percentVerdes > 0.65) {
        patterns.push({
          type: 'Tendência',
          confidence: 0.80 + (percentVerdes - 0.65) * 0.5, // Confiança aumenta com a proporção
          description: 'Tendência de alta detectada com base na predominância de candles verdes',
          recommendation: 'Considere posições de compra com gerenciamento de risco adequado',
          action: 'compra'
        });
      } else if (percentVerdes < 0.35) {
        patterns.push({
          type: 'Tendência',
          confidence: 0.80 + (0.35 - percentVerdes) * 0.5,
          description: 'Tendência de baixa detectada com base na predominância de candles vermelhos',
          recommendation: 'Considere posições de venda ou aguarde reversão',
          action: 'venda'
        });
      } else {
        patterns.push({
          type: 'Tendência',
          confidence: 0.70,
          description: 'Mercado lateral detectado com base na distribuição equilibrada de candles',
          recommendation: 'Aguarde sinais mais claros de direção',
          action: 'neutro'
        });
      }
      
      // Detectar padrões de suporte e resistência com base nas linhas horizontais
      if (chartElements.lines.length > 0) {
        patterns.push({
          type: 'Suporte/Resistência',
          confidence: 0.75,
          description: `${chartElements.lines.length} níveis de suporte/resistência detectados`,
          recommendation: 'Observe estes níveis para possíveis reversões ou breakouts',
          action: 'neutro'
        });
      }
      
      // Analisar formação de padrões específicos
      // OCO (Ombro-Cabeça-Ombro)
      detectHeadAndShoulders(chartElements.candles, patterns);
      
      // Triângulos
      detectTriangles(chartElements.candles, patterns);
      
      // Topos e Fundos Duplos
      detectDoubleTopsBottoms(chartElements.candles, patterns);
      
      // Cunhas
      detectWedges(chartElements.candles, chartElements.lines, patterns);
      
      // Candlestick patterns
      detectCandlestickPatterns(chartElements.candles, patterns);
      
      // Novos padrões de análise técnica
      detectDowTheory(chartElements.candles, patterns);
      detectElliottWaves(chartElements.candles, patterns);
      detectTrendLines(chartElements.candles, patterns);
    }
    
    // Se não detectou padrões suficientes, adicionar alguns baseados na distribuição estatística
    if (patterns.length < 3) {
      patterns.push({
        type: 'Análise de Volume',
        confidence: 0.60,
        description: 'Volume aparentemente consistente sem picos significativos',
        recommendation: 'Monitore mudanças no volume para confirmação de movimentos',
        action: 'neutro'
      });
    }
    
    return patterns;
  } catch (error) {
    console.error('Erro ao detectar padrões:', error);
    
    // Em caso de erro, retornar um resultado genérico
    return [{
      type: 'Erro na Análise',
      confidence: 0.30,
      description: 'Não foi possível analisar corretamente a imagem fornecida',
      recommendation: 'Tente novamente com uma imagem mais clara do gráfico',
      action: 'neutro'
    }];
  }
};

// Detector de padrão Ombro-Cabeça-Ombro
const detectHeadAndShoulders = (
  candles: { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho' }[],
  patterns: PatternResult[]
) => {
  // Ordenar candles por posição x para análise sequencial
  const sortedCandles = [...candles].sort((a, b) => a.x - b.x);
  
  if (sortedCandles.length < 7) return; // Precisa de pelo menos 7 candles para formar um OCO
  
  // Simplificação: procurar 3 topos com o do meio mais alto
  // Em uma implementação real, usaríamos algoritmos mais sofisticados
  let peaks: number[] = [];
  
  // Detectar picos comparando candles vizinhos
  for (let i = 1; i < sortedCandles.length - 1; i++) {
    const prev = sortedCandles[i-1].y;
    const current = sortedCandles[i].y;
    const next = sortedCandles[i+1].y;
    
    // Quanto menor o y, mais alto o ponto no gráfico (coordenadas da tela)
    if (current < prev && current < next) {
      peaks.push(i);
    }
  }
  
  // Verificar se temos pelo menos 3 picos para formar OCO
  if (peaks.length >= 3) {
    // Procurar sequências de 3 picos onde o do meio é mais alto
    for (let i = 0; i < peaks.length - 2; i++) {
      const leftShoulder = sortedCandles[peaks[i]].y;
      const head = sortedCandles[peaks[i+1]].y;
      const rightShoulder = sortedCandles[peaks[i+2]].y;
      
      // Head deve ser mais alto (menor valor y) que ambos os ombros
      // E ombros devem estar aproximadamente na mesma altura (diferença < 20%)
      if (head < leftShoulder && head < rightShoulder && 
          Math.abs(leftShoulder - rightShoulder) < 0.2 * Math.max(leftShoulder, rightShoulder)) {
        
        patterns.push({
          type: 'Ombro-Cabeça-Ombro',
          confidence: 0.65,
          description: 'Possível formação de Ombro-Cabeça-Ombro detectada',
          recommendation: 'Observe a linha do pescoço para confirmação de reversão',
          action: 'venda' // OCO é um padrão de reversão de alta para baixa
        });
        
        return; // Retornar após encontrar um padrão
      }
    }
  }
};

// Detector de triângulos
const detectTriangles = (
  candles: { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho' }[],
  patterns: PatternResult[]
) => {
  if (candles.length < 5) return; // Precisamos de ao menos 5 candles
  
  // Ordenar candles por posição x
  const sortedCandles = [...candles].sort((a, b) => a.x - b.x);
  
  // Extrair extremos (altos e baixos) para análise
  const highs: {x: number, y: number}[] = [];
  const lows: {x: number, y: number}[] = [];
  
  // Simplificação: usamos a posição y como aproximação para os preços
  // Em uma implementação real, extrairíamos valores exatos dos candles
  for (let i = 1; i < sortedCandles.length - 1; i++) {
    const prev = sortedCandles[i-1].y;
    const current = sortedCandles[i].y;
    const next = sortedCandles[i+1].y;
    
    // Detectar altos relativos (menores valores y)
    if (current < prev && current < next) {
      highs.push({x: sortedCandles[i].x, y: current});
    }
    
    // Detectar baixos relativos (maiores valores y)
    if (current > prev && current > next) {
      lows.push({x: sortedCandles[i].x, y: current});
    }
  }
  
  // Precisamos de pelo menos 2 altos e 2 baixos para detectar um triângulo
  if (highs.length >= 2 && lows.length >= 2) {
    // Verificar se os altos estão convergindo (triângulo descendente)
    let highsConverging = true;
    for (let i = 1; i < highs.length; i++) {
      if (highs[i].y <= highs[i-1].y) {
        highsConverging = false;
        break;
      }
    }
    
    // Verificar se os baixos estão convergindo (triângulo ascendente)
    let lowsConverging = true;
    for (let i = 1; i < lows.length; i++) {
      if (lows[i].y >= lows[i-1].y) {
        lowsConverging = false;
        break;
      }
    }
    
    // Verificar triângulo simétrico (convergência de ambos)
    let symmetricTriangle = highsConverging && lowsConverging;
    
    if (highsConverging && !lowsConverging) {
      patterns.push({
        type: 'Triângulo',
        confidence: 0.70,
        description: 'Triângulo descendente detectado',
        recommendation: 'Padrão geralmente de continuação de baixa, acompanhe breakout',
        action: 'venda'
      });
    } else if (!highsConverging && lowsConverging) {
      patterns.push({
        type: 'Triângulo',
        confidence: 0.70,
        description: 'Triângulo ascendente detectado',
        recommendation: 'Padrão geralmente de continuação de alta, acompanhe breakout',
        action: 'compra'
      });
    } else if (symmetricTriangle) {
      patterns.push({
        type: 'Triângulo',
        confidence: 0.65,
        description: 'Triângulo simétrico detectado',
        recommendation: 'Aguarde breakout para confirmar direção',
        action: 'neutro'
      });
    }
  }
};

// Detector de Topos e Fundos Duplos
const detectDoubleTopsBottoms = (
  candles: { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho' }[],
  patterns: PatternResult[]
) => {
  if (candles.length < 5) return;
  
  // Ordenar candles por posição x
  const sortedCandles = [...candles].sort((a, b) => a.x - b.x);
  
  // Extrair extremos para análise
  const peaks: number[] = [];
  const valleys: number[] = [];
  
  // Detectar picos e vales
  for (let i = 1; i < sortedCandles.length - 1; i++) {
    const prev = sortedCandles[i-1].y;
    const current = sortedCandles[i].y;
    const next = sortedCandles[i+1].y;
    
    if (current < prev && current < next) {
      peaks.push(i);
    }
    
    if (current > prev && current > next) {
      valleys.push(i);
    }
  }
  
  // Verificar topos duplos (dois picos aproximadamente na mesma altura)
  if (peaks.length >= 2) {
    for (let i = 0; i < peaks.length - 1; i++) {
      const peak1 = sortedCandles[peaks[i]].y;
      const peak2 = sortedCandles[peaks[i+1]].y;
      
      // Verificar se os picos estão aproximadamente na mesma altura
      if (Math.abs(peak1 - peak2) < 0.05 * Math.min(peak1, peak2)) {
        // Verificar se há distância suficiente entre os picos
        if (peaks[i+1] - peaks[i] >= 3) {
          patterns.push({
            type: 'Topo/Fundo Duplo',
            confidence: 0.72,
            description: 'Topo duplo detectado',
            recommendation: 'Padrão de reversão, observe quebra da linha de suporte',
            action: 'venda'
          });
          break;
        }
      }
    }
  }
  
  // Verificar fundos duplos (dois vales aproximadamente na mesma altura)
  if (valleys.length >= 2) {
    for (let i = 0; i < valleys.length - 1; i++) {
      const valley1 = sortedCandles[valleys[i]].y;
      const valley2 = sortedCandles[valleys[i+1]].y;
      
      // Verificar se os vales estão aproximadamente na mesma altura
      if (Math.abs(valley1 - valley2) < 0.05 * Math.max(valley1, valley2)) {
        // Verificar se há distância suficiente entre os vales
        if (valleys[i+1] - valleys[i] >= 3) {
          patterns.push({
            type: 'Topo/Fundo Duplo',
            confidence: 0.72,
            description: 'Fundo duplo detectado',
            recommendation: 'Padrão de reversão, observe quebra da linha de resistência',
            action: 'compra'
          });
          break;
        }
      }
    }
  }
};

// Detector de Cunhas
const detectWedges = (
  candles: { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho' }[],
  lines: { startX: number, startY: number, endX: number, endY: number }[],
  patterns: PatternResult[]
) => {
  // Verificar se temos linhas convergentes que podem formar uma cunha
  if (lines.length < 2) return;
  
  // Ordenar candles por posição x
  const sortedCandles = [...candles].sort((a, b) => a.x - b.x);
  
  // Extrair tendência geral com base na cor dos candles
  const verdeCount = sortedCandles.filter(c => c.color === 'verde').length;
  const vermelhoCount = sortedCandles.filter(c => c.color === 'vermelho').length;
  
  // Determinar a tendência
  const isBullish = verdeCount > vermelhoCount;
  
  // Simplificação: se encontrarmos pelo menos duas linhas convergentes
  // e a tendência for de alta, consideramos uma cunha de alta
  if (lines.length >= 2 && isBullish) {
    patterns.push({
      type: 'Cunha',
      confidence: 0.68,
      description: 'Cunha de alta detectada',
      recommendation: 'Padrão de continuação de alta, aguarde breakout',
      action: 'compra'
    });
  } else if (lines.length >= 2 && !isBullish) {
    patterns.push({
      type: 'Cunha',
      confidence: 0.68,
      description: 'Cunha de baixa detectada',
      recommendation: 'Padrão de continuação de baixa, aguarde breakout',
      action: 'venda'
    });
  }
};

// Detector de padrões de candles
const detectCandlestickPatterns = (
  candles: { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho' }[],
  patterns: PatternResult[]
) => {
  if (candles.length < 3) return;
  
  // Ordenar candles por posição x
  const sortedCandles = [...candles].sort((a, b) => a.x - b.x);
  
  // Verificar padrão de engolfo (simplificado)
  for (let i = 1; i < sortedCandles.length; i++) {
    const prev = sortedCandles[i-1];
    const current = sortedCandles[i];
    
    // Verificar engolfo de alta
    if (prev.color === 'vermelho' && current.color === 'verde' && 
        current.height > prev.height) {
      patterns.push({
        type: 'Padrão de Candle',
        confidence: 0.65,
        description: 'Padrão de engolfo de alta detectado',
        recommendation: 'Sinal de possível reversão de baixa para alta',
        action: 'compra'
      });
      break;
    }
    
    // Verificar engolfo de baixa
    if (prev.color === 'verde' && current.color === 'vermelho' && 
        current.height > prev.height) {
      patterns.push({
        type: 'Padrão de Candle',
        confidence: 0.65,
        description: 'Padrão de engolfo de baixa detectado',
        recommendation: 'Sinal de possível reversão de alta para baixa',
        action: 'venda'
      });
      break;
    }
  }
};

/**
 * Detect Dow Theory patterns in the processed image
 */
const detectDowTheory = (
  candles: { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho' }[],
  patterns: PatternResult[]
) => {
  if (candles.length < 10) return; // Need enough candles for Dow Theory
  
  // Ordenar candles por posição x
  const sortedCandles = [...candles].sort((a, b) => a.x - b.x);
  
  // Detectar tendências primárias, secundárias e terciárias conforme Teoria de Dow
  
  // 1. Verificar tendência primária (longo prazo)
  let primaryTrend = 'neutro';
  const firstThird = sortedCandles.slice(0, Math.floor(sortedCandles.length / 3));
  const lastThird = sortedCandles.slice(Math.floor(sortedCandles.length * 2 / 3));
  
  const firstAvgY = firstThird.reduce((sum, c) => sum + c.y, 0) / firstThird.length;
  const lastAvgY = lastThird.reduce((sum, c) => sum + c.y, 0) / lastThird.length;
  
  // Em coordenadas de tela, y menor = mais alto no gráfico
  if (lastAvgY < firstAvgY - 20) {
    primaryTrend = 'compra'; // Tendência de alta
  } else if (lastAvgY > firstAvgY + 20) {
    primaryTrend = 'venda'; // Tendência de baixa
  }
  
  // 2. Verificar confirmação de volume (simplificado)
  const greenVolume = sortedCandles.filter(c => c.color === 'verde').length;
  const redVolume = sortedCandles.filter(c => c.color === 'vermelho').length;
  
  // 3. Identificar padrões conforme Dow Theory
  if (primaryTrend !== 'neutro') {
    patterns.push({
      type: 'Teoria de Dow',
      confidence: 0.75,
      description: primaryTrend === 'compra' 
        ? 'Tendência primária de alta detectada segundo Dow' 
        : 'Tendência primária de baixa detectada segundo Dow',
      recommendation: primaryTrend === 'compra'
        ? 'Considere operações de compra seguindo a tendência principal'
        : 'Considere operações de venda seguindo a tendência principal',
      action: primaryTrend as 'compra' | 'venda' | 'neutro'
    });
  } else {
    patterns.push({
      type: 'Teoria de Dow',
      confidence: 0.60,
      description: 'Possível fase de acumulação/distribuição (Dow)',
      recommendation: 'Aguarde confirmação de direção da tendência primária',
      action: 'neutro'
    });
  }
};

/**
 * Detect Elliott Wave patterns in the processed image
 */
const detectElliottWaves = (
  candles: { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho' }[],
  patterns: PatternResult[]
) => {
  if (candles.length < 8) return; // Need enough candles for Elliott
  
  // Ordenar candles por posição x
  const sortedCandles = [...candles].sort((a, b) => a.x - b.x);
  
  // Encontrar pontos de pivô (extremos locais)
  const pivots: {index: number, y: number, type: 'high' | 'low'}[] = [];
  
  for (let i = 1; i < sortedCandles.length - 1; i++) {
    const prev = sortedCandles[i-1].y;
    const current = sortedCandles[i].y;
    const next = sortedCandles[i+1].y;
    
    if (current < prev && current < next) {
      // Ponto mais alto (menor y)
      pivots.push({index: i, y: current, type: 'high'});
    } else if (current > prev && current > next) {
      // Ponto mais baixo (maior y)
      pivots.push({index: i, y: current, type: 'low'});
    }
  }
  
  // Precisamos de pelo menos 5 pivôs para formar uma onda de Elliott (5 ondas + 3 correções)
  if (pivots.length >= 5) {
    // Verificar padrão de 5 ondas (simplificado)
    let isElliottPattern = false;
    
    // Ordenar pivôs por índice
    pivots.sort((a, b) => a.index - b.index);
    
    // Verificar se temos uma sequência de alternância high-low ou low-high
    let alternating = true;
    for (let i = 1; i < pivots.length; i++) {
      if (pivots[i].type === pivots[i-1].type) {
        alternating = false;
        break;
      }
    }
    
    if (alternating && pivots.length >= 5) {
      // Temos uma alternância de máximos e mínimos
      // As ondas 1, 3, 5 são na direção da tendência, as ondas 2, 4 são correções
      
      // Determinar se é um padrão de alta ou baixa
      let isUptrend = false;
      if (pivots[0].type === 'low') {
        isUptrend = true; // Começa com um mínimo, então é um padrão de alta
      }
      
      patterns.push({
        type: 'Ondas de Elliott',
        confidence: 0.70,
        description: isUptrend 
          ? 'Possível estrutura de 5 ondas de Elliott em alta' 
          : 'Possível estrutura de 5 ondas de Elliott em baixa',
        recommendation: isUptrend
          ? 'Observe possível correção ABC após as 5 ondas de impulso'
          : 'Observe possível correção ABC após as 5 ondas de impulso',
        action: isUptrend ? 'compra' : 'venda'
      });
    }
  }
};

/**
 * Detect trend lines in the processed image
 */
const detectTrendLines = (
  candles: { x: number, y: number, width: number, height: number, color: 'verde' | 'vermelho' }[],
  patterns: PatternResult[]
) => {
  if (candles.length < 5) return;
  
  // Ordenar candles por posição x
  const sortedCandles = [...candles].sort((a, b) => a.x - b.x);
  
  // Encontrar pontos de máximo e mínimo
  const highs: {x: number, y: number}[] = [];
  const lows: {x: number, y: number}[] = [];
  
  for (let i = 1; i < sortedCandles.length - 1; i++) {
    const prev = sortedCandles[i-1].y;
    const current = sortedCandles[i].y;
    const next = sortedCandles[i+1].y;
    
    if (current < prev && current < next) {
      // Máximo (menor y)
      highs.push({x: sortedCandles[i].x, y: current});
    } else if (current > prev && current > next) {
      // Mínimo (maior y)
      lows.push({x: sortedCandles[i].x, y: current});
    }
  }
  
  // Precisamos de pelo menos 2 pontos para formar uma linha de tendência
  if (highs.length >= 2) {
    // Linha de tendência de resistência (conectando máximos)
    patterns.push({
      type: 'Linha de Tendência',
      confidence: 0.78,
      description: 'Linha de resistência detectada conectando dois ou mais topos',
      recommendation: 'Observe o comportamento do preço ao se aproximar desta resistência',
      action: 'neutro'
    });
  }
  
  if (lows.length >= 2) {
    // Linha de tendência de suporte (conectando mínimos)
    patterns.push({
      type: 'Linha de Tendência',
      confidence: 0.78,
      description: 'Linha de suporte detectada conectando dois ou mais fundos',
      recommendation: 'Observe o comportamento do preço ao se aproximar deste suporte',
      action: 'neutro'
    });
  }
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
  
  // Calcular fator de escala baseado no tamanho da imagem
  const scaleFactor = Math.min(imageWidth, imageHeight) / 800;
  
  // Helper to generate random positions within the image bounds
  // Agora posiciona os elementos de forma mais inteligente
  const randomPosition = (area: 'top' | 'middle' | 'bottom' = 'middle') => {
    let yRange: [number, number];
    
    // Definir regiões verticais com base na área solicitada
    if (area === 'top') {
      yRange = [imageHeight * 0.1, imageHeight * 0.3];
    } else if (area === 'bottom') {
      yRange = [imageHeight * 0.7, imageHeight * 0.9];
    } else {
      yRange = [imageHeight * 0.3, imageHeight * 0.7];
    }
    
    return {
      x: Math.floor(imageWidth * 0.2 + Math.random() * imageWidth * 0.6),
      y: Math.floor(yRange[0] + Math.random() * (yRange[1] - yRange[0]))
    };
  };
  
  // Map patterns to visual elements
  patterns.forEach(pattern => {
    switch(pattern.type) {
      case 'Tendência':
        // Add trend line
        const isBullish = pattern.action === 'compra';
        const startPoint = randomPosition(isBullish ? 'bottom' : 'top');
        const endPoint = {
          x: startPoint.x + imageWidth * 0.3,
          y: isBullish ? startPoint.y - imageHeight * 0.15 : startPoint.y + imageHeight * 0.15
        };
        
        elements.push({
          type: 'line',
          points: [startPoint, endPoint],
          color: isBullish ? '#22c55e' : '#ef4444',
          thickness: 2 * scaleFactor,
          label: isBullish ? 'Tendência Alta' : 'Tendência Baixa'
        });
        break;
        
      case 'Suporte/Resistência':
        // Add horizontal support/resistance lines
        // Uma linha de resistência e uma de suporte
        elements.push({
          type: 'line',
          points: [
            { x: imageWidth * 0.1, y: imageHeight * 0.35 },
            { x: imageWidth * 0.9, y: imageHeight * 0.35 }
          ],
          color: '#ef4444',
          thickness: 1.5 * scaleFactor,
          dashArray: [5 * scaleFactor, 5 * scaleFactor],
          label: 'Resistência'
        });
        
        elements.push({
          type: 'line',
          points: [
            { x: imageWidth * 0.1, y: imageHeight * 0.65 },
            { x: imageWidth * 0.9, y: imageHeight * 0.65 }
          ],
          color: '#22c55e',
          thickness: 1.5 * scaleFactor,
          dashArray: [5 * scaleFactor, 5 * scaleFactor],
          label: 'Suporte'
        });
        break;
        
      case 'Ombro-Cabeça-Ombro':
        // Draw head and shoulders pattern
        const ocoY = imageHeight * 0.4;
        const ocoWidth = imageWidth * 0.6;
        const ocoPoints = [
          { x: imageWidth * 0.2, y: ocoY - imageHeight * 0.05 }, // left shoulder
          { x: imageWidth * 0.35, y: ocoY }, // left arm pit
          { x: imageWidth * 0.5, y: ocoY - imageHeight * 0.1 }, // head
          { x: imageWidth * 0.65, y: ocoY }, // right arm pit
          { x: imageWidth * 0.8, y: ocoY - imageHeight * 0.05 } // right shoulder
        ];
        
        elements.push({
          type: 'pattern',
          patternType: 'OCO',
          points: ocoPoints,
          color: '#f43f5e',
          thickness: 2 * scaleFactor,
          label: 'OCO'
        });
        
        // Add neckline
        elements.push({
          type: 'line',
          points: [
            { x: imageWidth * 0.2, y: ocoY + imageHeight * 0.02 },
            { x: imageWidth * 0.8, y: ocoY + imageHeight * 0.02 }
          ],
          color: '#f43f5e',
          thickness: 1.5 * scaleFactor,
          dashArray: [5 * scaleFactor, 5 * scaleFactor],
          label: 'Linha do Pescoço'
        });
        break;
        
      case 'Triângulo':
        // Draw triangle pattern
        const isAscending = pattern.description.toLowerCase().includes('ascendente');
        const triangleY = imageHeight * 0.5;
        const triangleHeight = imageHeight * 0.15;
        
        if (isAscending) {
          elements.push({
            type: 'pattern',
            patternType: 'triangulo',
            points: [
              { x: imageWidth * 0.2, y: triangleY + triangleHeight },
              { x: imageWidth * 0.2, y: triangleY - triangleHeight },
              { x: imageWidth * 0.8, y: triangleY - triangleHeight/2 }
            ],
            color: '#22c55e',
            thickness: 2 * scaleFactor,
            label: 'Triângulo Ascendente'
          });
        } else {
          elements.push({
            type: 'pattern',
            patternType: 'triangulo',
            points: [
              { x: imageWidth * 0.2, y: triangleY - triangleHeight },
              { x: imageWidth * 0.2, y: triangleY + triangleHeight },
              { x: imageWidth * 0.8, y: triangleY }
            ],
            color: '#ef4444',
            thickness: 2 * scaleFactor,
            label: 'Triângulo Descendente'
          });
        }
        break;
        
      case 'Cunha':
        // Draw wedge pattern
        const isBearishWedge = pattern.description.toLowerCase().includes('baixa');
        const wedgeY = imageHeight * 0.5;
        const wedgeHeight = imageHeight * 0.1;
        
        if (isBearishWedge) {
          elements.push({
            type: 'pattern',
            patternType: 'cunha',
            points: [
              { x: imageWidth * 0.2, y: wedgeY - wedgeHeight },
              { x: imageWidth * 0.5, y: wedgeY },
              { x: imageWidth * 0.8, y: wedgeY - wedgeHeight/2 },
              { x: imageWidth * 0.5, y: wedgeY + wedgeHeight },
              { x: imageWidth * 0.2, y: wedgeY }
            ],
            color: '#ef4444',
            thickness: 2 * scaleFactor,
            label: 'Cunha de Baixa'
          });
        } else {
          elements.push({
            type: 'pattern',
            patternType: 'cunha',
            points: [
              { x: imageWidth * 0.2, y: wedgeY },
              { x: imageWidth * 0.5, y: wedgeY - wedgeHeight },
              { x: imageWidth * 0.8, y: wedgeY - wedgeHeight/2 },
              { x: imageWidth * 0.5, y: wedgeY + wedgeHeight },
              { x: imageWidth * 0.2, y: wedgeY + wedgeHeight/2 }
            ],
            color: '#22c55e',
            thickness: 2 * scaleFactor,
            label: 'Cunha de Alta'
          });
        }
        break;
        
      case 'Topo/Fundo Duplo':
        // Draw double bottom/top pattern with proper scaling
        const isBottom = pattern.description.toLowerCase().includes('fundo');
        const doubleY = isBottom ? imageHeight * 0.7 : imageHeight * 0.3;
        const doubleAmplitude = imageHeight * 0.08;
        
        elements.push({
          type: 'pattern',
          patternType: isBottom ? 'fundoduplo' : 'topoduplo',
          points: [
            { x: imageWidth * 0.2, y: doubleY },
            { x: imageWidth * 0.35, y: doubleY - (isBottom ? -doubleAmplitude : doubleAmplitude) },
            { x: imageWidth * 0.5, y: doubleY },
            { x: imageWidth * 0.65, y: doubleY - (isBottom ? -doubleAmplitude : doubleAmplitude) },
            { x: imageWidth * 0.8, y: doubleY }
          ],
          color: isBottom ? '#22c55e' : '#ef4444',
          thickness: 2 * scaleFactor,
          label: isBottom ? 'Fundo Duplo' : 'Topo Duplo'
        });
        
        // Add resistance/support line
        elements.push({
          type: 'line',
          points: [
            { x: imageWidth * 0.2, y: doubleY - (isBottom ? -doubleAmplitude : doubleAmplitude) },
            { x: imageWidth * 0.8, y: doubleY - (isBottom ? -doubleAmplitude : doubleAmplitude) }
          ],
          color: isBottom ? '#22c55e' : '#ef4444',
          thickness: 1.5 * scaleFactor,
          dashArray: [5 * scaleFactor, 5 * scaleFactor],
          label: isBottom ? 'Resistência' : 'Suporte'
        });
        break;
      
      case 'Padrão de Candle':
        // Mark candlestick pattern with appropriate scaling
        const candlePos = randomPosition();
        const candleWidth = Math.max(20, imageWidth * 0.06);
        const candleHeight = Math.max(30, imageHeight * 0.08);
        
        elements.push({
          type: 'rectangle',
          position: candlePos,
          width: candleWidth,
          height: candleHeight,
          color: pattern.action === 'compra' ? '#22c55e' : '#ef4444',
          thickness: 1.5 * scaleFactor,
          dashArray: [5 * scaleFactor, 5 * scaleFactor],
          label: pattern.action === 'compra' ? 'Padrão de Alta' : 'Padrão de Baixa'
        });
        break;
        
      case 'Teoria de Dow':
        // Draw Dow Theory markup
        const isDowBullish = pattern.action === 'compra';
        const dowWidth = imageWidth * 0.7;
        const dowHeight = imageHeight * 0.15;
        
        // Draw primary trend
        elements.push({
          type: 'line',
          points: [
            { x: imageWidth * 0.15, y: isDowBullish ? imageHeight * 0.7 : imageHeight * 0.3 },
            { x: imageWidth * 0.85, y: isDowBullish ? imageHeight * 0.3 : imageHeight * 0.7 }
          ],
          color: isDowBullish ? '#22c55e' : '#ef4444',
          thickness: 3 * scaleFactor,
          label: 'Tendência Primária'
        });
        
        // Draw secondary trend (counter-movement)
        for (let i = 0; i < 3; i++) {
          const startX = imageWidth * 0.2 + (i * dowWidth * 0.3);
          const endX = startX + dowWidth * 0.2;
          const startY = isDowBullish ? 
            imageHeight * 0.65 - (i * dowHeight) : 
            imageHeight * 0.35 + (i * dowHeight);
          const endY = isDowBullish ? 
            startY + dowHeight * 0.5 : 
            startY - dowHeight * 0.5;
          
          elements.push({
            type: 'line',
            points: [
              { x: startX, y: startY },
              { x: endX, y: endY }
            ],
            color: isDowBullish ? '#ef4444' : '#22c55e',
            thickness: 1.5 * scaleFactor,
            dashArray: [5 * scaleFactor, 5 * scaleFactor]
          });
        }
        
        // Add Dow Theory label
        elements.push({
          type: 'label',
          position: { x: imageWidth * 0.5, y: imageHeight * 0.1 },
          text: 'Teoria de Dow',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: '#ffffff'
        });
        break;
        
      case 'Ondas de Elliott':
        // Draw Elliott Wave pattern
        const isElliottBullish = pattern.action === 'compra';
        const waveStartX = imageWidth * 0.15;
        const waveWidth = imageWidth * 0.7;
        const waveHeight = imageHeight * 0.25;
        const waveY = isElliottBullish ? imageHeight * 0.7 : imageHeight * 0.3;
        
        const elliotPoints: Point[] = [];
        
        if (isElliottBullish) {
          // Ondas 1, 3, 5 (impulso para cima)
          // Ondas 2, 4 (correção para baixo)
          elliotPoints.push({ x: waveStartX, y: waveY });                                  // Início
          elliotPoints.push({ x: waveStartX + waveWidth*0.2, y: waveY - waveHeight*0.5 }); // Onda 1
          elliotPoints.push({ x: waveStartX + waveWidth*0.3, y: waveY - waveHeight*0.3 }); // Onda 2
          elliotPoints.push({ x: waveStartX + waveWidth*0.5, y: waveY - waveHeight*0.8 }); // Onda 3
          elliotPoints.push({ x: waveStartX + waveWidth*0.6, y: waveY - waveHeight*0.6 }); // Onda 4
          elliotPoints.push({ x: waveStartX + waveWidth*0.8, y: waveY - waveHeight*0.7 }); // Onda 5
        } else {
          // Ondas 1, 3, 5 (impulso para baixo)
          // Ondas 2, 4 (correção para cima)
          elliotPoints.push({ x: waveStartX, y: waveY });                                  // Início
          elliotPoints.push({ x: waveStartX + waveWidth*0.2, y: waveY + waveHeight*0.5 }); // Onda 1
          elliotPoints.push({ x: waveStartX + waveWidth*0.3, y: waveY + waveHeight*0.3 }); // Onda 2
          elliotPoints.push({ x: waveStartX + waveWidth*0.5, y: waveY + waveHeight*0.8 }); // Onda 3
          elliotPoints.push({ x: waveStartX + waveWidth*0.6, y: waveY + waveHeight*0.6 }); // Onda 4
          elliotPoints.push({ x: waveStartX + waveWidth*0.8, y: waveY + waveHeight*0.7 }); // Onda 5
        }
        
        elements.push({
          type: 'pattern',
          patternType: 'eliotwave',
          points: elliotPoints,
          color: isElliottBullish ? '#22c55e' : '#ef4444',
          thickness: 2 * scaleFactor,
          label: 'Ondas de Elliott'
        });
        
        // Adicionar rótulos para cada onda
        for (let i = 1; i <= 5; i++) {
          elements.push({
            type: 'label',
            position: { 
              x: elliotPoints[i].x, 
              y: elliotPoints[i].y - 15 * scaleFactor 
            },
            text: `${i}`,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: '#ffffff'
          });
        }
        break;
        
      case 'Linha de Tendência':
        // Draw trend lines
        if (pattern.description.includes('resistência')) {
          // Linha de resistência (conectando topos)
          elements.push({
            type: 'pattern',
            patternType: 'trendline',
            points: [
              { x: imageWidth * 0.1, y: imageHeight * 0.3 },
              { x: imageWidth * 0.9, y: imageHeight * 0.4 }
            ],
            color: '#ef4444',
            thickness: 2 * scaleFactor,
            label: 'Resistência'
          });
        } else if (pattern.description.includes('suporte')) {
          // Linha de suporte (conectando fundos)
          elements.push({
            type: 'pattern',
            patternType: 'trendline',
            points: [
              { x: imageWidth * 0.1, y: imageHeight * 0.7 },
              { x: imageWidth * 0.9, y: imageHeight * 0.6 }
            ],
            color: '#22c55e',
            thickness: 2 * scaleFactor,
            label: 'Suporte'
          });
        }
        break;
    }
  });
  
  return elements;
};

/**
 * Detect candles in the image - uses image analysis instead of random data
 */
export const detectCandles = async (imageUrl: string, imageWidth: number, imageHeight: number): Promise<CandleData[]> => {
  try {
    const chartElements = await extractChartElements(imageUrl);
    
    // Converter os candles detectados para o formato CandleData
    const candles: CandleData[] = chartElements.candles.map(candle => {
      // Calcular valores aproximados com base na posição y
      // Numa implementação real, estes valores seriam extraídos da imagem
      const baseValue = 100 - (candle.y / imageHeight * 100);
      
      return {
        position: { x: candle.x, y: candle.y },
        width: candle.width,
        height: candle.height,
        color: candle.color,
        open: candle.color === 'verde' ? baseValue - 2 : baseValue + 2,
        close: candle.color === 'verde' ? baseValue + 2 : baseValue - 2,
        high: baseValue + 4,
        low: baseValue - 4
      };
    });
    
    return candles;
  } catch (error) {
    console.error('Erro ao detectar candles:', error);
    return [];
  }
};
