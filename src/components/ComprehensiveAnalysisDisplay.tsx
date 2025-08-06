import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ComprehensiveAnalysisResult } from '@/utils/comprehensiveAnalysis';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Brain, 
  Building2, 
  BarChart3,
  Clock,
  AlertTriangle,
  Target,
  Shield
} from 'lucide-react';

interface ComprehensiveAnalysisDisplayProps {
  analysis: ComprehensiveAnalysisResult;
}

const ComprehensiveAnalysisDisplay: React.FC<ComprehensiveAnalysisDisplayProps> = ({ analysis }) => {
  const getDirectionColor = (direction: string) => {
    if (direction.includes('buy')) return 'text-green-600 dark:text-green-400';
    if (direction.includes('sell')) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getDirectionIcon = (direction: string) => {
    if (direction.includes('buy')) return <TrendingUp className="h-4 w-4" />;
    if (direction.includes('sell')) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'very_low': return 'text-green-600';
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'very_high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Final Recommendation */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recomendação Final
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`flex items-center justify-center gap-2 mb-2 ${getDirectionColor(analysis.finalRecommendation.direction)}`}>
                {getDirectionIcon(analysis.finalRecommendation.direction)}
                <span className="font-bold text-lg">
                  {analysis.finalRecommendation.direction.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <Badge variant="outline">
                {Math.round(analysis.finalRecommendation.confidence * 100)}% confiança
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Horizonte</div>
              <Badge variant="secondary">
                {analysis.finalRecommendation.timeHorizon.toUpperCase()}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Risco</div>
              <Badge variant="outline" className={getRiskColor(analysis.finalRecommendation.riskLevel)}>
                {analysis.finalRecommendation.riskLevel.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Entrada</div>
              <div className="font-mono text-sm">
                {analysis.finalRecommendation.optimalEntry.primary.toFixed(4)}
              </div>
            </div>
          </div>
          
          {analysis.finalRecommendation.keyFactors.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Fatores-chave:</div>
              <div className="flex flex-wrap gap-1">
                {analysis.finalRecommendation.keyFactors.map((factor, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {analysis.finalRecommendation.warnings.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Avisos:</span>
              </div>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {analysis.finalRecommendation.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confluence Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Score de Confluência ({analysis.confluence.total.toFixed(0)}/100)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={analysis.confluence.total} className="h-3" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Técnica</div>
                <Progress value={analysis.confluence.breakdown.technical} className="h-2" />
                <div className="text-xs mt-1">{analysis.confluence.breakdown.technical.toFixed(0)}%</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Fundamental</div>
                <Progress value={analysis.confluence.breakdown.fundamental} className="h-2" />
                <div className="text-xs mt-1">{analysis.confluence.breakdown.fundamental.toFixed(0)}%</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Psicológica</div>
                <Progress value={analysis.confluence.breakdown.psychological} className="h-2" />
                <div className="text-xs mt-1">{analysis.confluence.breakdown.psychological.toFixed(0)}%</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Institucional</div>
                <Progress value={analysis.confluence.breakdown.institutional} className="h-2" />
                <div className="text-xs mt-1">{analysis.confluence.breakdown.institutional.toFixed(0)}%</div>
              </div>
            </div>
            
            <Badge variant={analysis.confluence.weight === 'very_high' ? 'default' : 'secondary'}>
              Peso: {analysis.confluence.weight.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Structural Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Análise Estrutural
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Estrutura de Mercado</div>
              <Badge variant={analysis.structural.marketStructure === 'HH_HL' ? 'default' : 
                             analysis.structural.marketStructure === 'LH_LL' ? 'destructive' : 'secondary'}>
                {analysis.structural.marketStructure.replace('_', ' ')}
              </Badge>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Suporte/Resistência</div>
              <div className="text-xs text-muted-foreground">
                {analysis.structural.supportResistance.length} níveis identificados
              </div>
            </div>
          </div>
          
          {analysis.structural.keyZones.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Zonas-chave</div>
              <div className="space-y-2">
                {analysis.structural.keyZones.slice(0, 3).map((zone, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{zone.type} ({zone.quality})</span>
                    <span className="font-mono">
                      {zone.zone[0].toFixed(4)} - {zone.zone[1].toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Momentum Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análise de Momentum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Velocidade do Preço</div>
              <Badge variant={analysis.momentum.priceVelocity.acceleration === 'increasing' ? 'default' : 
                             analysis.momentum.priceVelocity.acceleration === 'decreasing' ? 'destructive' : 'secondary'}>
                {analysis.momentum.priceVelocity.acceleration.replace('_', ' ')}
              </Badge>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Fluxo de Volume</div>
              <Badge variant={analysis.momentum.volumeMomentum.netFlow === 'bullish' ? 'default' : 
                             analysis.momentum.volumeMomentum.netFlow === 'bearish' ? 'destructive' : 'secondary'}>
                {analysis.momentum.volumeMomentum.netFlow}
              </Badge>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Volatilidade</div>
              <Badge variant={analysis.momentum.volatilityExpansion.phase === 'expansion' ? 'destructive' : 'secondary'}>
                {analysis.momentum.volatilityExpansion.phase.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Psychological Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análise Psicológica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Índice Medo & Ganância</div>
              <div className="flex items-center gap-2">
                <Progress value={analysis.psychological.fearGreedIndex.value} className="flex-1 h-2" />
                <span className="text-xs font-mono">{analysis.psychological.fearGreedIndex.value}</span>
              </div>
              <Badge variant="outline" className="mt-1">
                {analysis.psychological.fearGreedIndex.sentiment.replace('_', ' ')}
              </Badge>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Armadilhas Retail</div>
              {analysis.psychological.retailTraps.length > 0 ? (
                <div className="space-y-1">
                  {analysis.psychological.retailTraps.map((trap, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {trap.type.replace('_', ' ')} ({Math.round(trap.probability * 100)}%)
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Nenhuma detectada</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Institutional Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Análise Institucional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Smart Money</div>
              <Badge variant={analysis.institutional.smartMoney.activity === 'accumulation' ? 'default' : 
                             analysis.institutional.smartMoney.activity === 'distribution' ? 'destructive' : 'secondary'}>
                {analysis.institutional.smartMoney.activity}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                Confiança: {Math.round(analysis.institutional.smartMoney.confidence * 100)}%
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Movimentos Whale</div>
              {analysis.institutional.whaleMovements.length > 0 ? (
                <div className="space-y-1">
                  {analysis.institutional.whaleMovements.map((movement, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {movement.type.replace('_', ' ')} - {movement.impact}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Nenhum detectado</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Análise Sazonal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Horário</div>
              <Badge variant="outline">{analysis.seasonal.timeOfDay.phase.replace('_', ' ')}</Badge>
              <div className="text-xs text-muted-foreground mt-1">
                {analysis.seasonal.timeOfDay.typical_behavior}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Padrão Semanal</div>
              <Badge variant="outline">{analysis.seasonal.weeklyPattern.day}</Badge>
              <div className="text-xs text-muted-foreground mt-1">
                Bias: {analysis.seasonal.weeklyPattern.historical_bias}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Período Mensal</div>
              <Badge variant="outline">{analysis.seasonal.monthlyTrend.period}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Fluxo de Ordens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Desequilíbrio Bid/Ask</div>
              <div className="text-sm">
                Ratio: {analysis.orderFlow.bidAskImbalance.ratio.toFixed(2)}
              </div>
              <Badge variant="outline" className="mt-1">
                {analysis.orderFlow.bidAskImbalance.trend}
              </Badge>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Pools de Liquidez</div>
              <div className="text-xs text-muted-foreground">
                {analysis.orderFlow.liquidityPools.length} pools identificados
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveAnalysisDisplay;