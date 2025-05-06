/**
 * Enhanced image preprocessing utilities for better chart analysis
 */

// Apply advanced image enhancement techniques before analysis
export const enhanceImageForAnalysis = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(imageUrl);
            return;
          }
          
          // Draw the original image
          ctx.drawImage(img, 0, 0);
          
          // Get image data for processing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Apply contrast enhancement
          const factor = 1.5; // Contrast enhancement factor
          
          for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale with more weight on green channel (charts often use green/red)
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Enhanced contrast
            data[i] = enhanceChannel(r, factor);
            data[i + 1] = enhanceChannel(g, factor);
            data[i + 2] = enhanceChannel(b, factor);
          }
          
          // Apply sharpening filter
          applySharpening(data, canvas.width, canvas.height);
          
          // Update canvas with processed data
          ctx.putImageData(imageData, 0, 0);
          
          // Apply adaptive thresholding for better line detection
          applyAdaptiveThreshold(ctx, canvas);
          
          // Apply pattern-specific enhancements for better entry/exit point detection
          enhanceEntryExitPoints(ctx, canvas);
          
          // Return enhanced image
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        } catch (e) {
          console.error('Error enhancing image:', e);
          resolve(imageUrl); // Return original on error
        }
      };
      
      img.onerror = () => {
        resolve(imageUrl);
      };
      
      img.src = imageUrl;
    } catch (e) {
      console.error('Error initiating image enhancement:', e);
      resolve(imageUrl);
    }
  });
};

// Enhance single channel with contrast adjustment
const enhanceChannel = (value: number, factor: number): number => {
  // Adjust to center around 128
  const adjusted = factor * (value - 128) + 128;
  // Clamp to valid range
  return Math.max(0, Math.min(255, adjusted));
};

// Apply sharpening filter to image data
const applySharpening = (data: Uint8ClampedArray, width: number, height: number): void => {
  // Create a copy of the original data
  const original = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i++) {
    original[i] = data[i];
  }
  
  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  // Apply convolution
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      for (let c = 0; c < 3; c++) { // For R, G, B channels
        let sum = 0;
        
        // Apply kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += original[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        
        // Set result with clamping
        data[pixelIndex + c] = Math.max(0, Math.min(255, sum));
      }
    }
  }
};

