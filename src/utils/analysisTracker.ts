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

// Tracker principal que analisa todos os componentes - VERSÃO MELHORADA
export const trackAllAnalysisComponents = (
  analysisResults: AnalysisResult,
  temporalValidation?: TemporalValidation
): FinalDecision => {
  
  console.log('🎯 Iniciando tracking COMPLETO com busca extensiva de confluências...');
  
  // 1. Análise de Padrões - MAIS PERMISSIVA
  const patternsComponent: AnalysisComponent = {
    name: 'Padrões',
    confidence: 0,
    weight: 0.18,
    signal: 'neutro',
    data: analysisResults.patterns,
    isValid: false
  };

  if (analysisResults.patterns && analysisResults.patterns.length > 0) {
    // MUDANÇA: Aceitar padrões mesmo com sinais mistos, priorizando os mais fortes
    const strongPatterns = analysisResults.patterns.filter(p => p.confidence > 0.5);
    
    if (strongPatterns.length > 0) {
      // Ordenar por confiança e pegar o mais forte
      const sortedPatterns = strongPatterns.sort((a, b) => b.confidence - a.confidence);
      const strongestPattern = sortedPatterns[0];
      
      patternsComponent.signal = strongestPattern.action as 'compra' | 'venda' | 'neutro';
      patternsComponent.confidence = strongestPattern.confidence;
      patternsComponent.isValid = strongestPattern.confidence > 0.5; // Reduzido de 0.6
      
      console.log(`📊 Padrões: ${strongPatterns.length} detectados, mais forte: ${strongestPattern.type} (${Math.round(strongestPattern.confidence * 100)}%)`);
    }
  }

  // 2. Análise de Price Action - MELHORADA
  const priceActionComponent: AnalysisComponent = {
    name: 'Price Action',
    confidence: 0,
    weight: 0.15,
    signal: 'neutro',
    data: analysisResults.priceActionSignals || [],
    isValid: false
  };

  if (analysisResults.priceActionSignals && analysisResults.priceActionSignals.length > 0) {
    // MUDANÇA: Aceitar sinais moderados também
    const validPASignals = analysisResults.priceActionSignals.filter((pa: any) => 
      pa.confidence > 0.5 // Reduzido de 0.65
    );
    
    if (validPASignals.length > 0) {
      const strongestPA = validPASignals.reduce((prev: any, current: any) => 
        current.confidence > prev.confidence ? current : prev
      );
      
      priceActionComponent.signal = strongestPA.direction === 'alta' ? 'compra' : 'venda';
      priceActionComponent.confidence = strongestPA.confidence;
      priceActionComponent.isValid = true;
      
      console.log(`⚡️ Price Action: ${validPASignals.length} sinais válidos, mais forte: ${strongestPA.type} (${Math.round(strongestPA.confidence * 100)}%)`);
    }
  }

  // 3. Análise de Volume - MAIS FLEXÍVEL
  const volumeComponent: AnalysisComponent = {
    name: 'Volume',
    confidence: 0,
    weight: 0.08,
    signal: 'neutro',
    data: analysisResults.volumeData,
    isValid: false
  };

  if (analysisResults.volumeData) {
    const vol = analysisResults.volumeData;
    
    // MUDANÇA: Aceitar volume médio também
    if (vol.significance === 'high' || vol.significance === 'medium') {
      volumeComponent.confidence = vol.significance === 'high' ? 0.8 : 0.6;
      volumeComponent.signal = vol.trend === 'increasing' ? 'compra' : 'venda';
      volumeComponent.isValid = true;
      
      console.log(`📊 Volume: ${vol.significance} significance, trend: ${vol.trend}`);
    }
  }

  // 4. Análise de Volatilidade - REAJUSTADA
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
    
    // MUDANÇA: Não penalizar tanto volatilidade alta
    if (vol.isHigh) {
      volatilityComponent.confidence = 0.4; // Menos penalty
      volatilityComponent.isValid = true; // Aceitar mesmo assim
    } else {
      volatilityComponent.confidence = 0.8;
      volatilityComponent.isValid = true;
    }
    
    console.log(`📈 Volatilidade: ${vol.isHigh ? 'Alta' : 'Normal'} (${vol.value.toFixed(2)}%)`);
  }

  // 5. Contexto de Mercado - MAIS PERMISSIVO
  const marketContextComponent: AnalysisComponent = {
    name: 'Contexto de Mercado',
    confidence: 0,
    weight: 0.08,
    signal: 'neutro',
    data: analysisResults.marketContext,
    isValid: false
  };

  if (analysisResults.marketContext) {
    const context = analysisResults.marketContext as any;
    
    if (context.operatingScore) {
      marketContextComponent.confidence = context.operatingScore / 100;
      // MUDANÇA: Aceitar scores mais baixos
      marketContextComponent.isValid = context.operatingScore >= 30; // Reduzido de 50
      
      // Ainda verificar se não deve operar
      if (context.advancedConditions?.recommendation === 'nao_operar') {
        marketContextComponent.isValid = false;
        marketContextComponent.confidence = 0;
      }
      
      console.log(`🌍 Market Context: Score ${context.operatingScore}/100, recomendação: ${context.advancedConditions?.recommendation}`);
    }
  }

  // 6. Análise de Confluência - PESO AUMENTADO
  const confluenceComponent: AnalysisComponent = {
    name: 'Confluência',
    confidence: 0,
    weight: 0.15, // Aumentado
    signal: 'neutro',
    data: analysisResults.confluences,
    isValid: false
  };

  if (analysisResults.confluences) {
    confluenceComponent.confidence = analysisResults.confluences.confluenceScore / 100;
    // MUDANÇA: Aceitar confluências mais baixas
    confluenceComponent.isValid = analysisResults.confluences.confluenceScore > 40; // Reduzido de 60
    
    console.log(`🤝 Confluência: ${analysisResults.confluences.confluenceScore}% (${confluenceComponent.isValid ? 'Válida' : 'Baixa'})`);
  }

  // 7. Validação Temporal - MANTIDA
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
    temporalComponent.isValid = temporalValidation.recommendation !== 'skip'; // Mais permissivo
    
    console.log(`⏰ Temporal: ${temporalValidation.recommendation} (${Math.round(temporalValidation.winProbability * 100)}%)`);
  }

  // 8. Indicadores Técnicos - MAIS PERMISSIVO
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
      ind.signal !== 'neutro' && ind.confidence > 0.5 // Reduzido de 0.6
    );
    
    if (validIndicators.length > 0) {
      technicalComponent.confidence = validIndicators.reduce((sum: number, ind: any) => 
        sum + ind.confidence, 0) / validIndicators.length;
      technicalComponent.isValid = technicalComponent.confidence > 0.5; // Reduzido
      
      console.log(`⚙️ Indicadores: ${validIndicators.length} válidos (avg: ${Math.round(technicalComponent.confidence * 100)}%)`);
    }
  }

  // 9. Validação M1 Context - PESO ALTO MANTIDO
  const m1ContextComponent: AnalysisComponent = {
    name: 'Contexto M1',
    confidence: 0,
    weight: 0.2,
    signal: 'neutro',
    data: null,
    isValid: false
  };

  let m1ContextValidation: M1ContextValidation | undefined;

  // Determinar sinal preliminar MELHORADO
  let preliminarySignal: 'compra' | 'venda' | 'neutro' = 'neutro';
  
  // NOVA LÓGICA: Usar confluência de sinais, não apenas padrões
  const allValidComponents = [patternsComponent, priceActionComponent, volumeComponent, confluenceComponent]
    .filter(comp => comp.isValid && comp.signal !== 'neutro');
  
  if (allValidComponents.length > 0) {
    // Contar votos ponderados
    let buyScore = 0;
    let sellScore = 0;
    
    allValidComponents.forEach(comp => {
      const weightedVote = comp.confidence * comp.weight;
      if (comp.signal === 'compra') {
        buyScore += weightedVote;
      } else if (comp.signal === 'venda') {
        sellScore += weightedVote;
      }
    });
    
    if (buyScore > sellScore && buyScore > 0.1) {
      preliminarySignal = 'compra';
    } else if (sellScore > buyScore && sellScore > 0.1) {
      preliminarySignal = 'venda';
    }
    
    console.log(`🎯 Sinal preliminar: ${preliminarySignal} (buy: ${buyScore.toFixed(2)}, sell: ${sellScore.toFixed(2)})`);
  }

  // Aplicar validação M1 se há sinal
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
    m1Context: m1ContextComponent
  };

  // Tomar decisão final com lógica MELHORADA
  const finalDecision = makeIntelligentDecisionImproved(trackedComponents, m1ContextValidation);

  return finalDecision;
};

