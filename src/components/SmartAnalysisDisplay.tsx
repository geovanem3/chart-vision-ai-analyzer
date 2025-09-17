import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { TrendingUp, TrendingDown, Target, AlertTriangle, Brain, Zap } from "lucide-react";
import { SmartAnalysisResult } from "../utils/intelligentAreaRecognition";

interface SmartAnalysisDisplayProps {
  analysis: SmartAnalysisResult;
}

const SmartAnalysisDisplay = ({ analysis }: SmartAnalysisDisplayProps) => {
  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'compra':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'venda':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Target className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'compra':
        return 'text-emerald-600';
      case 'venda':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'baixo':
        return 'bg-emerald-100 text-emerald-800';
      case 'moderado':
        return 'bg-yellow-100 text-yellow-800';
      case 'alto':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
          <Brain className="h-6 w-6" />
          Análise Inteligente com Reconhecimento de Área
        </h2>
        <p className="text-muted-foreground">
          Sistema avançado que identifica automaticamente as melhores áreas para análise
        </p>
      </div>

      {/* Área Selecionada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Área Selecionada Automaticamente
          </CardTitle>
          <CardDescription>
            Zona identificada pelo algoritmo como mais propícia para análise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Análise</p>
              <Badge variant="secondary" className="mt-1">
                {analysis.selectedArea.analysisType.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Timeframe Ótimo</p>
              <Badge variant="outline" className="mt-1">
                {analysis.selectedArea.timeframeOptimal}
              </Badge>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Confiança da Área</span>
              <span className="text-sm font-bold">{analysis.selectedArea.confidence}%</span>
            </div>
            <Progress value={analysis.selectedArea.confidence} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Probabilidade de Entrada</span>
              <span className="text-sm font-bold">{analysis.selectedArea.entryProbability.toFixed(1)}%</span>
            </div>
            <Progress value={analysis.selectedArea.entryProbability} className="h-2" />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              <strong>Razão:</strong> {analysis.selectedArea.reason}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contexto de Mercado */}
      <Card>
        <CardHeader>
          <CardTitle>Contexto de Mercado Inteligente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tendência Dominante</p>
                <Badge 
                  variant={analysis.marketContext.dominantTrend === 'bullish' ? 'default' : 'destructive'}
                  className="mt-1"
                >
                  {analysis.marketContext.dominantTrend.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado de Volatilidade</p>
                <Badge variant="outline" className="mt-1">
                  {analysis.marketContext.volatilityState.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Condição de Liquidez</p>
                <Badge variant="secondary" className="mt-1">
                  {analysis.marketContext.liquidityCondition.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atividade Institucional</p>
                <Badge variant="outline" className="mt-1">
                  {analysis.marketContext.institutionalActivity.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise Estratégica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Análise Estratégica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Estratégia Primária</p>
            <Badge variant="default" className="text-base px-3 py-1">
              {analysis.strategicAnalysis.primaryStrategy}
            </Badge>
          </div>

          {analysis.strategicAnalysis.secondaryStrategies.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Estratégias Secundárias</p>
              <div className="flex flex-wrap gap-2">
                {analysis.strategicAnalysis.secondaryStrategies.map((strategy, index) => (
                  <Badge key={index} variant="secondary">
                    {strategy}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Confiança Estratégica</span>
              <span className="text-sm font-bold">{analysis.strategicAnalysis.confidence}%</span>
            </div>
            <Progress value={analysis.strategicAnalysis.confidence} className="h-2" />
          </div>

          {analysis.strategicAnalysis.conflictingSignals.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Sinais Conflitantes</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {analysis.strategicAnalysis.conflictingSignals.map((signal, index) => (
                  <li key={index}>• {signal}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recomendação de Entrada */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getDirectionIcon(analysis.entryRecommendation.action)}
            Recomendação Final
          </CardTitle>
          <CardDescription>
            Decisão baseada em análise inteligente multi-fator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getDirectionColor(analysis.entryRecommendation.action)} mb-2`}>
              {analysis.entryRecommendation.action.toUpperCase()}
            </div>
            <Badge className={getRiskColor(analysis.entryRecommendation.riskLevel)}>
              Risco {analysis.entryRecommendation.riskLevel}
            </Badge>
            <Badge variant="outline" className="ml-2">
              {analysis.entryRecommendation.timeframe}
            </Badge>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Reasoning:</p>
            <p className="text-sm">{analysis.entryRecommendation.reasoning}</p>
          </div>

          {(analysis.entryRecommendation.stopLoss || analysis.entryRecommendation.takeProfit) && (
            <div className="grid grid-cols-2 gap-4">
              {analysis.entryRecommendation.stopLoss && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stop Loss</p>
                  <p className="text-lg font-bold text-red-600">
                    ${analysis.entryRecommendation.stopLoss.toFixed(2)}
                  </p>
                </div>
              )}
              {analysis.entryRecommendation.takeProfit && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Take Profit</p>
                  <p className="text-lg font-bold text-emerald-600">
                    ${analysis.entryRecommendation.takeProfit.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartAnalysisDisplay;