
/**
 * Image processing utilities for chart analysis
 */

// Process the captured image to enhance chart features
export const processImage = async (imageUrl: string): Promise<string> => {
  // In a real implementation, this would use canvas or WebGL to process the image
  // For now, we'll just return the original image
  console.log('Processing image:', imageUrl);
  return imageUrl;
};

// Extract chart region from the image if no region is manually selected
export const detectChartRegion = async (imageUrl: string): Promise<{ x: number; y: number; width: number; height: number } | null> => {
  // In a real implementation, this would use computer vision to detect chart boundaries
  // For now, we'll return a default region covering most of the image
  console.log('Detecting chart region in:', imageUrl);
  
  // Create an image element to get the dimensions
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Default to 80% of the image, centered
      const width = img.width * 0.8;
      const height = img.height * 0.8;
      const x = (img.width - width) / 2;
      const y = (img.height - height) / 2;
      
      resolve({ x, y, width, height });
    };
    img.src = imageUrl;
  });
};

// Crop image to the selected region
export const cropToRegion = async (
  imageUrl: string, 
  region: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  console.log('Cropping to region:', region);
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = region.width;
      canvas.height = region.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          img, 
          region.x, region.y, region.width, region.height, 
          0, 0, region.width, region.height
        );
        
        resolve(canvas.toDataURL('image/jpeg'));
      } else {
        // Fallback if context isn't available
        resolve(imageUrl);
      }
    };
    img.src = imageUrl;
  });
};
