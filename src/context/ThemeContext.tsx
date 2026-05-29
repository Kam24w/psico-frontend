import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type ThemeType = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('dark');

  // Aplicar el tema al root del documento (html)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Cargar preferencia guardada localmente como fallback rápido
  useEffect(() => {
    const savedTheme = localStorage.getItem('psico_theme') as ThemeType;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const handleSetTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    localStorage.setItem('psico_theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
}
