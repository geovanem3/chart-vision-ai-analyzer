
import React from 'react';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { motion } from 'framer-motion';
import { Home, Camera, BarChart2, Settings, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

const MobileBottomBar = () => {
  const { capturedImage, timeframe, resetAnalysis } = useAnalyzer();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  if (!isMobile) return null;
  
  const handleTap = (action: string) => {
    if (action === 'home') {
      resetAnalysis();
    } else if (action === 'quick') {
      toast({
        title: "Modo Rápido",
        description: "Análise instantânea ativada",
        variant: "success",
      });
    } else if (action === 'settings') {
      toast({
        title: "Configurações",
        description: "Opções de configuração",
      });
    } else if (action === 'analyze') {
      toast({
        title: "Análise",
        description: "Resultados detalhados disponíveis",
      });
    }
  };

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-2 z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-around items-center">
        <NavButton icon={<Home />} label="Início" onClick={() => handleTap('home')} />
        <NavButton 
          icon={<Camera />} 
          label="Capturar" 
          onClick={() => handleTap('capture')}
          active={!capturedImage}
        />
        <NavButton 
          icon={<BarChart2 />} 
          label="Análise" 
          onClick={() => handleTap('analyze')}
          active={!!capturedImage}
          disabled={!capturedImage}
        />
        <NavButton 
          icon={<Zap />} 
          label="Rápido" 
          onClick={() => handleTap('quick')}
          active={timeframe === '1m'}
        />
        <NavButton icon={<Settings />} label="Config" onClick={() => handleTap('settings')} />
      </div>
    </motion.div>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

const NavButton = ({ icon, label, onClick, active = false, disabled = false }: NavButtonProps) => {
  return (
    <button
      className={`flex flex-col items-center justify-center p-1 rounded-lg ${
        active 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:text-foreground'
      } ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="p-1">{icon}</div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};

export default MobileBottomBar;
