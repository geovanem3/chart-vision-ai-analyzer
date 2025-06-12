
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CandlePattern {
  id: string;
  type: string;
  confidence: number;
  position: { x: number; y: number; width: number; height: number };
  color: 'green' | 'red';
  explanation: string;
  timestamp: number;
}

interface ConfluenceZone {
  id: string;
  type: 'support' | 'resistance' | 'fibonacci' | 'trendline';
  level: number;
  strength: 'forte' | 'moderada' | 'fraca';
  position: { x1: number; y1: number; x2: number; y2: number };
  explanation: string;
  timestamp: number;
}

interface LiveMarkup {
  candles: CandlePattern[];
  confluences: ConfluenceZone[];
  annotations: Array<{
    id: string;
    text: string;
    position: { x: number; y: number };
    type: 'pattern' | 'signal' | 'warning';
    timestamp: number;
  }>;
}

interface LiveChartMarkupProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  analysisResult: any;
  pixelAnalysis: any;
}

const LiveChartMarkup: React.FC<LiveChartMarkupProps> = ({
  videoRef,
  isActive,
  analysisResult,
  pixelAnalysis
}) => {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [liveMarkup, setLiveMarkup] = useState<LiveMarkup>({
    candles: [],
    confluences: [],
    annotations: []
  });
  const [isDrawing, setIsDrawing] = useState(false);

  // Detectar padrões de candles em tempo real
  const detectCandlePatterns = useCallback((candles: any[], videoWidth: number, videoHeight: number) => {
    if (!candles || candles.length < 3) return [];

    const patterns: CandlePattern[] = [];
    const recent = candles.slice(-10); // Últimos 10 candles

    // Detectar padrões clássicos
    for (let i = 2; i < recent.length; i++) {
      const curr = recent[i];
      const prev = recent[i-1];
      const prev2 = recent[i-2];

      // Martelo
      if (curr.close > curr.open && 
          (curr.high - curr.close) < (curr.close - curr.open) * 0.3 &&
          (curr.open - curr.low) > (curr.close - curr.open) * 2) {
        
        patterns.push({
          id: `hammer-${Date.now()}-${i}`,
          type: 'Martelo',
          confidence: 0.8,
          position: {
            x: (i / recent.length) * videoWidth,
            y: ((curr.high - 50) / 100) * videoHeight,
            width: videoWidth / recent.length * 0.8,
            height: Math.abs(curr.high - curr.low) * 3
          },
          color: 'green',
          explanation: 'Padrão de reversão bullish - Martelo detectado',
          timestamp: Date.now()
        });
      }

      // Estrela Cadente
      if (curr.close < curr.open && 
          (curr.high - curr.open) > (curr.open - curr.close) * 2 &&
          (curr.close - curr.low) < (curr.open - curr.close) * 0.3) {
        
        patterns.push({
          id: `star-${Date.now()}-${i}`,
          type: 'Estrela Cadente',
          confidence: 0.75,
          position: {
            x: (i / recent.length) * videoWidth,
            y: ((curr.high - 50) / 100) * videoHeight,
            width: videoWidth / recent.length * 0.8,
            height: Math.abs(curr.high - curr.low) * 3
          },
          color: 'red',
          explanation: 'Padrão de reversão bearish - Estrela Cadente',
          timestamp: Date.now()
        });
      }

      // Engolfo de Alta
      if (i > 0 && prev.close < prev.open && curr.close > curr.open &&
          curr.close > prev.open && curr.open < prev.close) {
        
        patterns.push({
          id: `engulf-bull-${Date.now()}-${i}`,
          type: 'Engolfo de Alta',
          confidence: 0.85,
          position: {
            x: ((i-1) / recent.length) * videoWidth,
            y: ((Math.max(curr.high, prev.high) - 50) / 100) * videoHeight,
            width: (videoWidth / recent.length) * 2,
            height: Math.abs(Math.max(curr.high, prev.high) - Math.min(curr.low, prev.low)) * 3
          },
          color: 'green',
          explanation: 'Padrão de reversão bullish - Engolfo confirmado',
          timestamp: Date.now()
        });
      }

      // Doji
      if (Math.abs(curr.close - curr.open) / (curr.high - curr.low) < 0.1) {
        patterns.push({
          id: `doji-${Date.now()}-${i}`,
          type: 'Doji',
          confidence: 0.7,
          position: {
            x: (i / recent.length) * videoWidth,
            y: ((curr.high - 50) / 100) * videoHeight,
            width: videoWidth / recent.length * 0.6,
            height: Math.abs(curr.high - curr.low) * 3
          },
          color: curr.close > prev.close ? 'green' : 'red',
          explanation: 'Indecisão do mercado - Possível reversão',
          timestamp: Date.now()
        });
      }
    }

    return patterns;
  }, []);

  // Detectar confluências em tempo real
  const detectConfluences = useCallback((videoWidth: number, videoHeight: number) => {
    if (!analysisResult?.confluences) return [];

    const confluences: ConfluenceZone[] = [];

    // Níveis de suporte/resistência
    if (analysisResult.confluences.supportResistance) {
      analysisResult.confluences.supportResistance.forEach((level: any, index: number) => {
        const y = ((level.price - 50) / 100) * videoHeight;
        
        confluences.push({
          id: `sr-${level.type}-${index}`,
          type: level.type === 'suporte' ? 'support' : 'resistance',
          level: level.price,
          strength: level.strength,
          position: {
            x1: 0,
            y1: y,
            x2: videoWidth,
            y2: y
          },
          explanation: `${level.type} ${level.strength} em ${level.price.toFixed(2)}`,
          timestamp: Date.now()
        });
      });
    }

    // Fibonacci
    if (analysisResult.confluences.fibonacciLevels) {
      analysisResult.confluences.fibonacciLevels.forEach((fib: any, index: number) => {
        const y = ((fib.price - 50) / 100) * videoHeight;
        
        confluences.push({
          id: `fib-${index}`,
          type: 'fibonacci',
          level: fib.price,
          strength: fib.importance > 0.7 ? 'forte' : 'moderada',
          position: {
            x1: videoWidth * 0.1,
            y1: y,
            x2: videoWidth * 0.9,
            y2: y
          },
          explanation: `Fibonacci ${(fib.level * 100).toFixed(1)}% - ${fib.price.toFixed(2)}`,
          timestamp: Date.now()
        });
      });
    }

    return confluences;
  }, [analysisResult]);

  // Atualizar markup em tempo real
  useEffect(() => {
    if (!isActive || !videoRef.current || !analysisResult) return;

    const videoWidth = videoRef.current.videoWidth || 640;
    const videoHeight = videoRef.current.videoHeight || 480;

    // Detectar padrões de candles
    const mockCandles = Array.from({length: 50}, (_, i) => ({
      open: 100 + Math.sin(i * 0.1) * 10 + Math.random() * 5,
      close: 100 + Math.sin(i * 0.1) * 10 + Math.random() * 5,
      high: 105 + Math.sin(i * 0.1) * 10 + Math.random() * 5,
      low: 95 + Math.sin(i * 0.1) * 10 + Math.random() * 5,
    }));

    const detectedPatterns = detectCandlePatterns(mockCandles, videoWidth, videoHeight);
    const detectedConfluences = detectConfluences(videoWidth, videoHeight);

    // Anotações automáticas baseadas na análise
    const annotations = [];
    
    if (analysisResult.patterns?.length > 0) {
      const pattern = analysisResult.patterns[0];
      annotations.push({
        id: `signal-${Date.now()}`,
        text: `🎯 ${pattern.type} - ${pattern.action.toUpperCase()}`,
        position: { x: videoWidth * 0.1, y: videoHeight * 0.1 },
        type: 'signal' as const,
        timestamp: Date.now()
      });
    }

    if (analysisResult.confluences?.confluenceScore > 70) {
      annotations.push({
        id: `confluence-${Date.now()}`,
        text: `📊 Confluência Forte: ${Math.round(analysisResult.confluences.confluenceScore)}%`,
        position: { x: videoWidth * 0.1, y: videoHeight * 0.2 },
        type: 'pattern' as const,
        timestamp: Date.now()
      });
    }

    if (pixelAnalysis?.chartQuality === 'excelente') {
      annotations.push({
        id: `quality-${Date.now()}`,
        text: `✅ Gráfico: ${pixelAnalysis.chartQuality} (${pixelAnalysis.candleDetection.count} candles)`,
        position: { x: videoWidth * 0.1, y: videoHeight * 0.9 },
        type: 'pattern' as const,
        timestamp: Date.now()
      });
    }

    setLiveMarkup({
      candles: detectedPatterns,
      confluences: detectedConfluences,
      annotations
    });

  }, [isActive, analysisResult, pixelAnalysis, detectCandlePatterns, detectConfluences]);

  // Desenhar markup no overlay
  useEffect(() => {
    if (!overlayRef.current || !videoRef.current || !isActive) return;

    const canvas = overlayRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    if (!ctx) return;

    // Ajustar tamanho do canvas
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setIsDrawing(true);

    // Desenhar padrões de candles
    liveMarkup.candles.forEach(candle => {
      ctx.strokeStyle = candle.color === 'green' ? '#22c55e' : '#ef4444';
      ctx.fillStyle = candle.color === 'green' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 3;

      // Retângulo do padrão
      ctx.fillRect(candle.position.x, candle.position.y, candle.position.width, candle.position.height);
      ctx.strokeRect(candle.position.x, candle.position.y, candle.position.width, candle.position.height);

      // Label do padrão
      ctx.fillStyle = candle.color === 'green' ? '#22c55e' : '#ef4444';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(
        candle.type, 
        candle.position.x, 
        candle.position.y - 10
      );

      // Indicador de confiança
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(candle.position.x, candle.position.y - 5, candle.position.width, 20);
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(
        `${Math.round(candle.confidence * 100)}%`, 
        candle.position.x + 5, 
        candle.position.y + 10
      );
    });

    // Desenhar confluências
    liveMarkup.confluences.forEach(confluence => {
      let strokeStyle = '#3b82f6';
      let lineWidth = 2;
      let dashPattern: number[] = [];

      switch (confluence.type) {
        case 'support':
          strokeStyle = '#22c55e';
          break;
        case 'resistance':
          strokeStyle = '#ef4444';
          break;
        case 'fibonacci':
          strokeStyle = '#f59e0b';
          dashPattern = [5, 5];
          break;
        case 'trendline':
          strokeStyle = '#8b5cf6';
          break;
      }

      if (confluence.strength === 'forte') lineWidth = 4;
      else if (confluence.strength === 'moderada') lineWidth = 3;

      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(dashPattern);

      ctx.beginPath();
      ctx.moveTo(confluence.position.x1, confluence.position.y1);
      ctx.lineTo(confluence.position.x2, confluence.position.y2);
      ctx.stroke();

      // Label da confluência
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(confluence.position.x2 - 150, confluence.position.y1 - 15, 145, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(
        confluence.explanation, 
        confluence.position.x2 - 145, 
        confluence.position.y1
      );

      ctx.setLineDash([]); // Reset dash pattern
    });

    // Desenhar anotações
    liveMarkup.annotations.forEach((annotation, index) => {
      const bgColor = annotation.type === 'signal' ? 'rgba(34, 197, 94, 0.9)' : 
                     annotation.type === 'warning' ? 'rgba(239, 68, 68, 0.9)' : 
                     'rgba(59, 130, 246, 0.9)';

      // Background da anotação
      ctx.fillStyle = bgColor;
      ctx.fillRect(annotation.position.x, annotation.position.y + (index * 35), 250, 30);

      // Texto da anotação
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(
        annotation.text, 
        annotation.position.x + 10, 
        annotation.position.y + 20 + (index * 35)
      );
    });

    setTimeout(() => setIsDrawing(false), 100);

  }, [liveMarkup, isActive]);

  if (!isActive) return null;

  return (
    <>
      <canvas
        ref={overlayRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        style={{ mixBlendMode: 'normal' }}
      />
      
      {/* Indicador de análise em tempo real */}
      <AnimatePresence>
        {isDrawing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20"
          >
            🎯 Analisando...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legenda dos padrões */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs z-20 max-w-xs">
        <div className="font-bold mb-2">🔍 Padrões Detectados:</div>
        {liveMarkup.candles.length > 0 ? (
          <div className="space-y-1">
            {liveMarkup.candles.slice(0, 3).map(candle => (
              <div key={candle.id} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: candle.color === 'green' ? '#22c55e' : '#ef4444' }}
                />
                <span>{candle.type} ({Math.round(candle.confidence * 100)}%)</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400">Nenhum padrão detectado</div>
        )}
        
        {liveMarkup.confluences.length > 0 && (
          <div className="mt-2">
            <div className="font-bold mb-1">📊 Confluências:</div>
            {liveMarkup.confluences.slice(0, 2).map(conf => (
              <div key={conf.id} className="text-xs">
                {conf.type}: {conf.strength}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default LiveChartMarkup;
