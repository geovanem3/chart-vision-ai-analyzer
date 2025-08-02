import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { professionalAnalysisService } from '@/services/professionalAnalysisService';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Eye, 
  Trash2, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalysisRow {
  id: string;
  created_at: string;
  primary_pattern?: string;
  market_sentiment?: string;
  overall_action?: string;
  overall_confidence?: number;
  analysis_score?: number;
  reliability_score?: number;
  timeframe?: string;
  image_url?: string;
}

const AnalysisHistory: React.FC = () => {
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const data = await professionalAnalysisService.getUserAnalyses(100);
      setAnalyses(data);
      setFilteredAnalyses(data);
      
      // Carregar estatísticas
      const statsData = await professionalAnalysisService.getUserAnalyticsStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de análises",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  useEffect(() => {
    let filtered = analyses;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(analysis => 
        analysis.primary_pattern?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.market_sentiment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por sentimento
    if (sentimentFilter !== 'all') {
      filtered = filtered.filter(analysis => analysis.market_sentiment === sentimentFilter);
    }

    // Filtrar por timeframe
    if (timeframeFilter !== 'all') {
      filtered = filtered.filter(analysis => analysis.timeframe === timeframeFilter);
    }

    setFilteredAnalyses(filtered);
  }, [analyses, searchTerm, sentimentFilter, timeframeFilter]);

  const handleDeleteAnalysis = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta análise?')) {
      return;
    }

    try {
      const success = await professionalAnalysisService.deleteAnalysis(id);
      if (success) {
        setAnalyses(prev => prev.filter(a => a.id !== id));
        toast({
          title: "Sucesso",
          description: "Análise deletada com sucesso",
        });
      } else {
        throw new Error('Falha ao deletar');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar a análise",
        variant: "destructive",
      });
    }
  };

  const getSentimentBadgeVariant = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish': return 'default';
      case 'bearish': return 'destructive';
      case 'neutral': return 'secondary';
      default: return 'outline';
    }
  };

  const getActionBadgeVariant = (action?: string) => {
    switch (action) {
      case 'compra': return 'default';
      case 'venda': return 'destructive';
      case 'neutro': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando histórico...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
                </div>
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bullish</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sentimentDistribution.bullish}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bearish</p>
                  <p className="text-2xl font-bold text-red-600">{stats.sentimentDistribution.bearish}</p>
                </div>
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score Médio</p>
                  <p className="text-2xl font-bold">{(stats.averageScores.analysis * 100).toFixed(0)}%</p>
                </div>
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Análises
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar padrões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
            </div>

            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sentimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="bullish">Bullish</SelectItem>
                <SelectItem value="bearish">Bearish</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="M1">1M</SelectItem>
                <SelectItem value="M5">5M</SelectItem>
                <SelectItem value="M15">15M</SelectItem>
                <SelectItem value="M30">30M</SelectItem>
                <SelectItem value="H1">1H</SelectItem>
                <SelectItem value="H4">4H</SelectItem>
                <SelectItem value="D1">1D</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={loadAnalyses} size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead>Sentimento</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Timeframe</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalyses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {analyses.length === 0 ? 'Nenhuma análise encontrada' : 'Nenhum resultado para os filtros aplicados'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAnalyses.map((analysis) => (
                    <motion.tr
                      key={analysis.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-mono text-xs">
                        {formatDate(analysis.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {analysis.primary_pattern || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSentimentBadgeVariant(analysis.market_sentiment)}>
                          {analysis.market_sentiment || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(analysis.overall_action)}>
                          {analysis.overall_action || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            {analysis.analysis_score ? `${(analysis.analysis_score * 100).toFixed(0)}%` : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{analysis.timeframe || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: Implementar visualização detalhada
                              toast({
                                title: "Em desenvolvimento",
                                description: "Visualização detalhada em breve",
                              });
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAnalysis(analysis.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisHistory;