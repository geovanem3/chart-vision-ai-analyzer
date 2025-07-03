import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Camera, X, FlipHorizontal, Upload, Image, AlertTriangle, ScanSearch, ScanFace, BarChart2, CandlestickChart, Activity } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { enhanceImageForAnalysis, isImageClearForAnalysis } from '@/utils/imagePreProcessing';
import { checkImageQuality } from '@/utils/imageProcessing';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import LiveAnalysis from './LiveAnalysis';

// Mobile Components
import MobileLayout from './mobile/MobileLayout';
import MobileCameraControls from './mobile/MobileCameraControls';
import MobileGestureHandler from './mobile/MobileGestureHandler';
import MobileTouchZoom from './mobile/MobileTouchZoom';

const CameraView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraAccessAttempted, setCameraAccessAttempted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('photo');
  const isMobile = useIsMobile();

  const { setCapturedImage } = useAnalyzer();
  const { toast } = useToast();

  // Start camera stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraAccessAttempted(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }
      
      const constraints = {
        video: { 
          facingMode,
          width: { ideal: isMobile ? 1920 : 1280 },
          height: { ideal: isMobile ? 1080 : 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        toast({
          variant: "default",
          title: "✓ Câmera Ativada",
          description: "Posicione o gráfico na área de captura.",
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Falha ao acessar a câmera. Verifique as permissões e tente novamente.';
      
      // More specific error messages based on error type
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Câmera bloqueada. Por favor, permita o acesso à câmera nas configurações do seu navegador.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Nenhuma câmera foi encontrada no seu dispositivo.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Não foi possível acessar a câmera. Ela pode estar sendo usada por outro aplicativo ou há um problema com o hardware.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'As configurações solicitadas para a câmera não são suportadas pelo seu dispositivo.';
        } else if (error.name === 'AbortError') {
          errorMessage = 'A operação de acesso à câmera foi cancelada.';
        }
      }
      
      setCameraError(errorMessage);
      toast({
        variant: "destructive",
        title: "✗ Erro na câmera",
        description: errorMessage,
      });
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

  // Capture and process image from video
  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      try {
        setIsProcessing(true);
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Apply basic capture
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          try {
            // Get the basic captured image
            const basicImageUrl = canvas.toDataURL('image/jpeg', 0.95);
            
            // Check if the image is clear enough for analysis
            const clarityCheck = await isImageClearForAnalysis(basicImageUrl);
            
            if (!clarityCheck.isClear) {
              // Image not clear enough, show warning but continue
              toast({
                variant: "default",
                title: "⚠ Imagem com Baixa Qualidade",
                description: clarityCheck.issues.join('. ') + ". Tentando melhorar automaticamente.",
              });
            }
            
            // Enhance the image for better analysis
            const enhancedImageUrl = await enhanceImageForAnalysis(basicImageUrl);
            
            // Check quality of enhanced image
            const qualityCheck = await checkImageQuality(enhancedImageUrl);
            
            setCapturedImage(enhancedImageUrl);
            stopCamera();
            
            if (qualityCheck.isGoodQuality) {
              toast({
                variant: "default",
                title: "✓ Imagem Capturada",
                description: "Imagem processada com sucesso e pronta para análise.",
              });
            } else {
              toast({
                variant: "default",
                title: "⚠ Imagem Processada",
                description: "Imagem capturada, mas a qualidade pode afetar a precisão da análise.",
              });
            }
          } catch (error) {
            console.error('Error processing image:', error);
            setCameraError('Falha ao processar imagem. Por favor, tente novamente.');
            toast({
              variant: "destructive",
              title: "✗ Erro ao processar",
              description: "Falha ao processar imagem. Por favor, tente novamente com melhor iluminação.",
            });
          }
        }
      } catch (error) {
        console.error('Error capturing image:', error);
        setCameraError('Falha ao capturar imagem. Por favor, tente novamente.');
        toast({
          variant: "destructive",
          title: "✗ Erro ao capturar",
          description: "Falha ao capturar imagem. Por favor, tente novamente.",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Handle file upload with processing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      
      if (!file.type.startsWith('image/')) {
        setCameraError('Por favor, selecione um arquivo de imagem válido.');
        toast({
          variant: "destructive",
          title: "✗ Arquivo inválido",
          description: "Por favor, selecione um arquivo de imagem válido.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        if (imageUrl) {
          try {
            // Check image clarity
            const clarityCheck = await isImageClearForAnalysis(imageUrl);
            
            if (!clarityCheck.isClear) {
              // Warn about image quality
              toast({
                variant: "default",
                title: "⚠ Imagem com Baixa Qualidade",
                description: clarityCheck.issues.join('. ') + ". Tentando melhorar automaticamente.",
              });
            }
            
            // Enhance the image
            const enhancedImageUrl = await enhanceImageForAnalysis(imageUrl);
            
            // Check quality of enhanced image
            const qualityCheck = await checkImageQuality(enhancedImageUrl);
            
            setCapturedImage(enhancedImageUrl);
            
            if (qualityCheck.isGoodQuality) {
              toast({
                variant: "default",
                title: "✓ Imagem Carregada",
                description: "Imagem processada com sucesso e pronta para análise.",
              });
            } else {
              toast({
                variant: "default",
                title: "⚠ Imagem Processada",
                description: "Imagem carregada, mas a qualidade pode afetar a precisão da análise.",
              });
            }
          } catch (error) {
            console.error('Error processing uploaded image:', error);
            setCapturedImage(imageUrl); // Fallback to original
            toast({
              variant: "default",
              title: "⚠ Processamento Limitado",
              description: "Não foi possível otimizar a imagem. Usando imagem original.",
            });
          }
        }
      };
      
      reader.onerror = () => {
        setCameraError('Erro ao ler o arquivo. Por favor, tente novamente.');
        toast({
          variant: "destructive",
          title: "✗ Erro de leitura",
          description: "Erro ao ler o arquivo. Por favor, tente novamente.",
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling file upload:', error);
      toast({
        variant: "destructive",
        title: "✗ Erro no upload",
        description: "Falha ao processar o arquivo. Por favor, tente outro.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Mobile gesture handlers
  const handleSwipeLeft = () => {
    if (activeTab === 'photo') {
      setActiveTab('live');
      toast({ title: "Análise Live", description: "Modo live ativado" });
    }
  };

  const handleSwipeRight = () => {
    if (activeTab === 'live') {
      setActiveTab('photo');
      toast({ title: "Captura", description: "Modo foto ativado" });
    }
  };

  const handleDoubleTap = () => {
    if (isCameraActive) {
      captureImage();
    }
  };

  const handleLongPress = () => {
    if (isCameraActive) {
      toggleCameraFacing();
      toast({ title: "Câmera", description: "Câmera alternada" });
    }
  };

  // Start camera when facing mode changes
  useEffect(() => {
    if (!isCameraActive && cameraAccessAttempted && activeTab === 'photo') {
      startCamera();
    }
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [facingMode, cameraAccessAttempted, activeTab]);

  const content = (
    <motion.div 
      className="w-full flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-2 mb-4 ${isMobile ? 'h-12 text-base' : ''}`}>
          <TabsTrigger value="photo" className="gap-2">
            <Camera className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
            Capturar Foto
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-2">
            <Activity className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
            Análise Live
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photo" className="w-full">
          <MobileGestureHandler
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onDoubleTap={handleDoubleTap}
            onLongPress={handleLongPress}
            className="w-full"
          >
            <MobileTouchZoom className="relative w-full overflow-hidden rounded-xl aspect-video bg-black">
              {cameraError && (
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-center max-w-md">
                    <Alert variant="destructive" className="mb-4 rounded-lg">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="text-sm">Problema com a câmera</AlertTitle>
                      <AlertDescription className="text-xs">{cameraError}</AlertDescription>
                    </Alert>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={startCamera} size="sm">Tentar Novamente</Button>
                      <Button variant="outline" onClick={triggerFileUpload} size="sm" className="gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carregar</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {isProcessing && (
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center bg-black/60 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-center">
                    <div className="flex flex-col items-center">
                      <ScanSearch className="animate-pulse h-10 w-10 text-primary mb-3" />
                      <h3 className="text-white text-base font-bold">Processando Imagem</h3>
                      <p className="text-white/70 text-xs mt-1">Otimizando para melhor análise...</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className={`absolute top-4 left-4 z-10 ${isCameraActive ? 'flex' : 'hidden'}`}>
                <div className="bg-black/70 text-white px-3 py-2 rounded-full text-sm">
                  <ScanFace className="inline h-4 w-4 mr-2" /> 
                  Posicione o gráfico
                </div>
              </div>
              
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
            </MobileTouchZoom>
          </MobileGestureHandler>
          
          {/* Mobile optimized controls */}
          <div className="mt-4">
            <MobileCameraControls
              isCameraActive={isCameraActive}
              isProcessing={isProcessing}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
              onCaptureImage={captureImage}
              onToggleFacing={toggleCameraFacing}
              onFileUpload={triggerFileUpload}
            />
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden"
          />

          {/* Sample charts - mobile optimized */}
          {!isCameraActive && (
            <motion.div 
              className={`grid grid-cols-2 gap-3 w-full mt-6 ${isMobile ? 'px-2' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                variant="outline" 
                onClick={() => setCapturedImage('/chart-example-1.jpg')} 
                className={`h-auto p-4 rounded-xl ${isMobile ? 'text-base' : ''}`}
                disabled={isProcessing}
              >
                <div className="flex flex-col items-center w-full">
                  <span className={`${isMobile ? 'text-sm' : 'text-xs'} mb-2 font-medium`}>Exemplo 1</span>
                  <div className={`w-full ${isMobile ? 'h-20' : 'h-16'} bg-muted rounded flex items-center justify-center`}>
                    <CandlestickChart className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'} text-muted-foreground`} />
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setCapturedImage('/chart-example-2.jpg')} 
                className={`h-auto p-4 rounded-xl ${isMobile ? 'text-base' : ''}`}
                disabled={isProcessing}
              >
                <div className="flex flex-col items-center w-full">
                  <span className={`${isMobile ? 'text-sm' : 'text-xs'} mb-2 font-medium`}>Exemplo 2</span>
                  <div className={`w-full ${isMobile ? 'h-20' : 'h-16'} bg-muted rounded flex items-center justify-center`}>
                    <BarChart2 className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'} text-muted-foreground`} />
                  </div>
                </div>
              </Button>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="live" className="w-full">
          <MobileGestureHandler
            onSwipeLeft={handleSwipeRight}
            onSwipeRight={handleSwipeLeft}
          >
            <LiveAnalysis />
          </MobileGestureHandler>
        </TabsContent>
      </Tabs>
    </motion.div>
  );

  // Wrap in mobile layout if on mobile
  return isMobile ? (
    <MobileLayout activeTab="camera" className="px-4 py-2">
      {content}
    </MobileLayout>
  ) : (
    content
  );
};

export default CameraView;
