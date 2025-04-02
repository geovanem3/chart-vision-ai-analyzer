
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { processImage, cropToRegion } from '@/utils/imageProcessing';
import { detectPatterns, analyzeResults } from '@/utils/patternDetection';
import { Loader2, BarChart2, RefreshCw } from 'lucide-react';

const ControlPanel = () => {
  const { 
    capturedImage, 
    selectedRegion, 
    setIsAnalyzing, 
    isAnalyzing, 
    setAnalysisResults,
    resetAnalysis
  } = useAnalyzer();
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!capturedImage || !selectedRegion) {
      toast({
        title: "Missing information",
        description: "Please capture an image and select a region first.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Process steps
      const croppedImage = await cropToRegion(capturedImage, selectedRegion);
      const processedImage = await processImage(croppedImage);
      const patterns = await detectPatterns(processedImage);
      
      // Set results
      setAnalysisResults({
        patterns,
        timestamp: Date.now(),
        imageUrl: croppedImage
      });
      
      toast({
        title: "Analysis complete",
        description: "Chart patterns have been successfully detected."
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "An error occurred while analyzing the chart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!capturedImage) return null;

  return (
    <Card className="p-4 my-4 w-full max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Chart Analysis Controls</h3>
        <Button variant="ghost" size="sm" onClick={resetAnalysis}>
          <RefreshCw className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm text-muted-foreground">Analysis Settings</h4>
          <ul className="text-sm space-y-1">
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-up mr-2"></span>
              <span>Bullish Pattern Detection</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-down mr-2"></span>
              <span>Bearish Pattern Detection</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-neutral mr-2"></span>
              <span>Support/Resistance Levels</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-line mr-2"></span>
              <span>Trend Analysis</span>
            </li>
          </ul>
        </div>
        
        <div className="flex flex-col justify-end space-y-4">
          <p className="text-sm text-muted-foreground">
            The analyzer will process the selected region and detect common trading patterns.
          </p>
          
          <Button 
            className="w-full" 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !selectedRegion}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart2 className="w-4 h-4 mr-2" />
                Analyze Chart
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ControlPanel;
