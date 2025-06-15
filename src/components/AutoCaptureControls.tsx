
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  startAutoCapture, 
  stopAutoCapture, 
  configureAutoCapture, 
  autoCapture,
  multiAnalyzer,
  CaptureResult 
} from '@/utils/autoScreenCapture';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, 
  Zap, 
  Settings, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AutoCaptureControls = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentResult, setCurrentResult] = useState<CaptureResult | null>(null);
  const [recentResults, setRecentResults] = useState<CaptureResult[]>([]);
  const [config, setConfig] = useState({
    intervalMs: 500,
    enableAutoEntry: false,
    maxCapturesPerSecond: 3
  });
  const [consensusSignal, setConsensusSignal] = useState({
    signal: 'neutro' as 'compra' | 'venda' | 'neutro',
    confidence: 0,
    stability: 0
  });

  const { toast } = useToast();

  // Iniciar sistema de captura
  const handleStart = async () => {
    try {
      const success = startAutoCapture((result) => {
        setCurrentResult(result);
        setRecentResults(prev => [result, ...prev.slice(0, 9)]);
        
        // Adicionar ao analisador multi-captura
        multiAnalyzer.addResult(result);
        const consensus = multiAnalyzer.getConsensusSignal();
        setConsensusSignal(consensus);

        // Toast para sinais fortes
        if (result.shouldEnter && result.confidence > 0.8) {
          toast({
            variant: result.signal === 'compra' ? "default" : "destructive",
            title: `🚨 ENTRADA AUTOMÁTICA - ${result.signal.toUpperCase()}`,
            description: `Confiança: ${Math.round(result.confidence * 100)}% | Estabilidade: ${Math.round(consensus.stability * 100)}%`,
            duration: 5000,
          });
        }
      });

      if (success) {
        setIsActive(true);
        toast({
          variant: "default",
          title: "✅ Captura Automática Iniciada",
          description: `Analisando tela a cada ${config.intervalMs}ms`,
        });
      }
    } catch (error) {
      console.error('Erro ao iniciar captura:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro na Captura",
        description: "Falha ao iniciar sistema de captura automática",
      });
    }
  };

  // Parar sistema
  const handleStop = () => {
    stopAutoCapture();
    setIsActive(false);
    setCurrentResult(null);
    multiAnalyzer.clear();
    
    toast({
      variant: "default",
      title: "⏹️ Captura Parada",
      description: "Sistema de captura automática foi interrompido",
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
      {/* Controles Principais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Captura Automática de Tela
            {isActive && (
              <Badge variant="default" className="ml-2 animate-pulse">
                ATIVO
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {!isActive ? (
              <Button onClick={handleStart} className="gap-2">
                <Camera className="w-4 h-4" />
                Iniciar Captura
              </Button>
            ) : (
              <Button onClick={handleStop} variant="destructive" className="gap-2">
                <Activity className="w-4 h-4" />
                Parar Captura
              </Button>
            )}
          </div>

          {/* Configurações */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Intervalo de Captura: {config.intervalMs}ms
              </label>
              <Slider
                value={[config.intervalMs]}
                onValueChange={([value]) => updateConfig({ intervalMs: value })}
                min={100}
                max={2000}
                step={100}
                disabled={isActive}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Entradas Automáticas
              </label>
              <Switch
                checked={config.enableAutoEntry}
                onCheckedChange={(checked) => updateConfig({ enableAutoEntry: checked })}
                disabled={isActive}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado Atual */}
      {currentResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentResult.timestamp}
        >
          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Último Resultado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={currentResult.signal === 'compra' ? 'default' : 
                             currentResult.signal === 'venda' ? 'destructive' : 'outline'}
                  >
                    {currentResult.signal.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(currentResult.confidence * 100)}%
                  </span>
                  {currentResult.shouldEnter && (
                    <Badge variant="secondary" className="animate-pulse">
                      ENTRAR
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(currentResult.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {currentResult.patterns.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Padrões: {currentResult.patterns.slice(0, 3).join(', ')}
                </div>
              )}

              {currentResult.reasoning.length > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  💡 {currentResult.reasoning[0]}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Consenso Multi-Captura */}
      {consensusSignal.stability > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Consenso (Múltiplas Capturas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge 
                variant={consensusSignal.signal === 'compra' ? 'default' : 
                         consensusSignal.signal === 'venda' ? 'destructive' : 'outline'}
              >
                {consensusSignal.signal.toUpperCase()}
              </Badge>
              <div className="text-sm">
                Confiança: {Math.round(consensusSignal.confidence * 100)}%
              </div>
              <div className="text-sm">
                Estabilidade: {Math.round(consensusSignal.stability * 100)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico Recente */}
      {recentResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentResults.slice(0, 5).map((result) => (
                <div
                  key={result.timestamp}
                  className="flex items-center justify-between p-2 border rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={result.signal === 'compra' ? 'default' : 
                               result.signal === 'venda' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {result.signal}
                    </Badge>
                    <span>{Math.round(result.confidence * 100)}%</span>
                    {result.shouldEnter && <span className="text-green-600">✓</span>}
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutoCaptureControls;
