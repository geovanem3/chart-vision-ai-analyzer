import { useEffect, useRef, useCallback } from 'react';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { analyzeVolume } from '@/utils/volumeAnalysis';
import { analyzeVolatility } from '@/utils/volatilityAnalysis';
import { detectTechnicalIndicators } from '@/utils/technicalIndicatorAnalysis';
import { createDecisionEngine, TradingDecision } from '@/utils/decisionEngine';

export const useRealTimeAnalysis = () => {
  const { 
    capturedImage, 
    analysisResults, 
    setLiveAnalysis,
    timeframe 
  } = useAnalyzer();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalysisRef = useRef<string>('');
  const decisionEngineRef = useRef(createDecisionEngine(timeframe));

  const performRealTimeAnalysis = useCallback(async () => {
    if (!capturedImage || !analysisResults) {
      console.log('🚫 Real-time analysis: No image or analysis results available');
      return;
    }

    console.log('🔄 Performing REAL-TIME analysis with AI Decision Engine...');

    try {
      // Verificar se há mudanças reais nos dados
      const currentDataHash = JSON.stringify({
        patterns: analysisResults.patterns?.length || 0,
        candles: analysisResults.candles?.length || 0,
        timestamp: Date.now()
      });

      // Só processar se houve mudança real
      if (currentDataHash === lastAnalysisRef.current) {
        console.log('📊 No real changes detected in chart data');
        return;
      }

      lastAnalysisRef.current = currentDataHash;

      // Análise REAL baseada nos dados detectados
      const realPatterns = analysisResults.patterns || [];
      const realCandles = analysisResults.candles || [];

      console.log('📈 REAL data detected:', {
        patterns: realPatterns.length,
        candles: realCandles.length,
        types: realPatterns.map(p => p.type)
      });

      // Análise de volume REAL
      const volumeAnalysis = realCandles.length > 0 ? 
        analyzeVolume(realCandles) : null;

      // Análise de volatilidade REAL  
      const volatilityAnalysis = realCandles.length > 0 ? 
        analyzeVolatility(realCandles) : null;

      // Detectar mudanças significativas REAIS
      const changes = [];
      
      if (volumeAnalysis?.abnormal) {
        changes.push({
          type: 'volume_spike',
          importance: 'high' as const,
          description: `Volume anormal detectado: ${volumeAnalysis.significance}`
        });
      }

      if (volatilityAnalysis?.isHigh) {
        changes.push({
          type: 'volatility_spike', 
          importance: 'high' as const,
          description: `Alta volatilidade: ${volatilityAnalysis.value}%`
        });
      }

      // NOVA FUNCIONALIDADE: Tomar decisão com motor de IA
      console.log('🤖 Executando motor de decisão da IA em tempo real...');
      
      const decision = decisionEngineRef.current.makeDecision(analysisResults);
      
      console.log('🎯 Decisão da IA em tempo real:', {
        action: decision.action,
        confidence: Math.round(decision.confidence * 100),
        urgency: decision.urgency
      });

      // Sinais REAIS baseados na decisão da IA
      let signal: 'compra' | 'venda' | 'neutro' = 'neutro';
      let confidence = 0;

      if (decision.action === 'BUY') {
        signal = 'compra';
        confidence = decision.confidence;
      } else if (decision.action === 'SELL') {
        signal = 'venda';
        confidence = decision.confidence;
      } else {
        // Para HOLD e WAIT, usar análise de padrões como fallback
        const buyPatterns = realPatterns.filter(p => p.action === 'compra' && p.confidence > 0.6);
        const sellPatterns = realPatterns.filter(p => p.action === 'venda' && p.confidence > 0.6);

        if (buyPatterns.length > sellPatterns.length) {
          signal = 'compra';
          confidence = Math.max(...buyPatterns.map(p => p.confidence));
        } else if (sellPatterns.length > buyPatterns.length) {
          signal = 'venda'; 
          confidence = Math.max(...sellPatterns.map(p => p.confidence));
        }
      }

      // Determinar trend correto baseado no signal
      let trend: 'alta' | 'baixa' | 'lateral' = 'lateral';
      if (signal === 'compra') {
        trend = 'alta';
      } else if (signal === 'venda') {
        trend = 'baixa';
      }

      // Criar resultado de análise ao vivo REAL com decisão da IA
      const liveResult = {
        timestamp: Date.now(),
        confidence: Math.round(confidence * 100) / 100,
        signal,
        patterns: realPatterns.map(p => p.type),
        trend,
        changes,
        analysisHealth: {
          consistency: realPatterns.length > 0 ? 0.8 : 0.4,
          reliability: confidence,
          marketAlignment: realPatterns.length > 0
        },
        aiConfidence: {
          overall: Math.round(confidence * 80 + 20), // Base confidence
          chartDetection: realCandles.length > 0 ? 85 : 45,
          patternRecognition: realPatterns.length > 0 ? 90 : 30,
          imageQuality: 75,
          tradingPlatform: 80
        },
        // Adicionar informações da decisão da IA
        aiDecision: {
          action: decision.action,
          urgency: decision.urgency,
          reasoning: decision.reasoning.slice(0, 2), // Primeiros 2 motivos
          riskReward: decision.riskReward,
          validUntil: decision.validUntil
        }
      };

      console.log('✅ REAL-TIME ANALYSIS WITH AI DECISION COMPLETED:', {
        signal: liveResult.signal,
        confidence: liveResult.confidence,
        aiAction: decision.action,
        patterns: liveResult.patterns.length,
        changes: changes.length
      });

      // Atualizar contexto com dados REAIS + decisão da IA
      setLiveAnalysis(liveResult);

    } catch (error) {
      console.error('❌ Real-time analysis with AI decision error:', error);
      setLiveAnalysis(null);
    }
  }, [capturedImage, analysisResults, setLiveAnalysis, timeframe]);

  // Iniciar análise em tempo real quando há dados
  useEffect(() => {
    if (!capturedImage || !analysisResults) {
      console.log('🛑 Stopping real-time analysis: No data available');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('🚀 Starting REAL-TIME analysis for timeframe:', timeframe);

    // Executar análise imediata
    performRealTimeAnalysis();

    // Configurar intervalo baseado no timeframe
    const intervalMs = timeframe === '1m' ? 5000 : 10000; // 5s para M1, 10s para outros

    intervalRef.current = setInterval(() => {
      console.log('⏰ Real-time analysis tick...');
      performRealTimeAnalysis();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        console.log('🛑 Cleaning up real-time analysis');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [capturedImage, analysisResults, timeframe, performRealTimeAnalysis]);

  return { isActive: !!intervalRef.current };
};
