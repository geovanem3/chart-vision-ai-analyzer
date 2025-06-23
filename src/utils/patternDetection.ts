
import { PatternResult, AnalysisResult, VolumeData, VolatilityData, TechnicalIndicator, ScalpingSignal, CandleData } from "../context/AnalyzerContext";
import { mockCandles as generateMockCandles } from "./mockData";
import { analyzeVolume } from "./volumeAnalysis";
import { analyzeVolatility } from "./volatilityAnalysis";
import { analyzePriceAction, analyzeMarketContext } from "./priceActionAnalysis";
import { performConfluenceAnalysis } from "./confluenceAnalysis";
import { detectDivergences } from "./divergenceAnalysis";
import { detectChartPatterns } from "./chartPatternDetection";
import { detectCandlestickPatterns } from "./candlestickPatternDetection";
import { detectTechnicalIndicators } from "./technicalIndicatorAnalysis";
import { DetectedPattern } from "./types";
import { 
  analyzeAdvancedMarketConditions, 
  calculateOperatingScore, 
  calculateConfidenceReduction,
  EnhancedMarketContext
} from "./advancedMarketContext";

interface AnalysisOptions {
  timeframe?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
  optimizeForScalping?: boolean;
  considerVolume?: boolean;
  considerVolatility?: boolean;
  enableCandleDetection?: boolean;
  scalpingStrategy?: string;
  marketContextEnabled?: boolean;
  marketAnalysisDepth?: string;
  isLiveAnalysis?: boolean;
  useConfluences?: boolean;
  enablePriceAction?: boolean;
  enableMarketContext?: boolean;
}

// Export missing functions that ControlPanel.tsx expects
export const detectPatterns = async (imageData: string): Promise<PatternResult[]> => {
  // Simple pattern detection simulation
  const patterns: PatternResult[] = [
    {
      type: 'Martelo',
      confidence: Math.random() * 0.4 + 0.6,
      description: 'Padrão de reversão bullish detectado',
      recommendation: 'Considerar compra',
      action: 'compra'
    },
    {
      type: 'Doji',
      confidence: Math.random() * 0.4 + 0.5,
      description: 'Indecisão do mercado',
      recommendation: 'Aguardar confirmação',
      action: 'neutro'
    }
  ];
  
  return patterns;
};

export const generateTechnicalMarkup = (patterns: PatternResult[], width: number, height: number) => {
  return patterns.map((pattern, index) => ({
    id: `pattern-${index}`,
    type: 'pattern' as const,
    patternType: 'triangulo' as const,
    points: [{ x: Math.random() * width * 0.8, y: Math.random() * height * 0.8 }],
    color: '#ff0000',
    pattern: pattern.type,
    confidence: pattern.confidence
  }));
};

export const detectCandles = async (imageData: string, width: number, height: number): Promise<CandleData[]> => {
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Detectar candles através da análise de pixels
      const candles: CandleData[] = [];
      let currentX = 0;
      const candleWidth = Math.floor(width / 50); // Estimativa inicial da largura do candle
      
      while (currentX < width - candleWidth) {
        // Analisar coluna de pixels para encontrar high/low
        let high = height;
        let low = 0;
        let open = 0;
        let close = 0;
        
        for (let y = 0; y < height; y++) {
          const idx = (y * width + currentX) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          // Detectar pixels que formam o candle
          if (Math.abs(r - g) > 30 || Math.abs(r - b) > 30) { // Detectar cores diferentes do fundo
            if (y < high) high = y;
            if (y > low) low = y;
            
            // Detectar corpo do candle (mais denso em pixels)
            const density = countPixelDensity(data, currentX, y, candleWidth, width, height);
            if (density > 0.7) { // Threshold para corpo do candle
              if (open === 0) open = y;
              close = y;
            }
          }
        }
        
        if (high < low && open !== 0 && close !== 0) {
          // Converter coordenadas de pixel para valores de preço
          const priceRange = 100; // Ajustar baseado na escala do gráfico
          const pixelToPrice = priceRange / height;
          
          candles.push({
            open: (height - open) * pixelToPrice,
            close: (height - close) * pixelToPrice,
            high: (height - high) * pixelToPrice,
            low: (height - low) * pixelToPrice,
            position: {
              x: currentX,
              y: high
            },
            width: candleWidth,
            height: low - high
          });
        }
        
        currentX += candleWidth + 1; // Avançar para o próximo candle
      }
      
      resolve(candles);
    };
    
    img.src = imageData;
  });
};

