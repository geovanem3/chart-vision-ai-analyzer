
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Camera, X, FlipHorizontal, Upload, Image } from 'lucide-react';
import { Card } from '@/components/ui/card';

const CameraView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      let errorMessage = 'Failed to access camera. Please check permissions and try again.';
      
      // More specific error messages based on error type
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Câmera bloqueada. Por favor, permita o acesso à câmera nas configurações do seu navegador.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Nenhuma câmera foi encontrada no seu dispositivo.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Não foi possível acessar a câmera. Ela pode estar sendo usada por outro aplicativo.';
        }
      }
      
      setCameraError(errorMessage);
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

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setCameraError('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      if (imageUrl) {
        setCapturedImage(imageUrl);
      }
    };
    reader.onerror = () => {
      setCameraError('Erro ao ler o arquivo. Por favor, tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
              <div className="flex gap-4 justify-center">
                <Button onClick={startCamera}>Tentar Novamente</Button>
                <Button variant="outline" onClick={triggerFileUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  Carregar Imagem
                </Button>
              </div>
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
          <div className="flex gap-4">
            <Button onClick={startCamera} className="gap-2">
              <Camera className="w-4 h-4" />
              <span>Iniciar Câmera</span>
            </Button>
            
            <Button variant="outline" onClick={triggerFileUpload} className="gap-2">
              <Image className="w-4 h-4" />
              <span>Carregar Imagem</span>
            </Button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Alternative option card when camera isn't available */}
      {cameraError && (
        <Card className="p-4 mt-6 text-center">
          <h3 className="text-lg font-medium mb-2">Exemplos de Gráficos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Você também pode usar um gráfico de exemplo para testar a análise.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => setCapturedImage('/chart-example-1.jpg')} className="h-auto p-2">
              <div className="flex flex-col items-center">
                <span className="text-sm mb-1">Gráfico de Velas</span>
                <div className="w-full h-24 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Exemplo 1</span>
                </div>
              </div>
            </Button>
            <Button variant="outline" onClick={() => setCapturedImage('/chart-example-2.jpg')} className="h-auto p-2">
              <div className="flex flex-col items-center">
                <span className="text-sm mb-1">Gráfico de Linha</span>
                <div className="w-full h-24 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Exemplo 2</span>
                </div>
              </div>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CameraView;
