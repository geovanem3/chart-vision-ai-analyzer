
import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface MobileTouchZoomProps {
  children: React.ReactNode;
  maxZoom?: number;
  minZoom?: number;
  className?: string;
  onZoomChange?: (scale: number) => void;
}

const MobileTouchZoom = ({ 
  children, 
  maxZoom = 3, 
  minZoom = 0.5, 
  className = "",
  onZoomChange 
}: MobileTouchZoomProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const lastTouchDistance = useRef<number>(0);
  const lastTouchCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate distance between two touch points
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Calculate center point between touches
  const getTouchCenter = (touches: TouchList) => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    if (touches.length >= 2) {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
      };
    }
    return { x: 0, y: 0 };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      lastTouchCenter.current = getTouchCenter(e.touches);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      lastTouchDistance.current = getTouchDistance(e.touches);
      lastTouchCenter.current = getTouchCenter(e.touches);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch zoom
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      
      if (lastTouchDistance.current > 0) {
        const scaleChange = distance / lastTouchDistance.current;
        const newScale = Math.max(minZoom, Math.min(maxZoom, scale * scaleChange));
        
        setScale(newScale);
        onZoomChange?.(newScale);
      }
      
      lastTouchDistance.current = distance;
      lastTouchCenter.current = center;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Pan when zoomed
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouchCenter.current.x;
      const deltaY = touch.clientY - lastTouchCenter.current.y;
      
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      lastTouchCenter.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [scale, isDragging, minZoom, maxZoom, onZoomChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchDistance.current = 0;
  }, []);

  // Double tap to zoom
  const handleDoubleClick = useCallback(() => {
    if (scale === 1) {
      setScale(2);
      onZoomChange?.(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      onZoomChange?.(1);
    }
  }, [scale, onZoomChange]);

  return (
    <div 
      className={`relative overflow-hidden touch-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      <motion.div
        style={{
          scale,
          x: position.x,
          y: position.y,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="origin-center"
      >
        {children}
      </motion.div>
      
      {/* Zoom indicator */}
      {scale !== 1 && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm z-10">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
};

export default MobileTouchZoom;
