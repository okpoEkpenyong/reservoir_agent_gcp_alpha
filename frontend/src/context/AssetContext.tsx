import React, { createContext, useContext, useState } from 'react';

export interface WellRecord {
  well_name: string;
  field: string;
  oil_rates: number[];
}

export interface WellResult {
  well_name: string;
  field?: string;
  qi_stbd: number;
  di_per_yr: number;
  b_factor: number;
  eur_mmstb: number;
  current_rate_stbd?: number;
}

interface AssetContextType {
  wellRecords: WellRecord[];
  setWellRecords: (r: WellRecord[]) => void;
  results: { dca_results: { total_eur_mmstb: number; b_flag_count: number; well_results: WellResult[] }; session_id?: string } | null;
  setResults: (r: AssetContextType['results']) => void;
  sourceMode: 'upload' | 'demo';
  setSourceMode: (m: 'upload' | 'demo') => void;
  econLimit: number;
  setEconLimit: (v: number) => void;
  abandonmentBuffer: number;
  setAbandonmentBuffer: (v: number) => void;
  forecastHorizon: number;
  setForecastHorizon: (v: number) => void;
  clearAsset: () => void;
}

const AssetContext = createContext<AssetContextType | null>(null);

export function AssetProvider({ children }: { children: React.ReactNode }) {
  const [wellRecords, setWellRecords] = useState<WellRecord[]>([]);
  const [results, setResults] = useState<AssetContextType['results']>(null);
  const [sourceMode, setSourceMode] = useState<'upload' | 'demo'>('upload');
  const [econLimit, setEconLimit] = useState(50);
  const [abandonmentBuffer, setAbandonmentBuffer] = useState(1.5);
  const [forecastHorizon, setForecastHorizon] = useState(20);
  //const [error, setError] = useState<string | null>(null);
  //const [isAnalyzing, setIsAnalyzing] = useState(false);
  //const [isUploading, setIsUploading] = useState(false);

  const clearAsset = () => {
    setWellRecords([]);
    setResults(null);
    setSourceMode('upload');
    setEconLimit(50);
    setAbandonmentBuffer(1.5);
    setForecastHorizon(20);
  };


  return (
    <AssetContext.Provider value={{
      wellRecords, setWellRecords,
      results, setResults,
      sourceMode, setSourceMode,
      econLimit, setEconLimit,
      abandonmentBuffer, setAbandonmentBuffer,
      forecastHorizon, setForecastHorizon,
      clearAsset,
    }}>
      {children}
    </AssetContext.Provider>
  );
}

export const useAsset = () => {
  const context = useContext(AssetContext);
  if (!context) throw new Error('useAsset must be used within an AssetProvider');
  return context;
};