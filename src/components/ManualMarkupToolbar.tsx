
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
  Undo
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const ManualMarkupToolbar = () => {
  const { 
    manualMarkupTool, 
    setManualMarkupTool, 
    isMarkupMode, 
    setMarkupMode,
    clearManualMarkups,
    removeLastMarkup
  } = useAnalyzer();

  const tools: { value: MarkupToolType; icon: React.ReactNode; label: string }[] = [
    { value: 'line', icon: <LineChart className="h-4 w-4" />, label: 'Linha' },
    { value: 'arrow', icon: <ArrowRight className="h-4 w-4" />, label: 'Seta' },
    { value: 'rectangle', icon: <Square className="h-4 w-4" />, label: 'Retângulo' },
    { value: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Círculo' },
    { value: 'label', icon: <Type className="h-4 w-4" />, label: 'Texto' },
    { value: 'trendline', icon: <TrendingUp className="h-4 w-4" />, label: 'Linha de Tendência' },
    { value: 'eliotwave', icon: <Waves className="h-4 w-4" />, label: 'Ondas de Elliott' },
    { value: 'dowtheory', icon: <BarChart2 className="h-4 w-4" />, label: 'Teoria de Dow' },
  ];

  return (
    <Card className="p-4 my-4 w-full max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Marcações Manuais</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Modo Edição</span>
          <Switch checked={isMarkupMode} onCheckedChange={setMarkupMode} />
        </div>
      </div>

      {isMarkupMode && (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Selecione a ferramenta e desenhe diretamente no gráfico para adicionar marcações manuais
            </p>
            <ToggleGroup type="single" value={manualMarkupTool} onValueChange={(value) => value && setManualMarkupTool(value as MarkupToolType)}>
              {tools.map((tool) => (
                <ToggleGroupItem key={tool.value} value={tool.value} aria-label={tool.label} title={tool.label}>
                  {tool.icon}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

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
        </>
      )}
    </Card>
  );
};

export default ManualMarkupToolbar;
