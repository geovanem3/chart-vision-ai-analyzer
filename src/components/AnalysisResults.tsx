
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useAnalyzer, PatternResult } from '@/context/AnalyzerContext';
import { analyzeResults, generateTechnicalMarkup } from '@/utils/patternDetection';
import { Info, ArrowUp, ArrowDown, ArrowRight, BarChart2, ZoomIn, ZoomOut, Clock } from 'lucide-react';
import ChartMarkup from './ChartMarkup';
import { useLanguage } from '@/context/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AnalysisResults = () => {
  const { 
    analysisResults, 
    setAnalysisResults, 
    showTechnicalMarkup, 
    setShowTechnicalMarkup,
    markupSize,
    setMarkupSize,
    timeframe,
    setTimeframe
  } = useAnalyzer();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [markupScale, setMarkupScale] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const { t } = useLanguage();
  const isMobile = useIsMobile();

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

  const handleMarkupScaleChange = (value: number[]) => {
    setMarkupScale(value[0]);
    
    // Regenerate technical markup with new scale
    if (analysisResults && imageSize.width > 0) {
      const elements = generateTechnicalMarkup(
        analysisResults.patterns, 
        imageSize.width, 
        imageSize.height, 
        value[0]
      );
      
      setAnalysisResults({
        ...analysisResults,
        technicalElements: elements
      });
    }
  };

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w');
    
    // Re-analyze with the new timeframe if needed
    if (analysisResults) {
      const updatedPatterns = analysisResults.patterns.map(pattern => {
        return {
          ...pattern,
          recommendation: value === '1m' 
            ? pattern.recommendation?.replace(/\d+(?=\s*(?:minutos|horas|dias))/g, '1').replace(/horas|dias/g, 'minutos')
            : pattern.recommendation
        };
      });
      
      setAnalysisResults({
        ...analysisResults,
        patterns: updatedPatterns
      });
    }
  };

  const resetMarkupScale = () => {
    setMarkupScale(1);
    
    // Regenerate technical markup with reset scale
    if (analysisResults && imageSize.width > 0) {
      const elements = generateTechnicalMarkup(
        analysisResults.patterns, 
        imageSize.width, 
        imageSize.height, 
        1
      );
      
      setAnalysisResults({
        ...analysisResults,
        technicalElements: elements
      });
    }
  };

  if (!analysisResults) return null;

  const { patterns, timestamp } = analysisResults;
  const overallRecommendation = analyzeResults(patterns, timeframe);
  const formattedDate = new Date(timestamp).toLocaleString('pt-BR');

  const groupPatternsByCategory = (patterns: PatternResult[] = []) => {
    const categories: Record<string, PatternResult[]> = {
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
      .reduce<Record<string, PatternResult[]>>((obj, [key, value]) => ({ ...obj, [key]: value }), {});
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
        return <span className={`ml-2 px-2 py-0.5 rounded-full bg-chart-up/20 text-chart-up ${isMobile ? 'text-[10px]' : 'text-xs'} font-medium`}>Compra</span>;
      case 'venda':
        return <span className={`ml-2 px-2 py-0.5 rounded-full bg-chart-down/20 text-chart-down ${isMobile ? 'text-[10px]' : 'text-xs'} font-medium`}>Venda</span>;
      default:
        return <span className={`ml-2 px-2 py-0.5 rounded-full bg-chart-neutral/20 text-chart-neutral ${isMobile ? 'text-[10px]' : 'text-xs'} font-medium`}>Neutro</span>;
    }
  };

  return (
    <Card className={`${isMobile ? 'p-3 my-2' : 'p-4 my-4'} w-full max-w-3xl`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Resultados da Análise</h2>
          <p className="text-xs text-muted-foreground">Analisado em {formattedDate}</p>
        </div>
        <div className="flex items-center">
          <div className="flex items-center px-2 py-1 mr-2 rounded-full bg-secondary">
            <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <Select value={timeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="h-6 w-16 text-xs border-0 p-0 pl-1 bg-transparent">
                <SelectValue placeholder="1m" />
              </SelectTrigger>
              <SelectContent side="bottom">
                <SelectItem value="1m">1m</SelectItem>
                <SelectItem value="5m">5m</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
                <SelectItem value="30m">30m</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="4h">4h</SelectItem>
                <SelectItem value="1d">1d</SelectItem>
                <SelectItem value="1w">1w</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center px-2 py-1 rounded-full bg-secondary">
            {getSentimentIcon()}
            <span className={`ml-1 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
              {patterns.length} padrões
            </span>
          </div>
        </div>
      </div>
      
      {analysisResults.imageUrl && (
        <div className="relative w-full overflow-hidden rounded-lg mb-4">
          <img 
            ref={imageRef}
            src={analysisResults.imageUrl} 
            alt="Gráfico Analisado" 
            className="w-full object-contain" 
            onLoad={handleImageLoad}
          />
          
          <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-md flex flex-col gap-2`}>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              <Switch 
                checked={showTechnicalMarkup} 
                onCheckedChange={setShowTechnicalMarkup}
                aria-label="Alternar marcação técnica"
              />
            </div>
            
            {showTechnicalMarkup && (
              <>
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
                
                <div className="text-xs font-medium text-center mt-1">Proporção</div>
                <div className="px-1 w-full">
                  <Slider
                    value={[markupScale]}
                    min={0.2}
                    max={2}
                    step={0.1}
                    onValueChange={handleMarkupScaleChange}
                    className="w-full"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-6 mt-1" 
                  onClick={resetMarkupScale}
                >
                  Redefinir
                </Button>
              </>
            )}
          </div>
          
          {imageSize.width > 0 && (
            <ChartMarkup 
              imageWidth={imageSize.width} 
              imageHeight={imageSize.height} 
              scale={markupScale}
            />
          )}
        </div>
      )}
      
      <div className={`gradient-border mb-4 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start gap-2">
          <Info className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-primary mt-0.5`} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium mb-1">Avaliação Geral</h3>
              <Badge variant="outline" className="text-xs h-5">
                <Clock className="h-3 w-3 mr-1" />
                {timeframe}
              </Badge>
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{overallRecommendation}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className={`font-medium mb-3 ${isMobile ? 'text-sm' : ''}`}>Padrões Detectados</h3>
        
        {Object.entries(groupedPatterns).map(([category, patterns]) => (
          <div key={category} className={`mb-4 ${isMobile ? 'space-y-2' : 'mb-6'}`}>
            <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2 text-muted-foreground uppercase tracking-wide`}>{category}</h4>
            <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
              {patterns.map((pattern: PatternResult, index: number) => (
                <div key={index} className={`bg-secondary/50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <h4 className={`${isMobile ? 'text-sm' : ''} font-medium`}>{pattern.type}</h4>
                      {pattern.action && getActionBadge(pattern.action)}
                    </div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Confiança: {Math.round(pattern.confidence * 100)}%
                    </div>
                  </div>
                  
                  <Progress 
                    value={pattern.confidence * 100} 
                    className={`h-1.5 mb-2 ${getConfidenceColor(pattern.confidence)}`} 
                  />
                  
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} mb-2`}>{pattern.description}</p>
                  
                  {pattern.recommendation && (
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-primary`}>
                      <span className="font-medium">Recomendação:</span> {pattern.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className={`mt-6 pt-3 border-t border-border ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
        <p className="italic">
          Observação: A IA realiza análise apenas com base na imagem fornecida e não tem acesso a dados históricos completos. 
          {!isMobile && " Confirmações adicionais são recomendadas antes de tomar decisões de investimento."}
        </p>
        {timeframe === '1m' && (
          <p className="italic mt-1 text-amber-500">
            Análise em timeframe de 1 minuto: Recomendado apenas para operações de curto prazo (scalping).
          </p>
        )}
      </div>
    </Card>
  );
};

export default AnalysisResults;
