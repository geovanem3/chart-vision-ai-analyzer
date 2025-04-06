
import React, { useState } from 'react';
import CameraView from './CameraView';
import ChartRegionSelector from './ChartRegionSelector';
import ControlPanel from './ControlPanel';
import AnalysisResults from './AnalysisResults';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ZoomIn, BarChart2, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useIsMobile, useViewportSize } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkImageQuality } from '@/utils/imageProcessing';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const GraphAnalyzer = () => {
  const { 
    capturedImage, 
    analysisResults, 
    resetAnalysis, 
    selectedRegion, 
    setSelectedRegion,
    timeframe,
    setTimeframe
  } = useAnalyzer();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("region");
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

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w');
  };

  return (
    <div className={`w-full ${isMobile ? 'px-2' : 'max-w-4xl'} mx-auto`}>
      {!capturedImage ? (
        <>
          <div className="text-center mb-6">
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-2`}>Capturar Imagem do Gráfico</h2>
            <p className="text-muted-foreground text-sm">
              Use sua câmera para tirar uma foto de um gráfico financeiro para análise ou carregue uma imagem.
            </p>
          </div>
          <CameraView />
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={resetAnalysis}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>
                {analysisResults ? 'Resultados da Análise' : 'Configurar Análise'}
              </h2>
            </div>
            
            {!analysisResults ? (
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
                      // Navigate to analysis
                    }
                  }}
                >
                  {activeTab === "region" ? "Próximo" : "Analisar"}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            ) : null}
          </div>
          
          {!analysisResults ? (
            <>
              {imageQuality && (
                <Alert variant={imageQuality.isGoodQuality ? "default" : "destructive"} className="mb-3">
                  <BarChart2 className="h-4 w-4" />
                  <AlertTitle>Qualidade da Imagem</AlertTitle>
                  <AlertDescription className="text-sm">
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
              
              <Card className={`p-0 overflow-hidden bg-card/50`}>
                <CardHeader className="p-3 pb-0 flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-base">Imagem Capturada</CardTitle>
                    <CardDescription className="text-xs">
                      Ajuste a região do gráfico para melhor precisão
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                  <div className="relative w-full max-w-3xl overflow-hidden rounded-md mb-2">
                    <img 
                      src={capturedImage} 
                      alt="Captured Chart" 
                      className="w-full object-contain" 
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Tabs defaultValue="region" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="region">Região do Gráfico</TabsTrigger>
                  <TabsTrigger value="controls">Análise Avançada</TabsTrigger>
                </TabsList>
                <TabsContent value="region" className="mt-2">
                  <ChartRegionSelector />
                </TabsContent>
                <TabsContent value="controls" className="mt-2">
                  <ControlPanel />
                </TabsContent>
              </Tabs>
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
