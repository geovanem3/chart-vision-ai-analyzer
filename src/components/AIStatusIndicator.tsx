import React from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type AIStatus = 'online' | 'offline' | 'fallback';

const AIStatusIndicator = () => {
  const { analysisResults, forceFailure, isAnalyzing } = useAnalyzer();

  const getStatus = (): AIStatus => {
    if (forceFailure) return 'offline';
    if (analysisResults?.source && analysisResults.source !== 'ai') return 'fallback';
    return 'online';
  };

  const status = getStatus();

  const config: Record<AIStatus, { icon: React.ReactNode; label: string; color: string; pulse: string; bg: string }> = {
    online: {
      icon: <Wifi className="h-3 w-3" />,
      label: 'IA Online',
      color: 'text-emerald-400',
      pulse: 'bg-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    offline: {
      icon: <WifiOff className="h-3 w-3" />,
      label: 'IA Offline',
      color: 'text-destructive',
      pulse: 'bg-destructive',
      bg: 'bg-destructive/10',
    },
    fallback: {
      icon: <AlertTriangle className="h-3 w-3" />,
      label: 'Modo Fallback',
      color: 'text-yellow-400',
      pulse: 'bg-yellow-400',
      bg: 'bg-yellow-400/10',
    },
  };

  const { icon, label, color, pulse, bg } = config[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${bg} cursor-default`}>
            <span className="relative flex h-2 w-2">
              {(status === 'online' || isAnalyzing) && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulse} opacity-75`} />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${pulse}`} />
            </span>
            <span className={`text-[10px] font-medium ${color} hidden sm:inline`}>{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {status === 'online' && 'Gemini Vision está ativa e respondendo'}
          {status === 'offline' && 'IA desativada — modo stress test ativo'}
          {status === 'fallback' && 'Usando dados salvos ou biblioteca de padrões'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AIStatusIndicator;
