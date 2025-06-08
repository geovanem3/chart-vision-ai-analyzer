
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, TrendingUp, Target, BarChart3 } from 'lucide-react';

interface MasterAnalysisDisplayProps {
  masterAnalysis: any;
}

const MasterAnalysisDisplay: React.FC<MasterAnalysisDisplayProps> = ({ masterAnalysis }) => {
  console.log('MasterAnalysisDisplay received:', masterAnalysis);
  
  if (!masterAnalysis) {
    console.log('No masterAnalysis data');
    return null;
  }

  const { bulkowski, tripleScreen, murphy, masterRecommendation } = masterAnalysis;
  
  console.log('Extracted data:', { bulkowski, tripleScreen, murphy, masterRecommendation });

  return (
    <Card className="mt-4 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <BookOpen className="h-5 w-5" />
          Análise dos Mestres
        </CardTitle>
        <p className="text-sm text-amber-700">Baseado em Bulkowski, Elder, Murphy e Edwards & Magee</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Bulkowski Analysis */}
        {bulkowski && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Bulkowski
              </h4>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {((bulkowski.reliability || 0) * 100).toFixed(0)}% confiável
              </Badge>
            </div>
            <p className="text-sm text-blue-700 mb-2">{bulkowski.name || 'Padrão identificado'}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">Movimento médio:</span> {(bulkowski.averageMove || 0) > 0 ? '+' : ''}{bulkowski.averageMove || 0}%
              </div>
              <div>
                <span className="font-medium">Taxa de falha:</span> {((bulkowski.failureRate || 0) * 100).toFixed(0)}%
              </div>
            </div>
            <Progress value={(bulkowski.reliability || 0) * 100} className="mt-2 h-2" />
          </div>
        )}

        {/* Elder Triple Screen */}
        {tripleScreen && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Elder (Triple Screen)
              </h4>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {((tripleScreen.confidence || 0) * 100).toFixed(0)}% confiança
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">Longo Prazo</div>
                <Badge variant={(tripleScreen.longTermTrend || '') === 'up' ? 'default' : 'secondary'} className="text-xs">
                  {tripleScreen.longTermTrend || 'N/A'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="font-medium">Oscilador</div>
                <Badge variant={(tripleScreen.mediumTermOscillator || '') === 'buy' ? 'default' : 'secondary'} className="text-xs">
                  {tripleScreen.mediumTermOscillator || 'N/A'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="font-medium">Entrada</div>
                <Badge variant={(tripleScreen.shortTermEntry || '') !== 'wait' ? 'default' : 'secondary'} className="text-xs">
                  {tripleScreen.shortTermEntry || 'N/A'}
                </Badge>
              </div>
            </div>
            <Progress value={(tripleScreen.confidence || 0) * 100} className="mt-2 h-2" />
          </div>
        )}

        {/* Murphy Analysis */}
        {murphy && (
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Murphy
              </h4>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {(murphy.supportResistance || []).length} S/R
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div>
                <span className="font-medium">Tendência primária:</span> {murphy.trendAnalysis?.primary || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Volume:</span> {murphy.volumeAnalysis?.trend || 'N/A'}
              </div>
            </div>
            {murphy.supportResistance && murphy.supportResistance.length > 0 && (
              <div className="text-xs">
                <span className="font-medium">Níveis chave:</span>
                {murphy.supportResistance.map((level, idx) => (
                  <Badge key={idx} variant="outline" className="ml-1 text-xs">
                    {level.level} ({level.type})
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Master Recommendation */}
        {masterRecommendation && (
          <div className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg border-2 border-amber-300">
            <h4 className="font-bold text-amber-800 mb-2">Recomendação Integrada dos Mestres</h4>
            <div className="text-sm text-amber-800 whitespace-pre-line">
              {masterRecommendation}
            </div>
          </div>
        )}

        {/* Fallback when no data */}
        {!bulkowski && !tripleScreen && !murphy && !masterRecommendation && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600">Dados de análise dos mestres não disponíveis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MasterAnalysisDisplay;
