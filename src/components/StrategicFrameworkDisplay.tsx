import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Layers, TrendingUp, TrendingDown, AlertTriangle, Shield, Target, Clock } from "lucide-react";
import { StrategicAnalysisFramework } from "../utils/advancedStrategicAnalysis";

interface StrategicFrameworkDisplayProps {
  framework: StrategicAnalysisFramework;
}

const StrategicFrameworkDisplay = ({ framework }: StrategicFrameworkDisplayProps) => {
  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'bullish':
        return 'bg-emerald-100 text-emerald-800';
      case 'bearish':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'compra':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'venda':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'baixo':
        return 'bg-emerald-100 text-emerald-800';
      case 'moderado':
        return 'bg-yellow-100 text-yellow-800';
      case 'alto':
        return 'bg-orange-100 text-orange-800';
      case 'extremo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeframeSignal = (signal: string) => {
    switch (signal) {
      case 'bullish':
        return { color: 'bg-emerald-500', label: 'BULL' };
      case 'bearish':
        return { color: 'bg-red-500', label: 'BEAR' };
      default:
        return { color: 'bg-gray-400', label: 'NEUT' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
          <Layers className="h-6 w-6" />
          Framework Estratégico Avançado
        </h2>
        <p className="text-muted-foreground">
          {framework.description}
        </p>
      </div>

      {/* Análise Multi-Camada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Análise Multi-Camada
          </CardTitle>
          <CardDescription>
            Cada camada representa um aspecto fundamental da análise de mercado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {framework.analysisLayers.map((layer, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSignalIcon(layer.signal)}
                  <h3 className="font-semibold capitalize">
                    {layer.layer.replace('_', ' ')}
                  </h3>
                  <Badge className={getSignalColor(layer.signal)}>
                    {layer.signal.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Peso: {(layer.weight * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Força do Sinal</span>
                  <span className="text-sm font-bold">{layer.strength}%</span>
                </div>
                <Progress value={layer.strength} className="h-2" />
              </div>

              <div className="space-y-1">
                {layer.details.map((detail, detailIndex) => (
                  <p key={detailIndex} className="text-sm text-muted-foreground">
                    • {detail}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Matriz de Decisão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Matriz de Decisão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-3xl font-bold p-4 rounded-lg border-2 ${getActionColor(framework.decisionMatrix.primarySignal)}`}>
              {framework.decisionMatrix.primarySignal.toUpperCase()}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Força do Consenso</span>
              <span className="text-sm font-bold">{framework.decisionMatrix.consensusStrength.toFixed(1)}%</span>
            </div>
            <Progress value={framework.decisionMatrix.consensusStrength} className="h-2" />
          </div>

          {/* Alinhamento de Timeframes */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Alinhamento Multi-Timeframe</p>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(framework.decisionMatrix.timeframeAlignment).map(([timeframe, signal]) => {
                const signalInfo = getTimeframeSignal(signal);
                return (
                  <div key={timeframe} className="text-center">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {timeframe.toUpperCase()}
                    </div>
                    <div className={`${signalInfo.color} text-white text-xs font-bold py-1 px-2 rounded`}>
                      {signalInfo.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sinais Conflitantes */}
          {framework.decisionMatrix.conflictingSignals.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Sinais Conflitantes</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {framework.decisionMatrix.conflictingSignals.map((signal, index) => (
                  <li key={index}>• {signal}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avaliação de Riscos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Avaliação Estratégica de Riscos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risco de Mercado</p>
                <Badge className={getRiskColor(framework.riskAssessment.marketRisk)}>
                  {framework.riskAssessment.marketRisk.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risco de Liquidez</p>
                <Badge className={getRiskColor(framework.riskAssessment.liquidityRisk)}>
                  {framework.riskAssessment.liquidityRisk.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risco de Volatilidade</p>
                <Badge className={getRiskColor(framework.riskAssessment.volatilityRisk)}>
                  {framework.riskAssessment.volatilityRisk.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risco de Notícias</p>
                <Badge className={getRiskColor(framework.riskAssessment.newsRisk)}>
                  {framework.riskAssessment.newsRisk.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold">Risco Geral</span>
              <Badge className={`text-lg px-3 py-1 ${getRiskColor(framework.riskAssessment.overallRisk)}`}>
                {framework.riskAssessment.overallRisk.toUpperCase()}
              </Badge>
            </div>
            
            {framework.riskAssessment.riskFactors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-muted-foreground mb-2">Fatores de Risco</p>
                <ul className="text-sm space-y-1">
                  {framework.riskAssessment.riskFactors.map((factor, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confiança Geral */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Confiança do Framework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {framework.confidenceLevel}%
            </div>
            <Progress value={framework.confidenceLevel} className="h-3 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nível de confiança baseado na convergência de todas as camadas de análise
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StrategicFrameworkDisplay;