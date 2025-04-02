
import React from 'react';
import CameraView from './CameraView';
import ChartRegionSelector from './ChartRegionSelector';
import ControlPanel from './ControlPanel';
import AnalysisResults from './AnalysisResults';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';

const GraphAnalyzer = () => {
  const { capturedImage, analysisResults, resetAnalysis } = useAnalyzer();

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!capturedImage ? (
        <>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Capturar Imagem do Gráfico</h2>
            <p className="text-muted-foreground">
              Use sua câmera para tirar uma foto de um gráfico financeiro para análise ou carregue uma imagem.
            </p>
          </div>
          <CameraView />
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={resetAnalysis}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">
              {analysisResults ? 'Resultados da Análise' : 'Configurar Análise'}
            </h2>
          </div>
          
          {!analysisResults ? (
            <>
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-2">Imagem Capturada</h3>
                <div className="relative w-full max-w-3xl overflow-hidden rounded-lg mb-4">
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
