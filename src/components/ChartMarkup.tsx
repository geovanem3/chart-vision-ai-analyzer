
import React from 'react';
import { useAnalyzer, TechnicalElement, Point } from '@/context/AnalyzerContext';

type ChartMarkupProps = {
  imageWidth: number;
  imageHeight: number;
  scale?: number;
};

const ChartMarkup: React.FC<ChartMarkupProps> = ({ 
  imageWidth, 
  imageHeight,
  scale = 1
}) => {
  const { 
    showTechnicalMarkup, 
    analysisResults, 
    markupSize,
    manualMarkups
  } = useAnalyzer();
  
  if (!showTechnicalMarkup || !analysisResults) return null;
  
  const getSizeMultiplier = () => {
    switch (markupSize) {
      case 'small': return 0.7;
      case 'large': return 1.3;
      default: return 1;
    }
  };
  
  const sizeMultiplier = getSizeMultiplier();
  
  // Combine detected elements with manual markups
  const allElements = [
    ...(analysisResults.technicalElements || []),
    ...manualMarkups
  ];

  // Debug - log candle data if present
  if (analysisResults.candles && analysisResults.candles.length > 0) {
    console.log('Detected candles:', analysisResults.candles.length, analysisResults.candles[0]);
  }
  
  // Apply proportional scaling to coordinates
  const scalePoint = (point: Point): Point => {
    return {
      x: point.x,
      y: point.y
    };
  };

  // Debug log to ensure elements are being properly passed
  console.log('Rendering chart markup with elements:', allElements);
  console.log('Market context:', analysisResults.marketContext);
  
  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      preserveAspectRatio="none"
    >
      {/* Render detected candles if available */}
      {analysisResults.candles && analysisResults.candles.map((candle, idx) => (
        <g key={`candle-${idx}`}>
          <rect
            x={candle.position.x - (candle.width / 2)}
            y={candle.position.y - (candle.height / 2)}
            width={candle.width}
            height={candle.height}
            fill={candle.color === 'verde' ? 'rgba(0, 128, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)'}
            stroke={candle.color === 'verde' ? 'green' : 'red'}
            strokeWidth={1 * scale}
          />
        </g>
      ))}

      {/* Render all technical elements */}
      {allElements.map((element, index) => {
        // Apply scaling to element dimensions
        const scaledThickness = ((element.thickness || 2) * sizeMultiplier * scale);
        
        switch (element.type) {
          case 'line':
            return (
              <polyline
                key={`line-${index}`}
                points={element.points.map(p => `${scalePoint(p).x},${scalePoint(p).y}`).join(' ')}
                stroke={element.color}
                strokeWidth={scaledThickness}
                strokeDasharray={element.dashArray?.join(' ')}
                fill="none"
              />
            );
          case 'arrow':
            const start = scalePoint(element.start);
            const end = scalePoint(element.end);
            
            // Calculate the angle for the arrowhead
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const arrowLength = 10 * sizeMultiplier * scale; // Scale the arrowhead size
            
            // Calculate arrowhead points
            const arrowPoint1 = {
              x: end.x - arrowLength * Math.cos(angle - Math.PI / 6),
              y: end.y - arrowLength * Math.sin(angle - Math.PI / 6)
            };
            const arrowPoint2 = {
              x: end.x - arrowLength * Math.cos(angle + Math.PI / 6),
              y: end.y - arrowLength * Math.sin(angle + Math.PI / 6)
            };
            
            return (
              <g key={`arrow-${index}`}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={element.color}
                  strokeWidth={scaledThickness}
                  strokeDasharray={element.dashArray?.join(' ')}
                />
                <polygon
                  points={`${end.x},${end.y} ${arrowPoint1.x},${arrowPoint1.y} ${arrowPoint2.x},${arrowPoint2.y}`}
                  fill={element.color}
                />
              </g>
            );
          case 'rectangle':
            const pos = scalePoint(element.position);
            const scaledWidth = element.width * scale;
            const scaledHeight = element.height * scale;
            
            return (
              <rect
                key={`rect-${index}`}
                x={pos.x - (scaledWidth / 2)}
                y={pos.y - (scaledHeight / 2)}
                width={scaledWidth}
                height={scaledHeight}
                stroke={element.color}
                strokeWidth={scaledThickness}
                strokeDasharray={element.dashArray?.join(' ')}
                fill={element.backgroundColor || "none"}
                fillOpacity={element.backgroundColor ? 0.2 : 0}
              />
            );
          case 'circle':
            const center = scalePoint(element.center);
            const scaledRadius = element.radius * scale;
            
            return (
              <circle
                key={`circle-${index}`}
                cx={center.x}
                cy={center.y}
                r={scaledRadius}
                stroke={element.color}
                strokeWidth={scaledThickness}
                strokeDasharray={element.dashArray?.join(' ')}
                fill={element.backgroundColor || "none"}
                fillOpacity={element.backgroundColor ? 0.2 : 0}
              />
            );
          case 'label':
            const labelPos = scalePoint(element.position);
            const fontSize = 14 * sizeMultiplier * scale;
            
            // Create a text element with a background rectangle
            const text = element.text;
            const estimatedTextWidth = text.length * (fontSize * 0.6);
            const textHeight = fontSize * 1.2;
            
            return (
              <g key={`label-${index}`}>
                {element.backgroundColor && (
                  <rect
                    x={labelPos.x}
                    y={labelPos.y - textHeight}
                    width={estimatedTextWidth}
                    height={textHeight}
                    fill={element.backgroundColor}
                    fillOpacity={0.7}
                    rx={3}
                    ry={3}
                  />
                )}
                <text
                  x={labelPos.x + 3}
                  y={labelPos.y - textHeight / 3}
                  fill={element.color}
                  fontSize={fontSize}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {text}
                </text>
              </g>
            );
          case 'pattern':
            // Pattern-specific rendering
            switch (element.patternType) {
              case 'triangulo':
                return (
                  <polygon
                    key={`pattern-${index}`}
                    points={element.points.map(p => `${scalePoint(p).x},${scalePoint(p).y}`).join(' ')}
                    stroke={element.color}
                    strokeWidth={scaledThickness}
                    fill={element.backgroundColor || "none"}
                    fillOpacity={element.backgroundColor ? 0.2 : 0}
                    strokeDasharray={element.dashArray?.join(' ')}
                  />
                );
              case 'OCO':
                // Head and shoulders pattern
                const points = element.points.map(p => scalePoint(p));
                return (
                  <g key={`pattern-${index}`}>
                    <polyline
                      points={points.map(p => `${p.x},${p.y}`).join(' ')}
                      stroke={element.color}
                      strokeWidth={scaledThickness}
                      strokeDasharray={element.dashArray?.join(' ')}
                      fill="none"
                    />
                    {element.label && (
                      <text
                        x={points[Math.floor(points.length / 2)].x}
                        y={points[Math.floor(points.length / 2)].y - 10 * scale}
                        fill={element.color}
                        fontSize={12 * sizeMultiplier * scale}
                        textAnchor="middle"
                      >
                        {element.label}
                      </text>
                    )}
                  </g>
                );
              case 'cunha':
              case 'bandeira':
              case 'topoduplo':
              case 'fundoduplo':
                // Enhanced rendering for these pattern types
                return (
                  <g key={`pattern-${index}`}>
                    <polyline
                      points={element.points.map(p => `${scalePoint(p).x},${scalePoint(p).y}`).join(' ')}
                      stroke={element.color}
                      strokeWidth={scaledThickness}
                      strokeDasharray={element.dashArray?.join(' ')}
                      fill={element.backgroundColor || "none"}
                      fillOpacity={element.backgroundColor ? 0.2 : 0}
                    />
                    <text
                      x={element.points[Math.floor(element.points.length / 2)].x}
                      y={element.points[Math.floor(element.points.length / 2)].y - 15}
                      fill={element.color}
                      fontSize={12 * sizeMultiplier * scale}
                      textAnchor="middle"
                    >
                      {element.patternType}
                    </text>
                  </g>
                );
              case 'eliotwave':
              case 'dowtheory':
              case 'trendline':
                // Enhanced rendering with additional visual cues
                return (
                  <g key={`pattern-${index}`}>
                    <polyline
                      points={element.points.map(p => `${scalePoint(p).x},${scalePoint(p).y}`).join(' ')}
                      stroke={element.color}
                      strokeWidth={scaledThickness}
                      strokeDasharray={element.dashArray?.join(' ')}
                      fill="none"
                    />
                    {/* Add wave numbers or direction indicators */}
                    {element.points.map((point, i) => (
                      <circle
                        key={`point-${i}`}
                        cx={scalePoint(point).x}
                        cy={scalePoint(point).y}
                        r={4 * sizeMultiplier * scale}
                        fill={element.color}
                      />
                    ))}
                    <text
                      x={element.points[0].x}
                      y={element.points[0].y - 10}
                      fill={element.color}
                      fontSize={12 * sizeMultiplier * scale}
                      textAnchor="start"
                    >
                      {element.patternType}
                    </text>
                  </g>
                );
              default:
                return (
                  <polyline
                    key={`pattern-${index}`}
                    points={element.points.map(p => `${scalePoint(p).x},${scalePoint(p).y}`).join(' ')}
                    stroke={element.color}
                    strokeWidth={scaledThickness}
                    strokeDasharray={element.dashArray?.join(' ')}
                    fill="none"
                  />
                );
            }
          default:
            return null;
        }
      })}

      {/* Render market context information if available */}
      {analysisResults.marketContext && (
        <g className="market-context-overlay">
          {/* Market phase indicator */}
          <text
            x={10}
            y={30}
            fill={
              analysisResults.marketContext.phase === 'tendência_alta' ? 'green' :
              analysisResults.marketContext.phase === 'tendência_baixa' ? 'red' : 
              'orange'
            }
            fontSize={16 * sizeMultiplier * scale}
            fontWeight="bold"
          >
            Fase: {analysisResults.marketContext.phase.replace('_', ' ')}
          </text>
          
          {/* Key levels if available */}
          {analysisResults.marketContext.keyLevels && 
            analysisResults.marketContext.keyLevels.map((level, i) => (
              <line
                key={`level-${i}`}
                x1={0}
                y1={level.price}
                x2={imageWidth}
                y2={level.price}
                stroke={level.type === 'suporte' ? 'green' : 'red'}
                strokeWidth={level.strength === 'forte' ? 2 : 1}
                strokeDasharray={level.strength === 'forte' ? 'none' : '5,5'}
                opacity={0.7}
              />
            ))
          }
        </g>
      )}
    </svg>
  );
};

export default ChartMarkup;
