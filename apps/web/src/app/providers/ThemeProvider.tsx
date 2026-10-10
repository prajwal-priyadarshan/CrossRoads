import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { storage } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/storageKeys';

export type Theme = 'light' | 'dark' | 'system';
const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: 'system', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (storage.get(STORAGE_KEYS.theme) as Theme) ?? 'system');

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', dark);
    };
    apply();
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  const setTheme = (t: Theme) => {
    storage.set(STORAGE_KEYS.theme, t);
    setThemeState(t);
  };
  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
