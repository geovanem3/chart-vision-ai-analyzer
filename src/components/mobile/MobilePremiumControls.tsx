
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Zap, 
  Eye, 
  Settings, 
  Sparkles,
  Target,
  Activity,
  Layers
} from 'lucide-react';

interface MobilePremiumControlsProps {
  onARToggle: (enabled: boolean) => void;
  onPremiumMode: (enabled: boolean) => void;
  onIntensityChange: (intensity: number) => void;
  arEnabled?: boolean;
  premiumEnabled?: boolean;
  intensity?: number;
}

const MobilePremiumControls: React.FC<MobilePremiumControlsProps> = ({
  onARToggle,
  onPremiumMode,
  onIntensityChange,
  arEnabled = true,
  premiumEnabled = true,
  intensity = 0.5
}) => {
  const [showControls, setShowControls] = useState(false);

  // Feedback háptico para dispositivos móveis
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate([50, 50, 50]);
          break;
      }
    }
  };

  const handleARToggle = () => {
    triggerHapticFeedback('medium');
    onARToggle(!arEnabled);
  };

  const handlePremiumToggle = () => {
    triggerHapticFeedback('heavy');
    onPremiumMode(!premiumEnabled);
  };

  const handleIntensityChange = (newIntensity: number) => {
    triggerHapticFeedback('light');
    onIntensityChange(newIntensity);
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Botão principal */}
      <motion.div
        className="relative"
        animate={{ 
          scale: showControls ? 0.9 : 1,
          rotate: showControls ? 45 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Button
          onClick={() => {
            triggerHapticFeedback('medium');
            setShowControls(!showControls);
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl"
          size="icon"
        >
          <motion.div
            animate={{ rotate: showControls ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>
        </Button>
        
        {/* Efeito de brilho */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/50 to-blue-400/50"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Controles expandidos */}
      <motion.div
        className="absolute bottom-16 right-0 space-y-3"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ 
          opacity: showControls ? 1 : 0,
          scale: showControls ? 1 : 0.8,
          y: showControls ? 0 : 20
        }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 25,
          staggerChildren: 0.1
        }}
        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
      >
        {/* AR Toggle */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ 
            x: showControls ? 0 : 50,
            opacity: showControls ? 1 : 0
          }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={handleARToggle}
            variant={arEnabled ? "default" : "outline"}
            className={`w-12 h-12 rounded-full ${
              arEnabled 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/50' 
                : 'bg-gray-600 hover:bg-gray-700'
            } shadow-xl`}
            size="icon"
          >
            <Eye className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Premium Mode Toggle */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ 
            x: showControls ? 0 : 50,
            opacity: showControls ? 1 : 0
          }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handlePremiumToggle}
            variant={premiumEnabled ? "default" : "outline"}
            className={`w-12 h-12 rounded-full ${
              premiumEnabled 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/50' 
                : 'bg-gray-600 hover:bg-gray-700'
            } shadow-xl`}
            size="icon"
          >
            <Zap className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Intensity Control */}
        <motion.div
          className="bg-black/80 backdrop-blur-md rounded-2xl p-3 border border-white/20"
          initial={{ x: 50, opacity: 0 }}
          animate={{ 
            x: showControls ? 0 : 50,
            opacity: showControls ? 1 : 0
          }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-white text-xs mb-2 text-center">Intensidade</div>
          <div className="flex flex-col space-y-2">
            {[0.2, 0.5, 0.8].map((level, index) => (
              <motion.button
                key={level}
                onClick={() => handleIntensityChange(level)}
                className={`w-8 h-2 rounded-full transition-all ${
                  Math.abs(intensity - level) < 0.1
                    ? 'bg-gradient-to-r from-blue-400 to-purple-400'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="flex space-x-2"
          initial={{ x: 50, opacity: 0 }}
          animate={{ 
            x: showControls ? 0 : 50,
            opacity: showControls ? 1 : 0
          }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={() => {
              triggerHapticFeedback('light');
              // Trigger focus mode
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/50 shadow-xl"
            size="icon"
          >
            <Target className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => {
              triggerHapticFeedback('light');
              // Trigger analysis boost
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 shadow-pink-500/50 shadow-xl"
            size="icon"
          >
            <Activity className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
        onClick={() => {
          triggerHapticFeedback('light');
          setShowControls(false);
        }}
      />
    </div>
  );
};

export default MobilePremiumControls;
