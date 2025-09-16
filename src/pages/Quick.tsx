import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, Target, TrendingUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Quick = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'p-4' : 'container py-8'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-amber-500/10 rounded-full p-3">
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight mb-2`}>
            Análise Rápida M1
          </h1>
          <p className="text-muted-foreground">
            Modo otimizado para scalping com análise instantânea
          </p>
          <Badge variant="secondary" className="mt-2">
            Ultra Rápido • M1 Scalping
          </Badge>
        </div>

        <div className="grid gap-6 max-w-2xl mx-auto">
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-700 dark:text-amber-300">
                <Zap className="mr-2 h-5 w-5" />
                Modo Scalping Ativado
              </CardTitle>
              <CardDescription>
                Análise otimizada para operações de curto prazo em M1
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">3s</div>
                  <div className="text-xs text-muted-foreground">Tempo de Análise</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">M1</div>
                  <div className="text-xs text-muted-foreground">Timeframe</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-blue-500" />
                  Timing de Entrada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Identifica o momento exato para entrada com base em micro padrões
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Target className="mr-2 h-4 w-4 text-green-500" />
                  Alvos Otimizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Targets calculados especificamente para scalping M1
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-purple-500" />
                  Micro Tendências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Análise de micro tendências para aproveitamento máximo
                </p>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" className="w-full">
            <Zap className="mr-2 h-5 w-5" />
            Iniciar Análise Rápida
          </Button>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Características do Modo Rápido:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Análise em menos de 3 segundos</li>
            <li>• Foco em padrões de reversão M1</li>
            <li>• Stops e targets otimizados para scalping</li>
            <li>• Alertas de timing para entradas precisas</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default Quick;