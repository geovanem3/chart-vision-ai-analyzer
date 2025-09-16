import React from 'react';
import { AnalyzerProvider } from '@/context/AnalyzerContext';
import { LanguageProvider } from '@/context/LanguageContext';
import GraphAnalyzer from '@/components/GraphAnalyzer';
import ManualMarkupToolbar from '@/components/ManualMarkupToolbar';
import AdvancedMarketAnalysis from '@/components/AdvancedMarketAnalysis';
import { 
  BarChart2, Eye, Scan, ZoomIn, AlertTriangle, 
  ImageOff, Zap, TrendingUp, ChartCandlestick, BarChartHorizontal,
  Volume, Activity, Clock
} from 'lucide-react';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';

// Wrapper component to access context
const GraphAnalyzerWithMarkupToolbar = () => {
  const { capturedImage, analysisResults, timeframe } = useAnalyzer();
  const isMobile = useIsMobile();
  
  return (
    <>
      <GraphAnalyzer />
      {capturedImage && <ManualMarkupToolbar />}
      
      {capturedImage && !analysisResults && (
        <Alert className="my-2 rounded-lg" variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">Certifique-se que a imagem esteja clara</AlertTitle>
          <AlertDescription className="text-xs">
            Imagem nítida = análise precisa.
            {!isMobile && " Use as ferramentas de marcação se necessário."}
          </AlertDescription>
        </Alert>
      )}

      {timeframe === '1m' && capturedImage && (
        <Alert className="my-2 rounded-lg" variant="default">
          <Zap className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-sm">Modo Scalping Ativado</AlertTitle>
          <AlertDescription className="text-xs">
            Análise M1 com timing exato para entradas precisas.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Advanced 1-minute Market Analysis */}
      {capturedImage && <AdvancedMarketAnalysis />}
    </>
  );
};

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
                  Timing Perfeito para Operações
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Captura e análise avançada com timing exato para entradas em reversões, retrações, pullbacks e testes de níveis.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold tracking-tight mb-1">
                  Timing Perfeito
                </h1>
                <p className="text-sm text-muted-foreground">
                  Análise exata para entradas precisas
                </p>
              </>
            )}
            
            {!isMobile && (
              <div className="flex justify-center space-x-8 mt-6">
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-3 mb-2">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Timing Preciso</p>
                  <p className="text-xs text-muted-foreground">
                    Identifica o minuto exato para entrada com base nos padrões detectados
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-3 mb-2">
                    <ChartCandlestick className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Análise de Candles</p>
                  <p className="text-xs text-muted-foreground">
                    Previsão do próximo candle e condições ideais para entrada
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-amber-500/10 rounded-full p-3 mb-2">
                    <BarChartHorizontal className="h-6 w-6 text-amber-500" />
                  </div>
                  <p className="text-sm font-medium">Tipo de Entrada</p>
                  <p className="text-xs text-muted-foreground">
                    Identifica se é reversão, retração, pullback ou teste de suporte/resistência
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-red-500/10 rounded-full p-3 mb-2">
                    <TrendingUp className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-sm font-medium">Gestão de Risco</p>
                  <p className="text-xs text-muted-foreground">
                    Stop loss e take profit otimizados para cada estratégia de entrada
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-blue-500/10 rounded-full p-3 mb-2">
                    <Volume className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium">Confirmação de Volume</p>
                  <p className="text-xs text-muted-foreground">
                    Análise de volume para confirmar a qualidade da entrada
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-purple-500/10 rounded-full p-3 mb-2">
                    <Activity className="h-6 w-6 text-purple-500" />
                  </div>
                  <p className="text-sm font-medium">Contexto de Mercado</p>
                  <p className="text-xs text-muted-foreground">
                    Alinhamento com a fase atual do mercado para entradas mais precisas
                  </p>
                </div>
              </div>
            )}

            {isMobile && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-xs font-medium">Timing Exato</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-full p-1.5 mb-1">
                    <ChartCandlestick className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-xs font-medium">Próximo Candle</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="bg-amber-500/10 rounded-full p-1.5 mb-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <p className="text-xs font-medium">M1 Avançado</p>
                </div>
              </div>
            )}
          </div>
          
          <GraphAnalyzerWithMarkupToolbar />
        </div>
      </AnalyzerProvider>
    </LanguageProvider>
  );
};

export default Home;