// Função de decisão MELHORADA - menos restritiva
const makeIntelligentDecisionImproved = (components: TrackedAnalysis, m1Context?: M1ContextValidation): FinalDecision => {
  const reasoning: string[] = [];
  const rejectionReasons: string[] = [];
  
  console.log('🤖 Tomando decisão com lógica MELHORADA (menos restritiva)...');
  
  // NOVA VERIFICAÇÃO: M1 ainda veta, mas com mais detalhes
  if (m1Context && !m1Context.isValidForEntry) {
    console.log(`❌ M1 Context vetou entrada: ${m1Context.rejectionReasons.join(', ')}`);
    
    // MUDANÇA: Se a rejeição for apenas lateralização, mas outros sinais estão muito fortes, considerar
    const isOnlyLateralization = m1Context.rejectionReasons.every(reason => 
      reason.includes('lateral') || reason.includes('indecisão')
    );
    
    if (isOnlyLateralization) {
      // Verificar se há confluência muito forte que pode superar a lateralização
      const confluenceScore = components.confluence.confidence * 100;
      const patternConfidence = components.patterns.confidence * 100;
      
      if (confluenceScore > 70 && patternConfidence > 75) {
        console.log('🎯 OVERRIDE: Sinais muito fortes superam lateralização M1');
        reasoning.push('Override M1: Confluência excepcional');
      } else {
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
    } else {
      // Rejeições sérias (não apenas lateralização)
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
  }

  // NOVA LÓGICA: Verificações críticas mais flexíveis
  const criticalRejects = checkCriticalRejectsImproved(components);
  if (criticalRejects.length > 0) {
    console.log(`❌ Rejeições críticas: ${criticalRejects.join(', ')}`);
    
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

  // NOVA LÓGICA: Cálculo de scores mais permissivo
  let buyScore = 0;
  let sellScore = 0;
  let validComponentsCount = 0;
  let totalPossibleWeight = 0;

  Object.values(components).forEach(component => {
    totalPossibleWeight += component.weight;
    
    if (component.confidence > 0) { // MUDANÇA: Aceitar qualquer confiança > 0
      validComponentsCount++;
      const weightedScore = component.confidence * component.weight;
      
      if (component.signal === 'compra') {
        buyScore += weightedScore;
        reasoning.push(`${component.name}: COMPRA (${Math.round(component.confidence * 100)}%, peso ${component.weight})`);
      } else if (component.signal === 'venda') {
        sellScore += weightedScore;
        reasoning.push(`${component.name}: VENDA (${Math.round(component.confidence * 100)}%, peso ${component.weight})`);
      } else if (component.isValid) {
        reasoning.push(`${component.name}: Neutro mas válido (${Math.round(component.confidence * 100)}%)`);
      }
    }
  });

  console.log(`📊 Scores: BUY=${buyScore.toFixed(3)}, SELL=${sellScore.toFixed(3)}, Componentes válidos: ${validComponentsCount}/9`);

  // NOVA LÓGICA: Determinar sinal final com thresholds mais baixos
  let finalSignal: 'compra' | 'venda' | 'neutro' = 'neutro';
  let finalConfidence = 0;

  const minThreshold = 0.25; // REDUZIDO de 0.35

  if (buyScore > sellScore && buyScore > minThreshold) {
    finalSignal = 'compra';
    finalConfidence = Math.min(buyScore * 2.5, 1); // Amplificação ajustada
  } else if (sellScore > buyScore && sellScore > minThreshold) {
    finalSignal = 'venda';
    finalConfidence = Math.min(sellScore * 2.5, 1);
  }

  console.log(`🎯 Sinal final: ${finalSignal} (${Math.round(finalConfidence * 100)}%)`);

  // NOVA LÓGICA: Verificações mais permissivas
  
  // Verificar componentes mínimos (REDUZIDO)
  if (validComponentsCount < 2) { // REDUZIDO de 3
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

  // Verificar confiança mínima (REDUZIDO)
  if (finalConfidence < 0.45) { // REDUZIDO de 0.55
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

  // APROVAÇÃO: Calcular métricas finais
  const riskLevel = calculateRiskLevel(components, finalConfidence);
  const qualityScore = (validComponentsCount / 9) * 30 + finalConfidence * 50 + (m1Context?.contextScore || 0) * 0.2;

  console.log(`✅ OPERAÇÃO APROVADA: ${finalSignal.toUpperCase()} | Confiança: ${Math.round(finalConfidence * 100)}% | Qualidade: ${Math.round(qualityScore)}%`);

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

// Verificações críticas MELHORADAS
const checkCriticalRejectsImproved = (components: TrackedAnalysis): string[] => {
  const rejects: string[] = [];

  // MUDANÇA: Menos restritivo na validação temporal
  if (components.temporal.data?.recommendation === 'skip' && components.temporal.confidence < 0.3) {
    rejects.push('Validação temporal fortemente negativa');
  }

  // MUDANÇA: Só rejeitar contexto muito ruim
  if (components.marketContext.data?.operatingScore < 20) { // REDUZIDO de 30
    rejects.push('Condições de mercado extremamente adversas');
  }

  // MUDANÇA: Volatilidade só veta se extrema E outros fatores negativos
  if (components.volatility.data?.isHigh && components.volatility.confidence < 0.2 && 
      components.confluence.confidence < 0.4) {
    rejects.push('Volatilidade extrema sem confluência');
  }

  // NOVA VERIFICAÇÃO: Só rejeitar se TODOS os sinais são fracos
  const validComponents = Object.values(components).filter(c => c.isValid);
  const avgConfidence = validComponents.length > 0 ? 
    validComponents.reduce((sum, c) => sum + c.confidence, 0) / validComponents.length : 0;
  
  if (validComponents.length > 0 && avgConfidence < 0.3) {
    rejects.push('Todos os sinais são muito fracos');
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