// Apply adaptive thresholding for better chart element detection
const applyAdaptiveThreshold = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  const blockSize = 11; // Size of neighborhood
  const c = 2; // Constant subtracted from mean
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const pixelIndex = (y * canvas.width + x) * 4;
      
      // Calculate local mean
      let sum = 0;
      let count = 0;
      
      for (let ky = -blockSize; ky <= blockSize; ky++) {
        for (let kx = -blockSize; kx <= blockSize; kx++) {
          const ny = y + ky;
          const nx = x + kx;
          
          if (ny >= 0 && ny < canvas.height && nx >= 0 && nx < canvas.width) {
            const idx = (ny * canvas.width + nx) * 4;
            // Use luminance
            sum += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            count++;
          }
        }
      }
      
      // Calculate threshold
      const mean = sum / count;
      const threshold = mean - c;
      
      // Get current pixel luminance
      const luminance = 0.299 * data[pixelIndex] + 0.587 * data[pixelIndex + 1] + 0.114 * data[pixelIndex + 2];
      
      // Apply threshold
      if (luminance > threshold) {
        // Keep original pixel but enhance edges
        const edgeFactor = 1.2;
        data[pixelIndex] = Math.min(255, data[pixelIndex] * edgeFactor);
        data[pixelIndex + 1] = Math.min(255, data[pixelIndex + 1] * edgeFactor);
        data[pixelIndex + 2] = Math.min(255, data[pixelIndex + 2] * edgeFactor);
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

// New function to enhance entry and exit points specifically
const enhanceEntryExitPoints = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Detect horizontal support/resistance lines (potential entry/exit points)
  const horizontalLines = detectHorizontalLines(data, canvas.width, canvas.height);
  
  // Enhance these areas in the image
  for (const line of horizontalLines) {
    const y = line.y;
    const importance = line.importance;
    
    // Draw subtle highlight on these lines
    for (let x = 0; x < canvas.width; x++) {
      const pixelIndex = (y * canvas.width + x) * 4;
      
      // Make potential entry/exit points more visible with a subtle enhancement
      // The stronger the line (higher importance), the more we enhance it
      const enhanceFactor = 1 + (importance * 0.3);
      
      if (line.type === 'support') {
        // Enhance support lines slightly toward green
        data[pixelIndex + 1] = Math.min(255, data[pixelIndex + 1] * enhanceFactor);
      } else {
        // Enhance resistance lines slightly toward red
        data[pixelIndex] = Math.min(255, data[pixelIndex] * enhanceFactor);
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

// Detect horizontal support and resistance lines
const detectHorizontalLines = (data: Uint8ClampedArray, width: number, height: number): Array<{y: number, type: 'support' | 'resistance', importance: number}> => {
  const horizontalLines: Array<{y: number, type: 'support' | 'resistance', importance: number}> = [];
  const threshold = 30; // Threshold for line detection
  const minLineLength = width * 0.2; // Minimum line length (20% of width)
  
  // Scan each row for potential horizontal lines
  for (let y = 5; y < height - 5; y++) {
    let linePixels = 0;
    let darkPixels = 0;
    let brightPixels = 0;
    
    // Check if this row has potential to be a support/resistance line
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      const aboveIndex = ((y - 3) * width + x) * 4;
      const belowIndex = ((y + 3) * width + x) * 4;
      
      // Get luminance of current pixel and pixels above/below
      const luminance = 0.299 * data[pixelIndex] + 0.587 * data[pixelIndex + 1] + 0.114 * data[pixelIndex + 2];
      const aboveLuminance = 0.299 * data[aboveIndex] + 0.587 * data[aboveIndex + 1] + 0.114 * data[aboveIndex + 2];
      const belowLuminance = 0.299 * data[belowIndex] + 0.587 * data[belowIndex + 1] + 0.114 * data[belowIndex + 2];
      
      // If there's significant difference above vs. below, it might be a line
      if (Math.abs(aboveLuminance - belowLuminance) > threshold) {
        linePixels++;
        
        // Check if it's likely a support (darker above, brighter below)
        if (aboveLuminance < belowLuminance) {
          darkPixels++;
        } 
        // Check if it's likely a resistance (brighter above, darker below)
        else if (aboveLuminance > belowLuminance) {
          brightPixels++;
        }
      }
    }
    
    // If we found enough line pixels, classify as support or resistance
    if (linePixels > minLineLength) {
      const importance = linePixels / width; // How significant this line is (0-1)
      
      if (darkPixels > brightPixels) {
        horizontalLines.push({y, type: 'support', importance});
      } else {
        horizontalLines.push({y, type: 'resistance', importance});
      }
    }
  }
  
  return horizontalLines;
};

// Detect if the image is clear enough for analysis
export const isImageClearForAnalysis = (imageUrl: string): Promise<{
  isClear: boolean;
  confidence: number;
  issues: string[];
}> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Check resolution
          const hasGoodResolution = img.width >= 400 && img.height >= 300;
          
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              isClear: false,
              confidence: 0.3,
              issues: ['Falha ao criar contexto para análise de clareza da imagem']
            });
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Check contrast
          let minLuminance = 255;
          let maxLuminance = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            minLuminance = Math.min(minLuminance, luminance);
            maxLuminance = Math.max(maxLuminance, luminance);
          }
          
          const contrast = maxLuminance - minLuminance;
          const hasGoodContrast = contrast > 50;
          
          // Check noise level
          const noiseLevel = estimateNoiseLevel(data, canvas.width, canvas.height);
          const hasLowNoise = noiseLevel < 15;
          
          // Check for blur
          const blurLevel = estimateBlurLevel(data, canvas.width, canvas.height);
          const isNotBlurry = blurLevel < 20;
          
          // Check for readable price levels (horizontal lines)
          const hasReadablePriceLevels = detectHorizontalLines(data, canvas.width, canvas.height).length > 2;
          
          // Calculate overall confidence
          let confidence = 0.5; // Base confidence
          
          if (hasGoodResolution) confidence += 0.15;
          if (hasGoodContrast) confidence += 0.15;
          if (hasLowNoise) confidence += 0.1;
          if (isNotBlurry) confidence += 0.05;
          if (hasReadablePriceLevels) confidence += 0.15;
          
          // Compile issues
          const issues = [];
          
          if (!hasGoodResolution) issues.push('Resolução da imagem baixa');
          if (!hasGoodContrast) issues.push('Contraste insuficiente');
          if (!hasLowNoise) issues.push('Imagem com ruído');
          if (!isNotBlurry) issues.push('Imagem desfocada');
          if (!hasReadablePriceLevels) issues.push('Níveis de preço não identificáveis');
          
          resolve({
            isClear: confidence > 0.7,
            confidence,
            issues
          });
        } catch (e) {
          console.error('Error analyzing image clarity:', e);
          resolve({
            isClear: false,
            confidence: 0.3,
            issues: ['Erro ao analisar clareza da imagem']
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          isClear: false,
          confidence: 0,
          issues: ['Falha ao carregar imagem para análise de clareza']
        });
      };
      
      img.src = imageUrl;
    } catch (e) {
      console.error('Error initiating image clarity analysis:', e);
      resolve({
        isClear: false,
        confidence: 0,
        issues: ['Erro ao iniciar análise de clareza da imagem']
      });
    }
  });
};

