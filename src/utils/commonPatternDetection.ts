
import { CandleData } from '../context/AnalyzerContext';
import { DetectedPattern } from './types';

export const detectCommonPatterns = (candles: CandleData[]): DetectedPattern[] => {
  if (candles.length < 3) return [];
  
  const patterns: DetectedPattern[] = [];
  
  console.log(`🔍 Analisando ${candles.length} candles para detectar padrões...`);
  
  // Detectar padrões usando dados REAIS dos candles extraídos
  for (let i = 2; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];
    
    // Validar dados do candle
    if (!isValidCandle(current) || !isValidCandle(prev)) continue;
    
    // 1. HAMMER - Candle com pavio longo inferior
    if (isHammer(current)) {
      patterns.push({
        type: 'hammer',
        action: 'compra',
        confidence: 0.75,
        description: `Hammer detectado: pavio inferior ${calculateLowerWickRatio(current).toFixed(1)}x maior que corpo`,
        coordinates: current.position ? { 
          x: current.position.x, 
          y: current.position.y,
          width: 50,
          height: 30
        } : undefined
      });
      console.log(`🔨 HAMMER detectado em ${current.close.toFixed(5)}`);
    }
    
    // 2. SHOOTING STAR - Candle com pavio longo superior
    if (isShootingStar(current)) {
      patterns.push({
        type: 'shooting_star',
        action: 'venda',
        confidence: 0.75,
        description: `Shooting Star detectado: pavio superior ${calculateUpperWickRatio(current).toFixed(1)}x maior que corpo`,
        coordinates: current.position ? { 
          x: current.position.x, 
          y: current.position.y,
          width: 50,
          height: 30
        } : undefined
      });
      console.log(`⭐ SHOOTING STAR detectado em ${current.close.toFixed(5)}`);
    }
    
    // 3. ENGULFING BULLISH - Candle verde engolfa candle vermelho anterior
    if (isBullishEngulfing(prev, current)) {
      patterns.push({
        type: 'bullish_engulfing',
        action: 'compra',
        confidence: 0.85,
        description: `Engolfamento de alta: candle atual (${current.close.toFixed(5)}) engolfa anterior (${prev.close.toFixed(5)})`,
        coordinates: current.position ? { 
          x: current.position.x, 
          y: current.position.y,
          width: 60,
          height: 40
        } : undefined
      });
      console.log(`📈 ENGOLFAMENTO DE ALTA detectado: ${prev.close.toFixed(5)} -> ${current.close.toFixed(5)}`);
    }
    
    // 4. ENGULFING BEARISH - Candle vermelho engolfa candle verde anterior
    if (isBearishEngulfing(prev, current)) {
      patterns.push({
        type: 'bearish_engulfing',
        action: 'venda',
        confidence: 0.85,
        description: `Engolfamento de baixa: candle atual (${current.close.toFixed(5)}) engolfa anterior (${prev.close.toFixed(5)})`,
        coordinates: current.position ? { 
          x: current.position.x, 
          y: current.position.y,
          width: 60,
          height: 40
        } : undefined
      });
      console.log(`📉 ENGOLFAMENTO DE BAIXA detectado: ${prev.close.toFixed(5)} -> ${current.close.toFixed(5)}`);
    }
    
    // 5. DOJI - Indecisão do mercado
    if (isDoji(current)) {
      patterns.push({
        type: 'doji',
        action: 'neutro',
        confidence: 0.65,
        description: `Doji detectado: abertura (${current.open.toFixed(5)}) ≈ fechamento (${current.close.toFixed(5)})`,
        coordinates: current.position ? { 
          x: current.position.x, 
          y: current.position.y,
          width: 45,
          height: 25
        } : undefined
      });
      console.log(`⚖️ DOJI detectado em ${current.close.toFixed(5)}`);
    }
    
    // 6. PIN BAR - Rejection bar com pavio longo
    if (isPinBar(current)) {
      const isRejectionUp = calculateUpperWickRatio(current) > 2;
      patterns.push({
        type: 'pin_bar',
        action: isRejectionUp ? 'venda' : 'compra',
        confidence: 0.80,
        description: `Pin Bar: rejection ${isRejectionUp ? 'para cima' : 'para baixo'} em ${current.close.toFixed(5)}`,
        coordinates: current.position ? { 
          x: current.position.x, 
          y: current.position.y,
          width: 55,
          height: 35
        } : undefined
      });
      console.log(`📍 PIN BAR detectado: rejection ${isRejectionUp ? 'para cima' : 'para baixo'}`);
    }
    
    // 7. MARUBOZU - Candle sem pavios (movimento forte)
    if (isMarubozu(current)) {
      const isBullish = current.close > current.open;
      patterns.push({
        type: 'marubozu',
        action: isBullish ? 'compra' : 'venda',
        confidence: 0.70,
        description: `Marubozu ${isBullish ? 'bullish' : 'bearish'}: movimento forte sem pavios`,
        coordinates: current.position ? { 
          x: current.position.x, 
          y: current.position.y,
          width: 50,
          height: 35
        } : undefined
      });
      console.log(`💪 MARUBOZU ${isBullish ? 'BULLISH' : 'BEARISH'} detectado`);
    }
  }
  
  console.log(`✅ Total de ${patterns.length} padrões detectados nos dados REAIS dos candles`);
  
  return patterns;
};

