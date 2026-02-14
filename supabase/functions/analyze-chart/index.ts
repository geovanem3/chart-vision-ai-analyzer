import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um analista técnico especializado em trading, análise de gráficos de velas (candlesticks) e leitura de fluxo institucional (Smart Money).
Analise a imagem do gráfico fornecida e identifique:

1. **Padrões de Candlestick**: Identifique padrões como Doji, Martelo (Hammer), Engolfo de Alta/Baixa, Shooting Star, Morning Star, Evening Star, etc. APENAS se realmente existirem na imagem.

2. **Tendência**: Determine se a tendência é de alta (bullish), baixa (bearish) ou lateral.

3. **Suporte e Resistência**: Identifique níveis visíveis de suporte e resistência.

4. **Recomendação**: Com base na análise, sugira uma ação (COMPRA, VENDA ou AGUARDAR).

5. **Detecção de Medo/Ganância no Mercado**: Analise sinais visuais de medo ou ganância:
   - Velas com pavios longos (rejeição = medo)
   - Sequência de velas vermelhas com volume crescente (pânico/sell-off)
   - Gaps de baixa (medo extremo)
   - Velas de corpo pequeno após queda forte (exaustão do medo = possível reversão)
   - Aceleração de alta sem correções (ganância/euforia)
   - Volume decrescente em tendência de alta (ganância sem suporte)

