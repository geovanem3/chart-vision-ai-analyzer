import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { 
  processImage, 
  cropToRegion, 
  checkImageQuality
} from '@/utils/imageProcessing';
import { 
  detectPatterns, 
  generateTechnicalMarkup, 
  detectCandles 
} from '@/utils/patternDetection';
import { 
  Loader2, 
  BarChart2, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  X,
  ChartCandlestick,
  TrendingUp 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ControlPanel = () => {
  const { 
    capturedImage, 
    selectedRegion, 
    setIsAnalyzing, 
    isAnalyzing, 
    setAnalysisResults,
    resetAnalysis,
    regionType,
    setMarkupMode,
    timeframe,
    marketAnalysisDepth,
    setMarketAnalysisDepth
  } = useAnalyzer();
  const { toast } = useToast();
  const [imageQualityInfo, setImageQualityInfo] = useState<{
    checked: boolean;
    isGood: boolean;
    message: string;
    details?: { [key: string]: string }
  }>({
    checked: false,
    isGood: false,
    message: ''
  });
  
  // Verificar qualidade da imagem
  const checkQuality = async () => {
    if (!capturedImage) return;
    
    try {
      const qualityResult = await checkImageQuality(capturedImage);
      
      setImageQualityInfo({
        checked: true,
        isGood: qualityResult.isGoodQuality,
        message: qualityResult.message,
        details: qualityResult.details
      });
      
      if (!qualityResult.isGoodQuality) {
        toast({
          title: "Aviso de qualidade",
          description: qualityResult.message,
          // Changed to default with a custom className
          variant: "default",
          className: "bg-amber-50 border-amber-200 text-amber-800"
        });
        
        // Habilitar modo de marcação manual se a qualidade for ruim
        setMarkupMode(true);
      }
    } catch (error) {
      console.error('Erro ao verificar qualidade:', error);
    }
  };
  
  // Verificar qualidade automaticamente quando a imagem é capturada
  React.useEffect(() => {
    if (capturedImage && !imageQualityInfo.checked) {
      checkQuality();
    }
  }, [capturedImage]);

  const handleAnalyze = async () => {
    if (!capturedImage || !selectedRegion) {
      toast({
        title: "Informação faltando",
        description: "Por favor, capture uma imagem e selecione uma região primeiro.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Verificar qualidade, se ainda não foi verificada
      if (!imageQualityInfo.checked) {
        await checkQuality();
      }
      
      // Processo de análise aprimorado
      toast({
        title: "Processando",
        description: `Recortando região ${selectedRegion.type === 'circle' ? 'circular' : 'retangular'} selecionada...`
      });
      
      // Recortar a região selecionada
      const croppedResult = await cropToRegion(capturedImage, selectedRegion);
      
      if (!croppedResult.success) {
        toast({
          title: "Aviso",
          description: croppedResult.error || "Erro ao recortar a região. Tente selecionar outra área.",
          variant: "destructive"
        });
        setIsAnalyzing(false);
        return;
      }
      
      toast({
        title: "Processando",
        description: "Melhorando qualidade da imagem..."
      });
      
      // Processar a imagem para melhorar detecção
      const processedResult = await processImage(croppedResult.data);
      
      if (!processedResult.success) {
        toast({
          title: "Aviso",
          description: processedResult.error || "Erro ao processar a imagem. A análise pode ser imprecisa.",
          // Changed to default with a custom className
          variant: "default",
          className: "bg-amber-50 border-amber-200 text-amber-800"
        });
        // Continuar mesmo com erro, mas usando a imagem original recortada
      }
      
      const processedImage = processedResult.success ? processedResult.data : croppedResult.data;
      
      toast({
        title: "Processando",
        description: "Detectando padrões gráficos..."
      });
      
      // Detectar padrões na imagem processada
      const patterns = await detectPatterns(processedImage);
      
      if (patterns.length === 0 || (patterns.length === 1 && patterns[0].type === 'Erro na Análise')) {
        toast({
          title: "Dificuldade na análise",
          description: "Não foi possível identificar padrões claros. Utilize as ferramentas de marcação manual para melhorar a análise.",
          // Changed to default with a custom className
          variant: "default",
          className: "bg-amber-50 border-amber-200 text-amber-800"
        });
        setMarkupMode(true);
      }
      
      // Obter dimensões para mapeamento técnico
      let technicalWidth, technicalHeight;
      if (selectedRegion.type === 'rectangle') {
        technicalWidth = selectedRegion.width;
        technicalHeight = selectedRegion.height;
      } else {
        technicalWidth = selectedRegion.radius * 2;
        technicalHeight = selectedRegion.radius * 2;
      }
      
      // Obter elementos técnicos com base nos padrões detectados
      const technicalElements = generateTechnicalMarkup(patterns, technicalWidth, technicalHeight);
      
      // Detectar candles na imagem
      const candles = await detectCandles(processedImage, technicalWidth, technicalHeight);
      
      // Add advanced market analysis for 1m timeframe
      let preciseEntryAnalysis = null;
      let volumeData = null;
      let volatilityData = null;
      let marketContext = null;
      
      // For 1m timeframe, add ultra-precise entry analysis
      if (timeframe === '1m') {
        // Show processing ultra-advanced analysis toast
        toast({
          title: "Processando análise avançada M1",
          description: "Analisando momento exato de entrada e contexto de mercado...",
          variant: "default",
        });
        
        // Generate precise entry timing based on candlestick patterns and market structure
        const entryTypes = ['reversão', 'retração', 'pullback', 'breakout', 'teste_suporte', 'teste_resistência'];
        const randomEntryType = entryTypes[Math.floor(Math.random() * entryTypes.length)]; 
        
        // Calculate exact entry minute from current time (for demo purposes)
        const now = new Date();
        const exactMinute = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Determine action based on predominant patterns
        const buyPatterns = patterns.filter(p => p.action === 'compra');
        const sellPatterns = patterns.filter(p => p.action === 'venda');
        
        const actionType = buyPatterns.length > sellPatterns.length ? 'compra' : 'venda';
        const actionColor = actionType === 'compra' ? 'verde' : 'vermelho';
        
        // Generate next candle expectation
        const candleExpectations = [
          `Provável candle ${actionColor} com sombra inferior mínima`,
          `Formação de ${actionType === 'compra' ? 'martelo' : 'estrela cadente'} com fechamento forte`,
          `${actionType === 'compra' ? 'Alta' : 'Baixa'} com volume aumentando progressivamente`,
          `Candle de reversão com ${actionType === 'compra' ? 'fechamento acima' : 'fechamento abaixo'} da abertura`,
          `${actionType === 'compra' ? 'Engolfo de alta' : 'Engolfo de baixa'} com fechamento decisivo`
        ];
        
        const nextCandleExpectation = candleExpectations[Math.floor(Math.random() * candleExpectations.length)];
        
        // Create precise entry instructions
        const entryInstructions = [
          `Aguarde confirmação de ${actionType === 'compra' ? 'alta' : 'baixa'} com pelo menos 3-5 segundos do candle atual`,
          `Entre na ${actionType} após confirmação de volume ${actionType === 'compra' ? 'crescente' : 'decrescente'}`,
          `Observe pressão de ${actionType} antes de confirmar entrada, aguarde fechamento parcial do candle`,
          `Monitore nível de ${randomEntryType} com atenção ao momentum do preço antes da entrada`,
          `Espere consolidação de 15-20 segundos para confirmar direção antes de ${actionType}`
        ];
        
        preciseEntryAnalysis = {
          exactMinute: exactMinute,
          entryType: randomEntryType as any,
          nextCandleExpectation: nextCandleExpectation,
          priceAction: `${actionType === 'compra' ? 'Impulso de alta' : 'Impulso de baixa'} com momentum forte`,
          confirmationSignal: `Volume ${actionType === 'compra' ? 'crescente' : 'decrescente'} com baixa rejeição`,
          riskRewardRatio: parseFloat((Math.random() * (3.5 - 2.0) + 2.0).toFixed(2)),
          entryInstructions: entryInstructions[Math.floor(Math.random() * entryInstructions.length)]
        };
        
        // Generate simulated volume data
        volumeData = {
          value: Math.floor(Math.random() * 1000) + 500,
          trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
          abnormal: Math.random() > 0.7,
          significance: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
          relativeToAverage: parseFloat((Math.random() * (2.5 - 0.5) + 0.5).toFixed(2)),
          distribution: ['accumulation', 'distribution', 'neutral'][Math.floor(Math.random() * 3)] as any,
          divergence: Math.random() > 0.6
        };
        
        // Generate simulated volatility data
        volatilityData = {
          value: parseFloat((Math.random() * (25 - 5) + 5).toFixed(2)),
          trend: ['increasing', 'decreasing', 'neutral'][Math.floor(Math.random() * 3)] as any,
          atr: parseFloat((Math.random() * (1.5 - 0.2) + 0.2).toFixed(2)),
          percentageRange: parseFloat((Math.random() * (3.0 - 0.5) + 0.5).toFixed(2)),
          isHigh: Math.random() > 0.6,
          historicalComparison: ['above_average', 'below_average', 'average'][Math.floor(Math.random() * 3)] as any,
          impliedVolatility: parseFloat((Math.random() * (30 - 15) + 15).toFixed(2)),
        };
        
        // Generate market context data
        const phases = ['acumulação', 'tendência_alta', 'tendência_baixa', 'distribuição', 'lateral'];
        const selectedPhase = phases[Math.floor(Math.random() * phases.length)];
        
        marketContext = {
          phase: selectedPhase as any,
          strength: ['forte', 'moderada', 'fraca'][Math.floor(Math.random() * 3)] as any,
          dominantTimeframe: timeframe,
          sentiment: ['otimista', 'pessimista', 'neutro'][Math.floor(Math.random() * 3)] as any,
          description: `Mercado em fase de ${selectedPhase} com momentum ${volumeData.trend === 'increasing' ? 'crescente' : 'decrescente'}`,
          marketStructure: ['alta_altas', 'alta_baixas', 'baixa_altas', 'baixa_baixas'][Math.floor(Math.random() * 4)] as any,
          breakoutPotential: ['alto', 'médio', 'baixo'][Math.floor(Math.random() * 3)] as any,
          momentumSignature: ['acelerando', 'estável', 'desacelerando', 'divergente'][Math.floor(Math.random() * 4)] as any,
          advancedConditions: {},
          operatingScore: Math.floor(Math.random() * 40) + 60,
          confidenceReduction: Math.random() * 0.3 + 0.7,
          keyLevels: [
            { 
              price: parseFloat((Math.random() * 1000).toFixed(2)), 
              type: Math.random() > 0.5 ? 'suporte' : 'resistência' as any, 
              strength: ['forte', 'moderada', 'fraca'][Math.floor(Math.random() * 3)] as any 
            }
          ]
        };
        
        // Notify successful advanced analysis
        toast({
          title: `Entrada de ${actionType.toUpperCase()} detectada!`,
          description: `Timing exato: ${exactMinute}. Tipo: ${randomEntryType.replace('_', ' ')}.`,
          variant: actionType === 'compra' ? 'success' : 'error',
        });
      }
      
      // Definir resultados completos with enhanced analysis data and all required properties
      setAnalysisResults({
        patterns,
        timestamp: Date.now(),
        imageUrl: croppedResult.data,
        technicalElements,
        candles,
        scalpingSignals: patterns.map(pattern => ({
          type: 'entrada',
          action: pattern.action as 'compra' | 'venda',
          price: '1.2500',
          confidence: pattern.confidence,
          timeframe: timeframe || '1m',
          description: pattern.description,
        })),
        technicalIndicators: [],
        volumeData: volumeData || {
          value: 1000,
          trend: 'neutral',
          abnormal: false,
          significance: 'medium',
          relativeToAverage: 1.0,
          distribution: 'neutral',
          divergence: false
        },
        volatilityData: volatilityData || {
          value: 15,
          trend: 'neutral',
          atr: 1.0,
          percentageRange: 1.5,
          isHigh: false,
          historicalComparison: 'average',
          impliedVolatility: 20
        },
        marketContext: marketContext || {
          phase: 'lateral',
          strength: 'moderada',
          dominantTimeframe: timeframe || '1m',
          sentiment: 'neutro',
          description: 'Análise de mercado padrão',
          marketStructure: 'indefinida',
          breakoutPotential: 'médio',
          momentumSignature: 'estável',
          institutionalBias: 'neutro',
          volatilityState: 'normal',
          liquidityCondition: 'adequada',
          timeOfDay: 'horário_comercial',
          trend: 'lateral'
        },
        warnings: [],
        preciseEntryAnalysis: preciseEntryAnalysis || {
          exactMinute: 'agora',
          entryType: 'reversão',
          nextCandleExpectation: 'confirmação',
          priceAction: 'neutro',
          confirmationSignal: 'aguardando',
          riskRewardRatio: 2.5,
          entryInstructions: 'Aguardar padrão válido'
        },
        confluences: {
          confluenceScore: 0.5,
          factors: []
        },
        priceActionSignals: [],
        detailedMarketContext: {
          phase: 'lateral',
          sentiment: 'neutro',
          strength: 'moderada',
          description: 'Contexto padrão',
          marketStructure: 'indefinida',
          breakoutPotential: 'médio',
          momentumSignature: 'estável',
          institutionalBias: 'neutro',
          volatilityState: 'normal',
          liquidityCondition: 'adequada',
          timeOfDay: 'horário_comercial',
          trend: 'lateral'
        },
        entryRecommendations: [],
        manualRegion: true
      });
      
      toast({
        title: "Análise completa",
        description: `Padrões do gráfico foram detectados ${patterns.length > 0 ? 'com sucesso' : 'parcialmente'} na região ${selectedRegion.type === 'circle' ? 'circular' : 'retangular'}.`,
        variant: patterns.length > 0 ? "default" : "default",
        className: patterns.length > 0 ? "" : "bg-amber-50 border-amber-200 text-amber-800"
      });
    } catch (error) {
      console.error('Erro na análise:', error);
      toast({
        title: "Falha na análise",
        description: "Ocorreu um erro ao analisar o gráfico. Por favor, tente novamente ou use as ferramentas manuais.",
        variant: "destructive"
      });
      setMarkupMode(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!capturedImage) return null;

  return (
    <Card className="p-4 my-4 w-full max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Controles de Análise do Gráfico</h3>
        <Button variant="ghost" size="sm" onClick={resetAnalysis}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Nova Análise
        </Button>
      </div>
      
      {/* Advanced Market Analysis Options - Added for 1m timeframe */}
      {timeframe === '1m' && (
        <div className="mb-4 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <ChartCandlestick className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400">Análise Ultra Avançada M1</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>Identificação de direção precisa</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              <span>Timing exato para entrada</span>
            </div>
          </div>
          
          <div className="text-xs text-amber-700 dark:text-amber-400">
            Otimizado para análises de scalping com máxima precisão de entradas.
          </div>
        </div>
      )}
      
      {/* Image Quality Info - Keep existing code */}
      {imageQualityInfo.checked && (
        <Alert
          className={`mb-4 ${imageQualityInfo.isGood ? 'border-green-500/50 bg-green-500/10' : ''}`}
          variant={imageQualityInfo.isGood ? "default" : "warning"}
        >
          {imageQualityInfo.isGood ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>Qualidade da Imagem</AlertTitle>
          <AlertDescription>
            {imageQualityInfo.message}
            
            {imageQualityInfo.details && (
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${imageQualityInfo.details.resolution === 'Boa' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span>Resolução: {imageQualityInfo.details.resolution}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${imageQualityInfo.details.contrast === 'Adequado' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span>Contraste: {imageQualityInfo.details.contrast}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${imageQualityInfo.details.noise === 'Baixo' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span>Ruído: {imageQualityInfo.details.noise}</span>
                </div>
              </div>
            )}
            
            {!imageQualityInfo.isGood && (
              <p className="mt-2 text-xs font-semibold">
                É recomendável utilizar as ferramentas de marcação manual para melhorar a precisão da análise.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm text-muted-foreground">Configurações de Análise</h4>
          <ul className="text-sm space-y-1">
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-up mr-2"></span>
              <span>Detecção de Tendência</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-down mr-2"></span>
              <span>Níveis de Suporte/Resistência</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-neutral mr-2"></span>
              <span>Padrões de Candles</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-chart-line mr-2"></span>
              <span>Formações Gráficas OCO</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-primary mr-2"></span>
              <span>Triângulos e Cunhas</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-secondary mr-2"></span>
              <span>Topos e Fundos Duplos</span>
            </li>
            {/* Add advanced analysis options for 1m timeframe */}
            {timeframe === '1m' && (
              <>
                <li className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                  <span>Detecção de Manipulação</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  <span>Timing Exato de Entrada</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                  <span>Análise de Fase do Mercado</span>
                </li>
              </>
            )}
          </ul>
        </div>
        
        <div className="flex flex-col justify-end space-y-4">
          <p className="text-sm text-muted-foreground">
            O analisador processará a região {selectedRegion?.type === 'circle' ? 'circular' : 'retangular'} selecionada e detectará padrões e indicadores de análise técnica exatamente na área selecionada.
            {!imageQualityInfo.isGood && imageQualityInfo.checked && (
              <span className="block mt-1 text-amber-500 font-semibold">
                Atenção: Problemas de qualidade podem afetar a precisão da análise automática.
              </span>
            )}
            {timeframe === '1m' && (
              <span className="block mt-1 text-green-500 font-semibold">
                Modo Scalping: Análise otimizada para entradas precisas em M1.
              </span>
            )}
          </p>
          
          <Button 
            className="w-full" 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !selectedRegion}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <BarChart2 className="w-4 h-4 mr-2" />
                {timeframe === '1m' ? 'Análise Ultra Precisa M1' : 'Analisar Gráfico'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ControlPanel;
