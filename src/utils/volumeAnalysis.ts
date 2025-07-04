
import { CandleData, VolumeData } from "../context/AnalyzerContext";

export const analyzeVolume = (candles: CandleData[]): VolumeData => {
  if (candles.length === 0) {
    return {
      value: 0,
      trend: 'neutral',
      abnormal: false,
      significance: 'low',
      relativeToAverage: 1.0,
      distribution: 'neutral',
      divergence: false
    };
  }

  console.log('📊 ANÁLISE AVANÇADA DE VOLUME DETECTADO');
  
  // Calcular volume REAL baseado na altura e largura dos candles detectados
  let totalVolume = 0;
  let volumeTrend: 'neutral' | 'increasing' | 'decreasing' = 'neutral';
  let previousVolumes: number[] = [];
  
  candles.forEach((candle, index) => {
    // Volume REAL estimado pela área do candle (altura * largura) + densidade
    const baseVolume = candle.height * candle.width;
    
    // Ajustar volume baseado na posição do candle (mais recentes = mais peso)
    const timeWeight = 1 + (index / candles.length) * 0.2;
    
    // Considerar a densidade visual (candles mais "cheios" = mais volume)
    const densityFactor = candle.height > candle.width * 3 ? 1.3 : 1.0;
    
    const adjustedVolume = baseVolume * timeWeight * densityFactor;
    totalVolume += adjustedVolume;
    previousVolumes.push(adjustedVolume);
  });
  
  console.log(`💾 Volume total detectado: ${totalVolume}, Candles: ${candles.length}`);
  
  // Calcular tendência do volume baseada nos dados REAIS
  if (previousVolumes.length >= 4) {
    const recentVolumes = previousVolumes.slice(-3);
    const olderVolumes = previousVolumes.slice(0, -3);
    
    if (olderVolumes.length > 0) {
      const recentAvg = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
      const oldAvg = olderVolumes.reduce((a, b) => a + b, 0) / olderVolumes.length;
      
      if (recentAvg > oldAvg * 1.2) {
        volumeTrend = 'increasing';
        console.log('📈 Tendência de volume: CRESCENTE');
      } else if (recentAvg < oldAvg * 0.8) {
        volumeTrend = 'decreasing';
        console.log('📉 Tendência de volume: DECRESCENTE');
      } else {
        console.log('➡️ Tendência de volume: ESTÁVEL');
      }
    }
  }
  
  // Detectar volume anormal baseado nos dados REAIS
  const avgVolume = totalVolume / candles.length;
  const lastVolume = previousVolumes[previousVolumes.length - 1] || 0;
  const isAbnormal = lastVolume > avgVolume * 1.6; // Threshold mais agressivo
  
  console.log(`🔍 Volume médio: ${avgVolume.toFixed(2)}, Último: ${lastVolume.toFixed(2)}, Anormal: ${isAbnormal}`);
  
  // Determinar significância baseada nos dados REAIS e contexto
  let significance: 'low' | 'medium' | 'high' = 'low';
  const volumeRatio = avgVolume > 0 ? lastVolume / avgVolume : 1.0;
  
  if (volumeRatio > 3.0) {
    significance = 'high';
    console.log('🚨 Volume de ALTA significância detectado');
  } else if (volumeRatio > 2.0) {
    significance = 'medium';
    console.log('⚠️ Volume de significância MÉDIA detectado');
  } else {
    console.log('ℹ️ Volume de baixa significância');
  }
  
  // Calcular proporção REAL em relação à média
  const relativeToAverage = avgVolume > 0 ? lastVolume / avgVolume : 1.0;
  
  // Detectar divergência baseada na variação REAL dos volumes
  let volumeVariation = 0;
  if (previousVolumes.length > 2) {
    const variations = [];
    for (let i = 1; i < previousVolumes.length; i++) {
      const variation = Math.abs(previousVolumes[i] - previousVolumes[i-1]) / 
                       Math.max(previousVolumes[i], previousVolumes[i-1]);
      variations.push(variation);
    }
    volumeVariation = variations.reduce((sum, v) => sum + v, 0) / variations.length;
  }
  
  const divergence = volumeVariation > 0.4; // Threshold para detectar divergência
  
  console.log(`🔄 Variação do volume: ${volumeVariation.toFixed(3)}, Divergência: ${divergence}`);
  
  // Determinar distribuição inteligente baseada no contexto
  let distribution: 'neutral' | 'accumulation' | 'distribution' = 'neutral';
  
  if (isAbnormal && significance !== 'low') {
    // Volume alto + tendência crescente = acumulação
    if (volumeTrend === 'increasing') {
      distribution = 'accumulation';
      console.log('📈 Padrão de ACUMULAÇÃO detectado');
    } 
    // Volume alto + tendência decrescente = distribuição
    else if (volumeTrend === 'decreasing') {
      distribution = 'distribution';
      console.log('📉 Padrão de DISTRIBUIÇÃO detectado');
    }
  }
  
  const result = {
    value: Math.round(lastVolume),
    trend: volumeTrend,
    abnormal: isAbnormal,
    significance,
    relativeToAverage: parseFloat(relativeToAverage.toFixed(2)),
    distribution,
    divergence
  };
  
  console.log('✅ ANÁLISE DE VOLUME COMPLETA:', result);
  return result;
};

// Função auxiliar para análise de volume em tempo real
export const analyzeVolumeInRealTime = (
  currentCandles: CandleData[],
  previousAnalysis?: VolumeData
): VolumeData & { changeDetected: boolean; changeType?: string } => {
  
  const currentAnalysis = analyzeVolume(currentCandles);
  
  if (!previousAnalysis) {
    return {
      ...currentAnalysis,
      changeDetected: false
    };
  }
  
  // Detectar mudanças significativas
  const volumeChangeRatio = currentAnalysis.relativeToAverage / previousAnalysis.relativeToAverage;
  const trendChanged = currentAnalysis.trend !== previousAnalysis.trend;
  const significanceChanged = currentAnalysis.significance !== previousAnalysis.significance;
  
  let changeDetected = false;
  let changeType = '';
  
  // Volume spike
  if (volumeChangeRatio > 1.5 && currentAnalysis.significance === 'high') {
    changeDetected = true;
    changeType = 'volume_spike';
  }
  
  // Trend change
  if (trendChanged && currentAnalysis.trend !== 'neutral') {
    changeDetected = true;
    changeType = 'trend_change';
  }
  
  // Distribution pattern change
  if (currentAnalysis.distribution !== previousAnalysis.distribution && 
      currentAnalysis.distribution !== 'neutral') {
    changeDetected = true;
    changeType = 'distribution_change';
  }
  
  return {
    ...currentAnalysis,
    changeDetected,
    changeType
  };
};
