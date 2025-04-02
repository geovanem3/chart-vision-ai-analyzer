
import React from 'react';
import { AnalyzerProvider } from '@/context/AnalyzerContext';
import { LanguageProvider } from '@/context/LanguageContext';
import GraphAnalyzer from '@/components/GraphAnalyzer';
import { BarChart2 } from 'lucide-react';

const Index = () => {
  return (
    <LanguageProvider>
      <AnalyzerProvider>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-border/60 bg-card shadow-sm">
            <div className="container py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart2 className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">Chart Vision AI Analyzer</h1>
              </div>
              <div className="text-sm text-muted-foreground">
                Pattern Recognition Technology
              </div>
            </div>
          </header>
          
          <main className="flex-1 container py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-3">
                Analyze Financial Charts with AI
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Capture images of financial charts and let our AI detect trading patterns, 
                support/resistance levels, and trend indicators automatically.
              </p>
            </div>
            
            <GraphAnalyzer />
          </main>
          
          <footer className="py-6 border-t border-border/60">
            <div className="container text-center text-sm text-muted-foreground">
              <p>Chart Vision AI Analyzer &copy; {new Date().getFullYear()}</p>
              <p className="mt-1">Advanced pattern recognition for financial charts</p>
            </div>
          </footer>
        </div>
      </AnalyzerProvider>
    </LanguageProvider>
  );
};

export default Index;