6. **Entrada dos Grandes Players (Smart Money)**: Identifique onde os institucionais provavelmente estão entrando:
   - Absorção de vendas em suporte (volume alto + velas de rejeição)
   - Acumulação: lateralização em fundo com volume crescente
   - Distribuição: lateralização em topo com volume alto
   - Spring/Upthrust (manipulação de liquidez): rompimento falso seguido de reversão
   - Velas institucionais: velas de corpo grande com volume muito acima da média
   - Orderblocks: última vela oposta antes de um movimento forte

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
  "fearGreedAnalysis": {
    "level": "medo_extremo" | "medo" | "neutro" | "ganancia" | "ganancia_extrema",
    "score": 0-100,
    "signals": ["sinais identificados no gráfico"],
    "interpretation": "o que o nível de medo/ganância indica para o trader"
  },
  "smartMoney": {
    "detected": true | false,
    "action": "comprando" | "vendendo" | "neutro",
    "evidence": ["evidências visuais no gráfico"],
    "entryZone": "descrição da zona de entrada dos grandes players",
    "confidence": 0.0-1.0
  },
  "warnings": ["avisos importantes se houver"]
}`;
// Buscar última análise do banco de dados como fallback
async function getLastAnalysisFromDb(userId: string): Promise<any | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("professional_analyses")
      .select("smart_analysis_result, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.smart_analysis_result) {
      console.log("Nenhuma análise anterior encontrada no banco");
      return null;
    }

    console.log("✅ Análise anterior encontrada no banco de:", data.created_at);
    return data.smart_analysis_result;
  } catch (err) {
    console.error("Erro ao buscar fallback do banco:", err);
    return null;
  }
}

// Buscar padrões da pattern_library como fallback genérico
async function getPatternLibraryFallback(): Promise<any | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("pattern_library")
      .select("*")
      .limit(5);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Criar uma análise genérica baseada nos padrões da biblioteca
    return {
      patterns: data.map((p: any) => ({
        type: p.pattern_name,
        confidence: p.reliability_score || 0.5,
        description: p.description || "Padrão da biblioteca de referência",
        location: "Referência de estudo"
      })),
      trend: "lateral",
      trendStrength: 0.5,
      supportLevels: [],
      resistanceLevels: [],
      recommendation: {
        action: "neutro",
        confidence: 0.3,
        reasoning: "Análise baseada na biblioteca de padrões. A IA não está disponível no momento. Consulte os padrões de referência para tomar decisões.",
        riskLevel: "alto"
      },
      marketContext: {
        phase: "indefinida",
        sentiment: "neutro",
        volatility: "normal"
      },
      warnings: [
        "⚠️ IA indisponível - usando dados da biblioteca de padrões como referência",
        "Esta análise NÃO é baseada na imagem enviada",
        "Use apenas como referência de estudo"
      ]
    };
  } catch (err) {
    console.error("Erro ao buscar pattern_library:", err);
    return null;
  }
}

// Extrair userId via getClaims (seguro)
async function extractUserIdFromAuth(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    return data.claims.sub as string;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = await extractUserIdFromAuth(authHeader);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { imageData, timeframe } = body;

    // Validação de input
    if (!imageData || typeof imageData !== "string") {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem fornecida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar formato da imagem (deve ser data URL)
    if (!imageData.startsWith("data:image/")) {
      return new Response(
        JSON.stringify({ error: "Formato de imagem inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limitar tamanho (10MB max)
    if (imageData.length > 10_000_000) {
      return new Response(
        JSON.stringify({ error: "Imagem muito grande (máximo 10MB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar timeframe se fornecido
    const validTimeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];
    const validatedTimeframe = timeframe && typeof timeframe === "string" && validTimeframes.includes(timeframe) ? timeframe : undefined;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY não configurada - tentando fallback do banco");
      // Tentar fallback ao invés de crashar
      return await handleAIFailure(userId, "Chave de API não configurada");
    }

    console.log("Iniciando análise de gráfico com IA...");
    console.log("Timeframe:", validatedTimeframe || "não especificado");

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analise este gráfico de trading${validatedTimeframe ? ` (timeframe: ${validatedTimeframe})` : ''}. Identifique APENAS os padrões que realmente existem na imagem.`
                },
                {
                  type: "image_url",
                  image_url: { url: imageData }
                }
              ]
            }
          ],
          max_tokens: 2000,
        }),
      });

      // Se a IA falhou (tokens, rate limit, etc), usar fallback
      if (!response.ok) {
        const errorStatus = response.status;
        let errorReason = "Erro desconhecido da IA";

        if (errorStatus === 429) {
          errorReason = "Limite de requisições excedido";
        } else if (errorStatus === 402) {
          errorReason = "Créditos da IA esgotados";
        } else if (errorStatus === 503 || errorStatus === 500) {
          errorReason = "Serviço de IA temporariamente indisponível";
        }

        console.warn(`⚠️ IA retornou ${errorStatus}: ${errorReason} - Ativando fallback do banco de dados`);
        return await handleAIFailure(userId, errorReason);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.warn("⚠️ Resposta vazia da IA - Ativando fallback");
        return await handleAIFailure(userId, "Resposta vazia da IA");
      }

      console.log("Resposta da IA recebida, processando...");

      // Extrair JSON da resposta
      let analysisResult;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("JSON não encontrado na resposta");
        }
      } catch (parseError) {
        console.error("Erro ao parsear JSON:", parseError);
        console.log("Conteúdo recebido:", content);
        
        // Se não conseguiu parsear, tenta fallback
        console.warn("⚠️ Falha no parse - Ativando fallback");
        return await handleAIFailure(userId, "Falha ao processar resposta da IA");
      }

      console.log("✅ Análise com IA concluída com sucesso");

      return new Response(
        JSON.stringify({ 
          analysis: analysisResult, 
          source: "ai",
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (fetchError) {
      // Erro de rede ao chamar IA - usar fallback
      console.error("❌ Erro de rede ao chamar IA:", fetchError);
      return await handleAIFailure(userId, "Erro de conexão com a IA");
    }

  } catch (error) {
    console.error("Erro geral na análise:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno",
        fallbackAvailable: true 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Handler centralizado para quando a IA falha
async function handleAIFailure(userId: string | null, reason: string): Promise<Response> {
  console.log(`🔄 Fallback ativado - Motivo: ${reason}`);

  // Primeiro: tentar última análise do usuário no banco
  if (userId) {
    const lastAnalysis = await getLastAnalysisFromDb(userId);
    if (lastAnalysis) {
      console.log("✅ Usando última análise do banco como fallback");
      
      // Adicionar warnings sobre ser fallback
      const fallbackAnalysis = {
        ...lastAnalysis,
        warnings: [
          ...(lastAnalysis.warnings || []),
          `⚠️ IA indisponível: ${reason}`,
          "📊 Exibindo última análise salva no banco de dados",
          "Os dados podem não refletir o gráfico atual"
        ]
      };

      return new Response(
        JSON.stringify({ 
          analysis: fallbackAnalysis, 
          source: "database_fallback",
          fallbackReason: reason,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Segundo: tentar pattern_library como referência genérica
  const patternFallback = await getPatternLibraryFallback();
  if (patternFallback) {
    console.log("✅ Usando pattern_library como fallback genérico");
    return new Response(
      JSON.stringify({ 
        analysis: patternFallback, 
        source: "pattern_library_fallback",
        fallbackReason: reason,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Último recurso: análise neutra padrão (app nunca para)
  console.log("⚠️ Nenhum fallback encontrado - retornando análise neutra padrão");
  const defaultAnalysis = {
    patterns: [],
    trend: "lateral",
    trendStrength: 0.5,
    supportLevels: [],
    resistanceLevels: [],
    recommendation: {
      action: "neutro",
      confidence: 0.1,
      reasoning: `IA temporariamente indisponível (${reason}). Nenhuma análise anterior encontrada no banco de dados. Aguarde e tente novamente.`,
      riskLevel: "alto"
    },
    marketContext: {
      phase: "indefinida",
      sentiment: "neutro",
      volatility: "normal"
    },
    warnings: [
      `⚠️ IA indisponível: ${reason}`,
      "Nenhuma análise anterior encontrada no banco de dados",
      "Recomendação: aguarde a IA voltar ou capture um novo gráfico"
    ]
  };

  return new Response(
    JSON.stringify({ 
      analysis: defaultAnalysis, 
      source: "default_fallback",
      fallbackReason: reason,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}