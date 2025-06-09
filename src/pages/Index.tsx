
import React from 'react';
import { AnalyzerProvider } from '@/context/AnalyzerContext';
import { LanguageProvider } from '@/context/LanguageContext';
import GraphAnalyzer from '@/components/GraphAnalyzer';
import ManualMarkupToolbar from '@/components/ManualMarkupToolbar';
import AdvancedMarketAnalysis from '@/components/AdvancedMarketAnalysis';
import UserMenu from '@/components/UserMenu';
import { 
  BarChart2, Eye, Scan, ZoomIn, AlertTriangle, 
  ImageOff, Zap, TrendingUp, ChartCandlestick, BarChartHorizontal,
  Volume, Activity, Clock, ArrowDown, ArrowUp, Check
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
      
      {analysisResults?.preciseEntryAnalysis && (
        <Alert className="my-2 mb-16 rounded-lg" variant="default">
          <Clock className="h-4 w-4 text-green-500" />
          <AlertTitle className="flex items-center gap-1 text-sm">
            <Check className="h-4 w-4 text-green-500" /> Confirmado:
            {analysisResults.patterns && analysisResults.patterns.some(p => p.action === 'compra' && p.confidence > 0.6) ? 
              <ArrowUp className="h-4 w-4 text-green-500" /> : 
              <ArrowDown className="h-4 w-4 text-red-500" />}
          </AlertTitle>
          <AlertDescription className="text-xs">
            <div className="font-semibold">Entrar: {analysisResults.preciseEntryAnalysis.exactMinute}</div>
            <div>Tipo: {analysisResults.preciseEntryAnalysis.entryType.replace('_', ' de ')}</div>
            <div>Próxima vela: {analysisResults.preciseEntryAnalysis.nextCandleExpectation}</div>
            <div className="mt-1 text-xs bg-black/10 p-1 rounded font-semibold">
              {analysisResults.preciseEntryAnalysis.entryInstructions}
            </div>
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
        <div className="min-h-screen flex flex-col bg-background">
          <motion.header 
            className="border-b border-border/60 bg-card shadow-sm"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`container ${isMobile ? 'py-2' : 'py-4'} flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-bold tracking-tight">Chart Vision AI</h1>
              </div>
              <div className="flex items-center gap-4">
                {!isMobile && (
                  <div className="text-xs text-muted-foreground">
                    Análise Técnica Precisa
                  </div>
                )}
                <UserMenu />
              </div>
            </div>
          </motion.header>
          
          <main className={`flex-1 container ${isMobile ? 'py-3 px-2' : 'py-8'}`}>
            <div className={`text-center ${isMobile ? 'mb-3' : 'mb-8'}`}>
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
                  {/* Keep existing feature icons for desktop */}
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
          </main>
          
          {!isMobile && (
            <footer className="py-3 border-t border-border/60">
              <div className="container text-center text-xs text-muted-foreground">
                <p>Chart Vision AI Analyzer &copy; {new Date().getFullYear()}</p>
                <p className="mt-1">Timing Preciso para Entradas Otimizadas</p>
              </div>
            </footer>
          )}
          
          {/* Add padding at the bottom to account for the mobile navigation bar */}
          {isMobile && <div className="h-16"></div>}
        </div>
      </AnalyzerProvider>
    </LanguageProvider>
  );
};

export default Index;
