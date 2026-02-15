import React, { useState } from 'react';
import CameraView from './CameraView';
import ChartRegionSelector from './ChartRegionSelector';
import AnalysisResults from './AnalysisResults';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ZoomIn, Clock, ChevronRight, Bug } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
    isAnalyzing,
    analyzeChartRegion,
    forceFailure,
    setForceFailure
  } = useAnalyzer();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as '1m' | '5m');
  };
  
  const startAnalysis = async () => {
    if (!capturedImage) {
      toast({
        title: "Imagem necessária",
        description: "Capture ou selecione uma imagem do gráfico",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Analisando com IA...",
      description: "Processando imagem com Gemini Vision",
    });
    
    try {
      await analyzeChartRegion(capturedImage, selectedRegion || undefined);
      
      toast({
        title: "✅ Análise Completa",
        description: "A IA analisou o gráfico com sucesso",
      });
    } catch (error) {
      console.error("Erro ao processar análise:", error);
      toast({
        title: "Erro na análise",
        description: "Ocorreu um problema ao processar a análise. Tente novamente.",
        variant: "destructive",
      });
    }
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
              Tire uma foto do gráfico para análise com IA
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
              <h2 className="text-lg font-bold">Resultados da IA</h2>
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
              <h2 className="text-lg font-bold">Analisando com IA...</h2>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 bg-card/50 rounded-lg border border-border/30">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
            <p className="text-base font-medium">Gemini está analisando...</p>
            <p className="text-xs text-muted-foreground mt-2">
              Identificando padrões, tendências e níveis técnicos
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
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={startAnalysis}
            >
              Analisar com IA
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
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
        
        <ChartRegionSelector />
        
        {/* Módulo de Stress Test */}
        <Card className="p-0 overflow-hidden bg-destructive/5 border-destructive/20 rounded-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-xs font-medium">Stress Test - Forçar Fallback</p>
                  <p className="text-[10px] text-muted-foreground">
                    Simula falha da IA para testar o módulo manual
                  </p>
                </div>
              </div>
              <Switch 
                checked={forceFailure} 
                onCheckedChange={setForceFailure}
              />
            </div>
            {forceFailure && (
              <p className="text-[10px] text-destructive mt-2 border-t border-destructive/20 pt-2">
                ⚠️ Ativo: A IA será ignorada. O sistema usará dados salvos ou biblioteca de padrões.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className={`w-full ${isMobile ? 'px-1' : 'max-w-4xl'} mx-auto overflow-hidden`}>
      {renderMainContent()}
    </div>
  );
};

export default GraphAnalyzer;
