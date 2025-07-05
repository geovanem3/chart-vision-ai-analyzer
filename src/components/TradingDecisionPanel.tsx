
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TradingDecision } from '@/utils/decisionEngine';
import { 
  TrendingUp, 
  TrendingDown, 
  Pause, 
  Clock, 
  Target, 
  Shield, 
  DollarSign,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TradingDecisionPanelProps {
  decision: TradingDecision | null;
  onExecuteDecision?: (decision: TradingDecision) => void;
  onDismissDecision?: () => void;
}

const TradingDecisionPanel = ({ 
  decision, 
  onExecuteDecision, 
  onDismissDecision 
}: TradingDecisionPanelProps) => {
  const [isExecuting, setIsExecuting] = useState(false);

  if (!decision) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <TrendingUp className="w-5 h-5" />;
      case 'SELL': return <TrendingDown className="w-5 h-5" />;
      case 'HOLD': return <Pause className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'SELL': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'HOLD': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const handleExecute = async () => {
    if (!onExecuteDecision) return;
    
    setIsExecuting(true);
    try {
      await onExecuteDecision(decision);
    } finally {
      setIsExecuting(false);
    }
  };

  const timeUntilExpiry = Math.max(0, decision.validUntil - Date.now());
  const minutesLeft = Math.floor(timeUntilExpiry / 1000 / 60);
  const secondsLeft = Math.floor((timeUntilExpiry / 1000) % 60);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                Decisão da IA de Trading
                <Badge className={getUrgencyColor(decision.urgency)}>
                  {decision.urgency}
                </Badge>
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Expira em {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Decisão Principal */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-3 mb-2">
                {getActionIcon(decision.action)}
                <span className="text-2xl font-bold">
                  {decision.action}
                </span>
              </div>
              <div className="text-lg">
                Confiança: <span className="font-semibold">{Math.round(decision.confidence * 100)}%</span>
              </div>
              {decision.positionSize && (
                <div className="text-sm text-muted-foreground mt-1">
                  Tamanho sugerido: {(decision.positionSize * 100).toFixed(1)}% do capital
                </div>
              )}
            </div>

            {/* Níveis de Trading */}
            {decision.entryPrice && (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-xs text-muted-foreground">Entrada</div>
                  <div className="font-semibold">{decision.entryPrice.toFixed(4)}</div>
                </div>
                {decision.stopLoss && (
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-xs text-muted-foreground">Stop Loss</div>
                    <div className="font-semibold">{decision.stopLoss.toFixed(4)}</div>
                  </div>
                )}
                {decision.takeProfit && (
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-xs text-muted-foreground">Take Profit</div>
                    <div className="font-semibold">{decision.takeProfit.toFixed(4)}</div>
                  </div>
                )}
              </div>
            )}

            {decision.riskReward && (
              <div className="flex items-center justify-center gap-2 p-2 bg-purple-50 rounded">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm">
                  Risk:Reward = 1:{decision.riskReward.toFixed(1)}
                </span>
              </div>
            )}

            {/* Análise dos Sinais */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Análise dos Sinais:</h4>
              
              {decision.signals.technical.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Padrões Técnicos:</div>
                  <div className="flex flex-wrap gap-1">
                    {decision.signals.technical.map((signal, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {decision.signals.priceAction.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Price Action:</div>
                  <div className="flex flex-wrap gap-1">
                    {decision.signals.priceAction.map((signal, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {decision.signals.confluence.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Confluências:</div>
                  <div className="flex flex-wrap gap-1">
                    {decision.signals.confluence.map((signal, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Raciocínio da IA */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Raciocínio da IA:</h4>
              <div className="space-y-1">
                {decision.reasoning.map((reason, index) => (
                  <div key={index} className="text-sm flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas e Avisos */}
            {decision.confidence < 0.7 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Confiança moderada. Considere aguardar confirmação adicional ou reduzir o tamanho da posição.
                </AlertDescription>
              </Alert>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-2">
              {decision.action === 'BUY' || decision.action === 'SELL' ? (
                <Button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className={`flex-1 ${getActionColor(decision.action)}`}
                >
                  {isExecuting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Executando...
                    </>
                  ) : (
                    <>
                      {getActionIcon(decision.action)}
                      <span className="ml-2">Executar {decision.action}</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button variant="outline" className="flex-1" disabled>
                  <Pause className="w-4 h-4 mr-2" />
                  {decision.action}
                </Button>
              )}
              
              {onDismissDecision && (
                <Button
                  variant="ghost"
                  onClick={onDismissDecision}
                  className="px-3"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default TradingDecisionPanel;
