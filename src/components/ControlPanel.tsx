
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { processImage, cropToRegion } from '@/utils/imageProcessing';
import { detectPatterns, generateTechnicalMarkup, detectCandles } from '@/utils/patternDetection';
import { Loader2, BarChart2, RefreshCw } from 'lucide-react';

const ControlPanel = () => {
  const { 
    capturedImage, 
    selectedRegion, 
    setIsAnalyzing, 
    isAnalyzing, 
    setAnalysisResults,
    resetAnalysis,
    regionType
  } = useAnalyzer();
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!capturedImage || !selectedRegion) {
      toast({
        title: "Informação faltando",
        description: "Por favor, capture uma imagem e selecione uma região primeiro.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Processo de análise aprimorado
      toast({
        title: "Processando",
        description: `Recortando região ${selectedRegion.type === 'circle' ? 'circular' : 'retangular'} selecionada...`
      });
      
      // Recortar a região selecionada
      const croppedImage = await cropToRegion(capturedImage, selectedRegion);
      
      toast({
        title: "Processando",
        description: "Melhorando qualidade da imagem..."
      });
      
      // Processar a imagem para melhorar detecção
      const processedImage = await processImage(croppedImage);
      
      toast({
        title: "Processando",
        description: "Detectando padrões gráficos..."
      });
      
      // Detectar padrões na imagem processada
      const patterns = await detectPatterns(processedImage);
      
      // Obter dimensões para mapeamento técnico
      let technicalWidth, technicalHeight;
      if (selectedRegion.type === 'rectangle') {
        technicalWidth = selectedRegion.width;
        technicalHeight = selectedRegion.height;
      } else {
        technicalWidth = selectedRegion.radius * 2;
        technicalHeight = selectedRegion.radius * 2;
      }
      
      // Obter elementos técnicos com base nos padrões detectados
      const technicalElements = generateTechnicalMarkup(patterns, technicalWidth, technicalHeight);
      
      // Detectar candles na imagem
      const candles = await detectCandles(processedImage, technicalWidth, technicalHeight);
      
      // Definir resultados completos
      setAnalysisResults({
        patterns,
        timestamp: Date.now(),
        imageUrl: croppedImage,
        technicalElements,
        candles,
        manualRegion: true // Indicar que a região foi selecionada manualmente
      });
      
      toast({
        title: "Análise completa",
        description: `Padrões do gráfico foram detectados com sucesso na região ${selectedRegion.type === 'circle' ? 'circular' : 'retangular'}.`
      });
    } catch (error) {
      console.error('Erro na análise:', error);
      toast({
        title: "Falha na análise",
        description: "Ocorreu um erro ao analisar o gráfico. Por favor, tente novamente.",
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
        <h3 className="text-lg font-medium">Controles de Análise do Gráfico</h3>
        <Button variant="ghost" size="sm" onClick={resetAnalysis}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Nova Análise
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm text-muted-foreground">Configurações de Análise</h4>
          <ul className="text-sm space-y-1">
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-up mr-2"></span>
              <span>Detecção de Tendência</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-down mr-2"></span>
              <span>Níveis de Suporte/Resistência</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-neutral mr-2"></span>
              <span>Padrões de Candles</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-line mr-2"></span>
              <span>Formações Gráficas OCO</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-primary mr-2"></span>
              <span>Triângulos e Cunhas</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-secondary mr-2"></span>
              <span>Topos e Fundos Duplos</span>
            </li>
          </ul>
        </div>
        
        <div className="flex flex-col justify-end space-y-4">
          <p className="text-sm text-muted-foreground">
            O analisador processará a região {selectedRegion?.type === 'circle' ? 'circular' : 'retangular'} selecionada e detectará padrões e indicadores de análise técnica exatamente na área selecionada.
          </p>
          
          <Button 
            className="w-full" 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !selectedRegion}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <BarChart2 className="w-4 h-4 mr-2" />
                Analisar Gráfico
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ControlPanel;