// Estimate noise level in image
const estimateNoiseLevel = (data: Uint8ClampedArray, width: number, height: number): number => {
  let totalVariation = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const centerIdx = (y * width + x) * 4;
      const leftIdx = (y * width + (x - 1)) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;
      const topIdx = ((y - 1) * width + x) * 4;
      const bottomIdx = ((y + 1) * width + x) * 4;
      
      // Calculate local variation for luminance
      const center = 0.299 * data[centerIdx] + 0.587 * data[centerIdx + 1] + 0.114 * data[centerIdx + 2];
      const left = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
      const right = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
      const top = 0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2];
      const bottom = 0.299 * data[bottomIdx] + 0.587 * data[bottomIdx + 1] + 0.114 * data[bottomIdx + 2];
      
      const variation = Math.abs(center - left) + Math.abs(center - right) + 
                       Math.abs(center - top) + Math.abs(center - bottom);
      
      totalVariation += variation;
      count++;
    }
  }
  
  return count > 0 ? totalVariation / count : 0;
};

// Estimate blur level in image
const estimateBlurLevel = (data: Uint8ClampedArray, width: number, height: number): number => {
  let totalEdges = 0;
  
  // Apply Sobel operator to detect edges
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // Indices for 3x3 neighborhood
      const tl = ((y - 1) * width + (x - 1)) * 4;
      const t = ((y - 1) * width + x) * 4;
      const tr = ((y - 1) * width + (x + 1)) * 4;
      const l = (y * width + (x - 1)) * 4;
      const r = (y * width + (x + 1)) * 4;
      const bl = ((y + 1) * width + (x - 1)) * 4;
      const b = ((y + 1) * width + x) * 4;
      const br = ((y + 1) * width + (x + 1)) * 4;
      
      // Compute luminance for each pixel
      const lum = (idx: number) => 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      // Sobel X gradient
      const gx = lum(tr) + 2 * lum(r) + lum(br) - lum(tl) - 2 * lum(l) - lum(bl);
      
      // Sobel Y gradient
      const gy = lum(bl) + 2 * lum(b) + lum(br) - lum(tl) - 2 * lum(t) - lum(tr);
      
      // Gradient magnitude
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      totalEdges += magnitude;
    }
  }
  
  // Normalize by image size
  const avgEdgeStrength = totalEdges / ((height - 2) * (width - 2));
  
  // Invert so higher value = more blur
  return 30 - Math.min(30, avgEdgeStrength);
};

