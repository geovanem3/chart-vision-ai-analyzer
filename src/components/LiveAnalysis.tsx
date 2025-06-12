import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { analyzeChartPixels, ChartPixelAnalysis } from '@/utils/chartPixelAnalysis';
import { analyzeChart, AnalysisResult } from '@/utils/patternDetection';
import { Activity, AlertTriangle, Camera, Eye, Filter, FlipHorizontal, X } from 'lucide-react';
import { motion } from 'framer-motion';
import LiveChartMarkup from './LiveChartMarkup';

type SignalQuality = 'fraca' | 'moderada' | 'forte' | 'muito_forte';

const LiveAnalysis = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraAccessAttempted, setCameraAccessAttempted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [activeTab, setActiveTab] = useState('photo');
  const [analysisCount, setAnalysisCount] = useState(0);
  const [consecutiveNoChartCount, setConsecutiveNoChartCount] = useState(0);
  const [minSignalQuality, setMinSignalQuality] = useState<SignalQuality>('forte');
  const [signalCooldown, setSignalCooldown] = useState(3000); // 3 segundos
  const [chartDetectionEnabled, setChartDetectionEnabled] = useState(true);
  const [lastSignalTime, setLastSignalTime] = useState(0);
  const [pixelAnalysisHistory, setPixelAnalysisHistory] = useState<ChartPixelAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  
  const { toast } = useToast();
  
  // Iniciar câmera
  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraAccessAttempted(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
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
        setIsCameraActive(true);
        toast({
          title: "✓ Câmera Ativada",
          description: "Posicione o gráfico para análise em tempo real.",
        });
        
        // Iniciar análise live após 1 segundo
        setTimeout(() => {
          setIsLiveActive(true);
          startLiveAnalysis();
        }, 1000);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Falha ao acessar a câmera. Verifique as permissões e tente novamente.';
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Câmera bloqueada. Por favor, permita o acesso à câmera nas configurações do seu navegador.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Nenhuma câmera foi encontrada no seu dispositivo.';
        }
      }
      
      setCameraError(errorMessage);
      toast({
        variant: "destructive",
        title: "✗ Erro na câmera",
        description: errorMessage,
      });
    }
  };

  // Parar câmera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
      setIsLiveActive(false);
    }
  };

  // Alternar câmera frontal/traseira
  const toggleCameraFacing = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };
  
  // Capturar frame para análise
  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas;
      }
    }
    return null;
  }, []);
  
  // Analisar pixels do gráfico
  const analyzeFrame = useCallback(async () => {
    const canvas = captureFrame();
    if (!canvas) return null;
    
    setIsAnalyzing(true);
    
    try {
      // Análise de pixels para detectar qualidade do gráfico
      const pixelAnalysis = analyzeChartPixels(canvas);
      
      // Atualizar histórico de análise de pixels
      setPixelAnalysisHistory(prev => {
        const newHistory = [pixelAnalysis, ...prev];
        return newHistory.slice(0, 20); // Manter apenas as últimas 20 análises
      });
      
      // Verificar se é um gráfico válido
      if (chartDetectionEnabled && !pixelAnalysis.hasValidChart) {
        setConsecutiveNoChartCount(prev => prev + 1);
        return null;
      }
      
      // Resetar contador se gráfico válido
      setConsecutiveNoChartCount(0);
      
      // Análise técnica do gráfico
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      const analysisResult = await analyzeChart(imageData, {
        isLiveAnalysis: true,
        enablePriceAction: true,
        enableMarketContext: true,
        useConfluences: true,
        sensitivity: minSignalQuality === 'muito_forte' ? 0.9 : 
                    minSignalQuality === 'forte' ? 0.8 :
                    minSignalQuality === 'moderada' ? 0.7 : 0.6
      });
      
      // Adicionar análise de pixels ao resultado
      analysisResult.pixelAnalysis = pixelAnalysis;
      
      // Incrementar contador de análises
      setAnalysisCount(prev => prev + 1);
      
      return analysisResult;
    } catch (error) {
      console.error('Error analyzing frame:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [captureFrame, chartDetectionEnabled, minSignalQuality]);
  
  // Verificar se o sinal atende aos critérios de qualidade
  const isSignalValid = useCallback((analysis: AnalysisResult | null) => {
    if (!analysis) return false;
    
    // Verificar cooldown
    const now = Date.now();
    if (now - lastSignalTime < signalCooldown) return false;
    
    // Verificar qualidade mínima
    const confidenceThreshold = 
      minSignalQuality === 'muito_forte' ? 85 :
      minSignalQuality === 'forte' ? 75 :
      minSignalQuality === 'moderada' ? 65 : 55;
    
    if (analysis.confidence < confidenceThreshold) return false;
    
    // Verificar se há padrões detectados
    if (!analysis.patterns || analysis.patterns.length === 0) return false;
    
    // Verificar se há sinais claros
    if (!analysis.signals || analysis.signals.length === 0) return false;
    
    return true;
  }, [lastSignalTime, signalCooldown, minSignalQuality]);
  
  // Notificar usuário sobre sinal
  const notifySignal = useCallback((analysis: AnalysisResult) => {
    const signal = analysis.signals[0];
    const pattern = analysis.patterns[0];
    
    // Atualizar timestamp do último sinal
    setLastSignalTime(Date.now());
    
    // Notificar usuário
    toast({
      title: `🎯 ${signal.type === 'Buy' ? 'COMPRA' : 'VENDA'} Detectada`,
      description: `${pattern.type} com ${Math.round(analysis.confidence)}% de confiança`,
      variant: signal.type === 'Buy' ? 'default' : 'destructive',
      duration: 5000,
    });
    
    // Reproduzir som de alerta (opcional)
    try {
      const audio = new Audio(signal.type === 'Buy' ? '/sounds/buy-alert.mp3' : '/sounds/sell-alert.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [toast]);
  
  // Iniciar análise em tempo real
  const startLiveAnalysis = useCallback(() => {
    if (!isLiveActive) return;
    
    let analysisInterval: NodeJS.Timeout;
    
    const runAnalysis = async () => {
      if (!isLiveActive) return;
      
      const analysis = await analyzeFrame();
      
      // Atualizar análise atual
      setCurrentAnalysis(analysis);
      
      // Verificar e notificar sinais válidos
      if (analysis && isSignalValid(analysis)) {
        notifySignal(analysis);
      }
    };
    
    // Executar primeira análise imediatamente
    runAnalysis();
    
    // Configurar intervalo para análises subsequentes
    analysisInterval = setInterval(runAnalysis, 2000);
    
    // Limpar intervalo quando o componente for desmontado
    return () => {
      clearInterval(analysisInterval);
    };
  }, [isLiveActive, analyzeFrame, isSignalValid, notifySignal]);
  
  // Iniciar análise quando a câmera estiver ativa
  useEffect(() => {
    if (isLiveActive) {
      const cleanup = startLiveAnalysis();
      return cleanup;
    }
  }, [isLiveActive, startLiveAnalysis]);
  
  // Iniciar câmera quando o modo de câmera mudar
  useEffect(() => {
    if (!isCameraActive && cameraAccessAttempted && activeTab === 'photo') {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [facingMode, cameraAccessAttempted, activeTab]);

  return (
    <div className="w-full space-y-4">
      {/* Cabeçalho com controles ultra-rigorosos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Análise Live Ultra-Rigorosa
            {consecutiveNoChartCount > 3 && (
              <Badge variant="destructive" className="text-xs">
                Sem gráfico por {consecutiveNoChartCount} análises
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configurações rigorosas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Filtro de Qualidade</div>
              <Badge variant={minSignalQuality === 'muito_forte' ? 'default' : 'secondary'}>
                {minSignalQuality.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Cooldown</div>
              <Badge variant="outline">{signalCooldown/1000}s</Badge>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Detecção</div>
              <Badge variant={chartDetectionEnabled ? 'default' : 'secondary'}>
                {chartDetectionEnabled ? 'ATIVA' : 'DESATIVA'}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Análises</div>
              <Badge variant="outline">{analysisCount}</Badge>
            </div>
          </div>

          {/* Qualidade da detecção de pixels em tempo real */}
          {pixelAnalysisHistory.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Qualidade da Visão (Últimas análises)
              </div>
              <div className="flex gap-1">
                {pixelAnalysisHistory.slice(0, 10).map((analysis, idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full ${
                      analysis.chartQuality === 'excelente' ? 'bg-green-500' :
                      analysis.chartQuality === 'boa' ? 'bg-blue-500' :
                      analysis.chartQuality === 'regular' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    title={`${analysis.chartQuality} - ${analysis.confidence}% - ${analysis.candleDetection.count} candles`}
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Verde: Excelente | Azul: Boa | Amarelo: Regular | Vermelho: Ruim
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Container da câmera com overlay de análise */}
      <div className="relative">
        <Card>
          <CardContent className="p-0">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4">
                  <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{cameraError}</AlertDescription>
                  </Alert>
                </div>
              )}
              
              {isAnalyzing && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-blue-500 animate-pulse">
                    <Filter className="h-3 w-3 mr-1" />
                    Analisando pixels...
                  </Badge>
                </div>
              )}
              
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                muted 
                className="w-full h-full object-cover"
              />
              
              {/* Overlay de marcação em tempo real */}
              <LiveChartMarkup
                videoRef={videoRef}
                isActive={isLiveActive}
                analysisResult={currentAnalysis}
                pixelAnalysis={currentAnalysis?.pixelAnalysis}
              />
              
              <canvas 
                ref={canvasRef} 
                className="hidden" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles da câmera */}
      <div className="flex items-center justify-center gap-3">
        {isCameraActive ? (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleCameraFacing}
              className="rounded-full h-10 w-10"
            >
              <FlipHorizontal className="w-4 h-4" />
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              onClick={stopCamera}
              className="rounded-full h-10 w-10"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button onClick={startCamera} className="gap-1">
            <Camera className="w-4 h-4" />
            <span>Iniciar Análise Live</span>
          </Button>
        )}
      </div>

      {/* Resultados da análise */}
      {currentAnalysis && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50 pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Resultados da Análise</span>
              <Badge variant={currentAnalysis.confidence > 75 ? "default" : "outline"}>
                {Math.round(currentAnalysis.confidence)}% confiança
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {/* Tendência e Sinais */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Tendência: {currentAnalysis.trend}
              </Badge>
              
              {currentAnalysis.signals.map((signal, idx) => (
                <Badge 
                  key={idx}
                  variant={signal.type === 'Buy' ? "default" : "destructive"}
                  className="text-xs"
                >
                  {signal.type}: {Math.round(signal.strength)}%
                </Badge>
              ))}
            </div>
            
            {/* Padrões detectados */}
            {currentAnalysis.patterns && currentAnalysis.patterns.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Padrões Detectados:</div>
                <div className="grid grid-cols-2 gap-2">
                  {currentAnalysis.patterns.map((pattern, idx) => (
                    <div 
                      key={idx}
                      className={`text-xs p-2 rounded-md ${
                        pattern.action === 'compra' ? 'bg-green-100 dark:bg-green-900/30' : 
                        pattern.action === 'venda' ? 'bg-red-100 dark:bg-red-900/30' : 
                        'bg-gray-100 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="font-medium">{pattern.type}</div>
                      <div className="text-muted-foreground">
                        {pattern.action.toUpperCase()} ({Math.round(pattern.confidence * 100)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Contexto de mercado */}
            {currentAnalysis.marketContext && (
              <div className="text-xs space-y-1">
                <div className="text-sm font-medium">Contexto de Mercado:</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    Fase: {currentAnalysis.marketContext.phase}
                  </Badge>
                  <Badge variant="outline">
                    Sentimento: {currentAnalysis.marketContext.sentiment}
                  </Badge>
                  <Badge variant="outline">
                    Força: {currentAnalysis.marketContext.strength}
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Recomendações de entrada */}
            {currentAnalysis.entryRecommendations && currentAnalysis.entryRecommendations.length > 0 && (
              <div className="space-y-1 mt-2">
                <div className="text-sm font-medium">Recomendações de Entrada:</div>
                {currentAnalysis.entryRecommendations.map((entry, idx) => (
                  <div 
                    key={idx}
                    className={`text-xs p-2 rounded-md ${
                      entry.action === 'compra' ? 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500' : 
                      'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500'
                    }`}
                  >
                    <div className="font-medium">
                      {entry.action === 'compra' ? 'COMPRA' : 'VENDA'} ({Math.round(entry.confidence * 100)}%)
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      <div>Entrada: {entry.entryPrice.toFixed(2)}</div>
                      <div>SL: {entry.stopLoss.toFixed(2)}</div>
                      <div>TP: {entry.takeProfit.toFixed(2)}</div>
                    </div>
                    <div className="mt-1 text-muted-foreground">{entry.reasoning}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveAnalysis;