// === FUNÇÕES DE VALIDAÇÃO ===

const isValidCandle = (candle: CandleData): boolean => {
  return candle && 
         typeof candle.high === 'number' && 
         typeof candle.low === 'number' && 
         typeof candle.open === 'number' && 
         typeof candle.close === 'number' &&
         candle.high >= Math.max(candle.open, candle.close) &&
         candle.low <= Math.min(candle.open, candle.close) &&
         candle.high > candle.low;
};

// === DETECÇÃO DE HAMMER ===
const isHammer = (candle: CandleData): boolean => {
  const body = Math.abs(candle.close - candle.open);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  
  // Hammer: pavio inferior > 2x corpo, pavio superior < 0.5x corpo
  return lowerWick > body * 2 && upperWick < body * 0.5 && body > 0;
};

const calculateLowerWickRatio = (candle: CandleData): number => {
  const body = Math.abs(candle.close - candle.open);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  return body > 0 ? lowerWick / body : 0;
};

// === DETECÇÃO DE SHOOTING STAR ===
const isShootingStar = (candle: CandleData): boolean => {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  
  // Shooting star: pavio superior > 2x corpo, pavio inferior < 0.5x corpo
  return upperWick > body * 2 && lowerWick < body * 0.5 && body > 0;
};

const calculateUpperWickRatio = (candle: CandleData): number => {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  return body > 0 ? upperWick / body : 0;
};

// === DETECÇÃO DE ENGULFING ===
const isBullishEngulfing = (prev: CandleData, current: CandleData): boolean => {
  // Candle anterior deve ser vermelho (bearish)
  const prevIsBearish = prev.close < prev.open;
  // Candle atual deve ser verde (bullish)  
  const currentIsBullish = current.close > current.open;
  // Candle atual deve engolfar completamente o anterior
  const engulfs = current.open < prev.close && current.close > prev.open;
  
  return prevIsBearish && currentIsBullish && engulfs;
};

const isBearishEngulfing = (prev: CandleData, current: CandleData): boolean => {
  // Candle anterior deve ser verde (bullish)
  const prevIsBullish = prev.close > prev.open;
  // Candle atual deve ser vermelho (bearish)
  const currentIsBearish = current.close < current.open;
  // Candle atual deve engolfar completamente o anterior
  const engulfs = current.open > prev.close && current.close < prev.open;
  
  return prevIsBullish && currentIsBearish && engulfs;
};

// === DETECÇÃO DE DOJI ===
const isDoji = (candle: CandleData): boolean => {
  const body = Math.abs(candle.close - candle.open);
  const totalRange = candle.high - candle.low;
  
  // Doji: corpo muito pequeno comparado ao range total
  return totalRange > 0 && (body / totalRange) < 0.1;
};

// === DETECÇÃO DE PIN BAR ===
const isPinBar = (candle: CandleData): boolean => {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  
  // Pin bar: um dos pavios é muito maior que o corpo
  return (upperWick > body * 2 || lowerWick > body * 2) && body > 0;
};

// === DETECÇÃO DE MARUBOZU ===
const isMarubozu = (candle: CandleData): boolean => {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const totalRange = candle.high - candle.low;
  
  // Marubozu: pavios muito pequenos, corpo domina o candle
  return body > 0 && totalRange > 0 && 
         (upperWick + lowerWick) / totalRange < 0.1 && 
         body / totalRange > 0.8;
};
