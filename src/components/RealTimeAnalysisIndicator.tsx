
import React from 'react';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { useRealTimeAnalysis } from '@/hooks/useRealTimeAnalysis';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

const RealTimeAnalysisIndicator = () => {
  const { capturedImage, liveAnalysis, timeframe } = useAnalyzer();
  const { isActive } = useRealTimeAnalysis();

  if (!capturedImage) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm ${
          isActive 
            ? 'bg-green-500/10 border-green-500/30 text-green-700' 
            : 'bg-red-500/10 border-red-500/30 text-red-700'
        }`}
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 2, repeat: Infinity },
          opacity: { duration: 3, repeat: Infinity }
        }}
      >
        {isActive ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        
        <div className="text-sm">
          <div className="font-semibold">
            {isActive ? 'Análise REAL Ativa' : 'Análise Inativa'}
          </div>
          <div className="text-xs opacity-75">
            {timeframe.toUpperCase()} • {isActive ? 'Monitorando' : 'Aguardando dados'}
          </div>
        </div>

        {isActive && liveAnalysis && (
          <div className="flex items-center gap-1 ml-2">
            <Activity className="h-3 w-3 animate-pulse" />
            <span className="text-xs font-mono">
              {liveAnalysis.confidence.toFixed(2)}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RealTimeAnalysisIndicator;
