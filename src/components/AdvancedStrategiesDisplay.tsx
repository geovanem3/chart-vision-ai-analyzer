import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Shield,
  Zap,
  Activity,
  BarChart3,
  Brain,
  DollarSign
} from 'lucide-react';
import { AdvancedAnalysisStrategy } from '@/utils/advancedAnalysisStrategies';

interface AdvancedStrategiesDisplayProps {
  strategies: AdvancedAnalysisStrategy[];
}

const AdvancedStrategiesDisplay: React.FC<AdvancedStrategiesDisplayProps> = ({ strategies }) => {
  if (!strategies || strategies.length === 0) {
    return (
      <Card className="p-4 my-4">
        <div className="text-center text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma estratégia avançada executada</p>
        </div>
      </Card>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'institutional': return <Brain className="h-4 w-4" />;
      case 'technical': return <BarChart3 className="h-4 w-4" />;
      case 'price_action': return <Activity className="h-4 w-4" />;
      case 'market_structure': return <TrendingUp className="h-4 w-4" />;
      case 'scalping': return <Zap className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'institutional': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'technical': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'price_action': return 'bg-green-100 text-green-800 border-green-300';
      case 'market_structure': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'scalping': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'baixo': return 'bg-green-100 text-green-700';
      case 'moderado': return 'bg-yellow-100 text-yellow-700';
      case 'alto': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSignalIcon = (type: string, action: string) => {
    if (type === 'entry') {
      return action === 'compra' ? <TrendingUp className="h-4 w-4 text-green-600" /> : 
             action === 'venda' ? <TrendingDown className="h-4 w-4 text-red-600" /> :
             <Clock className="h-4 w-4 text-yellow-600" />;
    }
    if (type === 'warning') return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    if (type === 'confirmation') return <CheckCircle className="h-4 w-4 text-blue-600" />;
    return <Target className="h-4 w-4 text-gray-600" />;
  };

  const topStrategies = strategies.slice(0, 3); // Mostrar top 3

  return (
    <div className="space-y-4 my-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Estratégias Avançadas</h3>
        <Badge variant="outline" className="text-xs">
          {strategies.length} estratégias
        </Badge>
      </div>

      {topStrategies.map((strategy, index) => (
        <Card key={index} className="p-4 border-l-4 border-l-primary">
          <div className="space-y-3">
            {/* Header da estratégia */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getCategoryIcon(strategy.category)}
                <h4 className="font-medium text-base">{strategy.name}</h4>
                <Badge className={`text-xs ${getCategoryColor(strategy.category)}`}>
                  {strategy.category.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getRiskColor(strategy.riskLevel)}`}>
                  Risco: {strategy.riskLevel}
                </Badge>
                <div className="text-right">
                  <div className="text-sm font-mono font-medium">
                    {strategy.confidence}%
                  </div>
                  <Progress value={strategy.confidence} className="w-16 h-2" />
                </div>
              </div>
            </div>

            {/* Descrição */}
            <p className="text-sm text-muted-foreground">{strategy.description}</p>

            {/* Timeframes */}
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Timeframes:</span>
              <div className="flex gap-1">
                {strategy.timeframes.map((tf, i) => (
                  <Badge key={i} variant="outline" className="text-xs px-1 py-0">
                    {tf}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Padrões detectados */}
            {strategy.patterns.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">Padrões ({strategy.patterns.length}):</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {strategy.patterns.slice(0, 3).map((pattern, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                      <span className="font-medium">{pattern.type.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 ${
                            pattern.action === 'compra' ? 'text-green-700 bg-green-50' : 
                            pattern.action === 'venda' ? 'text-red-700 bg-red-50' : 
                            'text-gray-700 bg-gray-50'
                          }`}
                        >
                          {pattern.action}
                        </Badge>
                        <span className="font-mono">{Math.round(pattern.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                  {strategy.patterns.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{strategy.patterns.length - 3} mais padrões...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sinais */}
            {strategy.signals.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">Sinais ({strategy.signals.length}):</span>
                </div>
                <div className="space-y-1">
                  {strategy.signals.map((signal, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        signal.type === 'entry' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' :
                        signal.type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200' :
                        signal.type === 'confirmation' ? 'bg-green-50 dark:bg-green-900/20 border-green-200' :
                        'bg-gray-50 dark:bg-gray-800 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getSignalIcon(signal.type, signal.action)}
                        <div>
                          <div className="text-sm font-medium">
                            {signal.type.toUpperCase()}: {signal.action.toUpperCase()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {signal.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-medium">
                          {signal.strength}%
                        </div>
                        {signal.timeframe && (
                          <div className="text-xs text-muted-foreground">
                            {signal.timeframe}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}

      {/* Resumo das estratégias restantes */}
      {strategies.length > 3 && (
        <Card className="p-3 bg-muted/30">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              +{strategies.length - 3} estratégias adicionais executadas
            </p>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span>Confiança média: {Math.round(strategies.reduce((acc, s) => acc + s.confidence, 0) / strategies.length)}%</span>
              <span>Total de padrões: {strategies.reduce((acc, s) => acc + s.patterns.length, 0)}</span>
              <span>Total de sinais: {strategies.reduce((acc, s) => acc + s.signals.length, 0)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdvancedStrategiesDisplay;