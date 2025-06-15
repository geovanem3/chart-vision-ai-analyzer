import React from 'react';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, TrendingDown, CircleArrowUp, CircleArrowDown, 
  ChartBar, CandlestickChart, SquareArrowUp, SquareArrowDown,
  AlertTriangle, ShieldAlert, Activity, Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedMarketContext } from '@/context/AnalyzerContext';

const AdvancedMarketAnalysis = () => {
  const { 
    analysisResults, 
    timeframe, 
    marketAnalysisDepth,
    marketContextEnabled,
    capturedImage,
    isAnalyzing
  } = useAnalyzer();
  const { toast } = useToast();

  console.log('AdvancedMarketAnalysis - analysisResults:', analysisResults);
  console.log('AdvancedMarketAnalysis - patterns:', analysisResults?.patterns);

  // Verificar se há uma imagem capturada
  if (!capturedImage) return null;
  
  // Verificar se a análise está sendo realizada
  if (isAnalyzing) {
    return (
      <div className="space-y-2 my-3">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Analisando condições de mercado...</h3>
        <div className="p-4 border rounded-md bg-card">
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
            <div className="ml-2">Processando análise avançada</div>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se a análise está disponível
  if (!analysisResults) {
    return (
      <div className="space-y-2 my-3">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Aguardando análise</h3>
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <ChartBar className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-400">Configure a análise e pressione "Analisar"</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Verificar o timeframe
  if (timeframe !== '1m') return null;

  // CORRIGIDO: Usar dados reais da análise dos padrões detectados
  const patterns = analysisResults.patterns || [];
  console.log('AdvancedMarketAnalysis - patterns disponíveis:', patterns);
  
  // Filtrar padrões por ação com dados reais
  const buyPatterns = patterns.filter(p => {
    console.log(`Checking pattern ${p.type}: action=${p.action}, confidence=${p.confidence}`);
    return p.action === 'compra' && p.confidence > 0.5;
  });
  
  const sellPatterns = patterns.filter(p => {
    console.log(`Checking pattern ${p.type}: action=${p.action}, confidence=${p.confidence}`);
    return p.action === 'venda' && p.confidence > 0.5;
  });
  
  console.log('AdvancedMarketAnalysis - buyPatterns:', buyPatterns);
  console.log('AdvancedMarketAnalysis - sellPatterns:', sellPatterns);
  
  const isUptrend = buyPatterns.length > 0;
  const isDowntrend = sellPatterns.length > 0;
  
  // Safe access to enhanced market context
  const marketContext = analysisResults.marketContext || {};
  const advancedConditions = (marketContext as EnhancedMarketContext).advancedConditions;
  const operatingScore = (marketContext as EnhancedMarketContext).operatingScore || 50;
  const confidenceReduction = (marketContext as EnhancedMarketContext).confidenceReduction || 1.0;
  
  // Determinar cor do score baseado no valor
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100 border-green-300';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };
  
  // Determinar ícone baseado na recomendação
  const getRecommendationIcon = (recommendation?: string) => {
    switch (recommendation) {
      case 'nao_operar': return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case 'muito_cauteloso': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'operar_reduzido': return <Activity className="h-5 w-5 text-yellow-500" />;
      default: return <ChartBar className="h-5 w-5 text-green-500" />;
    }
  };
  
  // Safe access to precise entry analysis
  const preciseEntryAnalysis = analysisResults.preciseEntryAnalysis || {
    exactMinute: 'pendente',
    entryType: 'reversão' as const,
    nextCandleExpectation: 'aguardando análise',
    priceAction: '',
    confirmationSignal: '',
    riskRewardRatio: 0,
    entryInstructions: ''
  };
  
  const entryMinute = preciseEntryAnalysis.exactMinute || 'pendente';
  
  // Ultra quick entry decision with real pattern data
  const quickEntrySignal = () => {
    console.log('quickEntrySignal - Checking conditions:', {
      operatingScore,
      isUptrend,
      isDowntrend,
      buyPatternsCount: buyPatterns.length,
      sellPatternsCount: sellPatterns.length,
      advancedConditionsRecommendation: advancedConditions?.recommendation
    });

    // Se as condições são muito ruins, não dar sinal
    if (operatingScore < 30 || advancedConditions?.recommendation === 'nao_operar') {
      return (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-red-500 animate-pulse" />
            <span className="font-bold text-red-700 dark:text-red-400 text-xl">NÃO OPERAR</span>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">Score: {operatingScore}/100</div>
            <div className="text-xs opacity-70">Condições adversas</div>
          </div>
        </div>
      );
    }
    
    if (isUptrend && operatingScore >= 40) {
      const strongestBuyPattern = buyPatterns.reduce((prev, current) => 
        (current.confidence > prev.confidence) ? current : prev
      );
      const adjustedConfidence = Math.round(strongestBuyPattern.confidence * confidenceReduction * 100);
      
      console.log('Showing BUY signal for pattern:', strongestBuyPattern);
      
      return (
        <div className={`p-3 rounded-lg border flex items-center justify-between ${
          operatingScore >= 60 ? 
          'bg-green-100 dark:bg-green-900/30 border-green-500' :
          'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500'
        }`}>
          <div className="flex items-center gap-2">
            <CircleArrowUp className={`h-7 w-7 animate-pulse ${
              operatingScore >= 60 ? 'text-green-500' : 'text-yellow-600'
            }`} />
            <div>
              <span className={`font-bold text-xl ${
                operatingScore >= 60 ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
              }`}>
                COMPRAR {operatingScore < 60 ? '(CAUTELOSO)' : ''}
              </span>
              <div className="text-xs opacity-80">
                {strongestBuyPattern.type.toUpperCase()} - {strongestBuyPattern.description}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">{entryMinute}</div>
            <div className="text-xs opacity-70">Conf: {adjustedConfidence}%</div>
          </div>
        </div>
      );
    }
    
    if (isDowntrend && operatingScore >= 40) {
      const strongestSellPattern = sellPatterns.reduce((prev, current) => 
        (current.confidence > prev.confidence) ? current : prev
      );
      const adjustedConfidence = Math.round(strongestSellPattern.confidence * confidenceReduction * 100);
      
      console.log('Showing SELL signal for pattern:', strongestSellPattern);
      
      return (
        <div className={`p-3 rounded-lg border flex items-center justify-between ${
          operatingScore >= 60 ? 
          'bg-red-100 dark:bg-red-900/30 border-red-500' :
          'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500'
        }`}>
          <div className="flex items-center gap-2">
            <CircleArrowDown className={`h-7 w-7 animate-pulse ${
              operatingScore >= 60 ? 'text-red-500' : 'text-yellow-600'
            }`} />
            <div>
              <span className={`font-bold text-xl ${
                operatingScore >= 60 ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'
              }`}>
                VENDER {operatingScore < 60 ? '(CAUTELOSO)' : ''}
              </span>
              <div className="text-xs opacity-80">
                {strongestSellPattern.type.toUpperCase()} - {strongestSellPattern.description}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">{entryMinute}</div>
            <div className="text-xs opacity-70">Conf: {adjustedConfidence}%</div>
          </div>
        </div>
      );
    }
    
    console.log('No clear signal - showing WAIT state');
    
    return (
      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBar className="h-6 w-6 text-gray-500" />
          <span className="font-bold text-gray-700 dark:text-gray-400 text-lg">AGUARDAR</span>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm">Score: {operatingScore}/100</div>
          <div className="text-xs opacity-70">
            {patterns.length > 0 ? `${patterns.length} padrões detectados` : 'Sem padrões detectados'}
          </div>
        </div>
      </div>
    );
  };
  
  // Market conditions awareness display 
  const marketConditionsDisplay = () => {
    if (!marketContextEnabled || !advancedConditions) return null;
    
    return (
      <Alert className={`mt-3 rounded-lg ${getScoreColor(operatingScore)} border-2`}>
        <div className="flex items-center gap-2">
          {getRecommendationIcon(advancedConditions.recommendation)}
          <AlertTitle className="flex items-center gap-2 text-sm">
            Condições de Mercado
            <span className={`text-xs px-2 py-1 rounded font-mono ${getScoreColor(operatingScore)}`}>
              {operatingScore}/100
            </span>
          </AlertTitle>
        </div>
        <AlertDescription className="text-xs mt-2">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div><strong>Regime:</strong> {advancedConditions.marketRegime}</div>
            <div><strong>Dificuldade:</strong> {advancedConditions.operatingDifficulty}</div>
            <div><strong>Manipulação:</strong> {advancedConditions.manipulationRisk}</div>
            <div><strong>Liquidez:</strong> {advancedConditions.liquidityState}</div>
          </div>
          
          {advancedConditions.warnings.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-2 border-red-400">
              <div className="font-semibold text-red-700 dark:text-red-400 mb-1">⚠️ Alertas:</div>
              {advancedConditions.warnings.map((warning, index) => (
                <div key={index} className="text-xs text-red-600 dark:text-red-300">{warning}</div>
              ))}
            </div>
          )}
          
          <div className="mt-2 text-xs opacity-75">
            <strong>Recomendação:</strong> {advancedConditions.recommendation.replace('_', ' ').toUpperCase()}
          </div>
          
          {preciseEntryAnalysis.entryInstructions && (
            <div className="mt-2 text-xs border-l-2 border-primary pl-2">
              {preciseEntryAnalysis.entryInstructions}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-3 my-3 animate-fade-in">
      <h3 className="text-sm font-medium text-muted-foreground mb-1">
        Análise Inteligente M1 
        <span className="ml-2 text-xs bg-primary/10 px-2 py-1 rounded">
          Score: {operatingScore}/100
        </span>
      </h3>
      
      {/* Debug info - para identificar problema */}
      <div className="text-xs bg-blue-50 p-2 rounded border">
        <div><strong>Debug AdvancedMarketAnalysis:</strong></div>
        <div>Total patterns: {patterns.length}</div>
        <div>Buy patterns: {buyPatterns.length}</div>
        <div>Sell patterns: {sellPatterns.length}</div>
        <div>Pattern types: {patterns.map(p => `${p.type}(${p.action})`).join(', ')}</div>
      </div>
      
      {/* Clear entry signal with real pattern data */}
      {quickEntrySignal()}
      
      {/* Advanced market conditions awareness */}
      {marketConditionsDisplay()}
      
      {/* Real patterns detected - show actual patterns found by AI */}
      {patterns.length > 0 && (
        <div className="mt-3 p-3 border rounded-lg bg-muted/30">
          <h4 className="text-sm font-semibold mb-2">Padrões Detectados pela IA:</h4>
          <div className="space-y-1">
            {patterns.slice(0, 3).map((pattern, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className={`font-medium ${
                  pattern.action === 'compra' ? 'text-green-600' : 
                  pattern.action === 'venda' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {pattern.type.toUpperCase()} - {pattern.action.toUpperCase()}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(pattern.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Technical details - only if comprehensive analysis selected */}
      {marketAnalysisDepth === 'comprehensive' && analysisResults.volumeData && analysisResults.volatilityData && (
        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
          <div className="p-2 border rounded-lg flex items-center gap-1">
            <span className={`w-3 h-3 rounded-full ${analysisResults.volumeData.abnormal ? 'bg-amber-500' : 'bg-green-500'}`}></span>
            <span>Volume: {analysisResults.volumeData.significance}</span>
          </div>
          
          <div className="p-2 border rounded-lg flex items-center gap-1">
            <span className={`w-3 h-3 rounded-full ${analysisResults.volatilityData.isHigh ? 'bg-amber-500' : 'bg-green-500'}`}></span>
            <span>Volatilidade: {analysisResults.volatilityData.historicalComparison}</span>
          </div>
        </div>
      )}
      
      {/* Confidence reduction warning */}
      {confidenceReduction < 0.8 && (
        <div className="text-xs bg-orange-50 dark:bg-orange-900/20 p-2 rounded border-l-2 border-orange-400">
          <Zap className="h-3 w-3 inline mr-1" />
          <strong>Confiança reduzida para {Math.round(confidenceReduction * 100)}%</strong> devido às condições de mercado
        </div>
      )}
    </div>
  );
};

export default AdvancedMarketAnalysis;
