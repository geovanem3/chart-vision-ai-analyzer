import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Camera, Play, Pause, Settings, AlertTriangle, Activity, TrendingUp, CircleArrowUp, CircleArrowDown, ChartBar, ShieldAlert, Timer, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { enhanceImageForAnalysis } from '@/utils/imagePreProcessing';
import { analyzeChart } from '@/utils/patternDetection';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { TradeSuccessPrediction, predictTradeSuccess } from '@/utils/tradeSuccessPrediction';

interface LiveAnalysisResult {
  timestamp: number;
  confidence: number;
  signal: 'compra' | 'venda' | 'neutro';
  patterns: string[];
  trend: 'alta' | 'baixa' | 'lateral';
  signalQuality?: string;
  confluenceScore?: number;
  supportResistance?: any[];
  criticalLevels?: any[];
  priceActionSignals?: any[];
  marketPhase?: string;
  institutionalBias?: string;
  entryRecommendations?: any[];
  riskReward?: number;
  warnings?: string[];
  analysisHealth?: {
    consistency: number;
    reliability: number;
    marketAlignment: boolean;
  };
  // NOVO: Predição de sucesso de 1 minuto
  oneMinutePrediction?: {
    willSucceed: boolean;
    successProbability: number;
    entryTiming: '30s_current' | '60s_next';
    timeToEntry: number;
    riskFactors: string[];
    recommendation: 'enter_now' | 'wait_next_candle' | 'skip_entry';
    candleAnalysis: {
      currentProgress: number;
      expectedSize: 'small' | 'medium' | 'large' | 'explosive';
      reversalRisk: number;
      volatilityLevel: 'low' | 'medium' | 'high' | 'extreme';
    };
  };
}

