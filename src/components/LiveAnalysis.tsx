import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Camera, Play, Pause, Settings, AlertTriangle, Activity, TrendingUp, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { enhanceImageForAnalysis } from '@/utils/imagePreProcessing';
import { analyzeChart } from '@/utils/patternDetection';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface LiveAnalysisResult {
  timestamp: number;
  captureTime: number;
  analysisTime: number;
  confidence: number;
  signal: 'compra' | 'venda' | 'neutro';
  patterns: string[];
  price?: string;
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
  latency?: number;
  chartAnalysisQuality?: 'excelente' | 'boa' | 'regular' | 'ruim';
  visualConfirmation?: boolean;
}

const LiveAnalysis = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(3000); // Aumentado para 3 segundos
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
  const [lastSignalTime, setLastSignalTime] = useState<number>(0);
  const [analysisCount, setAnalysisCount] = useState<number>(0);
  const [chartDetectionEnabled, setChartDetectionEnabled] = useState(true);

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

  // Função melhorada para detectar se há realmente um gráfico na imagem
  const detectChartInImage = (canvas: HTMLCanvasElement): { hasChart: boolean; quality: 'excelente' | 'boa' | 'regular' | 'ruim' } => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { hasChart: false, quality: 'ruim' };

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let linePixels = 0;
    let colorVariations = new Set<string>();
    let contrastCount = 0;
    
    // Analisar pixels para detectar padrões de gráfico
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Detectar variações de cor (indicativo de dados visuais)
      const colorKey = `${Math.floor(r/10)}-${Math.floor(g/10)}-${Math.floor(b/10)}`;
      colorVariations.add(colorKey);
      
      // Detectar contrastes (bordas de candles, linhas)
      if (i > 4) {
        const prevR = data[i - 4];
        const prevG = data[i - 3];
        const prevB = data[i - 2];
        
        const contrast = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
        if (contrast > 100) contrastCount++;
      }
    }
    
    const totalPixels = data.length / 4;
    const colorDiversity = colorVariations.size;
    const contrastRatio = contrastCount / totalPixels;
    
    // Critérios para detectar gráfico
    const hasChart = colorDiversity > 50 && contrastRatio > 0.02;
    
    let quality: 'excelente' | 'boa' | 'regular' | 'ruim' = 'ruim';
    if (hasChart) {
      if (colorDiversity > 200 && contrastRatio > 0.08) quality = 'excelente';
      else if (colorDiversity > 150 && contrastRatio > 0.05) quality = 'boa';
      else if (colorDiversity > 100 && contrastRatio > 0.03) quality = 'regular';
    }
    
    return { hasChart, quality };
  };

  // Capturar frame e analisar com validação inteligente
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    const captureStartTime = Date.now();
    console.log(`[ANÁLISE ${analysisCount + 1}] Iniciando captura inteligente`);

    try {
      setIsAnalyzing(true);
      setAnalysisCount(prev => prev + 1);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Capturar frame atual
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const captureTime = Date.now();
      
      // VALIDAÇÃO 1: Detectar se há realmente um gráfico
      const chartDetection = detectChartInImage(canvas);
      
      if (chartDetectionEnabled && !chartDetection.hasChart) {
        console.log(`[ANÁLISE ${analysisCount + 1}] Nenhum gráfico detectado - pulando análise`);
        
        setCurrentAnalysis({
          timestamp: captureTime,
          captureTime,
          analysisTime: Date.now(),
          confidence: 0,
          signal: 'neutro',
          patterns: [],
          trend: 'lateral',
          signalQuality: 'ruim',
          chartAnalysisQuality: chartDetection.quality,
          visualConfirmation: false,
          latency: Date.now() - captureStartTime
        });
        return;
      }
      
      // VALIDAÇÃO 2: Aguardar tempo mínimo entre sinais válidos
      const timeSinceLastSignal = captureTime - lastSignalTime;
      const minimumInterval = 15000; // 15 segundos mínimo entre sinais
      
      if (timeSinceLastSignal < minimumInterval) {
        console.log(`[ANÁLISE ${analysisCount + 1}] Muito próximo do último sinal (${timeSinceLastSignal}ms) - aguardando`);
        return;
      }

      // Converter para base64 com qualidade adequada
      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Analisar com configuração criteriosa
      const analysisResult = await analyzeChart(imageUrl, {
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
        enableMarketContext: true,
        sensitivity: 0.8 // Aumentar sensibilidade para ser mais criterioso
      });

      const analysisEndTime = Date.now();
      const totalLatency = analysisEndTime - captureStartTime;
      
      console.log(`[ANÁLISE ${analysisCount + 1}] Gráfico detectado (${chartDetection.quality}) - Latência: ${totalLatency}ms`);

      // VALIDAÇÃO 3: Filtros de qualidade para sinais
      let shouldGenerateSignal = false;
      let finalConfidence = analysisResult.patterns[0]?.confidence || 0;
      
      // Critérios mais rigorosos para gerar sinal
      const hasValidPatterns = analysisResult.patterns.length > 0 && analysisResult.patterns[0].action !== 'neutro';
      const hasGoodConfluence = (analysisResult.confluences?.confluenceScore || 0) > 60;
      const hasStrongPriceAction = (analysisResult.priceActionSignals?.length || 0) > 0 && 
                                  (analysisResult.priceActionSignals?.[0]?.confidence || 0) > 0.7;
      const hasValidEntry = (analysisResult.entryRecommendations?.length || 0) > 0;
      
      // Deve ter pelo menos 2 dos 4 critérios
      const validCriteria = [hasValidPatterns, hasGoodConfluence, hasStrongPriceAction, hasValidEntry].filter(Boolean).length;
      shouldGenerateSignal = validCriteria >= 2 && finalConfidence > 0.6;

      // Armazenar detalhes das confluências e price action
      setConfluenceDetails(analysisResult.confluences);
      setPriceActionDetails({
        signals: analysisResult.priceActionSignals || [],
        marketContext: analysisResult.detailedMarketContext
      });
      setEntryRecommendations(analysisResult.entryRecommendations || []);

      // Processar resultado para formato live
      let signalQuality = 'regular';
      if (shouldGenerateSignal) {
        if (validCriteria >= 3 && finalConfidence > 0.8) {
          signalQuality = 'excelente';
        } else if (validCriteria >= 3 || finalConfidence > 0.75) {
          signalQuality = 'boa';
        }
      } else {
        signalQuality = 'ruim';
      }

      const liveResult: LiveAnalysisResult = {
        timestamp: analysisResult.timestamp,
        captureTime,
        analysisTime: analysisEndTime,
        latency: totalLatency,
        confidence: finalConfidence,
        signal: shouldGenerateSignal ? (analysisResult.patterns[0]?.action || 'neutro') : 'neutro',
        patterns: shouldGenerateSignal ? analysisResult.patterns.map(p => p.type) : [],
        trend: analysisResult.detailedMarketContext?.marketStructure.trend || 'lateral',
        signalQuality,
        confluenceScore: analysisResult.confluences?.confluenceScore || 0,
        supportResistance: analysisResult.confluences?.supportResistance?.slice(0, 3) || [],
        criticalLevels: analysisResult.confluences?.criticalLevels || [],
        priceActionSignals: analysisResult.priceActionSignals?.slice(0, 2) || [],
        marketPhase: analysisResult.detailedMarketContext?.phase || 'indefinida',
        institutionalBias: analysisResult.detailedMarketContext?.institutionalBias || 'neutro',
        entryRecommendations: shouldGenerateSignal ? (analysisResult.entryRecommendations?.slice(0, 2) || []) : [],
        riskReward: analysisResult.entryRecommendations?.[0]?.riskReward || 2.0,
        chartAnalysisQuality: chartDetection.quality,
        visualConfirmation: chartDetection.hasChart
      };

      setCurrentAnalysis(liveResult);
      setLiveResults(prev => [liveResult, ...prev.slice(0, 19)]);

      // VALIDAÇÃO 4: Notificar apenas sinais de alta qualidade com intervalo adequado
      if (shouldGenerateSignal && signalQuality !== 'ruim' && liveResult.signal !== 'neutro') {
        setLastSignalTime(captureTime);
        
        const qualityEmoji = signalQuality === 'excelente' ? '🔥' : signalQuality === 'boa' ? '⚡' : '📊';
        
        toast({
          variant: liveResult.signal === 'compra' ? "default" : "destructive",
          title: `${qualityEmoji} SINAL ${signalQuality.toUpperCase()} - ${liveResult.signal.toUpperCase()}`,
          description: `Confiança: ${Math.round(finalConfidence * 100)}% | Confluência: ${Math.round(liveResult.confluenceScore)}% | Fase: ${liveResult.marketPhase}`,
          duration: 10000,
        });
      }

    } catch (error) {
      console.error('Erro na análise inteligente:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, analysisCount, chartDetectionEnabled, lastSignalTime, scalpingStrategy, considerVolume, considerVolatility, marketContextEnabled, marketAnalysisDepth, toast]);

  // Iniciar análise em tempo real com timing otimizado
  const startLiveAnalysis = async () => {
    await startCamera();
    setIsLiveActive(true);
    setLastSignalTime(Date.now()); // Reset do controle de sinais
    
    // Aguardar menos tempo para a câmera inicializar
    setTimeout(() => {
      console.log(`[TIMING] Iniciando análise live com intervalo de ${analysisInterval}ms`);
      intervalRef.current = setInterval(captureAndAnalyze, analysisInterval);
    }, 500); // Reduzido de 1000ms para 500ms

    toast({
      variant: "default",
      title: "✅ Análise Live Iniciada",
      description: `Analisando gráficos a cada ${analysisInterval / 1000} segundos`,
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

  // Reiniciar quando facing mode muda
  useEffect(() => {
    if (isLiveActive) {
      setTimeout(() => startLiveAnalysis(), 500);
    }
  }, [facingMode]);

  return (
    <div className="w-full space-y-4">
      {/* Cabeçalho com controles inteligentes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" />
            Análise Inteligente M1 - Detecção Visual
            {isLiveActive && (
              <Badge variant="default" className="ml-2 animate-pulse">
                AO VIVO
              </Badge>
            )}
            {currentAnalysis?.latency && (
              <Badge variant="outline" className="ml-2 text-xs">
                {currentAnalysis.latency < 1000 ? `${currentAnalysis.latency}ms` : `${(currentAnalysis.latency/1000).toFixed(1)}s`}
              </Badge>
            )}
            {currentAnalysis?.chartAnalysisQuality && (
              <Badge 
                variant={currentAnalysis.chartAnalysisQuality === 'excelente' || currentAnalysis.chartAnalysisQuality === 'boa' ? 'default' : 'destructive'}
                className="ml-2 text-xs"
              >
                {currentAnalysis.chartAnalysisQuality}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {!isLiveActive ? (
              <Button onClick={startLiveAnalysis} className="gap-2">
                <Play className="w-4 h-4" />
                Iniciar Análise Inteligente
              </Button>
            ) : (
              <Button onClick={stopLiveAnalysis} variant="destructive" className="gap-2">
                <Pause className="w-4 h-4" />
                Parar Análise
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
              <option value={3000}>3 segundos (INTELIGENTE)</option>
              <option value={5000}>5 segundos</option>
              <option value={10000}>10 segundos</option>
              <option value={15000}>15 segundos (CONSERVADOR)</option>
            </select>

            <Button
              variant={chartDetectionEnabled ? "default" : "outline"}
              onClick={() => setChartDetectionEnabled(!chartDetectionEnabled)}
              className="gap-2 text-xs"
            >
              <Eye className="w-3 h-3" />
              {chartDetectionEnabled ? 'Detecção ON' : 'Detecção OFF'}
            </Button>

            {/* ... keep existing code (other buttons) */}
          </div>
          
          {/* Status da análise */}
          <div className="mt-3 text-sm text-muted-foreground">
            Análises realizadas: {analysisCount} | 
            Último sinal: {lastSignalTime > 0 ? new Date(lastSignalTime).toLocaleTimeString() : 'Nenhum'} |
            Detecção visual: {chartDetectionEnabled ? 'Ativa' : 'Desativada'}
          </div>
        </CardContent>
      </Card>

      {/* Erro da câmera */}
      {cameraError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      )}

      {/* Video feed com overlay melhorado */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted 
          className="w-full h-full object-cover"
        />
        
        {isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <Activity className="animate-spin h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Analisando gráfico...</p>
              <p className="text-xs text-gray-300">Análise #{analysisCount}</p>
            </div>
          </div>
        )}

        {currentAnalysis && (
          <motion.div 
            className="absolute top-4 left-4 right-4"
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
                      {currentAnalysis.signalQuality && (
                        <Badge 
                          variant={currentAnalysis.signalQuality === 'excelente' ? 'default' : 
                                   currentAnalysis.signalQuality === 'boa' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {currentAnalysis.signalQuality}
                        </Badge>
                      )}
                      <Badge 
                        variant={currentAnalysis.visualConfirmation ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {currentAnalysis.visualConfirmation ? '👁️ VISTO' : '❌ SEM GRÁFICO'}
                      </Badge>
                    </div>
                    <p className="text-xs">
                      Confiança: {Math.round(currentAnalysis.confidence * 100)}% | 
                      Confluência: {Math.round(currentAnalysis.confluenceScore || 0)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-yellow-300">
                      Qualidade: {currentAnalysis.chartAnalysisQuality}
                    </div>
                    <div className="text-xs text-blue-300">
                      Fase: {currentAnalysis.marketPhase}
                    </div>
                    <div className="text-xs text-gray-300">
                      #{analysisCount}
                    </div>
                  </div>
                </div>
                
                {/* Price Action Signals */}
                {currentAnalysis.priceActionSignals && currentAnalysis.priceActionSignals.length > 0 && (
                  <div className="text-xs text-purple-300 mb-1">
                    PA: {currentAnalysis.priceActionSignals.map((pa: any) => pa.type).join(', ')}
                  </div>
                )}
                
                {/* Entry Recommendations */}
                {currentAnalysis.entryRecommendations && currentAnalysis.entryRecommendations.length > 0 && (
                  <div className="text-xs text-green-400">
                    Entrada: {currentAnalysis.entryRecommendations[0].entryPrice?.toFixed(4)} | 
                    SL: {currentAnalysis.entryRecommendations[0].stopLoss?.toFixed(4)} | 
                    TP: {currentAnalysis.entryRecommendations[0].takeProfit?.toFixed(4)}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Detalhes do Price Action */}
      {showPriceActionDetails && priceActionDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Análise de Price Action M1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sinais de Price Action */}
            {priceActionDetails.signals && priceActionDetails.signals.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Sinais Detectados</h4>
                <div className="space-y-2">
                  {priceActionDetails.signals.slice(0, 3).map((signal: any, index: number) => (
                    <div key={index} className="border rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-medium ${signal.direction === 'alta' ? 'text-green-600' : 'text-red-600'}`}>
                          {signal.type} - {signal.direction}
                        </span>
                        <Badge variant={signal.strength === 'forte' ? 'default' : 'secondary'}>
                          {signal.strength}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {signal.description}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Confiança: {Math.round(signal.confidence * 100)}% | R:R {signal.riskReward?.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contexto de Mercado Detalhado */}
            {priceActionDetails.marketContext && (
              <div>
                <h4 className="font-semibold mb-2">Contexto de Mercado</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Fase:</span> {priceActionDetails.marketContext.phase}
                  </div>
                  <div>
                    <span className="font-medium">Sentimento:</span> {priceActionDetails.marketContext.sentiment}
                  </div>
                  <div>
                    <span className="font-medium">Volatilidade:</span> {priceActionDetails.marketContext.volatilityState}
                  </div>
                  <div>
                    <span className="font-medium">Liquidez:</span> {priceActionDetails.marketContext.liquidityCondition}
                  </div>
                  <div>
                    <span className="font-medium">Bias Institucional:</span> {priceActionDetails.marketContext.institutionalBias}
                  </div>
                  <div>
                    <span className="font-medium">Horário:</span> {priceActionDetails.marketContext.timeOfDay}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recomendações de Entrada */}
      {entryRecommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recomendações de Entrada M1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entryRecommendations.map((entry: any, index: number) => (
                <div key={index} className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex justify-between items-center mb-2">
                    <Badge 
                      variant={entry.action === 'compra' ? 'default' : 'destructive'}
                      className="text-sm"
                    >
                      {entry.action.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">
                      Confiança: {Math.round(entry.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <span className="font-medium">Entrada:</span> {entry.entryPrice?.toFixed(4)}
                    </div>
                    <div>
                      <span className="font-medium">Stop:</span> {entry.stopLoss?.toFixed(4)}
                    </div>
                    <div>
                      <span className="font-medium">Alvo:</span> {entry.takeProfit?.toFixed(4)}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-1">
                    R:R {entry.riskReward?.toFixed(1)} | Timeframe: {entry.timeframe}
                  </div>
                  
                  <div className="text-xs">
                    <span className="font-medium">Análise:</span> {entry.reasoning}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhes das confluências */}
      {showConfluenceDetails && confluenceDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Análise de Confluências</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score geral */}
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(confluenceDetails.confluenceScore)}%
              </div>
              <div className="text-sm text-muted-foreground">Score de Confluência</div>
            </div>

            {/* Suportes e Resistências */}
            {confluenceDetails.supportResistance && confluenceDetails.supportResistance.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Suportes e Resistências</h4>
                <div className="space-y-1">
                  {confluenceDetails.supportResistance.slice(0, 3).map((level: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className={level.type === 'support' ? 'text-green-600' : 'text-red-600'}>
                        {level.type === 'support' ? 'Suporte' : 'Resistência'} {level.strength}
                      </span>
                      <span>{level.price.toFixed(4)} ({level.confidence.toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estrutura de mercado */}
            {confluenceDetails.marketStructure && (
              <div>
                <h4 className="font-semibold mb-2">Estrutura de Mercado</h4>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    confluenceDetails.marketStructure.structure === 'bullish' ? 'bg-green-100 text-green-800' :
                    confluenceDetails.marketStructure.structure === 'bearish' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {confluenceDetails.marketStructure.structure.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Price Action */}
            {confluenceDetails.priceAction && (
              <div>
                <h4 className="font-semibold mb-2">Price Action</h4>
                <div className="flex justify-between text-sm">
                  <span>Tendência: {confluenceDetails.priceAction.trend}</span>
                  <span>Momentum: {confluenceDetails.priceAction.momentum}</span>
                </div>
                <div className="text-sm">
                  Força: {Math.round(confluenceDetails.priceAction.strength)}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico de resultados com confluências */}
      {liveResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico de Sinais</CardTitle>
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
                      <span className="text-xs text-muted-foreground">
                        {Math.round(result.confidence * 100)}%
                      </span>
                      {result.confluenceScore !== undefined && (
                        <span className="text-xs text-blue-600">
                          C:{Math.round(result.confluenceScore)}%
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-xs">
                        {result.patterns.slice(0, 2).join(', ')}
                      </div>
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
