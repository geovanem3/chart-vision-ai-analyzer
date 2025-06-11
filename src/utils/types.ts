
export type PatternName = 'bullish' | 'bearish' | 'neutral';
export type Pattern = number[];

export interface TechnicalElement {
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  confidence?: number;
}

export interface CandleData {
  x: number;
  y: number;
  open: number;
  close: number;
  high: number;
  low: number;
  type: 'bullish' | 'bearish' | 'doji';
}

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
