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

export const analyzeChartWithAI = async (
  imageData: string,
  timeframe?: string
): Promise<AIAnalysisResult> => {
  console.log("🤖 Enviando imagem para análise com IA...");

  const { data, error } = await supabase.functions.invoke("analyze-chart", {
    body: { imageData, timeframe },
  });

  if (error) {
    console.error("Erro ao chamar função de análise:", error);
    throw new Error(error.message || "Erro ao analisar gráfico");
  }

  if (data.error) {
    console.error("Erro retornado pela IA:", data.error);
    throw new Error(data.error);
  }

  console.log("✅ Análise da IA recebida:", data.analysis);
  return data.analysis;
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
