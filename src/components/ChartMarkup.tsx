
import React, { useRef, useEffect, useState } from 'react';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { TechnicalElement, Point } from '@/context/AnalyzerContext';

interface ChartMarkupProps {
  imageWidth: number;
  imageHeight: number;
}

const ChartMarkup: React.FC<ChartMarkupProps> = ({ imageWidth, imageHeight }) => {
  const { analysisResults, showTechnicalMarkup, markupSize, manualMarkups, isMarkupMode } = useAnalyzer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState<Point | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Garantir que o canvas tenha o tamanho correto da imagem
    canvas.width = imageWidth;
    canvas.height = imageHeight;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calcular fator de escala baseado no tamanho da imagem e na preferência do usuário
    let baseScaleFactor = Math.min(imageWidth, imageHeight) / 600;
    
    // Ajustar o fator de escala com base na preferência do usuário
    switch (markupSize) {
      case 'small':
        baseScaleFactor *= 0.7;
        break;
      case 'large':
        baseScaleFactor *= 1.3;
        break;
      default: // 'medium'
        // Manter o valor base
        break;
    }

    // Desenhar marcações manuais
    manualMarkups.forEach(element => {
      drawElement(ctx, element, baseScaleFactor);
    });

    // Desenhar elementos técnicos da análise de resultados
    if (analysisResults?.technicalElements && showTechnicalMarkup) {
      analysisResults.technicalElements.forEach(element => {
        drawElement(ctx, element, baseScaleFactor);
      });
    }

    // Desenhar candles se disponíveis
    if (analysisResults?.candles && showTechnicalMarkup) {
      drawCandles(ctx, analysisResults.candles);
    }

  }, [analysisResults, showTechnicalMarkup, imageWidth, imageHeight, markupSize, manualMarkups]);

  // Funções de manipulação para marcações manuais
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMarkupMode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setLastPosition({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isMarkupMode || !lastPosition) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Desenhar temporariamente no canvas (será atualizado na próxima renderização)
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Usar escala atual
    const baseScaleFactor = Math.min(imageWidth, imageHeight) / 600;
    
    // Desenhar linha temporária
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.lineWidth = 2 * baseScaleFactor;
    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isMarkupMode || !lastPosition) {
      setIsDragging(false);
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const { addManualMarkup, manualMarkupTool } = useAnalyzer();
    
    // Criar elemento baseado na ferramenta selecionada
    if (manualMarkupTool === 'line') {
      addManualMarkup({
        type: 'line',
        points: [lastPosition, { x, y }],
        color: '#ff8800',
        thickness: 2
      });
    } else if (manualMarkupTool === 'arrow') {
      addManualMarkup({
        type: 'arrow',
        start: lastPosition,
        end: { x, y },
        color: '#ff8800',
        thickness: 2
      });
    } else if (manualMarkupTool === 'rectangle') {
      const width = x - lastPosition.x;
      const height = y - lastPosition.y;
      addManualMarkup({
        type: 'rectangle',
        position: lastPosition,
        width,
        height,
        color: '#ff8800',
        thickness: 2
      });
    } else if (manualMarkupTool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(x - lastPosition.x, 2) + Math.pow(y - lastPosition.y, 2)
      );
      addManualMarkup({
        type: 'circle',
        center: lastPosition,
        radius,
        color: '#ff8800',
        thickness: 2
      });
    } else if (manualMarkupTool === 'label') {
      const text = prompt('Digite o texto para o rótulo:') || 'Rótulo';
      addManualMarkup({
        type: 'label',
        position: { x, y },
        text,
        color: '#ff8800',
        backgroundColor: 'rgba(0,0,0,0.7)'
      });
    } else if (manualMarkupTool === 'trendline') {
      addManualMarkup({
        type: 'pattern',
        patternType: 'trendline',
        points: [lastPosition, { x, y }],
        color: '#ff8800',
        thickness: 2,
        label: 'Tendência'
      });
    } else if (manualMarkupTool === 'eliotwave') {
      // Simplificado - na prática precisaria de múltiplos pontos
      addManualMarkup({
        type: 'pattern',
        patternType: 'eliotwave',
        points: [lastPosition, { x, y }],
        color: '#ff8800',
        thickness: 2,
        label: 'Onda de Elliott'
      });
    } else if (manualMarkupTool === 'dowtheory') {
      addManualMarkup({
        type: 'pattern',
        patternType: 'dowtheory',
        points: [lastPosition, { x, y }],
        color: '#ff8800',
        thickness: 2,
        label: 'Teoria de Dow'
      });
    }
    
    setIsDragging(false);
    setLastPosition(null);
  };

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

    // Desenhar rótulo se presente
    if (element.label) {
      let labelPosition: Point;
      
      if (element.type === 'line' && element.points.length > 1) {
        // Para linhas, colocar rótulo perto do ponto médio
        const midIndex = Math.floor(element.points.length / 2);
        labelPosition = {
          x: element.points[midIndex].x,
          y: element.points[midIndex].y - 10 * scale
        };
      } else if (element.type === 'arrow') {
        // Para setas, colocar rótulo perto do final
        labelPosition = {
          x: element.end.x + 5 * scale,
          y: element.end.y - 5 * scale
        };
      } else if (element.type === 'rectangle') {
        // Para retângulos, colocar rótulo acima
        labelPosition = {
          x: element.position.x + element.width / 2,
          y: element.position.y - 5 * scale
        };
      } else if (element.type === 'circle') {
        // Para círculos, colocar rótulo acima
        labelPosition = {
          x: element.center.x,
          y: element.center.y - element.radius - 5 * scale
        };
      } else if (element.type === 'pattern') {
        // Para padrões, colocar o rótulo no centro dos pontos
        const centerX = element.points.reduce((sum, p) => sum + p.x, 0) / element.points.length;
        const centerY = element.points.reduce((sum, p) => sum + p.y, 0) / element.points.length;
        labelPosition = { x: centerX, y: centerY - 15 * scale };
      } else {
        // Posição padrão
        labelPosition = { x: 10, y: 10 };
      }
      
      drawText(ctx, labelPosition, element.label, element.color, scale);
    }
    
    ctx.restore();
  };

  const drawCandles = (ctx: CanvasRenderingContext2D, candles: any[]) => {
    candles.forEach(candle => {
      ctx.fillStyle = candle.color === 'verde' ? 'green' : 'red';
      ctx.strokeStyle = candle.color === 'verde' ? 'green' : 'red';
      
      // Desenhar corpo do candle
      ctx.fillRect(candle.position.x, candle.position.y, candle.width, candle.height);
      
      // Desenhar pavio superior e inferior se houver
      if (candle.high && candle.low) {
        ctx.beginPath();
        // Pavio superior
        ctx.moveTo(candle.position.x + candle.width / 2, candle.position.y);
        ctx.lineTo(candle.position.x + candle.width / 2, candle.high);
        // Pavio inferior
        ctx.moveTo(candle.position.x + candle.width / 2, candle.position.y + candle.height);
        ctx.lineTo(candle.position.x + candle.width / 2, candle.low);
        ctx.stroke();
      }
    });
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
    
    // Desenhar a linha
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Desenhar a ponta da seta
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
    } else if (patternType === 'eliotwave') {
      // Destaque para as ondas de Elliott
      // Adicionar pontos de numeração das ondas
      for (let i = 0; i < points.length; i++) {
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 3 * scale, 0, 2 * Math.PI);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        
        // Adicionar número da onda
        const waveNumber = (i % 5) + 1;
        drawText(ctx, {
          x: points[i].x + 8 * scale,
          y: points[i].y - 8 * scale
        }, waveNumber.toString(), ctx.strokeStyle, scale);
      }
    } else if (patternType === 'dowtheory') {
      // Adicionar indicações visuais para tendências primárias/secundárias
      if (points.length >= 2) {
        // Desenhar pontos de confirmação
        for (let i = 0; i < points.length; i++) {
          ctx.beginPath();
          ctx.arc(points[i].x, points[i].y, 4 * scale, 0, 2 * Math.PI);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
      }
    } else if (patternType === 'trendline') {
      // Para as linhas de tendência, adicionar setas para indicar direção
      if (points.length >= 2) {
        const start = points[0];
        const end = points[points.length - 1];
        
        // Calcular ângulo para possível extensão
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        
        // Estender ligeiramente a linha para a direita
        const extension = 20 * scale;
        const extendedX = end.x + extension * Math.cos(angle);
        const extendedY = end.y + extension * Math.sin(angle);
        
        // Desenhar a extensão como uma linha pontilhada
        ctx.beginPath();
        ctx.setLineDash([3 * scale, 3 * scale]);
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(extendedX, extendedY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Adicionar uma pequena seta na extensão
        const arrowSize = 6 * scale;
        ctx.beginPath();
        ctx.moveTo(extendedX, extendedY);
        ctx.lineTo(
          extendedX - arrowSize * Math.cos(angle - Math.PI / 6),
          extendedY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          extendedX - arrowSize * Math.cos(angle + Math.PI / 6),
          extendedY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }
    }
  };

  const drawLabel = (ctx: CanvasRenderingContext2D, position: Point, text: string, backgroundColor?: string) => {
    // Desenhar fundo se fornecido
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
    
    drawText(ctx, position, text, typeof ctx.strokeStyle === 'string' ? ctx.strokeStyle : '#000000', 1);
  };

  const drawText = (ctx: CanvasRenderingContext2D, position: Point, text: string, color: string, scale: number) => {
    // Ajustar tamanho da fonte com base na escala e no tamanho das marcações
    let fontSize = 12;
    switch (markupSize) {
      case 'small':
        fontSize = 10;
        break;
      case 'large':
        fontSize = 14;
        break;
      default: // 'medium'
        fontSize = 12;
        break;
    }
    
    fontSize = Math.max(8, Math.min(16, fontSize * scale));
    
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(text, position.x, position.y);
  };

  // Se não há marcações para exibir, retornar null
  if ((!showTechnicalMarkup || !analysisResults?.technicalElements) && manualMarkups.length === 0 && !isMarkupMode) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={imageWidth}
      height={imageHeight}
      className={`absolute inset-0 ${isMarkupMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsDragging(false)}
    />
  );
};

export default ChartMarkup;
