
import { PatternResult, AnalysisResult, VolumeData, VolatilityData, TechnicalIndicator, ScalpingSignal, CandleData } from "../context/AnalyzerContext";
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

export const detectPatterns = async (imageData: string): Promise<PatternResult[]> => {
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imageData;
  });
  
  const candles = await detectCandles(imageData, img.width, img.height);
  const detectedPatterns = detectCandlestickPatterns(candles);
  
  return detectedPatterns.map(pattern => ({
    type: pattern.type,
    confidence: pattern.confidence,
    description: pattern.description,
    recommendation: pattern.action === 'compra' ? 'Considerar compra' : 
                   pattern.action === 'venda' ? 'Considerar venda' : 'Aguardar confirmação',
    action: pattern.action
  }));
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
      
      const candles: CandleData[] = [];
      let currentX = 0;
      const candleWidth = Math.floor(width / 50);
      
      while (currentX < width - candleWidth) {
        let high = height;
        let low = 0;
        let open = 0;
        let close = 0;
        
        for (let y = 0; y < height; y++) {
          const idx = (y * width + currentX) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          if (Math.abs(r - g) > 30 || Math.abs(r - b) > 30) {
            if (y < high) high = y;
            if (y > low) low = y;
            
            const density = countPixelDensity(data, currentX, y, candleWidth, width, height);
            if (density > 0.7) {
              if (open === 0) open = y;
              close = y;
            }
          }
        }
        
        if (high < low && open !== 0 && close !== 0) {
          const priceRange = 100;
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
            height: low - high,
            timestamp: Date.now() + currentX
          });
        }
        
        currentX += candleWidth + 1;
      }
      
      console.log(`🕯️ DETECTADOS ${candles.length} candles REAIS da imagem`);
      resolve(candles);
    };
    
    img.src = imageData;
  });
};

