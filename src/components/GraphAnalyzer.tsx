
import React from 'react';
import CameraView from './CameraView';
import ChartRegionSelector from './ChartRegionSelector';
import ControlPanel from './ControlPanel';
import AnalysisResults from './AnalysisResults';
import { useAnalyzer } from '@/context/AnalyzerContext';

const GraphAnalyzer = () => {
  const { capturedImage, analysisResults } = useAnalyzer();

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!capturedImage ? (
        <>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Capture Chart Image</h2>
            <p className="text-muted-foreground">
              Use your camera to take a picture of a financial chart for analysis.
            </p>
          </div>
          <CameraView />
        </>
      ) : (
        <div className="space-y-2">
          {!analysisResults ? (
            <>
              <ChartRegionSelector />
              <ControlPanel />
            </>
          ) : (
            <AnalysisResults />
          )}
        </div>
      )}
    </div>
  );
};

export default GraphAnalyzer;
