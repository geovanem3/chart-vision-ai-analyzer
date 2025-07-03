
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Activity, 
  Target,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Zap,
  Eye
} from 'lucide-react';

interface Pattern {
  pattern: string;
  confidence: number;
  action: 'compra' | 'venda' | 'neutro';
  description: string;
  recommendation: string;
}

interface MobileAnalysisPanelProps {
  patterns: Pattern[];
  isAnalyzing: boolean;
  onQuickAction?: (action: 'buy' | 'sell' | 'watch') => void;
  confidence?: number;
}

const MobileAnalysisPanel = ({ 
  patterns, 
  isAnalyzing, 
  onQuickAction,
  confidence = 0 
}: MobileAnalysisPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);

  const dominantPattern = patterns.length > 0 ? patterns[0] : null;
  const hasHighConfidence = dominantPattern && dominantPattern.confidence > 0.7;

  const getActionColor = (action: string) => {
    switch (action) {
      case 'compra': return 'text-green-500 bg-green-500/10';
      case 'venda': return 'text-red-500 bg-red-500/10';
      default: return 'text-yellow-500 bg-yellow-500/10';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'compra': return <TrendingUp className="w-4 h-4" />;
      case 'venda': return <TrendingDown className="w-4 h-4" />;
      default: return <BarChart2 className="w-4 h-4" />;
    }
  };

  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-20 left-4 right-4 z-40"
      >
        <Card className="p-6 bg-background/95 backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-lg font-medium">Analisando gráfico...</span>
          </div>
          <div className="mt-3 bg-muted/50 rounded-full h-2">
            <div className="bg-primary h-full rounded-full animate-pulse w-3/4"></div>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (!dominantPattern) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 left-4 right-4 z-40"
    >
      <Card className="bg-background/95 backdrop-blur-sm border-primary/20 overflow-hidden">
        {/* Header - Always Visible */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getActionIcon(dominantPattern.action)}
              <span className="font-semibold text-lg">{dominantPattern.pattern}</span>
              {hasHighConfidence && <Zap className="w-4 h-4 text-yellow-500" />}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </Button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <Badge className={`${getActionColor(dominantPattern.action)} border-0 text-sm px-3 py-1`}>
              {dominantPattern.action.toUpperCase()}
            </Badge>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Confiança:</span>
              <Badge variant="outline" className="text-sm">
                {Math.round(dominantPattern.confidence * 100)}%
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onQuickAction?.('buy')}
              className="flex-1 h-10 bg-green-500 hover:bg-green-600 text-white"
              disabled={dominantPattern.action !== 'compra'}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Comprar
            </Button>
            <Button
              size="sm"
              onClick={() => onQuickAction?.('sell')}
              className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white"
              disabled={dominantPattern.action !== 'venda'}
            >
              <TrendingDown className="w-4 h-4 mr-1" />
              Vender
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickAction?.('watch')}
              className="h-10 px-3"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-border/50"
            >
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Descrição</h4>
                  <p className="text-sm">{dominantPattern.description}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Recomendação</h4>
                  <p className="text-sm">{dominantPattern.recommendation}</p>
                </div>

                {patterns.length > 1 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      Outros Padrões ({patterns.length - 1})
                    </h4>
                    <div className="space-y-2">
                      {patterns.slice(1, 3).map((pattern, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-sm">{pattern.pattern}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(pattern.confidence * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasHighConfidence && (
                  <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        <span className="font-medium">Confiança Moderada:</span> Considere aguardar confirmação adicional antes de tomar decisões.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default MobileAnalysisPanel;
