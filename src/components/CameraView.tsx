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
          width: { ideal: 1280 },
          height: { ideal: 720 }
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
            
            toast({
              variant: "default",
              title: "📊 Processando captura...",
              description: "Detectando região do gráfico e otimizando imagem.",
            });

            let finalImageUrl = basicImageUrl;
            let processingMessage = "";

            try {
              // Import detectChartRegion here to avoid circular dependencies
              const { detectChartRegion, cropToRegion } = await import('@/utils/imageProcessing');
              
              // Detect chart region automatically
              const regionResult = await detectChartRegion(basicImageUrl);
              
              if (regionResult.success && regionResult.data) {
                // Crop to detected chart region
                const cropResult = await cropToRegion(basicImageUrl, {
                  type: 'rectangle',
                  x: regionResult.data.x,
                  y: regionResult.data.y,
                  width: regionResult.data.width,
                  height: regionResult.data.height
                });
                
                if (cropResult.success && cropResult.data) {
                  finalImageUrl = cropResult.data;
                  processingMessage = "Região do gráfico detectada e capturada automaticamente. ";
                } else {
                  processingMessage = "Usando captura completa - não foi possível isolar o gráfico. ";
                }
              } else {
                processingMessage = "Usando captura completa - região do gráfico não detectada. ";
              }
            } catch (regionError) {
              console.warn('Chart region detection failed:', regionError);
              processingMessage = "Usando captura completa - detecção automática indisponível. ";
            }

            // Check if the image is clear enough for analysis
            const clarityCheck = await isImageClearForAnalysis(finalImageUrl);
            
            if (!clarityCheck.isClear) {
              // Image not clear enough, show warning but continue with enhancement
              toast({
                variant: "default",
                title: "⚠ Melhorando qualidade",
                description: clarityCheck.issues.join('. ') + ". Aplicando otimizações...",
              });
            }
            
            // Enhance the final image for better analysis
            const enhancedImageUrl = await enhanceImageForAnalysis(finalImageUrl);
            
            // Check quality of enhanced image
            const qualityCheck = await checkImageQuality(enhancedImageUrl);
            
            setCapturedImage(enhancedImageUrl);
            stopCamera();
            
            if (qualityCheck.isGoodQuality) {
              toast({
                variant: "default",
                title: "✓ Gráfico capturado",
                description: processingMessage + "Imagem otimizada e pronta para análise.",
              });
            } else {
              toast({
                variant: "default",
                title: "⚠ Gráfico capturado",
                description: processingMessage + "Qualidade pode afetar a precisão da análise.",
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
    if (!file) {
      setIsProcessing(false);
      return;
    }

    try {
      setIsProcessing(true);
      setCameraError(null); // Clear any previous errors
      
      // File type validation
      if (!file.type.startsWith('image/')) {
        const errorMsg = 'Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).';
        setCameraError(errorMsg);
        toast({
          variant: "destructive",
          title: "✗ Arquivo inválido",
          description: errorMsg,
        });
        return;
      }

      // File size validation (max 10MB)
      const maxSizeInMB = 10;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        const errorMsg = `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB.`;
        setCameraError(errorMsg);
        toast({
          variant: "destructive",
          title: "✗ Arquivo muito grande",
          description: errorMsg,
        });
        return;
      }

      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const imageUrl = e.target?.result as string;
          if (!imageUrl) {
            throw new Error('Não foi possível ler o arquivo de imagem');
          }

          // Validate that the image URL is valid
          if (!imageUrl.startsWith('data:image/')) {
            throw new Error('Formato de imagem inválido');
          }

          toast({
            variant: "default",
            title: "📊 Processando imagem...",
            description: "Verificando qualidade e otimizando para análise.",
          });

          let finalImageUrl = imageUrl;
          let qualityMessage = "";

          try {
            // Check image clarity first
            const clarityCheck = await isImageClearForAnalysis(imageUrl);
            
            if (!clarityCheck.isClear && clarityCheck.issues.length > 0) {
              qualityMessage = "Qualidade baixa detectada. ";
              toast({
                variant: "default",
                title: "⚠ Melhorando qualidade",
                description: clarityCheck.issues.join('. ') + ". Aplicando otimizações...",
              });
            }

            // Try to enhance the image
            const enhancedImageUrl = await enhanceImageForAnalysis(imageUrl);
            
            // Validate enhanced image
            if (enhancedImageUrl && enhancedImageUrl !== imageUrl) {
              finalImageUrl = enhancedImageUrl;
              
              // Check quality of enhanced image
              const qualityCheck = await checkImageQuality(enhancedImageUrl);
              
              if (qualityCheck.isGoodQuality) {
                qualityMessage += "Imagem otimizada com sucesso.";
              } else {
                qualityMessage += "Imagem otimizada, mas qualidade pode afetar análise.";
              }
            } else {
              // Enhancement failed, use original
              const qualityCheck = await checkImageQuality(imageUrl);
              if (qualityCheck.isGoodQuality) {
                qualityMessage = "Imagem original tem boa qualidade.";
              } else {
                qualityMessage = "Usando imagem original. " + qualityCheck.message;
              }
            }
          } catch (processingError) {
            console.warn('Image processing failed, using original:', processingError);
            finalImageUrl = imageUrl;
            qualityMessage = "Usando imagem original sem otimizações.";
          }

          // Set the final image
          setCapturedImage(finalImageUrl);
          
          // Success notification
          toast({
            variant: "default",
            title: "✓ Imagem carregada com sucesso",
            description: qualityMessage + " Pronta para análise.",
          });

        } catch (error) {
          console.error('Error in file reader onload:', error);
          setCameraError('Erro ao processar imagem. Tente outro arquivo.');
          toast({
            variant: "destructive",
            title: "✗ Erro no processamento",
            description: "Não foi possível processar a imagem. Tente outro arquivo.",
          });
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        const errorMsg = 'Erro ao ler o arquivo. Verifique se o arquivo não está corrompido.';
        setCameraError(errorMsg);
        toast({
          variant: "destructive",
          title: "✗ Erro de leitura",
          description: errorMsg,
        });
      };

      reader.onabort = () => {
        console.warn('File reading was aborted');
        setCameraError('Leitura do arquivo foi cancelada.');
        toast({
          variant: "destructive",
          title: "✗ Leitura cancelada",
          description: "A leitura do arquivo foi interrompida.",
        });
      };
      
      // Start reading the file
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      const errorMsg = 'Erro inesperado ao processar arquivo. Tente novamente.';
      setCameraError(errorMsg);
      toast({
        variant: "destructive",
        title: "✗ Erro no upload",
        description: errorMsg,
      });
    } finally {
      setIsProcessing(false);
      // Clear the file input to allow re-uploading the same file
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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

  return (
    <motion.div 
      className="w-full flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="photo" className="gap-2">
            <Camera className="w-4 h-4" />
            Capturar Foto
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-2">
            <Activity className="w-4 h-4" />
            Análise Live
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photo" className="w-full">
          <div className="relative w-full overflow-hidden rounded-xl aspect-video bg-black">
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
              <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                <ScanFace className="inline h-3 w-3 mr-1" /> 
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
          </div>
          
          <div className="flex items-center gap-3 mt-3">
            {isCameraActive ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleCameraFacing}
                  className="rounded-full h-10 w-10"
                  disabled={isProcessing}
                >
                  <FlipHorizontal className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={captureImage}
                  className="rounded-full w-14 h-14 p-0"
                  disabled={isProcessing}
                >
                  <div className="w-10 h-10 rounded-full border-2 border-white" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={stopCamera}
                  className="rounded-full h-10 w-10"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex gap-3 justify-center w-full">
                <Button onClick={startCamera} className="gap-1 flex-1" disabled={isProcessing}>
                  <Camera className="w-4 h-4" />
                  <span>Câmera</span>
                </Button>
                
                <Button variant="outline" onClick={triggerFileUpload} className="gap-1 flex-1" disabled={isProcessing}>
                  <Image className="w-4 h-4" />
                  <span>Galeria</span>
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

          {/* Sample chart examples - more compact for mobile */}
          {!isCameraActive && (
            <motion.div 
              className="grid grid-cols-2 gap-2 w-full mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                variant="outline" 
                onClick={() => setCapturedImage('/chart-example-1.jpg')} 
                className="h-auto p-2 rounded-lg" 
                disabled={isProcessing}
              >
                <div className="flex flex-col items-center w-full">
                  <span className="text-xs mb-1">Exemplo 1</span>
                  <div className="w-full h-16 bg-muted rounded flex items-center justify-center">
                    <CandlestickChart className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setCapturedImage('/chart-example-2.jpg')} 
                className="h-auto p-2 rounded-lg" 
                disabled={isProcessing}
              >
                <div className="flex flex-col items-center w-full">
                  <span className="text-xs mb-1">Exemplo 2</span>
                  <div className="w-full h-16 bg-muted rounded flex items-center justify-center">
                    <BarChart2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </Button>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="live" className="w-full">
          <LiveAnalysis />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default CameraView;
