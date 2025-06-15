
import React from 'react';
import CameraView from './CameraView';
import MobileBottomBar from './MobileBottomBar';
import { useIsMobile } from '@/hooks/use-mobile';

const GraphAnalyzer = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`w-full ${isMobile ? 'px-1' : 'max-w-4xl'} mx-auto overflow-hidden`}>
      <CameraView />
      <MobileBottomBar />
    </div>
  );
};

export default GraphAnalyzer;
