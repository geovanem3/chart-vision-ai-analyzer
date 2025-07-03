
/**
 * Advanced Image Enhancement for Financial Charts
 * Specialized preprocessing for better chart analysis
 */

export interface EnhancementResult {
  enhancedImageUrl: string;
  enhancements: {
    contrastImprovement: number;
    noiseReduction: number;
    edgeEnhancement: number;
    colorNormalization: number;
  };
  processingTime: number;
  confidence: number;
}

export const enhanceFinancialChart = async (imageUrl: string): Promise<EnhancementResult> => {
  const startTime = Date.now();
  console.log('🎨 INICIANDO ENHANCEMENT AVANÇADO PARA GRÁFICO FINANCEIRO');
  
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imageUrl;
  });
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot create canvas context');
  
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const originalData = new Uint8ClampedArray(imageData.data);
  
  // Apply specialized enhancements
  const enhancements = {
    contrastImprovement: 0,
    noiseReduction: 0,
    edgeEnhancement: 0,
    colorNormalization: 0
  };
  
  // 1. Adaptive contrast enhancement for better price visibility
  enhancements.contrastImprovement = applyAdaptiveContrast(imageData, canvas.width, canvas.height);
  console.log('✨ Contraste adaptativo aplicado:', enhancements.contrastImprovement);
  
  // 2. Noise reduction while preserving chart elements
  enhancements.noiseReduction = applySmartNoiseReduction(imageData, canvas.width, canvas.height);
  console.log('🧹 Redução de ruído aplicada:', enhancements.noiseReduction);
  
  // 3. Edge enhancement for better line detection
  enhancements.edgeEnhancement = applySelectiveEdgeEnhancement(imageData, canvas.width, canvas.height);
  console.log('📐 Enhancement de bordas aplicado:', enhancements.edgeEnhancement);
  
  // 4. Color normalization for consistent analysis
  enhancements.colorNormalization = applyColorNormalization(imageData, canvas.width, canvas.height);
  console.log('🎨 Normalização de cores aplicada:', enhancements.colorNormalization);
  
  // 5. Specialized candlestick enhancement
  applyCandlestickEnhancement(imageData, canvas.width, canvas.height);
  console.log('🕯️ Enhancement específico para candlesticks aplicado');
  
  // Apply processed data back to canvas
  ctx.putImageData(imageData, 0, 0);
  
  const enhancedImageUrl = canvas.toDataURL('image/jpeg', 0.95);
  const processingTime = Date.now() - startTime;
  
  // Calculate enhancement confidence
  const confidence = calculateEnhancementConfidence(originalData, imageData.data, canvas.width, canvas.height);
  
  console.log(`🎯 Enhancement concluído em ${processingTime}ms com confiança de ${Math.round(confidence * 100)}%`);
  
  return {
    enhancedImageUrl,
    enhancements,
    processingTime,
    confidence
  };
};

// Adaptive contrast enhancement
const applyAdaptiveContrast = (imageData: ImageData, width: number, height: number): number => {
  const data = imageData.data;
  let improvement = 0;
  
  // Analyze histogram to determine optimal contrast adjustment
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const luminance = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[luminance]++;
  }
  
  // Find optimal contrast range
  let minLum = 255, maxLum = 0;
  let pixelCount = 0;
  const totalPixels = width * height;
  
  // Find 5% and 95% percentiles
  for (let i = 0; i < 256; i++) {
    pixelCount += histogram[i];
    if (pixelCount >= totalPixels * 0.05 && minLum === 255) {
      minLum = i;
    }
    if (pixelCount >= totalPixels * 0.95 && maxLum === 0) {
      maxLum = i;
      break;
    }
  }
  
  // Apply adaptive contrast stretching
  const range = maxLum - minLum;
  if (range > 50) {
    const factor = 255 / range;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const adjustedLuminance = Math.max(0, Math.min(255, (luminance - minLum) * factor));
      const luminanceFactor = adjustedLuminance / Math.max(1, luminance);
      
      data[i] = Math.max(0, Math.min(255, r * luminanceFactor));
      data[i + 1] = Math.max(0, Math.min(255, g * luminanceFactor));
      data[i + 2] = Math.max(0, Math.min(255, b * luminanceFactor));
      
      improvement += Math.abs(adjustedLuminance - luminance) / 255;
    }
    
    improvement = improvement / (width * height);
  }
  
  return Math.round(improvement * 100) / 100;
};