// New function to identify potential entry/exit points
export const identifyEntryExitPoints = (
  patterns: any[],
  candles: any[] = []
): {
  bestEntries: Array<{price: string, confidence: number, scenario: string}>;
  worstEntries: Array<{price: string, confidence: number, scenario: string}>;
  bestExits: Array<{price: string, confidence: number, scenario: string}>;
  worstExits: Array<{price: string, confidence: number, scenario: string}>;
} => {
  const result = {
    bestEntries: [],
    worstEntries: [],
    bestExits: [],
    worstExits: []
  };
  
  // Process dominant patterns first
  const sortedPatterns = [...patterns].sort((a, b) => b.confidence - a.confidence);
  
  for (const pattern of sortedPatterns) {
    // Best entry scenarios
    if (pattern.action === 'compra') {
      // Best case: confirmed support with strong volume
      result.bestEntries.push({
        price: pattern.entryPrice || "Na região de suporte confirmado",
        confidence: pattern.confidence * 1.1, // Slightly boosted confidence for best case
        scenario: "Confirmação de suporte com volume elevado e divergência positiva de RSI"
      });
      
      // Worst case: false breakout
      result.worstEntries.push({
        price: pattern.entryPrice || "Na região de suporte aparente",
        confidence: pattern.confidence * 0.7, // Reduced confidence for worst case
        scenario: "Falso rompimento com queda abrupta após entrada"
      });
    } else if (pattern.action === 'venda') {
      // Best case: confirmed resistance with decreasing volume
      result.bestEntries.push({
        price: pattern.entryPrice || "Na região de resistência confirmada",
        confidence: pattern.confidence * 1.1,
        scenario: "Confirmação de resistência com volume decrescente e divergência negativa de RSI"
      });
      
      // Worst case: false breakdown
      result.worstEntries.push({
        price: pattern.entryPrice || "Na região de resistência aparente",
        confidence: pattern.confidence * 0.7,
        scenario: "Falso rompimento com alta abrupta após entrada"
      });
    }
    
    // Best and worst exit scenarios
    if (pattern.takeProfit) {
      result.bestExits.push({
        price: pattern.takeProfit,
        confidence: pattern.confidence * 1.1,
        scenario: pattern.action === 'compra' 
          ? "Saída na resistência com volume crescente" 
          : "Saída no suporte com volume crescente"
      });
    }
    
    if (pattern.stopLoss) {
      result.worstExits.push({
        price: pattern.stopLoss,
        confidence: pattern.confidence * 0.9,
        scenario: "Stop atingido em movimento rápido contra a tendência"
      });
    }
  }
  
  // Add realistic worst-case scenarios
  result.worstEntries.push({
    price: "Qualquer nível",
    confidence: 0.6,
    scenario: "Notícia inesperada mudando a tendência imediatamente após a entrada"
  });
  
  result.worstExits.push({
    price: "Qualquer nível",
    confidence: 0.6,
    scenario: "Gap contra a posição na abertura do próximo período"
  });
  
  // Add realistic best-case scenarios
  result.bestEntries.push({
    price: "Em retração de Fibonacci",
    confidence: 0.85,
    scenario: "Entrada perfeita no nível de Fibonacci 61.8% com reversão imediata na direção esperada"
  });
  
  result.bestExits.push({
    price: "Alvo estendido",
    confidence: 0.85,
    scenario: "Movimento forte ultrapassando o alvo original com aumento de volume"
  });
  
  return result;
};
