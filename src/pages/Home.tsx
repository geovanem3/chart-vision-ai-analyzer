import React from 'react';
import { AnalyzerProvider } from '@/context/AnalyzerContext';
import { LanguageProvider } from '@/context/LanguageContext';
import GraphAnalyzer from '@/components/GraphAnalyzer';
import AnalysisHistory from '@/components/AnalysisHistory';
import { BarChart2, Zap, ChartCandlestick } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Home = () => {
  const isMobile = useIsMobile();

  return (
    <LanguageProvider>
      <AnalyzerProvider>
        <div className={`${isMobile ? 'p-3' : 'container py-8'}`}>
          <div className={`text-center ${isMobile ? 'mb-4' : 'mb-8'}`}>
            {!isMobile ? (
              <>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  Análise de Gráficos com IA
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Capture uma foto do gráfico e receba análise técnica real usando inteligência artificial.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold tracking-tight mb-1">
                  Análise com IA
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tire uma foto do gráfico para análise
                </p>
              </>
            )}
            
            {!isMobile && (
              <div className="flex justify-center space-x-8 mt-6">
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-3 mb-2">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Análise Real</p>
                  <p className="text-xs text-muted-foreground">
                    IA Gemini analisa o gráfico de verdade
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-3 mb-2">
                    <ChartCandlestick className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Padrões</p>
                  <p className="text-xs text-muted-foreground">
                    Detecta padrões técnicos reais
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-3 mb-2">
                    <BarChart2 className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Tendências</p>
                  <p className="text-xs text-muted-foreground">
                    Identifica direção do mercado
                  </p>
                </div>
              </div>
            )}

            {isMobile && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-1.5 mb-1">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-xs font-medium">IA Real</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-1.5 mb-1">
                    <ChartCandlestick className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-xs font-medium">Padrões</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-1.5 mb-1">
                    <BarChart2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-xs font-medium">Tendências</p>
                </div>
              </div>
            )}
          </div>
          
          <GraphAnalyzer />
          
          <div className={`${isMobile ? 'mt-4' : 'mt-8'}`}>
            <AnalysisHistory />
          </div>
        </div>
      </AnalyzerProvider>
    </LanguageProvider>
  );
};

export default Home;
