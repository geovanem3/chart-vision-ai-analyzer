
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Card } from '@/components/ui/card';
import { detectChartRegion } from '@/utils/imageProcessing';

const ChartRegionSelector = () => {
  const { capturedImage, setSelectedRegion, selectedRegion } = useAnalyzer();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [tempRegion, setTempRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Detect chart region automatically when image loads
  useEffect(() => {
    if (capturedImage) {
      detectChartRegion(capturedImage).then((region) => {
        if (region) {
          setSelectedRegion(region);
        }
      });
    }
  }, [capturedImage, setSelectedRegion]);

  // Update image size when it loads
  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
  };

  // Start drawing selection region
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    // Get container bounds
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate coordinates relative to container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale to image natural size
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;
    
    const imageX = x * scaleX;
    const imageY = y * scaleY;
    
    setStartPoint({ x: imageX, y: imageY });
    setTempRegion(null);
    setIsDragging(true);
  };

  // Update selection region while dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    // Get container bounds
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate coordinates relative to container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale to image natural size
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;
    
    const imageX = x * scaleX;
    const imageY = y * scaleY;
    
    const width = Math.abs(imageX - startPoint.x);
    const height = Math.abs(imageY - startPoint.y);
    
    const regionX = Math.min(imageX, startPoint.x);
    const regionY = Math.min(imageY, startPoint.y);
    
    setTempRegion({
      x: regionX,
      y: regionY,
      width,
      height
    });
  };

  // Finalize selection region
  const handleMouseUp = () => {
    if (isDragging && tempRegion) {
      // Only set region if it has a meaningful size
      if (tempRegion.width > 20 && tempRegion.height > 20) {
        setSelectedRegion(tempRegion);
      }
    }
    setIsDragging(false);
  };

  // Reset selection to automatic
  const resetSelection = async () => {
    if (capturedImage) {
      const region = await detectChartRegion(capturedImage);
      if (region) {
        setSelectedRegion(region);
      }
    }
  };

  // Calculate display styles for selection overlay
  const getSelectionStyles = () => {
    if (!selectedRegion || !containerRef.current) return {};
    
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;
    
    return {
      left: `${selectedRegion.x * scaleX}px`,
      top: `${selectedRegion.y * scaleY}px`,
      width: `${selectedRegion.width * scaleX}px`,
      height: `${selectedRegion.height * scaleY}px`
    };
  };

  // Calculate display styles for temporary selection overlay
  const getTempSelectionStyles = () => {
    if (!tempRegion || !containerRef.current) return {};
    
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;
    
    return {
      left: `${tempRegion.x * scaleX}px`,
      top: `${tempRegion.y * scaleY}px`,
      width: `${tempRegion.width * scaleX}px`,
      height: `${tempRegion.height * scaleY}px`
    };
  };

  if (!capturedImage) return null;

  return (
    <Card className="p-4 my-4 w-full max-w-3xl">
      <h3 className="text-lg font-medium mb-2">Select Chart Region</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Drag to select the specific area of the chart you want to analyze, or use the auto-detected region.
      </p>
      
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg mb-4 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img 
          ref={imageRef}
          src={capturedImage} 
          alt="Captured Chart" 
          className="w-full object-contain" 
          onLoad={handleImageLoad}
        />
        
        {selectedRegion && (
          <div 
            className="absolute border-2 border-primary/80 bg-primary/20 pointer-events-none"
            style={getSelectionStyles()}
          />
        )}
        
        {tempRegion && isDragging && (
          <div 
            className="absolute border-2 border-accent/80 bg-accent/20 pointer-events-none"
            style={getTempSelectionStyles()}
          />
        )}
      </div>
      
      <div className="flex justify-end">
        <Button variant="outline" onClick={resetSelection}>
          Reset Selection
        </Button>
      </div>
    </Card>
  );
};

export default ChartRegionSelector;
