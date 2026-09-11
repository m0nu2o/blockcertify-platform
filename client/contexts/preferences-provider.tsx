'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type PreferencesContextType = {
  compactMode: boolean;
  setCompactMode: (val: boolean) => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('blockcertify-compact');
    if (saved) {
      setCompactMode(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('blockcertify-compact', JSON.stringify(compactMode));
    if (compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }, [compactMode]);

  return (
    <PreferencesContext.Provider value={{ compactMode, setCompactMode }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
