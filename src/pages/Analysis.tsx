import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, Target, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Analysis = () => {
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
            Resultados da Análise
          </h1>
          <p className="text-muted-foreground">
            Análise técnica detalhada e recomendações de entrada
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5 text-primary" />
                Análise Principal
              </CardTitle>
              <CardDescription>
                Capture um gráfico primeiro para ver os resultados da análise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart2 className="mx-auto h-16 w-16 mb-4 opacity-50" />
                <p>Nenhuma análise disponível</p>
                <p className="text-sm">Vá para "Capturar" para começar</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                  Tendência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Aguardando análise</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Target className="mr-2 h-4 w-4 text-blue-500" />
                  Sinal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Aguardando análise</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-amber-500" />
                  Timing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Aguardando análise</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Analysis;