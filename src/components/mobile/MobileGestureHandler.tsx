
import React, { useRef, useState, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileGestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPinchZoom?: (scale: number) => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  className?: string;
}

const MobileGestureHandler = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onPinchZoom,
  onDoubleTap,
  onLongPress,
  className = ""
}: MobileGestureHandlerProps) => {
  const isMobile = useIsMobile();
  const [lastTap, setLastTap] = useState(0);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();

  // Handle swipe gestures
  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Swipe threshold
    const swipeThreshold = 50;
    const velocityThreshold = 300;
    
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
      if (offset.x > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (offset.x < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
  }, [onSwipeLeft, onSwipeRight]);

  // Handle double tap
  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY && onDoubleTap) {
      onDoubleTap();
    }
    setLastTap(now);
  }, [lastTap, onDoubleTap]);

  // Handle long press
  const handleTouchStart = useCallback(() => {
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true);
        onLongPress();
      }, 800);
    }
  }, [onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsLongPressing(false);
  }, []);

  // Handle pinch zoom (touch events)
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && onPinchZoom) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // Convert distance to scale (you might want to adjust this logic)
      const scale = distance / 100;
      onPinchZoom(Math.max(0.5, Math.min(3, scale)));
    }
  }, [onPinchZoom]);

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={`${className} ${isLongPressing ? 'bg-primary/10' : ''}`}
      drag={false}
      onPanEnd={handlePanEnd}
      onTap={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

export default MobileGestureHandler;
