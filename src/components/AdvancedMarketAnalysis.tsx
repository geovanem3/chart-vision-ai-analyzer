
import React from 'react';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, TrendingDown, CircleArrowUp, CircleArrowDown, 
  ChartBar, ChartCandlestick, SquareArrowUp, SquareArrowDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdvancedMarketAnalysis = () => {
  const { 
    analysisResults, 
    timeframe, 
    marketAnalysisDepth,
    marketContextEnabled
  } = useAnalyzer();
  const { toast } = useToast();

  // Verificar se a análise está disponível antes de tentar renderizar
  if (!analysisResults) return null;
  
  // Verificar o timeframe
  if (timeframe !== '1m') return null;

  // Safe access to pattern data with fallback
  const patterns = analysisResults.patterns || [];
  const isUptrend = patterns.some(p => p.action === 'compra' && p.confidence > 0.65);
  const isDowntrend = patterns.some(p => p.action === 'venda' && p.confidence > 0.65);
  
  // Safe access to market context data with proper type handling
  const marketContext = analysisResults.marketContext || {
    liquidityPools: [],
    phase: 'indefinida',
    strength: 'moderada',
    description: '',
    dominantTimeframe: '1m',
    sentiment: 'neutro',
    marketStructure: 'indefinida',
    breakoutPotential: 'baixo',
    momentumSignature: 'estável'
  };
  
  // Verificando se liquidityPools existe e tem o método some antes de chamá-lo
  const hasManipulationSigns = Array.isArray(marketContext.liquidityPools) && 
    marketContext.liquidityPools.some(pool => pool && pool.strength === 'alta') || false;
    
  const marketPhase = marketContext.phase || 'indefinida';
  const marketStrength = marketContext.strength || 'moderada';
  
  // Safe access to precise entry analysis with proper type handling
  const preciseEntryAnalysis = analysisResults.preciseEntryAnalysis || {
    exactMinute: 'pendente',
    entryType: '',
    nextCandleExpectation: 'aguardando análise',
    priceAction: '',
    confirmationSignal: '',
    riskRewardRatio: 0,
    entryInstructions: ''
  };
  
  const entryCondition = preciseEntryAnalysis.entryType || '';
  const entryMinute = preciseEntryAnalysis.exactMinute || 'pendente';
  const nextCandleExpectation = preciseEntryAnalysis.nextCandleExpectation || 'aguardando análise';
  
  // Ultra quick entry decision - just the bare direction and when
  const quickEntrySignal = () => {
    if (isUptrend) {
      toast({
        title: "ENTRADA: COMPRA",
        description: `Momento exato: ${entryMinute}. Próximo candle: ${nextCandleExpectation.substring(0, 30)}...`,
        variant: "success",
      });
      
      return (
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md border border-green-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleArrowUp className="h-6 w-6 text-green-500 animate-pulse" />
            <span className="font-bold text-green-700 dark:text-green-400 text-xl">COMPRAR</span>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">{entryMinute}</div>
            <div className="text-xs opacity-70">Confirmado</div>
          </div>
        </div>
      );
    }
    
    if (isDowntrend) {
      toast({
        title: "ENTRADA: VENDA",
        description: `Momento exato: ${entryMinute}. Próximo candle: ${nextCandleExpectation.substring(0, 30)}...`,
        variant: "error",
      });
      
      return (
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-md border border-red-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleArrowDown className="h-6 w-6 text-red-500 animate-pulse" />
            <span className="font-bold text-red-700 dark:text-red-400 text-xl">VENDER</span>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">{entryMinute}</div>
            <div className="text-xs opacity-70">Confirmado</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBar className="h-6 w-6 text-gray-500" />
          <span className="font-bold text-gray-700 dark:text-gray-400 text-xl">AGUARDAR</span>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm">Sem sinal claro</div>
          <div className="text-xs opacity-70">Monitorando</div>
        </div>
      </div>
    );
  };
  
  // Market manipulation awareness display 
  const manipulationAwarenessDisplay = () => {
    if (!marketContextEnabled) return null;
    
    return (
      <Alert className="mt-3" variant={hasManipulationSigns ? "warning" : "default"}>
        <ChartCandlestick className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {marketPhase !== 'indefinida' ? 
            `Fase: ${marketPhase.charAt(0).toUpperCase() + marketPhase.slice(1)}` : 
            'Fase: Indefinida'}
          <span className="text-xs bg-primary/10 px-1 rounded">{marketStrength}</span>
        </AlertTitle>
        <AlertDescription className="text-sm">
          {hasManipulationSigns ? (
            <span className="font-medium">Alerta: Possível manipulação detectada. Use cautela extrema.</span>
          ) : (
            <span>Mercado operando dentro dos padrões normais.</span>
          )}
          {preciseEntryAnalysis.entryInstructions && (
            <div className="mt-1 text-xs border-l-2 border-primary pl-2">
              {preciseEntryAnalysis.entryInstructions}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-2 my-3">
      <h3 className="text-sm font-medium text-muted-foreground mb-1">Análise Ultra Rápida M1</h3>
      
      {/* Clear entry signal - no reading required */}
      {quickEntrySignal()}
      
      {/* Manipulation awareness - keeps the trader informed */}
      {manipulationAwarenessDisplay()}
      
      {/* Technical details - only if comprehensive analysis selected */}
      {marketAnalysisDepth === 'comprehensive' && analysisResults.volumeData && analysisResults.volatilityData && (
        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
          <div className="p-1 border rounded flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${analysisResults.volumeData.abnormal ? 'bg-amber-500' : 'bg-green-500'}`}></span>
            <span>Volume: {analysisResults.volumeData.significance}</span>
          </div>
          
          <div className="p-1 border rounded flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${analysisResults.volatilityData.isHigh ? 'bg-amber-500' : 'bg-green-500'}`}></span>
            <span>Volatilidade: {analysisResults.volatilityData.historicalComparison}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedMarketAnalysis;
