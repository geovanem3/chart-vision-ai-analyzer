
import React from 'react';
import { useIsMobile, useOrientation } from '@/hooks/use-mobile';
import MobileBottomNavigation from './MobileBottomNavigation';
import { motion } from 'framer-motion';

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  hideNavigation?: boolean;
  className?: string;
}

const MobileLayout = ({ 
  children, 
  activeTab, 
  onTabChange, 
  hideNavigation = false,
  className = ""
}: MobileLayoutProps) => {
  const isMobile = useIsMobile();
  const orientation = useOrientation();

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {/* Main Content Area */}
      <motion.main 
        className={`flex-1 overflow-auto ${!hideNavigation ? 'pb-20' : ''} ${
          orientation === 'landscape' ? 'px-2' : 'px-0'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.main>

      {/* Bottom Navigation */}
      {!hideNavigation && (
        <MobileBottomNavigation 
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
};

export default MobileLayout;