// Função auxiliar para calcular a densidade de pixels em uma área
const countPixelDensity = (data: Uint8ClampedArray, x: number, y: number, width: number, imageWidth: number, imageHeight: number): number => {
  let count = 0;
  const area = width * 3; // Altura da área de amostra
  
  for (let i = 0; i < width; i++) {
    for (let j = -1; j <= 1; j++) {
      const py = y + j;
      const px = x + i;
      
      if (px >= 0 && px < imageWidth && py >= 0 && py < imageHeight) {
        const idx = (py * imageWidth + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        if (Math.abs(r - g) > 30 || Math.abs(r - b) > 30) {
          count++;
        }
      }
    }
  }
  
  return count / area;
};

export const analyzeChart = async (imageData: string, options: AnalysisOptions = {}): Promise<AnalysisResult> => {
  console.log('🚀 Iniciando análise completa do gráfico...');
  
  // Detectar dimensões da imagem
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imageData;
  });
  
  // Detectar candles da imagem
  const candles = await detectCandles(imageData, img.width, img.height);
  
  console.log(`📊 Detectados ${candles.length} candles para análise`);
  
  // NOVO: Análise avançada de condições de mercado
  const advancedConditions = analyzeAdvancedMarketConditions(candles);
  const operatingScore = calculateOperatingScore(advancedConditions);
  const confidenceReduction = calculateConfidenceReduction(advancedConditions);
  
  console.log(`🎯 Score de operação: ${operatingScore}/100`);
  console.log(`⚠️ Redução de confiança: ${(confidenceReduction * 100).toFixed(0)}%`);
  console.log(`📋 Recomendação: ${advancedConditions.recommendation}`);
  
  if (advancedConditions.warnings.length > 0) {
    console.log('🚨 Warnings:', advancedConditions.warnings);
  }
  
  // Analyze volatility
  const volatilityAnalysis = analyzeVolatility(candles);
  console.log(`📈 Volatilidade: ${volatilityAnalysis.value.toFixed(2)}% (trend: ${volatilityAnalysis.trend})`);
  
  // CORRIGIDO: Detectar padrões reais de candlestick em vez de simulados
  let candlePatterns: DetectedPattern[] = [];
  if (options.enableCandleDetection !== false) {
    candlePatterns = detectCandlestickPatterns(candles);
    console.log(`🕯️ Padrões de candlestick detectados: ${candlePatterns.length}`);
    
    // Log detalhado dos padrões para debug
    candlePatterns.forEach((pattern, index) => {
      console.log(`Pattern ${index}:`, {
        type: pattern.type,
        action: pattern.action,
        confidence: pattern.confidence,
        description: pattern.description
      });
    });
  }
  
  // CORRIGIDO: Converter padrões de candlestick detectados para formato PatternResult
  const patterns: PatternResult[] = candlePatterns.map(pattern => ({
    type: pattern.type,
    confidence: pattern.confidence * confidenceReduction,
    description: pattern.description,
    recommendation: pattern.action === 'compra' ? 'Considerar compra' : 
                   pattern.action === 'venda' ? 'Considerar venda' : 'Aguardar confirmação',
    action: pattern.action
  }));
  
  console.log(`📋 Convertidos ${patterns.length} padrões para formato final`);
  
  // Adicionar warnings específicos se as condições são ruins
  patterns.forEach(pattern => {
    if (operatingScore < 30) {
      pattern.description += ` ⚠️ CUIDADO: Condições adversas de mercado (Score: ${operatingScore}/100)`;
    }
  });
  
  // Price action analysis
  const priceActionSignals = analyzePriceAction(candles);
  console.log(`⚡️ Price Action Signals: ${priceActionSignals.length} signals detected`);
  
  // Volume analysis
  const volumeData: VolumeData = analyzeVolume(candles);
  console.log(`📊 Volume Analysis: Trend - ${volumeData.trend}, Significance - ${volumeData.significance}`);
  
  // Divergence analysis
  const divergences = detectDivergences(candles);
  console.log(`🔍 Divergências encontradas: ${divergences.length}`);
  
  // Technical indicators
  const technicalIndicators: TechnicalIndicator[] = detectTechnicalIndicators(candles);
  console.log(`⚙️ Indicadores técnicos detectados: ${technicalIndicators.length}`);
  
  // Scalping signals - usar padrões reais detectados
  const scalpingSignals: ScalpingSignal[] = candlePatterns.map(signal => ({
    type: 'entrada',
    action: signal.action === 'compra' ? 'compra' : 'venda',
    price: '...',
    confidence: signal.confidence,
    timeframe: options.timeframe || '1m',
    description: signal.description,
  }));
  console.log(`⚡️ Scalping Signals: ${scalpingSignals.length} signals detected`);
  
  // Market context
  const marketContextAnalysis = analyzeMarketContext(candles);
  console.log(`🌎 Market Context: Phase - ${marketContextAnalysis.phase}, Sentiment - ${marketContextAnalysis.sentiment}`);
  
  // Confluence analysis
  const confluenceAnalysis = performConfluenceAnalysis(candles, candlePatterns);
  console.log(`🤝 Confluence Score: ${confluenceAnalysis.confluenceScore}`);
  
  // NOVO: Criar contexto de mercado aprimorado
  const enhancedMarketContext: EnhancedMarketContext = {
    phase: 'lateral',
    strength: 'moderada',
    dominantTimeframe: options.timeframe || '1m',
    sentiment: 'neutro',
    description: `Score: ${operatingScore}/100`,
    marketStructure: 'indefinida',
    breakoutPotential: 'baixo',
    momentumSignature: 'estável',
    advancedConditions,
    operatingScore,
    confidenceReduction
  };
  
  const result: AnalysisResult = {
    patterns,
    timestamp: Date.now(),
    imageUrl: imageData,
    technicalElements: [],
    candles: candles,
    scalpingSignals: scalpingSignals,
    technicalIndicators: technicalIndicators,
    volumeData: volumeData,
    volatilityData: volatilityAnalysis,
    marketContext: enhancedMarketContext,
    warnings: advancedConditions.warnings,
    preciseEntryAnalysis: {
      exactMinute: 'agora',
      entryType: 'reversão',
      nextCandleExpectation: 'confirmação',
      priceAction: 'bullish',
      confirmationSignal: 'aguardando',
      riskRewardRatio: 2.5,
      entryInstructions: 'Aguardar confirmação no próximo candle'
    },
    confluences: confluenceAnalysis,
    priceActionSignals: priceActionSignals,
    detailedMarketContext: {
      phase: 'lateral',
      sentiment: 'neutro',
      strength: 'moderada',
      description: `Score: ${operatingScore}/100`,
      marketStructure: 'indefinida',
      breakoutPotential: 'baixo',
      momentumSignature: 'estável',
      institutionalBias: 'neutro',
      volatilityState: 'normal',
      liquidityCondition: 'adequada',
      timeOfDay: 'horário_comercial',
      trend: 'lateral'
    },
    entryRecommendations: []
  };
  
  console.log('📋 Resultado final da análise:', {
    patternsCount: result.patterns.length,
    patternTypes: result.patterns.map(p => p.type),
    operatingScore: operatingScore
  });
  
  return result;
};
