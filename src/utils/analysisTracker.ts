import { CandleData, AnalysisResult } from "../context/AnalyzerContext";
import { TemporalValidation } from "./temporalEntryValidation";
import { validateM1Context, logM1ContextValidation, M1ContextValidation } from "./m1ContextValidator";

export interface AnalysisComponent {
  name: string;
  confidence: number;
  weight: number;
  signal: 'compra' | 'venda' | 'neutro';
  data: any;
  isValid: boolean;
}

export interface TrackedAnalysis {
  patterns: AnalysisComponent;
  priceAction: AnalysisComponent;
  volume: AnalysisComponent;
  volatility: AnalysisComponent;
  marketContext: AnalysisComponent;
  confluence: AnalysisComponent;
  temporal: AnalysisComponent;
  technicalIndicators: AnalysisComponent;
  m1Context: AnalysisComponent; // NOVO: Validação M1
}

export interface FinalDecision {
  shouldTrade: boolean;
  signal: 'compra' | 'venda' | 'neutro';
  confidence: number;
  reasoning: string[];
  rejectionReasons: string[];
  components: TrackedAnalysis;
  riskLevel: 'baixo' | 'medio' | 'alto';
  qualityScore: number;
  m1ContextValidation?: M1ContextValidation; // NOVO: Dados M1
}

