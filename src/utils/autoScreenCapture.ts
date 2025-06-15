/**
 * Sistema de captura automática de tela para análise em tempo real
 */

import { analyzeChart } from './patternDetection';
import { validateTemporalEntry, calculateEntryTiming } from './temporalEntryValidation';
import { trackAllAnalysisComponents, logAnalysisDecision } from './analysisTracker';

export interface AutoCaptureConfig {
  intervalMs: number; // Intervalo em milissegundos
  maxCapturesPerSecond: number; // Limite de capturas por segundo
  analysisTimeout: number; // Timeout para análise
  deleteAfterAnalysis: boolean; // Apagar imagem após análise
  enableAutoEntry: boolean; // Habilitar entradas automáticas
}

export interface CaptureResult {
  timestamp: number;
  signal: 'compra' | 'venda' | 'neutro';
  confidence: number;
  patterns: string[];
  shouldEnter: boolean;
  reasoning: string[];
}

class AutoScreenCaptureSystem {
  private isCapturing = false;
  private captureInterval: NodeJS.Timeout | null = null;
  private lastCaptureTime = 0;
  private config: AutoCaptureConfig;
  private onResultCallback?: (result: CaptureResult) => void;

  constructor(config: AutoCaptureConfig) {
    this.config = config;
  }

  // Iniciar captura automática
  start(onResult?: (result: CaptureResult) => void) {
    if (this.isCapturing) {
      console.warn('Sistema de captura já está ativo');
      return;
    }

    this.onResultCallback = onResult;
    this.isCapturing = true;
    
    console.log(`🤖 Iniciando captura automática - ${this.config.intervalMs}ms`);
    
    this.captureInterval = setInterval(() => {
      this.performCapture();
    }, this.config.intervalMs);

    return true;
  }

  // Parar captura automática
  stop() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    this.isCapturing = false;
    console.log('⏹️ Sistema de captura parado');
  }

  // Realizar captura e análise
  private async performCapture() {
    const now = Date.now();
    
    // Verificar limite de capturas por segundo
    if (now - this.lastCaptureTime < (1000 / this.config.maxCapturesPerSecond)) {
      return;
    }

    this.lastCaptureTime = now;

    try {
      // Capturar tela
      const screenshot = await this.captureScreen();
      if (!screenshot) return;

      console.log(`📸 Screenshot capturado - ${now}`);

      // Analisar imediatamente
      const analysisResult = await this.analyzeScreenshot(screenshot);
      
      // Apagar imagem se configurado
      if (this.config.deleteAfterAnalysis) {
        this.cleanupScreenshot(screenshot);
      }

      // Enviar resultado
      if (this.onResultCallback && analysisResult) {
        this.onResultCallback(analysisResult);
      }

    } catch (error) {
      console.error('❌ Erro na captura automática:', error);
    }
  }

  // Capturar tela usando Screen Capture API
  private async captureScreen(): Promise<string | null> {
    try {
      // Verificar se Screen Capture API está disponível
      if (!navigator.mediaDevices?.getDisplayMedia) {
        console.warn('Screen Capture API não disponível');
        return null;
      }

      // Capturar tela - usando a API correta
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      // Criar vídeo element para capturar frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;

      // Aguardar vídeo carregar
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Capturar frame atual
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Falha ao criar contexto canvas');

      ctx.drawImage(video, 0, 0);

      // Parar stream
      stream.getTracks().forEach(track => track.stop());

      // Converter para base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      return imageData;

    } catch (error) {
      console.error('❌ Erro ao capturar tela:', error);
      return null;
    }
  }

  // Analisar screenshot capturado
  private async analyzeScreenshot(imageData: string): Promise<CaptureResult | null> {
    try {
      const analysisStart = Date.now();
      
      // Analisar com timeout
      const analysisPromise = analyzeChart(imageData, {
        timeframe: '1m',
        optimizeForScalping: true,
        enableCandleDetection: true,
        isLiveAnalysis: true,
        useConfluences: true,
        enableIntelligentAnalysis: true
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Análise timeout')), this.config.analysisTimeout)
      );

      const analysisResult = await Promise.race([analysisPromise, timeoutPromise]) as any;
      
      const analysisTime = Date.now() - analysisStart;
      console.log(`⚡ Análise concluída em ${analysisTime}ms`);

      if (!analysisResult) return null;

      // Extrair sinal principal
      let mainSignal: 'compra' | 'venda' | 'neutro' = 'neutro';
      let confidence = 0;
      let patterns: string[] = [];
      let reasoning: string[] = [];

      // Usar análise inteligente se disponível
      if (analysisResult.intelligentAnalysis) {
        mainSignal = analysisResult.intelligentAnalysis.overallSignal;
        confidence = analysisResult.intelligentAnalysis.confidence / 100;
        patterns = analysisResult.intelligentAnalysis.patterns?.map((p: any) => p.pattern) || [];
        reasoning = analysisResult.intelligentAnalysis.reasoning || [];
      } else {
        // Fallback para padrões tradicionais
        const validPatterns = analysisResult.patterns?.filter((p: any) => p.action !== 'neutro') || [];
        if (validPatterns.length > 0) {
          const strongest = validPatterns.reduce((prev: any, current: any) => 
            current.confidence > prev.confidence ? current : prev
          );
          mainSignal = strongest.action;
          confidence = strongest.confidence;
          patterns = validPatterns.map((p: any) => p.type);
        }
      }

      // Validação temporal
      const shouldEnter = mainSignal !== 'neutro' && confidence > 0.7;

      return {
        timestamp: Date.now(),
        signal: mainSignal,
        confidence,
        patterns,
        shouldEnter: shouldEnter && this.config.enableAutoEntry,
        reasoning
      };

    } catch (error) {
      console.error('❌ Erro na análise do screenshot:', error);
      return null;
    }
  }

  // Limpar screenshot da memória
  private cleanupScreenshot(imageData: string) {
    // Liberar URL object se necessário
    if (imageData.startsWith('blob:')) {
      URL.revokeObjectURL(imageData);
    }
    // Log para confirmar limpeza
    console.log('🗑️ Screenshot removido da memória');
  }

  // Verificar se está capturando
  isActive(): boolean {
    return this.isCapturing;
  }

  // Atualizar configuração
  updateConfig(newConfig: Partial<AutoCaptureConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar se estiver ativo
    if (this.isCapturing) {
      this.stop();
      setTimeout(() => this.start(this.onResultCallback), 100);
    }
  }
}

