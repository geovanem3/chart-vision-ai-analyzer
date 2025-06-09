
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { TrendingUp, Target, AlertTriangle, Volume, Activity, Clock, BarChart3, BookOpen } from 'lucide-react';
import MasterAnalysisDisplay from './MasterAnalysisDisplay';

const AnalysisResults = () => {
  const { analysisResults } = useAnalyzer();

  if (!analysisResults) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Nenhum resultado de análise disponível.</p>
      </div>
    );
  }

  const { 
    patterns, 
    marketContext, 
    volumeData, 
    volatilityData, 
    preciseEntryAnalysis,
    masterAnalysis 
  } = analysisResults;

  console.log('AnalysisResults - masterAnalysis:', masterAnalysis);

  return (
    <div className="space-y-4">
      {/* Patterns Section */}
      {patterns && patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Padrões Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patterns.map((pattern, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{pattern.type}</h4>
                    <Badge variant={pattern.confidence > 0.7 ? "default" : "secondary"}>
                      {(pattern.confidence * 100).toFixed(0)}% confiança
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                  {pattern.action && (
                    <div className="flex items-center gap-2">
                      <Badge variant={pattern.action === 'compra' ? 'default' : pattern.action === 'venda' ? 'destructive' : 'secondary'}>
                        {pattern.action.toUpperCase()}
                      </Badge>
                      {pattern.isScalpingSignal && (
                        <Badge variant="outline" className="text-xs">
                          Scalping M1
                        </Badge>
                      )}
                    </div>
                  )}
                  {pattern.recommendation && (
                    <p className="text-xs mt-2 text-muted-foreground">{pattern.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Precise Entry Analysis */}
      {preciseEntryAnalysis && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Clock className="h-5 w-5" />
              Análise de Entrada Precisa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Horário exato:</span> {preciseEntryAnalysis.exactMinute}
              </div>
              <div>
                <span className="font-medium">Tipo de entrada:</span> {preciseEntryAnalysis.entryType.replace('_', ' de ')}
              </div>
              <div className="col-span-full">
                <span className="font-medium">Próxima vela:</span> {preciseEntryAnalysis.nextCandleExpectation}
              </div>
              <div className="col-span-full">
                <span className="font-medium">Price Action:</span> {preciseEntryAnalysis.priceAction}
              </div>
              <div className="col-span-full">
                <span className="font-medium">Sinal de confirmação:</span> {preciseEntryAnalysis.confirmationSignal}
              </div>
              <div>
                <span className="font-medium">Risk/Reward:</span> 1:{preciseEntryAnalysis.riskRewardRatio.toFixed(1)}
              </div>
              <div className="col-span-full mt-2 p-2 bg-green-100 rounded text-green-800">
                <span className="font-medium">Instruções:</span> {preciseEntryAnalysis.entryInstructions}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Context */}
      {marketContext && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Contexto de Mercado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fase:</span> {marketContext.phase.replace('_', ' ')}
              </div>
              <div>
                <span className="font-medium">Força:</span> {marketContext.strength}
              </div>
              <div>
                <span className="font-medium">Sentimento:</span> {marketContext.sentiment}
              </div>
              <div>
                <span className="font-medium">Estrutura:</span> {marketContext.marketStructure?.replace('_', ' ') || 'N/A'}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Descrição:</span> {marketContext.description}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volume Analysis */}
      {volumeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume className="h-5 w-5" />
              Análise de Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Valor:</span> {volumeData.value?.toLocaleString() || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Tendência:</span> {volumeData.trend}
              </div>
              <div>
                <span className="font-medium">Anormal:</span> {volumeData.abnormal ? 'Sim' : 'Não'}
              </div>
              <div>
                <span className="font-medium">Vs Média:</span> {volumeData.relativeToAverage?.toFixed(2)}x
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volatility Analysis */}
      {volatilityData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Análise de Volatilidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Valor:</span> {volatilityData.value?.toFixed(2)}%
              </div>
              <div>
                <span className="font-medium">Tendência:</span> {volatilityData.trend}
              </div>
              <div>
                <span className="font-medium">ATR:</span> {volatilityData.atr?.toFixed(2) || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Histórico:</span> {volatilityData.historicalComparison?.replace('_', ' ') || 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Master Analysis Display */}
      {masterAnalysis && <MasterAnalysisDisplay masterAnalysis={masterAnalysis} />}

      {/* Warning if no significant data */}
      {(!patterns || patterns.length === 0) && !masterAnalysis && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Nenhum padrão significativo foi identificado na região selecionada.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisResults;
