
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
  AlertTriangle
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
    analysisResults
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
        <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
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
              Selecione a ferramenta e desenhe diretamente no gráfico para adicionar marcações manuais de alta precisão
            </p>
            <TooltipProvider>
              <ToggleGroup type="single" value={manualMarkupTool} onValueChange={(value) => value && setManualMarkupTool(value as MarkupToolType)}>
                {tools.map((tool) => (
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
            </TooltipProvider>
          </div>

          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={removeLastMarkup}
              >
                <Undo className="h-4 w-4 mr-1" />
                Desfazer
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearManualMarkups}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
            <div className="text-xs text-amber-500 italic">
              <AlertTriangle className="h-3 w-3 inline-block mr-1" />
              Dica: Use marcações precisas para corrigir desalinhamentos e melhorar a análise quando a qualidade da imagem for baixa
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default ManualMarkupToolbar;
