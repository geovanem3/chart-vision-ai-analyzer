
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Zap,
  Volume2,
  Activity,
  Eye,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'trend' | 'pattern' | 'volume' | 'volatility' | 'alert';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  autoClose?: boolean;
}

const PremiumNotifications: React.FC = () => {
  const { liveAnalysis, analysisResults } = useAnalyzer();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Processar mudanças detectadas
  useEffect(() => {
    if (!liveAnalysis?.changes) return;

    liveAnalysis.changes.forEach(change => {
      if (change.importance === 'high' || change.importance === 'medium') {
        const notification: Notification = {
          id: `change-${Date.now()}-${Math.random()}`,
          type: change.type as any,
          title: getNotificationTitle(change.type, change.importance),
          message: change.description,
          severity: change.importance as 'medium' | 'high',
          timestamp: Date.now(),
          autoClose: change.importance === 'medium'
        };

        setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Máximo 5 notificações
      }
    });
  }, [liveAnalysis?.changes]);

  // Auto-remover notificações
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => 
        prev.filter(notification => 
          !notification.autoClose || 
          Date.now() - notification.timestamp < 8000
        )
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getNotificationTitle = (type: string, severity: string): string => {
    const titles = {
      breakout: severity === 'high' ? '🚀 BREAKOUT CONFIRMADO!' : '📈 Possível Breakout',
      reversal: severity === 'high' ? '🔄 REVERSÃO DETECTADA!' : '⚠️ Sinais de Reversão',
      momentum: severity === 'high' ? '⚡ MOMENTUM FORTE!' : '📊 Mudança de Momentum',
      volume_spike: severity === 'high' ? '📊 VOLUME EXPLOSIVO!' : '📈 Volume Elevado',
      volatility_spike: severity === 'high' ? '⚡ VOLATILIDADE EXTREMA!' : '📊 Alta Volatilidade',
      pattern: severity === 'high' ? '🎯 PADRÃO CONFIRMADO!' : '👁️ Padrão Detectado'
    };
    
    return titles[type as keyof typeof titles] || '📊 Evento Detectado';
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      trend: TrendingUp,
      breakout: TrendingUp,
      reversal: TrendingDown,
      momentum: Activity,
      volume_spike: Volume2,
      volatility_spike: Zap,
      pattern: Target,
      alert: AlertTriangle
    };
    
    return icons[type as keyof typeof icons] || Eye;
  };

  const getNotificationColors = (severity: string, type: string) => {
    if (severity === 'high') {
      return {
        bg: 'from-red-500/90 to-pink-600/90',
        border: 'border-red-400/50',
        glow: 'shadow-red-500/50',
        text: 'text-white'
      };
    } else if (severity === 'medium') {
      return {
        bg: 'from-amber-500/90 to-orange-600/90',
        border: 'border-amber-400/50',
        glow: 'shadow-amber-500/50',
        text: 'text-white'
      };
    } else {
      return {
        bg: 'from-blue-500/90 to-indigo-600/90',
        border: 'border-blue-400/50',
        glow: 'shadow-blue-500/50',
        text: 'text-white'
      };
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type);
          const colors = getNotificationColors(notification.severity, notification.type);
          
          return (
            <motion.div
              key={notification.id}
              layout
              initial={{ 
                opacity: 0, 
                x: 400, 
                scale: 0.8,
                rotateY: -90
              }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                scale: 1,
                rotateY: 0
              }}
              exit={{ 
                opacity: 0, 
                x: 400, 
                scale: 0.8,
                rotateY: 90
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              className={`relative p-4 rounded-xl bg-gradient-to-r ${colors.bg} ${colors.border} border backdrop-blur-lg shadow-2xl ${colors.glow}`}
            >
              {/* Efeito de brilho animado */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-white/10"
                animate={{ 
                  opacity: [0, 0.3, 0],
                  scale: [1, 1.02, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <div className="relative flex items-start gap-3">
                <motion.div
                  className="flex-shrink-0 p-2 rounded-full bg-white/20"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 0.5,
                    ease: "easeInOut"
                  }}
                >
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <motion.h4 
                    className={`font-bold text-sm ${colors.text} mb-1`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {notification.title}
                  </motion.h4>
                  
                  <motion.p 
                    className={`text-xs ${colors.text} opacity-90 leading-relaxed`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {notification.message}
                  </motion.p>
                  
                  <motion.div 
                    className={`text-xs ${colors.text} opacity-70 mt-2`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {formatTimeAgo(notification.timestamp)} atrás
                  </motion.div>
                </div>
                
                <motion.button
                  onClick={() => removeNotification(notification.id)}
                  className={`flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors ${colors.text}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
              
              {/* Barra de progresso para auto-close */}
              {notification.autoClose && (
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-xl"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ 
                    duration: 8,
                    ease: "linear"
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default PremiumNotifications;
