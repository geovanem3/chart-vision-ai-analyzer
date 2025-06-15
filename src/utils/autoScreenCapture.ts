
/**
 * Sistema de captura automática de tela para análise em tempo real
 * Modo completamente automático e independente
 */

import { analyzeChart } from './patternDetection';

export interface AutoCaptureConfig {
  intervalMs: number;
  enableContinuousCapture: boolean;
  enableBackgroundAnalysis: boolean;
  maxCapturesPerMinute: number;
  autoDeleteImages: boolean;
}

export interface CaptureResult {
  timestamp: number;
  signal: 'compra' | 'venda' | 'neutro';
  confidence: number;
  patterns: string[];
  shouldEnter: boolean;
  reasoning: string[];
  priceData?: {
    current: number;
    support: number;
    resistance: number;
  };
}

class AutoScreenCaptureSystem {
  private isRunning = false;
  private captureInterval: NodeJS.Timeout | null = null;
  private backgroundAnalysisInterval: NodeJS.Timeout | null = null;
  private config: AutoCaptureConfig;
  private onResultCallback?: (result: CaptureResult) => void;
  private captureStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private lastCaptureTime = 0;
  private analysisQueue: string[] = [];
  private isAnalyzing = false;

  constructor(config: AutoCaptureConfig) {
    this.config = config;
    this.initializeCapture();
  }

  // Inicializar sistema de captura
  private async initializeCapture() {
    try {
      console.log('🔧 Inicializando sistema de captura...');
      
      // Criar elementos necessários
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      
      console.log('✅ Sistema de captura inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar captura:', error);
    }
  }

