
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PatternResult = {
  type: string;
  confidence: number;
  description: string;
  recommendation?: string;
};

export type AnalysisResult = {
  patterns: PatternResult[];
  timestamp: number;
  imageUrl?: string;
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
};

const AnalyzerContext = createContext<AnalyzerContextType | undefined>(undefined);

export const AnalyzerProvider = ({ children }: { children: ReactNode }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

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
