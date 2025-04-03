import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { analyzeResults, generateTechnicalMarkup } from '@/utils/patternDetection';
import { Info, ArrowUp, ArrowDown, ArrowRight, BarChart2, ZoomIn, ZoomOut } from 'lucide-react';
import ChartMarkup from './ChartMarkup';
import { useLanguage } from '@/context/LanguageContext';
import { Slider } from '@/components/ui/slider';

const AnalysisResults = () => {
  const { 
    analysisResults, 
    setAnalysisResults, 
    showTechnicalMarkup, 
    setShowTechnicalMarkup,
    markupSize,
    setMarkupSize
  } = useAnalyzer();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (analysisResults && imageRef.current && imageRef.current.complete && !analysisResults.technicalElements) {
      const width = imageRef.current.naturalWidth;
      const height = imageRef.current.naturalHeight;
      
      setImageSize({ width, height });
      
      const elements = generateTechnicalMarkup(analysisResults.patterns, width, height);
      
      setAnalysisResults({
        ...analysisResults,
        technicalElements: elements
      });
    }
  }, [analysisResults, setAnalysisResults]);

  const handleImageLoad = () => {
    if (imageRef.current && analysisResults) {
      const width = imageRef.current.naturalWidth;
      const height = imageRef.current.naturalHeight;
      
      setImageSize({ width, height });
      
      if (!analysisResults.technicalElements) {
        const elements = generateTechnicalMarkup(analysisResults.patterns, width, height);
        
        setAnalysisResults({
          ...analysisResults,
          technicalElements: elements
        });
      }
    }
  };

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    setMarkupSize(size);
  };

  if (!analysisResults) return null;

  const { patterns, timestamp } = analysisResults;
  const overallRecommendation = analyzeResults(patterns);
  const formattedDate = new Date(timestamp).toLocaleString('pt-BR');

  const groupPatternsByCategory = (patterns = []) => {
    const categories = {
      'Tendência': [],
      'Formação de Preço': [],
      'Suporte/Resistência': [],
      'Teoria de Dow': [],
      'Ondas de Elliott': [],
      'Linha de Tendência': [],
      'Outros': []
    };
    
    patterns.forEach(pattern => {
      if (pattern.type.includes('Tendência')) {
        categories['Tendência'].push(pattern);
      } else if (['Triângulo', 'OCO', 'Cunha', 'Bandeira', 'Topo/Fundo Duplo'].includes(pattern.type)) {
        categories['Formação de Preço'].push(pattern);
      } else if (pattern.type.includes('Suporte/Resistência')) {
        categories['Suporte/Resistência'].push(pattern);
      } else if (pattern.type.includes('Dow')) {
        categories['Teoria de Dow'].push(pattern);
      } else if (pattern.type.includes('Elliott')) {
        categories['Ondas de Elliott'].push(pattern);
      } else if (pattern.type.includes('Tendência')) {
        categories['Linha de Tendência'].push(pattern);
      } else {
        categories['Outros'].push(pattern);
      }
    });
    
    return Object.entries(categories)
      .filter(([_, patterns]) => patterns.length > 0)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  };

  const groupedPatterns = groupPatternsByCategory(patterns);

  const getSentimentIcon = () => {
    const recommendation = overallRecommendation.toLowerCase();
    
    if (recommendation.includes('alta') || recommendation.includes('compra')) {
      return <ArrowUp className="w-5 h-5 text-chart-up" />;
    } else if (recommendation.includes('baixa') || recommendation.includes('downside')) {
      return <ArrowDown className="w-5 h-5 text-chart-down" />;
    } else {
      return <ArrowRight className="w-5 h-5 text-chart-neutral" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-chart-up';
    if (confidence >= 0.6) return 'bg-chart-line';
    return 'bg-chart-neutral';
  };
  
  const getActionBadge = (action?: 'compra' | 'venda' | 'neutro') => {
    switch(action) {
      case 'compra':
        return <span className="ml-2 px-2 py-0.5 rounded-full bg-chart-up/20 text-chart-up text-xs font-medium">Compra</span>;
      case 'venda':
        return <span className="ml-2 px-2 py-0.5 rounded-full bg-chart-down/20 text-chart-down text-xs font-medium">Venda</span>;
      default:
        return <span className="ml-2 px-2 py-0.5 rounded-full bg-chart-neutral/20 text-chart-neutral text-xs font-medium">Neutro</span>;
    }
  };

  return (
    <Card className="p-4 my-4 w-full max-w-3xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold">Resultados da Análise</h2>
          <p className="text-sm text-muted-foreground">Analisado em {formattedDate}</p>
        </div>
        <div className="flex items-center px-3 py-1 rounded-full bg-secondary">
          {getSentimentIcon()}
          <span className="ml-2 text-sm font-medium">
            {patterns.length} padrões detectados
          </span>
        </div>
      </div>
      
      {analysisResults.imageUrl && (
        <div className="relative w-full overflow-hidden rounded-lg mb-6">
          <img 
            ref={imageRef}
            src={analysisResults.imageUrl} 
            alt="Gráfico Analisado" 
            className="w-full object-contain" 
            onLoad={handleImageLoad}
          />
          
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-md flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              <Switch 
                checked={showTechnicalMarkup} 
                onCheckedChange={setShowTechnicalMarkup}
                aria-label="Alternar marcação técnica"
              />
            </div>
            
            {showTechnicalMarkup && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-medium text-center">Tamanho</div>
                <div className="flex justify-between items-center gap-2">
                  <ZoomOut className="h-3 w-3 text-muted-foreground" />
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleSizeChange('small')}
                      className={`w-2 h-2 rounded-full ${markupSize === 'small' ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      aria-label="Marcações pequenas"
                    />
                    <button 
                      onClick={() => handleSizeChange('medium')}
                      className={`w-2 h-2 rounded-full ${markupSize === 'medium' ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      aria-label="Marcações médias"
                    />
                    <button 
                      onClick={() => handleSizeChange('large')}
                      className={`w-2 h-2 rounded-full ${markupSize === 'large' ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      aria-label="Marcações grandes"
                    />
                  </div>
                  <ZoomIn className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
          
          {imageSize.width > 0 && (
            <ChartMarkup 
              imageWidth={imageSize.width} 
              imageHeight={imageSize.height} 
            />
          )}
        </div>
      )}
      
      <div className="gradient-border mb-6 p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Avaliação Geral</h3>
            <p className="text-sm">{overallRecommendation}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="font-medium mb-4">Padrões Detectados</h3>
        
        {Object.entries(groupedPatterns).map(([category, patterns]) => (
          <div key={category} className="mb-6">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">{category}</h4>
            <div className="space-y-4">
              {patterns.map((pattern: PatternResult, index: number) => (
                <div key={index} className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <h4 className="font-medium">{pattern.type}</h4>
                      {pattern.action && getActionBadge(pattern.action)}
                    </div>
                    <div className="text-sm">
                      Confiança: {Math.round(pattern.confidence * 100)}%
                    </div>
                  </div>
                  
                  <Progress 
                    value={pattern.confidence * 100} 
                    className={`h-1.5 mb-3 ${getConfidenceColor(pattern.confidence)}`} 
                  />
                  
                  <p className="text-sm mb-2">{pattern.description}</p>
                  
                  {pattern.recommendation && (
                    <div className="text-sm text-primary">
                      <span className="font-medium">Recomendação:</span> {pattern.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-4 border-t border-border text-sm text-muted-foreground">
        <p className="italic">
          Observação: A IA realiza análise apenas com base na imagem fornecida e não tem acesso a dados históricos completos. 
          Confirmações adicionais são recomendadas antes de tomar decisões de investimento.
        </p>
      </div>
    </Card>
  );
};

export default AnalysisResults;
