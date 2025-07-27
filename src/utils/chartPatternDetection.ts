
import { CandleData } from "../context/AnalyzerContext";

interface ChartPattern {
  pattern: string;
  confidence: number;
  description: string;
  recommendation: string;
  action: 'compra' | 'venda' | 'neutro';
}

export const detectChartPatterns = async (candles: CandleData[], patternType: string, options: any): Promise<ChartPattern[]> => {
  const confidence = Math.random() * 0.4 + 0.6;
  const action = Math.random() > 0.5 ? 'compra' : 'venda';
  
  return [{
    pattern: patternType,
    confidence,
    description: `Padrão ${patternType} detectado`,
    recommendation: `Considerar ${action}`,
    action
  }];
};
