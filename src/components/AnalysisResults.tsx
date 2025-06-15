
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';

const AnalysisResults = () => {
  const { analysisResults, isAnalyzing } = useAnalyzer();

  console.log('🔍 AnalysisResults - Estado atual:', { 
    hasResults: !!analysisResults, 
    isAnalyzing,
    patternsCount: analysisResults?.patterns?.length || 0,
    hasMasterAnalysis: !!analysisResults?.masterAnalysis
  });

  // Estado de carregamento
  if (isAnalyzing) {
    return (
      <Card className="w-full border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Activity className="animate-spin h-4 w-4" />
            <span className="text-sm font-medium">Live IA Analisando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado com resultados
  if (analysisResults?.patterns && analysisResults.patterns.length > 0) {
    return (
      <div className="space-y-3 w-full">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Live IA Resultados ({analysisResults.patterns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {analysisResults.patterns.slice(0, 3).map((pattern, index) => (
              <div key={index} className="p-2 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{pattern.type || 'Padrão'}</span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round((pattern.confidence || 0) * 100)}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{pattern.description}</p>
                {pattern.action && pattern.action !== 'neutro' && (
                  <Badge 
                    variant={pattern.action === 'compra' ? 'default' : 'destructive'} 
                    className="text-xs mt-1"
                  >
                    {pattern.action.toUpperCase()}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {analysisResults.masterAnalysis?.masterRecommendation && (
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">🧠 Live IA Master</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm">{analysisResults.masterAnalysis.masterRecommendation}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Estado vazio
  return (
    <Card className="w-full border-yellow-200 bg-yellow-50">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs">Live IA aguardando gráfico para análise</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisResults;
