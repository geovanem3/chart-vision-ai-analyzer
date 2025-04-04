
import React from 'react';
import { AnalyzerProvider } from '@/context/AnalyzerContext';
import { LanguageProvider } from '@/context/LanguageContext';
import GraphAnalyzer from '@/components/GraphAnalyzer';
import ManualMarkupToolbar from '@/components/ManualMarkupToolbar';
import { BarChart2, Eye, Scan, ZoomIn, AlertTriangle } from 'lucide-react';
import { useAnalyzer } from '@/context/AnalyzerContext';

// Wrapper component to access context
const GraphAnalyzerWithMarkupToolbar = () => {
  const { capturedImage } = useAnalyzer();
  
  return (
    <>
      <GraphAnalyzer />
      {capturedImage && <ManualMarkupToolbar />}
    </>
  );
};

const Index = () => {
  return (
    <LanguageProvider>
      <AnalyzerProvider>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-border/60 bg-card shadow-sm">
            <div className="container py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart2 className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">Chart Vision AI Analyzer</h1>
              </div>
              <div className="text-sm text-muted-foreground">
                Análise Técnica Avançada
              </div>
            </div>
          </header>
          
          <main className="flex-1 container py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-3">
                Análise Crítica de Gráficos Financeiros
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Capture imagens de gráficos financeiros e utilize nossa IA para detectar padrões de negociação, 
                níveis de suporte/resistência e indicadores com maior precisão através do ajuste manual.
              </p>
              
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
              </div>
            </div>
            
            <GraphAnalyzerWithMarkupToolbar />
          </main>
          
          <footer className="py-6 border-t border-border/60">
            <div className="container text-center text-sm text-muted-foreground">
              <p>Chart Vision AI Analyzer &copy; {new Date().getFullYear()}</p>
              <p className="mt-1">Análise técnica avançada e crítica para gráficos financeiros</p>
            </div>
          </footer>
        </div>
      </AnalyzerProvider>
    </LanguageProvider>
  );
};

export default Index;
