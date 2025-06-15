
export interface ChartArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PriceAxis {
  minPrice: number;
  maxPrice: number;
  pixelPerPrice: number;
  axisX: number;
}

export interface DetectedCandle {
  x: number;
  y: number;
  width: number;
  height: number;
  bodyTop: number;
  bodyBottom: number;
  wickTop: number;
  wickBottom: number;
  color: 'green' | 'red' | 'black' | 'white';
  confidence: number;
}
