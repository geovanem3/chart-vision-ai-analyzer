
import React from 'react';
import { AnalyzerProvider } from '@/context/AnalyzerContext';
import { LanguageProvider } from '@/context/LanguageContext';
import GraphAnalyzer from '@/components/GraphAnalyzer';
import ManualMarkupToolbar from '@/components/ManualMarkupToolbar';
import { BarChart2, Eye, Scan, ZoomIn, AlertTriangle, ImageOff } from 'lucide-react';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';

// Wrapper component to access context
const GraphAnalyzerWithMarkupToolbar = () => {
  const { capturedImage, analysisResults } = useAnalyzer();
  const isMobile = useIsMobile();
  
  return (
    <>
      <GraphAnalyzer />
      {capturedImage && <ManualMarkupToolbar />}
      
      {capturedImage && !analysisResults && (
        <Alert className="my-3" variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Qualidade da imagem importante</AlertTitle>
          <AlertDescription className="text-sm">
            Para uma análise precisa, use imagens nítidas de gráficos com boa resolução. 
            {!isMobile && " Se a análise automática falhar, utilize as ferramentas de marcação manual para ajustar as áreas críticas do gráfico."}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <LanguageProvider>
      <AnalyzerProvider>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-border/60 bg-card shadow-sm">
            <div className={`container ${isMobile ? 'py-3' : 'py-4'} flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <BarChart2 className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-primary`} />
                <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold tracking-tight`}>Chart Vision AI</h1>
              </div>
              <div className="text-xs text-muted-foreground">
                Análise Técnica
              </div>
            </div>
          </header>
          
          <main className={`flex-1 container ${isMobile ? 'py-4' : 'py-8'}`}>
            <div className={`text-center ${isMobile ? 'mb-4' : 'mb-8'}`}>
              <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold tracking-tight mb-2`}>
                Análise Crítica de Gráficos Financeiros
              </h1>
              <p className={`${isMobile ? 'text-sm' : 'text-xl'} text-muted-foreground max-w-3xl mx-auto`}>
                Capture imagens de gráficos financeiros e utilize nossa IA para detectar padrões de negociação e indicadores.
              </p>
              
              {!isMobile && (
                <div className="flex justify-center space-x-8 mt-6">
                  <div className="flex flex-col items-center">
                    <div className="bg-primary/10 rounded-full p-3 mb-2">
                      <Scan className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Seleção Precisa</p>
                    <p className="text-xs text-muted-foreground">
                      Selecione e ajuste áreas específicas do gráfico para análise crítica detalhada
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-primary/10 rounded-full p-3 mb-2">
                      <Eye className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Ajuste Manual</p>
                    <p className="text-xs text-muted-foreground">
                      Refinamento preciso para garantir análises mais críticas e assertivas
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-primary/10 rounded-full p-3 mb-2">
                      <ZoomIn className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Zoom e Ajuste Fino</p>
                    <p className="text-xs text-muted-foreground">
                      Controle detalhado para alinhar perfeitamente suas marcações ao gráfico
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-amber-500/10 rounded-full p-3 mb-2">
                      <AlertTriangle className="h-6 w-6 text-amber-500" />
                    </div>
                    <p className="text-sm font-medium">Análise Crítica</p>
                    <p className="text-xs text-muted-foreground">
                      Avaliação minuciosa com níveis de confiança e alertas de possíveis divergências
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-red-500/10 rounded-full p-3 mb-2">
                      <ImageOff className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-sm font-medium">Qualidade da Imagem</p>
                    <p className="text-xs text-muted-foreground">
                      Imagens de baixa qualidade podem prejudicar a análise automática
                    </p>
                  </div>
                </div>
              )}

              {isMobile && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="flex flex-col items-center">
                    <div className="bg-primary/10 rounded-full p-2 mb-1">
                      <Scan className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs font-medium">Seleção Precisa</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-primary/10 rounded-full p-2 mb-1">
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs font-medium">Ajuste Manual</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-primary/10 rounded-full p-2 mb-1">
                      <ZoomIn className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs font-medium">Ajuste Fino</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-amber-500/10 rounded-full p-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-xs font-medium">Análise Crítica</p>
                  </div>
                </div>
              )}
            </div>
            
            <GraphAnalyzerWithMarkupToolbar />
          </main>
          
          <footer className={`${isMobile ? 'py-3' : 'py-6'} border-t border-border/60`}>
            <div className="container text-center text-xs text-muted-foreground">
              <p>Chart Vision AI Analyzer &copy; {new Date().getFullYear()}</p>
              <p className="mt-1">Análise técnica avançada para gráficos financeiros</p>
            </div>
          </footer>
        </div>
      </AnalyzerProvider>
    </LanguageProvider>
  );
};

export default Index;
