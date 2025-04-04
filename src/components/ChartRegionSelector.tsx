import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAnalyzer, Point, TechnicalElement } from '@/context/AnalyzerContext';
import { Card } from '@/components/ui/card';
import { detectChartRegion } from '@/utils/imageProcessing';
import { Circle, Scan } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';

const ChartRegionSelector = () => {
  const { 
    capturedImage, 
    setSelectedRegion, 
    selectedRegion, 
    regionType, 
    setRegionType,
    isMarkupMode,
    manualMarkupTool,
    addManualMarkup,
    manualMarkups
  } = useAnalyzer();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [labelText, setLabelText] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [pendingLabelPosition, setPendingLabelPosition] = useState<Point | null>(null);
  
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

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
  };

  const createManualMarkup = () => {
    if (!isDragging) return;
    
    const getRandomColor = () => {
      const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0', '#33FFF0'];
      return colors[Math.floor(Math.random() * colors.length)];
    };
    
    const markup: TechnicalElement = (() => {
      switch (manualMarkupTool) {
        case 'line':
          return {
            type: 'line',
            points: [
              { x: startPoint.x, y: startPoint.y },
              { x: currentPoint.x, y: currentPoint.y }
            ],
            color: getRandomColor(),
            thickness: 2
          };
        case 'arrow':
          return {
            type: 'arrow',
            start: { x: startPoint.x, y: startPoint.y },
            end: { x: currentPoint.x, y: currentPoint.y },
            color: getRandomColor(),
            thickness: 2
          };
        case 'rectangle':
          const width = Math.abs(currentPoint.x - startPoint.x);
          const height = Math.abs(currentPoint.y - startPoint.y);
          const x = Math.min(startPoint.x, currentPoint.x);
          const y = Math.min(startPoint.y, currentPoint.y);
          return {
            type: 'rectangle',
            position: { x, y },
            width,
            height,
            color: getRandomColor(),
            thickness: 2
          };
        case 'circle':
          const deltaX = currentPoint.x - startPoint.x;
          const deltaY = currentPoint.y - startPoint.y;
          const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          return {
            type: 'circle',
            center: { x: startPoint.x, y: startPoint.y },
            radius,
            color: getRandomColor(),
            thickness: 2
          };
        case 'trendline':
          return {
            type: 'pattern',
            patternType: 'trendline',
            points: [
              { x: startPoint.x, y: startPoint.y },
              { x: currentPoint.x, y: currentPoint.y }
            ],
            color: getRandomColor(),
            thickness: 2,
            dashArray: [5, 5]
          };
        case 'eliotwave':
          return {
            type: 'pattern',
            patternType: 'eliotwave',
            points: [
              { x: startPoint.x, y: startPoint.y },
              { x: currentPoint.x, y: currentPoint.y }
            ],
            color: getRandomColor(),
            thickness: 2,
            label: 'Ondas de Elliott'
          };
        case 'dowtheory':
          return {
            type: 'pattern',
            patternType: 'dowtheory',
            points: [
              { x: startPoint.x, y: startPoint.y },
              { x: currentPoint.x, y: currentPoint.y }
            ],
            color: getRandomColor(),
            thickness: 2,
            label: 'Teoria de Dow'
          };
        default:
          return {
            type: 'line',
            points: [
              { x: startPoint.x, y: startPoint.y },
              { x: currentPoint.x, y: currentPoint.y }
            ],
            color: getRandomColor(),
            thickness: 2
          };
      }
    })();
    
    if (manualMarkupTool !== 'label') {
      addManualMarkup(markup);
    } else {
      setPendingLabelPosition({ x: currentPoint.x, y: currentPoint.y });
      setShowLabelInput(true);
    }
  };

  const handleAddLabel = () => {
    if (pendingLabelPosition && labelText) {
      const labelMarkup: TechnicalElement = {
        type: 'label',
        position: pendingLabelPosition,
        text: labelText,
        color: '#000000',
        backgroundColor: 'rgba(255, 255, 255, 0.7)'
      };
      
      addManualMarkup(labelMarkup);
      setLabelText('');
      setShowLabelInput(false);
      setPendingLabelPosition(null);
    }
  };

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
      if (isMarkupMode) {
        createManualMarkup();
      } else {
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
        } else if (regionType === 'circle') {
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
          }
        }
      }
    }
    setIsDragging(false);
  };

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

  const getTempSelectionStyles = () => {
    if (!isDragging || !containerRef.current) return {};
    
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;
    
    if (isMarkupMode) {
      switch (manualMarkupTool) {
        case 'rectangle':
          const width = Math.abs(currentPoint.x - startPoint.x);
          const height = Math.abs(currentPoint.y - startPoint.y);
          const x = Math.min(currentPoint.x, startPoint.x);
          const y = Math.min(currentPoint.y, startPoint.y);
          
          return {
            left: `${x * scaleX}px`,
            top: `${y * scaleY}px`,
            width: `${width * scaleX}px`,
            height: `${height * scaleY}px`,
            border: '1px dashed rgba(124, 58, 237, 0.8)',
            background: 'rgba(124, 58, 237, 0.1)',
            borderRadius: '0'
          };
        case 'circle':
          const deltaX = currentPoint.x - startPoint.x;
          const deltaY = currentPoint.y - startPoint.y;
          const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          return {
            left: `${(startPoint.x - radius) * scaleX}px`,
            top: `${(startPoint.y - radius) * scaleY}px`,
            width: `${radius * 2 * scaleX}px`,
            height: `${radius * 2 * scaleY}px`,
            border: '1px dashed rgba(124, 58, 237, 0.8)',
            background: 'rgba(124, 58, 237, 0.1)',
            borderRadius: '50%'
          };
        default:
          return {
            left: `${Math.min(startPoint.x, currentPoint.x) * scaleX}px`,
            top: `${Math.min(startPoint.y, currentPoint.y) * scaleY}px`,
            width: `${Math.abs(currentPoint.x - startPoint.x) * scaleX}px`,
            height: `${Math.abs(currentPoint.y - startPoint.y) * scaleY}px`,
            border: 'none',
            background: 'none',
            pointerEvents: 'none' as const,
            backgroundImage: `linear-gradient(to bottom right, transparent calc(50% - 1px), rgba(124, 58, 237, 0.8) calc(50%), transparent calc(50% + 1px))`,
          };
      }
    } else {
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
    }
  };

  const getTempLine = () => {
    if (!isDragging || !containerRef.current || !isMarkupMode || 
        !['line', 'arrow', 'trendline', 'eliotwave', 'dowtheory'].includes(manualMarkupTool)) {
      return null;
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;
    
    return (
      <svg className="absolute inset-0 pointer-events-none">
        <line
          x1={startPoint.x * scaleX}
          y1={startPoint.y * scaleY}
          x2={currentPoint.x * scaleX}
          y2={currentPoint.y * scaleY}
          stroke="rgba(124, 58, 237, 0.8)"
          strokeWidth="2"
          strokeDasharray={manualMarkupTool === 'trendline' ? "5,5" : "none"}
        />
        {manualMarkupTool === 'arrow' && (
          <polygon 
            points={`
              ${currentPoint.x * scaleX},${currentPoint.y * scaleY}
              ${(currentPoint.x - 10) * scaleX},${(currentPoint.y - 5) * scaleY}
              ${(currentPoint.x - 10) * scaleX},${(currentPoint.y + 5) * scaleY}
            `}
            fill="rgba(124, 58, 237, 0.8)"
          />
        )}
      </svg>
    );
  };

  const renderManualMarkups = () => {
    if (!containerRef.current || manualMarkups.length === 0) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;
    
    return (
      <svg className="absolute inset-0 pointer-events-none">
        {manualMarkups.map((markup, index) => {
          switch (markup.type) {
            case 'line':
              return (
                <polyline
                  key={index}
                  points={markup.points.map(p => `${p.x * scaleX},${p.y * scaleY}`).join(' ')}
                  stroke={markup.color}
                  strokeWidth={markup.thickness || 2}
                  fill="none"
                  strokeDasharray={markup.dashArray ? markup.dashArray.join(',') : 'none'}
                />
              );
            case 'arrow':
              const dx = markup.end.x - markup.start.x;
              const dy = markup.end.y - markup.start.y;
              const angle = Math.atan2(dy, dx);
              const headLength = 10;
              
              return (
                <g key={index}>
                  <line
                    x1={markup.start.x * scaleX}
                    y1={markup.start.y * scaleY}
                    x2={markup.end.x * scaleX}
                    y2={markup.end.y * scaleY}
                    stroke={markup.color}
                    strokeWidth={markup.thickness || 2}
                  />
                  <polygon
                    points={`
                      ${markup.end.x * scaleX},${markup.end.y * scaleY}
                      ${(markup.end.x - headLength * Math.cos(angle - Math.PI/6)) * scaleX},${(markup.end.y - headLength * Math.sin(angle - Math.PI/6)) * scaleY}
                      ${(markup.end.x - headLength * Math.cos(angle + Math.PI/6)) * scaleX},${(markup.end.y - headLength * Math.sin(angle + Math.PI/6)) * scaleY}
                    `}
                    fill={markup.color}
                  />
                </g>
              );
            case 'rectangle':
              return (
                <rect
                  key={index}
                  x={markup.position.x * scaleX}
                  y={markup.position.y * scaleY}
                  width={markup.width * scaleX}
                  height={markup.height * scaleY}
                  stroke={markup.color}
                  strokeWidth={markup.thickness || 2}
                  fill="none"
                />
              );
            case 'circle':
              return (
                <circle
                  key={index}
                  cx={markup.center.x * scaleX}
                  cy={markup.center.y * scaleY}
                  r={markup.radius * scaleX}
                  stroke={markup.color}
                  strokeWidth={markup.thickness || 2}
                  fill="none"
                />
              );
            case 'label':
              return (
                <foreignObject
                  key={index}
                  x={(markup.position.x - 50) * scaleX}
                  y={(markup.position.y - 15) * scaleY}
                  width="100"
                  height="30"
                >
                  <div
                    style={{
                      backgroundColor: markup.backgroundColor || 'rgba(255, 255, 255, 0.7)',
                      color: markup.color,
                      padding: '2px 5px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      textAlign: 'center',
                      width: 'fit-content',
                      margin: '0 auto'
                    }}
                  >
                    {markup.text}
                  </div>
                </foreignObject>
              );
            case 'pattern':
              if (markup.patternType === 'trendline') {
                return (
                  <polyline
                    key={index}
                    points={markup.points.map(p => `${p.x * scaleX},${p.y * scaleY}`).join(' ')}
                    stroke={markup.color}
                    strokeWidth={markup.thickness || 2}
                    strokeDasharray="5,5"
                    fill="none"
                  />
                );
              } else {
                return (
                  <g key={index}>
                    <polyline
                      points={markup.points.map(p => `${p.x * scaleX},${p.y * scaleY}`).join(' ')}
                      stroke={markup.color}
                      strokeWidth={markup.thickness || 2}
                      fill="none"
                    />
                    {markup.label && (
                      <foreignObject
                        x={(markup.points[0].x - 50) * scaleX}
                        y={(markup.points[0].y - 25) * scaleY}
                        width="100"
                        height="30"
                      >
                        <div
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            color: markup.color,
                            padding: '2px 5px',
                            borderRadius: '3px',
                            fontSize: '12px',
                            textAlign: 'center',
                            width: 'fit-content',
                            margin: '0 auto'
                          }}
                        >
                          {markup.label}
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              }
            default:
              return null;
          }
        })}
      </svg>
    );
  };

  if (!capturedImage) return null;

  return (
    <Card className="p-4 my-4 w-full max-w-3xl">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">
          {isMarkupMode ? 'Adicionar marcações manuais' : 'Selecione a região do gráfico'}
        </h3>
        {!isMarkupMode && (
          <ToggleGroup type="single" value={regionType} onValueChange={(value) => value && setRegionType(value as 'rectangle' | 'circle')}>
            <ToggleGroupItem value="rectangle" aria-label="Seleção retangular">
              <Scan className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="circle" aria-label="Seleção circular">
              <Circle className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        {isMarkupMode 
          ? `Clique e arraste para adicionar ${manualMarkupTool === 'line' ? 'uma linha' : 
             manualMarkupTool === 'arrow' ? 'uma seta' : 
             manualMarkupTool === 'rectangle' ? 'um retângulo' : 
             manualMarkupTool === 'circle' ? 'um círculo' : 
             manualMarkupTool === 'label' ? 'um texto' : 
             manualMarkupTool === 'trendline' ? 'uma linha de tendência' : 
             manualMarkupTool === 'eliotwave' ? 'Ondas de Elliott' : 
             'Teoria de Dow'}`
          : regionType === 'circle' 
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
        
        {selectedRegion && !isMarkupMode && (
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
        
        {getTempLine()}
        {renderManualMarkups()}
      </div>
      
      {showLabelInput && (
        <div className="mb-4 flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Digite o texto para o rótulo"
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddLabel} size="sm">Adicionar</Button>
          <Button variant="outline" size="sm" onClick={() => setShowLabelInput(false)}>Cancelar</Button>
        </div>
      )}
      
      <div className="flex justify-end">
        {!isMarkupMode && (
          <Button variant="outline" onClick={resetSelection}>
            Redefinir Seleção
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ChartRegionSelector;
