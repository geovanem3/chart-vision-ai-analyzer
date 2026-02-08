import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { TrendingUp, TrendingDown, Activity, Target, AlertTriangle, Shield, BarChart3, Database, Clock } from 'lucide-react';

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
    id,
    patterns = [], 
    marketContext, 
    supportLevels = [],
    resistanceLevels = [],
    recommendation,
    warnings = [],
    savedToDb,
    timestamp,
    source
  } = analysisResults;

  const getActionColor = (action: string) => {
    switch (action) {
      case 'compra': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'venda': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'baixo': return 'text-green-400';
      case 'médio': return 'text-yellow-400';
      case 'alto': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      {/* Fonte da análise e status */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>{new Date(timestamp).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          {source && source !== 'ai' && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-xs">
              <Database className="h-3 w-3 mr-1" />
              {source === 'database_fallback' ? 'Dados Salvos' : 
               source === 'pattern_library_fallback' ? 'Biblioteca' : 'Fallback'}
            </Badge>
          )}
          {savedToDb && (
            <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
              <Database className="h-3 w-3 mr-1" />
              Salvo
            </Badge>
          )}
        </div>
      </div>

      {/* Banner de fallback quando IA está indisponível */}
      {source && source !== 'ai' && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-2">
              <Database className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-400">
                  IA temporariamente indisponível
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {source === 'database_fallback' 
                    ? 'Exibindo sua última análise salva no banco de dados. O app continua funcionando normalmente.'
                    : source === 'pattern_library_fallback'
                    ? 'Exibindo dados da biblioteca de padrões como referência. Não reflete o gráfico atual.'
                    : 'Análise padrão gerada automaticamente. Aguarde a IA voltar para análises precisas.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendação Principal */}
      {recommendation && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Recomendação da IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={`text-lg px-4 py-2 ${getActionColor(recommendation.action)}`}>
                  {recommendation.action === 'compra' && <TrendingUp className="h-4 w-4 mr-2" />}
                  {recommendation.action === 'venda' && <TrendingDown className="h-4 w-4 mr-2" />}
                  {recommendation.action.toUpperCase()}
                </Badge>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(recommendation.confidence * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Confiança</div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recommendation.reasoning}
              </p>
              
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Risco:</span>
                <span className={`font-medium ${getRiskColor(recommendation.riskLevel)}`}>
                  {recommendation.riskLevel.toUpperCase()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contexto de Mercado */}
      {marketContext && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5" />
              Contexto de Mercado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground text-xs">Tendência</span>
                <div className="font-medium flex items-center gap-1">
                  {marketContext.trend === 'bullish' && <TrendingUp className="h-4 w-4 text-green-400" />}
                  {marketContext.trend === 'bearish' && <TrendingDown className="h-4 w-4 text-red-400" />}
                  {marketContext.trend === 'bullish' ? 'Alta' : 
                   marketContext.trend === 'bearish' ? 'Baixa' : 'Lateral'}
                </div>
              </div>
              <div className="p-2 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground text-xs">Força</span>
                <div className="font-medium">
                  {Math.round(marketContext.trendStrength * 100)}%
                </div>
              </div>
              <div className="p-2 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground text-xs">Fase</span>
                <div className="font-medium capitalize">{marketContext.phase}</div>
              </div>
              <div className="p-2 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground text-xs">Volatilidade</span>
                <div className="font-medium capitalize">{marketContext.volatility}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Níveis de Suporte e Resistência */}
      {(supportLevels.length > 0 || resistanceLevels.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" />
              Níveis Técnicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resistanceLevels.length > 0 && (
                <div>
                  <span className="text-xs text-red-400 font-medium">RESISTÊNCIAS</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {resistanceLevels.map((level, i) => (
                      <Badge key={i} variant="outline" className="text-red-400 border-red-400/30">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {supportLevels.length > 0 && (
                <div>
                  <span className="text-xs text-green-400 font-medium">SUPORTES</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {supportLevels.map((level, i) => (
                      <Badge key={i} variant="outline" className="text-green-400 border-green-400/30">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Padrões Identificados */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5" />
              Padrões Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patterns.map((pattern, index) => (
                <div key={index} className="p-3 border rounded-lg bg-secondary/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{pattern.type}</h4>
                    <Badge variant={pattern.confidence > 0.7 ? "default" : "secondary"}>
                      {Math.round(pattern.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{pattern.description}</p>
                  {pattern.action && pattern.action !== 'neutro' && (
                    <Badge className={`mt-2 ${getActionColor(pattern.action)}`}>
                      {pattern.action.toUpperCase()}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avisos */}
      {warnings.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="space-y-1">
                {warnings.map((warning, i) => (
                  <p key={i} className="text-sm text-yellow-400">{warning}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem se não há dados */}
      {patterns.length === 0 && !recommendation && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Nenhum padrão foi identificado na imagem.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisResults;
