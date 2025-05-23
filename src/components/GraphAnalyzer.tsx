
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
      // Adiciona a informação da região selecionada aos resultados
      analysisResults.manualRegion = true;
    }
  }, [analysisResults, selectedRegion]);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w');
  };
  
  // Função para iniciar análise
  const startAnalysis = () => {
    if (capturedImage && selectedRegion) {
      setIsAnalyzing(true);
      
      // Simular um resultado de análise após um breve delay
      setTimeout(() => {
        try {
          // Criar um resultado de análise simulado
          const simulatedResult = {
            patterns: [
              {
                type: timeframe === '1m' ? 'Pin Bar' : 'Engolfo de Alta',
                confidence: 0.78,
                description: 'Padrão de reversão identificado na região selecionada',
                action: 'compra' as 'compra' | 'venda' | 'neutro',
                isScalpingSignal: timeframe === '1m'
              }
            ],
            timestamp: Date.now(),
            imageUrl: capturedImage,
            manualRegion: true,
            preciseEntryAnalysis: {
              exactMinute: '12:45',
              entryType: 'reversão' as 'reversão' | 'retração' | 'pullback' | 'breakout' | 'teste_suporte' | 'teste_resistência',
              nextCandleExpectation: 'Alta provável com fechamento acima da máxima anterior',
              priceAction: 'Forte pressão compradora após teste de suporte',
              confirmationSignal: 'Volume crescente com velas de alta',
              riskRewardRatio: 2.5,
              entryInstructions: 'Entrar após confirmação da reversão com stop abaixo do suporte'
            },
            // Dados adicionais para evitar erros de tipo undefined
            marketContext: {
              phase: 'tendência_alta' as 'acumulação' | 'tendência_alta' | 'tendência_baixa' | 'distribuição' | 'lateral' | 'indefinida',
              strength: 'forte' as 'forte' | 'moderada' | 'fraca',
              description: 'Mercado em tendência de alta com força moderada',
              dominantTimeframe: '1m' as '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w',
              sentiment: 'otimista' as 'otimista' | 'pessimista' | 'neutro',
              marketStructure: 'alta_altas' as 'alta_altas' | 'alta_baixas' | 'baixa_altas' | 'baixa_baixas' | 'indefinida',
              breakoutPotential: 'alto' as 'alto' | 'médio' | 'baixo',
              momentumSignature: 'acelerando' as 'acelerando' | 'estável' | 'desacelerando' | 'divergente',
              liquidityPools: [
                { level: 125.50, strength: 'alta' as 'alta' | 'média' | 'baixa' }
              ]
            },
            volumeData: {
              value: 1250000,
              trend: 'increasing' as 'increasing' | 'decreasing' | 'neutral',
              abnormal: false,
              significance: 'high' as 'high' | 'medium' | 'low',
              relativeToAverage: 1.35,
              distribution: 'accumulation' as 'accumulation' | 'distribution' | 'neutral',
              divergence: false
            },
            volatilityData: {
              value: 2.3,
              trend: 'increasing' as 'increasing' | 'decreasing' | 'neutral',
              atr: 1.8,
              percentageRange: 1.2,
              isHigh: false,
              historicalComparison: 'above_average' as 'above_average' | 'below_average' | 'average'
            }
          };
          
          // Atualizar o estado com o resultado simulado
          setAnalysisResults(simulatedResult);
          
          // Feedback visual para o usuário
          toast({
            title: "Análise completa",
            description: "Padrões identificados na região selecionada",
            variant: "success",
          });
        } catch (error) {
          console.error("Erro ao processar análise:", error);
          toast({
            title: "Erro na análise",
            description: "Ocorreu um problema ao processar a análise. Tente novamente.",
            variant: "destructive",
          });
        } finally {
          // Sempre finalizar o estado de análise
          setIsAnalyzing(false);
        }
      }, 1500);
    } else {
      toast({
        title: "Selecione uma região",
        description: "Você precisa selecionar uma região do gráfico para análise",
        variant: "warning",
      });
    }
  };

  const fadeAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3 }
  };

  return (
    <motion.div 
      className={`w-full ${isMobile ? 'px-1' : 'max-w-4xl'} mx-auto`}
      {...fadeAnimation}
    >
      {!capturedImage ? (
        <>
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-2">Capturar Imagem</h2>
            <p className="text-sm text-muted-foreground">
              Tire uma foto do gráfico para análise
            </p>
          </div>
          <CameraView />
        </>
      ) : (
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
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
              <h2 className="text-lg font-bold">
                {analysisResults ? 'Resultados' : (isAnalyzing ? 'Analisando...' : 'Configurar')}
              </h2>
            </div>
            
            {!analysisResults && !isAnalyzing ? (
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
                      // Iniciar análise
                      startAnalysis();
                    }
                  }}
                >
                  {activeTab === "region" ? "Próximo" : "Analisar"}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            ) : null}
          </div>
          
          {!analysisResults && !isAnalyzing ? (
            <>
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
            </>
          ) : (
            <>
              {/* Mostrar um indicador de carregamento durante a análise */}
              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center p-6 bg-card/50 rounded-lg border border-border/30">
                  <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
                  <p className="text-base font-medium">Analisando região selecionada...</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Processando padrões e indicadores técnicos
                  </p>
                </div>
              )}
              
              {/* Mostrar resultados quando disponíveis */}
              {!isAnalyzing && analysisResults && <AnalysisResults />}
            </>
          )}
        </motion.div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomBar />
    </motion.div>
  );
};

export default GraphAnalyzer;
