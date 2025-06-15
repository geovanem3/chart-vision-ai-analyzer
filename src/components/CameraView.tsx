
import React from 'react';
import { motion } from 'framer-motion';
import LiveAnalysis from './LiveAnalysis';

const CameraView = () => {
  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <LiveAnalysis />
    </motion.div>
  );
};

export default CameraView;
