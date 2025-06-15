
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const AnalysisResults = () => {
  const { analysisResults } = useAnalyzer();

  // O componente pai (GraphAnalyzer) agora garante que este componente
  // seja renderizado apenas quando `analysisResults` estiver disponível.
  // Esta verificação é uma salvaguarda.
  if (!analysisResults) {
    return (
      <Card className="w-full border-yellow-200 bg-yellow-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Aguardando resultados da análise...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Lógica para exibir os resultados, que sabemos que existem neste ponto.
  const hasPatterns = analysisResults.patterns && analysisResults.patterns.length > 0;
  
  return (
    <div className="space-y-3 w-full">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Live IA Resultados ({analysisResults.patterns?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {hasPatterns ? (
            analysisResults.patterns.slice(0, 3).map((pattern, index) => (
              <div key={index} className="p-2 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{pattern.type || 'Padrão'}</span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round((pattern.confidence || 0) * 100)}% Conf.
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
            ))
          ) : (
            <div className="flex items-center gap-2 text-yellow-800 p-3 bg-yellow-50 rounded-lg">
              <Info className="h-4 w-4" />
              <span className="text-xs font-medium">Nenhum padrão técnico foi detectado na imagem.</span>
            </div>
          )}
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
};

export default AnalysisResults;
