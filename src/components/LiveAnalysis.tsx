import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Camera, Play, Pause, Settings, AlertTriangle, Activity, TrendingUp, CircleArrowUp, CircleArrowDown, ChartBar, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { enhanceImageForAnalysis } from '@/utils/imagePreProcessing';
import { analyzeChart } from '@/utils/patternDetection';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { TradeSuccessPrediction } from '@/utils/tradeSuccessPrediction';

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
}

const LiveAnalysis = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(3000); // 3 segundos por padrão
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

  // Função melhorada para detectar se há um gráfico na tela
  const detectChartInFrame = async (imageData: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // Lógica mais sofisticada de detecção
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          // Análise simples de padrões que indicam um gráfico
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          if (!imageData) {
            resolve(false);
            return;
          }
          
          // Verificar variação de cores e padrões lineares
          let colorVariations = 0;
          
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            
            // Detectar variações de cor típicas de gráficos
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
    // Verificar consistência entre sinais
    const patternActions = patterns.map(p => p.action).filter(a => a !== 'neutro');
    const uniqueActions = [...new Set(patternActions)];
    const consistency = uniqueActions.length <= 1 ? 100 : 50;
    
    // Calcular confiabilidade baseada em confluência e número de sinais
    const reliability = Math.min(100, 
      (confluenceScore * 0.6) + 
      (patterns.length * 10) + 
      (priceActionSignals.length * 15)
    );
    
    // Verificar alinhamento com mercado
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
      
      // Capturar frame atual
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Converter para base64
      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Verificar se há um gráfico visível na tela
      const hasChart = await detectChartInFrame(imageUrl);
      setIsChartVisible(hasChart);
      
      if (!hasChart) {
        console.log('📊 Nenhum gráfico detectado na tela');
        setCurrentAnalysis(null);
        return;
      }
      
      console.log('✅ Gráfico detectado! Iniciando análise...');
      
      // Melhorar imagem para análise
      const enhancedImageUrl = await enhanceImageForAnalysis(imageUrl);
      
      // Analisar com todas as funcionalidades ativadas
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

      // Armazenar detalhes das confluências e price action
      setConfluenceDetails(analysisResult.confluences);
      setPriceActionDetails({
        signals: analysisResult.priceActionSignals || [],
        marketContext: analysisResult.detailedMarketContext
      });
      setEntryRecommendations(analysisResult.entryRecommendations || []);

      // Processar resultado para formato live com validação melhorada
      let finalConfidence = 0;
      let signalQuality = 'fraca';
      let riskReward = 2.0;
      let mainSignal: 'compra' | 'venda' | 'neutro' = 'neutro';
      
      // Determinar sinal principal baseado no padrão mais forte e consistente
      const validPatterns = analysisResult.patterns.filter(p => p.action !== 'neutro');
      
      if (validPatterns.length > 0) {
        // Verificar consistência entre padrões
        const actions = validPatterns.map(p => p.action);
        const uniqueActions = [...new Set(actions)];
        
        if (uniqueActions.length === 1) {
          // Sinais consistentes
          mainSignal = uniqueActions[0] as 'compra' | 'venda';
          finalConfidence = validPatterns.reduce((sum, p) => sum + p.confidence, 0) / validPatterns.length;
        } else {
          // Sinais conflitantes - usar o mais forte mas reduzir confiança
          const strongestPattern = validPatterns.reduce((prev, current) => 
            (current.confidence > prev.confidence) ? current : prev
          );
          mainSignal = strongestPattern.action as 'compra' | 'venda';
          finalConfidence = strongestPattern.confidence * 0.7; // Penalizar conflito
        }
      }
      
      // Validar com price action
      const alignedPASignals = analysisResult.priceActionSignals?.filter(pa => 
        (mainSignal === 'compra' && pa.direction === 'alta') ||
        (mainSignal === 'venda' && pa.direction === 'baixa')
      ) || [];
      
      if (alignedPASignals.length > 0) {
        const paConfidence = alignedPASignals.reduce((sum, pa) => sum + pa.confidence, 0) / alignedPASignals.length;
        finalConfidence = (finalConfidence + paConfidence) / 2;
      } else if (analysisResult.priceActionSignals?.length > 0 && mainSignal !== 'neutro') {
        // Price action contradiz - reduzir confiança
        finalConfidence *= 0.6;
      }
      
      // Determinar qualidade do sinal
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
      
      // Ajustar baseado em confluências
      if (analysisResult.confluences) {
        const confluenceBonus = analysisResult.confluences.confluenceScore / 100 * 0.1;
        finalConfidence = Math.min(1, finalConfidence + confluenceBonus);
        
        if (analysisResult.confluences.confluenceScore > 80) {
          signalQuality = 'excelente';
        }
      }
      
      // Obter melhor recomendação de entrada
      const bestEntry = analysisResult.entryRecommendations?.find(entry => 
        entry.action === mainSignal
      );
      
      if (bestEntry) {
        riskReward = bestEntry.riskReward;
        finalConfidence = Math.max(finalConfidence, bestEntry.confidence);
      }

      // Mapear tendência corretamente - corrigir tipo de comparação
      let mappedTrend: 'alta' | 'baixa' | 'lateral' = 'lateral';
      
      if (analysisResult.detailedMarketContext?.trend) {
        const rawTrend = analysisResult.detailedMarketContext.trend;
        if (rawTrend === 'alta') {
          mappedTrend = 'alta';
        } else if (rawTrend === 'baixa') {
          mappedTrend = 'baixa';
        }
      }

      // Calcular saúde da análise
      const analysisHealth = calculateAnalysisHealth(
        analysisResult.patterns,
        analysisResult.priceActionSignals || [],
        analysisResult.confluences?.confluenceScore || 0
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
        analysisHealth
      };

      setCurrentAnalysis(liveResult);
      setLiveResults(prev => [liveResult, ...prev.slice(0, 19)]); // Manter últimos 20 resultados

      // Atualizar estatísticas
      setAnalysisStats(prev => ({
        totalAnalyses: prev.totalAnalyses + 1,
        validSignals: prev.validSignals + (mainSignal !== 'neutro' ? 1 : 0),
        avgConfidence: (prev.avgConfidence * prev.totalAnalyses + finalConfidence * 100) / (prev.totalAnalyses + 1),
        lastValidSignalTime: mainSignal !== 'neutro' ? Date.now() : prev.lastValidSignalTime
      }));

      // Notificar apenas sinais de alta qualidade
      if (finalConfidence > 0.7 && mainSignal !== 'neutro' && signalQuality !== 'fraca') {
        const paText = alignedPASignals.length > 0 ? 
          ` | PA: ${alignedPASignals[0].type}` : '';
        const rrText = riskReward > 2 ? ` | R:R ${riskReward.toFixed(1)}` : '';
        const healthText = analysisHealth.consistency > 80 ? ' ✅' : ' ⚠️';
        
        toast({
          variant: mainSignal === 'compra' ? "default" : "destructive",
          title: `🚨 ENTRADA ${signalQuality.toUpperCase()} - ${mainSignal.toUpperCase()}${healthText}`,
          description: `Confiança: ${Math.round(finalConfidence * 100)}% | Fase: ${liveResult.marketPhase}${paText}${rrText}`,
          duration: 8000,
        });
      }

      console.log(`✅ Análise completa - Sinal: ${mainSignal} (${Math.round(finalConfidence * 100)}%)`);

    } catch (error) {
      console.error('❌ Erro na análise em tempo real:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, scalpingStrategy, considerVolume, considerVolatility, marketContextEnabled, marketAnalysisDepth, toast]);

  // Iniciar análise em tempo real
  const startLiveAnalysis = async () => {
    await startCamera();
    setIsLiveActive(true);
    
    // Aguardar um pouco para a câmera inicializar
    setTimeout(() => {
      intervalRef.current = setInterval(captureAndAnalyze, analysisInterval);
    }, 1000);

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

  // Ultra quick entry decision with 60-second success prediction
  const quickEntrySignal = () => {
    // Se as condições são muito ruins, não dar sinal
    if (operatingScore < 30 || advancedConditions?.recommendation === 'nao_operar') {
      return (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-red-500 animate-pulse" />
            <span className="font-bold text-red-700 dark:text-red-400 text-xl">NÃO OPERAR</span>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">Score: {operatingScore}/100</div>
            <div className="text-xs opacity-70">Condições adversas</div>
          </div>
        </div>
      );
    }
    
    // NOVO: Verificar predições de sucesso
    const bestPrediction = analysisResults.tradeSuccessPredictions?.find(p => 
      p.willSucceed && p.recommendation === 'enter_now'
    );
    
    const waitPrediction = analysisResults.tradeSuccessPredictions?.find(p => 
      p.recommendation === 'wait_next_candle'
    );
    
    // Se há uma predição que indica entrada agora
    if (bestPrediction && (isUptrend || isDowntrend)) {
      const signal = isUptrend ? 'compra' : 'venda';
      const adjustedConfidence = Math.round(bestPrediction.successProbability);
      
      return (
        <div className={`p-3 rounded-lg border flex flex-col gap-2 ${
          adjustedConfidence >= 75 ? 
          'bg-green-100 dark:bg-green-900/30 border-green-500' :
          'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isUptrend ? (
                <CircleArrowUp className={`h-7 w-7 animate-pulse ${
                  adjustedConfidence >= 75 ? 'text-green-500' : 'text-yellow-600'
                }`} />
              ) : (
                <CircleArrowDown className={`h-7 w-7 animate-pulse ${
                  adjustedConfidence >= 75 ? 'text-red-500' : 'text-yellow-600'
                }`} />
              )}
              <span className={`font-bold text-xl ${
                adjustedConfidence >= 75 ? 
                (isUptrend ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400') :
                'text-yellow-700 dark:text-yellow-400'
              }`}>
                {signal.toUpperCase()}
              </span>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm">⏱️ {bestPrediction.exitTime}s</div>
              <div className="text-xs opacity-70">Sucesso: {adjustedConfidence}%</div>
            </div>
          </div>
          
          {/* Detalhes da predição */}
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Timing:</span>
              <span className="font-medium">
                {bestPrediction.entryTiming === 'same_candle' ? 'Mesma vela' : 'Próxima vela'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Volatilidade:</span>
              <span className={`font-medium ${
                bestPrediction.candleAnalysis.volatilityRisk === 'low' ? 'text-green-600' :
                bestPrediction.candleAnalysis.volatilityRisk === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {bestPrediction.candleAnalysis.volatilityRisk.toUpperCase()}
              </span>
            </div>
            {bestPrediction.riskFactors.length > 0 && (
              <div className="text-orange-600 text-xs">
                ⚠️ {bestPrediction.riskFactors[0]}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Se deve aguardar próxima vela
    if (waitPrediction) {
      return (
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500 animate-pulse" />
            <span className="font-bold text-blue-700 dark:text-blue-400 text-lg">AGUARDAR PRÓXIMA VELA</span>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">⏳ {Math.round(waitPrediction.timeToEntry)}s</div>
            <div className="text-xs opacity-70">Sucesso: {Math.round(waitPrediction.successProbability)}%</div>
          </div>
        </div>
      );
    }
    
    // Lógica original para casos sem predição específica
    if (isUptrend && operatingScore >= 40) {
      const adjustedConfidence = Math.round(confidenceReduction * 100);
      
      return (
        <div className={`p-3 rounded-lg border flex items-center justify-between ${
          operatingScore >= 60 ? 
          'bg-green-100 dark:bg-green-900/30 border-green-500' :
          'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500'
        }`}>
          <div className="flex items-center gap-2">
            <CircleArrowUp className={`h-7 w-7 animate-pulse ${
              operatingScore >= 60 ? 'text-green-500' : 'text-yellow-600'
            }`} />
            <span className={`font-bold text-xl ${
              operatingScore >= 60 ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
            }`}>
              COMPRAR {operatingScore < 60 ? '(CAUTELOSO)' : ''}
            </span>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">{entryMinute}</div>
            <div className="text-xs opacity-70">Conf: {adjustedConfidence}%</div>
          </div>
        </div>
      );
    }
    
    if (isDowntrend && operatingScore >= 40) {
      const adjustedConfidence = Math.round(confidenceReduction * 100);
      
      return (
        <div className={`p-3 rounded-lg border flex items-center justify-between ${
          operatingScore >= 60 ? 
          'bg-red-100 dark:bg-red-900/30 border-red-500' :
          'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500'
        }`}>
          <div className="flex items-center gap-2">
            <CircleArrowDown className={`h-7 w-7 animate-pulse ${
              operatingScore >= 60 ? 'text-red-500' : 'text-yellow-600'
            }`} />
            <span className={`font-bold text-xl ${
              operatingScore >= 60 ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'
            }`}>
              VENDER {operatingScore < 60 ? '(CAUTELOSO)' : ''}
            </span>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">{entryMinute}</div>
            <div className="text-xs opacity-70">Conf: {adjustedConfidence}%</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBar className="h-6 w-6 text-gray-500" />
          <span className="font-bold text-gray-700 dark:text-gray-400 text-lg">AGUARDAR</span>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm">Score: {operatingScore}/100</div>
          <div className="text-xs opacity-70">Sem sinal claro</div>
        </div>
      </div>
    );
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
      {/* Cabeçalho de controles melhorado */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Análise Live M1 - IA Aprimorada
            {isLiveActive && (
              <Badge variant="default" className="ml-2 animate-pulse">
                AO VIVO
              </Badge>
            )}
            {isLiveActive && !isChartVisible && (
              <Badge variant="secondary" className="ml-2">
                AGUARDANDO GRÁFICO
              </Badge>
            )}
          </CardTitle>
          {/* Estatísticas da sessão */}
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

            {priceActionDetails && (
              <Button 
                variant="outline" 
                onClick={() => setShowPriceActionDetails(!showPriceActionDetails)}
                className="gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Price Action
              </Button>
            )}

            {confluenceDetails && (
              <Button 
                variant="outline" 
                onClick={() => setShowConfluenceDetails(!showConfluenceDetails)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Confluências
              </Button>
            )}
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

      {/* Video feed com overlay aprimorado */}
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
              <p className="text-sm">
                {isChartVisible ? 'Analisando com IA Aprimorada...' : 'Procurando gráfico...'}
              </p>
            </div>
          </div>
        )}

        {/* Aviso quando não há gráfico */}
        {isLiveActive && !isChartVisible && !isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-white text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
              <p className="text-sm">Aponte a câmera para um gráfico</p>
              <p className="text-xs text-gray-300">Aguardando detecção automática...</p>
            </div>
          </div>
        )}

        {currentAnalysis && isChartVisible && (
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
                          variant={currentAnalysis.signalQuality === 'excelente' || currentAnalysis.signalQuality === 'forte' ? 'default' : 
                                   currentAnalysis.signalQuality === 'boa' || currentAnalysis.signalQuality === 'moderada' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {currentAnalysis.signalQuality}
                        </Badge>
                      )}
                      {/* Indicador de saúde da análise */}
                      {currentAnalysis.analysisHealth && (
                        <Badge 
                          variant={currentAnalysis.analysisHealth.consistency > 80 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {currentAnalysis.analysisHealth.consistency > 80 ? '✅' : '⚠️'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs">
                      Confiança: {Math.round(currentAnalysis.confidence * 100)}%
                    </p>
                    <p className="text-xs text-green-300">
                      R:R {currentAnalysis.riskReward?.toFixed(1) || '2.0'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-yellow-300">
                      Fase: {currentAnalysis.marketPhase}
                    </div>
                    <div className="text-xs text-blue-300">
                      Bias: {currentAnalysis.institutionalBias}
                    </div>
                    {currentAnalysis.analysisHealth && (
                      <div className="text-xs text-purple-300">
                        Saúde: {Math.round(currentAnalysis.analysisHealth.reliability)}%
                      </div>
                    )}
                    <div className="text-xs text-gray-300">
                      {new Date(currentAnalysis.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                {/* Price Action Signals */}
                {currentAnalysis.priceActionSignals && currentAnalysis.priceActionSignals.length > 0 && (
                  <div className="text-xs text-purple-300 mb-1">
                    PA: {currentAnalysis.priceActionSignals.map((pa: any) => pa.type).join(', ')}
                  </div>
                )}
                
                {/* Entry Recommendations - apenas coerentes */}
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

      {/* Histórico de resultados */}
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
