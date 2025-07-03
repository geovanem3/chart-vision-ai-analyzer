
import React from 'react';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { motion } from 'framer-motion';
import { 
  Home, 
  Camera, 
  BarChart2, 
  Settings, 
  Zap, 
  Activity,
  Eye,
  Target
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface MobileBottomNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const MobileBottomNavigation = ({ activeTab = 'camera', onTabChange }: MobileBottomNavigationProps) => {
  const { capturedImage, timeframe, resetAnalysis, analysisResults } = useAnalyzer();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  if (!isMobile) return null;

  const hasAnalysis = analysisResults && analysisResults.patterns.length > 0;
  const hasImage = !!capturedImage;
  
  const handleTap = (action: string) => {
    if (onTabChange) {
      onTabChange(action);
    }
    
    if (action === 'home') {
      resetAnalysis();
      toast({
        title: "Reset Completo",
        description: "Sistema reiniciado",
        variant: "default",
      });
    } else if (action === 'quick') {
      toast({
        title: "Modo Rápido",
        description: "Análise instantânea ativada",
        variant: "default",
      });
    } else if (action === 'settings') {
      toast({
        title: "Configurações",
        description: "Opções avançadas",
      });
    } else if (action === 'live') {
      toast({
        title: "Análise Live",
        description: "Monitoramento em tempo real ativo",
      });
    }
  };

  const navItems = [
    {
      id: 'home',
      icon: Home,
      label: 'Início',
      active: activeTab === 'home',
      disabled: false,
      badge: null
    },
    {
      id: 'camera',
      icon: Camera,
      label: 'Capturar',
      active: activeTab === 'camera' || activeTab === 'photo',
      disabled: false,
      badge: null
    },
    {
      id: 'live',
      icon: Activity,
      label: 'Live',
      active: activeTab === 'live',
      disabled: false,
      badge: timeframe === '1m' ? 'M1' : null
    },
    {
      id: 'analysis',
      icon: BarChart2,
      label: 'Análise',
      active: activeTab === 'analysis',
      disabled: !hasImage,
      badge: hasAnalysis ? analysisResults.patterns.length : null
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Config',
      active: activeTab === 'settings',
      disabled: false,
      badge: null
    }
  ];

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 safe-area-pb"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            onClick={() => handleTap(item.id)}
            active={item.active}
            disabled={item.disabled}
            badge={item.badge}
          />
        ))}
      </div>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-background/95" />
    </motion.div>
  );
};

interface NavButtonProps {
  icon: React.ComponentType<any>;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number | null;
}

const NavButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  active = false, 
  disabled = false,
  badge 
}: NavButtonProps) => {
  return (
    <motion.button
      className={`
        flex flex-col items-center justify-center p-3 rounded-xl relative min-w-0 flex-1
        ${active 
          ? 'bg-primary/15 text-primary' 
          : disabled 
            ? 'text-muted-foreground/50' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.95 }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      transition={{ duration: 0.1 }}
    >
      <div className="relative">
        <Icon className={`w-6 h-6 ${active ? 'text-primary' : ''}`} />
        {badge && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
          >
            {badge}
          </Badge>
        )}
      </div>J
      <span className={`text-xs mt-1 font-medium truncate w-full text-center ${active ? 'text-primary' : ''}`}>
        {label}
      </span>
    </motion.button>
  );
};

export default MobileBottomNavigation;
