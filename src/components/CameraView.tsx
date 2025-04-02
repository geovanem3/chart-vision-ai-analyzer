
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Camera, X, FlipHorizontal } from 'lucide-react';

const CameraView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { setCapturedImage } = useAnalyzer();

  // Start camera stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }
      
      const constraints = {
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Failed to access camera. Please check permissions and try again.');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // Toggle camera facing mode
  const toggleCameraFacing = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Capture image from video
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const imageUrl = canvas.toDataURL('image/jpeg');
          setCapturedImage(imageUrl);
          stopCamera();
        } catch (error) {
          console.error('Error capturing image:', error);
          setCameraError('Failed to capture image. Please try again.');
        }
      }
    }
  };

  // Start camera when facing mode changes
  useEffect(() => {
    if (!isCameraActive) {
      startCamera();
    }
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-xl aspect-video bg-black">
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4">
            <div className="text-center">
              <p className="text-destructive mb-4">{cameraError}</p>
              <Button onClick={startCamera}>Retry</Button>
            </div>
          </div>
        )}
        
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted 
          className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
        />
        
        <canvas 
          ref={canvasRef} 
          className="hidden" 
        />
      </div>
      
      <div className="flex items-center gap-4 mt-4">
        {isCameraActive ? (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleCameraFacing}
              className="rounded-full"
            >
              <FlipHorizontal className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={captureImage}
              className="rounded-full w-16 h-16 p-0"
            >
              <div className="w-12 h-12 rounded-full border-2 border-white" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={stopCamera}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button onClick={startCamera} className="gap-2">
            <Camera className="w-4 h-4" />
            <span>Start Camera</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraView;