// Smart noise reduction preserving chart elements
const applySmartNoiseReduction = (imageData: ImageData, width: number, height: number): number => {
  const data = imageData.data;
  const original = new Uint8ClampedArray(data);
  let reduction = 0;
  
  // Use bilateral filter to reduce noise while preserving edges
  const spatialSigma = 3;
  const intensitySigma = 30;
  
  for (let y = spatialSigma; y < height - spatialSigma; y++) {
    for (let x = spatialSigma; x < width - spatialSigma; x++) {
      const centerIdx = (y * width + x) * 4;
      
      let weightSum = 0;
      let filteredR = 0, filteredG = 0, filteredB = 0;
      
      // Apply bilateral filter in neighborhood
      for (let dy = -spatialSigma; dy <= spatialSigma; dy++) {
        for (let dx = -spatialSigma; dx <= spatialSigma; dx++) {
          const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
          
          // Spatial weight
          const spatialWeight = Math.exp(-(dx * dx + dy * dy) / (2 * spatialSigma * spatialSigma));
          
          // Intensity weight
          const centerLum = 0.299 * original[centerIdx] + 0.587 * original[centerIdx + 1] + 0.114 * original[centerIdx + 2];
          const neighborLum = 0.299 * original[neighborIdx] + 0.587 * original[neighborIdx + 1] + 0.114 * original[neighborIdx + 2];
          const intensityWeight = Math.exp(-Math.abs(centerLum - neighborLum) / (2 * intensitySigma * intensitySigma));
          
          const totalWeight = spatialWeight * intensityWeight;
          
          filteredR += original[neighborIdx] * totalWeight;
          filteredG += original[neighborIdx + 1] * totalWeight;
          filteredB += original[neighborIdx + 2] * totalWeight;
          weightSum += totalWeight;
        }
      }
      
      if (weightSum > 0) {
        const newR = filteredR / weightSum;
        const newG = filteredG / weightSum;
        const newB = filteredB / weightSum;
        
        reduction += Math.abs(data[centerIdx] - newR) + Math.abs(data[centerIdx + 1] - newG) + Math.abs(data[centerIdx + 2] - newB);
        
        data[centerIdx] = newR;
        data[centerIdx + 1] = newG;
        data[centerIdx + 2] = newB;
      }
    }
  }
  
  return Math.round(reduction / (width * height * 3 * 255) * 100) / 100;
};

// Selective edge enhancement for chart lines
const applySelectiveEdgeEnhancement = (imageData: ImageData, width: number, height: number): number => {
  const data = imageData.data;
  const original = new Uint8ClampedArray(data);
  let enhancement = 0;
  
  // Sobel edge detection with enhancement
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate Sobel gradients
      const gx = getSobelX(original, x, y, width);
      const gy = getSobelY(original, x, y, width);
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      // Enhance edges selectively (strong edges get more enhancement)
      if (magnitude > 30) {
        const enhancementFactor = Math.min(1.5, 1 + magnitude / 255);
        
        for (let c = 0; c < 3; c++) {
          const enhanced = original[idx + c] * enhancementFactor;
          data[idx + c] = Math.max(0, Math.min(255, enhanced));
          enhancement += Math.abs(enhanced - original[idx + c]) / 255;
        }
      }
    }
  }
  
  return Math.round(enhancement / (width * height * 3) * 100) / 100;
};

