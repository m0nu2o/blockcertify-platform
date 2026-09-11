"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { FontName, fonts } from '@/lib/themes';

type FontContextType = {
  font: FontName;
  setFont: (font: FontName) => void;
};

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = useState<FontName>('inter');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedFont = localStorage.getItem('blockcertify-font') as FontName;
    if (savedFont && fonts.some((f) => f.name === savedFont)) {
      setFontState(savedFont);
    }
  }, []);

  const setFont = (newFont: FontName) => {
    setFontState(newFont);
    localStorage.setItem('blockcertify-font', newFont);
  };

  const activeFont = fonts.find((f) => f.name === font);
  
  useEffect(() => {
    if (!mounted || !activeFont) return;
    document.body.style.setProperty('--font-sans', `var(${activeFont.variable})`);
  }, [mounted, activeFont]);

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  );
}

export const useFont = () => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};
