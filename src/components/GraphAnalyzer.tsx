
import React from 'react';
import CameraView from './CameraView';
import ChartRegionSelector from './ChartRegionSelector';
import ControlPanel from './ControlPanel';
import AnalysisResults from './AnalysisResults';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

const GraphAnalyzer = () => {
  const { capturedImage, analysisResults, resetAnalysis } = useAnalyzer();
  const isMobile = useIsMobile();

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
            <>
              <Card className={`p-3 ${isMobile ? 'p-2' : 'p-4'}`}>
                <h3 className="text-lg font-medium mb-2">Imagem Capturada</h3>
                <div className="relative w-full max-w-3xl overflow-hidden rounded-lg mb-3">
                  <img 
                    src={capturedImage} 
                    alt="Captured Chart" 
                    className="w-full object-contain" 
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Selecione a região do gráfico que deseja analisar na próxima etapa.
                </p>
              </Card>
              <ChartRegionSelector />
              <ControlPanel />
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