// Color normalization for consistent analysis
const applyColorNormalization = (imageData: ImageData, width: number, height: number): number => {
  const data = imageData.data;
  let normalization = 0;
  
  // Normalize each color channel separately
  for (let channel = 0; channel < 3; channel++) {
    const values = [];
    
    // Collect channel values
    for (let i = channel; i < data.length; i += 4) {
      values.push(data[i]);
    }
    
    // Calculate statistics
    values.sort((a, b) => a - b);
    const min = values[Math.floor(values.length * 0.02)]; // 2nd percentile
    const max = values[Math.floor(values.length * 0.98)]; // 98th percentile
    const range = max - min;
    
    if (range > 50) {
      // Apply normalization
      for (let i = channel; i < data.length; i += 4) {
        const original = data[i];
        const normalized = Math.max(0, Math.min(255, ((original - min) / range) * 255));
        data[i] = normalized;
        normalization += Math.abs(normalized - original) / 255;
      }
    }
  }
  
  return Math.round(normalization / (width * height * 3) * 100) / 100;
};

// Specialized enhancement for candlestick patterns
const applyCandlestickEnhancement = (imageData: ImageData, width: number, height: number): void => {
  const data = imageData.data;
  
  // Enhance typical candlestick colors (green/red/white/black)
  const candlestickColors = [
    { r: 0, g: 255, b: 0 },     // Green
    { r: 255, g: 0, b: 0 },     // Red
    { r: 255, g: 255, b: 255 }, // White
    { r: 0, g: 0, b: 0 }        // Black
  ];
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Find closest candlestick color
    let minDistance = Infinity;
    let closestColor = null;
    
    for (const color of candlestickColors) {
      const distance = Math.sqrt(
        Math.pow(r - color.r, 2) +
        Math.pow(g - color.g, 2) +
        Math.pow(b - color.b, 2)
      );
      
      if (distance < minDistance && distance < 100) {
        minDistance = distance;
        closestColor = color;
      }
    }
    
    // Enhance toward the closest candlestick color
    if (closestColor && minDistance < 80) {
      const enhancementFactor = 0.3 * (1 - minDistance / 100);
      
      data[i] = r + (closestColor.r - r) * enhancementFactor;
      data[i + 1] = g + (closestColor.g - g) * enhancementFactor;
      data[i + 2] = b + (closestColor.b - b) * enhancementFactor;
    }
  }
};

// Helper functions
const getSobelX = (data: Uint8ClampedArray, x: number, y: number, width: number): number => {
  const kernel = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  let sum = 0;
  
  for (let ky = -1; ky <= 1; ky++) {
    for (let kx = -1; kx <= 1; kx++) {
      const idx = ((y + ky) * width + (x + kx)) * 4;
      const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      sum += luminance * kernel[(ky + 1) * 3 + (kx + 1)];
    }
  }
  
  return sum;
};

const getSobelY = (data: Uint8ClampedArray, x: number, y: number, width: number): number => {
  const kernel = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  let sum = 0;
  
  for (let ky = -1; ky <= 1; ky++) {
    for (let kx = -1; kx <= 1; kx++) {
      const idx = ((y + ky) * width + (x + kx)) * 4;
      const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      sum += luminance * kernel[(ky + 1) * 3 + (kx + 1)];
    }
  }
  
  return sum;
};

const calculateEnhancementConfidence = (
  original: Uint8ClampedArray,
  enhanced: Uint8ClampedArray,
  width: number,
  height: number
): number => {
  let totalDifference = 0;
  let significantChanges = 0;
  
  for (let i = 0; i < original.length; i += 4) {
    const origLum = 0.299 * original[i] + 0.587 * original[i + 1] + 0.114 * original[i + 2];
    const enhLum = 0.299 * enhanced[i] + 0.587 * enhanced[i + 1] + 0.114 * enhanced[i + 2];
    
    const difference = Math.abs(enhLum - origLum);
    totalDifference += difference;
    
    if (difference > 10) significantChanges++;
  }
  
  const avgDifference = totalDifference / (width * height);
  const changeRatio = significantChanges / (width * height);
  
  // Confidence based on meaningful changes without over-processing
  return Math.min(1, (avgDifference / 50) * (1 - Math.abs(changeRatio - 0.3)));
};
