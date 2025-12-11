import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um analista técnico especializado em trading e análise de gráficos de velas (candlesticks).
Analise a imagem do gráfico fornecida e identifique:

1. **Padrões de Candlestick**: Identifique padrões como Doji, Martelo (Hammer), Engolfo de Alta/Baixa, Shooting Star, Morning Star, Evening Star, etc. APENAS se realmente existirem na imagem.

2. **Tendência**: Determine se a tendência é de alta (bullish), baixa (bearish) ou lateral.

3. **Suporte e Resistência**: Identifique níveis visíveis de suporte e resistência.

4. **Recomendação**: Com base na análise, sugira uma ação (COMPRA, VENDA ou AGUARDAR).

IMPORTANTE:
- NÃO invente padrões que não existem na imagem
- Se não conseguir identificar padrões claros, diga isso honestamente
- Forneça nível de confiança realista (0-100%)
- Seja específico sobre onde os padrões estão localizados

Responda APENAS no formato JSON abaixo:
{
  "patterns": [
    {
      "type": "nome_do_padrao",
      "confidence": 0.0-1.0,
      "description": "descrição detalhada",
      "location": "onde no gráfico"
    }
  ],
  "trend": "bullish" | "bearish" | "lateral",
  "trendStrength": 0.0-1.0,
  "supportLevels": ["descrição dos níveis"],
  "resistanceLevels": ["descrição dos níveis"],
  "recommendation": {
    "action": "compra" | "venda" | "neutro",
    "confidence": 0.0-1.0,
    "reasoning": "explicação detalhada",
    "riskLevel": "baixo" | "médio" | "alto"
  },
  "marketContext": {
    "phase": "acumulação" | "markup" | "distribuição" | "markdown",
    "sentiment": "bullish" | "bearish" | "neutro",
    "volatility": "baixa" | "normal" | "alta"
  },
  "warnings": ["avisos importantes se houver"]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, timeframe } = await req.json();
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem fornecida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    console.log("Iniciando análise de gráfico com IA...");
    console.log("Timeframe:", timeframe || "não especificado");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: SYSTEM_PROMPT 
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analise este gráfico de trading${timeframe ? ` (timeframe: ${timeframe})` : ''}. Identifique APENAS os padrões que realmente existem na imagem.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings -> Workspace -> Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Erro da API:", response.status, errorText);
      throw new Error(`Erro na API de IA: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    console.log("Resposta da IA recebida, processando...");

    // Extrair JSON da resposta
    let analysisResult;
    try {
      // Tenta extrair JSON do conteúdo (pode vir com markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON não encontrado na resposta");
      }
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError);
      console.log("Conteúdo recebido:", content);
      
      // Retorna uma análise padrão se não conseguir parsear
      analysisResult = {
        patterns: [],
        trend: "lateral",
        trendStrength: 0.5,
        supportLevels: [],
        resistanceLevels: [],
        recommendation: {
          action: "neutro",
          confidence: 0.3,
          reasoning: "Não foi possível analisar a imagem corretamente. A imagem pode não ser um gráfico de trading ou estar em formato não suportado.",
          riskLevel: "alto"
        },
        marketContext: {
          phase: "indefinida",
          sentiment: "neutro",
          volatility: "normal"
        },
        warnings: ["Análise inconclusiva - verifique se a imagem é um gráfico de trading válido"]
      };
    }

    console.log("Análise concluída com sucesso");

    return new Response(
      JSON.stringify({ analysis: analysisResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na análise:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno ao analisar gráfico" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
