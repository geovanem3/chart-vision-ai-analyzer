
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Card } from '@/components/ui/card';
import { detectChartRegion } from '@/utils/imageProcessing';
import { Circle, Scan } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const ChartRegionSelector = () => {
  const { 
    capturedImage, 
    setSelectedRegion, 
    selectedRegion, 
    regionType, 
    setRegionType 
  } = useAnalyzer();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Detect chart region automatically when image loads
  useEffect(() => {
    if (capturedImage) {
      detectChartRegion(capturedImage).then((region) => {
        if (region) {
          setSelectedRegion({
            type: 'rectangle',
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height
          });
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
    setCurrentPoint({ x: imageX, y: imageY });
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
    
    setCurrentPoint({ x: imageX, y: imageY });
  };

  // Finalize selection region
  const handleMouseUp = () => {
    if (isDragging) {
      if (regionType === 'rectangle') {
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.y - startPoint.y);
        const regionX = Math.min(currentPoint.x, startPoint.x);
        const regionY = Math.min(currentPoint.y, startPoint.y);
        
        // Only set region if it has a meaningful size
        if (width > 20 && height > 20) {
          setSelectedRegion({
            type: 'rectangle',
            x: regionX,
            y: regionY,
            width,
            height
          });
        }
      } else if (regionType === 'circle') {
        // Calculate radius from start point to current point
        const deltaX = currentPoint.x - startPoint.x;
        const deltaY = currentPoint.y - startPoint.y;
        const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Only set region if radius is meaningful
        if (radius > 20) {
          setSelectedRegion({
            type: 'circle',
            centerX: startPoint.x,
            centerY: startPoint.y,
            radius
          });
        }
      }
    }
    setIsDragging(false);
  };

  // Reset selection to automatic
  const resetSelection = async () => {
    if (capturedImage) {
      const region = await detectChartRegion(capturedImage);
      if (region) {
        setSelectedRegion({
          type: 'rectangle',
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height
        });
      }
    }
  };

  // Calculate display styles for selection overlay
  const getSelectionStyles = () => {
    if (!selectedRegion || !containerRef.current) return {};
    
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;
    
    if (selectedRegion.type === 'rectangle') {
      return {
        left: `${selectedRegion.x * scaleX}px`,
        top: `${selectedRegion.y * scaleY}px`,
        width: `${selectedRegion.width * scaleX}px`,
        height: `${selectedRegion.height * scaleY}px`,
        borderRadius: '0'
      };
    } else {
      return {
        left: `${(selectedRegion.centerX - selectedRegion.radius) * scaleX}px`,
        top: `${(selectedRegion.centerY - selectedRegion.radius) * scaleY}px`,
        width: `${selectedRegion.radius * 2 * scaleX}px`,
        height: `${selectedRegion.radius * 2 * scaleY}px`,
        borderRadius: '50%'
      };
    }
  };

  // Calculate display styles for temporary selection overlay
  const getTempSelectionStyles = () => {
    if (!isDragging || !containerRef.current) return {};
    
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;
    
    if (regionType === 'rectangle') {
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);
      const x = Math.min(currentPoint.x, startPoint.x);
      const y = Math.min(currentPoint.y, startPoint.y);
      
      return {
        left: `${x * scaleX}px`,
        top: `${y * scaleY}px`,
        width: `${width * scaleX}px`,
        height: `${height * scaleY}px`,
        borderRadius: '0'
      };
    } else {
      const deltaX = currentPoint.x - startPoint.x;
      const deltaY = currentPoint.y - startPoint.y;
      const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      return {
        left: `${(startPoint.x - radius) * scaleX}px`,
        top: `${(startPoint.y - radius) * scaleY}px`,
        width: `${radius * 2 * scaleX}px`,
        height: `${radius * 2 * scaleY}px`,
        borderRadius: '50%'
      };
    }
  };

  if (!capturedImage) return null;

  return (
    <Card className="p-4 my-4 w-full max-w-3xl">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Selecione a região do gráfico</h3>
        <ToggleGroup type="single" value={regionType} onValueChange={(value) => value && setRegionType(value as 'rectangle' | 'circle')}>
          <ToggleGroupItem value="rectangle" aria-label="Seleção retangular">
            <Scan className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="circle" aria-label="Seleção circular">
            <Circle className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        {regionType === 'circle' 
          ? "Clique e arraste para selecionar a área circular específica do gráfico que deseja analisar." 
          : "Clique e arraste para selecionar a área retangular específica do gráfico que deseja analisar."}
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
        
        {isDragging && (
          <div 
            className="absolute border-2 border-accent/80 bg-accent/20 pointer-events-none"
            style={getTempSelectionStyles()}
          />
        )}
      </div>
      
      <div className="flex justify-end">
        <Button variant="outline" onClick={resetSelection}>
          Redefinir Seleção
        </Button>
      </div>
    </Card>
  );
};

export default ChartRegionSelector;
