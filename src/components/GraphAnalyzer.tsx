
import React, { useState, useEffect } from 'react';
import CameraView from './CameraView';
import ChartRegionSelector from './ChartRegionSelector';
import ControlPanel from './ControlPanel';
import AnalysisResults from './AnalysisResults';
import MobileBottomBar from './MobileBottomBar';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ZoomIn, BarChart2, ChevronRight, Clock, Camera, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkImageQuality } from '@/utils/imageProcessing';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { performCompleteAnalysis } from '@/utils/patternDetection';
import { detectCandles } from '@/utils/candleAnalysis';
import { analyzeVolume } from '@/utils/volumeAnalysis';
import { analyzeVolatility } from '@/utils/volatilityAnalysis';

const GraphAnalyzer = () => {
  const { 
    capturedImage, 
    analysisResults, 
    resetAnalysis, 
    selectedRegion, 
    timeframe,
    setTimeframe,
    setIsAnalyzing,
    isAnalyzing,
    setAnalysisResults
  } = useAnalyzer();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("region");
  const { toast } = useToast();
  const [imageQuality, setImageQuality] = useState<{
    isGoodQuality: boolean;
    message: string;
    details?: {
      resolution: string;
      contrast: string;
      noise: string;
    }
  } | null>(null);

  // Check image quality when captured image changes
  React.useEffect(() => {
    if (capturedImage && !analysisResults) {
      checkImageQuality(capturedImage).then(result => {
        setImageQuality(result);
      });
    } else {
      setImageQuality(null);
    }
  }, [capturedImage, analysisResults]);

  // Ensure selected region is maintained during analysis
  useEffect(() => {
    if (analysisResults && !analysisResults.manualRegion && selectedRegion) {
      const updatedResults = { ...analysisResults, manualRegion: true };
      setAnalysisResults(updatedResults);
    }
  }, [analysisResults, selectedRegion, setAnalysisResults]);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w');
  };
  
  const startAnalysis = async () => {
    if (!capturedImage || !selectedRegion) {
      toast({
        title: "Selecione uma região",
        description: "Você precisa selecionar uma região do gráfico para análise",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      console.log('Iniciando análise REAL com timeframe:', timeframe);
      console.log('Região selecionada:', selectedRegion);
      
      // ETAPA 1: Detectar candles reais da imagem
      const detectedCandles = await detectCandles(capturedImage, selectedRegion);
      console.log('Candles detectados:', detectedCandles);
      
      // ETAPA 2: Executar análise completa REAL
      const realAnalysisResult = await performCompleteAnalysis(
        capturedImage,
        selectedRegion,
        {
          timeframe,
          enableVolumeAnalysis: true,
          enableVolatilityAnalysis: true,
          enablePatternDetection: true
        }
      );
      console.log('Resultado da análise real:', realAnalysisResult);
      
      // ETAPA 3: Análise de volume baseada nos candles detectados
      const volumeAnalysis = analyzeVolume(detectedCandles);
      console.log('Análise de volume:', volumeAnalysis);
      
      // ETAPA 4: Análise de volatilidade baseada nos candles detectados
      const volatilityAnalysis = analyzeVolatility(detectedCandles);
      console.log('Análise de volatilidade:', volatilityAnalysis);
      
      // ETAPA 5: Construir resultado final baseado APENAS em dados reais
      const finalResult = {
        patterns: realAnalysisResult.patterns || [],
        timestamp: Date.now(),
        imageUrl: capturedImage,
        manualRegion: true,
        candles: detectedCandles,
        volumeData: volumeAnalysis,
        volatilityData: volatilityAnalysis,
        marketContext: realAnalysisResult.marketContext,
        technicalIndicators: realAnalysisResult.technicalIndicators,
        scalpingSignals: realAnalysisResult.scalpingSignals,
        preciseEntryAnalysis: realAnalysisResult.preciseEntryAnalysis
      };
      
      console.log('Resultado final da análise REAL:', finalResult);
      
      setAnalysisResults(finalResult);
      
      toast({
        title: "Análise Real Completa",
        description: `${detectedCandles.length} candles detectados, ${realAnalysisResult.patterns?.length || 0} padrões identificados`,
      });
      
    } catch (error) {
      console.error("Erro ao processar análise REAL:", error);
      toast({
        title: "Erro na análise",
        description: "Ocorreu um problema ao processar a análise real. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const fadeAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3 }
  };

  // Renderização principal baseada no estado
  const renderMainContent = () => {
    // Se não há imagem capturada, mostrar a câmera
    if (!capturedImage) {
      return (
        <div className="w-full">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-2">Capturar Imagem</h2>
            <p className="text-sm text-muted-foreground">
              Tire uma foto do gráfico para análise
            </p>
          </div>
          <CameraView />
        </div>
      );
    }

    // Se há resultados, mostrar apenas os resultados
    if (analysisResults) {
      return (
        <motion.div 
          className="space-y-3 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          key="analysis-results"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={resetAnalysis}
                className="mr-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-bold">Resultados</h2>
            </div>
          </div>
          <div className="w-full overflow-hidden">
            <AnalysisResults />
          </div>
        </motion.div>
      );
    }

    // Se está analisando, mostrar loading
    if (isAnalyzing) {
      return (
        <motion.div 
          className="space-y-3 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          key="analyzing"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={resetAnalysis}
                className="mr-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-bold">Analisando...</h2>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 bg-card/50 rounded-lg border border-border/30">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
            <p className="text-base font-medium">Detectando candles na imagem...</p>
            <p className="text-xs text-muted-foreground mt-2">
              Processando análise real do gráfico capturado
            </p>
          </div>
        </motion.div>
      );
    }

    // Estado padrão: configuração da análise
    return (
      <motion.div 
        className="space-y-3 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        key="configuration"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={resetAnalysis}
              className="mr-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-bold">Configurar</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-secondary/60 rounded-md px-2 py-1">
              <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <Select value={timeframe} onValueChange={handleTimeframeChange}>
                <SelectTrigger className="h-6 w-12 text-xs border-0 p-0 pl-1 bg-transparent">
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
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => {
                if (activeTab === "region") {
                  setActiveTab("controls");
                } else {
                  startAnalysis();
                }
              }}
            >
              {activeTab === "region" ? "Próximo" : "Analisar"}
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {imageQuality && (
          <Alert variant={imageQuality.isGoodQuality ? "default" : "destructive"} className="mb-2 rounded-lg">
            <BarChart2 className="h-4 w-4" />
            <AlertTitle className="text-sm">Qualidade da Imagem</AlertTitle>
            <AlertDescription className="text-xs">
              {imageQuality.message}
              {imageQuality.details && (
                <ul className="mt-1 list-disc list-inside text-xs">
                  <li>Resolução: {imageQuality.details.resolution}</li>
                  <li>Contraste: {imageQuality.details.contrast}</li>
                  <li>Ruído: {imageQuality.details.noise}</li>
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="p-0 overflow-hidden bg-card/50 rounded-lg shadow-sm">
          <CardContent className="p-2">
            <div className="relative w-full overflow-hidden rounded-md">
              <img 
                src={capturedImage} 
                alt="Captured Chart" 
                className="w-full object-contain" 
              />
              <Button variant="secondary" size="icon" className="absolute top-1 right-1 h-7 w-7 opacity-80">
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="region" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="region" className="text-xs">Região do Gráfico</TabsTrigger>
            <TabsTrigger value="controls" className="text-xs">Análise Avançada</TabsTrigger>
          </TabsList>
          <TabsContent value="region" className="mt-2">
            <ChartRegionSelector />
          </TabsContent>
          <TabsContent value="controls" className="mt-2">
            <ControlPanel />
          </TabsContent>
        </Tabs>
      </motion.div>
    );
  };

  return (
    <div className={`w-full ${isMobile ? 'px-1' : 'max-w-4xl'} mx-auto overflow-hidden`}>
      {renderMainContent()}
      <MobileBottomBar />
    </div>
  );
};

export default GraphAnalyzer;
