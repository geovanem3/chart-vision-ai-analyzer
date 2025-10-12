
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { TrendingUp, Volume, Activity, BarChart3, AlertTriangle } from 'lucide-react';
import MasterAnalysisDisplay from './MasterAnalysisDisplay';
import AdvancedStrategiesDisplay from './AdvancedStrategiesDisplay';
import ComprehensiveAnalysisDisplay from './ComprehensiveAnalysisDisplay';
import SmartAnalysisDisplay from './SmartAnalysisDisplay';
import StrategicFrameworkDisplay from './StrategicFrameworkDisplay';

const AnalysisResults = () => {
  const { analysisResults } = useAnalyzer();

  console.log('AnalysisResults - analysisResults:', analysisResults);

  if (!analysisResults) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Nenhum resultado de análise disponível.</p>
      </div>
    );
  }

  const { 
    patterns = [], 
    marketContext, 
    volumeData, 
    volatilityData, 
    masterAnalysis,
    advancedStrategies = [],
    comprehensiveAnalysis,
    smartAnalysis,
    strategicFramework
  } = analysisResults;

  console.log('AnalysisResults - extracted data:', { 
    patterns, 
    marketContext, 
    volumeData, 
    volatilityData, 
    masterAnalysis 
  });

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      {/* 🧠 Smart Analysis - PRIORIDADE MÁXIMA */}
      {smartAnalysis && (
        <div className="w-full">
          <SmartAnalysisDisplay analysis={smartAnalysis} />
        </div>
      )}

      {/* 📈 Strategic Framework - SEGUNDO NÍVEL */}
      {strategicFramework && (
        <div className="w-full">
          <StrategicFrameworkDisplay framework={strategicFramework} />
        </div>
      )}

      {/* Comprehensive Analysis Display */}
      {comprehensiveAnalysis && (
        <div className="w-full">
          <ComprehensiveAnalysisDisplay analysis={comprehensiveAnalysis} />
        </div>
      )}
      {/* Patterns Section */}
      {patterns.length > 0 && (
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
                    <h4 className="font-semibold">{pattern.type || 'Padrão'}</h4>
                    <Badge variant={pattern.confidence > 0.7 ? "default" : "secondary"}>
                      {Math.round((pattern.confidence || 0) * 100)}% confiança
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{pattern.description || 'Descrição não disponível'}</p>
                  {pattern.action && pattern.action !== 'neutro' && (
                    <div className="flex items-center gap-2">
                      <Badge variant={pattern.action === 'compra' ? 'default' : 'destructive'}>
                        {pattern.action.toUpperCase()}
                      </Badge>
                      {pattern.isScalpingSignal && (
                        <Badge variant="outline" className="text-xs">
                          Scalping M1
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
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
                <span className="font-medium">Fase:</span> {(marketContext.phase || 'N/A').replace('_', ' ')}
              </div>
              <div>
                <span className="font-medium">Força:</span> {marketContext.strength || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Sentimento:</span> {marketContext.sentiment || 'N/A'}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Descrição:</span> {marketContext.description || 'N/A'}
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
                <span className="font-medium">Tendência:</span> {volumeData.trend || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Anormal:</span> {volumeData.abnormal ? 'Sim' : 'Não'}
              </div>
              <div>
                <span className="font-medium">Vs Média:</span> {volumeData.relativeToAverage?.toFixed(2) || 'N/A'}x
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
                <span className="font-medium">Valor:</span> {volatilityData.value?.toFixed(2) || 'N/A'}%
              </div>
              <div>
                <span className="font-medium">Tendência:</span> {volatilityData.trend || 'N/A'}
              </div>
              <div>
                <span className="font-medium">ATR:</span> {volatilityData.atr?.toFixed(2) || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Histórico:</span> {(volatilityData.historicalComparison || 'N/A').replace('_', ' ')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Master Analysis Display */}
      {masterAnalysis && (
        <div className="w-full">
          <MasterAnalysisDisplay masterAnalysis={masterAnalysis} />
        </div>
      )}

      {/* Advanced Strategies Display */}
      {advancedStrategies.length > 0 && (
        <div className="w-full">
          <AdvancedStrategiesDisplay strategies={advancedStrategies} />
        </div>
      )}

      {/* Warning if no significant data */}
      {patterns.length === 0 && !masterAnalysis && !comprehensiveAnalysis && !smartAnalysis && (
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