// Tracker principal que analisa todos os componentes
export const trackAllAnalysisComponents = (
  analysisResults: AnalysisResult,
  temporalValidation?: TemporalValidation
): FinalDecision => {
  
  // 1. Análise de Padrões
  const patternsComponent: AnalysisComponent = {
    name: 'Padrões',
    confidence: 0,
    weight: 0.2, // Reduzido para dar espaço ao M1
    signal: 'neutro',
    data: analysisResults.patterns,
    isValid: false
  };

  if (analysisResults.patterns && analysisResults.patterns.length > 0) {
    const validPatterns = analysisResults.patterns.filter(p => p.action !== 'neutro');
    if (validPatterns.length > 0) {
      // Verificar consistência entre padrões
      const actions = validPatterns.map(p => p.action);
      const uniqueActions = [...new Set(actions)];
      
      if (uniqueActions.length === 1) {
        // Padrões consistentes
        patternsComponent.signal = uniqueActions[0] as 'compra' | 'venda';
        patternsComponent.confidence = validPatterns.reduce((sum, p) => sum + p.confidence, 0) / validPatterns.length;
        patternsComponent.isValid = patternsComponent.confidence > 0.6;
      }
    }
  }

  // 2. Análise de Price Action
  const priceActionComponent: AnalysisComponent = {
    name: 'Price Action',
    confidence: 0,
    weight: 0.15,
    signal: 'neutro',
    data: analysisResults.priceActionSignals || [],
    isValid: false
  };

  if (analysisResults.priceActionSignals && analysisResults.priceActionSignals.length > 0) {
    const paSignals = analysisResults.priceActionSignals.filter((pa: any) => pa.strength === 'forte');
    if (paSignals.length > 0) {
      const strongestPA = paSignals.reduce((prev: any, current: any) => 
        current.confidence > prev.confidence ? current : prev
      );
      priceActionComponent.signal = strongestPA.direction === 'alta' ? 'compra' : 'venda';
      priceActionComponent.confidence = strongestPA.confidence;
      priceActionComponent.isValid = strongestPA.confidence > 0.65;
    }
  }

  // 3. Análise de Volume
  const volumeComponent: AnalysisComponent = {
    name: 'Volume',
    confidence: 0,
    weight: 0.1,
    signal: 'neutro',
    data: analysisResults.volumeData,
    isValid: false
  };

  if (analysisResults.volumeData) {
    const vol = analysisResults.volumeData;
    if (vol.abnormal && vol.significance === 'high') {
      volumeComponent.confidence = 0.8;
      volumeComponent.signal = vol.trend === 'increasing' ? 'compra' : 'venda';
      volumeComponent.isValid = true;
    } else if (vol.significance === 'medium') {
      volumeComponent.confidence = 0.6;
      volumeComponent.isValid = true;
    }
  }

  // 4. Análise de Volatilidade
  const volatilityComponent: AnalysisComponent = {
    name: 'Volatilidade',
    confidence: 0,
    weight: 0.05,
    signal: 'neutro',
    data: analysisResults.volatilityData,
    isValid: false
  };

  if (analysisResults.volatilityData) {
    const vol = analysisResults.volatilityData;
    if (vol.isHigh) {
      volatilityComponent.confidence = 0.3; // Alta volatilidade reduz confiança
      volatilityComponent.isValid = false;
    } else {
      volatilityComponent.confidence = 0.8;
      volatilityComponent.isValid = true;
    }
  }

  // 5. Contexto de Mercado
  const marketContextComponent: AnalysisComponent = {
    name: 'Contexto de Mercado',
    confidence: 0,
    weight: 0.1,
    signal: 'neutro',
    data: analysisResults.marketContext,
    isValid: false
  };

  if (analysisResults.marketContext) {
    const context = analysisResults.marketContext as any;
    if (context.operatingScore) {
      marketContextComponent.confidence = context.operatingScore / 100;
      marketContextComponent.isValid = context.operatingScore >= 50;
      
      if (context.advancedConditions?.recommendation === 'nao_operar') {
        marketContextComponent.isValid = false;
        marketContextComponent.confidence = 0;
      }
    }
  }

  // 6. Análise de Confluência
  const confluenceComponent: AnalysisComponent = {
    name: 'Confluência',
    confidence: 0,
    weight: 0.1,
    signal: 'neutro',
    data: analysisResults.confluences,
    isValid: false
  };

  if (analysisResults.confluences) {
    confluenceComponent.confidence = analysisResults.confluences.confluenceScore / 100;
    confluenceComponent.isValid = analysisResults.confluences.confluenceScore > 60;
  }

  // 7. Validação Temporal
  const temporalComponent: AnalysisComponent = {
    name: 'Validação Temporal',
    confidence: 0,
    weight: 0.05,
    signal: 'neutro',
    data: temporalValidation,
    isValid: false
  };

  if (temporalValidation) {
    temporalComponent.confidence = temporalValidation.winProbability;
    temporalComponent.isValid = temporalValidation.recommendation === 'enter';
    
    if (temporalValidation.recommendation === 'skip') {
      temporalComponent.confidence = 0;
      temporalComponent.isValid = false;
    }
  }

  // 8. Indicadores Técnicos
  const technicalComponent: AnalysisComponent = {
    name: 'Indicadores Técnicos',
    confidence: 0,
    weight: 0.05,
    signal: 'neutro',
    data: analysisResults.technicalIndicators || [],
    isValid: false
  };

  if (analysisResults.technicalIndicators && analysisResults.technicalIndicators.length > 0) {
    const validIndicators = analysisResults.technicalIndicators.filter((ind: any) => 
      ind.signal !== 'neutro' && ind.confidence > 0.6
    );
    
    if (validIndicators.length > 0) {
      technicalComponent.confidence = validIndicators.reduce((sum: number, ind: any) => 
        sum + ind.confidence, 0) / validIndicators.length;
      technicalComponent.isValid = technicalComponent.confidence > 0.65;
    }
  }

  // 9. NOVO: Validação M1 Context - PESO MAIS ALTO
  const m1ContextComponent: AnalysisComponent = {
    name: 'Contexto M1',
    confidence: 0,
    weight: 0.2, // PESO ALTO - é crítico para M1
    signal: 'neutro',
    data: null,
    isValid: false
  };

  let m1ContextValidation: M1ContextValidation | undefined;

  // Determinar sinal preliminar para validação M1
  let preliminarySignal: 'compra' | 'venda' | 'neutro' = 'neutro';
  if (patternsComponent.isValid && patternsComponent.signal !== 'neutro') {
    preliminarySignal = patternsComponent.signal;
  } else if (priceActionComponent.isValid && priceActionComponent.signal !== 'neutro') {
    preliminarySignal = priceActionComponent.signal;
  }

  // Aplicar validação M1 se há candles suficientes
  if (analysisResults.candles && analysisResults.candles.length >= 20 && preliminarySignal !== 'neutro') {
    m1ContextValidation = validateM1Context(
      analysisResults.candles,
      preliminarySignal,
      analysisResults.priceActionSignals,
      analysisResults.volumeData,
      analysisResults.confluences
    );

    m1ContextComponent.data = m1ContextValidation;
    m1ContextComponent.confidence = m1ContextValidation.contextScore / 100;
    m1ContextComponent.isValid = m1ContextValidation.isValidForEntry;
    m1ContextComponent.signal = m1ContextValidation.isValidForEntry ? preliminarySignal : 'neutro';

    // Log da validação M1
    logM1ContextValidation(m1ContextValidation, preliminarySignal);
  }

  // Criar objeto de componentes rastreados
  const trackedComponents: TrackedAnalysis = {
    patterns: patternsComponent,
    priceAction: priceActionComponent,
    volume: volumeComponent,
    volatility: volatilityComponent,
    marketContext: marketContextComponent,
    confluence: confluenceComponent,
    temporal: temporalComponent,
    technicalIndicators: technicalComponent,
    m1Context: m1ContextComponent // NOVO
  };

  // Tomar decisão final baseada em todos os componentes
  const finalDecision = makeIntelligentDecision(trackedComponents, m1ContextValidation);

  return finalDecision;
};

