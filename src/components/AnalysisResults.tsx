
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { analyzeResults } from '@/utils/patternDetection';
import { Info, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

const AnalysisResults = () => {
  const { analysisResults } = useAnalyzer();

  if (!analysisResults) return null;

  const { patterns, timestamp } = analysisResults;
  const overallRecommendation = analyzeResults(patterns);
  const formattedDate = new Date(timestamp).toLocaleString();

  // Determine sentiment icon based on recommendation text
  const getSentimentIcon = () => {
    const recommendation = overallRecommendation.toLowerCase();
    
    if (recommendation.includes('bullish') || recommendation.includes('upside')) {
      return <ArrowUp className="w-5 h-5 text-chart-up" />;
    } else if (recommendation.includes('bearish') || recommendation.includes('downside')) {
      return <ArrowDown className="w-5 h-5 text-chart-down" />;
    } else {
      return <ArrowRight className="w-5 h-5 text-chart-neutral" />;
    }
  };

  // Color for confidence level
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-chart-up';
    if (confidence >= 0.6) return 'bg-chart-line';
    return 'bg-chart-neutral';
  };

  return (
    <Card className="p-4 my-4 w-full max-w-3xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold">Analysis Results</h2>
          <p className="text-sm text-muted-foreground">Analyzed on {formattedDate}</p>
        </div>
        <div className="flex items-center px-3 py-1 rounded-full bg-secondary">
          {getSentimentIcon()}
          <span className="ml-2 text-sm font-medium">
            {patterns.length} patterns detected
          </span>
        </div>
      </div>
      
      <div className="gradient-border mb-6 p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Overall Assessment</h3>
            <p className="text-sm">{overallRecommendation}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="font-medium">Detected Patterns</h3>
        
        {patterns.map((pattern, index) => (
          <div key={index} className="bg-secondary/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">{pattern.type}</h4>
              <div className="text-sm">
                Confidence: {Math.round(pattern.confidence * 100)}%
              </div>
            </div>
            
            <Progress 
              value={pattern.confidence * 100} 
              className={`h-1.5 mb-3 ${getConfidenceColor(pattern.confidence)}`} 
            />
            
            <p className="text-sm mb-2">{pattern.description}</p>
            
            {pattern.recommendation && (
              <div className="text-sm text-primary">
                <span className="font-medium">Insight:</span> {pattern.recommendation}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AnalysisResults;
