
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PatternResult = {
  type: string;
  confidence: number;
  description: string;
  recommendation?: string;
  action?: 'compra' | 'venda' | 'neutro';
};

export type Point = {
  x: number;
  y: number;
};

export type TechnicalElement = {
  type: 'line' | 'arrow' | 'rectangle' | 'circle' | 'label' | 'pattern';
  color: string;
  thickness?: number;
  dashArray?: number[];
  label?: string;
} & (
  | { type: 'line', points: Point[] }
  | { type: 'arrow', start: Point, end: Point }
  | { type: 'rectangle', position: Point, width: number, height: number }
  | { type: 'circle', center: Point, radius: number }
  | { type: 'label', position: Point, text: string, backgroundColor?: string }
  | { type: 'pattern', patternType: 'OCO' | 'triangulo' | 'cunha' | 'bandeira' | 'topoduplo' | 'fundoduplo', points: Point[] }
);

export type CandleData = {
  open: number;
  high: number;
  low: number;
  close: number;
  color: 'verde' | 'vermelho';
  position: Point;
  width: number;
  height: number;
};

export type AnalysisResult = {
  patterns: PatternResult[];
  timestamp: number;
  imageUrl?: string;
  technicalElements?: TechnicalElement[];
  candles?: CandleData[];
  manualRegion?: boolean;
};

type AnalyzerContextType = {
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  analysisResults: AnalysisResult | null;
  setAnalysisResults: (results: AnalysisResult | null) => void;
  selectedRegion: { x: number; y: number; width: number; height: number } | null;
  setSelectedRegion: (region: { x: number; y: number; width: number; height: number } | null) => void;
  resetAnalysis: () => void;
  showTechnicalMarkup: boolean;
  setShowTechnicalMarkup: (show: boolean) => void;
};

const AnalyzerContext = createContext<AnalyzerContextType | undefined>(undefined);

export const AnalyzerProvider = ({ children }: { children: ReactNode }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showTechnicalMarkup, setShowTechnicalMarkup] = useState(true);

  const resetAnalysis = () => {
    setCapturedImage(null);
    setIsAnalyzing(false);
    setAnalysisResults(null);
    setSelectedRegion(null);
  };

  return (
    <AnalyzerContext.Provider
      value={{
        capturedImage,
        setCapturedImage,
        isAnalyzing,
        setIsAnalyzing,
        analysisResults,
        setAnalysisResults,
        selectedRegion,
        setSelectedRegion,
        resetAnalysis,
        showTechnicalMarkup,
        setShowTechnicalMarkup,
      }}
    >
      {children}
    </AnalyzerContext.Provider>
  );
};

export const useAnalyzer = (): AnalyzerContextType => {
  const context = useContext(AnalyzerContext);
  if (context === undefined) {
    throw new Error('useAnalyzer must be used within an AnalyzerProvider');
  }
  return context;
};
