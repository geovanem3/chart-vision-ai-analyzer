import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Camera, Loader2, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import AnalysisResults from '@/components/AnalysisResults';

const ScreenCapture = () => {
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const { setCapturedImage, analyzeChartRegion, isAnalyzing, analysisResults, capturedImage } = useAnalyzer();

  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia;

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsSharing(false);
  };

  useEffect(() => () => stopStream(), []);

  const startSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 } as MediaTrackConstraints,
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsSharing(true);
      stream.getVideoTracks()[0].addEventListener('ended', stopStream);
      toast.success('Compartilhamento iniciado');
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível iniciar o compartilhamento');
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !streamRef.current) return;
    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas não disponível');
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
      toast.success('Print capturado, analisando...');
      await analyzeChartRegion(dataUrl);
    } catch (err) {
      console.error(err);
      toast.error('Falha ao capturar print');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'container py-8'}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-primary/10 rounded-full p-3">
              <Monitor className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight mb-2`}>
            Captura de Tela
          </h1>
          <p className="text-muted-foreground text-sm">
            Compartilhe uma janela ou monitor e tire um print do gráfico para análise
          </p>
          <Badge variant="secondary" className="mt-2">Desktop / Notebook</Badge>
        </div>

        {!supported ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Recurso não suportado</CardTitle>
              <CardDescription>
                Seu dispositivo ou navegador não suporta captura de tela. Use um navegador desktop como Chrome, Edge ou Firefox.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Monitor className="h-4 w-4 text-primary" />
                  Pré-visualização
                </CardTitle>
                <CardDescription>
                  {isSharing
                    ? 'Posicione o gráfico e clique em capturar'
                    : 'Clique em "Compartilhar tela" e selecione a janela do gráfico'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain bg-black"
                    muted
                    playsInline
                  />
                  {!isSharing && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                      Nenhuma tela compartilhada
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {!isSharing ? (
                    <Button onClick={startSharing} size="lg" className="flex-1 min-w-[200px]">
                      <Play className="mr-2 h-4 w-4" />
                      Compartilhar tela
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={captureFrame}
                        size="lg"
                        className="flex-1 min-w-[200px]"
                        disabled={isCapturing || isAnalyzing}
                      >
                        {isCapturing || isAnalyzing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="mr-2 h-4 w-4" />
                        )}
                        {isAnalyzing ? 'Analisando...' : 'Capturar print e analisar'}
                      </Button>
                      <Button onClick={stopStream} variant="outline" size="lg">
                        <X className="mr-2 h-4 w-4" />
                        Parar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {(capturedImage || analysisResults) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resultado da Análise</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalysisResults />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ScreenCapture;