// Função principal de decisão inteligente - ATUALIZADA para M1
const makeIntelligentDecision = (components: TrackedAnalysis, m1Context?: M1ContextValidation): FinalDecision => {
  const reasoning: string[] = [];
  const rejectionReasons: string[] = [];
  
  // NOVO: Verificação crítica M1 - se M1 rejeitou, não opera
  if (m1Context && !m1Context.isValidForEntry) {
    rejectionReasons.push('Contexto M1 rejeitou entrada');
    rejectionReasons.push(...m1Context.rejectionReasons);
    
    return {
      shouldTrade: false,
      signal: 'neutro',
      confidence: 0,
      reasoning: [],
      rejectionReasons,
      components,
      riskLevel: 'alto',
      qualityScore: m1Context.contextScore,
      m1ContextValidation: m1Context
    };
  }

  // Verificar componentes críticos que podem vetar a operação
  const criticalRejects = checkCriticalRejects(components);
  if (criticalRejects.length > 0) {
    return {
      shouldTrade: false,
      signal: 'neutro',
      confidence: 0,
      reasoning: [],
      rejectionReasons: criticalRejects,
      components,
      riskLevel: 'alto',
      qualityScore: 0,
      m1ContextValidation: m1Context
    };
  }

  // Calcular scores ponderados para cada sinal
  let buyScore = 0;
  let sellScore = 0;
  let validComponentsCount = 0;

  Object.values(components).forEach(component => {
    if (component.isValid && component.confidence > 0) {
      validComponentsCount++;
      const weightedScore = component.confidence * component.weight;
      
      if (component.signal === 'compra') {
        buyScore += weightedScore;
        reasoning.push(`${component.name}: Sinal de COMPRA (${Math.round(component.confidence * 100)}%)`);
      } else if (component.signal === 'venda') {
        sellScore += weightedScore;
        reasoning.push(`${component.name}: Sinal de VENDA (${Math.round(component.confidence * 100)}%)`);
      }
    }
  });

  // Determinar sinal final e confiança
  let finalSignal: 'compra' | 'venda' | 'neutro' = 'neutro';
  let finalConfidence = 0;

  if (buyScore > sellScore && buyScore > 0.35) { // Threshold um pouco menor devido ao M1
    finalSignal = 'compra';
    finalConfidence = Math.min(buyScore * 2.2, 1); // Ajuste na amplificação
  } else if (sellScore > buyScore && sellScore > 0.35) {
    finalSignal = 'venda';
    finalConfidence = Math.min(sellScore * 2.2, 1);
  }

  // Verificar se há componentes suficientes válidos (inclui M1)
  if (validComponentsCount < 3) {
    rejectionReasons.push(`Poucos componentes válidos (${validComponentsCount}/9)`);
    return {
      shouldTrade: false,
      signal: 'neutro',
      confidence: 0,
      reasoning: [],
      rejectionReasons,
      components,
      riskLevel: 'alto',
      qualityScore: (validComponentsCount / 9) * 100,
      m1ContextValidation: m1Context
    };
  }

  // Verificar confiança mínima (ajustada para M1)
  if (finalConfidence < 0.55) {
    rejectionReasons.push(`Confiança insuficiente (${Math.round(finalConfidence * 100)}%)`);
    return {
      shouldTrade: false,
      signal: 'neutro',
      confidence: 0,
      reasoning: [],
      rejectionReasons,
      components,
      riskLevel: 'medio',
      qualityScore: finalConfidence * 100,
      m1ContextValidation: m1Context
    };
  }

  // Calcular nível de risco
  const riskLevel = calculateRiskLevel(components, finalConfidence);
  
  // Calcular score de qualidade geral (inclui M1)
  const qualityScore = (validComponentsCount / 9) * 40 + finalConfidence * 40 + (m1Context?.contextScore || 0) * 0.2;

  return {
    shouldTrade: true,
    signal: finalSignal,
    confidence: finalConfidence,
    reasoning,
    rejectionReasons: [],
    components,
    riskLevel,
    qualityScore,
    m1ContextValidation: m1Context
  };
};

// Verificar rejeições críticas
const checkCriticalRejects = (components: TrackedAnalysis): string[] => {
  const rejects: string[] = [];

  // Validação temporal vetou
  if (components.temporal.data?.recommendation === 'skip') {
    rejects.push('Validação temporal rejeitou a entrada');
  }

  // Contexto de mercado muito ruim
  if (components.marketContext.data?.operatingScore < 30) {
    rejects.push('Condições de mercado adversas');
  }

  // Volatilidade extremamente alta
  if (components.volatility.data?.isHigh && components.volatility.confidence < 0.3) {
    rejects.push('Volatilidade extremamente alta');
  }

  // Sinais conflitantes
  const validSignals = Object.values(components)
    .filter(c => c.isValid && c.signal !== 'neutro')
    .map(c => c.signal);
  
  const uniqueSignals = [...new Set(validSignals)];
  if (uniqueSignals.length > 1 && validSignals.length >= 4) {
    rejects.push('Sinais conflitantes detectados');
  }

  return rejects;
};

// Calcular nível de risco
const calculateRiskLevel = (
  components: TrackedAnalysis, 
  confidence: number
): 'baixo' | 'medio' | 'alto' => {
  let riskFactors = 0;

  if (components.volatility.data?.isHigh) riskFactors++;
  if (components.marketContext.data?.operatingScore < 50) riskFactors++;
  if (components.temporal.data?.riskFactors?.length > 2) riskFactors++;
  if (components.m1Context.data && !components.m1Context.data.isValidForEntry) riskFactors++; // NOVO
  if (confidence < 0.65) riskFactors++;

  if (riskFactors >= 3) return 'alto';
  if (riskFactors >= 1) return 'medio';
  return 'baixo';
};

// Log detalhado para debugging - ATUALIZADO
export const logAnalysisDecision = (decision: FinalDecision) => {
  console.log('🎯 DECISÃO FINAL DA IA (com M1 Context):');
  console.log(`   Deve Operar: ${decision.shouldTrade ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Sinal: ${decision.signal.toUpperCase()}`);
  console.log(`   Confiança: ${Math.round(decision.confidence * 100)}%`);
  console.log(`   Qualidade: ${Math.round(decision.qualityScore)}%`);
  console.log(`   Risco: ${decision.riskLevel.toUpperCase()}`);
  
  if (decision.m1ContextValidation) {
    console.log(`   M1 Context: ${decision.m1ContextValidation.recommendation.toUpperCase()} (${decision.m1ContextValidation.contextScore}%)`);
  }
  
  if (decision.reasoning.length > 0) {
    console.log('📋 Raciocínio:');
    decision.reasoning.forEach(reason => console.log(`   • ${reason}`));
  }
  
  if (decision.rejectionReasons.length > 0) {
    console.log('🚫 Motivos de Rejeição:');
    decision.rejectionReasons.forEach(reason => console.log(`   • ${reason}`));
  }
  
  console.log('📊 Componentes Analisados:');
  Object.entries(decision.components).forEach(([name, component]) => {
    const status = component.isValid ? '✅' : '❌';
    const conf = Math.round(component.confidence * 100);
    console.log(`   ${status} ${component.name}: ${conf}% (${component.signal})`);
  });
};
