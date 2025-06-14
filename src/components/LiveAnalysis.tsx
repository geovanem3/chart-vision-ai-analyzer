import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target,
  CircleArrowUp,
  CircleArrowDown,
  ShieldAlert
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const LiveAnalysis = () => {
  const { analysisResults, timeframe } = useAnalyzer();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [analysisStats, setAnalysisStats] = useState({
    totalPatterns: 0,
    highConfidencePatterns: 0,
    lastAnalysisTime: null as Date | null
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (analysisResults) {
      const patterns = analysisResults.patterns || [];
      setAnalysisStats({
        totalPatterns: patterns.length,
        highConfidencePatterns: patterns.filter(p => p.confidence > 0.7).length,
        lastAnalysisTime: new Date(analysisResults.timestamp)
      });
    }
  }, [analysisResults]);

  if (!analysisResults) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Análise em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Aguardando análise do gráfico...
          </p>
        </CardContent>
      </Card>
    );
  }

  const { 
    patterns = [], 
    marketContext, 
    volumeData, 
    volatilityData,
    tradeSuccessPredictions = []
  } = analysisResults;

  // Calculate trend direction
  const buyPatterns = patterns.filter(p => p.action === 'compra');
  const sellPatterns = patterns.filter(p => p.action === 'venda');
  const isUptrend = buyPatterns.length > sellPatterns.length;
  const isDowntrend = sellPatterns.length > buyPatterns.length;

  // Calculate operating score from market context
  const operatingScore = marketContext?.operatingScore || 0;
  const advancedConditions = marketContext?.advancedConditions || {};
  const confidenceReduction = marketContext?.confidenceReduction || 0;

  // Get entry minute from precise analysis
  const entryMinute = analysisResults.preciseEntryAnalysis?.exactMinute || 
    `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="space-y-4 w-full max-w-md">
      {/* Real-time Clock */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tempo Real
            </span>
            <span className="text-2xl font-mono">
              {currentTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Trade Success Predictions */}
      {tradeSuccessPredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Predição de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tradeSuccessPredictions.map((prediction, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={prediction.recommendation === 'enter_now' ? 'default' : 'secondary'}>
                      {prediction.recommendation === 'enter_now' ? 'Executar' : 
                       prediction.recommendation === 'wait_next_candle' ? 'Aguardar' : 'Pular'}
                    </Badge>
                    <span className="text-sm font-mono">
                      {prediction.entryTiming}s
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {prediction.riskFactors.join(', ')}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span>Confiança: {Math.round(prediction.successProbability * 100)}%</span>
                    <span>R/R: {(prediction.successProbability * 2).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Conditions Alert */}
      {operatingScore < 50 && advancedConditions && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Condições Desfavoráveis</AlertTitle>
          <AlertDescription>
            Score operacional baixo: {operatingScore}%. Recomenda-se cautela extra.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Analysis Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Status da Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Padrões detectados:</span>
              <span className="font-medium">{analysisStats.totalPatterns}</span>
            </div>
            <div className="flex justify-between">
              <span>Alta confiança:</span>
              <span className="font-medium">{analysisStats.highConfidencePatterns}</span>
            </div>
            <div className="flex justify-between">
              <span>Tendência atual:</span>
              <span className={`font-medium ${isUptrend ? 'text-green-600' : isDowntrend ? 'text-red-600' : 'text-gray-600'}`}>
                {isUptrend ? 'Alta' : isDowntrend ? 'Baixa' : 'Lateral'}
              </span>
            </div>
            {analysisStats.lastAnalysisTime && (
              <div className="flex justify-between">
                <span>Última análise:</span>
                <span className="font-medium">
                  {analysisStats.lastAnalysisTime.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Buy Signal Alert */}
      {isUptrend && operatingScore > 60 && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CircleArrowUp className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-300">
            Sinal de Compra - Score: {operatingScore}%
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            {operatingScore > 80 ? 'Condições excelentes' : 'Condições favoráveis'} para entrada de compra.
            {confidenceReduction > 0 && (
              <span className="block mt-1 text-xs">
                Confiança reduzida em {confidenceReduction}% devido às condições de mercado.
              </span>
            )}
            <div className="mt-2 text-xs font-mono">
              Próximo minuto de entrada: {entryMinute}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Sell Signal Alert */}
      {isDowntrend && operatingScore > 60 && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CircleArrowDown className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-300">
            Sinal de Venda - Score: {operatingScore}%
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            {operatingScore > 80 ? 'Condições excelentes' : 'Condições favoráveis'} para entrada de venda.
            {confidenceReduction > 0 && (
              <span className="block mt-1 text-xs">
                Confiança reduzida em {confidenceReduction}% devido às condições de mercado.
              </span>
            )}
            <div className="mt-2 text-xs font-mono">
              Próximo minuto de entrada: {entryMinute}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Low Score Warning */}
      {operatingScore < 40 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Score Operacional Baixo: {operatingScore}%</AlertTitle>
          <AlertDescription>
            Condições desfavoráveis para trading. Aguarde melhores oportunidades.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LiveAnalysis;
