
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { TrendingUp, Volume, Activity, BarChart3, AlertTriangle } from 'lucide-react';
import MasterAnalysisDisplay from './MasterAnalysisDisplay';

const AnalysisResults = () => {
  const { analysisResults } = useAnalyzer();

  // PROTEÇÃO: Verificar se o hook retornou dados válidos
  if (!analysisResults) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Nenhum resultado de análise disponível.</p>
      </div>
    );
  }

  // PROTEÇÃO: Extrair dados com fallbacks seguros
  const patterns = Array.isArray(analysisResults.patterns) ? analysisResults.patterns : [];
  const marketContext = analysisResults.marketContext || null;
  const volumeData = analysisResults.volumeData || null;
  const volatilityData = analysisResults.volatilityData || null;
  const masterAnalysis = analysisResults.masterAnalysis || null;

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      {/* Patterns Section - COM PROTEÇÃO */}
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
              {patterns.map((pattern, index) => {
                // PROTEÇÃO: Validar cada padrão antes de renderizar
                if (!pattern || typeof pattern !== 'object') {
                  return null;
                }

                return (
                  <div key={`pattern-${index}`} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">
                        {pattern.type || 'Padrão'}
                      </h4>
                      <Badge variant={
                        (pattern.confidence || 0) > 0.7 ? "default" : "secondary"
                      }>
                        {Math.round((pattern.confidence || 0) * 100)}% confiança
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {pattern.description || 'Descrição não disponível'}
                    </p>
                    {pattern.action && pattern.action !== 'neutro' && (
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          pattern.action === 'compra' ? 'default' : 'destructive'
                        }>
                          {String(pattern.action).toUpperCase()}
                        </Badge>
                        {pattern.isScalpingSignal && (
                          <Badge variant="outline" className="text-xs">
                            Scalping M1
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Context - COM PROTEÇÃO */}
      {marketContext && typeof marketContext === 'object' && (
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
                <span className="font-medium">Fase:</span>{' '}
                {String(marketContext.phase || 'N/A').replace('_', ' ')}
              </div>
              <div>
                <span className="font-medium">Força:</span>{' '}
                {String(marketContext.strength || 'N/A')}
              </div>
              <div>
                <span className="font-medium">Sentimento:</span>{' '}
                {String(marketContext.sentiment || 'N/A')}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Descrição:</span>{' '}
                {String(marketContext.description || 'N/A')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volume Analysis - COM PROTEÇÃO */}
      {volumeData && typeof volumeData === 'object' && (
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
                <span className="font-medium">Valor:</span>{' '}
                {typeof volumeData.value === 'number' 
                  ? volumeData.value.toLocaleString() 
                  : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Tendência:</span>{' '}
                {String(volumeData.trend || 'N/A')}
              </div>
              <div>
                <span className="font-medium">Anormal:</span>{' '}
                {volumeData.abnormal ? 'Sim' : 'Não'}
              </div>
              <div>
                <span className="font-medium">Vs Média:</span>{' '}
                {typeof volumeData.relativeToAverage === 'number'
                  ? `${volumeData.relativeToAverage.toFixed(2)}x`
                  : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volatility Analysis - COM PROTEÇÃO */}
      {volatilityData && typeof volatilityData === 'object' && (
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
                <span className="font-medium">Valor:</span>{' '}
                {typeof volatilityData.value === 'number'
                  ? `${volatilityData.value.toFixed(2)}%`
                  : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Tendência:</span>{' '}
                {String(volatilityData.trend || 'N/A')}
              </div>
              <div>
                <span className="font-medium">ATR:</span>{' '}
                {typeof volatilityData.atr === 'number'
                  ? volatilityData.atr.toFixed(2)
                  : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Histórico:</span>{' '}
                {String(volatilityData.historicalComparison || 'N/A').replace('_', ' ')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Master Analysis Display - COM PROTEÇÃO */}
      {masterAnalysis && typeof masterAnalysis === 'object' && (
        <div className="w-full">
          <MasterAnalysisDisplay masterAnalysis={masterAnalysis} />
        </div>
      )}

      {/* Warning if no significant data - COM PROTEÇÃO */}
      {patterns.length === 0 && !masterAnalysis && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                Nenhum padrão significativo foi identificado na região selecionada.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisResults;
