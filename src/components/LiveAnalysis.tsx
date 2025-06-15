import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Camera, Play, Pause, Settings, AlertTriangle, Activity, TrendingUp, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { enhanceImageForAnalysis } from '@/utils/imagePreProcessing';
import { analyzeChart } from '@/utils/patternDetection';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { validateTemporalEntry, calculateEntryTiming, TemporalValidation } from '@/utils/temporalEntryValidation';
import { trackAllAnalysisComponents, logAnalysisDecision, FinalDecision } from '@/utils/analysisTracker';
import { LiveAnalysisResult as LiveAnalysisType } from '@/utils/analysis/types';
import AutoCaptureControls from './AutoCaptureControls';

const LiveAnalysis = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(3000);
  const [liveResults, setLiveResults] = useState<LiveAnalysisType[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<LiveAnalysisType | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('camera');

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

  // Iniciar câmera com tratamento de erro melhorado
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
        console.log('✅ Câmera iniciada com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao acessar câmera:', error);
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
    try {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        console.log('📹 Câmera parada');
      }
    } catch (error) {
      console.error('❌ Erro ao parar câmera:', error);
    }
  };

  // Capturar e analisar com sistema inteligente
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) {
      console.log('⏭️ Pulando análise - condições não atendidas');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisStatus('Capturando frame...');
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Verificar se o video está pronto
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('⚠️ Video não está pronto ainda');
        setAnalysisStatus('Aguardando câmera...');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('❌ Falha ao obter contexto do canvas');
        return;
      }
      
      // Capturar frame atual
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Converter para base64
      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      setAnalysisStatus('Processando imagem...');
      const enhancedImageUrl = await enhanceImageForAnalysis(imageUrl);
      
      setAnalysisStatus('Analisando com IA...');
      
      // USAR NOVO SISTEMA INTELIGENTE
      const analysisResult = await analyzeChart(enhancedImageUrl, {
        timeframe: '1m',
        optimizeForScalping: true,
        scalpingStrategy,
        considerVolume,
        considerVolatility,
        marketContextEnabled: true,
        marketAnalysisDepth,
        enableCandleDetection: true,
        isLiveAnalysis: true,
        useConfluences: true,
        enablePriceAction: true,
        enableMarketContext: true,
        enableIntelligentAnalysis: true
      });

      // Extrair análise inteligente
      const intelligentData = analysisResult.intelligentAnalysis;
      
      let mainSignal: 'compra' | 'venda' | 'neutro' = 'neutro';
      let finalConfidence = 0;
      let signalQuality = 'fraca';
      let contextualInfo: string[] = [];

      if (intelligentData) {
        mainSignal = intelligentData.overallSignal;
        finalConfidence = intelligentData.confidence / 100;
        
        // Determinar qualidade baseada na análise inteligente
        if (intelligentData.confidence > 85) signalQuality = 'excelente';
        else if (intelligentData.confidence > 75) signalQuality = 'forte';
        else if (intelligentData.confidence > 65) signalQuality = 'boa';
        else if (intelligentData.confidence > 55) signalQuality = 'moderada';
        
        // Adicionar informações contextuais
        contextualInfo = intelligentData.reasoning || [];
        
        console.log('🧠 Análise Inteligente:', {
          signal: mainSignal,
          confidence: intelligentData.confidence,
          patterns: intelligentData.patterns.length,
          context: intelligentData.marketContext.phase
        });
      } else {
        // Fallback para análise tradicional
        const validPatterns = analysisResult.patterns.filter(p => p.action !== 'neutro');
        
        if (validPatterns.length > 0) {
          const actions = validPatterns.map(p => p.action);
          const uniqueActions = [...new Set(actions)];
          
          if (uniqueActions.length === 1) {
            mainSignal = uniqueActions[0] as 'compra' | 'venda';
          } else {
            const strongestPattern = validPatterns.reduce((prev, current) => 
              (current.confidence > prev.confidence) ? current : prev
            );
            mainSignal = strongestPattern.action as 'compra' | 'venda';
          }
          
          finalConfidence = validPatterns.reduce((sum, p) => sum + p.confidence, 0) / validPatterns.length;
        }
      }

      // Validação temporal (mantida)
      let temporalValidation: TemporalValidation | undefined;
      if (mainSignal !== 'neutro') {
        const entryTiming = calculateEntryTiming();
        
        temporalValidation = validateTemporalEntry(
          analysisResult.candles,
          mainSignal,
          finalConfidence,
          entryTiming
        );
      }

      // Tracking inteligente (mantido)
      const mockAnalysisForTracker = {
        ...analysisResult,
        timestamp: Date.now()
      };
      
      const intelligentDecision: FinalDecision = trackAllAnalysisComponents(
        mockAnalysisForTracker,
        temporalValidation
      );

      logAnalysisDecision(intelligentDecision);

      // Aplicar decisão final do tracking
      if (!intelligentDecision.shouldTrade) {
        mainSignal = 'neutro';
        finalConfidence = 0;
      }

      let mappedTrend: 'alta' | 'baixa' | 'lateral' = 'lateral';
      if (intelligentData?.marketContext?.trend) {
        mappedTrend = intelligentData.marketContext.trend;
      } else if (analysisResult.detailedMarketContext?.trend) {
        const rawTrend = analysisResult.detailedMarketContext.trend;
        if (rawTrend === 'alta') mappedTrend = 'alta';
        else if (rawTrend === 'baixa') mappedTrend = 'baixa';
      }

      const analysisHealth = {
        consistency: Math.round(intelligentDecision.qualityScore),
        reliability: Math.round(finalConfidence * 100),
        marketAlignment: intelligentDecision.shouldTrade
      };

      const liveResult: LiveAnalysisType = {
        timestamp: Date.now(),
        confidence: finalConfidence,
        signal: mainSignal,
        patterns: intelligentData?.patterns?.map(p => p.pattern) || 
                 analysisResult.patterns.map(p => p.type),
        trend: mappedTrend,
        signalQuality,
        confluenceScore: analysisResult.confluences?.confluenceScore || 0,
        supportResistance: intelligentData?.keyLevels?.support?.map(price => ({ price, type: 'support' })) || 
                          analysisResult.confluences?.supportResistance?.slice(0, 3) || [],
        criticalLevels: intelligentData?.keyLevels?.resistance?.map(price => ({ price, type: 'resistance' })) ||
                       analysisResult.confluences?.criticalLevels || [],
        priceActionSignals: analysisResult.priceActionSignals?.slice(0, 2) || [],
        marketPhase: intelligentData?.marketContext?.phase || 
                    analysisResult.detailedMarketContext?.phase || 'indefinida',
        institutionalBias: analysisResult.detailedMarketContext?.institutionalBias || 'neutro',
        entryRecommendations: analysisResult.entryRecommendations?.filter(entry => 
          entry.action === mainSignal
        ).slice(0, 2) || [],
        riskReward: 2.0,
        analysisHealth,
        temporalValidation,
        contextualInfo: contextualInfo.slice(0, 3)
      };

      setCurrentAnalysis(liveResult);
      setLiveResults(prev => [liveResult, ...prev.slice(0, 19)]);
      setAnalysisStatus(null);

      // Toast para operações aprovadas
      if (intelligentDecision.shouldTrade && finalConfidence > 0.6 && mainSignal !== 'neutro') {
        const healthText = analysisHealth.consistency > 80 ? ' ✅' : ' ⚠️';
        const temporalText = temporalValidation ? 
          ` | Expira: ${temporalValidation.expiryCandle === 'current' ? 'Atual' : 'Próxima'}` : '';
        const contextText = contextualInfo.length > 0 ? ` | ${contextualInfo[0]}` : '';
        
        toast({
          variant: mainSignal === 'compra' ? "default" : "destructive",
          title: `🚨 ENTRADA M1 - ${mainSignal.toUpperCase()}${healthText}`,
          description: `Confiança: ${Math.round(finalConfidence * 100)}%${temporalText}${contextText}`,
          duration: 10000,
        });
      }

      console.log(`✅ Análise inteligente concluída - Sinal: ${mainSignal} (${Math.round(finalConfidence * 100)}%)`);

    } catch (error) {
      console.error('❌ Erro na análise:', error);
      setAnalysisStatus('Erro na análise');
      
      setTimeout(() => setAnalysisStatus(null), 3000);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, scalpingStrategy, considerVolume, considerVolatility, marketContextEnabled, marketAnalysisDepth, toast]);

  // Iniciar análise live
  const startLiveAnalysis = async () => {
    try {
      await startCamera();
      setIsLiveActive(true);
      
      // Aguardar câmera inicializar
      setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(captureAndAnalyze, analysisInterval);
        console.log(`🎬 Análise live iniciada - intervalo: ${analysisInterval}ms`);
      }, 2000);

      toast({
        variant: "default",
        title: "✅ Análise Live Iniciada",
        description: `Analisando gráficos a cada ${analysisInterval / 1000} segundos`,
      });
    } catch (error) {
      console.error('❌ Erro ao iniciar análise live:', error);
      setIsLiveActive(false);
    }
  };

  // Parar análise live
  const stopLiveAnalysis = () => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setIsLiveActive(false);
      stopCamera();
      setCurrentAnalysis(null);
      setAnalysisStatus(null);

      toast({
        variant: "default",
        title: "⏹️ Análise Live Parada",
        description: "Análise em tempo real foi interrompida",
      });
      
      console.log('⏹️ Análise live parada');
    } catch (error) {
      console.error('❌ Erro ao parar análise:', error);
    }
  };

  // Alternar câmera
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
      setTimeout(() => startLiveAnalysis(), 1000);
    }
  }, [facingMode]);

  return (
    <div className="w-full space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Câmera Manual
          </TabsTrigger>
          <TabsTrigger value="auto" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Captura Automática
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camera" className="space-y-4">
          {/* Controles da Câmera */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                Análise Live M1 - Câmera
                {isLiveActive && (
                  <Badge variant="default" className="ml-2 animate-pulse">
                    AO VIVO
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {!isLiveActive ? (
                  <Button onClick={startLiveAnalysis} className="gap-2">
                    <Play className="w-4 h-4" />
                    Iniciar Live
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
                  <option value={2000}>2 segundos</option>
                  <option value={3000}>3 segundos</option>
                  <option value={5000}>5 segundos</option>
                </select>
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

          {/* Video feed */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              muted 
              className="w-full h-full object-cover"
            />
            
            {/* Overlay de status */}
            {(isAnalyzing || analysisStatus) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-white text-center">
                  <Activity className="animate-spin h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">
                    {analysisStatus || 'Analisando...'}
                  </p>
                </div>
              </div>
            )}

            {/* Resultado da análise com informações contextuais */}
            {currentAnalysis && !isAnalyzing && (
              <motion.div 
                className="absolute top-4 left-4 right-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-black/90 border-amber-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between text-white mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={currentAnalysis.signal === 'compra' ? 'default' : 
                                   currentAnalysis.signal === 'venda' ? 'destructive' : 'outline'}
                          >
                            {currentAnalysis.signal.toUpperCase()}
                          </Badge>
                          {currentAnalysis.signalQuality && (
                            <Badge variant="outline" className="text-xs">
                              {currentAnalysis.signalQuality}
                            </Badge>
                          )}
                          {currentAnalysis.temporalValidation && (
                            <Badge 
                              variant={currentAnalysis.temporalValidation.recommendation === 'enter' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {currentAnalysis.temporalValidation.recommendation === 'enter' ? '✅' : '⏳'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs">
                          Confiança: {Math.round(currentAnalysis.confidence * 100)}%
                        </p>
                        <p className="text-xs text-green-300">
                          R:R {currentAnalysis.riskReward?.toFixed(1) || '2.0'}
                        </p>
                        {/* Mostrar informação contextual */}
                        {currentAnalysis.contextualInfo && currentAnalysis.contextualInfo.length > 0 && (
                          <p className="text-xs text-yellow-300 mt-1">
                            💡 {currentAnalysis.contextualInfo[0]}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-yellow-300">
                          Fase: {currentAnalysis.marketPhase}
                        </div>
                        <div className="text-gray-300">
                          {new Date(currentAnalysis.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Histórico da Câmera */}
          {liveResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Histórico de Sinais - Câmera</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {liveResults.slice(0, 10).map((result) => (
                    <div
                      key={result.timestamp}
                      className="flex items-center justify-between p-2 border rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={result.signal === 'compra' ? 'default' : 
                                   result.signal === 'venda' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {result.signal}
                        </Badge>
                        <span className="text-xs">
                          {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="auto" className="space-y-4">
          <AutoCaptureControls />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveAnalysis;
