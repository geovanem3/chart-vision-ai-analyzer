
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Tipos de tradução
type Translations = {
  [key: string]: string;
};

// Definição dos idiomas disponíveis
const languages = {
  pt: 'Português',
  en: 'English',
};

// Traduções disponíveis
const translations: Record<string, Translations> = {
  pt: {
    // Camera view
    'startCamera': 'Iniciar Câmera',
    'uploadImage': 'Carregar Imagem',
    'retryCamera': 'Tentar Novamente',
    'cameraError': 'Erro ao acessar a câmera',
    'permissionDenied': 'Câmera bloqueada. Por favor, permita o acesso à câmera nas configurações do seu navegador.',
    'cameraNotFound': 'Nenhuma câmera foi encontrada no seu dispositivo.',
    'cameraInUse': 'Não foi possível acessar a câmera. Ela pode estar sendo usada por outro aplicativo.',
    'sampleCharts': 'Exemplos de Gráficos',
    'sampleChartsDescription': 'Você também pode usar um gráfico de exemplo para testar a análise.',
    'candlestickChart': 'Gráfico de Velas',
    'lineChart': 'Gráfico de Linha',
    'example': 'Exemplo',
    
    // Chart analyzer
    'captureChartImage': 'Capturar Imagem do Gráfico',
    'captureDescription': 'Use sua câmera para tirar uma foto de um gráfico financeiro para análise ou carregue uma imagem.',
    'configureAnalysis': 'Configurar Análise',
    'analysisResults': 'Resultados da Análise',
    'capturedImage': 'Imagem Capturada',
    'selectRegionDescription': 'Selecione a região do gráfico que deseja analisar na próxima etapa.',
    
    // Chart region selector
    'selectChartRegion': 'Selecionar Região do Gráfico',
    'dragToSelect': 'Arraste para selecionar a área específica do gráfico que deseja analisar, ou use a região detectada automaticamente.',
    'resetSelection': 'Redefinir Seleção',
    
    // Control panel
    'chartAnalysisControls': 'Controles de Análise de Gráfico',
    'newAnalysis': 'Nova Análise',
    'analysisSettings': 'Configurações de Análise',
    'bullishPatternDetection': 'Detecção de Padrões de Alta',
    'bearishPatternDetection': 'Detecção de Padrões de Baixa',
    'supportResistanceLevels': 'Níveis de Suporte/Resistência',
    'trendAnalysis': 'Análise de Tendência',
    'analyzerDescription': 'O analisador irá processar a região selecionada e detectar padrões de trading comuns.',
    'analyzeChart': 'Analisar Gráfico',
    'analyzing': 'Analisando...',
    
    // Analysis results
    'analyzedOn': 'Analisado em',
    'patternsDetected': 'padrões detectados',
    'overallAssessment': 'Avaliação Geral',
    'detectedPatterns': 'Padrões Detectados',
    'confidence': 'Confiança',
    'insight': 'Insight',
    
    // Header and footer
    'chartVisionAI': 'Chart Vision AI Analyzer',
    'patternRecognition': 'Tecnologia de Reconhecimento de Padrões',
    'analyzeFinancialCharts': 'Analise Gráficos Financeiros com IA',
    'appDescription': 'Capture imagens de gráficos financeiros e deixe nossa IA detectar padrões de trading, níveis de suporte/resistência e indicadores de tendência automaticamente.',
    'advancedPatternRecognition': 'Reconhecimento avançado de padrões para gráficos financeiros',
  },
  en: {
    // Add English translations here if needed
  }
};

// Tipo do contexto
type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  availableLanguages: typeof languages;
};

// Criação do contexto
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider do contexto
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState('pt'); // Default language is Portuguese

  // Função para traduzir texto
  const t = (key: string): string => {
    if (!translations[language] || !translations[language][key]) {
      // Fallback to English or return the key itself if not found
      return translations['en']?.[key] || key;
    }
    return translations[language][key];
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        availableLanguages: languages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Hook para usar o contexto
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
