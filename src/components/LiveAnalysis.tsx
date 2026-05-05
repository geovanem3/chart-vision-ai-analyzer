import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Camera, Play, Pause, TrendingUp, TrendingDown, AlertTriangle, Shield, Database, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { analyzeChartWithAI, AIAnalysisResult, AnalysisSource } from '@/services/chartAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { convertAIToDbFormat, convertDbToSavedAnalysis, SavedAnalysis } from '@/hooks/useAnalysisPersistence';

interface LiveAnalysisResult {
  id?: string;
  timestamp: number;
  confidence: number;
  signal: 'compra' | 'venda' | 'neutro';
  patterns: string[];
  trend: 'bullish' | 'bearish' | 'lateral';
  reasoning: string;
  riskLevel: string;
  supportLevels: string[];
  resistanceLevels: string[];
  savedToDb: boolean;
}

const LiveAnalysis = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(5000); // 5 segundos
  const [currentAnalysis, setCurrentAnalysis] = useState<LiveAnalysisResult | null>(null);
  const [liveResults, setLiveResults] = useState<LiveAnalysisResult[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { timeframe } = useAnalyzer();

  // Load saved live analyses on mount
  useEffect(() => {
    loadSavedLiveAnalyses();
  }, []);

  // Load saved live analyses from database
  const loadSavedLiveAnalyses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('professional_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao carregar análises live:', error);
        return;
      }

      const analyses: LiveAnalysisResult[] = (data || [])
        .filter(d => (d.smart_analysis_result as any)?.source === 'live')
        .map(d => {
          const saved = convertDbToSavedAnalysis(d);
          return {
            id: saved.id,
            timestamp: saved.timestamp,
            confidence: saved.confidence,
            signal: saved.signal,
            patterns: saved.patterns,
            trend: saved.trend,
            reasoning: saved.reasoning,
            riskLevel: saved.riskLevel,
            supportLevels: saved.supportLevels,
            resistanceLevels: saved.resistanceLevels,
            savedToDb: true
          };
        });

      if (analyses.length > 0) {
        setLiveResults(analyses);
        setCurrentAnalysis(analyses[0]);
        console.log(`✅ ${analyses.length} análises live carregadas do banco`);
      }
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
    }
  };

  // Save live analysis to database
  const saveLiveAnalysis = async (aiResult: AIAnalysisResult, imageUrl?: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('⚠️ Usuário não autenticado - análise live não será salva');
        return null;
      }

      const dbData = convertAIToDbFormat(aiResult, imageUrl, timeframe, 'live');
      
      const { data, error } = await supabase
        .from('professional_analyses')
        .insert({
          user_id: user.id,
          ...dbData
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Erro ao salvar análise live:', error);
        return null;
      }

      console.log('✅ Análise live salva no banco com ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ Erro ao salvar análise live:', error);
      return null;
    }
  };

  // Iniciar câmera
  const startCamera = async () => {
    try {
      setCameraError(null);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
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

  // Capturar frame e analisar com IA
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      setIsOfflineMode(false);
      console.log('🎥 Capturando frame para análise Live com IA...');
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Analisar (com fallback automático do backend)
      const response = await analyzeChartWithAI(imageUrl, timeframe);
      const aiAnalysis = response.analysis;
      const analysisSource = response.source;
      
      if (analysisSource !== 'ai') {
        console.warn(`⚠️ Live usando fallback: ${analysisSource}`);
        setIsOfflineMode(true);
      }
      
      // Salvar no banco de dados (apenas se veio da IA real)
      const savedId = analysisSource === 'ai' ? await saveLiveAnalysis(aiAnalysis, imageUrl) : null;
      
      const liveResult: LiveAnalysisResult = {
        id: savedId || undefined,
        timestamp: Date.now(),
        confidence: aiAnalysis.recommendation.confidence,
        signal: aiAnalysis.recommendation.action,
        patterns: aiAnalysis.patterns.map(p => p.type),
        trend: aiAnalysis.trend,
        reasoning: aiAnalysis.recommendation.reasoning,
        riskLevel: aiAnalysis.recommendation.riskLevel,
        supportLevels: aiAnalysis.supportLevels,
        resistanceLevels: aiAnalysis.resistanceLevels,
        savedToDb: !!savedId
      };

      setCurrentAnalysis(liveResult);
      setLiveResults(prev => [liveResult, ...prev.slice(0, 9)]); // Manter últimos 10

      // Notificar sinais fortes
      if (aiAnalysis.recommendation.confidence > 0.7 && aiAnalysis.recommendation.action !== 'neutro') {
        toast({
          variant: aiAnalysis.recommendation.action === 'compra' ? "default" : "destructive",
          title: `🎯 SINAL ${aiAnalysis.recommendation.action.toUpperCase()}`,
          description: `Confiança: ${Math.round(aiAnalysis.recommendation.confidence * 100)}% - ${aiAnalysis.recommendation.reasoning.substring(0, 60)}...`,
          duration: 8000,
        });
      }

      console.log(`✅ Análise Live - Sinal: ${liveResult.signal} (${Math.round(liveResult.confidence * 100)}%) - Salvo: ${liveResult.savedToDb}`);

    } catch (error) {
      console.error('❌ Erro na análise Live:', error);
      setIsOfflineMode(true);
      
      // Fallback: usar última análise do banco
      if (liveResults.length === 0) {
        await loadSavedLiveAnalyses();
      }
      
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: "Usando dados salvos. Verifique sua conexão.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, timeframe, toast, liveResults.length]);

  // Iniciar análise Live
  const startLiveAnalysis = async () => {
    await startCamera();
    setIsLiveActive(true);
    
    setTimeout(() => {
      intervalRef.current = setInterval(captureAndAnalyze, analysisInterval);
    }, 1000);

    toast({
      variant: "default",
      title: "✅ Análise Live Iniciada",
      description: `Analisando com IA a cada ${analysisInterval / 1000} segundos - Dados salvos automaticamente`,
    });
  };

  // Parar análise Live
  const stopLiveAnalysis = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopCamera();
    setIsLiveActive(false);

    const savedCount = liveResults.filter(r => r.savedToDb).length;
    toast({
      variant: "default",
      title: "⏹️ Análise Live Parada",
      description: `${liveResults.length} análises realizadas, ${savedCount} salvas no banco`,
    });
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'compra': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'venda': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Análise Live com IA
            </div>
            <div className="flex items-center gap-2">
              {isOfflineMode ? (
                <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-400 border-green-400/30">
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              )}
              {isLiveActive && (
                <Badge variant="outline" className="animate-pulse bg-red-500/20 text-red-400">
                  ● AO VIVO
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Visualização da câmera */}
          <div className="relative w-full aspect-video bg-black/90 rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {!isLiveActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center text-white">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">Câmera desativada</p>
                  {liveResults.length > 0 && (
                    <p className="text-xs opacity-50 mt-2">
                      {liveResults.length} análises salvas disponíveis
                    </p>
                  )}
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute top-2 right-2">
                <Badge className="animate-pulse bg-primary/80">
                  Analisando...
                </Badge>
              </div>
            )}
          </div>

          {cameraError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{cameraError}</AlertDescription>
            </Alert>
          )}

          {/* Controles */}
          <div className="flex gap-2 mb-4">
            {!isLiveActive ? (
              <Button onClick={startLiveAnalysis} className="flex-1 gap-2">
                <Play className="h-4 w-4" />
                Iniciar Análise Live
              </Button>
            ) : (
              <Button onClick={stopLiveAnalysis} variant="destructive" className="flex-1 gap-2">
                <Pause className="h-4 w-4" />
                Parar
              </Button>
            )}
          </div>

          {/* Resultado atual */}
          <AnimatePresence mode="wait">
            {currentAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <Card className="border-2 border-primary/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`text-lg px-4 py-2 ${getSignalColor(currentAnalysis.signal)}`}>
                        {currentAnalysis.signal === 'compra' && <TrendingUp className="h-4 w-4 mr-2" />}
                        {currentAnalysis.signal === 'venda' && <TrendingDown className="h-4 w-4 mr-2" />}
                        {currentAnalysis.signal.toUpperCase()}
                      </Badge>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(currentAnalysis.confidence * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          {currentAnalysis.savedToDb && (
                            <Database className="h-3 w-3 text-green-400" />
                          )}
                          Confiança
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {currentAnalysis.reasoning}
                    </p>

                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>Risco: <span className="font-medium">{currentAnalysis.riskLevel}</span></span>
                    </div>

                    {currentAnalysis.patterns.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">Padrões:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentAnalysis.patterns.map((p, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Histórico */}
          {liveResults.length > 1 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Histórico Recente</h4>
                <Badge variant="outline" className="text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  {liveResults.filter(r => r.savedToDb).length} salvos
                </Badge>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {liveResults.slice(1, 6).map((result, index) => (
                  <div 
                    key={result.timestamp} 
                    className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getSignalColor(result.signal)}`}>
                        {result.signal}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                      {result.savedToDb && (
                        <Database className="h-3 w-3 text-green-400/70" />
                      )}
                    </div>
                    <span className="font-medium">
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveAnalysis;
