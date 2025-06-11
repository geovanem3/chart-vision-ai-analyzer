
export type PatternName = 'bullish' | 'bearish' | 'neutral';
export type Pattern = number[];

export interface DetectedPattern {
  type: string;
  action: 'compra' | 'venda' | 'neutro';
  confidence: number;
  description: string;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
