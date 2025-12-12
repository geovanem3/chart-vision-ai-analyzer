import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Card } from '@/components/ui/card';
import { detectChartRegion } from '@/utils/imageProcessing';
import { Circle, Scan, Target } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
  const [useManualCircle, setUseManualCircle] = useState(false);
  const [manualCircle, setManualCircle] = useState({
    centerX: 0,
    centerY: 0,
    radius: 50
  });
  
  useEffect(() => {
    if (capturedImage) {
      detectChartRegion(capturedImage).then((regionResult) => {
        if (regionResult.success && regionResult.data) {
          setSelectedRegion({
            type: 'rectangle',
            x: regionResult.data.x,
            y: regionResult.data.y,
            width: regionResult.data.width,
            height: regionResult.data.height
          });
          
          const centerX = regionResult.data.x + regionResult.data.width / 2;
          const centerY = regionResult.data.y + regionResult.data.height / 2;
          const radius = Math.min(regionResult.data.width, regionResult.data.height) / 3;
          
          setManualCircle({
            centerX: centerX,
            centerY: centerY,
            radius: radius
          });
        }
      });
    }
  }, [capturedImage, setSelectedRegion]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
  };

  useEffect(() => {
    if (useManualCircle && regionType === 'circle') {
      setSelectedRegion({
        type: 'circle',
        centerX: manualCircle.centerX,
        centerY: manualCircle.centerY,
        radius: manualCircle.radius
      });
    }
  }, [useManualCircle, manualCircle, regionType, setSelectedRegion]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;
    
    const imageX = x * scaleX;
    const imageY = y * scaleY;
    
    setStartPoint({ x: imageX, y: imageY });
    setCurrentPoint({ x: imageX, y: imageY });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;
    
    const imageX = x * scaleX;
    const imageY = y * scaleY;
    
    setCurrentPoint({ x: imageX, y: imageY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      if (regionType === 'rectangle') {
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.y - startPoint.y);
        const regionX = Math.min(currentPoint.x, startPoint.x);
        const regionY = Math.min(currentPoint.y, startPoint.y);
        
        if (width > 20 && height > 20) {
          setSelectedRegion({
            type: 'rectangle',
            x: regionX,
            y: regionY,
            width,
            height
          });
        }
      } else if (regionType === 'circle' && !useManualCircle) {
        const deltaX = currentPoint.x - startPoint.x;
        const deltaY = currentPoint.y - startPoint.y;
        const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (radius > 20) {
          setSelectedRegion({
            type: 'circle',
            centerX: startPoint.x,
            centerY: startPoint.y,
            radius
          });
          
          setManualCircle({
            centerX: startPoint.x,
            centerY: startPoint.y,
            radius
          });
        }
      }
      
      setIsDragging(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;
    
    const imageX = x * scaleX;
    const imageY = y * scaleY;
    
    setStartPoint({ x: imageX, y: imageY });
    setCurrentPoint({ x: imageX, y: imageY });
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;
    
    const imageX = x * scaleX;
    const imageY = y * scaleY;
    
    setCurrentPoint({ x: imageX, y: imageY });
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const handleAutoDetect = () => {
    if (capturedImage) {
      detectChartRegion(capturedImage).then((regionResult) => {
        if (regionResult.success && regionResult.data) {
          setSelectedRegion({
            type: 'rectangle',
            x: regionResult.data.x,
            y: regionResult.data.y,
            width: regionResult.data.width,
            height: regionResult.data.height
          });
        }
      });
    }
  };

  const renderSelectionOverlay = () => {
    if (!selectedRegion || !containerRef.current || !imageSize.width) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;
    
    if (selectedRegion.type === 'rectangle') {
      return (
        <div 
          className="absolute border-2 border-primary bg-primary/10 rounded"
          style={{
            left: `${selectedRegion.x * scaleX}px`,
            top: `${selectedRegion.y * scaleY}px`,
            width: `${selectedRegion.width * scaleX}px`,
            height: `${selectedRegion.height * scaleY}px`,
          }}
        >
          <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
            Região Selecionada
          </div>
        </div>
      );
    } else {
      return (
        <div 
          className="absolute border-2 border-primary bg-primary/10 rounded-full"
          style={{
            left: `${(selectedRegion.centerX - selectedRegion.radius) * scaleX}px`,
            top: `${(selectedRegion.centerY - selectedRegion.radius) * scaleY}px`,
            width: `${selectedRegion.radius * 2 * scaleX}px`,
            height: `${selectedRegion.radius * 2 * scaleY}px`,
          }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded whitespace-nowrap">
            Região Selecionada
          </div>
        </div>
      );
    }
  };

  const renderDragPreview = () => {
    if (!isDragging || !containerRef.current || !imageSize.width) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;
    
    if (regionType === 'rectangle') {
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);
      const x = Math.min(currentPoint.x, startPoint.x);
      const y = Math.min(currentPoint.y, startPoint.y);
      
      return (
        <div 
          className="absolute border-2 border-dashed border-blue-500 bg-blue-500/20"
          style={{
            left: `${x * scaleX}px`,
            top: `${y * scaleY}px`,
            width: `${width * scaleX}px`,
            height: `${height * scaleY}px`,
          }}
        />
      );
    } else {
      const deltaX = currentPoint.x - startPoint.x;
      const deltaY = currentPoint.y - startPoint.y;
      const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      return (
        <div 
          className="absolute border-2 border-dashed border-blue-500 bg-blue-500/20 rounded-full"
          style={{
            left: `${(startPoint.x - radius) * scaleX}px`,
            top: `${(startPoint.y - radius) * scaleY}px`,
            width: `${radius * 2 * scaleX}px`,
            height: `${radius * 2 * scaleY}px`,
          }}
        />
      );
    }
  };

  if (!capturedImage) {
    return null;
  }

  return (
    <Card className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Região de Análise</Label>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAutoDetect}
          className="gap-1"
        >
          <Target className="h-3 w-3" />
          Auto
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <ToggleGroup 
          type="single" 
          value={regionType} 
          onValueChange={(value) => value && setRegionType(value as 'rectangle' | 'circle')}
          className="justify-start"
        >
          <ToggleGroupItem value="rectangle" aria-label="Retângulo" className="gap-1">
            <Scan className="h-4 w-4" />
            Retângulo
          </ToggleGroupItem>
          <ToggleGroupItem value="circle" aria-label="Círculo" className="gap-1">
            <Circle className="h-4 w-4" />
            Círculo
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {regionType === 'circle' && (
        <div className="space-y-3 p-3 bg-secondary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Ajuste Manual</Label>
            <Switch
              checked={useManualCircle}
              onCheckedChange={setUseManualCircle}
            />
          </div>
          
          {useManualCircle && (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Raio: {Math.round(manualCircle.radius)}px</Label>
                <Slider
                  value={[manualCircle.radius]}
                  min={20}
                  max={Math.min(imageSize.width, imageSize.height) / 2}
                  step={5}
                  onValueChange={([value]) => setManualCircle(prev => ({ ...prev, radius: value }))}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg border border-border cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          ref={imageRef}
          src={capturedImage} 
          alt="Chart" 
          className="w-full h-auto"
          onLoad={handleImageLoad}
          draggable={false}
        />
        {renderSelectionOverlay()}
        {renderDragPreview()}
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Arraste na imagem para selecionar a região de análise
      </p>
    </Card>
  );
};

export default ChartRegionSelector;
