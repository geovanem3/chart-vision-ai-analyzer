import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  BarChart2, 
  Settings, 
  Zap,
  Menu,
  User,
  TrendingUp
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/UserMenu';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <motion.header 
          className="border-b border-border/60 bg-card shadow-sm"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold tracking-tight">Chart Vision AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground">
                Análise Técnica Precisa
              </div>
              <UserMenu />
            </div>
          </div>
        </motion.header>
        
        <main className="flex-1">
          {children}
        </main>
        
        <footer className="py-3 border-t border-border/60">
          <div className="container text-center text-xs text-muted-foreground">
            <p>Chart Vision AI Analyzer &copy; {new Date().getFullYear()}</p>
            <p className="mt-1">Timing Preciso para Entradas Otimizadas</p>
          </div>
        </footer>
      </div>
    );
  }

  // Mobile App Layout
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <motion.header 
        className="bg-card border-b border-border/60 px-4 py-3 flex items-center justify-between shadow-sm"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 rounded-lg p-2">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Chart Vision</h1>
            <p className="text-xs text-muted-foreground">AI Analyzer</p>
          </div>
        </div>
        <UserMenu />
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <motion.nav 
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-around items-center py-2 px-4">
          <NavButton 
            icon={<Home />} 
            label="Início" 
            active={location.pathname === '/'}
            onClick={() => navigate('/')}
          />
          <NavButton 
            icon={<BarChart2 />} 
            label="Análise" 
            active={location.pathname === '/analysis'}
            onClick={() => navigate('/analysis')}
          />
          <NavButton 
            icon={<Zap />} 
            label="Rápido" 
            active={location.pathname === '/quick'}
            onClick={() => navigate('/quick')}
          />
          <NavButton 
            icon={<Settings />} 
            label="Config" 
            active={location.pathname === '/settings'}
            onClick={() => navigate('/settings')}
          />
        </div>
      </motion.nav>

      {/* Bottom padding for mobile nav */}
      <div className="h-16" />
    </div>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavButton = ({ icon, label, active, onClick }: NavButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`flex flex-col items-center justify-center h-12 w-12 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
      onClick={onClick}
    >
      <div className="text-sm mb-0.5">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
};

export default AppLayout;