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
  executionWindow?: number; // Tempo em segundos para executar o sinal
  signalStrength?: 'muito_forte' | 'forte' | 'moderada' | 'fraca';
}

const LiveAnalysis = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(5000); // Aumentado para 5 segundos
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
  const [signalCooldown, setSignalCooldown] = useState(60000); // 60 segundos de cooldown
  const [minSignalQuality, setMinSignalQuality] = useState<'forte' | 'muito_forte'>('forte');
  const [consecutiveNoChartCount, setConsecutiveNoChartCount] = useState(0);

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

  // Função melhorada para detectar gráfico com mais precisão
  const detectChartInImage = (canvas: HTMLCanvasElement): { 
    hasChart: boolean; 
    quality: 'excelente' | 'boa' | 'regular' | 'ruim';
    confidence: number;
  } => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { hasChart: false, quality: 'ruim', confidence: 0 };

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let linePixels = 0;
    let colorVariations = new Set<string>();
    let contrastCount = 0;
    let horizontalLines = 0;
    let verticalLines = 0;
    
    // Analisar pixels para detectar padrões de gráfico
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Detectar variações de cor (indicativo de dados visuais)
      const colorKey = `${Math.floor(r/15)}-${Math.floor(g/15)}-${Math.floor(b/15)}`;
      colorVariations.add(colorKey);
      
      // Detectar contrastes (bordas de candles, linhas)
      if (i > 4) {
        const prevR = data[i - 4];
        const prevG = data[i - 3];
        const prevB = data[i - 2];
        
        const contrast = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
        if (contrast > 80) contrastCount++;
      }
    }
    
    // Detectar linhas horizontais e verticais (grid do gráfico)
    const width = canvas.width;
    const height = canvas.height;
    
    // Verificar linhas horizontais a cada 10% da altura
    for (let y = Math.floor(height * 0.1); y < height; y += Math.floor(height * 0.1)) {
      let linePixelCount = 0;
      for (let x = 0; x < width; x += 5) {
        const pixelIndex = (y * width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        // Detectar pixels que podem ser parte de uma linha
        if (r + g + b < 600) { // Pixels mais escuros
          linePixelCount++;
        }
      }
      if (linePixelCount > width * 0.3) horizontalLines++;
    }
    
    // Verificar linhas verticais a cada 10% da largura
    for (let x = Math.floor(width * 0.1); x < width; x += Math.floor(width * 0.1)) {
      let linePixelCount = 0;
      for (let y = 0; y < height; y += 5) {
        const pixelIndex = (y * width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        if (r + g + b < 600) {
          linePixelCount++;
        }
      }
      if (linePixelCount > height * 0.3) verticalLines++;
    }
    
    const totalPixels = data.length / 4;
    const colorDiversity = colorVariations.size;
    const contrastRatio = contrastCount / totalPixels;
    const gridLinesRatio = (horizontalLines + verticalLines) / 20; // Máximo esperado de 20 linhas
    
    // Critérios mais rigorosos para detectar gráfico
    const hasChart = colorDiversity > 80 && contrastRatio > 0.025 && gridLinesRatio > 0.2;
    
    // Calcular confiança baseada em múltiplos fatores
    let confidence = 0;
    confidence += Math.min(50, colorDiversity * 0.5); // Máximo 50 pontos
    confidence += Math.min(25, contrastRatio * 1000); // Máximo 25 pontos  
    confidence += Math.min(25, gridLinesRatio * 125); // Máximo 25 pontos
    
    let quality: 'excelente' | 'boa' | 'regular' | 'ruim' = 'ruim';
    if (hasChart) {
      if (confidence > 85) quality = 'excelente';
      else if (confidence > 70) quality = 'boa';
      else if (confidence > 50) quality = 'regular';
    }
    
    return { hasChart, quality, confidence };
  };

  // Função para validar qualidade do sinal
  const validateSignalQuality = (
    analysisResult: any, 
    chartQuality: 'excelente' | 'boa' | 'regular' | 'ruim'
  ): {
    isValid: boolean;
    signalStrength: 'muito_forte' | 'forte' | 'moderada' | 'fraca';
    executionWindow: number;
    reasons: string[];
  } => {
    const reasons: string[] = [];
    let score = 0;
    
    // Critério 1: Qualidade do gráfico detectado
    if (chartQuality === 'excelente') {
      score += 25;
      reasons.push('Gráfico detectado com excelente qualidade');
    } else if (chartQuality === 'boa') {
      score += 20;
      reasons.push('Gráfico detectado com boa qualidade');
    } else if (chartQuality === 'regular') {
      score += 10;
      reasons.push('Gráfico detectado com qualidade regular');
    } else {
      return { isValid: false, signalStrength: 'fraca', executionWindow: 0, reasons: ['Qualidade do gráfico insuficiente'] };
    }
    
    // Critério 2: Confluência de múltiplos fatores
    const hasValidPattern = analysisResult.patterns.length > 0 && analysisResult.patterns[0].action !== 'neutro';
    const hasGoodConfluence = (analysisResult.confluences?.confluenceScore || 0) > 65;
    const hasStrongPriceAction = (analysisResult.priceActionSignals?.length || 0) > 0;
    const hasValidEntry = (analysisResult.entryRecommendations?.length || 0) > 0;
    
    const confluenceCount = [hasValidPattern, hasGoodConfluence, hasStrongPriceAction, hasValidEntry].filter(Boolean).length;
    
    if (confluenceCount >= 3) {
      score += 30;
      reasons.push(`Confluência excelente (${confluenceCount}/4 critérios)`);
    } else if (confluenceCount >= 2) {
      score += 20;
      reasons.push(`Confluência boa (${confluenceCount}/4 critérios)`);
    } else {
      score += 5;
      reasons.push(`Confluência fraca (${confluenceCount}/4 critérios)`);
    }
    
    // Critério 3: Confiança do padrão principal
    const mainPatternConfidence = analysisResult.patterns[0]?.confidence || 0;
    if (mainPatternConfidence > 0.8) {
      score += 25;
      reasons.push(`Padrão com alta confiança (${Math.round(mainPatternConfidence * 100)}%)`);
    } else if (mainPatternConfidence > 0.65) {
      score += 15;
      reasons.push(`Padrão com boa confiança (${Math.round(mainPatternConfidence * 100)}%)`);
    } else {
      score += 5;
      reasons.push(`Padrão com baixa confiança (${Math.round(mainPatternConfidence * 100)}%)`);
    }
    
    // Critério 4: Score de confluência técnica
    const confluenceScore = analysisResult.confluences?.confluenceScore || 0;
    if (confluenceScore > 75) {
      score += 20;
      reasons.push(`Score de confluência alto (${Math.round(confluenceScore)}%)`);
    } else if (confluenceScore > 60) {
      score += 10;
      reasons.push(`Score de confluência moderado (${Math.round(confluenceScore)}%)`);
    }
    
    // Determinar força do sinal e janela de execução
    let signalStrength: 'muito_forte' | 'forte' | 'moderada' | 'fraca' = 'fraca';
    let executionWindow = 30; // segundos padrão
    
    if (score >= 90) {
      signalStrength = 'muito_forte';
      executionWindow = 90; // 1.5 minutos para sinais muito fortes
    } else if (score >= 75) {
      signalStrength = 'forte';
      executionWindow = 60; // 1 minuto para sinais fortes
    } else if (score >= 60) {
      signalStrength = 'moderada';
      executionWindow = 45; // 45 segundos para sinais moderados
    }
    
    // Aplicar filtro de qualidade mínima
    const isValid = (minSignalQuality === 'muito_forte' && signalStrength === 'muito_forte') ||
                   (minSignalQuality === 'forte' && ['muito_forte', 'forte'].includes(signalStrength));
    
    return { isValid, signalStrength, executionWindow, reasons };
  };

  // Capturar frame e analisar com validação super rigorosa
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    const captureStartTime = Date.now();
    console.log(`[ANÁLISE ${analysisCount + 1}] Iniciando análise rigorosa`);

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
      
      // VALIDAÇÃO 1: Detectar qualidade do gráfico
      const chartDetection = detectChartInImage(canvas);
      
      if (chartDetectionEnabled && !chartDetection.hasChart) {
        console.log(`[ANÁLISE ${analysisCount + 1}] Gráfico não detectado - confiança: ${chartDetection.confidence.toFixed(1)}%`);
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
          chartAnalysisQuality: chartDetection.quality,
          visualConfirmation: false,
          latency: Date.now() - captureStartTime,
          signalStrength: 'fraca'
        });
        return;
      }

      setConsecutiveNoChartCount(0);
      
      // VALIDAÇÃO 2: Controle de cooldown inteligente
      const timeSinceLastSignal = captureTime - lastSignalTime;
      
      if (timeSinceLastSignal < signalCooldown) {
        console.log(`[ANÁLISE ${analysisCount + 1}] Em cooldown - ${Math.round((signalCooldown - timeSinceLastSignal) / 1000)}s restantes`);
        return;
      }

      // Converter para base64
      const imageUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      // Analisar com máxima rigorosidade
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
        sensitivity: 0.9 // Máxima sensibilidade para ser ultra-criterioso
      });

      const analysisEndTime = Date.now();
      const totalLatency = analysisEndTime - captureStartTime;
      
      // VALIDAÇÃO 3: Validar qualidade do sinal
      const signalValidation = validateSignalQuality(analysisResult, chartDetection.quality);
      
      console.log(`[ANÁLISE ${analysisCount + 1}] Gráfico: ${chartDetection.quality} | Sinal: ${signalValidation.signalStrength} | Válido: ${signalValidation.isValid}`);

      // Armazenar detalhes
      setConfluenceDetails(analysisResult.confluences);
      setPriceActionDetails({
        signals: analysisResult.priceActionSignals || [],
        marketContext: analysisResult.detailedMarketContext
      });
      setEntryRecommendations(analysisResult.entryRecommendations || []);

      // Determinar sinal final
      const finalSignal = signalValidation.isValid ? 
        (analysisResult.patterns[0]?.action || 'neutro') : 'neutro';
      
      // VALIDAÇÃO 4: Evitar sinais opostos muito próximos
      if (finalSignal !== 'neutro' && lastSignalType && finalSignal !== lastSignalType) {
        const oppositeSignalCooldown = signalCooldown * 1.5; // 50% mais tempo para sinais opostos
        if (timeSinceLastSignal < oppositeSignalCooldown) {
          console.log(`[ANÁLISE ${analysisCount + 1}] Bloqueando sinal oposto - cooldown estendido`);
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
        signalQuality: signalValidation.isValid ? 'boa' : 'ruim',
        confluenceScore: analysisResult.confluences?.confluenceScore || 0,
        supportResistance: analysisResult.confluences?.supportResistance?.slice(0, 3) || [],
        criticalLevels: analysisResult.confluences?.criticalLevels || [],
        priceActionSignals: analysisResult.priceActionSignals?.slice(0, 2) || [],
        marketPhase: analysisResult.detailedMarketContext?.phase || 'indefinida',
        institutionalBias: analysisResult.detailedMarketContext?.institutionalBias || 'neutro',
        entryRecommendations: signalValidation.isValid ? (analysisResult.entryRecommendations?.slice(0, 2) || []) : [],
        riskReward: analysisResult.entryRecommendations?.[0]?.riskReward || 2.0,
        chartAnalysisQuality: chartDetection.quality,
        visualConfirmation: chartDetection.hasChart,
        executionWindow: signalValidation.executionWindow,
        signalStrength: signalValidation.signalStrength
      };

      setCurrentAnalysis(liveResult);
      setLiveResults(prev => [liveResult, ...prev.slice(0, 19)]);

      // NOTIFICAÇÃO: Apenas para sinais válidos e de qualidade
      if (signalValidation.isValid && finalSignal !== 'neutro') {
        setLastSignalTime(captureTime);
        setLastSignalType(finalSignal as 'compra' | 'venda');
        
        const strengthEmoji = {
          'muito_forte': '🔥',
          'forte': '⚡',
          'moderada': '📊',
          'fraca': '⚠️'
        }[signalValidation.signalStrength];
        
        toast({
          variant: finalSignal === 'compra' ? "default" : "destructive",
          title: `${strengthEmoji} ENTRADA ${signalValidation.signalStrength.toUpperCase()} - ${finalSignal.toUpperCase()}`,
          description: `Janela: ${signalValidation.executionWindow}s | Confiança: ${Math.round(liveResult.confidence * 100)}% | Confluência: ${Math.round(liveResult.confluenceScore)}%`,
          duration: signalValidation.executionWindow * 1000, // Duração baseada na janela de execução
        });
      }

    } catch (error) {
      console.error('Erro na análise rigorosa:', error);
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
      {/* Cabeçalho com controles avançados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" />
            Análise M1 Ultra-Rigorosa
            {isLiveActive && (
              <Badge variant="default" className="ml-2 animate-pulse">
                AO VIVO
              </Badge>
            )}
            {currentAnalysis?.signalStrength && (
              <Badge 
                variant={
                  currentAnalysis.signalStrength === 'muito_forte' ? 'default' :
                  currentAnalysis.signalStrength === 'forte' ? 'secondary' : 'destructive'
                }
                className="ml-2 text-xs"
              >
                {currentAnalysis.signalStrength.replace('_', ' ').toUpperCase()}
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
              <option value={5000}>5s (RIGOROSO)</option>
              <option value={8000}>8s (BALANCEADO)</option>
              <option value={10000}>10s (CONSERVADOR)</option>
              <option value={15000}>15s (ULTRA-CONSERVADOR)</option>
            </select>

            <select 
              value={signalCooldown} 
              onChange={(e) => setSignalCooldown(Number(e.target.value))}
              disabled={isLiveActive}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value={30000}>30s Cooldown</option>
              <option value={60000}>60s Cooldown (PADRÃO)</option>
              <option value={90000}>90s Cooldown</option>
              <option value={120000}>120s Cooldown (ULTRA)</option>
            </select>

            <select 
              value={minSignalQuality} 
              onChange={(e) => setMinSignalQuality(e.target.value as 'forte' | 'muito_forte')}
              disabled={isLiveActive}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="forte">Sinais FORTES+</option>
              <option value="muito_forte">Apenas MUITO FORTES</option>
            </select>

            <Button
              variant={chartDetectionEnabled ? "default" : "outline"}
              onClick={() => setChartDetectionEnabled(!chartDetectionEnabled)}
              className="gap-2 text-xs"
            >
              <Eye className="w-3 h-3" />
              {chartDetectionEnabled ? 'Detecção ON' : 'Detecção OFF'}
            </Button>
          </div>
          
          {/* Status detalhado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div>Análises: {analysisCount}</div>
            <div>Último sinal: {lastSignalTime > 0 ? new Date(lastSignalTime).toLocaleTimeString() : 'Nenhum'}</div>
            <div>Cooldown: {signalCooldown / 1000}s</div>
            <div>Filtro: {minSignalQuality}</div>
          </div>
          
          {/* Contador de cooldown */}
          {isLiveActive && lastSignalTime > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>Próximo sinal em: {Math.max(0, Math.ceil((signalCooldown - (Date.now() - lastSignalTime)) / 1000))}s</span>
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
              <p className="text-sm">Analisando com rigor...</p>
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
                      {currentAnalysis.signalStrength && (
                        <Badge 
                          variant={currentAnalysis.signalStrength === 'muito_forte' ? 'default' : 
                                   currentAnalysis.signalStrength === 'forte' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {currentAnalysis.signalStrength.replace('_', ' ').toUpperCase()}
                        </Badge>
                      )}
                      <Badge 
                        variant={currentAnalysis.visualConfirmation ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {currentAnalysis.visualConfirmation ? '👁️ DETECTADO' : '❌ SEM GRÁFICO'}
                      </Badge>
                      {currentAnalysis.executionWindow && (
                        <Badge variant="outline" className="text-xs">
                          ⏱️ {currentAnalysis.executionWindow}s
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs">
                      Confiança: {Math.round(currentAnalysis.confidence * 100)}% | 
                      Confluência: {Math.round(currentAnalysis.confluenceScore || 0)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-yellow-300">
                      Visual: {currentAnalysis.chartAnalysisQuality}
                    </div>
                    <div className="text-xs text-blue-300">
                      Fase: {currentAnalysis.marketPhase}
                    </div>
                    <div className="text-xs text-gray-300">
                      #{analysisCount}
                    </div>
                  </div>
                </div>
                
                {/* Janela de execução */}
                {currentAnalysis.executionWindow && currentAnalysis.signal !== 'neutro' && (
                  <div className="text-xs text-orange-300 mb-1 font-semibold">
                    ⚡ EXECUTE EM {currentAnalysis.executionWindow} SEGUNDOS
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