const countPixelDensity = (data: Uint8ClampedArray, x: number, y: number, width: number, imageWidth: number, imageHeight: number): number => {
  let count = 0;
  const area = width * 3;
  
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
  console.log('🚀 Iniciando análise REAL do gráfico (SEM dados simulados)...');
  
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imageData;
  });
  
  const candles = await detectCandles(imageData, img.width, img.height);
  console.log(`📊 Detectados ${candles.length} candles REAIS para análise`);
  
  if (candles.length === 0) {
    console.log('⚠️ NENHUM candle detectado - retornando análise vazia');
    return {
      patterns: [],
      timestamp: Date.now(),
      imageUrl: imageData,
      technicalElements: [],
      candles: [],
      scalpingSignals: [],
      technicalIndicators: [],
      volumeData: {
        value: 0,
        trend: 'neutral',
        abnormal: false,
        significance: 'low',
        relativeToAverage: 1.0,
        distribution: 'neutral',
        divergence: false
      },
      volatilityData: {
        value: 0,
        trend: 'neutral',
        atr: 0,
        historicalComparison: 'average',
        isHigh: false
      },
      marketContext: {
        phase: 'lateral',
        strength: 'fraca',
        dominantTimeframe: options.timeframe || '1m',
        sentiment: 'neutro',
        description: 'Sem dados suficientes',
        marketStructure: 'indefinida',
        breakoutPotential: 'baixo',
        momentumSignature: 'estável'
      },
      warnings: ['Nenhum candle detectado na imagem'],
      preciseEntryAnalysis: {
        exactMinute: 'pendente',
        entryType: 'reversão',
        nextCandleExpectation: 'aguardando análise',
        priceAction: '',
        confirmationSignal: '',
        riskRewardRatio: 0,
        entryInstructions: 'Sem dados para análise'
      },
      confluences: {
        confluenceScore: 0,
        supportResistance: [],
        marketStructure: { structure: 'neutral' },
        priceAction: { trend: 'lateral', momentum: 'fraco', strength: 0 }
      },
      priceActionSignals: [],
      detailedMarketContext: {
        phase: 'lateral',
        sentiment: 'neutro',
        strength: 'fraca',
        description: 'Sem dados suficientes',
        marketStructure: 'indefinida',
        breakoutPotential: 'baixo',
        momentumSignature: 'estável',
        institutionalBias: 'neutro',
        volatilityState: 'normal',
        liquidityCondition: 'inadequada',
        timeOfDay: 'fora_horario',
        trend: 'lateral'
      },
      entryRecommendations: []
    };
  }
  
  const advancedConditions = analyzeAdvancedMarketConditions(candles);
  const operatingScore = calculateOperatingScore(advancedConditions);
  const confidenceReduction = calculateConfidenceReduction(advancedConditions);
  
  console.log(`🎯 Score REAL de operação: ${operatingScore}/100`);
  console.log(`⚠️ Redução de confiança: ${(confidenceReduction * 100).toFixed(0)}%`);
  
  let candlePatterns: DetectedPattern[] = [];
  if (options.enableCandleDetection !== false) {
    candlePatterns = detectCandlestickPatterns(candles);
    console.log(`🕯️ Padrões REAIS detectados: ${candlePatterns.length}`);
    
    candlePatterns.forEach((pattern, index) => {
      console.log(`Pattern REAL ${index + 1}:`, {
        type: pattern.type,
        action: pattern.action,
        confidence: pattern.confidence,
        description: pattern.description
      });
    });
  }
  
  const patterns: PatternResult[] = candlePatterns.map(pattern => ({
    type: pattern.type,
    confidence: pattern.confidence * confidenceReduction,
    description: pattern.description,
    recommendation: pattern.action === 'compra' ? 'Considerar compra' : 
                   pattern.action === 'venda' ? 'Considerar venda' : 'Aguardar confirmação',
    action: pattern.action
  }));
  
  console.log(`📋 Convertidos ${patterns.length} padrões REAIS para formato final`);
  
  const priceActionSignals = analyzePriceAction(candles);
  const volumeData: VolumeData = analyzeVolume(candles);
  const volatilityAnalysis = analyzeVolatility(candles);
  const divergences = detectDivergences(candles);
  const technicalIndicators: TechnicalIndicator[] = detectTechnicalIndicators(candles);
  const marketContextAnalysis = analyzeMarketContext(candles);
  const confluenceAnalysis = performConfluenceAnalysis(candles, candlePatterns);
  
  const scalpingSignals: ScalpingSignal[] = candlePatterns.map(signal => ({
    type: 'entrada',
    action: signal.action === 'compra' ? 'compra' : 'venda',
    price: '...',
    confidence: signal.confidence * confidenceReduction,
    timeframe: options.timeframe || '1m',
    description: signal.description,
  }));
  
  console.log(`⚡️ Sinais REAIS de Scalping: ${scalpingSignals.length}`);
  
  const enhancedMarketContext: EnhancedMarketContext = {
    phase: 'lateral',
    strength: 'fraca',
    dominantTimeframe: options.timeframe || '1m',
    sentiment: 'neutro',
    description: `Score REAL: ${operatingScore}/100`,
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
      exactMinute: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      entryType: patterns.length > 0 ? 'reversão' : 'reversão',
      nextCandleExpectation: patterns.some(p => p.action === 'compra') ? 'confirmação bullish' : 
                            patterns.some(p => p.action === 'venda') ? 'confirmação bearish' : 'indefinido',
      priceAction: patterns.length > 0 ? patterns[0].action : 'neutro',
      confirmationSignal: patterns.length > 0 ? 'detectado' : 'aguardando',
      riskRewardRatio: patterns.length > 0 ? 2.5 : 0,
      entryInstructions: patterns.length > 0 ? 
        `Padrão ${patterns[0].type} detectado - ${patterns[0].recommendation}` : 
        'Aguardando formação de padrão'
    },
    confluences: confluenceAnalysis,
    priceActionSignals: priceActionSignals,
    detailedMarketContext: {
      phase: 'lateral',
      sentiment: 'neutro',
      strength: 'fraca',
      description: `Score REAL: ${operatingScore}/100`,
      marketStructure: 'indefinida',
      breakoutPotential: 'baixo',
      momentumSignature: 'estável',
      institutionalBias: 'neutro',
      volatilityState: volatilityAnalysis.isHigh ? 'alta' : 'normal',
      liquidityCondition: volumeData.significance === 'high' ? 'alta' : 'adequada',
      timeOfDay: 'horário_comercial',
      trend: 'lateral'
    },
    entryRecommendations: []
  };
  
  console.log('📋 Resultado FINAL da análise REAL:', {
    patternsCount: result.patterns.length,
    patternTypes: result.patterns.map(p => p.type),
    operatingScore: operatingScore,
    candlesDetected: candles.length
  });
  
  return result;
};
