
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart2, Eye, EyeOff, Loader2, TrendingUp, Target, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';

// Schema de validação para autenticação
const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(128, 'Senha muito longa'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome muito longo'),
});

// Dados de exemplo de análise para credibilidade
const sampleCandles = [
  { o: 62, h: 68, l: 58, c: 65 },
  { o: 65, h: 70, l: 63, c: 64 },
  { o: 64, h: 66, l: 55, c: 57 },
  { o: 57, h: 60, l: 52, c: 54 },
  { o: 54, h: 58, l: 50, c: 56 },
  { o: 56, h: 62, l: 54, c: 61 },
  { o: 61, h: 67, l: 59, c: 66 },
  { o: 66, h: 72, l: 64, c: 71 },
  { o: 71, h: 75, l: 68, c: 73 },
  { o: 73, h: 78, l: 70, c: 76 },
  { o: 76, h: 80, l: 74, c: 74 },
  { o: 74, h: 79, l: 72, c: 78 },
];

const CandlestickChart = () => {
  const chartHeight = 120;
  const chartWidth = 220;
  const candleWidth = 12;
  const gap = 6;
  const min = 48;
  const max = 82;
  const range = max - min;

  const scale = (v: number) => chartHeight - ((v - min) / range) * chartHeight;

  return (
    <svg width={chartWidth} height={chartHeight} className="overflow-visible">
      {sampleCandles.map((c, i) => {
        const x = i * (candleWidth + gap) + 4;
        const isGreen = c.c >= c.o;
        const bodyTop = scale(Math.max(c.o, c.c));
        const bodyBottom = scale(Math.min(c.o, c.c));
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

        return (
          <g key={i}>
            {/* Wick */}
            <line
              x1={x + candleWidth / 2}
              y1={scale(c.h)}
              x2={x + candleWidth / 2}
              y2={scale(c.l)}
              stroke={isGreen ? '#22c55e' : '#ef4444'}
              strokeWidth={1}
              opacity={0.7}
            />
            {/* Body */}
            <rect
              x={x}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              fill={isGreen ? '#22c55e' : '#ef4444'}
              rx={1}
              opacity={0.85}
            />
          </g>
        );
      })}
      {/* Support line */}
      <line x1={0} y1={scale(54)} x2={chartWidth} y2={scale(54)} stroke="#22c55e" strokeWidth={1} strokeDasharray="4 3" opacity={0.4} />
      {/* Resistance line */}
      <line x1={0} y1={scale(78)} x2={chartWidth} y2={scale(78)} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" opacity={0.4} />
    </svg>
  );
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const trimmedEmail = email.trim();
      const trimmedFullName = fullName.trim();

      if (isLogin) {
        const validation = loginSchema.safeParse({ email: trimmedEmail, password });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await signIn(trimmedEmail, password);
        if (error) {
          setError(error.message);
        } else {
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo de volta ao Chart Vision AI.",
          });
          navigate('/');
        }
      } else {
        const validation = signupSchema.safeParse({ 
          email: trimmedEmail, 
          password, 
          fullName: trimmedFullName 
        });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await signUp(trimmedEmail, password, trimmedFullName);
        if (error) {
          setError(error.message);
        } else {
          toast({
            title: "Conta criada com sucesso!",
            description: "Verifique seu email para confirmar a conta.",
          });
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left side - Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-card via-background to-card items-center justify-center p-10">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-accent rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-lg space-y-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <BarChart2 className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Chart Vision AI</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Análise inteligente de gráficos com IA Gemini Vision em tempo real
            </p>
          </div>

          {/* Sample Analysis Card */}
          <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Exemplo de Análise
                </CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  COMPRA
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center bg-secondary/30 rounded-lg p-3">
                <CandlestickChart />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-secondary/30 rounded-lg">
                  <span className="text-muted-foreground">Tendência</span>
                  <div className="font-medium flex items-center gap-1 text-green-400">
                    <TrendingUp className="h-3 w-3" /> Alta
                  </div>
                </div>
                <div className="p-2 bg-secondary/30 rounded-lg">
                  <span className="text-muted-foreground">Confiança</span>
                  <div className="font-medium text-primary">87%</div>
                </div>
                <div className="p-2 bg-secondary/30 rounded-lg">
                  <span className="text-muted-foreground">Padrão</span>
                  <div className="font-medium">Engolfo de Alta</div>
                </div>
                <div className="p-2 bg-secondary/30 rounded-lg">
                  <span className="text-muted-foreground">Risco</span>
                  <div className="font-medium text-yellow-400">Médio</div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                "Padrão de engolfo de alta identificado após correção em zona de suporte. 
                Volume crescente confirma entrada de compradores institucionais."
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Zap className="h-4 w-4 text-primary" />, label: 'IA Gemini Vision' },
              { icon: <Shield className="h-4 w-4 text-green-400" />, label: 'Smart Money' },
              { icon: <Target className="h-4 w-4 text-accent" />, label: 'Medo & Ganância' },
              { icon: <TrendingUp className="h-4 w-4 text-purple-400" />, label: 'Suporte & Resistência' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                {f.icon}
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BarChart2 className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Chart Vision AI</h1>
            </div>

            {/* Mini chart for mobile */}
            <Card className="border border-border/50 bg-card/80 mb-4">
              <CardContent className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Análise em tempo real</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                    <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                    87% Confiança
                  </Badge>
                </div>
                <div className="flex justify-center">
                  <CandlestickChart />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {isLogin ? 'Fazer Login' : 'Criar Conta'}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? 'Acesse sua conta para analisar gráficos com IA'
                  : 'Crie sua conta para começar a analisar gráficos'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                >
                  {isLogin 
                    ? 'Não tem uma conta? Criar conta'
                    : 'Já tem uma conta? Fazer login'
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
