import React, { createContext, useContext, useState } from 'react';

interface DebugContextType {
  deck: string;
  setDeck: (v: string) => void;
  errorLog: string;
  setErrorLog: (v: string) => void;
  deckSource: 'custom' | 'example';
  setDeckSource: (v: 'custom' | 'example') => void;
  errorSource: 'custom' | 'example';
  setErrorSource: (v: 'custom' | 'example') => void;
  clearDebug: () => void;
}

const DebugContext = createContext<DebugContextType | null>(null);

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [deck, setDeck] = useState('');
  const [errorLog, setErrorLog] = useState('');
  const [deckSource, setDeckSource] = useState<'custom' | 'example'>('custom');
  const [errorSource, setErrorSource] = useState<'custom' | 'example'>('custom');

  const clearDebug = () => {
    setDeck('');
    setErrorLog('');
    setDeckSource('custom');
    setErrorSource('custom');
  };

  return (
    <DebugContext.Provider value={{
      deck, setDeck,
      errorLog, setErrorLog,
      deckSource, setDeckSource,
      errorSource, setErrorSource,
      clearDebug,
    }}>
      {children}
    </DebugContext.Provider>
  );
}

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (!context) {
    //if (process.env.NODE_ENV === 'development') {
    //  throw new Error('useDebug must be used within a DebugProvider. Check your App.tsx wrapper.');
    //}
    console.error('useDebug: DebugProvider missing from tree.');
    return {} as DebugContextType;
  }
  return context;
};