
import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Camera, 
  X, 
  FlipHorizontal, 
  Upload, 
  Image, 
  Zap,
  Focus,
  Sun,
  Grid3x3
} from 'lucide-react';

interface MobileCameraControlsProps {
  isCameraActive: boolean;
  isProcessing: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCaptureImage: () => void;
  onToggleFacing: () => void;
  onFileUpload: () => void;
  onToggleFlash?: () => void;
  onToggleGrid?: () => void;
  onFocusMode?: () => void;
  flashEnabled?: boolean;
  gridEnabled?: boolean;
  focusMode?: 'auto' | 'manual';
}

const MobileCameraControls = ({
  isCameraActive,
  isProcessing,
  onStartCamera,
  onStopCamera,
  onCaptureImage,
  onToggleFacing,
  onFileUpload,
  onToggleFlash,
  onToggleGrid,
  onFocusMode,
  flashEnabled = false,
  gridEnabled = false,
  focusMode = 'auto'
}: MobileCameraControlsProps) => {

  if (!isCameraActive) {
    return (
      <motion.div 
        className="flex gap-3 justify-center w-full px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button 
          onClick={onStartCamera} 
          className="gap-2 flex-1 h-14 text-lg font-semibold rounded-2xl" 
          disabled={isProcessing}
        >
          <Camera className="w-6 h-6" />
          <span>Abrir Câmera</span>
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onFileUpload} 
          className="gap-2 flex-1 h-14 text-lg font-semibold rounded-2xl" 
          disabled={isProcessing}
        >
          <Image className="w-6 h-6" />
          <span>Galeria</span>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex items-center justify-between w-full px-6 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left Controls */}
      <div className="flex flex-col gap-3">
        {onToggleFlash && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFlash}
            className={`w-12 h-12 rounded-full ${flashEnabled ? 'bg-yellow-500/20 text-yellow-500' : 'bg-black/20 text-white'}`}
            disabled={isProcessing}
          >
            <Sun className="w-6 h-6" />
          </Button>
        )}
        
        {onToggleGrid && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleGrid}
            className={`w-12 h-12 rounded-full ${gridEnabled ? 'bg-blue-500/20 text-blue-500' : 'bg-black/20 text-white'}`}
            disabled={isProcessing}
          >
            <Grid3x3 className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* Center - Capture Button */}
      <motion.div
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
      >
        <Button
          onClick={onCaptureImage}
          className="w-20 h-20 rounded-full p-0 bg-white hover:bg-gray-100 relative"
          disabled={isProcessing}
        >
          <div className="w-16 h-16 rounded-full border-4 border-gray-800 bg-white relative">
            {isProcessing && (
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
            )}
          </div>
        </Button>
      </motion.div>

      {/* Right Controls */}
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFacing}
          className="w-12 h-12 rounded-full bg-black/20 text-white hover:bg-black/30"
          disabled={isProcessing}
        >
          <FlipHorizontal className="w-6 h-6" />
        </Button>
        
        {onFocusMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onFocusMode}
            className={`w-12 h-12 rounded-full ${focusMode === 'manual' ? 'bg-green-500/20 text-green-500' : 'bg-black/20 text-white'}`}
            disabled={isProcessing}
          >
            <Focus className="w-6 h-6" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onStopCamera}
          className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30"
          disabled={isProcessing}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
    </motion.div>
  );
};

export default MobileCameraControls;
