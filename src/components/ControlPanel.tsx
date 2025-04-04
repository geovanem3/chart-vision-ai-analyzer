
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { 
  processImage, 
  cropToRegion, 
  checkImageQuality
} from '@/utils/imageProcessing';
import { detectPatterns, generateTechnicalMarkup, detectCandles } from '@/utils/patternDetection';
import { 
  Loader2, 
  BarChart2, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  X 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ControlPanel = () => {
  const { 
    capturedImage, 
    selectedRegion, 
    setIsAnalyzing, 
    isAnalyzing, 
    setAnalysisResults,
    resetAnalysis,
    regionType,
    setMarkupMode
  } = useAnalyzer();
  const { toast } = useToast();
  const [imageQualityInfo, setImageQualityInfo] = useState<{
    checked: boolean;
    isGood: boolean;
    message: string;
    details?: { [key: string]: string }
  }>({
    checked: false,
    isGood: false,
    message: ''
  });
  
  // Verificar qualidade da imagem
  const checkQuality = async () => {
    if (!capturedImage) return;
    
    try {
      const qualityResult = await checkImageQuality(capturedImage);
      
      setImageQualityInfo({
        checked: true,
        isGood: qualityResult.isGoodQuality,
        message: qualityResult.message,
        details: qualityResult.details
      });
      
      if (!qualityResult.isGoodQuality) {
        toast({
          title: "Aviso de qualidade",
          description: qualityResult.message,
          // Changed to default with a custom className
          variant: "default",
          className: "bg-amber-50 border-amber-200 text-amber-800"
        });
        
        // Habilitar modo de marcação manual se a qualidade for ruim
        setMarkupMode(true);
      }
    } catch (error) {
      console.error('Erro ao verificar qualidade:', error);
    }
  };
  
  // Verificar qualidade automaticamente quando a imagem é capturada
  React.useEffect(() => {
    if (capturedImage && !imageQualityInfo.checked) {
      checkQuality();
    }
  }, [capturedImage]);

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
      
      // Verificar qualidade, se ainda não foi verificada
      if (!imageQualityInfo.checked) {
        await checkQuality();
      }
      
      // Processo de análise aprimorado
      toast({
        title: "Processando",
        description: `Recortando região ${selectedRegion.type === 'circle' ? 'circular' : 'retangular'} selecionada...`
      });
      
      // Recortar a região selecionada
      const croppedResult = await cropToRegion(capturedImage, selectedRegion);
      
      if (!croppedResult.success) {
        toast({
          title: "Aviso",
          description: croppedResult.error || "Erro ao recortar a região. Tente selecionar outra área.",
          variant: "destructive"
        });
        setIsAnalyzing(false);
        return;
      }
      
      toast({
        title: "Processando",
        description: "Melhorando qualidade da imagem..."
      });
      
      // Processar a imagem para melhorar detecção
      const processedResult = await processImage(croppedResult.data);
      
      if (!processedResult.success) {
        toast({
          title: "Aviso",
          description: processedResult.error || "Erro ao processar a imagem. A análise pode ser imprecisa.",
          // Changed to default with a custom className
          variant: "default",
          className: "bg-amber-50 border-amber-200 text-amber-800"
        });
        // Continuar mesmo com erro, mas usando a imagem original recortada
      }
      
      const processedImage = processedResult.success ? processedResult.data : croppedResult.data;
      
      toast({
        title: "Processando",
        description: "Detectando padrões gráficos..."
      });
      
      // Detectar padrões na imagem processada
      const patterns = await detectPatterns(processedImage);
      
      if (patterns.length === 0 || (patterns.length === 1 && patterns[0].type === 'Erro na Análise')) {
        toast({
          title: "Dificuldade na análise",
          description: "Não foi possível identificar padrões claros. Utilize as ferramentas de marcação manual para melhorar a análise.",
          // Changed to default with a custom className
          variant: "default",
          className: "bg-amber-50 border-amber-200 text-amber-800"
        });
        setMarkupMode(true);
      }
      
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
      
      if (candles.length === 0) {
        toast({
          title: "Aviso",
          description: "Não foi possível detectar candles ou elementos de gráfico. A análise pode ser limitada.",
          // Changed to default with a custom className
          variant: "default",
          className: "bg-amber-50 border-amber-200 text-amber-800"
        });
      }
      
      // Definir resultados completos
      setAnalysisResults({
        patterns,
        timestamp: Date.now(),
        imageUrl: croppedResult.data,
        technicalElements,
        candles,
        manualRegion: true // Indicar que a região foi selecionada manualmente
      });
      
      toast({
        title: "Análise completa",
        description: `Padrões do gráfico foram detectados ${patterns.length > 0 ? 'com sucesso' : 'parcialmente'} na região ${selectedRegion.type === 'circle' ? 'circular' : 'retangular'}.`,
        variant: patterns.length > 0 ? "default" : "default",
        className: patterns.length > 0 ? "" : "bg-amber-50 border-amber-200 text-amber-800"
      });
    } catch (error) {
      console.error('Erro na análise:', error);
      toast({
        title: "Falha na análise",
        description: "Ocorreu um erro ao analisar o gráfico. Por favor, tente novamente ou use as ferramentas manuais.",
        variant: "destructive"
      });
      setMarkupMode(true);
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
      
      {imageQualityInfo.checked && (
        <Alert
          className={`mb-4 ${imageQualityInfo.isGood ? 'border-green-500/50 bg-green-500/10' : ''}`}
          variant={imageQualityInfo.isGood ? "default" : "warning"}
        >
          {imageQualityInfo.isGood ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>Qualidade da Imagem</AlertTitle>
          <AlertDescription>
            {imageQualityInfo.message}
            
            {imageQualityInfo.details && (
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${imageQualityInfo.details.resolution === 'Boa' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span>Resolução: {imageQualityInfo.details.resolution}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${imageQualityInfo.details.contrast === 'Adequado' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span>Contraste: {imageQualityInfo.details.contrast}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${imageQualityInfo.details.noise === 'Baixo' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span>Ruído: {imageQualityInfo.details.noise}</span>
                </div>
              </div>
            )}
            
            {!imageQualityInfo.isGood && (
              <p className="mt-2 text-xs font-semibold">
                É recomendável utilizar as ferramentas de marcação manual para melhorar a precisão da análise.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
      
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
            {!imageQualityInfo.isGood && imageQualityInfo.checked && (
              <span className="block mt-1 text-amber-500 font-semibold">
                Atenção: Problemas de qualidade podem afetar a precisão da análise automática.
              </span>
            )}
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
