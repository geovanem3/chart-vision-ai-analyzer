
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { TrendingUp, Volume, Activity, BarChart3, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import MasterAnalysisDisplay from './MasterAnalysisDisplay';

const AnalysisResults = () => {
  const { analysisResults, isAnalyzing } = useAnalyzer();
  const isMobile = useIsMobile();

  console.log('🔍 AnalysisResults - Estado atual:', { analysisResults, isAnalyzing });

  // PROTEÇÃO CORRIGIDA: Só retorna mensagem se NÃO está analisando E não tem resultados
  if (!analysisResults && !isAnalyzing) {
    console.log('⚠️ AnalysisResults - Nenhum resultado e não está analisando');
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Nenhum resultado de análise disponível.</p>
      </div>
    );
  }

  // Se está analisando mas ainda não tem resultados, mostra estado de carregamento
  if (isAnalyzing && !analysisResults) {
    console.log('📊 AnalysisResults - Analisando, aguardando resultados...');
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Analisando gráfico...</p>
      </div>
    );
  }

  // PROTEÇÃO: Extrair dados com fallbacks seguros (só se tiver analysisResults)
  const patterns = analysisResults?.patterns && Array.isArray(analysisResults.patterns) ? analysisResults.patterns : [];
  const marketContext = analysisResults?.marketContext || null;
  const volumeData = analysisResults?.volumeData || null;
  const volatilityData = analysisResults?.volatilityData || null;
  const masterAnalysis = analysisResults?.masterAnalysis || null;

  console.log('📊 AnalysisResults - Dados extraídos:', {
    patternsCount: patterns.length,
    hasMarketContext: !!marketContext,
    hasVolumeData: !!volumeData,
    hasVolatilityData: !!volatilityData,
    hasMasterAnalysis: !!masterAnalysis
  });

  // Mobile-specific structure
  if (isMobile) {
    return (
      <div className="space-y-3 w-full overflow-hidden">
        {/* Patterns Section - Mobile Layout */}
        {patterns.length > 0 && (
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Padrões ({patterns.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {patterns.map((pattern, index) => {
                  if (!pattern || typeof pattern !== 'object') {
                    console.warn(`⚠️ Padrão ${index} inválido:`, pattern);
                    return null;
                  }

                  return (
                    <div key={`pattern-${index}`} className="p-2 border rounded text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">
                          {String(pattern.type || 'Padrão')}
                        </h4>
                        <Badge variant={
                          (pattern.confidence || 0) > 0.7 ? "default" : "secondary"
                        } className="text-xs">
                          {Math.round((pattern.confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {String(pattern.description || 'Descrição não disponível')}
                      </p>
                      {pattern.action && pattern.action !== 'neutro' && (
                        <div className="flex items-center gap-1">
                          <Badge variant={
                            pattern.action === 'compra' ? 'default' : 'destructive'
                          } className="text-xs">
                            {String(pattern.action).toUpperCase()}
                          </Badge>
                          {pattern.isScalpingSignal && (
                            <Badge variant="outline" className="text-xs">
                              M1
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

        {/* Market Context - Mobile Compact */}
        {marketContext && typeof marketContext === 'object' && (
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Contexto
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium">Fase:</span>
                  <span>{String(marketContext.phase || 'N/A').replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Força:</span>
                  <span>{String(marketContext.strength || 'N/A')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sentimento:</span>
                  <span>{String(marketContext.sentiment || 'N/A')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Volume and Volatility - Combined for Mobile */}
        {(volumeData || volatilityData) && (
          <div className="grid grid-cols-2 gap-2">
            {volumeData && typeof volumeData === 'object' && (
              <Card className="w-full">
                <CardHeader className="pb-1">
                  <CardTitle className="flex items-center gap-1 text-sm">
                    <Volume className="h-3 w-3" />
                    Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="font-medium">Valor: </span>
                      {typeof volumeData.value === 'number' 
                        ? volumeData.value.toLocaleString() 
                        : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Tendência: </span>
                      {String(volumeData.trend || 'N/A')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {volatilityData && typeof volatilityData === 'object' && (
              <Card className="w-full">
                <CardHeader className="pb-1">
                  <CardTitle className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-3 w-3" />
                    Volatilidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="font-medium">Valor: </span>
                      {typeof volatilityData.value === 'number'
                        ? `${volatilityData.value.toFixed(2)}%`
                        : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">ATR: </span>
                      {typeof volatilityData.atr === 'number'
                        ? volatilityData.atr.toFixed(2)
                        : 'N/A'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Master Analysis - Mobile Optimized */}
        {masterAnalysis && typeof masterAnalysis === 'object' && (
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Análise Mestre</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm">
                <p>{String(masterAnalysis.masterRecommendation || 'Análise em progresso...')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning if no data and not analyzing - Mobile */}
        {patterns.length === 0 && !masterAnalysis && !isAnalyzing && (
          <Card className="border-yellow-200 bg-yellow-50 w-full">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">
                  Nenhum padrão identificado na região selecionada.
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Desktop Layout - REUSING the same variables declared above
  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      {/* Patterns Section - COM PROTEÇÃO */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Padrões Identificados ({patterns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patterns.map((pattern, index) => {
                if (!pattern || typeof pattern !== 'object') {
                  console.warn(`⚠️ Padrão ${index} inválido:`, pattern);
                  return null;
                }

                console.log(`📈 Renderizando padrão ${index}:`, pattern);

                return (
                  <div key={`pattern-${index}`} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">
                        {String(pattern.type || 'Padrão')}
                      </h4>
                      <Badge variant={
                        (pattern.confidence || 0) > 0.7 ? "default" : "secondary"
                      }>
                        {Math.round((pattern.confidence || 0) * 100)}% confiança
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {String(pattern.description || 'Descrição não disponível')}
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

      {masterAnalysis && typeof masterAnalysis === 'object' && (
        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>Análise Mestre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p>{String(masterAnalysis.masterRecommendation || 'Análise em progresso...')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {patterns.length === 0 && !masterAnalysis && !isAnalyzing && (
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