// Instância global do sistema
export const autoCapture = new AutoScreenCaptureSystem({
  intervalMs: 500, // 500ms = 2 capturas por segundo
  maxCapturesPerSecond: 3,
  analysisTimeout: 2000, // 2 segundos timeout
  deleteAfterAnalysis: true,
  enableAutoEntry: false // Desabilitado por padrão
});

// Funções de conveniência
export const startAutoCapture = (onResult?: (result: CaptureResult) => void) => {
  return autoCapture.start(onResult);
};

export const stopAutoCapture = () => {
  autoCapture.stop();
};

export const configureAutoCapture = (config: Partial<AutoCaptureConfig>) => {
  autoCapture.updateConfig(config);
};

// Sistema de análise de múltiplas capturas para maior precisão
export class MultiCaptureAnalyzer {
  private recentResults: CaptureResult[] = [];
  private maxResults = 5;

  addResult(result: CaptureResult) {
    this.recentResults.unshift(result);
    if (this.recentResults.length > this.maxResults) {
      this.recentResults.pop();
    }
  }

  // Análise de consenso dos últimos resultados
  getConsensusSignal(): {
    signal: 'compra' | 'venda' | 'neutro';
    confidence: number;
    stability: number;
  } {
    if (this.recentResults.length < 3) {
      return { signal: 'neutro', confidence: 0, stability: 0 };
    }

    // Contar sinais
    const signals = this.recentResults.map(r => r.signal);
    const signalCounts = {
      compra: signals.filter(s => s === 'compra').length,
      venda: signals.filter(s => s === 'venda').length,
      neutro: signals.filter(s => s === 'neutro').length
    };

    // Determinar sinal majoritário
    const maxCount = Math.max(...Object.values(signalCounts));
    const dominantSignal = Object.keys(signalCounts).find(
      key => signalCounts[key as keyof typeof signalCounts] === maxCount
    ) as 'compra' | 'venda' | 'neutro';

    // Calcular confiança média dos sinais dominantes
    const dominantResults = this.recentResults.filter(r => r.signal === dominantSignal);
    const avgConfidence = dominantResults.reduce((sum, r) => sum + r.confidence, 0) / dominantResults.length;

    // Calcular estabilidade (consistência dos sinais)
    const stability = maxCount / this.recentResults.length;

    return {
      signal: dominantSignal,
      confidence: avgConfidence,
      stability
    };
  }

  clear() {
    this.recentResults = [];
  }
}

export const multiAnalyzer = new MultiCaptureAnalyzer();
