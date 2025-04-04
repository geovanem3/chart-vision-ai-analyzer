
import React from 'react';
import { AnalyzerProvider } from '@/context/AnalyzerContext';
import { LanguageProvider } from '@/context/LanguageContext';
import GraphAnalyzer from '@/components/GraphAnalyzer';
import ManualMarkupToolbar from '@/components/ManualMarkupToolbar';
import { BarChart2, Eye, Scan } from 'lucide-react';
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
                Pattern Recognition Technology
              </div>
            </div>
          </header>
          
          <main className="flex-1 container py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-3">
                Analyze Financial Charts with AI
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Capture imagens de gráficos financeiros e deixe nossa IA detectar padrões de negociação, 
                níveis de suporte/resistência e indicadores de tendência automaticamente.
              </p>
              
              <div className="flex justify-center space-x-8 mt-6">
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-3 mb-2">
                    <Scan className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Seleção Precisa</p>
                  <p className="text-xs text-muted-foreground">
                    Selecione áreas específicas do gráfico para análise detalhada
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-3 mb-2">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Ajuste Manual</p>
                  <p className="text-xs text-muted-foreground">
                    Refinamento preciso para obter os melhores resultados de análise
                  </p>
                </div>
              </div>
            </div>
            
            <GraphAnalyzerWithMarkupToolbar />
          </main>
          
          <footer className="py-6 border-t border-border/60">
            <div className="container text-center text-sm text-muted-foreground">
              <p>Chart Vision AI Analyzer &copy; {new Date().getFullYear()}</p>
              <p className="mt-1">Advanced pattern recognition for financial charts</p>
            </div>
          </footer>
        </div>
      </AnalyzerProvider>
    </LanguageProvider>
  );
};

export default Index;
