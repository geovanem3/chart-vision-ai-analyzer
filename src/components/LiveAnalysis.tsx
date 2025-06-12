import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Camera, Play, Pause, Settings, AlertTriangle, Activity, TrendingUp, Eye, Clock, Filter } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { enhanceImageForAnalysis } from '@/utils/imagePreProcessing';
import { analyzeChart } from '@/utils/patternDetection';
import { analyzeChartPixels, type ChartPixelAnalysis } from '@/utils/chartPixelAnalysis';
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
  chartAnalysisQuality?: 'excelente' | 'boa' | 'regular' | 'ruim' | 'nao_detectado';
  visualConfirmation?: boolean;
  executionWindow?: number;
  signalStrength?: 'muito_forte' | 'forte' | 'moderada' | 'fraca';
  pixelAnalysis?: ChartPixelAnalysis;
}

const LiveAnalysis = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(8000); // Aumentado para 8 segundos para análise mais rigorosa
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
  const [lastSignalType, setLastSignalType] = useState<'compra' | 'venda' | null>(null);
  const [analysisCount, setAnalysisCount] = useState<number>(0);
  const [chartDetectionEnabled, setChartDetectionEnabled] = useState(true);
  const [signalCooldown, setSignalCooldown] = useState(90000); // Aumentado para 90 segundos
  const [minSignalQuality, setMinSignalQuality] = useState<'muito_forte'>('muito_forte'); // Apenas sinais muito fortes
  const [consecutiveNoChartCount, setConsecutiveNoChartCount] = useState(0);
  const [pixelAnalysisHistory, setPixelAnalysisHistory] = useState<ChartPixelAnalysis[]>([]);

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

  // Função ultra-rigorosa para detectar gráfico com análise de pixels
  const detectChartWithPixelAnalysis = (canvas: HTMLCanvasElement): ChartPixelAnalysis => {
    console.log(`[PIXEL DETECTION] Iniciando análise rigorosa de pixels`);
    
    const pixelAnalysis = analyzeChartPixels(canvas);
    
    console.log(`[PIXEL DETECTION] Resultado:`, {
      qualidade: pixelAnalysis.chartQuality,
      confiança: pixelAnalysis.confidence,
      candles: pixelAnalysis.candleDetection.count,
      grid: `${pixelAnalysis.gridDetection.horizontalLines}H/${pixelAnalysis.gridDetection.verticalLines}V`,
      cores: `Verde:${pixelAnalysis.colorAnalysis.hasGreenCandles} Vermelho:${pixelAnalysis.colorAnalysis.hasRedCandles}`
    });
    
    return pixelAnalysis;
  };

  // Função para validar qualidade do sinal com base na análise de pixels
  const validateSignalQualityWithPixels = (
    analysisResult: any, 
    pixelAnalysis: ChartPixelAnalysis
  ): {
    isValid: boolean;
    signalStrength: 'muito_forte' | 'forte' | 'moderada' | 'fraca';
    executionWindow: number;
    reasons: string[];
  } => {
    const reasons: string[] = [];
    let score = 0;
    
    // CRITÉRIO 1: Qualidade da detecção de pixels (peso 40%)
    if (pixelAnalysis.chartQuality === 'excelente') {
      score += 40;
      reasons.push(`✅ Gráfico detectado com excelente qualidade (${pixelAnalysis.confidence}%)`);
    } else if (pixelAnalysis.chartQuality === 'boa') {
      score += 30;
      reasons.push(`✅ Gráfico detectado com boa qualidade (${pixelAnalysis.confidence}%)`);
    } else if (pixelAnalysis.chartQuality === 'regular') {
      score += 15;
      reasons.push(`⚠️ Qualidade do gráfico regular (${pixelAnalysis.confidence}%)`);
    } else {
      reasons.push(`❌ Qualidade insuficiente: ${pixelAnalysis.chartQuality} (${pixelAnalysis.confidence}%)`);
      return { isValid: false, signalStrength: 'fraca', executionWindow: 0, reasons };
    }
    
    // CRITÉRIO 2: Detecção de candles (peso 25%)
    if (pixelAnalysis.candleDetection.quality === 'alta' && pixelAnalysis.candleDetection.count >= 15) {
      score += 25;
      reasons.push(`🕯️ ${pixelAnalysis.candleDetection.count} candles detectados com alta qualidade`);
    } else if (pixelAnalysis.candleDetection.quality === 'media' && pixelAnalysis.candleDetection.count >= 8) {
      score += 15;
      reasons.push(`🕯️ ${pixelAnalysis.candleDetection.count} candles detectados com qualidade média`);
    } else {
      score += 5;
      reasons.push(`⚠️ Apenas ${pixelAnalysis.candleDetection.count} candles detectados`);
    }
    
    // CRITÉRIO 3: Grid e estrutura (peso 15%)
    if (pixelAnalysis.gridDetection.detected && 
        pixelAnalysis.gridDetection.horizontalLines >= 4 && 
        pixelAnalysis.gridDetection.verticalLines >= 4) {
      score += 15;
      reasons.push(`📊 Grid completo detectado (${pixelAnalysis.gridDetection.horizontalLines}H/${pixelAnalysis.gridDetection.verticalLines}V)`);
    } else {
      score += 5;
      reasons.push(`⚠️ Grid incompleto ou não detectado`);
    }
    
    // CRITÉRIO 4: Cores dos candles (peso 10%)
    if (pixelAnalysis.colorAnalysis.hasGreenCandles && pixelAnalysis.colorAnalysis.hasRedCandles) {
      score += 10;
      reasons.push(`🎨 Candles verdes e vermelhos detectados`);
    } else {
      score += 3;
      reasons.push(`⚠️ Cores de candles não detectadas claramente`);
    }
    
    // CRITÉRIO 5: Confluência da análise técnica (peso 10%)
    const confluenceScore = analysisResult.confluences?.confluenceScore || 0;
    if (confluenceScore > 80) {
      score += 10;
      reasons.push(`📈 Confluência técnica excelente (${Math.round(confluenceScore)}%)`);
    } else if (confluenceScore > 65) {
      score += 6;
      reasons.push(`📈 Confluência técnica boa (${Math.round(confluenceScore)}%)`);
    } else {
      score += 2;
      reasons.push(`⚠️ Confluência técnica baixa (${Math.round(confluenceScore)}%)`);
    }
    
    // Determinar força do sinal baseado no score
    let signalStrength: 'muito_forte' | 'forte' | 'moderada' | 'fraca' = 'fraca';
    let executionWindow = 30;
    
    if (score >= 90) {
      signalStrength = 'muito_forte';
      executionWindow = 120; // 2 minutos para sinais muito fortes
    } else if (score >= 75) {
      signalStrength = 'forte';
      executionWindow = 90;
    } else if (score >= 60) {
      signalStrength = 'moderada';
      executionWindow = 60;
    }
    
    // Para opções binárias, só aceitar sinais muito fortes
    const isValid = signalStrength === 'muito_forte' && 
                   pixelAnalysis.confidence >= 70 &&
                   pixelAnalysis.candleDetection.count >= 10;
    
    if (!isValid) {
      reasons.push(`🚫 Sinal rejeitado: Força ${signalStrength}, apenas sinais MUITO FORTES são aceitos para opções binárias`);
    }
    
    return { isValid, signalStrength, executionWindow, reasons };
  };

  // Capturar frame e analisar com validação ultra-rigorosa de pixels
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    const captureStartTime = Date.now();
    console.log(`[ANÁLISE RIGOROSA ${analysisCount + 1}] Iniciando análise ultra-rigorosa para opções binárias`);

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
      
      // VALIDAÇÃO 1: Análise rigorosa de pixels
      const pixelAnalysis = detectChartWithPixelAnalysis(canvas);
      setPixelAnalysisHistory(prev => [pixelAnalysis, ...prev.slice(0, 9)]);
      
      if (chartDetectionEnabled && !pixelAnalysis.hasValidChart) {
        console.log(`[ANÁLISE RIGOROSA ${analysisCount + 1}] ❌ Gráfico rejeitado - qualidade: ${pixelAnalysis.chartQuality}`);
        setConsecutiveNoChartCount(prev => prev + 1);
        
        setCurrentAnalysis({
          timestamp: captureTime,
          captureTime,
          analysisTime: Date.now(),
          confidence: 0,
          signal: 'neutro',
          patterns: [],
          trend: 'lateral',
          signalQuality: 'ruim',
          chartAnalysisQuality: pixelAnalysis.chartQuality,
          visualConfirmation: false,
          latency: Date.now() - captureStartTime,
          signalStrength: 'fraca',
          pixelAnalysis
        });
        return;
      }

      setConsecutiveNoChartCount(0);
      
      // VALIDAÇÃO 2: Controle de cooldown ultra-conservador
      const timeSinceLastSignal = captureTime - lastSignalTime;
      
      if (timeSinceLastSignal < signalCooldown) {
        console.log(`[ANÁLISE RIGOROSA ${analysisCount + 1}] ⏱️ Em cooldown - ${Math.round((signalCooldown - timeSinceLastSignal) / 1000)}s restantes`);
        return;
      }

      // Converter para base64
      const imageUrl = canvas.toDataURL('image/jpeg', 0.95); // Qualidade máxima
      
      // VALIDAÇÃO 3: Análise técnica com máxima rigorosidade
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
        sensitivity: 0.95 // Máxima sensibilidade para ser ultra-criterioso
      });

      const analysisEndTime = Date.now();
      const totalLatency = analysisEndTime - captureStartTime;
      
      // VALIDAÇÃO 4: Validar qualidade do sinal com análise de pixels
      const signalValidation = validateSignalQualityWithPixels(analysisResult, pixelAnalysis);
      
      console.log(`[ANÁLISE RIGOROSA ${analysisCount + 1}] 📊 Pixels: ${pixelAnalysis.chartQuality} | Sinal: ${signalValidation.signalStrength} | Válido: ${signalValidation.isValid}`);

      // Armazenar detalhes
      setConfluenceDetails(analysisResult.confluences);
      setPriceActionDetails({
        signals: analysisResult.priceActionSignals || [],
        marketContext: analysisResult.detailedMarketContext
      });
      setEntryRecommendations(analysisResult.entryRecommendations || []);

      // Determinar sinal final - APENAS MUITO FORTES para opções binárias
      const finalSignal = signalValidation.isValid && signalValidation.signalStrength === 'muito_forte' ? 
        (analysisResult.patterns[0]?.action || 'neutro') : 'neutro';
      
      // VALIDAÇÃO 5: Evitar sinais opostos consecutivos
      if (finalSignal !== 'neutro' && lastSignalType && finalSignal !== lastSignalType) {
        const oppositeSignalCooldown = signalCooldown * 2; // Dobro do tempo para sinais opostos
        if (timeSinceLastSignal < oppositeSignalCooldown) {
          console.log(`[ANÁLISE RIGOROSA ${analysisCount + 1}] 🚫 Bloqueando sinal oposto - cooldown estendido`);
          return;
        }
      }

      const liveResult: LiveAnalysisResult = {
        timestamp: analysisResult.timestamp,
        captureTime,
        analysisTime: analysisEndTime,
        latency: totalLatency,
        confidence: signalValidation.isValid ? (analysisResult.patterns[0]?.confidence || 0) : 0,
        signal: finalSignal,
        patterns: signalValidation.isValid ? analysisResult.patterns.map(p => p.type) : [],
        trend: analysisResult.detailedMarketContext?.marketStructure.trend || 'lateral',
        signalQuality: signalValidation.isValid ? 'excelente' : 'ruim',
        confluenceScore: analysisResult.confluences?.confluenceScore || 0,
        supportResistance: analysisResult.confluences?.supportResistance?.slice(0, 3) || [],
        criticalLevels: analysisResult.confluences?.criticalLevels || [],
        priceActionSignals: analysisResult.priceActionSignals?.slice(0, 2) || [],
        marketPhase: analysisResult.detailedMarketContext?.phase || 'indefinida',
        institutionalBias: analysisResult.detailedMarketContext?.institutionalBias || 'neutro',
        entryRecommendations: signalValidation.isValid ? (analysisResult.entryRecommendations?.slice(0, 2) || []) : [],
        riskReward: analysisResult.entryRecommendations?.[0]?.riskReward || 2.0,
        chartAnalysisQuality: pixelAnalysis.chartQuality,
        visualConfirmation: pixelAnalysis.hasValidChart,
        executionWindow: signalValidation.executionWindow,
        signalStrength: signalValidation.signalStrength,
        pixelAnalysis
      };

      setCurrentAnalysis(liveResult);
      setLiveResults(prev => [liveResult, ...prev.slice(0, 19)]);

      // NOTIFICAÇÃO: Apenas para sinais MUITO FORTES para opções binárias
      if (signalValidation.isValid && finalSignal !== 'neutro' && signalValidation.signalStrength === 'muito_forte') {
        setLastSignalTime(captureTime);
        setLastSignalType(finalSignal as 'compra' | 'venda');
        
        toast({
          variant: finalSignal === 'compra' ? "default" : "destructive",
          title: `🔥 SINAL ULTRA-FORTE - ${finalSignal.toUpperCase()} 🔥`,
          description: `⚡ EXECUTE EM ${signalValidation.executionWindow}s | Confiança: ${Math.round(liveResult.confidence * 100)}% | Confluência: ${Math.round(liveResult.confluenceScore)}% | Candles: ${pixelAnalysis.candleDetection.count}`,
          duration: signalValidation.executionWindow * 1000,
        });
        
        // Toast adicional com detalhes técnicos
        setTimeout(() => {
          toast({
            title: "📊 Detalhes da Análise",
            description: signalValidation.reasons.slice(0, 3).join(" | "),
            duration: 8000,
          });
        }, 1000);
      } else if (finalSignal === 'neutro' && pixelAnalysis.hasValidChart) {
        console.log(`[ANÁLISE RIGOROSA ${analysisCount + 1}] ⚪ Gráfico válido mas sem sinal forte suficiente`);
      }

    } catch (error) {
      console.error('Erro na análise ultra-rigorosa:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, analysisCount, chartDetectionEnabled, lastSignalTime, lastSignalType, signalCooldown, minSignalQuality, scalpingStrategy, considerVolume, considerVolatility, marketContextEnabled, marketAnalysisDepth, toast]);

  // Iniciar análise em tempo real
  const startLiveAnalysis = async () => {
    await startCamera();
    setIsLiveActive(true);
    setLastSignalTime(0); // Reset completo
    setLastSignalType(null);
    setConsecutiveNoChartCount(0);
    
    setTimeout(() => {
      console.log(`[TIMING] Iniciando análise rigorosa com intervalo de ${analysisInterval}ms`);
      intervalRef.current = setInterval(captureAndAnalyze, analysisInterval);
    }, 1000);

    toast({
      variant: "default",
      title: "🎯 Análise Rigorosa Iniciada",
      description: `Filtro: ${minSignalQuality} | Cooldown: ${signalCooldown/1000}s | Qualidade: ${chartDetectionEnabled ? 'ON' : 'OFF'}`,
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
    setLastSignalTime(0);
    setLastSignalType(null);

    toast({
      variant: "default",
      title: "⏹️ Análise Parada",
      description: "Sistema resetado e pronto para nova sessão",
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
      {/* Cabeçalho com controles ultra-rigorosos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" />
            Análise M1 Ultra-Rigorosa para Opções Binárias
            {isLiveActive && (
              <Badge variant="default" className="ml-2 animate-pulse">
                AO VIVO
              </Badge>
            )}
            {currentAnalysis?.signalStrength === 'muito_forte' && (
              <Badge variant="default" className="ml-2 text-xs bg-red-600">
                🔥 ULTRA-FORTE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {!isLiveActive ? (
              <Button onClick={startLiveAnalysis} className="gap-2">
                <Play className="w-4 h-4" />
                Iniciar Análise Rigorosa
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
              <option value={8000}>8s (ULTRA-RIGOROSO)</option>
              <option value={10000}>10s (SUPER-CONSERVADOR)</option>
              <option value={15000}>15s (MÁXIMA PRECISÃO)</option>
              <option value={20000}>20s (SUPER-SELETIVO)</option>
            </select>

            <select 
              value={signalCooldown} 
              onChange={(e) => setSignalCooldown(Number(e.target.value))}
              disabled={isLiveActive}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value={90000}>90s Cooldown (PADRÃO)</option>
              <option value={120000}>120s Cooldown (CONSERVADOR)</option>
              <option value={180000}>180s Cooldown (ULTRA-SELETIVO)</option>
              <option value={300000}>300s Cooldown (MÁXIMA PRECISÃO)</option>
            </select>

            <Badge variant="secondary" className="text-xs">
              APENAS SINAIS ULTRA-FORTES
            </Badge>

            <Button
              variant={chartDetectionEnabled ? "default" : "outline"}
              onClick={() => setChartDetectionEnabled(!chartDetectionEnabled)}
              className="gap-2 text-xs"
            >
              <Eye className="w-3 h-3" />
              {chartDetectionEnabled ? 'Detecção ON' : 'Detecção OFF'}
            </Button>
          </div>
          
          {/* Status detalhado com informações de pixels */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground">
            <div>Análises: {analysisCount}</div>
            <div>Último sinal: {lastSignalTime > 0 ? new Date(lastSignalTime).toLocaleTimeString() : 'Nenhum'}</div>
            <div>Cooldown: {signalCooldown / 1000}s</div>
            <div>Qualidade: {currentAnalysis?.pixelAnalysis?.chartQuality || 'N/A'}</div>
            <div>Candles: {currentAnalysis?.pixelAnalysis?.candleDetection.count || 0}</div>
          </div>
          
          {/* Análise de pixels em tempo real */}
          {currentAnalysis?.pixelAnalysis && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
              <div className="flex items-center gap-4">
                <span>🎯 Confiança: {currentAnalysis.pixelAnalysis.confidence}%</span>
                <span>🕯️ Candles: {currentAnalysis.pixelAnalysis.candleDetection.count} ({currentAnalysis.pixelAnalysis.candleDetection.quality})</span>
                <span>📊 Grid: {currentAnalysis.pixelAnalysis.gridDetection.horizontalLines}H/{currentAnalysis.pixelAnalysis.gridDetection.verticalLines}V</span>
                <span>🎨 Cores: {currentAnalysis.pixelAnalysis.colorAnalysis.hasGreenCandles ? '✅' : '❌'}G {currentAnalysis.pixelAnalysis.colorAnalysis.hasRedCandles ? '✅' : '❌'}R</span>
              </div>
            </div>
          )}
          
          {/* Contador de cooldown */}
          {isLiveActive && lastSignalTime > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>Próximo sinal em: {Math.max(0, Math.ceil((signalCooldown - (Date.now() - lastSignalTime)) / 1000)}s</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Erro da câmera */}
      {cameraError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      )}

      {/* Aviso sobre detecção consecutiva */}
      {consecutiveNoChartCount > 3 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Gráfico não detectado em {consecutiveNoChartCount} análises consecutivas. 
            Posicione a câmera melhor no gráfico ou ajuste a iluminação.
          </AlertDescription>
        </Alert>
      )}

      {/* Video feed com overlay melhorado para análise de pixels */}
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
              <p className="text-sm">Analisando pixels do gráfico...</p>
              <p className="text-xs text-gray-300">Análise #{analysisCount} - Ultra-rigorosa</p>
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
            <Card className="bg-black/95 border-amber-200">
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
                      {currentAnalysis.signalStrength === 'muito_forte' && (
                        <Badge variant="default" className="text-xs bg-red-600 animate-pulse">
                          🔥 ULTRA-FORTE
                        </Badge>
                      )}
                      <Badge 
                        variant={currentAnalysis.visualConfirmation ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {currentAnalysis.pixelAnalysis?.candleDetection.count || 0} CANDLES
                      </Badge>
                      {currentAnalysis.executionWindow && currentAnalysis.signal !== 'neutro' && (
                        <Badge variant="outline" className="text-xs animate-pulse">
                          ⏱️ {currentAnalysis.executionWindow}s
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs">
                      Pixels: {Math.round(currentAnalysis.pixelAnalysis?.confidence || 0)}% | 
                      Confluência: {Math.round(currentAnalysis.confluenceScore || 0)}% |
                      Qualidade: {currentAnalysis.pixelAnalysis?.chartQuality}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-yellow-300">
                      Grid: {currentAnalysis.pixelAnalysis?.gridDetection.horizontalLines}H/{currentAnalysis.pixelAnalysis?.gridDetection.verticalLines}V
                    </div>
                    <div className="text-xs text-blue-300">
                      Fase: {currentAnalysis.marketPhase}
                    </div>
                    <div className="text-xs text-gray-300">
                      #{analysisCount}
                    </div>
                  </div>
                </div>
                
                {/* Janela de execução para sinais ultra-fortes */}
                {currentAnalysis.executionWindow && currentAnalysis.signal !== 'neutro' && currentAnalysis.signalStrength === 'muito_forte' && (
                  <div className="text-xs text-red-400 mb-1 font-bold animate-pulse">
                    🔥 EXECUTE AGORA - {currentAnalysis.executionWindow} SEGUNDOS! 🔥
                  </div>
                )}
                
                {/* Recomendações da análise de pixels */}
                {currentAnalysis.pixelAnalysis?.recommendations && currentAnalysis.pixelAnalysis.recommendations.length > 0 && (
                  <div className="text-xs text-orange-300 mb-1">
                    💡 {currentAnalysis.pixelAnalysis.recommendations[0]}
                  </div>
                )}
                
                {/* Price Action Signals */}
                {currentAnalysis.priceActionSignals && currentAnalysis.priceActionSignals.length > 0 && (
                  <div className="text-xs text-purple-300 mb-1">
                    PA: {currentAnalysis.priceActionSignals.map((pa: any) => pa.type).join(', ')}
                  </div>
                )}
                
                {/* Entry Recommendations */}
                {currentAnalysis.entryRecommendations && currentAnalysis.entryRecommendations.length > 0 && (
                  <div className="text-xs text-green-400">
                    📍 {currentAnalysis.entryRecommendations[0].entryPrice?.toFixed(4)} | 
                    🛑 {currentAnalysis.entryRecommendations[0].stopLoss?.toFixed(4)} | 
                    🎯 {currentAnalysis.entryRecommendations[0].takeProfit?.toFixed(4)}
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
