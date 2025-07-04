
import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAnalyzer } from '@/context/AnalyzerContext';

interface ImmersiveInterfaceProps {
  children: React.ReactNode;
  className?: string;
}

const ImmersiveInterface: React.FC<ImmersiveInterfaceProps> = ({ 
  children, 
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { analysisResults, liveAnalysis } = useAnalyzer();
  
  // Valores de movimento do mouse para efeitos parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Springs suaves para movimento natural
  const springConfig = { stiffness: 150, damping: 15 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);
  
  // Transformações para efeitos 3D
  const rotateX = useTransform(y, [-300, 300], [5, -5]);
  const rotateY = useTransform(x, [-300, 300], [-5, 5]);
  const scale = useTransform(mouseX, [-300, 0, 300], [0.98, 1, 0.98]);
  
  // Estado para efeitos de glow baseados na análise
  const [glowIntensity, setGlowIntensity] = useState(0.2);
  const [glowColor, setGlowColor] = useState('59, 130, 246'); // Blue default

  // Atualizar glow baseado no contexto de mercado
  useEffect(() => {
    if (!analysisResults?.marketContext) return;

    const phase = analysisResults.marketContext.phase;
    
    if (phase === 'tendência_alta') {
      setGlowColor('34, 197, 94'); // Green
      setGlowIntensity(0.4);
    } else if (phase === 'tendência_baixa') {
      setGlowColor('239, 68, 68'); // Red  
      setGlowIntensity(0.4);
    } else {
      setGlowColor('59, 130, 246'); // Blue
      setGlowIntensity(0.2);
    }
  }, [analysisResults?.marketContext]);

  // Intensificar glow durante mudanças importantes
  useEffect(() => {
    const hasHighImportanceChange = liveAnalysis?.changes?.some(
      change => change.importance === 'high'
    );
    
    if (hasHighImportanceChange) {
      setGlowIntensity(0.8);
      
      const timer = setTimeout(() => {
        setGlowIntensity(0.4);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [liveAnalysis?.changes]);

  // Tracking do mouse para efeitos parallax
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      className={`relative perspective-1000 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
      }}
    >
      {/* Container principal com efeitos 3D */}
      <motion.div
        className="relative transform-gpu"
        style={{
          rotateX,
          rotateY,
          scale
        }}
      >
        {/* Camada de background com efeito de profundidade */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(${glowColor}, ${glowIntensity}) 0%, transparent 70%)`,
            filter: 'blur(20px)',
            transform: 'translateZ(-10px)'
          }}
          animate={{
            opacity: [glowIntensity * 0.5, glowIntensity, glowIntensity * 0.5]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Grades de fundo para profundidade */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <motion.div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(${glowColor}, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(${glowColor}, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              transform: 'translateZ(-5px)'
            }}
            animate={{
              x: [0, 20, 0],
              y: [0, 20, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
        
        {/* Borda com efeito holográfico */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            border: `1px solid rgba(${glowColor}, ${glowIntensity * 0.8})`,
            boxShadow: `
              0 0 20px rgba(${glowColor}, ${glowIntensity * 0.3}),
              0 0 40px rgba(${glowColor}, ${glowIntensity * 0.2}),
              inset 0 0 20px rgba(${glowColor}, ${glowIntensity * 0.1})
            `
          }}
          animate={{
            boxShadow: [
              `0 0 20px rgba(${glowColor}, ${glowIntensity * 0.3}), 0 0 40px rgba(${glowColor}, ${glowIntensity * 0.2}), inset 0 0 20px rgba(${glowColor}, ${glowIntensity * 0.1})`,
              `0 0 30px rgba(${glowColor}, ${glowIntensity * 0.5}), 0 0 60px rgba(${glowColor}, ${glowIntensity * 0.3}), inset 0 0 30px rgba(${glowColor}, ${glowIntensity * 0.2})`,
              `0 0 20px rgba(${glowColor}, ${glowIntensity * 0.3}), 0 0 40px rgba(${glowColor}, ${glowIntensity * 0.2}), inset 0 0 20px rgba(${glowColor}, ${glowIntensity * 0.1})`
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Reflexos dinâmicos */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(${glowColor}, 0.1) 100%)`,
            transform: 'translateZ(1px)'
          }}
          animate={{
            background: [
              `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(${glowColor}, 0.1) 100%)`,
              `linear-gradient(225deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(${glowColor}, 0.1) 100%)`,
              `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(${glowColor}, 0.1) 100%)`
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Conteúdo principal */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Partículas flutuantes para alta atividade */}
        {liveAnalysis?.changes?.some(change => change.importance === 'high') && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: `rgba(${glowColor}, 0.8)`,
                  boxShadow: `0 0 6px rgba(${glowColor}, 0.8)`
                }}
                initial={{
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%',
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  y: [Math.random() * 100 + '%', (Math.random() * 100) + '%'],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ImmersiveInterface;
