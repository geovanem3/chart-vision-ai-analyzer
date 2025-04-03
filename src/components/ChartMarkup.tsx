
import React, { useRef, useEffect } from 'react';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { TechnicalElement, Point } from '@/context/AnalyzerContext';

interface ChartMarkupProps {
  imageWidth: number;
  imageHeight: number;
}

const ChartMarkup: React.FC<ChartMarkupProps> = ({ imageWidth, imageHeight }) => {
  const { analysisResults, showTechnicalMarkup } = useAnalyzer();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !analysisResults?.technicalElements || !showTechnicalMarkup) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calcular fator de escala baseado no tamanho da imagem
    // Quanto menor a imagem, menores devem ser as marcações
    const scaleFactor = Math.min(imageWidth, imageHeight) / 500;

    // Draw each technical element with appropriate scaling
    analysisResults.technicalElements.forEach(element => {
      drawElement(ctx, element, scaleFactor);
    });

  }, [analysisResults, showTechnicalMarkup, imageWidth, imageHeight]);

  const drawElement = (ctx: CanvasRenderingContext2D, element: TechnicalElement, scale: number) => {
    ctx.save();
    ctx.strokeStyle = element.color;
    ctx.lineWidth = (element.thickness || 1) * Math.max(0.5, scale);
    
    if (element.dashArray) {
      ctx.setLineDash(element.dashArray.map(v => v * scale));
    }

    switch (element.type) {
      case 'line':
        drawLine(ctx, element.points);
        break;
      case 'arrow':
        drawArrow(ctx, element.start, element.end, scale);
        break;
      case 'rectangle':
        drawRectangle(ctx, element.position, element.width, element.height);
        break;
      case 'circle':
        drawCircle(ctx, element.center, element.radius * scale);
        break;
      case 'label':
        drawLabel(ctx, element.position, element.text, element.backgroundColor);
        break;
      case 'pattern':
        drawPattern(ctx, element.patternType, element.points, scale);
        break;
    }

    // Draw label if present
    if (element.label) {
      let labelPosition: Point;
      
      if (element.type === 'line' && element.points.length > 1) {
        // For lines, place label near the middle point
        const midIndex = Math.floor(element.points.length / 2);
        labelPosition = {
          x: element.points[midIndex].x,
          y: element.points[midIndex].y - 10 * scale
        };
      } else if (element.type === 'arrow') {
        // For arrows, place label near the end
        labelPosition = {
          x: element.end.x + 5 * scale,
          y: element.end.y - 5 * scale
        };
      } else if (element.type === 'rectangle') {
        // For rectangles, place label above
        labelPosition = {
          x: element.position.x + element.width / 2,
          y: element.position.y - 5 * scale
        };
      } else if (element.type === 'circle') {
        // For circles, place label above
        labelPosition = {
          x: element.center.x,
          y: element.center.y - element.radius - 5 * scale
        };
      } else if (element.type === 'pattern') {
        // Para padrões, colocar o label no centro dos pontos
        const centerX = element.points.reduce((sum, p) => sum + p.x, 0) / element.points.length;
        const centerY = element.points.reduce((sum, p) => sum + p.y, 0) / element.points.length;
        labelPosition = { x: centerX, y: centerY - 15 * scale };
      } else {
        // Default position
        labelPosition = { x: 10, y: 10 };
      }
      
      // Fix: Pass element.color directly instead of ctx.strokeStyle
      drawText(ctx, labelPosition, element.label, element.color, scale);
    }
    
    ctx.restore();
  };

  const drawLine = (ctx: CanvasRenderingContext2D, points: Point[]) => {
    if (points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, start: Point, end: Point, scale: number) => {
    const headLength = 10 * scale;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    // Draw the line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Draw the arrow head
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  const drawRectangle = (ctx: CanvasRenderingContext2D, position: Point, width: number, height: number) => {
    ctx.beginPath();
    ctx.rect(position.x, position.y, width, height);
    ctx.stroke();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, center: Point, radius: number) => {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawPattern = (ctx: CanvasRenderingContext2D, patternType: string, points: Point[], scale: number) => {
    // Desenho específico baseado no tipo de padrão
    ctx.beginPath();
    
    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      // Para padrões fechados
      if (['triangulo', 'bandeira'].includes(patternType)) {
        ctx.closePath();
      }
    }
    
    ctx.stroke();
    
    // Adicionar detalhes específicos para cada tipo de padrão
    if (patternType === 'OCO') {
      // Adicionar linha do pescoço para OCO
      if (points.length >= 5) {
        const necklineY = Math.max(points[1].y, points[3].y);
        ctx.beginPath();
        ctx.setLineDash([5 * scale, 5 * scale]);
        ctx.moveTo(points[0].x, necklineY);
        ctx.lineTo(points[4].x, necklineY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };

  const drawLabel = (ctx: CanvasRenderingContext2D, position: Point, text: string, backgroundColor?: string) => {
    // Draw background if provided
    if (backgroundColor) {
      ctx.save();
      ctx.fillStyle = backgroundColor || 'rgba(0, 0, 0, 0.7)';
      
      const textMetrics = ctx.measureText(text);
      const padding = 4;
      
      ctx.beginPath();
      ctx.rect(
        position.x - padding,
        position.y - 12 - padding,
        textMetrics.width + padding * 2,
        16 + padding * 2
      );
      ctx.fill();
      ctx.restore();
    }
    
    // Fix: Use a string color instead of ctx.strokeStyle
    drawText(ctx, position, text, typeof ctx.strokeStyle === 'string' ? ctx.strokeStyle : '#000000', 1);
  };

  const drawText = (ctx: CanvasRenderingContext2D, position: Point, text: string, color: string, scale: number) => {
    const fontSize = Math.max(10, Math.min(14, 12 * scale));
    
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(text, position.x, position.y);
  };

  if (!showTechnicalMarkup || !analysisResults?.technicalElements) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={imageWidth}
      height={imageHeight}
      className="absolute inset-0 pointer-events-none"
    />
  );
};

export default ChartMarkup;
