import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Zap, BarChart2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Capture = () => {
  const isMobile = useIsMobile();

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
              <Button className="w-full" size="lg">
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
              <Button variant="outline" className="w-full" size="lg">
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
              <Button variant="secondary" className="w-full" size="lg">
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