
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAnalyzer, Point, TechnicalElement } from '@/context/AnalyzerContext';
import { Card } from '@/components/ui/card';
import { detectChartRegion } from '@/utils/imageProcessing';
import { Circle, Scan, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move, Target } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
  const [showPrecisionControls, setShowPrecisionControls] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [useManualCircle, setUseManualCircle] = useState(false);
  const [manualCircle, setManualCircle] = useState({
    centerX: 0,
    centerY: 0,
    radius: 50
  });
  const [isPlacingCircle, setIsPlacingCircle] = useState(false);
  
  const FINE_ADJUST_PX = 5;
  
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

  const createManualMarkup = () => {
    if (!isDragging) return;
    
    const getRandomColor = () => {
      const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0', '#33FFF0'];
      return colors[Math.floor(Math.random() * colors.length)];
    };
    
    const generateId = () => `markup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const markup: TechnicalElement = (() => {
      switch (manualMarkupTool) {
        case 'line':
          return {
            id: generateId(),
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
            id: generateId(),
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
            id: generateId(),
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
            id: generateId(),
            type: 'circle',
            center: { x: startPoint.x, y: startPoint.y },
            radius,
            color: getRandomColor(),
            thickness: 2
          };
        case 'trendline':
          return {
            id: generateId(),
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
            id: generateId(),
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
            id: generateId(),
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
            id: generateId(),
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
        id: `label-${Date.now()}`,
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
    
    if (isPlacingCircle && regionType === 'circle') {
      setManualCircle(prev => ({
        ...prev,
        centerX: imageX,
        centerY: imageY
      }));
      
      setSelectedRegion({
        type: 'circle',
        centerX: imageX,
        centerY: imageY,
        radius: manualCircle.radius
      });
      
      setIsPlacingCircle(false);
      return;
    }
    
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
      }
    }
    setIsDragging(false);
  };

  const adjustSelectedRegion = (direction: 'left' | 'right' | 'up' | 'down', amount: number) => {
    if (!selectedRegion) return;
    
    if (selectedRegion.type === 'rectangle') {
      const newRegion = { ...selectedRegion };
      
      switch (direction) {
        case 'left':
          if (amount < 0) {
            newRegion.x += amount;
            newRegion.width -= amount;
          } else {
            newRegion.x += amount;
            newRegion.width -= amount;
          }
          break;
        case 'right':
          newRegion.width += amount;
          break;
        case 'up':
          if (amount < 0) {
            newRegion.y += amount;
            newRegion.height -= amount;
          } else {
            newRegion.y += amount;
            newRegion.height -= amount;
          }
          break;
        case 'down':
          newRegion.height += amount;
          break;
      }
      
      newRegion.width = Math.max(20, newRegion.width);
      newRegion.height = Math.max(20, newRegion.height);
      
      setSelectedRegion(newRegion);
    } else if (selectedRegion.type === 'circle') {
      const newRegion = { ...selectedRegion };
      
      switch (direction) {
        case 'left':
          newRegion.centerX -= amount;
          break;
        case 'right':
          newRegion.centerX += amount;
          break;
        case 'up':
          newRegion.centerY -= amount;
          break;
        case 'down':
          newRegion.centerY += amount;
          break;
      }
      
      setSelectedRegion(newRegion);
    }
  };

  const adjustRadius = (amount: number) => {
    if (!selectedRegion || selectedRegion.type !== 'circle') return;
    
    const newRadius = Math.max(10, selectedRegion.radius + amount);
    
    setSelectedRegion({
      ...selectedRegion,
      radius: newRadius
    });
    
    setManualCircle(prev => ({
      ...prev,
      radius: newRadius
    }));
  };

  const handleManualInput = (
    field: 'centerX' | 'centerY' | 'radius', 
    value: string
  ) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    
    const newManualCircle = { ...manualCircle, [field]: numValue };
    setManualCircle(newManualCircle);
    
    if (regionType === 'circle') {
      setSelectedRegion({
        type: 'circle',
        centerX: newManualCircle.centerX,
        centerY: newManualCircle.centerY,
        radius: newManualCircle.radius
      });
    }
  };

  const moveRegion = (direction: 'left' | 'right' | 'up' | 'down') => {
    const amount = FINE_ADJUST_PX;
    
    if (!selectedRegion) return;
    
    if (selectedRegion.type === 'rectangle') {
      const newRegion = { ...selectedRegion };
      
      switch (direction) {
        case 'left':
          newRegion.x -= amount;
          break;
        case 'right':
          newRegion.x += amount;
          break;
        case 'up':
          newRegion.y -= amount;
          break;
        case 'down':
          newRegion.y += amount;
          break;
      }
      
      setSelectedRegion(newRegion);
    } else if (selectedRegion.type === 'circle') {
      const newRegion = { ...selectedRegion };
      
      switch (direction) {
        case 'left':
          newRegion.centerX -= amount;
          break;
        case 'right':
          newRegion.centerX += amount;
          break;
        case 'up':
          newRegion.centerY -= amount;
          break;
        case 'down':
          newRegion.centerY += amount;
          break;
      }
      
      setSelectedRegion(newRegion);
    }
  };

  const resetSelection = async () => {
    if (capturedImage) {
      const regionResult = await detectChartRegion(capturedImage);
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
                  points={(markup.points || []).map(p => `${p.x * scaleX},${p.y * scaleY}`).join(' ')}
                  stroke={markup.color}
                  strokeWidth={markup.thickness || 2}
                  fill="none"
                  strokeDasharray={markup.dashArray ? markup.dashArray.join(',') : 'none'}
                />
              );
            case 'arrow':
              if (!markup.start || !markup.end) return null;
              
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
              if (!markup.position) return null;
              
              return (
                <rect
                  key={index}
                  x={markup.position.x * scaleX}
                  y={markup.position.y * scaleY}
                  width={(markup.width || 0) * scaleX}
                  height={(markup.height || 0) * scaleY}
                  stroke={markup.color}
                  strokeWidth={markup.thickness || 2}
                  fill="none"
                />
              );
            case 'circle':
              if (!markup.center) return null;
              
              return (
                <circle
                  key={index}
                  cx={markup.center.x * scaleX}
                  cy={markup.center.y * scaleY}
                  r={(markup.radius || 0) * scaleX}
                  stroke={markup.color}
                  strokeWidth={markup.thickness || 2}
                  fill="none"
                />
              );
            case 'label':
              if (!markup.position) return null;
              
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
                    points={(markup.points || []).map(p => `${p.x * scaleX},${p.y * scaleY}`).join(' ')}
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
                      points={(markup.points || []).map(p => `${p.x * scaleX},${p.y * scaleY}`).join(' ')}
                      stroke={markup.color}
                      strokeWidth={markup.thickness || 2}
                      fill="none"
                    />
                    {markup.label && (
                      <foreignObject
                        x={((markup.points || [])[0]?.x || 0 - 50) * scaleX}
                        y={((markup.points || [])[0]?.y || 0 - 25) * scaleY}
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

  const renderManualCircle = () => {
    if (!containerRef.current || !useManualCircle || regionType !== 'circle') return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;
    
    return (
      <div
        className="absolute border-2 border-primary bg-primary/20 rounded-full pointer-events-none"
        style={{
          left: `${(manualCircle.centerX - manualCircle.radius) * scaleX}px`,
          top: `${(manualCircle.centerY - manualCircle.radius) * scaleY}px`,
          width: `${manualCircle.radius * 2 * scaleX}px`,
          height: `${manualCircle.radius * 2 * scaleY}px`,
        }}
      />
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
          <div className="flex items-center space-x-2">
            <ToggleGroup type="single" value={regionType} onValueChange={(value) => {
              if (value) {
                setRegionType(value as 'rectangle' | 'circle');
                if (value === 'circle' && selectedRegion && selectedRegion.type === 'circle') {
                  setManualCircle({
                    centerX: selectedRegion.centerX,
                    centerY: selectedRegion.centerY,
                    radius: selectedRegion.radius
                  });
                }
              }
            }}>
              <ToggleGroupItem value="rectangle" aria-label="Seleção retangular">
                <Scan className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="circle" aria-label="Seleção circular">
                <Circle className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
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
            ? (useManualCircle 
               ? "Use os controles abaixo para posicionar manualmente o círculo, ou clique no botão 'Posicionar' e depois na imagem." 
               : "Clique e arraste para selecionar a área circular específica do gráfico que deseja analisar.")
            : "Clique e arraste para selecionar a área retangular específica do gráfico que deseja analisar."}
      </p>
      
      {regionType === 'circle' && (
        <div className="mb-4 flex items-center space-x-2">
          <Switch 
            id="manual-circle" 
            checked={useManualCircle}
            onCheckedChange={setUseManualCircle}
          />
          <Label htmlFor="manual-circle">Posicionamento Manual do Círculo</Label>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg mb-4 cursor-crosshair"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.3s ease' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img 
          ref={imageRef}
          src={capturedImage} 
          alt="Captura do Gráfico" 
          className="w-full object-contain" 
          onLoad={handleImageLoad}
        />
        
        {selectedRegion && !isMarkupMode && !useManualCircle && (
          <div 
            className="absolute border-2 border-primary/80 bg-primary/20 pointer-events-none"
            style={getSelectionStyles()}
          />
        )}
        
        {renderManualCircle()}
        
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
      
      {regionType === 'circle' && useManualCircle && (
        <div className="mb-4 p-4 border rounded-md space-y-4">
          <h4 className="text-sm font-medium">Posicionamento Manual do Círculo</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="center-x">Centro X:</Label>
              <Input
                id="center-x"
                type="number"
                value={Math.round(manualCircle.centerX)}
                onChange={(e) => handleManualInput('centerX', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="center-y">Centro Y:</Label>
              <Input
                id="center-y"
                type="number"
                value={Math.round(manualCircle.centerY)}
                onChange={(e) => handleManualInput('centerY', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="radius">Raio:</Label>
            <div className="flex items-center space-x-4">
              <Input
                id="radius"
                type="number"
                value={Math.round(manualCircle.radius)}
                onChange={(e) => handleManualInput('radius', e.target.value)}
                className="w-24"
              />
              <Slider
                value={[manualCircle.radius]}
                onValueChange={(value) => handleManualInput('radius', value[0].toString())}
                min={10}
                max={Math.min(imageSize.width, imageSize.height) / 2}
                step={1}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsPlacingCircle(true)}
              className="flex items-center space-x-1"
            >
              <Target className="h-4 w-4 mr-1" />
              Posicionar Centro
            </Button>
            
            <div className="grid grid-cols-3 gap-2">
              <div />
              <Button size="sm" variant="outline" onClick={() => moveRegion('up')}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <div />
              
              <Button size="sm" variant="outline" onClick={() => moveRegion('left')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Move className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => moveRegion('right')}>
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <div />
              <Button size="sm" variant="outline" onClick={() => moveRegion('down')}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <div />
            </div>
            
            <div>
              <Button size="sm" variant="outline" onClick={() => adjustRadius(-5)}>
                -
              </Button>
              <span className="mx-2 text-sm">Raio</span>
              <Button size="sm" variant="outline" onClick={() => adjustRadius(5)}>
                +
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowPrecisionControls(!showPrecisionControls)}
          className="mb-2"
        >
          {showPrecisionControls ? 'Esconder Controles de Precisão' : 'Mostrar Controles de Precisão'}
        </Button>
        
        {showPrecisionControls && !isMarkupMode && (
          <div className="space-y-4 p-4 border rounded-md">
            <div>
              <h4 className="text-sm font-medium mb-2">Zoom</h4>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">1x</span>
                <Slider
                  value={[zoomLevel]}
                  onValueChange={(value) => setZoomLevel(value[0])}
                  min={1}
                  max={2}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">2x</span>
              </div>
            </div>
            
            {!useManualCircle && (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-2">Ajuste Fino da Posição</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div />
                    <Button size="sm" variant="outline" onClick={() => moveRegion('up')}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <div />
                    
                    <Button size="sm" variant="outline" onClick={() => moveRegion('left')}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Move className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => moveRegion('right')}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    
                    <div />
                    <Button size="sm" variant="outline" onClick={() => moveRegion('down')}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <div />
                  </div>
                </div>
                
                {selectedRegion?.type === 'rectangle' && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Ajuste de Tamanho</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" onClick={() => adjustSelectedRegion('left', 5)}>
                        <span className="mr-1">←</span> Reduzir Largura
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => adjustSelectedRegion('right', 5)}>
                        Aumentar Largura <span className="ml-1">→</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => adjustSelectedRegion('up', 5)}>
                        <span className="mr-1">↑</span> Reduzir Altura
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => adjustSelectedRegion('down', 5)}>
                        Aumentar Altura <span className="ml-1">↓</span>
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedRegion?.type === 'circle' && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Ajuste do Raio</h4>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => adjustRadius(-5)}>
                        Reduzir Raio
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => adjustRadius(5)}>
                        Aumentar Raio
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
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
