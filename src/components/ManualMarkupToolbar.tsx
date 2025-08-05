
import React from 'react';
import { useAnalyzer, MarkupToolType } from '@/context/AnalyzerContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  LineChart, 
  ArrowRight, 
  Square, 
  Circle, 
  Type, 
  TrendingUp, 
  Waves, 
  BarChart2, 
  Trash2,
  Undo,
  Info,
  AlertTriangle,
  TrendingDown,
  Minus,
  Plus,
  Triangle,
  Zap,
  Flag,
  Diamond,
  Target,
  Activity,
  Volume2,
  GitBranch,
  Layers,
  SeparatorHorizontal
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ManualMarkupToolbar = () => {
  const { 
    manualMarkupTool, 
    setManualMarkupTool, 
    isMarkupMode, 
    setMarkupMode,
    clearManualMarkups,
    removeLastMarkup,
    analysisResults,
    manualMarkups
  } = useAnalyzer();

  const tools: { value: MarkupToolType; icon: React.ReactNode; label: string; description: string }[] = [
    { 
      value: 'line', 
      icon: <LineChart className="h-4 w-4" />, 
      label: 'Linha', 
      description: 'Desenhe linhas retas para marcar tendências ou conexões entre pontos significativos.'
    },
    { 
      value: 'arrow', 
      icon: <ArrowRight className="h-4 w-4" />, 
      label: 'Seta', 
      description: 'Use setas para indicar direção de movimento ou breakouts importantes.'
    },
    { 
      value: 'rectangle', 
      icon: <Square className="h-4 w-4" />, 
      label: 'Retângulo', 
      description: 'Delimite áreas de consolidação, zonas de suporte/resistência ou padrões retangulares.'
    },
    { 
      value: 'circle', 
      icon: <Circle className="h-4 w-4" />, 
      label: 'Círculo', 
      description: 'Destaque pontos pivô, reversões ou áreas circulares de interesse.'
    },
    { 
      value: 'label', 
      icon: <Type className="h-4 w-4" />, 
      label: 'Texto', 
      description: 'Adicione anotações textuais para explicar seu raciocínio ou destacar características.'
    },
    { 
      value: 'trendline', 
      icon: <TrendingUp className="h-4 w-4" />, 
      label: 'Linha de Tendência', 
      description: 'Trace linhas de tendência precisas para identificar a direção predominante do mercado.'
    },
    { 
      value: 'eliotwave', 
      icon: <Waves className="h-4 w-4" />, 
      label: 'Ondas de Elliott', 
      description: 'Marque as ondas de Elliott para análise detalhada de ciclos de mercado.'
    },
    { 
      value: 'dowtheory', 
      icon: <BarChart2 className="h-4 w-4" />, 
      label: 'Teoria de Dow', 
      description: 'Aplique os princípios da Teoria de Dow para identificar tendências primárias e secundárias.'
    },
    { 
      value: 'fibonacci', 
      icon: <GitBranch className="h-4 w-4" />, 
      label: 'Fibonacci', 
      description: 'Trace retração e extensão de Fibonacci para identificar níveis de suporte/resistência.'
    },
    { 
      value: 'channel', 
      icon: <Layers className="h-4 w-4" />, 
      label: 'Canal', 
      description: 'Desenhe canais de preço para identificar movimentos dentro de faixas estabelecidas.'
    },
    { 
      value: 'support', 
      icon: <Minus className="h-4 w-4" />, 
      label: 'Suporte', 
      description: 'Marque níveis horizontais de suporte onde o preço historicamente encontra demanda.'
    },
    { 
      value: 'resistance', 
      icon: <Plus className="h-4 w-4" />, 
      label: 'Resistência', 
      description: 'Marque níveis horizontais de resistência onde o preço historicamente encontra oferta.'
    },
    { 
      value: 'triangle', 
      icon: <Triangle className="h-4 w-4" />, 
      label: 'Triângulo', 
      description: 'Identifique padrões triangulares (ascendente, descendente, simétrico) de consolidação.'
    },
    { 
      value: 'wedge', 
      icon: <TrendingDown className="h-4 w-4" />, 
      label: 'Cunha', 
      description: 'Marque padrões de cunha (ascendente/descendente) que indicam reversão de tendência.'
    },
    { 
      value: 'flag', 
      icon: <Flag className="h-4 w-4" />, 
      label: 'Bandeira', 
      description: 'Identifique padrões de bandeira que sugerem continuação da tendência após consolidação.'
    },
    { 
      value: 'pennant', 
      icon: <Diamond className="h-4 w-4" />, 
      label: 'Flâmula', 
      description: 'Marque padrões de flâmula (pequenos triângulos) que indicam continuação de tendência.'
    },
    { 
      value: 'headshoulders', 
      icon: <Activity className="h-4 w-4" />, 
      label: 'Ombro-Cabeça-Ombro', 
      description: 'Identifique o padrão clássico de reversão ombro-cabeça-ombro.'
    },
    { 
      value: 'doubletop', 
      icon: <Target className="h-4 w-4" />, 
      label: 'Topo/Fundo Duplo', 
      description: 'Marque padrões de topo duplo ou fundo duplo que indicam reversão.'
    },
    { 
      value: 'cuphandle', 
      icon: <Circle className="h-4 w-4" />, 
      label: 'Xícara e Alça', 
      description: 'Identifique o padrão de xícara e alça que sugere continuação bullish.'
    },
    { 
      value: 'breakout', 
      icon: <Zap className="h-4 w-4" />, 
      label: 'Breakout', 
      description: 'Marque pontos de rompimento de níveis importantes ou padrões.'
    },
    { 
      value: 'volume', 
      icon: <Volume2 className="h-4 w-4" />, 
      label: 'Zona de Volume', 
      description: 'Destaque áreas de alto volume que confirmam movimentos de preço.'
    },
    { 
      value: 'divergence', 
      icon: <GitBranch className="h-4 w-4" />, 
      label: 'Divergência', 
      description: 'Marque divergências entre preço e indicadores técnicos.'
    },
    { 
      value: 'consolidation', 
      icon: <Layers className="h-4 w-4" />, 
      label: 'Consolidação', 
      description: 'Delimite zonas de consolidação onde o preço se move lateralmente.'
    },
    { 
      value: 'gap', 
      icon: <SeparatorHorizontal className="h-4 w-4" />, 
      label: 'Gap', 
      description: 'Marque gaps de preço que podem atuar como suporte ou resistência.'
    },
  ];
  
  // Verificar se a análise automática encontrou poucos padrões
  const hasLimitedAutoAnalysis = analysisResults?.patterns?.length === 0 || 
                               (analysisResults?.patterns?.length === 1 && 
                                analysisResults?.patterns[0].type === 'Erro na Análise');

  return (
    <Card className="p-4 my-4 w-full max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Marcações Manuais</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Use estas ferramentas para ajustar ou complementar a análise da IA. Marcações precisas ajudam a refinar os resultados e corrigir possíveis desalinhamentos.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Modo Edição</span>
          <Switch checked={isMarkupMode} onCheckedChange={setMarkupMode} />
        </div>
      </div>

      {hasLimitedAutoAnalysis && (
        <Alert className="mb-4" variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Análise automática limitada</AlertTitle>
          <AlertDescription>
            A análise automática encontrou dificuldades em identificar padrões nesta imagem. 
            Utilize as ferramentas de marcação manual para adicionar seus próprios insights e melhorar a precisão.
          </AlertDescription>
        </Alert>
      )}

      {isMarkupMode && (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Instruções:</strong> Selecione uma ferramenta abaixo, depois clique e arraste diretamente no gráfico para desenhar.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg mb-3 text-sm">
              <p className="text-blue-800 dark:text-blue-300 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Para usar: 1) Ative o Modo Edição 2) Selecione uma ferramenta 3) Clique e arraste no gráfico
              </p>
            </div>
            <TooltipProvider>
              <div className="space-y-4">
                {/* Ferramentas Básicas */}
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Ferramentas Básicas</h4>
                  <ToggleGroup type="single" value={manualMarkupTool} onValueChange={(value) => value && setManualMarkupTool(value as MarkupToolType)} className="flex-wrap">
                    {tools.slice(0, 5).map((tool) => (
                      <Tooltip key={tool.value}>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem value={tool.value} aria-label={tool.label} title={tool.label}>
                            {tool.icon}
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="font-medium">{tool.label}</p>
                          <p className="text-xs max-w-[200px]">{tool.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Análise Técnica Clássica */}
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Análise Técnica Clássica</h4>
                  <ToggleGroup type="single" value={manualMarkupTool} onValueChange={(value) => value && setManualMarkupTool(value as MarkupToolType)} className="flex-wrap">
                    {tools.slice(5, 11).map((tool) => (
                      <Tooltip key={tool.value}>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem value={tool.value} aria-label={tool.label} title={tool.label}>
                            {tool.icon}
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="font-medium">{tool.label}</p>
                          <p className="text-xs max-w-[200px]">{tool.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Padrões Gráficos */}
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Padrões Gráficos</h4>
                  <ToggleGroup type="single" value={manualMarkupTool} onValueChange={(value) => value && setManualMarkupTool(value as MarkupToolType)} className="flex-wrap">
                    {tools.slice(11, 18).map((tool) => (
                      <Tooltip key={tool.value}>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem value={tool.value} aria-label={tool.label} title={tool.label}>
                            {tool.icon}
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="font-medium">{tool.label}</p>
                          <p className="text-xs max-w-[200px]">{tool.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Análise Avançada */}
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Análise Avançada</h4>
                  <ToggleGroup type="single" value={manualMarkupTool} onValueChange={(value) => value && setManualMarkupTool(value as MarkupToolType)} className="flex-wrap">
                    {tools.slice(18).map((tool) => (
                      <Tooltip key={tool.value}>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem value={tool.value} aria-label={tool.label} title={tool.label}>
                            {tool.icon}
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="font-medium">{tool.label}</p>
                          <p className="text-xs max-w-[200px]">{tool.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            </TooltipProvider>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={removeLastMarkup}
                disabled={manualMarkups.length === 0}
              >
                <Undo className="h-4 w-4 mr-1" />
                Desfazer
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearManualMarkups}
                disabled={manualMarkups.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
            <div className="text-xs text-amber-500 italic flex items-center">
              <AlertTriangle className="h-3 w-3 inline-block mr-1" />
              {manualMarkups.length === 0 ? 
                "Comece desenhando diretamente no gráfico" : 
                `${manualMarkups.length} marcação(ões) adicionada(s)`}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default ManualMarkupToolbar;
