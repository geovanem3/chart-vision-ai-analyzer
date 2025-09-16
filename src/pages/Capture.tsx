import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Zap, BarChart2, X, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Capture = () => {
  const isMobile = useIsMobile();
  const { setCapturedImage, setTimeframe } = useAnalyzer();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
            stopCamera();
            navigate('/');
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
      navigate('/');
    }
  };

  const handleQuickMode = () => {
    setTimeframe('1m');
    startCamera();
  };

  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Controls overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div className="flex justify-between items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={stopCamera}
                className="bg-black/50 hover:bg-black/70 text-white border-none"
              >
                <X className="mr-2 h-4 w-4" />
                Fechar
              </Button>
            </div>
            
            <div className="flex justify-center items-center">
              <Button
                size="lg"
                onClick={capturePhoto}
                className="bg-white hover:bg-gray-100 text-black rounded-full w-16 h-16 p-0"
              >
                <Camera className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'p-4' : 'container py-8'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight mb-2`}>
            Capturar Gráfico
          </h1>
          <p className="text-muted-foreground">
            Capture ou faça upload de um gráfico para análise técnica avançada
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Capturar com Câmera</CardTitle>
                  <CardDescription>
                    Use a câmera do dispositivo para capturar gráficos em tempo real
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={startCamera}>
                <Camera className="mr-2 h-5 w-5" />
                Abrir Câmera
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500/10 rounded-lg p-2">
                  <Upload className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Upload de Imagem</CardTitle>
                  <CardDescription>
                    Faça upload de uma imagem salva do seu dispositivo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-5 w-5" />
                Selecionar Arquivo
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-amber-500/10 rounded-lg p-2">
                  <Zap className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Análise Rápida</CardTitle>
                  <CardDescription>
                    Modo otimizado para análises de scalping em M1
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                className="w-full" 
                size="lg"
                onClick={handleQuickMode}
              >
                <Zap className="mr-2 h-5 w-5" />
                Modo Rápido
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center">
            <BarChart2 className="mr-2 h-4 w-4" />
            Dicas para melhor análise
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Certifique-se que o gráfico esteja nítido e bem iluminado</li>
            <li>• Inclua indicadores e timeframe visíveis na imagem</li>
            <li>• Para scalping M1, prefira gráficos com candles recentes</li>
            <li>• Evite reflexos e obstruções na tela</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default Capture;