  // Iniciar captura contínua
  async startContinuousCapture(onResult?: (result: CaptureResult) => void) {
    if (this.isRunning) {
      console.warn('⚠️ Sistema já está rodando');
      return false;
    }

    try {
      console.log('🚀 Iniciando captura contínua...');
      
      // Solicitar permissão de tela
      await this.requestScreenPermission();
      
      this.onResultCallback = onResult;
      this.isRunning = true;
      
      // Iniciar captura em intervalos
      this.startCaptureLoop();
      
      // Iniciar análise em segundo plano
      if (this.config.enableBackgroundAnalysis) {
        this.startBackgroundAnalysis();
      }
      
      console.log(`✅ Captura contínua ativa - ${this.config.intervalMs}ms`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao iniciar captura contínua:', error);
      return false;
    }
  }

  // Solicitar permissão de tela
  private async requestScreenPermission() {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen Capture API não disponível');
      }

      this.captureStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        },
        audio: false
      });

      if (this.videoElement && this.captureStream) {
        this.videoElement.srcObject = this.captureStream;
        
        // Aguardar vídeo carregar
        await new Promise((resolve) => {
          if (this.videoElement) {
            this.videoElement.onloadedmetadata = resolve;
          }
        });

        // Configurar canvas com dimensões do vídeo
        if (this.canvas && this.videoElement) {
          this.canvas.width = this.videoElement.videoWidth;
          this.canvas.height = this.videoElement.videoHeight;
        }
      }

    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      throw error;
    }
  }

  // Loop de captura
  private startCaptureLoop() {
    this.captureInterval = setInterval(() => {
      this.performQuickCapture();
    }, this.config.intervalMs);
  }

  // Captura rápida
  private performQuickCapture() {
    const now = Date.now();
    
    // Controle de limite
    if (now - this.lastCaptureTime < (60000 / this.config.maxCapturesPerMinute)) {
      return;
    }

    this.lastCaptureTime = now;

    try {
      if (!this.videoElement || !this.canvas || !this.context) {
        console.warn('⚠️ Elementos de captura não inicializados');
        return;
      }

      // Capturar frame atual
      this.context.drawImage(this.videoElement, 0, 0);
      const imageData = this.canvas.toDataURL('image/jpeg', 0.7);
      
      console.log(`📸 Captura rápida realizada - ${new Date(now).toLocaleTimeString()}`);
      
      // Adicionar à fila de análise
      if (this.config.enableBackgroundAnalysis) {
        this.analysisQueue.push(imageData);
        
        // Limitar fila para evitar acúmulo
        if (this.analysisQueue.length > 5) {
          this.analysisQueue.shift();
        }
      } else {
        // Análise imediata
        this.analyzeImageData(imageData);
      }

    } catch (error) {
      console.error('❌ Erro na captura rápida:', error);
    }
  }

  // Análise em segundo plano
  private startBackgroundAnalysis() {
    this.backgroundAnalysisInterval = setInterval(() => {
      if (!this.isAnalyzing && this.analysisQueue.length > 0) {
        const imageData = this.analysisQueue.shift();
        if (imageData) {
          this.analyzeImageData(imageData);
        }
      }
    }, 100); // Verificar fila a cada 100ms
  }

  // Analisar dados da imagem
  private async analyzeImageData(imageData: string) {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    
    try {
      console.log('🔍 Iniciando análise em segundo plano...');
      
      const analysisResult = await analyzeChart(imageData, {
        timeframe: '1m',
        optimizeForScalping: true,
        enableCandleDetection: true,
        isLiveAnalysis: true,
        useConfluences: true,
        enableIntelligentAnalysis: true,
        enableRealCandleExtraction: true
      });

      if (analysisResult) {
        const result = this.processAnalysisResult(analysisResult);
        
        if (this.onResultCallback && result) {
          this.onResultCallback(result);
        }
        
        console.log(`✅ Análise concluída: ${result?.signal || 'neutro'} (${Math.round((result?.confidence || 0) * 100)}%)`);
      }

      // Auto-deletar imagem
      if (this.config.autoDeleteImages) {
        this.cleanupImageData(imageData);
      }

    } catch (error) {
      console.error('❌ Erro na análise:', error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  // Processar resultado da análise
  private processAnalysisResult(analysisResult: any): CaptureResult | null {
    try {
      let signal: 'compra' | 'venda' | 'neutro' = 'neutro';
      let confidence = 0;
      let patterns: string[] = [];
      let reasoning: string[] = [];
      let priceData: any = null;

      // Usar análise inteligente se disponível
      if (analysisResult.intelligentAnalysis) {
        signal = analysisResult.intelligentAnalysis.overallSignal;
        confidence = analysisResult.intelligentAnalysis.confidence / 100;
        patterns = analysisResult.intelligentAnalysis.patterns?.map((p: any) => p.pattern) || [];
        reasoning = analysisResult.intelligentAnalysis.reasoning || [];
      } else if (analysisResult.patterns?.length > 0) {
        // Fallback para padrões tradicionais
        const validPatterns = analysisResult.patterns.filter((p: any) => p.action !== 'neutro');
        if (validPatterns.length > 0) {
          const strongest = validPatterns.reduce((prev: any, current: any) => 
            current.confidence > prev.confidence ? current : prev
          );
          signal = strongest.action;
          confidence = strongest.confidence;
          patterns = validPatterns.map((p: any) => p.type);
        }
      }

      // Extrair dados de preço se disponível
      if (analysisResult.candleData?.length > 0) {
        const lastCandle = analysisResult.candleData[analysisResult.candleData.length - 1];
        priceData = {
          current: lastCandle.close,
          support: Math.min(...analysisResult.candleData.slice(-10).map((c: any) => c.low)),
          resistance: Math.max(...analysisResult.candleData.slice(-10).map((c: any) => c.high))
        };
      }

      return {
        timestamp: Date.now(),
        signal,
        confidence,
        patterns,
        shouldEnter: signal !== 'neutro' && confidence > 0.75,
        reasoning,
        priceData
      };

    } catch (error) {
      console.error('❌ Erro ao processar resultado:', error);
      return null;
    }
  }

  // Limpar dados da imagem
  private cleanupImageData(imageData: string) {
    if (imageData.startsWith('blob:')) {
      URL.revokeObjectURL(imageData);
    }
    // Forçar garbage collection se possível
    if (window.gc) {
      window.gc();
    }
  }

  // Parar captura
  stop() {
    console.log('⏹️ Parando sistema de captura...');
    
    this.isRunning = false;
    
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    if (this.backgroundAnalysisInterval) {
      clearInterval(this.backgroundAnalysisInterval);
      this.backgroundAnalysisInterval = null;
    }
    
    if (this.captureStream) {
      this.captureStream.getTracks().forEach(track => track.stop());
      this.captureStream = null;
    }
    
    // Limpar fila
    this.analysisQueue = [];
    this.isAnalyzing = false;
    
    console.log('✅ Sistema parado');
  }

  // Verificar se está rodando
  isActive(): boolean {
    return this.isRunning;
  }

  // Atualizar configuração
  updateConfig(newConfig: Partial<AutoCaptureConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuração atualizada:', this.config);
  }

  // Obter estatísticas
  getStats() {
    return {
      isRunning: this.isRunning,
      queueSize: this.analysisQueue.length,
      isAnalyzing: this.isAnalyzing,
      lastCapture: this.lastCaptureTime
    };
  }
}

// Instância global otimizada
export const autoCapture = new AutoScreenCaptureSystem({
  intervalMs: 250, // 4 capturas por segundo
  enableContinuousCapture: true,
  enableBackgroundAnalysis: true,
  maxCapturesPerMinute: 240, // 4 por segundo
  autoDeleteImages: true
});

// Funções de conveniência
export const startAutoCapture = (onResult?: (result: CaptureResult) => void) => {
  return autoCapture.startContinuousCapture(onResult);
};

export const stopAutoCapture = () => {
  autoCapture.stop();
};

export const configureAutoCapture = (config: Partial<AutoCaptureConfig>) => {
  autoCapture.updateConfig(config);
};

export const getCaptureStats = () => {
  return autoCapture.getStats();
};

// Sistema de monitoramento em tempo real
export class RealTimeMonitor {
  private results: CaptureResult[] = [];
  private maxResults = 20;
  
  addResult(result: CaptureResult) {
    this.results.unshift(result);
    if (this.results.length > this.maxResults) {
      this.results.pop();
    }
    
    // Log de resultados importantes
    if (result.shouldEnter) {
      console.log(`🚨 SINAL DE ENTRADA: ${result.signal.toUpperCase()} - ${Math.round(result.confidence * 100)}%`);
    }
  }
  
  getRecentSignals(minutes = 5): CaptureResult[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.results.filter(r => r.timestamp > cutoff);
  }
  
  getTrendAnalysis(): {
    dominantSignal: 'compra' | 'venda' | 'neutro';
    consistency: number;
    avgConfidence: number;
  } {
    if (this.results.length === 0) {
      return { dominantSignal: 'neutro', consistency: 0, avgConfidence: 0 };
    }
    
    const signals = this.results.map(r => r.signal);
    const signalCounts = {
      compra: signals.filter(s => s === 'compra').length,
      venda: signals.filter(s => s === 'venda').length,
      neutro: signals.filter(s => s === 'neutro').length
    };
    
    const maxCount = Math.max(...Object.values(signalCounts));
    const dominantSignal = Object.keys(signalCounts).find(
      key => signalCounts[key as keyof typeof signalCounts] === maxCount
    ) as 'compra' | 'venda' | 'neutro';
    
    const consistency = maxCount / this.results.length;
    const avgConfidence = this.results.reduce((sum, r) => sum + r.confidence, 0) / this.results.length;
    
    return { dominantSignal, consistency, avgConfidence };
  }
  
  clear() {
    this.results = [];
  }
}

export const realTimeMonitor = new RealTimeMonitor();

