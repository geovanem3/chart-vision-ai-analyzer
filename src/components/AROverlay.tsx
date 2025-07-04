
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  Zap,
  Eye,
  Layers,
  Sparkles,
  Activity
} from 'lucide-react';

interface AROverlayProps {
  imageWidth: number;
  imageHeight: number;
  isActive: boolean;
}

const AROverlay: React.FC<AROverlayProps> = ({ 
  imageWidth, 
  imageHeight, 
  isActive 
}) => {
  const { analysisResults, liveAnalysis } = useAnalyzer();
  const [glowIntensity, setGlowIntensity] = useState(0.3);
  const [pulseActive, setPulseActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Efeito de pulsação baseado em mudanças importantes
  useEffect(() => {
    if (liveAnalysis?.changes?.some(change => change.importance === 'high')) {
      setPulseActive(true);
      setGlowIntensity(0.8);
      
      const timer = setTimeout(() => {
        setPulseActive(false);
        setGlowIntensity(0.3);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [liveAnalysis?.changes]);

  // Renderizar partículas animadas para alta volatilidade
  const renderVolatilityParticles = () => {
    if (!analysisResults?.volatilityData?.isHigh) return null;

    return Array.from({ length: 12 }, (_, i) => (
      <motion.div
        key={`particle-${i}`}
        className="absolute w-1 h-1 bg-amber-400 rounded-full"
        initial={{ 
          x: Math.random() * imageWidth,
          y: Math.random() * imageHeight,
          opacity: 0,
          scale: 0
        }}
        animate={{ 
          opacity: [0, 1, 0],
          scale: [0, 1.5, 0],
          x: Math.random() * imageWidth,
          y: Math.random() * imageHeight,
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          delay: i * 0.2,
          ease: "easeInOut"
        }}
      />
    ));
  };

  // Overlay de tendência com efeito holográfico
  const renderTrendOverlay = () => {
    if (!analysisResults?.marketContext?.phase) return null;

    const isUptrend = analysisResults.marketContext.phase === 'tendência_alta';
    const color = isUptrend ? 'from-green-400/20 to-emerald-600/40' : 'from-red-400/20 to-red-600/40';

    return (
      <motion.div
        className={`absolute inset-0 bg-gradient-to-tr ${color} pointer-events-none`}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: pulseActive ? [0.2, 0.6, 0.2] : 0.2 
        }}
        transition={{ 
          duration: 2,
          repeat: pulseActive ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
    );
  };

  // Indicadores AR flutuantes
  const renderFloatingIndicators = () => {
    if (!analysisResults) return null;

    const indicators = [];

    // Indicador de volume anormal
    if (analysisResults.volumeData?.abnormal) {
      indicators.push({
        id: 'volume',
        x: imageWidth * 0.85,
        y: imageHeight * 0.15,
        icon: Activity,
        color: 'text-purple-400',
        glow: 'shadow-purple-400/50',
        label: 'Volume Alto'
      });
    }

    // Indicador de padrão detectado
    if (analysisResults.patterns && analysisResults.patterns.length > 0) {
      indicators.push({
        id: 'pattern',
        x: imageWidth * 0.15,
        y: imageHeight * 0.15,
        icon: Target,
        color: 'text-blue-400',
        glow: 'shadow-blue-400/50',
        label: 'Padrão'
      });
    }

    // Indicador de volatilidade alta
    if (analysisResults.volatilityData?.isHigh) {
      indicators.push({
        id: 'volatility',
        x: imageWidth * 0.85,
        y: imageHeight * 0.85,
        icon: Zap,
        color: 'text-yellow-400',
        glow: 'shadow-yellow-400/50',
        label: 'Alta Volatilidade'
      });
    }

    return indicators.map((indicator, index) => (
      <motion.div
        key={indicator.id}
        className="absolute pointer-events-none"
        style={{ 
          left: indicator.x - 24, 
          top: indicator.y - 24 
        }}
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          rotate: 0,
          y: [0, -10, 0]
        }}
        transition={{ 
          duration: 0.8,
          delay: index * 0.2,
          y: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <div className={`relative p-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 shadow-2xl ${indicator.glow}`}>
          <indicator.icon className={`w-6 h-6 ${indicator.color}`} />
          
          {/* Efeito de brilho */}
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${
              indicator.color.includes('purple') ? 'from-purple-400/20 to-purple-600/20' :
              indicator.color.includes('blue') ? 'from-blue-400/20 to-blue-600/20' :
              'from-yellow-400/20 to-yellow-600/20'
            }`}
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Label flutuante */}
          <motion.div
            className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.2 }}
          >
            {indicator.label}
          </motion.div>
        </div>
      </motion.div>
    ));
  };

  // Linhas de conexão animadas entre elementos técnicos
  const renderConnectionLines = () => {
    if (!analysisResults?.technicalElements || analysisResults.technicalElements.length < 2) return null;

    const elements = analysisResults.technicalElements.slice(0, 4); // Limitar a 4 elementos
    const connections = [];

    for (let i = 0; i < elements.length - 1; i++) {
      const start = elements[i];
      const end = elements[i + 1];
      
      if (start.type === 'line' && end.type === 'line' && start.points && end.points) {
        connections.push({
          id: `connection-${i}`,
          x1: start.points[0].x,
          y1: start.points[0].y,
          x2: end.points[0].x,
          y2: end.points[0].y
        });
      }
    }

    return (
      <svg className="absolute inset-0 pointer-events-none" width={imageWidth} height={imageHeight}>
        {connections.map((connection, index) => (
          <motion.line
            key={connection.id}
            x1={connection.x1}
            y1={connection.y1}
            x2={connection.x2}
            y2={connection.y2}
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ 
              duration: 2,
              delay: index * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
        
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // Efeito de scanner holográfico
  const renderHolographicScanner = () => {
    if (!pulseActive) return null;

    return (
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          initial={{ top: 0 }}
          animate={{ top: imageHeight }}
          transition={{ 
            duration: 2,
            repeat: 2,
            ease: "linear"
          }}
        />
        
        <motion.div
          className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
          initial={{ left: 0 }}
          animate={{ left: imageWidth }}
          transition={{ 
            duration: 2,
            repeat: 2,
            ease: "linear",
            delay: 0.5
          }}
        />
      </motion.div>
    );
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Overlay de tendência holográfico */}
        {renderTrendOverlay()}
        
        {/* Partículas de volatilidade */}
        {renderVolatilityParticles()}
        
        {/* Indicadores AR flutuantes */}
        {renderFloatingIndicators()}
        
        {/* Linhas de conexão animadas */}
        {renderConnectionLines()}
        
        {/* Scanner holográfico */}
        <AnimatePresence>
          {renderHolographicScanner()}
        </AnimatePresence>
        
        {/* Efeito de borda brilhante */}
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            boxShadow: `inset 0 0 20px rgba(59, 130, 246, ${glowIntensity})`,
            border: `1px solid rgba(59, 130, 246, ${glowIntensity * 0.5})`
          }}
          animate={{
            boxShadow: [
              `inset 0 0 20px rgba(59, 130, 246, ${glowIntensity})`,
              `inset 0 0 30px rgba(139, 92, 246, ${glowIntensity * 1.2})`,
              `inset 0 0 20px rgba(59, 130, 246, ${glowIntensity})`
            ]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default AROverlay;
