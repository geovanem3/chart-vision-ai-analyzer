
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Activity, AlertTriangle } from 'lucide-react';

const AnalysisResults = () => {
  const { analysisResults, isAnalyzing } = useAnalyzer();

  console.log('🔍 AnalysisResults - Estado:', { analysisResults, isAnalyzing });

  // Extrair dados simples
  const patterns = analysisResults?.patterns || [];
  const masterAnalysis = analysisResults?.masterAnalysis;

  return (
    <div className="space-y-3 w-full overflow-hidden">
      {/* Estado de carregamento */}
      {isAnalyzing && (
        <Card className="w-full">
          <CardContent className="pt-4">
            <div className="text-center">
              <Activity className="animate-spin h-6 w-6 mx-auto mb-2" />
              <p className="text-muted-foreground">🔍 Live IA Analisando...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Padrões - SIMPLES */}
      {patterns.length > 0 && (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Sinais Live IA ({patterns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {patterns.map((pattern, index) => (
                <div key={index} className="p-2 border rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">
                      {pattern.type || 'Padrão'}
                    </h4>
                    <Badge variant={
                      (pattern.confidence || 0) > 0.7 ? "default" : "secondary"
                    } className="text-xs">
                      {Math.round((pattern.confidence || 0) * 100)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {pattern.description || 'Descrição não disponível'}
                  </p>
                  {pattern.action && pattern.action !== 'neutro' && (
                    <div className="flex items-center gap-1">
                      <Badge variant={
                        pattern.action === 'compra' ? 'default' : 'destructive'
                      } className="text-xs">
                        {pattern.action.toUpperCase()}
                      </Badge>
                      {pattern.isScalpingSignal && (
                        <Badge variant="outline" className="text-xs">
                          M1 Live
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

      {/* Análise Mestre - SIMPLES */}
      {masterAnalysis && (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Live IA - Análise Mestre</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm">
              <p>{masterAnalysis.masterRecommendation || 'Processando...'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem simples quando não há dados */}
      {!isAnalyzing && patterns.length === 0 && !masterAnalysis && (
        <Card className="border-yellow-200 bg-yellow-50 w-full">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">
                Live IA aguardando. Capture gráfico para análise.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisResults;
