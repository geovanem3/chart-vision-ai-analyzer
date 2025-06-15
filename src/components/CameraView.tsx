
import React from 'react';
import { motion } from 'framer-motion';
import LiveAnalysis from './LiveAnalysis';
import AutoCaptureControls from './AutoCaptureControls';

const CameraView = () => {
  return (
    <motion.div 
      className="w-full space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Sistema de Captura Automática */}
      <AutoCaptureControls />
      
      {/* Análise Manual (modo tradicional) */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-3 text-muted-foreground">
          Análise Manual (Modo Tradicional)
        </h3>
        <LiveAnalysis />
      </div>
    </motion.div>
  );
};

export default CameraView;

