import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Settings = () => {
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
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Personalize sua experiência de análise técnica
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" />
                Perfil
              </CardTitle>
              <CardDescription>
                Informações da sua conta e preferências pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Trader Premium</p>
                  <p className="text-xs text-muted-foreground">Acesso completo às análises</p>
                </div>
                <Button variant="outline" size="sm">
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5 text-blue-500" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure alertas e notificações de análise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Alertas de Entrada</p>
                  <p className="text-xs text-muted-foreground">Notificações quando sinais forem detectados</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Análise Completa</p>
                  <p className="text-xs text-muted-foreground">Notificar quando análise estiver pronta</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Modo Rápido</p>
                  <p className="text-xs text-muted-foreground">Alertas para scalping M1</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5 text-purple-500" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize a interface do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Tema Escuro</p>
                  <p className="text-xs text-muted-foreground">Interface otimizada para trading noturno</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Animações</p>
                  <p className="text-xs text-muted-foreground">Transições suaves na interface</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="mr-2 h-5 w-5 text-green-500" />
                Análise
              </CardTitle>
              <CardDescription>
                Configurações de análise técnica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Análise Automática</p>
                  <p className="text-xs text-muted-foreground">Executar análise automaticamente após captura</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Todas as Estratégias</p>
                  <p className="text-xs text-muted-foreground">Incluir análises avançadas por padrão</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Timeframe Preferido</p>
                  <p className="text-xs text-muted-foreground">M1 para scalping, M5 para swing</p>
                </div>
                <Button variant="outline" size="sm">
                  M1
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-orange-500" />
                Privacidade
              </CardTitle>
              <CardDescription>
                Controle seus dados e privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Compartilhar Análises</p>
                  <p className="text-xs text-muted-foreground">Permitir compartilhamento anônimo para melhorias</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <Button variant="outline" className="w-full">
                Exportar Dados
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;