import { supabase } from "@/integrations/supabase/client";

export interface AIAnalysisResult {
  patterns: Array<{
    type: string;
    confidence: number;
    description: string;
    location?: string;
  }>;
  trend: "bullish" | "bearish" | "lateral";
  trendStrength: number;
  supportLevels: string[];
  resistanceLevels: string[];
  recommendation: {
    action: "compra" | "venda" | "neutro";
    confidence: number;
    reasoning: string;
    riskLevel: "baixo" | "médio" | "alto";
  };
  marketContext: {
    phase: string;
    sentiment: "bullish" | "bearish" | "neutro";
    volatility: "baixa" | "normal" | "alta";
  };
  warnings?: string[];
}

export type AnalysisSource = "ai" | "database_fallback" | "pattern_library_fallback" | "default_fallback";

export interface AnalysisResponse {
  analysis: AIAnalysisResult;
  source: AnalysisSource;
  fallbackReason?: string;
  timestamp: string;
}

export const analyzeChartWithAI = async (
  imageData: string,
  timeframe?: string
): Promise<AnalysisResponse> => {
  console.log("🤖 Enviando imagem para análise...");

  try {
    const { data, error } = await supabase.functions.invoke("analyze-chart", {
      body: { imageData, timeframe },
    });

    if (error) {
      console.error("Erro ao chamar função de análise:", error);
      throw new Error(error.message || "Erro ao analisar gráfico");
    }

    // Se retornou erro mas com fallback disponível
    if (data.error && !data.analysis) {
      console.error("Erro retornado pela função:", data.error);
      throw new Error(data.error);
    }

    const source: AnalysisSource = data.source || "ai";
    const analysis = data.analysis;

    if (!analysis) {
      throw new Error("Resposta sem dados de análise");
    }

    if (source !== "ai") {
      console.warn(`⚠️ Análise via fallback: ${source} - Motivo: ${data.fallbackReason || "desconhecido"}`);
    } else {
      console.log("✅ Análise da IA recebida com sucesso");
    }

    return {
      analysis,
      source,
      fallbackReason: data.fallbackReason,
      timestamp: data.timestamp || new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Erro completo na análise:", error);
    throw error;
  }
};

// Manter compatibilidade - retorna só o resultado da análise
export const analyzeChartWithAILegacy = async (
  imageData: string,
  timeframe?: string
): Promise<AIAnalysisResult> => {
  const response = await analyzeChartWithAI(imageData, timeframe);
  return response.analysis;
};

export const convertAIAnalysisToPatterns = (analysis: AIAnalysisResult) => {
  const patterns = analysis.patterns.map((p) => ({
    type: p.type,
    confidence: p.confidence,
    description: p.description + (p.location ? ` (${p.location})` : ""),
    action: analysis.recommendation.action,
    recommendation: analysis.recommendation.reasoning,
  }));

  // Add main recommendation as a pattern if no patterns found
  if (patterns.length === 0) {
    patterns.push({
      type: `Tendência ${analysis.trend}`,
      confidence: analysis.trendStrength,
      description: analysis.recommendation.reasoning,
      action: analysis.recommendation.action,
      recommendation: `Ação: ${analysis.recommendation.action.toUpperCase()} - Risco: ${analysis.recommendation.riskLevel}`,
    });
  }

  return patterns;
};
