
/**
 * Validador para garantir que apenas dados REAIS são processados
 * Remove qualquer risco de dados simulados ou falsos
 */

export const validateRealData = (data: any, source: string): boolean => {
  console.log(`🔍 Validating REAL data from ${source}:`, data);

  // Verificar se os dados contêm marcadores de simulação
  if (typeof data === 'object' && data !== null) {
    const dataStr = JSON.stringify(data).toLowerCase();
    
    // Flags que indicam dados simulados
    const simulatedFlags = [
      'mock', 'fake', 'simulated', 'test', 'dummy',
      'example', 'sample', 'placeholder'
    ];

    for (const flag of simulatedFlags) {
      if (dataStr.includes(flag)) {
        console.warn(`⚠️ SIMULATED DATA DETECTED in ${source}:`, flag);
        return false;
      }
    }
  }

  // Verificar se há timestamp real recente (últimos 10 minutos)
  if (data?.timestamp) {
    const now = Date.now();
    const dataAge = now - data.timestamp;
    const tenMinutes = 10 * 60 * 1000;
    
    if (dataAge > tenMinutes) {
      console.warn(`⚠️ OLD DATA DETECTED in ${source}: ${dataAge}ms old`);
      return false;
    }
  }

  console.log(`✅ REAL data validated for ${source}`);
  return true;
};

export const ensureRealAnalysis = (analysisData: any): any => {
  if (!validateRealData(analysisData, 'analysis')) {
    console.log('❌ Rejecting non-real analysis data');
    return null;
  }

  // Adicionar timestamp atual para garantir freshness
  return {
    ...analysisData,
    realDataVerified: true,
    verificationTimestamp: Date.now()
  };
};