const LiveAnalysis = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(3000);
  const [liveResults, setLiveResults] = useState<LiveAnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<LiveAnalysisResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [confluenceDetails, setConfluenceDetails] = useState<any>(null);
  const [showConfluenceDetails, setShowConfluenceDetails] = useState(false);
  const [priceActionDetails, setPriceActionDetails] = useState<any>(null);
  const [showPriceActionDetails, setShowPriceActionDetails] = useState(false);
  const [entryRecommendations, setEntryRecommendations] = useState<any[]>([]);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [analysisStats, setAnalysisStats] = useState({
    totalAnalyses: 0,
    validSignals: 0,
    avgConfidence: 0,
    lastValidSignalTime: null as number | null
  });

  // NOVO: Estados para predição de 1 minuto
  const [currentCandleProgress, setCurrentCandleProgress] = useState(0);
  const [timeToNextCandle, setTimeToNextCandle] = useState(60);

  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { 
    timeframe, 
    optimizeForScalping, 
    scalpingStrategy,
    considerVolume,
    considerVolatility,
    marketContextEnabled,
    marketAnalysisDepth 
  } = useAnalyzer();

  // NOVO: Simular progresso da vela atual
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const seconds = now.getSeconds();
      const progress = (seconds / 60) * 100;
      const remaining = 60 - seconds;
      
      setCurrentCandleProgress(progress);
      setTimeToNextCandle(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  // NOVO: Função para determinar timing de entrada
  const determineEntryTiming = (currentProgress: number): '30s_current' | '60s_next' => {
    const remainingSeconds = 60 - (currentProgress / 100 * 60);
    return remainingSeconds >= 30 ? '30s_current' : '60s_next';
  };

  // NOVO: Função para prever sucesso em 1 minuto
  const predictOneMinuteSuccess = async (
    patterns: any[], 
    candles: any[], 
    marketData: any
  ): Promise<LiveAnalysisResult['oneMinutePrediction']> => {
    if (patterns.length === 0 || patterns[0].action === 'neutro') {
      return {
        willSucceed: false,
        successProbability: 0,
        entryTiming: '30s_current',
        timeToEntry: 0,
        riskFactors: ['Nenhum sinal válido'],
        recommendation: 'skip_entry',
        candleAnalysis: {
          currentProgress: currentCandleProgress,
          expectedSize: 'medium',
          reversalRisk: 50,
          volatilityLevel: 'medium'
        }
      };
    }

    const entryTiming = determineEntryTiming(currentCandleProgress);
    const timeToEntry = entryTiming === '30s_current' ? 
      Math.max(0, 30 - (currentCandleProgress / 100 * 60)) : 
      timeToNextCandle + 30;

    // Analisar vela atual
    const currentCandle = candles[candles.length - 1];
    const recentCandles = candles.slice(-10);
    
    // Calcular volatilidade
    const volatility = recentCandles.reduce((sum, c, i) => {
      if (i === 0) return 0;
      return sum + Math.abs(c.close - recentCandles[i-1].close) / recentCandles[i-1].close;
    }, 0) / (recentCandles.length - 1);

    let volatilityLevel: 'low' | 'medium' | 'high' | 'extreme' = 'medium';
    if (volatility > 0.003) volatilityLevel = 'extreme';
    else if (volatility > 0.002) volatilityLevel = 'high';
    else if (volatility > 0.001) volatilityLevel = 'medium';
    else volatilityLevel = 'low';

    // Calcular tamanho esperado da vela
    const currentRange = currentCandle.high - currentCandle.low;
    const avgRange = recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / recentCandles.length;
    const sizeRatio = currentRange / avgRange;

    let expectedSize: 'small' | 'medium' | 'large' | 'explosive';
    if (sizeRatio > 2.5) expectedSize = 'explosive';
    else if (sizeRatio > 1.5) expectedSize = 'large';
    else if (sizeRatio > 0.8) expectedSize = 'medium';
    else expectedSize = 'small';

    // Calcular risco de reversão
    const bodySize = Math.abs(currentCandle.close - currentCandle.open);
    const wickSize = Math.max(
      currentCandle.high - Math.max(currentCandle.open, currentCandle.close),
      Math.min(currentCandle.open, currentCandle.close) - currentCandle.low
    );
    
    let reversalRisk = 20; // Base
    if (wickSize > bodySize * 1.5) reversalRisk += 30;
    if (expectedSize === 'explosive') reversalRisk += 40;
    if (currentCandleProgress > 80) reversalRisk += 20;

    // Fatores de risco
    const riskFactors: string[] = [];
    if (volatilityLevel === 'extreme') riskFactors.push('Volatilidade extrema');
    if (expectedSize === 'explosive') riskFactors.push('Vela explosiva detectada');
    if (reversalRisk > 60) riskFactors.push('Alto risco de reversão');
    if (currentCandleProgress > 90 && entryTiming === '30s_current') {
      riskFactors.push('Entrada muito tardia na vela');
    }

    // Calcular probabilidade de sucesso
    let successProbability = patterns[0].confidence * 100;
    
    // Penalizar por timing ruim
    if (entryTiming === '30s_current' && currentCandleProgress > 80) {
      successProbability *= 0.6;
    }
    
    // Penalizar por volatilidade
    if (volatilityLevel === 'extreme') successProbability *= 0.4;
    else if (volatilityLevel === 'high') successProbability *= 0.7;
    
    // Penalizar por risco de reversão
    successProbability *= (1 - reversalRisk / 200);
    
    // Penalizar por tamanho de vela
    if (expectedSize === 'explosive') successProbability *= 0.5;
    else if (expectedSize === 'large') successProbability *= 0.8;

    successProbability = Math.max(0, Math.min(100, successProbability));
    const willSucceed = successProbability >= 65;

    // Determinar recomendação
    let recommendation: 'enter_now' | 'wait_next_candle' | 'skip_entry';
    if (!willSucceed || riskFactors.length > 2) {
      recommendation = 'skip_entry';
    } else if (entryTiming === '60s_next' || volatilityLevel === 'high') {
      recommendation = 'wait_next_candle';
    } else {
      recommendation = 'enter_now';
    }

    return {
      willSucceed,
      successProbability,
      entryTiming,
      timeToEntry,
      riskFactors,
      recommendation,
      candleAnalysis: {
        currentProgress: currentCandleProgress,
        expectedSize,
        reversalRisk,
        volatilityLevel
      }
    };
  };

  // Função melhorada para detectar se há um gráfico na tela
  const detectChartInFrame = async (imageData: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          if (!imageData) {
            resolve(false);
            return;
          }
          
          let colorVariations = 0;
          
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            
            if (Math.abs(r - g) > 30 || Math.abs(g - b) > 30) {
              colorVariations++;
            }
          }
          
          const hasChart = colorVariations > (imageData.data.length / 4) * 0.1;
          resolve(hasChart);
        };
        
        img.onerror = () => resolve(false);
        img.src = imageData;
      }, 200);
    });
  };

  // Função para calcular saúde da análise
  const calculateAnalysisHealth = (
    patterns: any[],
    priceActionSignals: any[],
    confluenceScore: number
  ) => {
    const patternActions = patterns.map(p => p.action).filter(a => a !== 'neutro');
    const uniqueActions = [...new Set(patternActions)];
    const consistency = uniqueActions.length <= 1 ? 100 : 50;
    
    const reliability = Math.min(100, 
      (confluenceScore * 0.6) + 
      (patterns.length * 10) + 
      (priceActionSignals.length * 15)
    );
    
    const marketAlignment = patterns.length > 0 && priceActionSignals.length > 0;
    
    return {
      consistency,
      reliability,
      marketAlignment
    };
  };

  // Iniciar câmera
  const startCamera = async () => {
    try {
      setCameraError(null);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador');
      }
      
      const constraints = {
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setCameraError('Falha ao acessar a câmera. Verifique as permissões.');
      toast({
        variant: "destructive",
        title: "Erro na câmera",
        description: "Não foi possível acessar a câmera do dispositivo.",
      });
    }
  };

  // Parar câmera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Capturar frame e analisar com lógica melhorada
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      console.log('🎥 Capturando frame para análise...');
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      const hasChart = await detectChartInFrame(imageUrl);
      setIsChartVisible(hasChart);
      
      if (!hasChart) {
        console.log('📊 Nenhum gráfico detectado na tela');
        setCurrentAnalysis(null);
        return;
      }
      
      console.log('✅ Gráfico detectado! Iniciando análise...');
      
      const enhancedImageUrl = await enhanceImageForAnalysis(imageUrl);
      
      const analysisResult = await analyzeChart(enhancedImageUrl, {
        timeframe: '1m',
        optimizeForScalping: true,
        scalpingStrategy,
        considerVolume,
        considerVolatility,
        marketContextEnabled,
        marketAnalysisDepth,
        enableCandleDetection: true,
        isLiveAnalysis: true,
        useConfluences: true,
        enablePriceAction: true,
        enableMarketContext: true
      });

      setConfluenceDetails(analysisResult.confluences);
      setPriceActionDetails({
        signals: analysisResult.priceActionSignals || [],
        marketContext: analysisResult.detailedMarketContext
      });
      setEntryRecommendations(analysisResult.entryRecommendations || []);

      let finalConfidence = 0;
      let signalQuality = 'fraca';
      let riskReward = 2.0;
      let mainSignal: 'compra' | 'venda' | 'neutro' = 'neutro';
      
      const validPatterns = analysisResult.patterns.filter(p => p.action !== 'neutro');
      
      if (validPatterns.length > 0) {
        const actions = validPatterns.map(p => p.action);
        const uniqueActions = [...new Set(actions)];
        
        if (uniqueActions.length === 1) {
          mainSignal = uniqueActions[0] as 'compra' | 'venda';
          finalConfidence = validPatterns.reduce((sum, p) => sum + p.confidence, 0) / validPatterns.length;
        } else {
          const strongestPattern = validPatterns.reduce((prev, current) => 
            (current.confidence > prev.confidence) ? current : prev
          );
          mainSignal = strongestPattern.action as 'compra' | 'venda';
          finalConfidence = strongestPattern.confidence * 0.7;
        }
      }
      
      const alignedPASignals = analysisResult.priceActionSignals?.filter(pa => 
        (mainSignal === 'compra' && pa.direction === 'alta') ||
        (mainSignal === 'venda' && pa.direction === 'baixa')
      ) || [];
      
      if (alignedPASignals.length > 0) {
        const paConfidence = alignedPASignals.reduce((sum, pa) => sum + pa.confidence, 0) / alignedPASignals.length;
        finalConfidence = (finalConfidence + paConfidence) / 2;
      } else if (analysisResult.priceActionSignals?.length > 0 && mainSignal !== 'neutro') {
        finalConfidence *= 0.6;
      }
      
      if (finalConfidence > 0.85) {
        signalQuality = 'excelente';
      } else if (finalConfidence > 0.75) {
        signalQuality = 'forte';
      } else if (finalConfidence > 0.65) {
        signalQuality = 'boa';
      } else if (finalConfidence > 0.55) {
        signalQuality = 'moderada';
      } else {
        signalQuality = 'fraca';
      }
      
      if (analysisResult.confluences) {
        const confluenceBonus = analysisResult.confluences.confluenceScore / 100 * 0.1;
        finalConfidence = Math.min(1, finalConfidence + confluenceBonus);
        
        if (analysisResult.confluences.confluenceScore > 80) {
          signalQuality = 'excelente';
        }
      }
      
      const bestEntry = analysisResult.entryRecommendations?.find(entry => 
        entry.action === mainSignal
      );
      
      if (bestEntry) {
        riskReward = bestEntry.riskReward;
        finalConfidence = Math.max(finalConfidence, bestEntry.confidence);
      }

      let mappedTrend: 'alta' | 'baixa' | 'lateral' = 'lateral';
      
      if (analysisResult.detailedMarketContext?.trend) {
        const rawTrend = analysisResult.detailedMarketContext.trend;
        if (rawTrend === 'alta') {
          mappedTrend = 'alta';
        } else if (rawTrend === 'baixa') {
          mappedTrend = 'baixa';
        }
      }

      const analysisHealth = calculateAnalysisHealth(
        analysisResult.patterns,
        analysisResult.priceActionSignals || [],
        analysisResult.confluences?.confluenceScore || 0
      );

      // NOVO: Prever sucesso em 1 minuto
      const oneMinutePrediction = await predictOneMinuteSuccess(
        analysisResult.patterns,
        analysisResult.candles,
        analysisResult.marketContext
      );

      const liveResult: LiveAnalysisResult = {
        timestamp: Date.now(),
        confidence: finalConfidence,
        signal: mainSignal,
        patterns: analysisResult.patterns.map(p => p.type),
        trend: mappedTrend,
        signalQuality,
        confluenceScore: analysisResult.confluences?.confluenceScore || 0,
        supportResistance: analysisResult.confluences?.supportResistance?.slice(0, 3) || [],
        criticalLevels: analysisResult.confluences?.criticalLevels || [],
        priceActionSignals: analysisResult.priceActionSignals?.slice(0, 2) || [],
        marketPhase: analysisResult.detailedMarketContext?.phase || 'indefinida',
        institutionalBias: analysisResult.detailedMarketContext?.institutionalBias || 'neutro',
        entryRecommendations: analysisResult.entryRecommendations?.filter(entry => 
          entry.action === mainSignal
        ).slice(0, 2) || [],
        riskReward,
        analysisHealth,
        oneMinutePrediction
      };

      setCurrentAnalysis(liveResult);
      setLiveResults(prev => [liveResult, ...prev.slice(0, 19)]);

      setAnalysisStats(prev => ({
        totalAnalyses: prev.totalAnalyses + 1,
        validSignals: prev.validSignals + (mainSignal !== 'neutro' ? 1 : 0),
        avgConfidence: (prev.avgConfidence * prev.totalAnalyses + finalConfidence * 100) / (prev.totalAnalyses + 1),
        lastValidSignalTime: mainSignal !== 'neutro' ? Date.now() : prev.lastValidSignalTime
      }));

      // NOVO: Notificar baseado na predição de 1 minuto
      if (oneMinutePrediction && oneMinutePrediction.willSucceed && oneMinutePrediction.recommendation === 'enter_now') {
        toast({
          variant: mainSignal === 'compra' ? "default" : "destructive",
          title: `🚀 ENTRADA APROVADA - ${mainSignal.toUpperCase()}`,
          description: `Sucesso: ${Math.round(oneMinutePrediction.successProbability)}% | Timing: ${oneMinutePrediction.entryTiming === '30s_current' ? '30s atual' : '60s próxima'}`,
          duration: 8000,
        });
      } else if (oneMinutePrediction && oneMinutePrediction.recommendation === 'wait_next_candle') {
        toast({
          variant: "default",
          title: "⏳ AGUARDAR PRÓXIMA VELA",
          description: `Entrada em ${Math.round(oneMinutePrediction.timeToEntry)}s | Sucesso: ${Math.round(oneMinutePrediction.successProbability)}%`,
          duration: 5000,
        });
      } else if (oneMinutePrediction && oneMinutePrediction.riskFactors.length > 0) {
        toast({
          variant: "destructive",
          title: "❌ ENTRADA REJEITADA",
          description: oneMinutePrediction.riskFactors[0],
          duration: 5000,
        });
      }

      console.log(`✅ Análise completa - Sinal: ${mainSignal} (${Math.round(finalConfidence * 100)}%)`);

    } catch (error) {
      console.error('❌ Erro na análise em tempo real:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, scalpingStrategy, considerVolume, considerVolatility, marketContextEnabled, marketAnalysisDepth, toast, currentCandleProgress]);

  // Iniciar análise em tempo real
  const startLiveAnalysis = async () => {
    await startCamera();
    setIsLiveActive(true);
    
    setTimeout(() => {
      intervalRef.current = setInterval(captureAndAnalyze, analysisInterval);
    }, 1000);

    toast({
      variant: "default",
      title: "✅ Análise Live Iniciada",
      description: `Analisando com predição de sucesso a cada ${analysisInterval / 1000} segundos`,
    });
  };

  // Parar análise em tempo real
  const stopLiveAnalysis = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsLiveActive(false);
    stopCamera();
    setCurrentAnalysis(null);
    setIsChartVisible(false);

    toast({
      variant: "default",
      title: "⏹️ Análise Live Parada",
      description: "Análise em tempo real foi interrompida",
    });
  };

  // Alternar modo da câmera
  const toggleCameraFacing = () => {
    stopLiveAnalysis();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isLiveActive) {
      setTimeout(() => startLiveAnalysis(), 500);
    }
  }, [facingMode]);

  return (
    <div className="w-full space-y-4">
      {/* Cabeçalho com timer da vela */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Análise Live M1 - Predição de Sucesso
            {isLiveActive && (
              <Badge variant="default" className="ml-2 animate-pulse">
                AO VIVO
              </Badge>
            )}
            {isLiveActive && (
              <div className="ml-auto flex items-center gap-2 text-sm">
                <Timer className="h-4 w-4" />
                <span className="font-mono">
                  {Math.round(currentCandleProgress)}% | {timeToNextCandle}s
                </span>
              </div>
            )}
          </CardTitle>
          {analysisStats.totalAnalyses > 0 && (
            <div className="text-xs text-muted-foreground mt-2">
              Análises: {analysisStats.totalAnalyses} | 
              Sinais Válidos: {analysisStats.validSignals} | 
              Confiança Média: {Math.round(analysisStats.avgConfidence)}%
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {!isLiveActive ? (
              <Button onClick={startLiveAnalysis} className="gap-2">
                <Play className="w-4 h-4" />
                Iniciar Live M1
              </Button>
            ) : (
              <Button onClick={stopLiveAnalysis} variant="destructive" className="gap-2">
                <Pause className="w-4 h-4" />
                Parar Live
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={toggleCameraFacing}
              disabled={isLiveActive}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              {facingMode === 'environment' ? 'Traseira' : 'Frontal'}
            </Button>

            <select 
              value={analysisInterval} 
              onChange={(e) => setAnalysisInterval(Number(e.target.value))}
              disabled={isLiveActive}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value={1000}>1 segundo</option>
              <option value={2000}>2 segundos</option>
              <option value={3000}>3 segundos</option>
              <option value={5000}>5 segundos</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {cameraError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      )}

      {/* Video feed com overlay aprimorado */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted 
          className="w-full h-full object-cover"
        />
        
        {/* Progress bar da vela atual */}
        {isLiveActive && (
          <div className="absolute top-2 left-2 right-2">
            <div className="bg-black/70 rounded-lg p-2">
              <div className="flex justify-between text-white text-xs mb-1">
                <span>Progresso da Vela M1</span>
                <span>{Math.round(currentCandleProgress)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${currentCandleProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
        
        {isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <Activity className="animate-spin h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">
                {isChartVisible ? 'Analisando com IA + Predição...' : 'Procurando gráfico...'}
              </p>
            </div>
          </div>
        )}

        {isLiveActive && !isChartVisible && !isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-white text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
              <p className="text-sm">Aponte a câmera para um gráfico</p>
              <p className="text-xs text-gray-300">Aguardando detecção automática...</p>
            </div>
          </div>
        )}

        {/* NOVO: Overlay de predição de sucesso */}
        {currentAnalysis && isChartVisible && (
          <motion.div 
            className="absolute top-16 left-4 right-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-black/90 border-amber-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between text-white mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={currentAnalysis.signal === 'compra' ? 'default' : 
                                 currentAnalysis.signal === 'venda' ? 'destructive' : 'secondary'}
                      >
                        {currentAnalysis.signal.toUpperCase()}
                      </Badge>
                      {currentAnalysis.oneMinutePrediction && (
                        <Badge 
                          variant={currentAnalysis.oneMinutePrediction.willSucceed ? 'default' : 'destructive'}
                          className="text-xs flex items-center gap-1"
                        >
                          {currentAnalysis.oneMinutePrediction.willSucceed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {Math.round(currentAnalysis.oneMinutePrediction.successProbability)}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs">
                      Confiança: {Math.round(currentAnalysis.confidence * 100)}%
                    </p>
                  </div>
                  <div className="text-right">
                    {currentAnalysis.oneMinutePrediction && (
                      <div className="text-xs">
                        <div className="text-yellow-300">
                          {currentAnalysis.oneMinutePrediction.entryTiming === '30s_current' ? '30s Atual' : '60s Próxima'}
                        </div>
                        <div className="text-blue-300">
                          Entrada: {Math.round(currentAnalysis.oneMinutePrediction.timeToEntry)}s
                        </div>
                        <div className={`text-xs ${
                          currentAnalysis.oneMinutePrediction.recommendation === 'enter_now' ? 'text-green-400' :
                          currentAnalysis.oneMinutePrediction.recommendation === 'wait_next_candle' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {currentAnalysis.oneMinutePrediction.recommendation === 'enter_now' ? 'ENTRAR AGORA' :
                           currentAnalysis.oneMinutePrediction.recommendation === 'wait_next_candle' ? 'AGUARDAR' :
                           'PULAR'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* NOVO: Análise da vela */}
                {currentAnalysis.oneMinutePrediction && (
                  <div className="text-xs text-purple-300 mb-1">
                    Vela: {currentAnalysis.oneMinutePrediction.candleAnalysis.expectedSize.toUpperCase()} | 
                    Reversão: {Math.round(currentAnalysis.oneMinutePrediction.candleAnalysis.reversalRisk)}% | 
                    Vol: {currentAnalysis.oneMinutePrediction.candleAnalysis.volatilityLevel.toUpperCase()}
                  </div>
                )}
                
                {/* Fatores de risco */}
                {currentAnalysis.oneMinutePrediction && currentAnalysis.oneMinutePrediction.riskFactors.length > 0 && (
                  <div className="text-xs text-red-400">
                    ⚠️ {currentAnalysis.oneMinutePrediction.riskFactors[0]}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* NOVO: Histórico com predições */}
      {liveResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico de Predições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <AnimatePresence>
                {liveResults.map((result, index) => (
                  <motion.div
                    key={result.timestamp}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between p-2 border rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={result.signal === 'compra' ? 'default' : 
                                 result.signal === 'venda' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {result.signal}
                      </Badge>
                      {result.oneMinutePrediction && (
                        <Badge 
                          variant={result.oneMinutePrediction.willSucceed ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {result.oneMinutePrediction.willSucceed ? '✅' : '❌'}
                          {Math.round(result.oneMinutePrediction.successProbability)}%
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                      {result.oneMinutePrediction && (
                        <div className="text-xs">
                          {result.oneMinutePrediction.entryTiming === '30s_current' ? '30s' : '60s'} | 
                          {result.oneMinutePrediction.candleAnalysis.expectedSize}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default LiveAnalysis;
