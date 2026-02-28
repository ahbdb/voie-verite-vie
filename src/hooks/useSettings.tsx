import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type TextSize = 'small' | 'normal' | 'large' | 'extra-large';

interface Settings {
  theme: Theme;
  textSize: TextSize;
}

interface SettingsContextType {
  settings: Settings;
  setTheme: (theme: Theme) => void;
  setTextSize: (size: TextSize) => void;
  isDarkMode: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  textSize: 'normal',
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Charger depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Settings;
        setSettings(parsed);
      } catch (e) {
        console.warn('Erreur parsing settings', e);
      }
    }

    // Détecter mode sombre système
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    updateDarkMode(saved ? JSON.parse(saved).theme : 'system', prefersDark);
  }, []);

  // Listener pour changements mode système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      updateDarkMode(settings.theme, e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  const updateDarkMode = (theme: Theme, systemDark: boolean) => {
    const shouldBeDark = theme === 'dark' || (theme === 'system' && systemDark);
    setIsDarkMode(shouldBeDark);
    applyTheme(shouldBeDark);
  };

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setTheme = (theme: Theme) => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    updateDarkMode(theme, prefersDark);
    const updated = { ...settings, theme };
    setSettings(updated);
    localStorage.setItem('app-settings', JSON.stringify(updated));
  };

  const setTextSize = (size: TextSize) => {
    const updated = { ...settings, textSize: size };
    setSettings(updated);
    localStorage.setItem('app-settings', JSON.stringify(updated));
    applyTextSize(size);
  };

  const applyTextSize = (size: TextSize) => {
    const root = document.documentElement;
    const scales: Record<TextSize, number> = {
      'small': 0.9,
      'normal': 1,
      'large': 1.15,
      'extra-large': 1.3,
    };
    root.style.setProperty('--text-scale', String(scales[size]));
  };

  // Appliquer la taille au montage
  useEffect(() => {
    applyTextSize(settings.textSize);
  }, [settings.textSize]);

  return (
    <SettingsContext.Provider value={{ settings, setTheme, setTextSize, isDarkMode }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return ctx;
};
