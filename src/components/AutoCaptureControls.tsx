
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  startAutoCapture, 
  stopAutoCapture, 
  configureAutoCapture,
  getCaptureStats,
  realTimeMonitor,
  CaptureResult 
} from '@/utils/autoScreenCapture';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, 
  Zap, 
  Activity, 
  TrendingUp, 
  Target,
  Brain,
  BarChart3,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AutoCaptureControls = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentResult, setCurrentResult] = useState<CaptureResult | null>(null);
  const [stats, setStats] = useState({
    isRunning: false,
    queueSize: 0,
    isAnalyzing: false,
    lastCapture: 0
  });
  const [trendAnalysis, setTrendAnalysis] = useState({
    dominantSignal: 'neutro' as 'compra' | 'venda' | 'neutro',
    consistency: 0,
    avgConfidence: 0
  });
  const [config, setConfig] = useState({
    intervalMs: 250,
    enableBackgroundAnalysis: true,
    maxCapturesPerMinute: 240
  });

  const { toast } = useToast();

  // Atualizar estatísticas em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStats = getCaptureStats();
      setStats(currentStats);
      
      const trend = realTimeMonitor.getTrendAnalysis();
      setTrendAnalysis(trend);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Iniciar sistema
  const handleStart = async () => {
    try {
      const success = await startAutoCapture((result) => {
        setCurrentResult(result);
        realTimeMonitor.addResult(result);
        
        // Toast para sinais fortes
        if (result.shouldEnter) {
          toast({
            variant: result.signal === 'compra' ? "default" : "destructive",
            title: `🚨 ENTRADA DETECTADA - ${result.signal.toUpperCase()}`,
            description: `Confiança: ${Math.round(result.confidence * 100)}% | Padrões: ${result.patterns.slice(0, 2).join(', ')}`,
            duration: 8000,
          });
        }
      });

      if (success) {
        setIsActive(true);
        toast({
          variant: "default",
          title: "🚀 Captura Automática Iniciada",
          description: "Sistema em modo livre - Analisando continuamente",
        });
      }
    } catch (error) {
      console.error('Erro ao iniciar:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro na Inicialização",
        description: "Permita o compartilhamento de tela para continuar",
      });
    }
  };

  // Parar sistema
  const handleStop = () => {
    stopAutoCapture();
    setIsActive(false);
    setCurrentResult(null);
    realTimeMonitor.clear();
    
    toast({
      variant: "default",
      title: "⏹️ Sistema Parado",
      description: "Captura automática foi interrompida",
    });
  };

  // Atualizar configuração
  const updateConfig = (newConfig: any) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    configureAutoCapture(updatedConfig);
  };

  return (
    <div className="space-y-4">
      {/* Status Principal */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Sistema de Captura Inteligente
            {isActive && (
              <Badge variant="default" className="ml-2 animate-pulse bg-green-600">
                MODO LIVRE ATIVO
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {!isActive ? (
              <Button onClick={handleStart} className="gap-2 bg-green-600 hover:bg-green-700">
                <Camera className="w-4 h-4" />
                Iniciar Modo Livre
              </Button>
            ) : (
              <Button onClick={handleStop} variant="destructive" className="gap-2">
                <Activity className="w-4 h-4" />
                Parar Sistema
              </Button>
            )}
          </div>

          {/* Estatísticas em Tempo Real */}
          {isActive && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="text-center">
                <div className="text-green-600 font-bold">
                  {stats.isAnalyzing ? '🔍' : '⏸️'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.isAnalyzing ? 'Analisando' : 'Aguardando'}
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold">{stats.queueSize}</div>
                <div className="text-xs text-muted-foreground">Fila</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{Math.round(60000 / config.intervalMs)}/min</div>
                <div className="text-xs text-muted-foreground">Capturas</div>
              </div>
              <div className="text-center">
                <div className="font-bold">
                  {stats.lastCapture ? new Date(stats.lastCapture).toLocaleTimeString().slice(-8) : '--:--:--'}
                </div>
                <div className="text-xs text-muted-foreground">Última</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Configurações de Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Velocidade de Captura: {Math.round(60000 / config.intervalMs)}/min
            </label>
            <Slider
              value={[config.intervalMs]}
              onValueChange={([value]) => updateConfig({ intervalMs: value })}
              min={100}
              max={1000}
              step={50}
              disabled={isActive}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {config.intervalMs}ms entre capturas
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Análise em Segundo Plano
            </label>
            <Switch
              checked={config.enableBackgroundAnalysis}
              onCheckedChange={(checked) => updateConfig({ enableBackgroundAnalysis: checked })}
              disabled={isActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resultado Atual */}
      {currentResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          key={currentResult.timestamp}
        >
          <Card className={`border-2 ${
            currentResult.shouldEnter 
              ? currentResult.signal === 'compra' ? 'border-green-400' : 'border-red-400'
              : 'border-blue-200'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Última Análise
                {currentResult.shouldEnter && (
                  <Badge variant="secondary" className="animate-pulse">
                    ENTRADA RECOMENDADA
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={currentResult.signal === 'compra' ? 'default' : 
                             currentResult.signal === 'venda' ? 'destructive' : 'outline'}
                    className="text-sm"
                  >
                    {currentResult.signal.toUpperCase()}
                  </Badge>
                  <div className="text-sm">
                    <Progress 
                      value={currentResult.confidence * 100} 
                      className="w-20 h-2"
                    />
                    <span className="text-xs text-muted-foreground">
                      {Math.round(currentResult.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(currentResult.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {currentResult.patterns.length > 0 && (
                <div className="text-xs text-muted-foreground mb-2">
                  📊 Padrões: {currentResult.patterns.slice(0, 3).join(' • ')}
                </div>
              )}

              {currentResult.reasoning.length > 0 && (
                <div className="text-xs text-blue-600">
                  💡 {currentResult.reasoning[0]}
                </div>
              )}

              {currentResult.priceData && (
                <div className="text-xs text-muted-foreground mt-2 grid grid-cols-3 gap-2">
                  <div>Atual: {currentResult.priceData.current.toFixed(5)}</div>
                  <div>Suporte: {currentResult.priceData.support.toFixed(5)}</div>
                  <div>Resistência: {currentResult.priceData.resistance.toFixed(5)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Análise de Tendência */}
      {trendAnalysis.consistency > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Tendência dos Últimos 5 Minutos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge 
                variant={trendAnalysis.dominantSignal === 'compra' ? 'default' : 
                         trendAnalysis.dominantSignal === 'venda' ? 'destructive' : 'outline'}
              >
                {trendAnalysis.dominantSignal.toUpperCase()}
              </Badge>
              <div className="text-sm">
                Consistência: {Math.round(trendAnalysis.consistency * 100)}%
              </div>
              <div className="text-sm">
                Confiança Média: {Math.round(trendAnalysis.avgConfidence * 100)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informação do Sistema */}
      <Card className="bg-blue-50">
        <CardContent className="pt-4">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">💡 Sistema em Modo Livre</div>
            <div className="text-xs">
              • Captura automática contínua em segundo plano<br/>
              • Análise independente sem interferir na navegação<br/>
              • Detecção inteligente de padrões em tempo real<br/>
              • Auto-limpeza de memória para performance otimizada
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoCaptureControls;

